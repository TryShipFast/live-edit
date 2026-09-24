import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyContent, applyStyles, applyValue, fetchContent, resolve, styleRules } from '../../resources/js/content.js';

const page = (html) => {
    document.body.innerHTML = html;
    return document;
};

describe('putting published content into a static page', () => {
    it('replaces the words in a tagged element', () => {
        const root = page('<h1 data-edit="setting:auto:abc">Original</h1>');

        expect(applyContent(root, { 'auto:abc': 'Published' })).toBe(1);
        expect(root.querySelector('h1').textContent).toBe('Published');
    });

    it('leaves untagged elements alone', () => {
        const root = page('<h1 data-edit="setting:auto:abc">A</h1><p>Untouched</p>');

        applyContent(root, { 'auto:abc': 'B' });

        expect(root.querySelector('p').textContent).toBe('Untouched');
    });

    it('keeps the words in the file when the service has no value for a key', () => {
        const root = page('<h1 data-edit="setting:auto:abc">In the file</h1>');

        expect(applyContent(root, {})).toBe(0);
        expect(root.querySelector('h1').textContent).toBe('In the file');
    });

    it('treats a cleared value as an edit rather than as missing', () => {
        // Somebody deleted the heading. Springing back to the file's words
        // would look like the editor refusing to do as it was told.
        const root = page('<h1 data-edit="setting:auto:abc">In the file</h1>');

        applyContent(root, { 'auto:abc': '' });

        expect(root.querySelector('h1').textContent).toBe('');
    });

    it('sets a source on an image rather than its text', () => {
        const root = page('<img data-edit="setting:auto:img" src="/old.jpg" alt="">');

        applyContent(root, { 'auto:img': '/new.jpg' });

        expect(root.querySelector('img').getAttribute('src')).toBe('/new.jpg');
    });

    it('sets a link target from its own key', () => {
        const root = page('<a data-edit="setting:auto:t" data-edit-href="auto:h" href="/old">Book</a>');

        applyContent(root, { 'auto:t': 'Book now', 'auto:h': '/new' });

        expect(root.querySelector('a').textContent).toBe('Book now');
        expect(root.querySelector('a').getAttribute('href')).toBe('/new');
    });

    it('never writes markup from the network into the page', () => {
        // A content service that can put HTML into a page is a way to run
        // scripts in every visitor's browser.
        const root = page('<h1 data-edit="setting:auto:abc">Safe</h1>');

        applyValue(root.querySelector('h1'), '<img src=x onerror=alert(1)>');

        expect(root.querySelector('h1').querySelector('img')).toBeNull();
        expect(root.querySelector('h1').textContent).toContain('<img');
    });

    it('asks the content endpoint with the publishable key', async () => {
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true, status: 200, json: () => Promise.resolve({ settings: {} }),
        }));

        await fetchContent({ base: 'https://cms.test/api/v1/', site: 'acme', key: 'kbp_x' });

        const [url, init] = globalThis.fetch.mock.calls[0];
        expect(url).toBe('https://cms.test/api/v1/acme/content');
        expect(init.headers.Authorization).toBe('Bearer kbp_x');
    });

    it('says so rather than silently succeeding when the service refuses', async () => {
        globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({}) }));

        await expect(fetchContent({ base: 'https://cms.test', site: 'a', key: 'k' })).rejects.toThrow('503');
    });
});

describe('where a static page gets its content from', () => {
    const snapshot = { snapshot: 'https://cdn.test/content/sites/acme/' };

    const answering = (map) => vi.fn((url) => {
        const body = map[url];

        return Promise.resolve(body === undefined
            ? { ok: false, status: 404, json: () => Promise.resolve({}) }
            : { ok: true, status: 200, json: () => Promise.resolve(body) });
    });

    it('reads the files, not the application', async () => {
        // The whole point of publishing to files: a busy site is served from
        // an edge and never reaches the application, so its traffic costs its
        // owner nothing and costs us nothing.
        globalThis.fetch = answering({
            'https://cdn.test/content/sites/acme/current.json': { version: 7 },
            'https://cdn.test/content/sites/acme/v7/en.json': { settings: { 'auto:abc': 'From the CDN' } },
        });

        const payload = await resolve(snapshot);

        expect(payload.settings['auto:abc']).toBe('From the CDN');
        expect(globalThis.fetch.mock.calls.map(([url]) => url)).toEqual([
            'https://cdn.test/content/sites/acme/current.json',
            'https://cdn.test/content/sites/acme/v7/en.json',
        ]);
    });

    it('sends no key to the CDN', async () => {
        // Published content is what every visitor is shown anyway, and a key
        // in a request to a cache is a key in somebody's cache.
        globalThis.fetch = answering({
            'https://cdn.test/content/sites/acme/current.json': { version: 1 },
            'https://cdn.test/content/sites/acme/v1/en.json': { settings: {} },
        });

        await resolve(snapshot);

        for (const [, init] of globalThis.fetch.mock.calls) {
            expect(init?.headers?.Authorization).toBeUndefined();
        }
    });

    it('asks for the locale it was given', async () => {
        globalThis.fetch = answering({
            'https://cdn.test/content/sites/acme/current.json': { version: 2 },
            'https://cdn.test/content/sites/acme/v2/fr.json': { settings: { 'auto:abc': 'Bonjour' } },
        });

        const payload = await resolve({ ...snapshot, locale: 'fr' });

        expect(payload.settings['auto:abc']).toBe('Bonjour');
    });

    it('falls back to the application when there are no files yet', async () => {
        // A site that has never published has no snapshot, and should not be
        // blank because of it.
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        globalThis.fetch = answering({
            'https://cms.test/api/v1/acme/content': { settings: { 'auto:abc': 'From the API' } },
        });

        const payload = await resolve({ ...snapshot, base: 'https://cms.test/api/v1', site: 'acme', key: 'kbp_x' });

        expect(payload.settings['auto:abc']).toBe('From the API');
    });

    it('says so rather than pretending when there is nowhere to fall back to', async () => {
        globalThis.fetch = answering({});

        await expect(resolve(snapshot)).rejects.toThrow(/Pointer answered 404/);
    });

    it('does nothing at all when nothing is configured', async () => {
        globalThis.fetch = vi.fn();

        expect(await resolve({})).toBeNull();
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });
});

