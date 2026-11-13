// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
    COL, choosableCollections, collectionsSaid, freshSku, freshSkuWrites, gridRows, keepSizesInStep, priceAsWritten, productsPlan,
    readProduct, rowCells, sharedSkus, shownColumns,
} from '../../resources/js/products.js';
import { readRows, sampleFile } from '../../resources/js/catalogue.js';
import { renderShopPanel } from '../../resources/js/shop.js';

/*
 * A shop's products in one grid (owner, 8 Nov 2026: "live edit should be sufficient to setup their store"), and what
 * comes with it: an SKU checked in an import and in Add a product, a copy's own SKU, pay on delivery per delivery choice
 * and the shop's discount codes in the Shop tab. Every write is a word the product page already holds or a list the
 * shop already keeps (LIVE-EDIT-STRUCTURE.md, "The Products grid", "Every product has an SKU", "Pay on delivery ...").
 */

const productPage = (slug = 'kemi', sku = 'OYK-1003') => new DOMParser().parseFromString(`
  <main><section data-instance="p.detail">
    <div class="gallery"><img src="../../assets/${slug}.jpg" data-edit="image"></div>
    <div class="buy" data-kit-product="${slug}">
      <h1 data-kit-name data-edit="setting:tpl:${slug}.h">Kemi gingham dress</h1>
      <p><span data-edit="setting:tpl:${slug}.sku-word">SKU:</span> <span data-kit-sku data-edit="setting:tpl:${slug}.sku">${sku}</span><span data-kit-sku-now data-kit-computed="sku" hidden></span></p>
      <p><span data-kit-price data-edit="setting:tpl:${slug}.price">₦74,950</span></p>
      <p data-kit-sale><span data-kit-sale-price data-edit="setting:tpl:${slug}.sale">No sale</span></p>
      <div data-options data-list="szs">
        <label data-item="t1"><span data-kit-variant data-edit="setting:tpl:${slug}.n1">4–5 years</span><span data-kit-price data-edit="setting:tpl:${slug}.p1">₦74,950</span><span data-kit-sku hidden data-edit="setting:tpl:${slug}.s1">${sku}-4-5Y</span></label>
        <label data-item="t2"><span data-kit-variant data-edit="setting:tpl:${slug}.n2">5–6 years</span><span data-kit-price data-edit="setting:tpl:${slug}.p2">₦79,950</span><span data-kit-sku hidden data-edit="setting:tpl:${slug}.s2">${sku}-5-6Y</span></label>
      </div>
    </div>
    <ul data-list="also"><li data-item="t1" data-kit-product="ada"><a data-kit-action="commerce.product" href="../ada/">Ada</a><span data-kit-price>₦89,950</span></li></ul>
  </section></main>`, 'text/html');

const collections = [
    { id: 'shop', title: 'Shop', productsKey: 'structure:products:shop', has: ['kemi', 'ada', 'tobi'] },
    { id: 'shop/girls', title: 'Girls', productsKey: 'structure:products:shop/girls', has: ['kemi', 'ada'] },
    { id: 'shop/party', title: 'Party', productsKey: 'structure:products:shop/party', has: ['ada'] },
];
const featured = { key: 'structure:products:home', has: ['ada', 'tobi'], title: 'Featured' };

describe('a product page, read for the grid', () => {
    it('reads its name, price, SKU, first photo and each size with the key each is saved under', () => {
        const read = readProduct(productPage(), 'https://shop.test/edit/products/kemi/');
        expect(read.name).toMatchObject({ words: 'Kemi gingham dress', key: 'setting:tpl:kemi.h' });
        expect(read.price).toMatchObject({ words: '₦74,950', key: 'setting:tpl:kemi.price' });
        expect(read.sku).toMatchObject({ words: 'OYK-1003', key: 'setting:tpl:kemi.sku' });
        expect(read.photo).toBe('https://shop.test/edit/assets/kemi.jpg');
        expect(read.sizes.map((size) => [size.label, size.price.words, size.sku.words])).toEqual([
            ['4–5 years', '₦74,950', 'OYK-1003-4-5Y'],
            ['5–6 years', '₦79,950', 'OYK-1003-5-6Y'],
        ]);
    });

    it('is no product where the page has no buy box', () => {
        expect(readProduct(new DOMParser().parseFromString('<main><h1>About</h1></main>', 'text/html'))).toBeNull();
    });
});

