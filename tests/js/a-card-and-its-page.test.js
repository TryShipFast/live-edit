import { describe, expect, it } from 'vitest';
import {
    builderIn, copyPageForCard, deletablePage, deletePage, detailAddress, keyMap, linksTo, linksWarning,
    mappedKey, sectionsToCopy, showOnlyTheDetail,
} from '../../resources/js/card-page.js';
import { createHost, keyOf } from '../support/fake-host.js';

/*
 * The owner's questions about a shop of six products (or a journal of six
 * posts), answered from the card: edit a card's page without going to it,
 * copy a card and have its page copied with it, delete a card and its page.
 *
 * The site here is drawn by a stand-in for the hosting app that keys pages the
 * way it does (tests/support/fake-host.js), so a key says nothing about which
 * element it is and the same markup has different keys on different pages:
 * the copy has to work out which key became which.
 */

const makeDocument = (html) => new DOMParser().parseFromString(html, 'text/html');

const site = (options = {}) => {
    const host = createHost({ makeDocument, ...options });
    const editorBase = 'http://x.test/edit/';
    const builder = host.builderFor('shop', editorBase);

    return {
        host,
        builder,
        copy: (page, card, title) => copyPageForCard({
            page,
            title,
            card,
            builder,
            fetchPage: async (id) => {
                const doc = host.draw(id);
                if (!doc) throw new Error(`no page at ${id}`);

                return makeDocument(host.editorPage(id, { editorBase, api: 'http://x.test/api' }));
            },
            readContent: async () => ({ settings: { ...host.settings }, styles: { ...host.styles } }),
            save: async (key, value) => host.save(key, value),
            saveStyle: async (key, props) => host.saveStyle(key, props),
        }),
    };
};

