import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureLiveEdit, contentKeyFor, liveEditWords, readContent } from '../../packages/react/src/server.js';

/**
 * Content on the server, where most of an App Router page actually renders.
 *
 * The gap these cover was found by running the codemod over a real Next
 * application rather than an example: seven server files, one client file, and
 * the seven got a marker with nothing behind it. The tests here are the half
 * that was missing, so a server component's marker resolves to a real value.
 *
 * Every one of them cares about what happens when the content service is not
 * there, because that is the case a customer's visitors see and the case that
 * has already cost this project a live site.
 */

const replies = [];

const respond = (body, { status = 200, json = true } = {}) =>
    replies.push({
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (h) => (h.toLowerCase() === 'content-type' ? (json ? 'application/json' : 'text/html') : null) },
        json: async () => body,
    });

beforeEach(() => {
    replies.length = 0;
    configureLiveEdit({ site: 'acme', apiBase: 'https://cms.example.com/api/v1', key: 'pk_test' });
    vi.stubGlobal('fetch', vi.fn(async () => replies.shift() ?? Promise.reject(new Error('no reply queued'))));
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    configureLiveEdit(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('reading content on the server', () => {
    it('reads the same field the provider reads, so the two cannot disagree', async () => {
        respond({ settings: { 'auto:1a2b3c': "The client's words" }, styles: {}, version: 4 });

        expect(await readContent()).toEqual({ 'auto:1a2b3c': "The client's words" });
    });

    it('sends the key, because content behind a site key is not public', async () => {
        respond({ settings: {} });
        await readContent();

        const [url, options] = fetch.mock.calls[0];

        expect(url).toContain('/acme/content');
        expect(options.headers.Authorization).toBe('Bearer pk_test');
    });

    it('renders the words in the template when the service is down', async () => {
        respond({ error: { message: 'gone' } }, { status: 503 });

        const words = await liveEditWords();

        expect(words('auto:1a2b3c', 'Original words')).toBe('Original words');
    });

    it('renders the words in the template when nothing is configured at all', async () => {
        configureLiveEdit(null);
        const words = await liveEditWords();

        expect(words('auto:1a2b3c', 'Original words')).toBe('Original words');
        expect(fetch).not.toHaveBeenCalled();
    });

    it('renders the words in the template when the API answers with a login page', async () => {
        respond('<!doctype html>', { json: false });

        expect(await readContent()).toEqual({});
    });

    it('never lets a shape it did not expect blank a website', async () => {
        for (const body of [null, { settings: null }, { settings: ['a'] }, { settings: 'words' }]) {
            respond(body);
            expect(await readContent()).toEqual({});
        }
    });
});

describe('the lookup a server component renders through', () => {
    it("keeps an edit that cleared a field, and does not resurrect the template's copy", async () => {
        respond({ settings: { 'auto:1a2b3c': '' } });

        const words = await liveEditWords();

        expect(words('auto:1a2b3c', 'Original words')).toBe('');
    });

    it('falls back for a key nobody has edited', async () => {
        respond({ settings: { 'auto:other': 'edited' } });

        const words = await liveEditWords();

        expect(words('auto:1a2b3c', 'Original words')).toBe('Original words');
    });

    it('never serves one request the content fetched for another', async () => {
        respond({ settings: { 'auto:1a2b3c': 'What the first visitor saw' } });
        expect((await liveEditWords())('auto:1a2b3c', 'Original')).toBe('What the first visitor saw');

        respond({ settings: { 'auto:1a2b3c': 'Edited since' } });
        expect((await liveEditWords())('auto:1a2b3c', 'Original')).toBe('Edited since');
    });

    it('resolves a row of a list, whose key is composed by a plain function', async () => {
        respond({ settings: { 'posts.title@101': 'Edited headline' } });

        const words = await liveEditWords();
        const key = contentKeyFor('posts', 'title', { id: 101, title: 'Original headline' });

        expect(words(key, 'Original headline')).toBe('Edited headline');
    });
});
