import { describe, expect, it, vi } from 'vitest';
import { aPageToStartFrom, duplicateOf, menuOrder, movedBy, pageKind, pageRows, renamed, renderPagesList, reordered, startsOffered, stored } from '../../resources/js/pages-list.js';
import { describeStructure } from '../../resources/js/pages.js';

/*
 * The Pages list (CONVENTIONS.md section 5, change 5): every page in menu order, as Wix's
 * "Pages & Menu" lists them, changed only through what the host already stores.
 */

const base = 'http://site.test/edit/shop';
const config = () => ({
    page: 'shop',
    pagesKey: 'structure:pages',
    removedKey: 'structure:removed',
    removed: [],
    editorBase: 'http://site.test/edit/',
    taken: ['shop', 'about', 'checkout', 'products/aster', 'privacy', 'open-days', 'visit'],
    made: [
        { id: 'open-days', title: 'Open days', menu: true },
        { id: 'visit', title: 'Visit us', menu: true },
        { id: 'faq', title: 'Questions', menu: false },
    ],
    pages: [
        { id: 'shop', title: 'Shop', href: 'http://site.test/edit/shop' },
        { id: 'about', title: 'About', href: 'http://site.test/edit/about' },
        { id: 'checkout', title: 'Checkout', href: 'http://site.test/edit/checkout' },
        { id: 'products/aster', title: 'Aster', href: 'http://site.test/edit/products/aster' },
        { id: 'privacy', title: 'Privacy', href: 'http://site.test/edit/privacy' },
        { id: 'open-days', title: 'Open days', href: 'http://site.test/edit/open-days', made: true },
        { id: 'visit', title: 'Visit us', href: 'http://site.test/edit/visit', made: true },
        { id: 'faq', title: 'Questions', href: 'http://site.test/edit/faq', made: true },
    ],
    starts: [
        { id: 'about', title: 'About', sections: ['about.story'], own: ['about.story'] },
        { id: 'checkout', title: 'Checkout', sections: ['checkout.form'], own: ['checkout.form'] },
        { id: 'products/aster', title: 'Aster', sections: ['aster.detail'], own: ['aster.detail'] },
    ],
    library: [
        { from: 'about.story', label: 'Our story', page: 'About' },
        { from: 'checkout.form', label: 'Checkout', page: 'Checkout' },
        { from: 'aster.detail', label: 'Product', page: 'Aster' },
    ],
});

describe('what kind of page it is', () => {
    it('knows the pages a website needs but nobody puts in a menu', () => {
        expect(pageKind({ id: 'checkout' })).toBe('internal');
        expect(pageKind({ id: 'bag', title: 'Your bag' })).toBe('internal');
        expect(pageKind({ id: 'brand', title: 'brand' })).toBe('internal');
        expect(pageKind({ id: 'search' })).toBe('internal');
        expect(pageKind({ id: '404' })).toBe('internal');
        expect(pageKind({ id: 'privacy' })).toBe('legal');
        expect(pageKind({ id: 'products/aster' })).toBe('record');
        expect(pageKind({ id: 'journal/first-light' })).toBe('record');
        expect(pageKind({ id: 'services/exterior' })).toBe('page');
        expect(pageKind({ id: 'about' })).toBe('page');
    });

    it('believes the host where it says', () => {
        expect(pageKind({ id: 'about', kind: 'internal' })).toBe('internal');
        expect(pageKind({ id: 'checkout', kind: 'page' })).toBe('page');
        expect(pageKind({ id: 'mine', catalogue: {} })).toBe('record');
    });

    it('never offers a checkout, a brand sheet, a notice or one product as a kind of new page', () => {
        expect(startsOffered(config()).map((kind) => kind.id)).toEqual(['about']);
        expect(aPageToStartFrom({ id: null, title: 'Your own choice' })).toBe(true);
    });
});

