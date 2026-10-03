import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WAITS_AT_MOST, createClient } from '../../packages/react/src/client.js';

/**
 * Two faults reported against the published 0.13.5, both measured, both real.
 *
 * "No AbortSignal or AbortController anywhere in the source." Correct. Every
 * read and every write in this package goes through one call, and that call
 * had no limit on it. In a browser that is a button that never comes back. On
 * a server-rendered page it is worse: the render never finishes, the visitor
 * waits on whatever the host's own timeout turns out to be, and under load the
 * worker pool fills with requests waiting on us. An editing tool must not be
 * able to take somebody's website off the internet.
 *
 * And: a page rendered statically bakes whatever its content call returned at
 * build time, so a published edit does not appear until the next deploy. The
 * framework's default is not a safe thing to inherit here - Next cached
 * fetches by default in 14 and stopped in 15 - and the failure it produces is
 * silent. The editor shows the new words, the live page keeps the old ones,
 * nothing reports a problem. For a product whose purpose is publishing an
 * edit, that is the feature not working.
 */
const answersWith = (body) => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => body,
});

describe('a page that waits forever', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answersWith({ settings: {} })));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('gives every call a limit', async () => {
        const client = createClient({ apiBase: 'https://live.example.com/api/v1', site: 'acme', key: 'kbp_x' });
        await client.read(null);

        expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });

    it('limits a write as well as a read', async () => {
        // A save that hangs is the one somebody is watching.
        const client = createClient({ apiBase: 'https://live.example.com/api/v1', site: 'acme', key: 'kbp_x' });
        await client.write('hero', 'New words', null);

        expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });

    it('lets a caller set its own patience', async () => {
        // A build fetching every page is not a visitor waiting on one.
        const client = createClient({ apiBase: 'https://x/api', site: 'acme', key: 'kbp_x', timeout: 250 });
        await client.read(null);

        expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
        expect(WAITS_AT_MOST).toBeGreaterThan(250);
    });

    it('reports a timeout as a timeout rather than as "aborted"', async () => {
        /*
         * A host whose own page is slow has to be able to tell our call apart
         * from their code. "The operation was aborted" names neither.
         */
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
            Object.assign(new Error('signal timed out'), { name: 'TimeoutError' })
        ));
        const client = createClient({ apiBase: 'https://x/api', site: 'acme', key: 'kbp_x', timeout: 10 });

        await expect(client.read(null)).rejects.toMatchObject({ timedOut: true, status: 408 });
    });

    it('does not swallow a real refusal as a timeout', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 402,
            headers: { get: () => 'application/json' },
            json: async () => ({ error: { message: 'That page is not on your plan.' } }),
        }));
        const client = createClient({ apiBase: 'https://x/api', site: 'acme', key: 'kbp_x' });

        await expect(client.read(null)).rejects.toMatchObject({ status: 402 });
    });
});

describe('an edit that shows up on the live page', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answersWith({ settings: { hero: 'Edited' } })));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const read = async (options) => {
        const { readContent } = await import('../../packages/react/src/server.js');

        return readContent({ site: 'acme', apiBase: 'https://x/api', key: 'kbp_x', ...options });
    };

    it('gives the page a revalidation period without it having to ask', async () => {
        /*
         * The whole fix for the baked-content trap, and it works because in
         * the App Router a route's revalidation is the lowest of its fetches'.
         * Set here, every page that reads content regenerates - with no line
         * added to any of the twenty-seven routes a codemod touched, and no
         * chance of the twenty-eighth being forgotten.
         */
        await read({});

        expect(fetch.mock.calls[0][1].next).toEqual({ revalidate: 60 });
        expect(fetch.mock.calls[0][1].cache).toBeUndefined();
    });

    it('does not quietly turn a static site into a dynamic one', async () => {
        /*
         * Measured on the install this came from: marketing pages static,
         * TTFB about 5ms, no per-request upstream fetch. Defaulting to
         * no-store would have taken all of that away to fix a staleness
         * nobody had asked about, which is not a trade a dependency gets to
         * make on somebody's behalf.
         */
        await read({});

        expect(fetch.mock.calls[0][1].cache).toBeUndefined();
    });

    it('lets a site that wants exact HTML pay for it', async () => {
        await read({ revalidate: false });

        expect(fetch.mock.calls[0][1].cache).toBe('no-store');
    });

    it('takes a period a site names instead', async () => {
        await read({ revalidate: 300 });

        expect(fetch.mock.calls[0][1].next).toEqual({ revalidate: 300 });
    });

    it('takes an outright cache mode when neither default suits', async () => {
        await read({ cache: 'force-cache' });

        expect(fetch.mock.calls[0][1].cache).toBe('force-cache');
    });

    it('still renders the words in the template when the service is down', async () => {
        /*
         * The rule this package is built around, and the reason the timeout
         * above is safe to add: a content service that is slow, down or not
         * set up yet must never take somebody's website with it.
         */
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
            Object.assign(new Error('signal timed out'), { name: 'TimeoutError' })
        ));

        await expect(read({})).resolves.toEqual({});
    });
});