describe('rendering saved styles on a page nobody server-renders', () => {
    it('writes the rule a button needs to change colour', () => {
        // The gap this closes: a client changed a button's background, the
        // save worked, and nothing on the page rendered it.
        expect(styleRules('sabc', { background: '#4ade80' }))
            .toBe('[data-style="sabc"]{background:#4ade80 !important;}');
    });

    it('beats the theme own stylesheet', () => {
        // Without !important a saved colour loses to the class that set it,
        // which is the entire point of being able to restyle something.
        expect(styleRules('sabc', { background: 'red' })).toContain('!important');
    });

    it('maps every property the editor offers', () => {
        const css = styleRules('s1', {
            background: '#fff', textColor: '#000', fontSize: '18',
            radius: '6', paddingX: '20', paddingY: '12',
        });

        expect(css).toContain('background:#fff !important');
        expect(css).toContain('color:#000 !important');
        expect(css).toContain('font-size:18px !important');
        expect(css).toContain('border-radius:6px !important');
        expect(css).toContain('padding-left:20px !important');
        expect(css).toContain('padding-top:12px !important');
    });

    it('hides from visitors while leaving it visible, dimmed, to an editor', () => {
        const css = styleRules('s1', { hidden: '1' });

        expect(css).toContain('body:not(.editing) [data-style="s1"]{display:none !important}');
        expect(css).toContain('body.editing [data-style="s1"]{opacity:.45}');
    });

    it('skips properties that were cleared', () => {
        expect(styleRules('s1', { background: '', textColor: null })).toBe('');
    });

    it('puts the rules into the page', () => {
        document.head.innerHTML = '';
        document.body.innerHTML = '<a data-style="sbtn">Book</a>';

        applyStyles(document, { sbtn: { background: '#4ade80' } });

        const tag = document.getElementById('live-edit-styles');
        expect(tag).not.toBeNull();
        expect(tag.textContent).toContain('background:#4ade80');
    });

    it('reuses one tag rather than stacking sheets', () => {
        // Applying twice — a locale change, a refresh after publishing —
        // must not leave two stylesheets fighting.
        document.head.innerHTML = '';
        document.body.innerHTML = '<a data-style="sbtn">Book</a>';

        applyStyles(document, { sbtn: { background: '#111' } });
        applyStyles(document, { sbtn: { background: '#222' } });

        expect(document.querySelectorAll('#live-edit-styles')).toHaveLength(1);
        expect(document.getElementById('live-edit-styles').textContent).toContain('#222');
    });
})

describe('the markers that are not data-edit', () => {
    it('replaces a picture marked with data-edit-img', () => {
        // The scanner marks an image differently from words, because replacing
        // one means setting a source rather than writing text. Missing it meant
        // a client could change an image, publish, and see the old one.
        document.body.innerHTML = '<img data-edit-img="setting:auto:pic" src="/old.png" alt="">';

        applyContent(document, { 'auto:pic': '/new.png' });

        expect(document.querySelector('img').getAttribute('src')).toBe('/new.png');
    });

    it('leaves a picture alone when nothing was published for it', () => {
        document.body.innerHTML = '<img data-edit-img="setting:auto:pic" src="/old.png" alt="">';

        applyContent(document, {});

        expect(document.querySelector('img').getAttribute('src')).toBe('/old.png');
    });

    it('changes where a link goes', () => {
        document.body.innerHTML = '<a data-edit="setting:auto:t" data-edit-href="auto:h" href="/old">Book</a>';

        applyContent(document, { 'auto:t': 'Book now', 'auto:h': 'https://booking.test' });

        const link = document.querySelector('a');
        expect(link.textContent).toBe('Book now');
        expect(link.getAttribute('href')).toBe('https://booking.test');
    });
})
