// @vitest-environment node
//
// A server module, run where it actually runs. Under jsdom `window` exists and
// /server quite rightly warns that it was imported into browser code, which is
// a different warning from the one under test.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A Next application that was never given its three values should say so.
 *
 * It did not. `settings()` returned null, `readContent` resolved to an empty
 * object, every component fell back to the words written in it, and the page
 * looked deliberate. The overlay applies published content after hydration, so
 * the person who owns the site sees their own copy and has no reason to
 * suspect anything. Only the server HTML is wrong, which is to say only
 * crawlers and first paint are wrong, and they are the audience marketing copy
 * exists for.
 *
 * The identical fault in the PHP package took four releases and about thirty
 * messages to locate. One console line would have ended it on the first
 * afternoon, so these tests are about that line existing and naming the right
 * variable.
 *
 * Imported fresh in each test, because the warning is deliberately once per
 * process and a module cached between tests would only ever warn in the first.
 */
const freshly = async () => {
    vi.resetModules();

    return import('../../packages/react/src/server.js');
};

let env;

beforeEach(() => {
    env = { ...process.env };

    for (const name of Object.keys(process.env)) {
        if (name.startsWith('LIVE_EDIT_')) {
            delete process.env[name];
        }
    }

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => {
        throw new Error('nothing should be fetched by an unconfigured install');
    }));
});

afterEach(() => {
    process.env = env;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('an install that was never configured', () => {
    it('names the value that is missing rather than failing silently', async () => {
        process.env.LIVE_EDIT_SITE_ID = 'acme';
        process.env.LIVE_EDIT_HOST = 'https://live.tryshipfast.com';

        const { readContent } = await freshly();

        await expect(readContent()).resolves.toEqual({});

        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn.mock.calls[0][0]).toContain('LIVE_EDIT_APP_KEY');

        // And names only what is actually absent. A warning that lists three
        // variables when one is missing sends somebody checking the two that
        // were already right.
        expect(console.warn.mock.calls[0][0]).not.toContain('LIVE_EDIT_SITE_ID');
        expect(console.warn.mock.calls[0][0]).not.toContain('LIVE_EDIT_HOST');
    });

    it('says who is affected, because the owner cannot see it', async () => {
        const { readContent } = await freshly();

        await readContent();

        expect(console.warn.mock.calls[0][0]).toContain('crawlers');
    });

    it('complains once rather than once per render', async () => {
        const { readContent } = await freshly();

        await readContent();
        await readContent();
        await readContent();

        expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('never asks the network when it has nothing to ask with', async () => {
        const { readContent } = await freshly();

        await readContent();

        expect(fetch).not.toHaveBeenCalled();
    });
});

describe('the names a site is actually given', () => {
    /*
     * This package read LIVE_EDIT_SITE, LIVE_EDIT_API_BASE and LIVE_EDIT_KEY,
     * while the documented three values are LIVE_EDIT_HOST, LIVE_EDIT_SITE_ID
     * and LIVE_EDIT_APP_KEY. A developer who followed the install instructions
     * set three variables this file ignored. Two packages reading different
     * names for one value is a trap we laid ourselves.
     */
    const itReads = async (vars) => {
        Object.assign(process.env, vars);

        const { readContent } = await freshly();

        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => ({ settings: { 'auto:a': 'theirs' } }),
        })));

        const content = await readContent();

        return { content, url: fetch.mock.calls[0]?.[0] ?? '', init: fetch.mock.calls[0]?.[1] ?? {} };
    };

    it('reads the documented spellings', async () => {
        const { content, url, init } = await itReads({
            LIVE_EDIT_SITE_ID: 'acme',
            LIVE_EDIT_HOST: 'https://live.tryshipfast.com',
            LIVE_EDIT_APP_KEY: 'kbp_documented',
        });

        expect(content).toEqual({ 'auto:a': 'theirs' });
        expect(url).toContain('/api/live-edit/v1/acme/content');
        expect(init.headers.Authorization).toBe('Bearer kbp_documented');
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('still reads the older spellings, so no working install breaks', async () => {
        // The positive control for the change above. Accepting new names at
        // the cost of the ones already in people's deployments would be a
        // worse bug than the one being fixed.
        const { content, url } = await itReads({
            LIVE_EDIT_SITE: 'acme',
            LIVE_EDIT_API_BASE: 'https://cms.example.com/api/v1',
            LIVE_EDIT_KEY: 'pk_old',
        });

        expect(content).toEqual({ 'auto:a': 'theirs' });
        expect(url).toContain('https://cms.example.com/api/v1/acme/content');
    });

    it('appends the api path to a bare host rather than asking the developer to', async () => {
        const { url } = await itReads({
            LIVE_EDIT_SITE_ID: 'acme',
            LIVE_EDIT_HOST: 'https://live.tryshipfast.com/',
            LIVE_EDIT_APP_KEY: 'kbp_documented',
        });

        expect(url).toContain('https://live.tryshipfast.com/api/live-edit/v1/acme/content');
        expect(url).not.toContain('//api');
    });
});