const words = (doc, selector) => (doc.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
const ASTER = { id: 'products/aster-veil', title: 'Aster Veil' };
const FIRST = { id: 'journal/first-light', title: 'First light' };

/** The owner's edits to a product page: words, a picture, a style, a size added and one renamed. */
const editAsterVeil = (host) => {
    const page = host.draw(ASTER.id);
    const sizes = page.querySelector('[data-list="sizes"]');
    host.save(keyOf(page, '[data-component="shop.details"] p'), 'Our own story, in our own words.');
    host.save(keyOf(page, 'h1'), 'Aster Veil Intense');
    host.save(keyOf(page, '[data-component="shop.detail"] img', 'data-edit-img'), 'https://ours.test/bottle.jpg');
    host.save(`${keyOf(page, '[data-component="shop.detail"] img', 'data-edit-img')}Alt`, 'Our bottle on the shelf');
    host.saveStyle(page.querySelector('h1').getAttribute('data-style'), { textColor: '#5b1a3a' });
    host.save(sizes.getAttribute('data-edit-list'), JSON.stringify(['s50', 's100', 'nbig']));
    host.save(keyOf(page, '[data-item="s100"] [data-field="size"]'), '100 ml eau de parfum');

    // The added size is a copy of the one before it, with keys of its own.
    const again = host.draw(ASTER.id);
    host.save(keyOf(again, '[data-edit-item="nbig"] [data-field="size"]'), '200 ml refill');
};

describe('a card\'s page, shown as itself', () => {
    it('opens the editor on the page in detail mode', () => {
        expect(detailAddress('http://x.test/edit/', 'products/aster-veil')).toBe('http://x.test/edit/products/aster-veil?live-edit=detail');
        expect(detailAddress('http://x.test/edit?page=', 'a')).toBe('http://x.test/edit?page=a&live-edit=detail');
    });

    it('keeps a product\'s detail and its options, and puts the header, footer and related cards away', () => {
        const { host } = site();
        document.documentElement.innerHTML = host.draw(ASTER.id).documentElement.innerHTML;
        const ui = document.createElement('div');
        ui.id = 'live-edit-ui';
        document.body.append(ui);

        const shown = showOnlyTheDetail(document);
        const hidden = (selector) => document.querySelector(selector).closest('[data-le-detail-hidden]') !== null;

        expect(shown.map((root) => root.dataset.instance)).toEqual(['aster-veil.detail', 'aster-veil.story']);
        expect(hidden('header')).toBe(true);
        expect(hidden('footer')).toBe(true);
        expect(hidden('[data-instance="aster-veil.related"]')).toBe(true);
        expect(hidden('h1')).toBe(false);
        expect(hidden('[data-list="sizes"] label')).toBe(false);
        expect(hidden('#live-edit-ui')).toBe(false);
        // The real component, untouched: its own markup, keys and options, not a form made from them.
        expect(document.querySelectorAll('[data-list="sizes"] [data-edit-item]')).toHaveLength(2);
        expect(document.querySelector('form, .le-field')).toBeNull();
    });

    it('keeps a journal post\'s article, with its body and pictures', () => {
        const { host } = site();
        document.documentElement.innerHTML = host.draw(FIRST.id).documentElement.innerHTML;
        const shown = showOnlyTheDetail(document);

        expect(shown.map((root) => root.dataset.instance)).toEqual(['first-light.article']);
        expect(document.querySelector('.body').closest('[data-le-detail-hidden]')).toBeNull();
        expect(document.querySelector('[data-instance="first-light.related"]').hasAttribute('data-le-detail-hidden')).toBe(true);
    });
});

describe('which key became which', () => {
    it('reads the page builder a page was served with', () => {
        const { host } = site();
        const doc = makeDocument(host.editorPage(ASTER.id, { editorBase: '/edit/', api: '/api' }));

        expect(builderIn(doc)).toMatchObject({ page: ASTER.id, pagesKey: 'structure:pages' });
    });

    it('copies the sections the owner arranged, not the shared bands', () => {
        const { host } = site();
        const doc = host.draw(ASTER.id);

        expect(sectionsToCopy(doc, ASTER.id, host.builderFor(ASTER.id, '/')).map((section) => section.from))
            .toEqual(['aster-veil.detail', 'aster-veil.story', 'aster-veil.related']);
    });

    it('follows a picture\'s description and a copied row\'s words to their key', () => {
        const keys = new Map([['tpl:aaa', 'tpl:bbb']]);

        expect(mappedKey('tpl:aaa', keys)).toBe('tpl:bbb');
        expect(mappedKey('tpl:aaaAlt', keys)).toBe('tpl:bbbAlt');
        expect(mappedKey('tpl:aaa@n1x', keys)).toBe('tpl:bbb@n1x');
        expect(mappedKey('tpl:aaa@n1xCreditBy', keys)).toBe('tpl:bbb@n1xCreditBy');
        expect(mappedKey('tpl:other', keys)).toBeNull();
    });

    it('matches list items by their id, wherever the owner moved them', () => {
        const a = makeDocument('<section><ul data-edit-list="L1"><li data-edit-item="b"><i data-edit="setting:B1"></i></li><li data-edit-item="a"><i data-edit="setting:A1"></i></li></ul></section>').body.firstElementChild;
        const b = makeDocument('<section><ul data-edit-list="L2"><li data-edit-item="a"><i data-edit="setting:A2"></i></li><li data-edit-item="b"><i data-edit="setting:B2"></i></li></ul></section>').body.firstElementChild;
        const { keys, lists } = keyMap([[a, b]]);

        expect(Object.fromEntries(keys)).toEqual({ A1: 'A2', B1: 'B2' });
        expect(Object.fromEntries(lists)).toEqual({ L1: 'L2' });
    });
});

describe('a copied card gets a full copy of its page', () => {
    it('copies a product page with every edit, options included, onto keys of its own', async () => {
        const { host, builder, copy } = site();
        editAsterVeil(host);
        const shop = host.draw('shop');
        // The owner copied the Aster Veil card and renamed the copy.
        host.save(shop.querySelector('[data-list="products"]').getAttribute('data-edit-list'), JSON.stringify(['aster', 'nfig', 'blue']));
        const withCopy = host.draw('shop');
        const card = withCopy.querySelector('[data-edit-item="nfig"]');
        host.save(keyOf(withCopy, '[data-edit-item="nfig"] h3 a'), 'Fig Archive');
        host.save(keyOf(withCopy, '[data-edit-item="nfig"] [data-kit-price]'), '$132');
        const named = host.draw('shop').querySelector('[data-edit-item="nfig"]');

        const id = await copy(ASTER, named, 'Fig Archive');
        expect(card).not.toBeNull();
        expect(id).toBe('fig-archive');
        expect(builder.made).toEqual([{ id: 'fig-archive', title: 'Fig Archive', menu: false }]);

        const fig = host.draw('fig-archive');
        const original = host.draw(ASTER.id);
        // Everything the owner said on the original, on the copy.
        expect(words(fig, '[data-component="shop.details"] p')).toBe('Our own story, in our own words.');
        expect(fig.querySelector('[data-component="shop.detail"] img').getAttribute('src')).toBe('https://ours.test/bottle.jpg');
        expect(host.settings[`${keyOf(fig, '[data-component="shop.detail"] img', 'data-edit-img')}Alt`]).toBe('Our bottle on the shelf');
        expect(host.styles[fig.querySelector('h1').getAttribute('data-style')]).toEqual({ textColor: '#5b1a3a' });
        expect([...fig.querySelectorAll('[data-list="sizes"] [data-field="size"]')].map((el) => el.textContent.trim()))
            .toEqual(['50 ml', '100 ml eau de parfum', '200 ml refill']);
        expect(fig.querySelectorAll('[data-list="colours"] [data-edit-item]')).toHaveLength(2);
        // Then the card's own words where the card says something else.
        expect(words(fig, 'h1')).toBe('Fig Archive');
        expect(words(fig, '[data-component="shop.detail"] .price [data-field="price"]')).toBe('$132');
        // And no key in common with the original page's own fields.
        const keysOf = (doc) => new Set([...doc.querySelectorAll('main [data-edit], main [data-edit-img], main [data-edit-list]')]
            .map((el) => el.getAttribute('data-edit') ?? el.getAttribute('data-edit-img') ?? el.getAttribute('data-edit-list')));
        const shared = [...keysOf(fig)].filter((key) => keysOf(original).has(key));
        expect(shared).toEqual([]);
    });

    it('takes the photo the owner put on the card, with its description, and leaves the sample alone', async () => {
        const { host, copy } = site();
        editAsterVeil(host);
        const shop = host.draw('shop');
        host.save(shop.querySelector('[data-list="products"]').getAttribute('data-edit-list'), JSON.stringify(['aster', 'nfig', 'blue']));
        const withCopy = host.draw('shop');
        const photo = keyOf(withCopy, '[data-edit-item="nfig"] img', 'data-edit-img');
        host.save(photo, 'https://ours.test/fig.jpg');
        host.save(`${photo}Alt`, 'A green fig bottle');

        const id = await copy(ASTER, host.draw('shop').querySelector('[data-edit-item="nfig"]'), 'Fig Archive');
        const fig = host.draw(id);
        const key = keyOf(fig, '[data-component="shop.detail"] img', 'data-edit-img');

        expect(fig.querySelector('[data-component="shop.detail"] img').getAttribute('src')).toBe('https://ours.test/fig.jpg');
        expect(host.settings[`${key}Alt`]).toBe('A green fig bottle');
        // The name was never typed on the card, so the page keeps the one the owner gave it.
        expect(words(fig, 'h1')).toBe('Aster Veil Intense');
    });

    it('keeps the two pages independent after the copy, both ways', async () => {
        const { host, copy } = site();
        editAsterVeil(host);
        const card = host.draw('shop').querySelector('[data-edit-item="aster"]');
        const id = await copy(ASTER, card, 'Aster Veil copy');

        const fig = host.draw(id);
        host.save(keyOf(fig, '[data-component="shop.details"] p'), 'Only the copy says this.');
        host.save(fig.querySelector('[data-list="sizes"]').getAttribute('data-edit-list'), JSON.stringify(['s50']));
        const original = host.draw(ASTER.id);
        host.save(keyOf(original, 'h1'), 'Only the original says this.');

        const after = { copy: host.draw(id), original: host.draw(ASTER.id) };
        expect(words(after.original, '[data-component="shop.details"] p')).toBe('Our own story, in our own words.');
        expect(after.original.querySelectorAll('[data-list="sizes"] [data-edit-item]')).toHaveLength(3);
        expect(words(after.copy, 'h1')).not.toBe('Only the original says this.');
        expect(words(after.copy, '[data-component="shop.details"] p')).toBe('Only the copy says this.');
        expect(after.copy.querySelectorAll('[data-list="sizes"] [data-edit-item]')).toHaveLength(1);
    });

    it('copies a journal post: its article, body and pictures', async () => {
        const { host, copy } = site();
        const post = host.draw(FIRST.id);
        host.save(keyOf(post, '.body p'), 'We walked before the town woke.');
        host.save(keyOf(post, '[data-item="p2"] img', 'data-edit-img'), 'https://ours.test/noon.jpg');
        host.save(post.querySelector('[data-list="pictures"]').getAttribute('data-edit-list'), JSON.stringify(['p2', 'p1']));
        const card = host.draw('shop').querySelector('[data-edit-item="first"]');

        const id = await copy(FIRST, card, 'First light, again');
        const again = host.draw(id);

        expect(words(again, '.body p')).toBe('We walked before the town woke.');
        expect([...again.querySelectorAll('[data-list="pictures"] img')].map((img) => img.getAttribute('src')))
            .toEqual(['https://ours.test/noon.jpg', 'https://img.test/first-light-1.jpg']);
        expect(words(again, 'h1')).toBe('First light');
    });

    it('copies a page the owner made, from what its sections were added from', async () => {
        const { host, copy } = site();
        const card = host.draw('shop').querySelector('[data-edit-item="aster"]');
        const first = await copy(ASTER, card, 'Fig Archive');
        host.save(keyOf(host.draw(first), '[data-component="shop.detail"] [data-field="notes"]'), 'Fig leaf and black tea.');

        const second = await copy({ id: first, title: 'Fig Archive' }, card, 'Fig Archive two');
        expect(second).toBe('fig-archive-two');
        expect(words(host.draw(second), '[data-component="shop.detail"] [data-field="notes"]')).toBe('Fig leaf and black tea.');
    });
});

describe('deleting a card\'s page', () => {
    it('deletes a page the owner made, and clears what it was made of', async () => {
        const { host, builder, copy } = site();
        const card = host.draw('shop').querySelector('[data-edit-item="aster"]');
        const id = await copy(ASTER, card, 'Fig Archive');
        expect(deletablePage({ id }, builder)).toBe('made');

        await deletePage({ page: { id, title: 'Fig Archive' }, builder, save: async (k, v) => host.save(k, v) });

        expect(JSON.parse(host.settings['structure:pages'])).toEqual([]);
        expect(host.settings['structure:page:fig-archive']).toBe('');
        expect(host.draw(id)).toBeNull();
        expect(builder.taken).not.toContain(id);
    });

    it('deletes a page the design came with only where the host keeps a list of removed pages', async () => {
        const without = site();
        expect(deletablePage(ASTER, without.builder)).toBeNull();
        await expect(deletePage({ page: ASTER, builder: without.builder, save: async () => {} })).rejects.toThrow('cannot be deleted');

        const { host, builder } = site({ removable: true });
        expect(deletablePage(ASTER, builder)).toBe('design');
        await deletePage({ page: ASTER, builder, save: async (k, v) => host.save(k, v) });
        expect(JSON.parse(host.settings['structure:removed'])).toEqual([ASTER.id]);
        expect(host.draw(ASTER.id)).toBeNull();
    });

    it('says what else links to the page before it goes', () => {
        const { host, builder } = site();
        document.documentElement.innerHTML = host.draw('shop').documentElement.innerHTML;
        const card = document.querySelector('[data-edit-item="aster"]');
        // A second link to it on this page, and one the owner set on another page.
        document.querySelector('[data-instance="shop.grid"]').insertAdjacentHTML('beforeend', '<a href="../products/aster-veil/">Our bestseller</a>');
        const found = linksTo(ASTER, {
            doc: document,
            settings: { 'tpl:elsewhere': '../products/aster-veil/', 'tpl:words': 'products/aster-veil is lovely' },
            pages: builder.pages,
            base: 'http://x.test/edit/shop',
            except: [card],
            builder,
        });

        expect(found).toEqual({ here: ['Our bestseller'], elsewhere: 1, inMenu: false });
        expect(linksWarning(found)).toContain('“Our bestseller”');
        expect(linksWarning(found)).toContain('1 link you set on other pages');
        expect(linksWarning({ here: [], elsewhere: 0 })).toBe('');
    });
});

describe('the runtime\'s files', () => {
    it('serves every module the editor imports from the embed endpoint', async () => {
        const fs = await import('node:fs');
        const served = fs.readFileSync('src/Http/Api/V1/EmbedController.php', 'utf8');
        const runtime = fs.readFileSync('resources/js/live-edit.js', 'utf8');
        const imported = [...runtime.matchAll(/from '\.\/([a-z-]+\.js)'/g)].map((match) => match[1]);

        expect(imported).toContain('card-page.js');
        for (const file of imported) expect(served).toContain(`'${file}' => '${file}'`);
    });
});