describe('the menu order', () => {
    it('reads the design’s main menu, not its phone copy or a row of categories', () => {
        document.body.innerHTML = `
            <ul data-kit-menu="categories"><li><a href="../privacy/">Privacy</a></li></ul>
            <ul data-kit-menu="main"><li data-kit-menu-entry><a href="../about/">About</a></li><li><a href="../shop/">Shop</a></li><li><a href="../visit/">Visit</a></li><li><a href="../open-days/">Open days</a></li></ul>
            <ul data-kit-menu="phone"><li><a href="../shop/">Shop</a></li></ul>`;
        expect(menuOrder(document, config().pages, base)).toEqual(['about', 'shop', 'visit', 'open-days']);
    });

    it('falls back to the header’s navigation', () => {
        document.body.innerHTML = '<header><nav><a href="../shop/">Shop</a> <a href="../journal/">Journal</a> <a href="../about/">About</a></nav></header>';
        expect(menuOrder(document, config().pages, base)).toEqual(['shop', 'about']);
    });

    it('lists the menu in its order, then the other pages, then the ones a website needs', () => {
        const { inMenu, others, needed } = pageRows(config(), ['shop', 'about', 'open-days', 'visit']);
        expect(inMenu.map((row) => row.id)).toEqual(['shop', 'about', 'open-days', 'visit']);
        expect(others.map((row) => row.id)).toEqual(['faq']);
        expect(needed.map((row) => [row.id, row.kind])).toEqual([['checkout', 'internal'], ['products/aster', 'record'], ['privacy', 'legal']]);
        expect(needed.every((row) => !row.inMenu && !row.canDelete && !row.canDuplicate)).toBe(true);
    });

    it('offers only what the host can keep', () => {
        const rows = Object.fromEntries(Object.values(pageRows(config(), ['shop', 'about', 'open-days', 'visit'])).flat().map((row) => [row.id, row]));
        // The design's own: open, duplicate (from its starting point), delete where the host keeps deletions.
        expect(rows.about).toMatchObject({ canRename: false, canHide: false, canMove: false, canDuplicate: true, canDelete: true, inMenu: true });
        // The owner's: everything.
        expect(rows['open-days']).toMatchObject({ canRename: true, canHide: true, canMove: true, canDelete: true });
        // Out of the menu: renamed and put back, not moved.
        expect(rows.faq).toMatchObject({ canHide: true, canMove: false, inMenu: false });
        expect(rows.shop.here).toBe(true);

        const noRemoving = { ...config(), removedKey: undefined };
        expect(pageRows(noRemoving, []).others.find((row) => row.id === 'about').canDelete).toBe(false);
    });

    it('puts Home first and never deletes it', () => {
        const home = { ...config(), pages: [{ id: '', title: 'Home', href: 'http://site.test/edit/' }, ...config().pages] };
        const { inMenu } = pageRows(home, ['about']);
        expect(inMenu[0]).toMatchObject({ id: '', home: true, canDelete: false });
    });
});

describe('changing the owner’s pages', () => {
    it('renames, moves, reorders and keeps only what the host stores', () => {
        const made = config().made;
        expect(renamed(made, 'visit', '  Find us ').find((page) => page.id === 'visit').title).toBe('Find us');
        expect(movedBy(made, 'visit', -1).map((page) => page.id)).toEqual(['visit', 'open-days', 'faq']);
        expect(movedBy(made, 'open-days', -1)).toBe(made);
        // A page out of the menu keeps its place while the others swap round it.
        const mixed = [made[0], made[2], made[1]];
        expect(movedBy(mixed, 'visit', -1).map((page) => page.id)).toEqual(['visit', 'faq', 'open-days']);
        expect(reordered(made, ['visit', 'open-days']).map((page) => page.id)).toEqual(['visit', 'open-days', 'faq']);
        expect(stored([{ id: 'a', title: 'A', menu: true, added: { x: 'y' } }])).toEqual([{ id: 'a', title: 'A', menu: true }]);
    });

    it('duplicates a page with its sections, at a free address and out of the menu', () => {
        const row = pageRows(config(), ['about']).inMenu.find((one) => one.id === 'about');
        let n = 0;
        const copy = duplicateOf(row, { taken: ['about', 'about-copy'] }, () => ((n += 1) % 36) / 36);
        expect(copy.id).toBe('about-copy-2');
        expect(copy.title).toBe('About (copy)');
        expect(Object.values(copy.added)).toEqual(['about.story']);
        expect(Object.keys(copy.added)[0]).toMatch(/^add-[a-z0-9]{8}$/);
    });

    it('describes a deleted design page by its name under Changes', () => {
        const said = describeStructure('structure:removed', '[]', '["about"]', { pages: config().pages });
        expect(said).toEqual({ label: 'Deleted pages', before: 'None', after: 'Deleted the page About' });
    });
});