describe('the grid', () => {
    const products = () => [{ id: 'kemi', name: 'Kemi gingham dress', href: '/edit/products/kemi', path: '/edit/products/kemi', read: readProduct(productPage()) }];

    it('has a row for each product and each of its sizes, with its collections and whether it is featured', () => {
        const list = products();
        const rows = gridRows(list);
        expect(rows.map((row) => row.kind)).toEqual(['product', 'size', 'size']);
        const choosable = choosableCollections(collections);
        expect(choosable.map((c) => c.id)).toEqual(['shop/girls', 'shop/party']);
        const cells = rows.map((row) => rowCells(row, list, { collections: choosable, featured }));
        expect(cells[0][COL.name]).toBe('Kemi gingham dress');
        expect(cells[0][COL.sku]).toBe('OYK-1003');
        expect(collectionsSaid(cells[0][COL.collections], choosable)).toBe('Girls');
        expect(cells[0][COL.featured]).toBe('');
        expect(cells[2][COL.name]).toBe('5–6 years');
        expect(cells[2][COL.price]).toBe('₦79,950');
    });

    it('shows the columns chosen in this browser, the name always', () => {
        expect(shownColumns(['sku'], ['photo', 'name', 'price', 'sku', 'stock'])).toEqual(['name', 'sku']);
        expect(shownColumns(null, ['name', 'price'])).toEqual(['name', 'price']);
    });

    it('marks an SKU two rows share, whatever its case, never an empty one', () => {
        expect([...sharedSkus(['OYK-1', 'oyk-1 ', '', '', 'OYK-2'])]).toEqual([0, 1]);
    });

    it('keeps sizes priced as the product was in step with its new price; a size with its own keeps it', () => {
        const list = products();
        const rows = gridRows(list);
        const cells = rows.map((row) => rowCells(row, list, {}));
        const moved = keepSizesInStep(rows, (i) => cells[i], 0, '₦74,950', '₦69,950');
        expect(moved).toEqual([1]);
        expect(cells[1][COL.price]).toBe('₦69,950');
        expect(cells[2][COL.price]).toBe('₦79,950');
        expect(priceAsWritten('69950', '₦74,950')).toBe('₦69,950');
        expect(priceAsWritten('free', '₦74,950')).toBeNull();
    });

    it('saves the words that changed on the product page, and the lists a tick changed', () => {
        const list = products();
        const rows = gridRows(list);
        const choosable = choosableCollections(collections);
        const cells = rows.map((row) => rowCells(row, list, { collections: choosable, featured }));
        cells[0][COL.price] = '69950';
        cells[0][COL.sku] = 'OYK-2000';
        cells[1][COL.sku] = 'OYK-2000-4-5Y';
        cells[0][COL.collections] = 'shop/girls|shop/party';
        cells[0][COL.featured] = '1';
        const plan = productsPlan(list, rows, cells, { collections: choosable, featured });
        expect(plan.refused).toEqual([]);
        expect(plan.writes.map(({ key, value }) => [key, value])).toEqual([
            ['setting:tpl:kemi.price', '₦69,950'],
            ['setting:tpl:kemi.sku', 'OYK-2000'],
            ['setting:tpl:kemi.s1', 'OYK-2000-4-5Y'],
        ]);
        expect(plan.lists).toEqual([
            { key: 'structure:products:shop/party', value: JSON.stringify(['ada', 'kemi']), title: 'Party', count: 2 },
            { key: 'structure:products:home', value: JSON.stringify(['ada', 'tobi', 'kemi']), title: 'Featured', count: 3 },
        ]);

        cells[0][COL.collections] = '';
        cells[0][COL.featured] = '';
        const out = productsPlan(list, rows, cells, { collections: choosable, featured });
        expect(out.lists.map(({ key, value }) => [key, value])).toEqual([['structure:products:shop/girls', JSON.stringify(['ada'])]]);
    });

    it('refuses a price with no figure and a product with no name, saying which', () => {
        const list = products();
        const rows = gridRows(list);
        const cells = rows.map((row) => rowCells(row, list, {}));
        cells[0][COL.price] = 'soon';
        cells[0][COL.name] = '';
        const plan = productsPlan(list, rows, cells, {});
        expect(plan.refused).toEqual(['A product in row 1 has no name. Give it one, or press Undo changes.', 'The price of Kemi gingham dress needs its figure, like ₦74,950.']);
        expect(plan.writes).toEqual([]);
    });
});

