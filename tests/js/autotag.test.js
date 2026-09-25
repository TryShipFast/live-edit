import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTags, autoTag, elementAt, fingerprint, resolveBackgrounds, watchForLateBackgrounds, ensureBackgroundsAreFound, refreshBackgrounds } from '../../resources/js/autotag.js';

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

    it('asks again for a picture it wrote down but never got a key for', async () => {
        // The late-background case from the other side. Counting what a pass
        // FOUND would say nothing changed, because the watcher already wrote
        // the attribute down before asking — so the question has to be
        // "is anything still unanswered", not "did I just find something".
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ elements: [] }),
        }));

        const doc = page('<body><h1 data-edit="setting:auto:already">Tagged</h1>'
            + '<div data-kb-bg="/found-later.jpg"></div></body>');

        await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, doc);

        expect(globalThis.fetch).toHaveBeenCalled();
    });

    it('stops asking once every picture has a key', async () => {
        globalThis.fetch = vi.fn();
        const doc = page('<body><h1 data-edit="setting:auto:already">Tagged</h1>'
            + '<div data-kb-bg="/hero.jpg" data-edit-bg="setting:auto:hero"></div></body>');

        expect(await autoTag({ base: 'https://cms.test', site: 'a', key: 'k' }, doc)).toBe(0);
        expect(globalThis.fetch).not.toHaveBeenCalled();
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

describe('a background that only appears when you scroll to it', () => {
    beforeEach(() => window.sessionStorage?.clear());

    /**
     * A stand-in for the browser's own observer, so a test can say "this
     * element just came into view" without a viewport.
     */
    const withFakeObserver = () => {
        const watched = [];
        let notify = null;

        window.IntersectionObserver = class {
            constructor(callback) {
                notify = callback;
                this.callback = callback;
            }

            observe(el) { watched.push(el); }

            unobserve(el) {
                const i = watched.indexOf(el);
                if (i >= 0) watched.splice(i, 1);
            }

            disconnect() { watched.length = 0; }
        };

        return {
            watched,
            scrollTo: (el) => notify([{ target: el, isIntersecting: true }]),
        };
    };

    it('finds the picture that was not there when the page loaded', async () => {
        // Measured on a real Elementor page: five CSS backgrounds, one of
        // which read as "none" from the top of the document because the
        // builder had not loaded it yet. A full-width banner, plainly on the
        // page, that the editor simply did not offer.
        // How a builder actually does it: a stylesheet rule that starts
        // matching once its own script marks the section as loaded. An inline
        // style would be the wrong test — the server can read those from the
        // markup we post, which is why they are deliberately skipped.
        const doc = page('<head><style>.e-loaded { background-image: url("/banner.jpg"); }</style></head>'
            + '<body><div id="late"></div></body>');
        const late = doc.querySelector('#late');

        const observer = withFakeObserver();
        const found = [];
        watchForLateBackgrounds(doc, (batch) => found.push(...batch));

        expect(observer.watched).toContain(late);
        expect(late.hasAttribute('data-kb-bg')).toBe(false);

        // The builder loads it as the section arrives.
        late.classList.add('e-loaded');
        observer.scrollTo(late);

        await new Promise((r) => setTimeout(r, 400));

        expect(late.getAttribute('data-kb-bg')).toBe('/banner.jpg');
        expect(found).toContain(late);
    });

    it('hands back a whole scroll of them at once, not one at a time', async () => {
        // Scrolling a long page crosses many sections. Re-tagging per section
        // would be one request per section, on somebody's own website.
        const doc = page('<head><style>.e-loaded { background-image: url("/section.jpg"); }</style></head>'
            + '<body><div id="a"></div><div id="b"></div><div id="c"></div></body>');
        const observer = withFakeObserver();
        const batches = [];
        watchForLateBackgrounds(doc, (batch) => batches.push(batch));

        ['#a', '#b', '#c'].forEach((id) => {
            const el = doc.querySelector(id);
            el.classList.add('e-loaded');
            observer.scrollTo(el);
        });

        await new Promise((r) => setTimeout(r, 400));

        expect(batches.length).toBe(1);
        expect(batches[0].length).toBe(3);
    });

    it('says nothing when a section comes into view with no picture in it', async () => {
        // Most of a page is not a background. This must not report work it
        // did not do, or every scroll would cost a tagging request.
        const doc = page('<body><div id="plain">Words</div></body>');
        const observer = withFakeObserver();
        const found = [];
        watchForLateBackgrounds(doc, (batch) => found.push(...batch));

        observer.scrollTo(doc.querySelector('#plain'));
        await new Promise((r) => setTimeout(r, 600));

        expect(found).toEqual([]);
    });

    it('never watches a picture the markup already declares', async () => {
        // The markup stays the source of truth wherever it has an answer, and
        // watching those would be paying to re-learn what we already know.
        const doc = page('<body><div data-bg="/theme.jpg"></div><div data-kb-bg="/known.jpg"></div>'
            + '<div id="unknown"></div></body>');
        const observer = withFakeObserver();
        watchForLateBackgrounds(doc);

        expect(observer.watched).toEqual([doc.querySelector('#unknown')]);
    });

    it('does nothing at all in a browser without an observer', () => {
        // Rather than throwing during boot and taking the editor with it.
        delete window.IntersectionObserver;

        expect(watchForLateBackgrounds(page('<body><div></div></body>'))).toBeNull();
    });
});

describe('both ways into the editor find the pictures', () => {
    beforeEach(() => {
        window.sessionStorage?.clear();
        delete window.liveEditBackgroundsWatched;
    });

    it('does the work once, however many entries ask', async () => {
        // A site we sold comes through boot.js; WordPress loads the editor on
        // its own, because its plugin already tagged the page on the server
        // and supplies a token boot.js would overwrite with a null. Both ask,
        // and asking twice must not cost twice.
        globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ elements: [] }) }));
        window.IntersectionObserver = class {
            observe() {} unobserve() {} disconnect() {}
        };

        const doc = page('<head><style>.hero{background-image:url("/hero.jpg")}</style></head>'
            + '<body><div class="hero"></div></body>');

        await ensureBackgroundsAreFound({ base: 'https://cms.test', site: 'a', key: 'k' }, doc);
        const afterFirst = globalThis.fetch.mock.calls.length;

        await ensureBackgroundsAreFound({ base: 'https://cms.test', site: 'a', key: 'k' }, doc);

        expect(afterFirst).toBeGreaterThan(0);
        expect(globalThis.fetch.mock.calls.length).toBe(afterFirst);
    });
});

