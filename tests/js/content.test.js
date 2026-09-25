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

describe('a site that has published nothing yet', () => {
    it('is not an error, and leaves the words in the file', async () => {
        // A newly bought template has a pointer saying "nothing published".
        // Treating that as a failure put a 404 in every new customer console.
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true, status: 200, json: () => Promise.resolve({ version: 0, locales: [] }),
        }));

        const payload = await resolve({ snapshot: 'https://cdn.test/sites/acme' });

        expect(payload).toEqual({ settings: {}, styles: {} });
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
})

describe('icons and backgrounds, which are not words', () => {
    it('swaps one icon class and leaves the theme own classes alone', () => {
        document.body.innerHTML =
            '<span class="icon brands fa-twitter" data-edit-icon="setting:auto:i" data-edit-icon-current="fa-twitter"></span>';

        applyContent(document, { 'auto:i': 'fa-mastodon' });

        const el = document.querySelector('span');
        expect(el.className).toBe('icon brands fa-mastodon');
        expect(el.getAttribute('data-edit-icon-current')).toBe('fa-mastodon');
    });

    it('takes the whole class list when the editor moved to another variant', () => {
        // Several names mean a different variant of the theme's own set, which
        // takes a different list.
        document.body.innerHTML =
            '<span class="icon brands fa-twitter" data-edit-icon="setting:auto:i" data-edit-icon-current="fa-twitter"></span>';

        applyContent(document, { 'auto:i': 'icon solid fa-envelope' });

        expect(document.querySelector('span').className).toBe('icon solid fa-envelope');
    });

    it('lets nothing but class names into the attribute', () => {
        // These land in a class attribute, so what matters is that nothing can
        // close it and start another — quotes, equals, parentheses. A word
        // like "onloadalert1" surviving as a class name is inert.
        document.body.innerHTML =
            '<span class="icon fa-twitter" data-edit-icon="setting:auto:i" data-edit-icon-current="fa-twitter"></span>';

        applyContent(document, { 'auto:i': 'fa-x" onload="alert(1)' });

        const el = document.querySelector('span');

        expect(el.className).toMatch(/^[A-Za-z0-9_\- ]*$/);
        expect(el.getAttribute('onload')).toBeNull();
        expect(el.outerHTML).not.toContain('onload=');
    });

    it('leaves an icon alone when there is nothing to swap from', () => {
        document.body.innerHTML = '<span class="icon" data-edit-icon="setting:auto:i"></span>';

        applyContent(document, { 'auto:i': 'fa-twitter' });

        expect(document.querySelector('span').className).toBe('icon');
    });

    it('points a background at a new picture', () => {
        document.body.innerHTML = '<section data-edit-bg="setting:auto:b" style="color:red"></section>';

        applyContent(document, { 'auto:b': '/new.jpg' });

        const style = document.querySelector('section').getAttribute('style');
        expect(style).toContain("background-image:url('/new.jpg')");
        expect(style).toContain('color:red');
    });

    it('replaces an old background rather than stacking one on it', () => {
        document.body.innerHTML =
            '<section data-edit-bg="setting:auto:b" style="background-image:url(\'/old.jpg\');color:red"></section>';

        applyContent(document, { 'auto:b': '/new.jpg' });

        const style = document.querySelector('section').getAttribute('style');
        expect(style).toContain('/new.jpg');
        expect(style).not.toContain('/old.jpg');
    });

    it('updates the attributes a lazy-loading theme reads', () => {
        // A theme that reads one of these on load would otherwise put the old
        // picture back over ours.
        document.body.innerHTML = '<section data-edit-bg="setting:auto:b" data-background="/old.jpg"></section>';

        applyContent(document, { 'auto:b': '/new.jpg' });

        expect(document.querySelector('section').getAttribute('data-background')).toBe('/new.jpg');
    });
})

describe('putting a list in the order somebody chose', () => {
    const list = () => {
        document.body.innerHTML =
            '<ul data-edit-list="auto:l">' +
            '<li data-edit-item="i0">Twitter</li>' +
            '<li data-edit-item="i1">Facebook</li>' +
            '<li data-edit-item="i2">Instagram</li>' +
            '</ul>';
        return document;
    };

    const order = (doc) => [...doc.querySelector('ul').children].map((c) => c.textContent);

    it('reorders the items', () => {
        const doc = list();

        applyContent(doc, { 'auto:l': JSON.stringify(['i2', 'i0', 'i1']) });

        expect(order(doc)).toEqual(['Instagram', 'Twitter', 'Facebook']);
    });

    it('leaves a list alone when nothing was published for it', () => {
        const doc = list();

        applyContent(doc, {});

        expect(order(doc)).toEqual(['Twitter', 'Facebook', 'Instagram']);
    });

    it('drops an item that was removed in the editor', () => {
        const doc = list();

        applyContent(doc, { 'auto:l': JSON.stringify(['i0', 'i2']) });

        expect(order(doc)).toEqual(['Twitter', 'Instagram']);
    });

    it('copies the first item for one that was added', () => {
        // The page's markup only ever had the originals, so an item added in
        // the editor has to come from somewhere.
        const doc = list();

        applyContent(doc, { 'auto:l': JSON.stringify(['i0', 'i1', 'i2', 'i3']) });

        expect(order(doc)).toHaveLength(4);
        expect(doc.querySelector('[data-edit-item="i3"]')).not.toBeNull();
    });

    it('ignores an order that is not a list of items', () => {
        const doc = list();

        applyContent(doc, { 'auto:l': 'not json at all' });

        expect(order(doc)).toEqual(['Twitter', 'Facebook', 'Instagram']);
    });

    it('orders before filling in, so moved items keep their own words', () => {
        document.body.innerHTML =
            '<ul data-edit-list="auto:l">' +
            '<li data-edit-item="i0" data-edit="setting:auto:a">One</li>' +
            '<li data-edit-item="i1" data-edit="setting:auto:b">Two</li>' +
            '</ul>';

        applyContent(document, {
            'auto:l': JSON.stringify(['i1', 'i0']),
            'auto:a': 'First, moved second',
            'auto:b': 'Second, moved first',
        });

        expect(order(document)).toEqual(['Second, moved first', 'First, moved second']);
    });
})
