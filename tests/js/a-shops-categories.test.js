import { describe, expect, it } from 'vitest';
import { firstLike, leafCategories, productPicker, renderCategoryProducts, renderNewCategory } from '../../resources/js/pages.js';
import { renderShopPanel } from '../../resources/js/shop.js';

/*
 * A shop's categories (LIVE-EDIT-STRUCTURE.md, "A shop's categories"), 1 Nov 2026. The owner said
 * creating a category "seems not working": in the editor a category was a page made like another,
 * started from a list of every kind of page and named in one place only. Now the Shop tab lists the
 * categories the host found, and New category asks for a name and which category it looks like.
 */
const categories = [
    { id: 'shop', title: 'All products', href: '/e/shop', made: false, copies: ['shop.intro', 'shop.products'] },
    { id: 'shop/headphones', title: 'Headphones', href: '/e/shop/headphones', made: false, copies: ['shop-headphones.intro', 'shop-headphones.headphones'] },
    { id: 'shop/speakers', title: 'Speakers', href: '/e/shop/speakers', made: false, copies: ['shop-speakers.intro', 'shop-speakers.speakers'] },
];
const config = { categories, taken: ['shop', 'about'], made: [{ id: 'open-days', title: 'Open days', menu: false }], pagesKey: 'structure:pages', editorBase: '/e/' };

