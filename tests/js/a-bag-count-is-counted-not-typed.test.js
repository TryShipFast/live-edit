import { describe, expect, it } from 'vitest';
import { computedKind, computedOf } from '../../resources/js/computed.js';

/*
 * The number of things in a shopper's bag is written by the shop on every page load, from that visitor's bag.
 * The editor opened it as words: an owner could type "12" into the header, publish it, and every visitor saw
 * 12 until the shop's script wrote their own count over it.
 */
describe('a bag count is worked out, not typed', () => {
    const page = (html) => { document.body.innerHTML = html; return document.body; };

    it('takes a press on the count, even one a template still marks as words', () => {
        const body = page('<a href="bag/" data-edit="link">Bag <span data-bag-count data-edit="text">0</span></a>');
        const count = body.querySelector('[data-bag-count]');
        expect(computedOf(count)).toBe(count);
        expect(computedKind(count)).toBe('bag-count');
    });

    it('takes the words beside it too', () => {
        const body = page('<span data-bag-count-word data-one=" item" data-many=" items"> items</span><span data-bag-sr>items in your bag</span><span data-bag-words>, no books</span>');
        for (const el of body.querySelectorAll('span')) expect(computedKind(computedOf(el))).toBe('bag-count');
    });

    it('keeps what a template says it is, and leaves the bag link itself editable', () => {
        const body = page('<a href="bag/" data-edit="link"><span>Bag</span> <span data-bag-count data-kit-computed="bag-count">0</span></a><p data-kit-computed="count">4</p>');
        expect(computedOf(body.querySelector('span'))).toBe(null);
        expect(computedKind(body.querySelector('p'))).toBe('count');
    });
});
