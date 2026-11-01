import { describe, expect, it } from 'vitest';
import { leafCategories, renderNewCategory } from '../../resources/js/pages.js';
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

        expect([...container.querySelectorAll('.le-shop-category a')].map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
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

    it('makes a category from a name: the sections of the one it looks like, in the menu', async () => {
        const ui = fakeModal();
        const saved = [];
        let went = null;
        renderNewCategory({ ui, config, save: async (key, value) => saved.push([key, value]), go: (href) => (went = href), notify: () => {} });

        expect(ui.said.title).toBe('New category');
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
});