describe('looking again when somebody presses Edit site', () => {
    beforeEach(() => window.sessionStorage?.clear());

    it('finds a picture that only turned up after the page settled', async () => {
        // The case watching for a scroll could not catch. One banner on the
        // test site simply had its background a second after load, without
        // ever crossing the viewport in a way an observer reported.
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ elements: [{ at: [1, 0], attributes: { 'data-edit-bg': 'setting:auto:banner' } }] }),
        }));

        const doc = page('<head><style>.late{background-image:url("/banner.jpg")}</style></head>'
            + '<body><div id="b"></div></body>');

        // Nothing to find while the builder has not decided yet.
        expect(await refreshBackgrounds({ base: 'https://cms.test', site: 'a', key: 'k' }, doc)).toBe(0);
        expect(globalThis.fetch).not.toHaveBeenCalled();

        // The builder gets round to it; then somebody presses Edit site.
        doc.querySelector('#b').classList.add('late');

        await refreshBackgrounds({ base: 'https://cms.test', site: 'a', key: 'k' }, doc);

        expect(doc.querySelector('#b').getAttribute('data-kb-bg')).toBe('/banner.jpg');
        expect(globalThis.fetch).toHaveBeenCalled();
    });

    it('costs nothing when every picture already has a key', async () => {
        // Pressed repeatedly, as people do with a toggle.
        globalThis.fetch = vi.fn();
        const doc = page('<body><div data-kb-bg="/hero.jpg" data-edit-bg="setting:auto:hero"></div></body>');

        expect(await refreshBackgrounds({ base: 'https://cms.test', site: 'a', key: 'k' }, doc)).toBe(0);
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('asks again for one that was written down but never keyed', async () => {
        globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ elements: [] }) }));
        const doc = page('<body><div data-kb-bg="/orphan.jpg"></div></body>');

        await refreshBackgrounds({ base: 'https://cms.test', site: 'a', key: 'k' }, doc);

        expect(globalThis.fetch).toHaveBeenCalled();
    });
});

describe('a background that is only there while you are looking at it', () => {
    beforeEach(() => window.sessionStorage?.clear());

    it('keeps asking as the section crosses, instead of giving up first time', async () => {
        // Measured on a real Elementor page: a full-width banner whose
        // computed background reads "none" from anywhere except while it is
        // actually on screen — and which is not there yet on the first
        // crossing, because the builder is reacting to the same scroll we are.
        // Asking once meant asking at the one moment the answer was still no.
        const doc = page('<head><style>.on-screen{background-image:url("/banner.jpg")}</style></head>'
            + '<body><div id="flicker"></div></body>');
        const el = doc.querySelector('#flicker');

        let notify = null;
        const unobserved = [];
        window.IntersectionObserver = class {
            constructor(cb) { notify = cb; }
            observe() {}
            unobserve(node) { unobserved.push(node); }
            disconnect() {}
        };

        const found = [];
        watchForLateBackgrounds(doc, (batch) => found.push(...batch));

        // First crossing: the builder has not got there yet.
        notify([{ target: el, isIntersecting: true }]);
        await new Promise((r) => setTimeout(r, 500));

        expect(found).toEqual([]);
        expect(unobserved).not.toContain(el);

        // It comes back past, and this time the picture is on it.
        el.classList.add('on-screen');
        notify([{ target: el, isIntersecting: true }]);
        await new Promise((r) => setTimeout(r, 400));

        expect(el.getAttribute('data-kb-bg')).toBe('/banner.jpg');
        expect(found).toContain(el);
        expect(unobserved).toContain(el);
    });

    it('stops asking about one that never has a picture', async () => {
        // Most of a page is not a background, and scrolling must not cost a
        // style recalculation per element forever.
        const doc = page('<body><div id="plain">Words</div></body>');
        const el = doc.querySelector('#plain');

        let notify = null;
        const unobserved = [];
        window.IntersectionObserver = class {
            constructor(cb) { notify = cb; }
            observe() {}
            unobserve(node) { unobserved.push(node); }
            disconnect() {}
        };

        watchForLateBackgrounds(doc);

        for (let i = 0; i < 6; i++) {
            notify([{ target: el, isIntersecting: true }]);
            await new Promise((r) => setTimeout(r, 450));
        }

        expect(unobserved).toContain(el);
    });
});
