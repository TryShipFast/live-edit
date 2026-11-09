import { describe, expect, it } from 'vitest';
import { parseCsv, readRows, renderImport, sampleFile, undoTheLastImport, whatAnImportSaves, UNDO_KEY } from '../../resources/js/catalogue.js';

/*
 * Import products (1 Nov 2026, the owner: "in real life, people import products", "make sure you let
 * them see a template they can follow"). A sample file made from the shop, every row checked before
 * anything is saved, the good ones saved as the catalogue and added to their categories, and the last
 * import taken back.
 */
const categories = [
    { id: 'shop', title: 'All products', has: ['arc', 'cable'], chosen: null, productsKey: 'structure:products:shop' },
    { id: 'shop/headphones', title: 'Headphones', has: ['arc'], chosen: null, productsKey: 'structure:products:shop/headphones' },
    { id: 'shop/charging', title: 'Chargers and cables', has: ['cable'], chosen: ['cable'], productsKey: 'structure:products:shop/charging' },
];
const likes = [
    { id: 'products/arc', product: 'arc', title: 'Arc', price: '$189' },
    { id: 'products/cable', product: 'cable', title: 'USB-C cable, 2 m', price: '$19' },
];
const products = [{ id: 'arc', name: 'Arc' }, { id: 'cable', name: 'USB-C cable, 2 m' }];

describe('importing products', () => {
    it('reads a file with quotes, commas inside them and semicolons', () => {
        expect(parseCsv('name,price\r\n"Cable, braided",$12\r\n')).toEqual([['name', 'price'], ['Cable, braided', '$12']]);
        expect(parseCsv('name;price\nWax;£24\n')).toEqual([['name', 'price'], ['Wax', '£24']]);
        expect(parseCsv('﻿name,price\n"say ""hi""",1\n')[1][0]).toBe('say "hi"');
    });

    it('offers a sample file with the shop’s own columns, categories and products, which reads back clean', () => {
        const sample = sampleFile({ categories, likes, products });
        const rows = parseCsv(sample);
        expect(rows[0]).toEqual(['name', 'price', 'sku', 'photo', 'categories', 'looks like']);
        expect(rows[1]).toEqual(['Arc (example)', '$189', '', '', 'Headphones', 'Arc']);
        expect(readRows(rows, { categories, likes, products }).problems).toEqual([]);
    });

    it('checks every row and says what to fix, before anything is saved', () => {
        const rows = parseCsv([
            'name,price,photo,categories,looks like',
            'Braided cable,$12,https://images.example/c.jpg,Chargers and cables,',
            ',$9,,,',
            'Pouch,free,,,',
            'Stand,$30,http://x.example/s.jpg,Furniture,',
            'Mystery,$5,,,Teleporter',
        ].join('\n'));
        const { ready, problems } = readRows(rows, { categories, likes, products });

        expect(ready).toEqual([{ id: 'braided-cable', name: 'Braided cable', price: '$12', photo: 'https://images.example/c.jpg', categories: ['shop/charging'], like: 'products/cable' }]);
        expect(problems.map((p) => p.says)).toEqual([
            'Row 3: it has no name.',
            'Row 4 (Pouch): its price "free" has no figure.',
            'Row 5 (Stand): its photo is not a web address starting https://, the shop has no category "Furniture".',
            'Row 6 (Mystery): the shop has no product "Teleporter" to make it like.',
        ]);
    });

    it('gives each product an address of its own, never one the shop uses', () => {
        const rows = parseCsv('name,price\nArc,$1\nArc,$2\nBraided cable,$3\n');
        const { ready } = readRows(rows, { categories, likes, products, catalogue: [{ id: 'braided-cable' }] });
        expect(ready.map((p) => p.id)).toEqual(['arc-2', 'arc-3', 'braided-cable-2']);
    });

    it('saves the catalogue and adds each product to its categories and to All products', () => {
        const ready = [{ id: 'braided-cable', name: 'Braided cable', price: '$12', photo: '', categories: ['shop/charging'], like: 'products/cable' }];
        const plan = whatAnImportSaves({ ready, catalogue: [{ id: 'old' }], categories });
        expect(plan.catalogue.map((p) => p.id)).toEqual(['old', 'braided-cable']);
        expect(plan.writes).toEqual([
            { key: 'structure:products:shop', before: null, value: ['arc', 'cable', 'braided-cable'] },
            { key: 'structure:products:shop/charging', before: ['cable'], value: ['cable', 'braided-cable'] },
        ]);
    });

    it('imports from the window and takes the last import back', async () => {
        const body = document.createElement('div');
        const foot = document.createElement('div');
        const ui = { body, foot, title: () => {}, subtitle: () => {}, allowDismiss: () => {} };
        const saved = [];
        const store = new Map();
        const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
        let said = null;
        const config = { categories, taken: [], catalogue: { key: 'structure:catalogue', items: [], likes } };
        const window = renderImport({ ui, config, products, save: async (k, v) => saved.push([k, v]), done: (m) => (said = m), notify: () => {}, storage });

        expect(body.querySelector('.le-import-sample').getAttribute('download')).toBe('products-sample.csv');
        window.check('name,price,categories\nBraided cable,$12,Chargers and cables\n');
        foot.querySelector('.le-import-go').disabled = false;
        foot.querySelector('.le-import-go').click();
        await new Promise((r) => setTimeout(r, 0));
        expect(saved[0][0]).toBe('structure:catalogue');
        expect(JSON.parse(saved[0][1])[0].id).toBe('braided-cable');
        expect(said).toContain('1 product imported');

        saved.length = 0;
        expect(await undoTheLastImport({ config, save: async (k, v) => saved.push([k, v]), storage })).toBe(1);
        expect(saved).toEqual([['structure:catalogue', '[]'], ['structure:products:shop', ''], ['structure:products:shop/charging', '["cable"]']]);
        expect(store.has(UNDO_KEY)).toBe(false);
    });
});