describe('a copied product starts with an SKU of its own', () => {
    it('adds -COPY, or the next free number', () => {
        expect(freshSku('OYK-1003')).toBe('OYK-1003-COPY');
        expect(freshSku('OYK-1003-COPY')).toBe('OYK-1003-COPY-2');
        expect(freshSku('OYK-1003', ['oyk-1003-copy'])).toBe('OYK-1003-COPY-2');
        expect(freshSku('')).toBe('');
    });

    it('writes the copy\'s own keys: the product\'s SKU and each size\'s', () => {
        const original = productPage('kemi', 'OYK-1003');
        const copy = productPage('copy', 'OYK-1003');
        expect(freshSkuWrites(original, copy, { 'tpl:kemi.sku': 'OYK-9000' })).toEqual([
            { key: 'tpl:copy.sku', value: 'OYK-9000-COPY' },
            { key: 'tpl:copy.s1', value: 'OYK-1003-4-5Y-COPY' },
            { key: 'tpl:copy.s2', value: 'OYK-1003-5-6Y-COPY' },
        ]);
    });
});

describe('an SKU in Import products and Add a product', () => {
    const shop = { categories: [{ id: 'shop/girls', title: 'Girls', has: ['kemi'] }], likes: [{ id: 'products/kemi', product: 'kemi', title: 'Kemi gingham dress' }] };

    it('reads an optional sku column, in any case, and keeps it on the product', () => {
        const { ready, problems } = readRows([['Name', 'Price', 'SKU'], ['Tobi tee', '₦12,000', 'OYK-2001'], ['Bisi tee', '₦12,000', '']], shop);
        expect(problems).toEqual([]);
        expect(ready[0].sku).toBe('OYK-2001');
        expect(ready[1]).not.toHaveProperty('sku');
    });

    it('says where an SKU is already used: another row, a product the shop sells, one of its own', () => {
        const { problems } = readRows([
            ['name', 'price', 'sku'],
            ['Tobi tee', '₦12,000', 'OYK-2001'],
            ['Bisi tee', '₦12,000', 'oyk-2001'],
            ['Ada dress', '₦12,000', 'OYK-1003'],
            ['Femi cap', '₦12,000', 'OWN-1'],
        ], { ...shop, known: [{ sku: 'OYK-1003', name: 'Kemi gingham dress' }], catalogue: [{ id: 'cap', name: 'Femi hat', sku: 'own-1' }] });
        expect(problems.map((p) => p.says)).toEqual([
            "Row 3 (Bisi tee): its SKU oyk-2001 is already row 2's (Tobi tee).",
            "Row 4 (Ada dress): its SKU OYK-1003 is already Kemi gingham dress's.",
            "Row 5 (Femi cap): its SKU OWN-1 is already Femi hat's.",
        ]);
    });

    it('puts an sku column in the sample file, with the design product\'s own', () => {
        const file = sampleFile({ categories: shop.categories, likes: shop.likes, products: [{ id: 'kemi', name: 'Kemi gingham dress', price: '₦74,950', sku: 'OYK-1003' }] });
        expect(file.split('\r\n')[0]).toBe('name,price,sku,photo,categories,looks like');
        expect(file).toContain('Kemi gingham dress (example),"₦74,950",OYK-1003,,Girls,Kemi gingham dress');
    });

    it('refuses a new product whose SKU another product has, in the Shop tab', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const said = [];
        const saved = [];
        renderShopPanel({
            container, config: { products: [{ id: 'kemi', name: 'Kemi gingham dress', href: '/edit/products/kemi' }], fields: [] }, save: async (k, v) => saved.push([k, v]), notify: (m) => said.push(m),
            catalogue: { key: 'structure:catalogue', items: [], likes: shop.likes }, knownSkus: async () => [{ sku: 'OYK-1003', name: 'Kemi gingham dress' }],
        });
        container.querySelector('.le-shop-add-product').click();
        container.querySelector('#le-shop-new-name').value = 'Tobi tee';
        container.querySelector('#le-shop-new-price').value = '₦12,000';
        container.querySelector('#le-shop-new-sku').value = 'OYK-1003';
        container.querySelector('.le-shop-new-product .le-shop-new-go').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(said).toEqual(["Its SKU OYK-1003 is already Kemi gingham dress's."]);
        expect(saved).toEqual([]);

        container.querySelector('#le-shop-new-sku').value = 'OYK-2001';
        container.querySelector('.le-shop-new-product .le-shop-new-go').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(JSON.parse(saved[0][1])[0]).toMatchObject({ name: 'Tobi tee', sku: 'OYK-2001' });
        container.remove();
    });
});

