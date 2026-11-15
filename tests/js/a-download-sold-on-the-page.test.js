import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachADownload, renderShopPanel } from '../../resources/js/shop.js';
import { pageForTheChat } from '../../resources/js/chat-page.js';

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
    downloads: { attach: '/sites/adas-pot/downloads', start: '/sites/adas-pot/downloads/start', finish: '/sites/adas-pot/downloads/finish', token: 't', room: '300 MB', accept: '.pdf,.zip' },
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
        // no size of its own: the room the plan leaves
        expect(rows[0].querySelector('.le-upload-hint').textContent).toBe('A PDF, zip, audio or video file. This website has 300 MB free');
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

    describe('the one way a file is attached, by click or by Ask AI', () => {
        afterEach(() => { vi.restoreAllMocks(); delete window.liveEditShop; });

        const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

        it('uploads straight to the host\'s storage by the address it gives, then says it arrived', async () => {
            const shop = structuredClone(config);
            const fetched = vi.spyOn(globalThis, 'fetch')
                .mockResolvedValueOnce(json({ ok: true, upload: { id: 'u1', url: 'https://bucket.example/7/The Pot.pdf?signed', headers: { 'Content-Type': ['application/pdf'], Host: ['bucket.example'] } } }))
                .mockResolvedValueOnce(json({ ok: true, file: { name: 'The Pot.pdf', size: 4 } }));
            const sent = [];
            class FakeUpload {
                constructor() { this.upload = {}; this.headers = {}; }
                open(method, url) { this.method = method; this.url = url; }
                setRequestHeader(name, value) { this.headers[name] = value; }
                send(body) { sent.push(this); this.status = 200; this.upload.onprogress?.({ lengthComputable: true, loaded: 2, total: 4 }); this.onload(); }
            }
            vi.stubGlobal('XMLHttpRequest', FakeUpload);
            const parts = [];

            expect(await attachADownload(shop.products[0], new File(['%PDF'], 'The Pot.pdf', { type: 'application/pdf' }), shop, (p) => parts.push(p))).toEqual({ name: 'The Pot.pdf', size: 4 });
            expect(JSON.parse(fetched.mock.calls[0][1].body)).toEqual({ product: 'cookbook', name: 'The Pot.pdf', size: 4, type: 'application/pdf' });
            expect(fetched.mock.calls[0][1].headers['X-CSRF-TOKEN']).toBe('t');
            // the file itself goes to the storage's address, never through the host's server
            expect(sent[0].method).toBe('PUT');
            expect(sent[0].url).toBe('https://bucket.example/7/The Pot.pdf?signed');
            expect(sent[0].headers).toEqual({ 'Content-Type': 'application/pdf' });
            expect(parts).toEqual([0.5]);
            expect(fetched.mock.calls[1][0]).toBe('/sites/adas-pot/downloads/finish');
            expect(JSON.parse(fetched.mock.calls[1][1].body)).toEqual({ upload: 'u1' });
            expect(shop.products[0].file).toEqual({ name: 'The Pot.pdf', size: 4 });
            vi.unstubAllGlobals();
        });

        it('sends the file in the request where the host gives no upload address', async () => {
            const shop = structuredClone(config);
            const fetched = vi.spyOn(globalThis, 'fetch')
                .mockResolvedValueOnce(json({ ok: true, direct: false }))
                .mockResolvedValueOnce(json({ ok: true, file: { name: 'The Pot.pdf', size: 4 } }));

            expect(await attachADownload(shop.products[0], new File(['%PDF'], 'The Pot.pdf'), shop)).toEqual({ name: 'The Pot.pdf', size: 4 });
            expect(fetched.mock.calls[1][0]).toBe('/sites/adas-pot/downloads');
            expect(fetched.mock.calls[1][1].body.get('product')).toBe('cookbook');
        });

        it('passes on the host\'s refusal in its own words, before anything is uploaded', async () => {
            const shop = structuredClone(config);
            const room = 'Your website has no room left for this file. It is 1.2 GB, and your website has 300 MB free of its 1 GB. Remove files you no longer use, or upgrade to Pro for 5 GB of storage.';
            const fetched = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: false, error: room }, 422));

            await expect(attachADownload(shop.products[0], new File(['x'], 'course.zip'), shop)).rejects.toThrow(room);
            expect(fetched).toHaveBeenCalledTimes(1);
        });

        it('a refusal for room asks the editor for Get more storage, with where more is got', async () => {
            const shop = structuredClone(config);
            const full = 'This upload is 1.2 GB, and this website has 300 MB left of 1 GB its hosting gives it. To add more, upgrade to Pro for 5 GB or add 1 GB for a year for ₦4,000.';
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: false, error: full, storage: true, upgrade: 'https://console.test/billing?site=adas-pot#storage' }, 422));
            const heard = [];
            const listen = (event) => heard.push(event.detail);
            window.addEventListener('live-edit:storage-full', listen);

            await expect(attachADownload(shop.products[0], new File(['x'], 'course.zip'), shop)).rejects.toThrow(full);
            window.removeEventListener('live-edit:storage-full', listen);
            expect(heard).toEqual([{ message: full, upgrade: 'https://console.test/billing?site=adas-pot#storage' }]);
        });

        it('tells Ask AI the downloads, with the file each gives now', () => {
            window.liveEditShop = structuredClone({ ...config, products: [{ ...config.products[0], file: { name: 'The Pot.pdf', size: 4 } }, config.products[1]] });
            document.body.innerHTML = '<main><h1 data-edit="setting:tpl:h1">The e-cookbook</h1></main>';

            expect(pageForTheChat(document).downloads).toEqual([{ product: 'cookbook', name: 'The Pot, volume one', file: 'The Pot.pdf' }]);
        });
    });
});
