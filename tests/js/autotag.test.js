import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTags, autoTag, elementAt, fingerprint } from '../../resources/js/autotag.js';

const page = (html) => {
    document.documentElement.innerHTML = html;
    return document;
};

describe('tagging a page nobody prepared', () => {
    // Answers are remembered against a fingerprint of the markup, so cases
    // using the same markup would otherwise inherit each other's answers.
    beforeEach(() => window.sessionStorage?.clear());

    it('finds an element by the position it was given', () => {
        // Positions rather than selectors: the server computed them from the
        // very markup this page sent, so the two agree by construction.
        const doc = page('<body><div><p>one</p><h1>two</h1></div></body>');

        expect(elementAt(doc, [0, 0, 1]).tagName).toBe('H1');
    });

    it('marks what it was told to mark', () => {
        const doc = page('<body><h1>Hello</h1></body>');

        const applied = applyTags(doc, [{ at: [0, 0], attributes: { 'data-edit': 'setting:auto:abc' } }]);

        expect(applied).toBe(1);
        expect(doc.querySelector('h1').getAttribute('data-edit')).toBe('setting:auto:abc');
    });

    it('never overwrites a marker the page already had', () => {
        // A site prepared properly keeps the keys it shipped with, so a
        // client's saved words stay attached to them.
        const doc = page('<body><h1 data-edit="setting:auto:original">Hello</h1></body>');

        applyTags(doc, [{ at: [0, 0], attributes: { 'data-edit': 'setting:auto:different' } }]);

        expect(doc.querySelector('h1').getAttribute('data-edit')).toBe('setting:auto:original');
    });

    it('survives a position that no longer exists', () => {
        const doc = page('<body><h1>Hello</h1></body>');

        expect(applyTags(doc, [{ at: [0, 9, 9], attributes: { 'data-edit': 'x' } }])).toBe(0);
    });

    it('does not ask about a page that is already prepared', async () => {
        // Built by a framework, tagged by the CLI, or sold ready.
        globalThis.fetch = vi.fn();
        const doc = page('<body><h1 data-edit="setting:auto:abc">Hi</h1></body>');

        expect(await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, doc)).toBe(0);
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('keeps working from what it remembered when the service is unreachable', async () => {
        // A cached answer is better than a bare page: the words are already
        // in the markup, and the markers were right the last time.
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ elements: [{ at: [0, 0], attributes: { 'data-edit': 'setting:auto:abc' } }] }),
        }));
        await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, page('<body><h2>Cached</h2></body>'));

        globalThis.fetch = vi.fn(() => Promise.reject(new Error('offline')));

        expect(await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, page('<body><h2>Cached</h2></body>'))).toBe(1);
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('asks once, and remembers the answer', async () => {
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ elements: [{ at: [0, 0], attributes: { 'data-edit': 'setting:auto:abc' } }] }),
        }));

        const doc = page('<body><h1>Hello</h1></body>');
        expect(await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, doc)).toBe(1);

        // Same markup again — it must not pay for the same answer twice.
        const again = page('<body><h1>Hello</h1></body>');
        await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, again);

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('asks again when the page has changed', async () => {
        // A redeploy should be noticed; an unchanged page should not be.
        expect(fingerprint('<h1>a</h1>')).not.toBe(fingerprint('<h1>b</h1>'));
        expect(fingerprint('<h1>a</h1>')).toBe(fingerprint('<h1>a</h1>'));
    });

    it('says so rather than silently leaving the page bare', async () => {
        globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 429 }));
        const doc = page('<body><h1>Hello</h1></body>');

        await expect(autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, doc)).rejects.toThrow('429');
    });
});
