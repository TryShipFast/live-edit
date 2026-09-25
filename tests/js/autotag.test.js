import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTags, autoTag, elementAt, fingerprint, resolveBackgrounds } from '../../resources/js/autotag.js';

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

describe('the pictures only a browser can see', () => {
    beforeEach(() => window.sessionStorage?.clear());

    // The real thing, from a real install: Elementor's generated stylesheet,
    // its compound :not() selector, and an element carrying no style at all.
    const elementorHero = `<head><style>
        .elementor-16 .elementor-element.elementor-element-20e6f5a:not(.elementor-motion-effects-element-type-background)
            { background-image: url("http://site.test/uploads/hero-section-min.jpg"); background-size: cover; }
    </style></head><body class="elementor-16">
        <div class="elementor-element elementor-element-20e6f5a" data-id="20e6f5a"></div>
    </body>`;

    it('writes down a background the markup never mentioned', () => {
        // The hero: biggest picture on the page, first thing a client would
        // change, and nowhere in the markup for the scanner to find.
        const doc = page(elementorHero);

        expect(resolveBackgrounds(doc)).toBe(1);
        expect(doc.querySelector('[data-id="20e6f5a"]').getAttribute('data-kb-bg'))
            .toBe('http://site.test/uploads/hero-section-min.jpg');
    });

    it('leaves alone anything the scanner can already read', () => {
        // The markup stays the source of truth wherever it has an answer, so
        // a lazy-loading theme's own attribute is never second-guessed.
        const doc = page(`<body>
            <div data-bg="/theme-says.jpg"></div>
            <div style="background-image:url('/inline-says.jpg')"></div>
        </body>`);

        resolveBackgrounds(doc);

        expect(doc.querySelectorAll('[data-kb-bg]').length).toBe(0);
    });

    it('ignores a gradient, which is not a picture anybody replaces', () => {
        const doc = page(`<head><style>.overlay { background-image: linear-gradient(180deg, #000, #fff); }</style></head>
            <body><div class="overlay"></div></body>`);

        resolveBackgrounds(doc);

        expect(doc.querySelectorAll('[data-kb-bg]').length).toBe(0);
    });

    it('ignores a picture already spelled out in the page', () => {
        // A data: URI is in the markup already, and sending it back to be
        // scanned means posting it in full, a few hundred kilobytes at a time.
        const doc = page(`<head><style>.icon { background-image: url("data:image/gif;base64,R0lGOD"); }</style></head>
            <body><div class="icon"></div></body>`);

        resolveBackgrounds(doc);

        expect(doc.querySelectorAll('[data-kb-bg]').length).toBe(0);
    });

    it('still finds them on a page the server already tagged', async () => {
        // A server tags from markup, and a builder's backgrounds are not in
        // the markup. On a real WordPress install the plugin tagged 107 pieces
        // of text and none of the pictures the theme draws from CSS — the hero
        // among them. "Already prepared" has to mean prepared for the things a
        // server could see, not for everything.
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                elements: [{ at: [1, 0], attributes: { 'data-edit-bg': 'setting:auto:hero' } }],
            }),
        }));

        const doc = page(`<head><style>.hero{background-image:url("/hero.jpg")}</style></head>
            <body><div class="hero"><h1 data-edit="setting:auto:already">Tagged by the server</h1></div></body>`);

        expect(await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, doc)).toBe(1);
        expect(globalThis.fetch).toHaveBeenCalled();
        expect(doc.querySelector('.hero').getAttribute('data-kb-bg')).toBe('/hero.jpg');
    });

    it('does not pay for an answer when a prepared page has nothing new', async () => {
        // The common case by far: every view of an already-tagged page with no
        // CSS backgrounds on it must cost nothing.
        globalThis.fetch = vi.fn();
        const doc = page('<body><h1 data-edit="setting:auto:already">Tagged</h1></body>');

        expect(await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, doc)).toBe(0);
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('leaves a key the page already had exactly where it was', async () => {
        // The whole reason asking again is safe. A client's saved work hangs
        // off these keys; re-tagging must never move one.
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                elements: [{ at: [1, 0, 0], attributes: { 'data-edit': 'setting:auto:different' } }],
            }),
        }));

        const doc = page(`<head><style>.hero{background-image:url("/hero.jpg")}</style></head>
            <body><div class="hero"><h1 data-edit="setting:auto:already">Tagged by the server</h1></div></body>`);

        await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, doc);

        expect(doc.querySelector('h1').getAttribute('data-edit')).toBe('setting:auto:already');
    });

    it('marks the backgrounds before asking what is editable', async () => {
        // If this ran after the markup was taken, the server would be asked
        // about a page that still had no backgrounds in it — and the answer
        // would be cached against that version for as long as the page stood.
        globalThis.fetch = vi.fn((url, init) => {
            const { html } = JSON.parse(init.body);

            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ elements: [], sawBackground: html.includes('data-kb-bg') }),
            });
        });

        await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, page(elementorHero));

        const sent = JSON.parse(globalThis.fetch.mock.calls[0][1].body).html;
        expect(sent).toContain('data-kb-bg="http://site.test/uploads/hero-section-min.jpg"');
    });
});
