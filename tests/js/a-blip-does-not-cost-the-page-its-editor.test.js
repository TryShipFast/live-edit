import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { autoTag } from '../../resources/js/autotag.js';

/**
 * One failed request must not leave a page with nothing editable on it.
 *
 * Measured against a live site: roughly one tagging request in six came back
 * 503, reproducible from curl, so nothing about any one browser. What the
 * person sees when it happens is a page with no outlines, no panel and nothing
 * to click - the words are all still there and the site is fine, so it reads
 * as the product having quietly stopped working. Reloading fixes it, which is
 * the most confusing behaviour available.
 *
 * The content applier beside this has retried its fetches since it was
 * written. This one never did, and it is the request that decides whether
 * there is anything to edit at all.
 *
 * The other half matters as much: a key that is refused must not be tried
 * again. A wrong key does not improve by being asked three times, and
 * hammering a rejected one is how a site gets itself throttled.
 */
const page = () => {
    document.body.innerHTML = '<h1>Our work</h1><p>We build things.</p>';

    return document;
};

const config = { base: 'https://live.example.com/api/live-edit/v1', site: 'acme', key: 'kbp_x', page: '/' };

const answers = (status, body = { elements: [] }) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
});

beforeEach(() => {
    window.sessionStorage?.clear();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('a blip does not cost the page its editor', () => {
    it('asks again when the service falls over, and tags the page', async () => {
        const tags = { elements: [{ at: [1, 0], attributes: { 'data-edit': 'setting:auto:h1' } }] };
        const fetch = vi.fn()
            .mockResolvedValueOnce(answers(503))
            .mockResolvedValueOnce(answers(200, tags));

        vi.stubGlobal('fetch', fetch);

        const applied = await autoTag(config, page());

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(applied).toBe(1);
    });

    it('survives a connection that never arrives', async () => {
        // No status at all, which is what a dropped request looks like from
        // inside the page - and is indistinguishable there from a blocked one.
        const fetch = vi.fn()
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValueOnce(answers(200, { elements: [] }));

        vi.stubGlobal('fetch', fetch);

        await autoTag(config, page());

        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('does not ask again when the key is refused', async () => {
        /*
         * A 401 is a wrong key and a 404 is a wrong address. Neither improves
         * by being asked twice, and trying anyway is how a site earns itself a
         * throttle on top of whatever was already wrong.
         */
        const fetch = vi.fn().mockResolvedValue(answers(401));

        vi.stubGlobal('fetch', fetch);

        await expect(autoTag(config, page())).rejects.toThrow(/401/);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('gives up rather than asking forever', async () => {
        // A service that is properly down should cost a page three requests,
        // not a loop. The failure is still reported; it is just not infinite.
        const fetch = vi.fn().mockResolvedValue(answers(503));

        vi.stubGlobal('fetch', fetch);

        await expect(autoTag(config, page())).rejects.toThrow(/503/);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('sends the same markup each time rather than rebuilding it', async () => {
        /*
         * The body is a third of a megabyte of a real page. Rebuilding it per
         * attempt to send identical bytes is its own small cruelty, and on a
         * slow machine it is the retry costing more than the request.
         */
        const fetch = vi.fn()
            .mockResolvedValueOnce(answers(503))
            .mockResolvedValueOnce(answers(200, { elements: [] }));

        vi.stubGlobal('fetch', fetch);

        await autoTag(config, page());

        expect(fetch.mock.calls[0][1].body).toBe(fetch.mock.calls[1][1].body);
    });
});
