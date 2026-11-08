import { describe, expect, it } from 'vitest';
import { contrast, madeHardToRead, needs, over, parseColour, renderBrandPanel, toHex } from '../../resources/js/brand.js';

describe('the Brand tab reads colours the way a browser reports them', () => {
    it('reads hex, rgb, rgba and srgb colour()', () => {
        expect(parseColour('#abc')).toEqual([170, 187, 204, 1]);
        expect(parseColour('#5B1A3A')).toEqual([91, 26, 58, 1]);
        expect(parseColour('rgb(24, 50, 75)')).toEqual([24, 50, 75, 1]);
        expect(parseColour('rgba(0, 0, 0, 0.5)')).toEqual([0, 0, 0, 0.5]);
        expect(parseColour('color(srgb 0.958196 0.771686 0.421176)')).toEqual([244, 197, 107, 1]);
        expect(parseColour('red')).toBeNull();
        expect(toHex([91, 26, 58])).toBe('#5B1A3A');
    });

    it('measures contrast as WCAG does, and the threshold text of a size needs', () => {
        expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
        expect(contrast([91, 26, 58], [47, 158, 143])).toBeLessThan(4.5); // plum on teal
        expect(needs(16, 400)).toBe(4.5);
        expect(needs(24, 400)).toBe(3);
        expect(needs(19, 700)).toBe(3);
        expect(over([0, 0, 0, 0.5], [255, 255, 255, 1])).toEqual([128, 128, 128, 1]);
    });

    it('blames a brand only for text it made hard to read', () => {
        const a = {}; const b = {}; const c = {};
        const before = new Map([[a, { ratio: 7, needs: 4.5 }], [b, { ratio: 3, needs: 4.5 }], [c, { ratio: 9, needs: 4.5 }]]);
        const after = new Map([[a, { ratio: 3.9, needs: 4.5 }], [b, { ratio: 2, needs: 4.5 }], [c, { ratio: 8, needs: 4.5 }]]);
        // b was already hard to read in the design: not this brand's doing
        expect(madeHardToRead(before, after).map((x) => x.el)).toEqual([a]);
    });

    // The logo now, then upload, then a link (first-time owner walk, 7 Nov 2026: Logo led with "Paste a logo URL").
    it('offers the logo now, then upload, then a link to paste', () => {
        const container = document.createElement('div');
        renderBrandPanel({
            container,
            config: { tokens: [], identity: { logoKey: 'brand.logo' } },
            save: async () => {},
            upload: async () => 'https://example.test/logo.png',
            done: () => {},
            notify: () => {},
        });

        const controls = container.querySelector('.le-brand-logo-fields');
        expect(controls.querySelector('input[type="url"]')).not.toBeNull();
        expect(controls.querySelector('.le-upload-compact')).not.toBeNull();
        expect([...controls.children].map((child) => child.matches('.le-brand-logo-now') ? 'logo' : child.matches('.le-upload-compact, .le-upload') || child.querySelector('.le-upload-compact') ? 'upload' : child.matches('input[type="url"]') ? 'link' : child.className))
            .toEqual(['logo', 'upload', 'link']);
        expect(controls.querySelector('input[type="url"]').placeholder).toBe('Or paste a link to your logo');
    });

    /*
     * The business's facts, set once and shown everywhere the template marks them (owner, 2 Nov 2026: "changing the
     * brand on the template should cut across everywhere ... same as phone numbers").
     */
    const contacts = [
        { key: 'brand.phone', marker: 'data-brand-phone', label: 'Phone', link: 'tel', value: '' },
        { key: 'brand.phone-2', marker: 'data-brand-phone-2', label: 'Second phone', link: 'tel', value: '' },
        { key: 'brand.whatsapp', marker: 'data-brand-whatsapp', label: 'WhatsApp number', link: 'whatsapp', value: '' },
        { key: 'brand.email', marker: 'data-brand-email', label: 'Email', link: 'mailto', value: '' },
        { key: 'brand.address', marker: 'data-brand-address', label: 'Address', link: null, value: '' },
    ];
    const page = () => {
        document.body.innerHTML = `<header><a class="brand" href="./"><img class="logo" data-logo src="logo.svg" alt="Tidewell"></a>
            <a href="tel:+441134960123" data-brand-phone>0113 496 0123</a></header>
            <footer><a href="tel:+441134960123"><span data-brand-phone>0113 496 0123</span></a>
            <a href="https://wa.me/441134960199?text=Hi" data-brand-whatsapp>0113 496 0199</a></footer>`;
        const container = document.createElement('div');
        renderBrandPanel({ container, config: { tokens: [], identity: { nameKey: 'brand.name', logoKey: 'brand.logo', contacts } },
            save: async () => {}, done: () => {}, notify: () => {} });

        return container;
    };

    it('offers only the contacts this page shows', () => {
        const container = page();
        const offered = [...container.querySelectorAll('[data-brand-field]')].map((input) => input.dataset.brandField);
        expect(offered).toEqual(['brand.name', 'brand.logo', 'brand.phone', 'brand.whatsapp']);
    });

    it('changes every copy of a phone and the link that calls it, keeping a WhatsApp message', () => {
        const container = page();
        const phone = container.querySelector('[data-brand-field="brand.phone"]');
        phone.value = '+234 816 006 6770';
        phone.dispatchEvent(new Event('input'));
        const whatsapp = container.querySelector('[data-brand-field="brand.whatsapp"]');
        whatsapp.value = '+234 816 006 6770';
        whatsapp.dispatchEvent(new Event('input'));

        const shown = [...document.querySelectorAll('[data-brand-phone]')];
        expect(shown.map((node) => node.textContent)).toEqual(['+234 816 006 6770', '+234 816 006 6770']);
        expect(shown.map((node) => node.closest('a').getAttribute('href'))).toEqual(['tel:+2348160066770', 'tel:+2348160066770']);
        expect(document.querySelector('[data-brand-whatsapp]').getAttribute('href')).toBe('https://wa.me/2348160066770?text=Hi');
    });

    it('puts a logo into the template\'s own image rather than a small stand-in', () => {
        const container = page();
        const logo = container.querySelector('[data-brand-field="brand.logo"]');
        logo.value = 'https://example.test/senior-jay.png';
        logo.dispatchEvent(new Event('input'));

        const image = document.querySelector('header img');
        expect(image.classList.contains('logo')).toBe(true);
        expect(image.getAttribute('src')).toBe('https://example.test/senior-jay.png');
        expect(document.querySelectorAll('header img')).toHaveLength(1);
    });

    it('keeps the space between a link\'s own words and the marked name', () => {
        document.body.innerHTML = '<header><a href="about/">About<span data-brand-name> Tidewell Car Care</span></a></header>';
        const container = document.createElement('div');
        renderBrandPanel({ container, config: { tokens: [], identity: { nameKey: 'brand.name', logoKey: 'brand.logo', contacts: [] } },
            save: async () => {}, done: () => {}, notify: () => {} });
        const name = container.querySelector('[data-brand-field="brand.name"]');
        name.value = 'Senior Jay Autocare';
        name.dispatchEvent(new Event('input'));
        expect(document.querySelector('header a').textContent).toBe('About Senior Jay Autocare');
    });
});

