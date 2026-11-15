import { describe, expect, it } from 'vitest';
import { renderShopPanel } from '../../resources/js/shop.js';

/*
 * A download sold on the page (owner, 15 Nov 2026: "pay now, then download"): the Shop tab shows, beside a product
 * the page sells as a download, the file buyers get once they pay, and takes a new one in the editor's one upload box.
 * A product that is posted shows no file at all.
 */
const config = {
    products: [
        { id: 'cookbook', name: 'The Pot, volume one', shown: '/edit/cookbook', download: true, file: null },
        { id: 'tote', name: 'Canvas tote', href: '/edit/shop/tote' },
    ],
    downloads: { attach: '/sites/adas-pot/downloads', token: 't', maxMb: 100, accept: '.pdf,.zip' },
    checkout: { href: '', modes: [] },
    fields: [],
};

describe('a download sold on the page', () => {
    it('says a download has no file yet, and only on the download', () => {
        const container = document.createElement('div');
        renderShopPanel({ container, config: structuredClone(config), save: async () => {}, attachFile: async () => null });

        const rows = [...container.querySelectorAll('.le-shop-product')];
        expect(rows[0].querySelector('.le-shop-download-file').textContent).toBe('No file yet. Add the file buyers download: until then nobody can pay for it.');
        expect(rows[0].querySelector('.le-upload input[type="file"]').accept).toBe('.pdf,.zip');
        expect(rows[0].querySelector('.le-upload-title').textContent).toBe('Upload the file');
        expect(rows[1].querySelector('.le-shop-download')).toBeNull();
    });

    it('attaches the file chosen and says what buyers now get', async () => {
        const container = document.createElement('div');
        const sent = [];
        const said = [];
        renderShopPanel({
            container, config: structuredClone(config), save: async () => {}, notify: (m) => said.push(m),
            attachFile: async (product, file) => { sent.push([product.id, file.name]); return { name: file.name, size: 2202010 }; },
        });

        const input = container.querySelector('.le-shop-download input[type="file"]');
        const file = new File(['%PDF'], 'The Pot.pdf', { type: 'application/pdf' });
        Object.defineProperty(input, 'files', { value: [file] });
        input.dispatchEvent(new Event('change'));
        await new Promise((r) => setTimeout(r, 0));

        expect(sent).toEqual([['cookbook', 'The Pot.pdf']]);
        expect(container.querySelector('.le-shop-download-file').textContent).toBe('File buyers download: The Pot.pdf (2.1 MB)');
        expect(said).toEqual(['The Pot, volume one: buyers now download The Pot.pdf after they pay.']);
    });

    it('says why a file was not taken, where the owner is looking', async () => {
        const container = document.createElement('div');
        const said = [];
        renderShopPanel({
            container, config: structuredClone({ ...config, products: [{ ...config.products[0], file: { name: 'Old.pdf', size: 2048 } }] }),
            save: async () => {}, notify: (m) => said.push(m),
            attachFile: async () => { throw new Error('Your website has no room left for this file.'); },
        });

        expect(container.querySelector('.le-upload-title').textContent).toBe('Replace the file');
        const input = container.querySelector('.le-shop-download input[type="file"]');
        Object.defineProperty(input, 'files', { value: [new File(['x'], 'New.pdf')] });
        input.dispatchEvent(new Event('change'));
        await new Promise((r) => setTimeout(r, 0));

        expect(said).toEqual(['Your website has no room left for this file.']);
        expect(container.querySelector('.le-shop-download-file').textContent).toBe('File buyers download: Old.pdf (2 KB)');
    });
});