describe('the panel', () => {
    const modal = () => {
        const body = document.createElement('div');
        const foot = document.createElement('div');
        document.body.replaceChildren(body, foot);
        return { body, foot, title: vi.fn(), subtitle: vi.fn(), close: vi.fn() };
    };
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    it('saves a rename, a menu switch, a move and a delete as the owner’s pages', async () => {
        const saved = [];
        const ui = modal();
        const builder = config();
        const ask = vi.fn(async () => true);
        const go = vi.fn();
        renderPagesList({ ui, config: builder, menu: ['shop', 'about', 'open-days', 'visit'], save: async (key, value) => saved.push([key, value]), go, addPage: vi.fn(), ask });
        const row = (id) => ui.body.querySelector(`[data-page="${id}"]`);

        // rename
        row('visit').querySelector('.le-page-rename-btn').click();
        const input = row('visit').querySelector('.le-page-rename');
        input.value = 'Find us';
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        await flush();
        expect(JSON.parse(saved.at(-1)[1]).find((page) => page.id === 'visit').title).toBe('Find us');
        expect(row('visit').textContent).toContain('Find us');

        // out of the menu
        const box = row('visit').querySelector('.le-page-menu input');
        box.checked = false;
        box.dispatchEvent(new Event('change'));
        await flush();
        expect(JSON.parse(saved.at(-1)[1]).find((page) => page.id === 'visit').menu).toBe(false);
        expect(row('visit').textContent).toContain('Not in menu');

        // back in, then up
        row('visit').querySelector('.le-page-menu input').checked = true;
        row('visit').querySelector('.le-page-menu input').dispatchEvent(new Event('change'));
        await flush();
        row('visit').querySelector('.le-page-up').click();
        await flush();
        expect(JSON.parse(saved.at(-1)[1]).map((page) => page.id)).toEqual(['visit', 'open-days', 'faq']);

        // delete one of the owner's
        row('faq').querySelector('.le-page-delete').click();
        await flush();
        expect(ask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Delete Questions?', yes: 'Delete page' }));
        expect(saved.at(-2)).toEqual(['structure:page:faq', '{"added":{}}']);
        expect(JSON.parse(saved.at(-1)[1]).map((page) => page.id)).toEqual(['visit', 'open-days']);
        expect(row('faq')).toBeNull();

        // delete one of the design's, which the host lists as removed
        row('about').querySelector('.le-page-delete').click();
        await flush();
        expect(saved.at(-1)).toEqual(['structure:removed', '["about"]']);

        // every value saved is one the host's policy accepts: id, title and menu only
        for (const [key, value] of saved.filter(([key]) => key === 'structure:pages')) {
            expect(JSON.parse(value).every((page) => Object.keys(page).every((k) => ['id', 'title', 'menu'].includes(k)))).toBe(true);
        }
        expect(go).not.toHaveBeenCalled();
    });

    it('keeps a page when the answer is Keep it, and opens a page through go', async () => {
        const saved = [];
        const ui = modal();
        const go = vi.fn();
        renderPagesList({ ui, config: config(), menu: [], save: async (key, value) => saved.push([key, value]), go, addPage: vi.fn(), ask: async () => false });
        ui.body.querySelector('[data-page="faq"] .le-page-delete').click();
        await flush();
        expect(saved).toEqual([]);
        ui.body.querySelector('[data-page="about"] .le-page-open').click();
        expect(go).toHaveBeenCalledWith('http://site.test/edit/about');
        expect(ui.body.querySelector('[data-page="shop"] .le-page-open').disabled).toBe(true);
    });

    it('duplicates into a new page of the owner’s, out of the menu', async () => {
        const saved = [];
        const ui = modal();
        const builder = config();
        renderPagesList({ ui, config: builder, menu: ['about'], save: async (key, value) => saved.push([key, value]), go: vi.fn(), addPage: vi.fn(), ask: async () => true });
        ui.body.querySelector('[data-page="about"] .le-page-duplicate').click();
        await flush();
        expect(saved[0][0]).toBe('structure:page:about-copy');
        expect(JSON.parse(saved[1][1]).at(-1)).toEqual({ id: 'about-copy', title: 'About (copy)', menu: false });
        expect(ui.body.querySelector('[data-page="about-copy"]').textContent).toContain('Not in menu');
    });
});
