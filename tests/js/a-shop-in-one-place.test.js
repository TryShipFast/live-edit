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

        expect(container.textContent).toContain('Products (1)');
        expect(container.querySelector('a[href="/edit/products/after-rain"]').textContent).toBe('After Rain');
        expect(container.textContent).toContain("Needs the shop's WhatsApp number.");
    });

    it('saves a term to every page that writes it, and only what changed', async () => {
        const container = document.createElement('div');
        const saved = [];
        let finished = '';
        const { inputs } = renderShopPanel({ container, config, save: async (key, value) => saved.push([key, value]), done: (m) => { finished = m; } });

        inputs[1].input.value = '$9';
        inputs[0].input.value = '447700900123';
        container.querySelector('button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));

        expect(saved).toEqual([['wa', 'https://wa.me/447700900123?text=Hello'], ['bag.std', '$9'], ['checkout.std', '$9']]);
        expect(finished).toContain('saved');
    });

    it('refuses a WhatsApp number too short to be one', async () => {
        const container = document.createElement('div');
        const saved = [];
        const said = [];
        const { inputs } = renderShopPanel({ container, config, save: async (k, v) => saved.push(v), notify: (m) => said.push(m) });

        inputs[0].input.value = '123';
        container.querySelector('button.le-btn').click();
        await new Promise((r) => setTimeout(r, 0));

        expect(saved).toEqual([]);
        expect(said[0]).toContain('too short');
    });
});