describe('the Shop tab: products, collections, pay on delivery and discount codes', () => {
    const delivery = {
        listKey: 'list', ids: ['t1', 't2'], max: 6, copyOf: 't1', source: { nameKeys: ['name'], priceKeys: ['price'] },
        choices: [
            { id: 't1', standard: true, way: 'std', name: 'Lagos', nameKeys: ['name'], price: '₦3,500', priceKeys: ['price'] },
            { id: 't2', standard: false, way: 'exp', name: 'Abuja', nameKeys: ['name2'], price: '₦8,000', priceKeys: ['price2'] },
        ],
    };

    it('opens every product in one grid, and calls them collections', () => {
        const container = document.createElement('div');
        let opened = 0;
        renderShopPanel({ container, config: { products: [{ id: 'kemi', name: 'Kemi', href: '/k' }], fields: [] }, save: async () => {}, products: () => { opened += 1; }, categories: collections, newCategory: () => {} });
        container.querySelector('.le-shop-products-grid').click();
        expect(opened).toBe(1);
        expect(container.querySelector('[data-shop-part="categories"] h3').textContent).toBe('Collections');
        expect(container.querySelector('.le-new-category-btn').textContent).toBe('+ New collection');
    });

    it('lists products sold as cards on a shared page, each Edit opening that page, with no grid that cannot read them', () => {
        // The Speaker's three books are cards on The book page (owner, 13 Nov 2026: they were missing from the Shop tab)
        const container = document.createElement('div');
        const shown = '/sites/demo/edit/the-book';
        renderShopPanel({ container, config: { products: [{ id: 'hardback', name: 'Hardback', shown }, { id: 'signed-hardback', name: 'Signed hardback', shown }], fields: [] }, save: async () => {}, products: () => {} });
        const rows = [...container.querySelectorAll('.le-shop-product')];
        expect(rows.map((row) => row.querySelector('.le-shop-name').textContent)).toEqual(['Hardback', 'Signed hardback']);
        expect(rows.map((row) => row.querySelector('.le-shop-edit').getAttribute('href'))).toEqual([shown, shown]);
        expect(container.querySelector('[data-shop-part="products"] h3').textContent).toBe('Your products (2)');
        expect(container.querySelector('.le-shop-products-grid')).toBeNull();
    });

    it('ticks pay on delivery per delivery choice, saved as one list of ways', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const saved = [];
        renderShopPanel({ container, config: { fields: [], delivery, payOnDelivery: { key: 'shop.payOnDelivery', ways: [] } }, save: async (k, v) => saved.push([k, v]), done: () => {} });
        const ticks = container.querySelectorAll('.le-shop-pay-on-delivery input');
        expect(ticks).toHaveLength(2);
        expect(container.querySelector('.le-shop-pay-on-delivery').textContent).toContain('Customers can pay when it arrives');
        ticks[1].checked = true;
        ticks[1].dispatchEvent(new Event('change'));
        container.querySelector('.le-row button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([['shop.payOnDelivery', JSON.stringify(['exp'])]]);
        container.remove();
    });

    it('lists the discount codes with how many orders used each, adds one and saves the list', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const saved = [];
        const said = [];
        const offers = { key: 'shop.offers', list: [{ code: 'WELCOME10', kind: 'percent', value: 10, ends: null, limit: 100, on: true }], used: { WELCOME10: 3 }, kinds: [{ value: 'percent', label: '% off' }, { value: 'amount', label: 'Amount off' }, { value: 'delivery', label: 'Free delivery' }] };
        renderShopPanel({ container, config: { fields: [], offers }, save: async (k, v) => saved.push([k, v]), done: () => {}, notify: (m) => said.push(m) });
        const part = container.querySelector('[data-shop-part="offers"]');
        expect(part.querySelector('.le-shop-code-used').textContent).toBe('Used by 3 orders.');
        part.querySelector('.le-shop-add-code').click();
        const added = part.querySelectorAll('.le-shop-code')[1];
        added.querySelector('.le-shop-code-name').value = 'x';
        container.querySelector('.le-row button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(said).toEqual(['X: a code uses 2 to 30 letters or numbers, like WELCOME10.']);

        added.querySelector('.le-shop-code-name').value = 'lagos2k';
        added.querySelector('.le-shop-code-kind').value = 'amount';
        added.querySelector('.le-shop-code-value').value = '₦2,000';
        added.querySelector('.le-shop-code-ends').value = '2026-12-31';
        container.querySelector('.le-row button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved).toEqual([['shop.offers', JSON.stringify([
            { code: 'WELCOME10', kind: 'percent', value: 10, ends: null, limit: 100, on: true },
            { code: 'LAGOS2K', kind: 'amount', value: 2000, ends: '2026-12-31', limit: null, on: true },
        ])]]);
        container.remove();
    });
});
