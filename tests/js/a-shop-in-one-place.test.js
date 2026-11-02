import { describe, expect, it } from 'vitest';
import { renderShopPanel, whatsappNumber, withWhatsappNumber } from '../../resources/js/shop.js';

/*
 * The Shop tab edits the words the pages show: a term written on two pages
 * (the bag's delivery price and the checkout's) is one field saved to both,
 * and the WhatsApp number is the number in the checkout's link.
 */
const config = {
    products: [{ name: 'After Rain', href: '/edit/products/after-rain' }],
    checkout: { href: '/edit/checkout', modes: [{ id: 'whatsapp', label: 'Continue on WhatsApp', needs: ["the shop's WhatsApp number"] }] },
    fields: [
        { keys: ['wa'], label: 'WhatsApp number', kind: 'whatsapp', value: 'https://wa.me/15555550100?text=Hello' },
        { keys: ['bag.std', 'checkout.std'], label: 'Standard, 3 to 6 working days', kind: 'text', value: '$8' },
    ],
};

describe('the shop in one place', () => {
    it('reads and rewrites the number in a WhatsApp link, keeping its message', () => {
        expect(whatsappNumber('https://wa.me/15555550100?text=Hi')).toBe('15555550100');
        expect(withWhatsappNumber('https://wa.me/15555550100?text=Hi', '+44 7700 900123')).toBe('https://wa.me/447700900123?text=Hi');
        expect(withWhatsappNumber('', '447700900123')).toBe('https://wa.me/447700900123');
    });

    it('lists the products and how customers pay', () => {
        const container = document.createElement('div');
        renderShopPanel({ container, config, save: async () => {} });

        expect(container.textContent).toContain('Your products (1)');
        expect(container.querySelector('.le-shop-product .le-shop-name').textContent).toBe('After Rain');
        expect(container.querySelector('a[href="/edit/products/after-rain"]').textContent).toBe('Edit');
        expect(container.textContent).toContain("Needs the shop's WhatsApp number.");
    });

    it('saves a term to every page that writes it, and only what changed', async () => {
        const container = document.createElement('div');
        const saved = [];
        let finished = '';
        const { inputs } = renderShopPanel({ container, config, save: async (key, value) => saved.push([key, value]), done: (m) => { finished = m; } });

        const of = (kind) => inputs.find((i) => i.spec.kind === kind).input;
        of('text').value = '$9';
        of('whatsapp').value = '447700900123';
        container.querySelector('button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));

        expect(saved).toEqual([['bag.std', '$9'], ['checkout.std', '$9'], ['wa', 'https://wa.me/447700900123?text=Hello']]);
        expect(finished).toContain('saved');
    });

    it('refuses a WhatsApp number too short to be one', async () => {
        const container = document.createElement('div');
        const saved = [];
        const said = [];
        const { inputs } = renderShopPanel({ container, config, save: async (k, v) => saved.push(v), notify: (m) => said.push(m) });

        inputs.find((i) => i.spec.kind === 'whatsapp').input.value = '123';
        container.querySelector('button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));

        expect(saved).toEqual([]);
        expect(said[0]).toContain('too short');
    });

    it('gives every delivery choice a name and a price the owner sets, and saves each where the pages write it', async () => {
        const container = document.createElement('div');
        const saved = [];
        renderShopPanel({
            container,
            config: { products: [], checkout: { modes: [] }, fields: [
                { keys: ['bag.std', 'checkout.std'], label: 'Royal Mail tracked, 2 to 3 working days', name: 'Royal Mail tracked, 2 to 3 working days', nameKeys: ['checkout.ship-std'], kind: 'rate', value: '£4.50' },
                { keys: ['footer.free'], label: 'Free delivery over', kind: 'text', value: '£40' },
            ] },
            save: async (key, value) => saved.push([key, value]),
            done: () => {},
        });
        const part = container.querySelector('[data-shop-part="delivery"]');
        expect(part.querySelector('.le-shop-heading').textContent).toBe('Delivery');
        const [name, price, free] = part.querySelectorAll('input');
        expect(part.querySelector(`label[for="${name.id}"]`).textContent).toBe('Name customers see');
        expect(name.value).toBe('Royal Mail tracked, 2 to 3 working days');
        expect(free.placeholder).toBe('₦50,000');
        expect(price.placeholder).toBe('₦3,000');

        name.value = 'Lagos, 1 to 2 days';
        price.value = '£3';
        container.querySelector('button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([['checkout.ship-std', 'Lagos, 1 to 2 days'], ['bag.std', '£3'], ['checkout.std', '£3']]);
    });

    it('refuses a delivery choice without a name', async () => {
        const container = document.createElement('div');
        const said = [];
        renderShopPanel({ container, config: { fields: [{ keys: ['r'], nameKeys: ['n'], name: 'Standard', label: 'Standard', kind: 'rate', value: '₦2,000' }] }, save: async () => {}, notify: (m) => said.push(m) });
        container.querySelector('[data-shop-part="delivery"] input').value = '  ';
        container.querySelector('button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(said[0]).toContain('needs a name');
    });

    it('writes every example in naira, never in the sample prices\' currency', () => {
        const container = document.createElement('div');
        renderShopPanel({ container, config: { fields: [{ keys: ['r'], label: 'Standard', kind: 'rate', value: '£4.50' }] }, save: async () => {} });
        expect(container.querySelector('[data-shop-part="delivery"] .le-hint').textContent).toContain('₦3,000');
        expect([...container.querySelectorAll('input')].map((i) => i.placeholder).join(' ')).not.toMatch(/[£$€]/);
    });

    it('adds a product from a name, a price and its categories, written as an import writes it', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const saved = [];
        let finished = '';
        const categories = [
            { id: 'shop', title: 'All products', href: '/e/shop', productsKey: 'p:shop', has: ['wax'], copies: ['a'] },
            { id: 'shop/care', title: 'Care', href: '/e/shop/care', productsKey: 'p:care', has: ['wax'], copies: ['b'] },
            { id: 'shop/gifts', title: 'Gifts', href: '/e/shop/gifts', productsKey: 'p:gifts', has: [], copies: ['c'] },
        ];
        renderShopPanel({
            container,
            config: { products: [{ id: 'wax', name: 'Paste wax', href: '/e/products/wax' }], fields: [] },
            categories,
            newCategory: () => {},
            catalogue: { key: 'structure:catalogue', items: [], drawn: [], likes: [{ id: 'products/wax', product: 'wax', title: 'Paste wax', price: '₦12,000' }] },
            save: async (key, value) => saved.push([key, value]),
            upload: async () => '/uploads/kit.jpg',
            done: (m) => { finished = m; },
        });
        const add = container.querySelector('.le-shop-add-product');
        const form = container.querySelector('.le-shop-new-product');
        expect(form.hidden).toBe(true);
        add.click();
        expect(form.hidden).toBe(false);
        expect([...form.querySelectorAll('.le-check')].map((l) => l.textContent.trim())).toEqual(['Care', 'Gifts']);

        form.querySelector('#le-shop-new-name').value = 'Ceramic coating kit';
        form.querySelector('#le-shop-new-price').value = '₦45,000';
        form.querySelectorAll('.le-check input')[1].checked = true;
        form.querySelector('.le-shop-new-go').click();
        await new Promise((r) => setTimeout(r, 0));

        expect(saved[0][0]).toBe('structure:catalogue');
        expect(JSON.parse(saved[0][1])).toEqual([{ id: 'ceramic-coating-kit', name: 'Ceramic coating kit', price: '₦45,000', photo: '', categories: ['shop/gifts'], like: 'products/wax' }]);
        expect(saved.slice(1)).toEqual([['p:shop', JSON.stringify(['wax', 'ceramic-coating-kit'])], ['p:gifts', JSON.stringify(['ceramic-coating-kit'])]]);
        expect(finished).toContain('Ceramic coating kit is added');
    });

    it('says what is wrong with a product before adding it', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const said = [];
        const saved = [];
        renderShopPanel({
            container, config: { products: [], fields: [] }, save: async (k) => saved.push(k), notify: (m) => said.push(m),
            catalogue: { key: 'c', items: [], drawn: [], likes: [{ id: 'products/wax', product: 'wax', title: 'Wax' }] },
        });
        container.querySelector('#le-shop-new-name').value = 'Kit';
        container.querySelector('#le-shop-new-price').value = 'soon';
        container.querySelector('.le-shop-new-go').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([]);
        expect(said[0]).toBe('Its price "soon" has no figure.');
    });

    it('removes one of the owner’s own products from the shop and every category showing it', async () => {
        const container = document.createElement('div');
        const saved = [];
        window.confirm = () => true;
        renderShopPanel({
            container,
            config: { products: [], fields: [] },
            categories: [{ id: 'shop', title: 'All', href: '/e/shop', productsKey: 'p:shop', has: ['kit', 'wax'], copies: [] }],
            newCategory: () => {},
            catalogue: { key: 'c', items: [{ id: 'kit', name: 'Kit', price: '₦1', photo: '', categories: [], like: 'products/wax' }], drawn: [{ id: 'kit', href: '/e/products/kit' }], likes: [] },
            save: async (key, value) => saved.push([key, value]),
            done: () => {},
        });
        expect(container.querySelector('a[href="/e/products/kit"]').textContent).toBe('Edit');
        container.querySelector('.le-shop-remove').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([['c', '[]'], ['p:shop', JSON.stringify(['wax'])]]);
    });

    it('sets the currency every price is shown and charged in, Naira until the owner chooses', async () => {
        const container = document.createElement('div');
        const saved = [];
        renderShopPanel({
            container,
            config: { fields: [], currency: { key: 'shop.currency', value: 'NGN', options: [{ value: 'NGN', label: 'Naira (₦)' }, { value: 'GHS', label: 'Ghana cedi (GH₵)' }] } },
            save: async (key, value) => saved.push([key, value]),
            done: () => {},
        });
        const pick = container.querySelector('[data-shop-part="currency"] select');
        expect(pick.value).toBe('NGN');
        pick.value = 'GHS';
        container.querySelector('button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([['shop.currency', 'GHS']]);
    });

    it('offers the template\'s catalogue layouts as drawings, a paid one shown but not chosen on a free plan', async () => {
        const container = document.createElement('div');
        const saved = [];
        renderShopPanel({
            container,
            config: { fields: [], layouts: { key: 'shop.layout', value: 'top', options: [
                { id: 'top', label: 'Filters on top', hint: '', plan: 'all' },
                { id: 'side', label: 'Filters at the side', hint: '', plan: 'all' },
                { id: 'mosaic', label: 'Mosaic', hint: '', plan: 'paid' },
            ] } },
            save: async (key, value) => saved.push([key, value]),
            done: () => {},
        });
        const radios = [...container.querySelectorAll('[data-shop-part="layout"] input[type="radio"]')];
        expect(radios.map((r) => [r.value, r.checked, r.disabled])).toEqual([['top', true, false], ['side', false, false], ['mosaic', false, true]]);
        expect(container.querySelector('.le-shop-layout.is-locked').textContent).toContain('On paid plans');
        radios[1].checked = true;
        radios[1].dispatchEvent(new Event('change'));
        container.querySelector('button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([['shop.layout', 'side']]);
    });

    it('adds and removes a delivery choice the way Duplicate and Delete do on the page', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const saved = [];
        let finished = '';
        window.confirm = () => true;
        const delivery = {
            listKey: 'list', ids: ['t1', 'nold_t1'], max: 6, copyOf: 't1', source: { nameKeys: ['name'], priceKeys: ['price'] },
            choices: [
                { id: 't1', standard: true, name: 'Doorstep delivery', nameKeys: ['name'], price: '₦4,500', priceKeys: ['price', 'bag.price'] },
                { id: 'nold_t1', standard: false, name: 'Pick up in Ikeja', nameKeys: ['name@nold_t1'], price: '₦0', priceKeys: ['price@nold_t1'] },
            ],
        };
        renderShopPanel({ container, config: { fields: [], delivery }, save: async (key, value) => saved.push([key, value]), done: (m) => { finished = m; } });

        const part = container.querySelector('[data-shop-part="delivery"]');
        expect([...part.querySelectorAll('legend')].map((l) => l.textContent)).toEqual(['Standard delivery', 'Delivery choice 2']);
        expect(part.querySelectorAll('.le-shop-remove-choice')).toHaveLength(1);

        part.querySelector('.le-shop-add-choice').click();
        part.querySelector('#le-shop-new-choice-name').value = 'Lagos express, next day';
        part.querySelector('#le-shop-new-choice-price').value = '₦8,000';
        part.querySelector('.le-shop-new-choice .le-shop-new-go').click();
        await new Promise((r) => setTimeout(r, 0));
        const id = saved[0][0].split('@')[1];
        expect(id).toMatch(/^n[0-9a-z]+_t1$/);
        expect(saved).toEqual([[`name@${id}`, 'Lagos express, next day'], [`price@${id}`, '₦8,000'], ['list', JSON.stringify(['t1', 'nold_t1', id])]]);
        expect(finished).toContain('is added');

        saved.length = 0;
        part.querySelector('.le-shop-remove-choice').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([['list', JSON.stringify(['t1'])]]);

        saved.length = 0;
        part.querySelectorAll('input')[1].value = '₦5,000';
        container.querySelector('.le-row button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([['price', '₦5,000'], ['bag.price', '₦5,000']]);
    });

    it('sets how many products a shop page shows before Show more products', async () => {
        const container = document.createElement('div');
        const saved = [];
        renderShopPanel({ container, config: { fields: [], pageSize: { key: 'shop.pageSize', value: 12, options: [8, 12, 24] } }, save: async (k, v) => saved.push([k, v]), done: () => {} });
        const pick = container.querySelector('.le-shop-page-size');
        expect(pick.value).toBe('12');
        pick.value = '24';
        container.querySelector('.le-row button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([['shop.pageSize', '24']]);
    });
});