const fakeModal = () => {
    const body = document.createElement('div');
    const foot = document.createElement('div');
    const said = {};

    return { body, foot, title: (t) => (said.title = t), subtitle: (t) => (said.subtitle = t), allowDismiss: () => {}, close: () => {}, said };
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("a shop's categories", () => {
    it('lists the categories in the Shop tab, each to open or duplicate, and offers a new one', () => {
        const container = document.createElement('div');
        const asked = [];
        renderShopPanel({ container, config: { products: [], fields: [] }, save: async () => {}, categories, newCategory: (from) => asked.push(from?.id ?? 'new') });

        expect([...container.querySelectorAll('.le-shop-category')].map((row) => [row.querySelector('.le-shop-name').textContent, row.querySelector('a.le-category-open').getAttribute('href')])).toEqual([
            ['All products', '/e/shop'], ['Headphones', '/e/shop/headphones'], ['Speakers', '/e/shop/speakers'],
        ]);
        container.querySelectorAll('.le-category-duplicate')[1].click();
        container.querySelector('.le-new-category-btn').click();
        expect(asked).toEqual(['shop/headphones', 'new']);
    });

    it('has no Categories part where the host found none', () => {
        const container = document.createElement('div');
        renderShopPanel({ container, config: { products: [], fields: [] }, save: async () => {}, categories: [], newCategory: () => {} });
        expect(container.querySelector('.le-shop-categories')).toBeNull();
    });

    it('starts a new category like a category, not like the page that holds them all', () => {
        expect(leafCategories(categories).map((c) => c.id)).toEqual(['shop/headphones', 'shop/speakers']);
    });

    it('starts like the fullest category the menu links, and out of the menu where the menu links none (Car Wash Auto)', () => {
        const oxbow = [
            { id: 'gift-guide', title: 'Gift guide', copies: ['a'], products: 12, inMenu: false },
            { id: 'shop', title: 'All clothes', copies: ['b'], products: 14, inMenu: true },
            { id: 'shop/men', title: 'Men', copies: ['c'], products: 9, inMenu: true },
            { id: 'shop/women', title: 'Women', copies: ['d'], products: 11, inMenu: true },
        ];
        expect(firstLike(oxbow).title).toBe('Women');

        const carWash = [
            { id: 'shop', title: 'Car care shop', copies: ['a'], products: 8, inMenu: false },
            { id: 'shop/gift-cards', title: 'Gift cards', copies: ['b'], products: 2, inMenu: false },
            { id: 'shop/picks', title: 'Our picks', copies: ['c'], products: 7, inMenu: false },
        ];
        expect(firstLike(carWash).title).toBe('Our picks');
        // A flash-sale page lists only what is on sale: never the page a new collection starts like, however full.
        const oyin = [
            { id: 'shop/flash-sale', title: 'Flash sale', copies: ['a'], products: 22, inMenu: true, saleOnly: true },
            { id: 'shop/girls', title: 'Girls', copies: ['b'], products: 8, inMenu: true, saleOnly: false },
        ];
        expect(firstLike(oyin).title).toBe('Girls');
        const ui = fakeModal();
        renderNewCategory({ ui, config: { ...config, categories: carWash }, save: async () => {}, go: () => {}, notify: () => {} });
        expect(ui.body.querySelector('.le-category-like').value).toBe('shop/picks');
        expect(ui.body.querySelector('.le-switch input').checked).toBe(false);
    });

    it('makes a category from a name: the sections of the one it looks like, in the menu', async () => {
        const ui = fakeModal();
        const saved = [];
        let went = null;
        renderNewCategory({ ui, config, save: async (key, value) => saved.push([key, value]), go: (href) => (went = href), notify: () => {} });

        expect(ui.said.title).toBe('New collection');
        const create = ui.foot.querySelector('.le-create-category');
        expect(create.disabled).toBe(true);

        const pick = ui.body.querySelector('.le-category-like');
        pick.value = 'shop/speakers';
        pick.dispatchEvent(new Event('change'));
        const name = ui.body.querySelector('.le-name-title');
        name.value = 'Cables';
        name.dispatchEvent(new Event('input'));
        expect(ui.body.textContent).toContain('/cables');
        expect(ui.body.textContent).toContain('a copy of Speakers');

        create.click();
        await tick();
        expect(saved[0][0]).toBe('structure:page:cables');
        expect(Object.values(JSON.parse(saved[0][1]).added)).toEqual(['shop-speakers.intro', 'shop-speakers.speakers']);
        expect(JSON.parse(saved[1][1])).toEqual([{ id: 'open-days', title: 'Open days', menu: false }, { id: 'cables', title: 'Cables', menu: true }]);
        expect(went).toBe('/e/cables');
    });

    it('duplicates a category with its products under a new name, and will not take an address in use', async () => {
        const ui = fakeModal();
        const saved = [];
        renderNewCategory({ ui, config, from: categories[1], save: async (key, value) => saved.push([key, value]), go: () => {}, notify: () => {} });

        expect(ui.said.title).toBe('Duplicate Headphones');
        expect(ui.body.querySelector('.le-category-like')).toBeNull();
        const name = ui.body.querySelector('.le-name-title');
        name.value = 'About';
        name.dispatchEvent(new Event('input'));
        expect(ui.foot.querySelector('.le-create-category').disabled).toBe(true);

        name.value = 'Studio headphones';
        name.dispatchEvent(new Event('input'));
        ui.foot.querySelector('.le-create-category').click();
        await tick();
        expect(saved[0][0]).toBe('structure:page:studio-headphones');
        expect(Object.values(JSON.parse(saved[0][1]).added)).toEqual(['shop-headphones.intro', 'shop-headphones.headphones']);
    });

    // Part 2: a category's products, ticked in and out.
    const shopProducts = [{ id: 'arc', name: 'Arc' }, { id: 'studio', name: 'Studio' }, { id: 'cable', name: 'USB-C cable, 2 m' }];

    it('ticks products in and out, in the shop order whatever order they were ticked in', () => {
        const picker = productPicker({ products: shopProducts, ticked: ['cable', 'gone'] });
        expect(picker.chosen()).toEqual(['cable']);
        // What it shows comes first, then the rest by name.
        expect([...picker.node.querySelectorAll('.le-product-name')].map((n) => n.textContent)).toEqual(['USB-C cable, 2 m', 'Arc', 'Studio']);
        const arc = picker.node.querySelector('input[value="arc"]');
        arc.checked = true;
        arc.dispatchEvent(new Event('change'));
        expect(picker.chosen()).toEqual(['arc', 'cable']);
        expect(picker.node.textContent).toContain('2 chosen');
    });

    it('saves the products a category shows, and will not save none', async () => {
        const ui = fakeModal();
        const saved = [];
        let said = null;
        const category = { id: 'shop/headphones', title: 'Headphones', has: ['arc', 'studio'], productsKey: 'structure:products:shop/headphones' };
        renderCategoryProducts({ ui, category, products: shopProducts, save: async (key, value) => saved.push([key, value]), done: (m) => (said = m), notify: () => {} });

        expect(ui.said.title).toBe('Products in Headphones');
        const ticks = [...ui.body.querySelectorAll('input[type=checkbox]')];
        for (const tick of ticks.slice(0, 2)) { tick.checked = false; tick.dispatchEvent(new Event('change')); }
        expect(ui.foot.querySelector('.le-save-products').disabled).toBe(true);

        ticks[2].checked = true;
        ticks[2].dispatchEvent(new Event('change'));
        ui.foot.querySelector('.le-save-products').click();
        await tick();
        expect(saved).toEqual([['structure:products:shop/headphones', '["cable"]']]);
        expect(said).toContain('1 product');
    });

    it('a new category starts with the products of the one it looks like, and saves the ones ticked', async () => {
        const withProducts = categories.map((c) => ({ ...c, has: c.id === 'shop/speakers' ? ['studio'] : ['arc'] }));
        const ui = fakeModal();
        const saved = [];
        renderNewCategory({ ui, config: { ...config, categories: withProducts, productsKey: 'structure:products:' }, products: shopProducts, save: async (key, value) => saved.push([key, value]), go: () => {}, notify: () => {} });

        const ticked = () => [...ui.body.querySelectorAll('.le-product-row input')].filter((t) => t.checked).map((t) => t.value);
        const pick = ui.body.querySelector('.le-category-like');
        pick.value = 'shop/speakers';
        pick.dispatchEvent(new Event('change'));
        expect(ticked()).toEqual(['studio']);

        const cable = [...ui.body.querySelectorAll('.le-product-row input')].find((t) => t.value === 'cable');
        cable.checked = true;
        cable.dispatchEvent(new Event('change'));
        const name = ui.body.querySelector('.le-name-title');
        name.value = 'Cables';
        name.dispatchEvent(new Event('input'));
        ui.foot.querySelector('.le-create-category').click();
        await tick();
        expect(saved[1]).toEqual(['structure:products:cables', '["studio","cable"]']);
    });
});

