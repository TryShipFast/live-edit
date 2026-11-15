// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { itemIdsOf, newItemIn, wordsForNewItem } from '../../resources/js/new-item-words.js';

/*
 * Ask AI adds a row with its words (owner's coordinator, 15 Nov 2026: "'Add Saturday 2pm for Ngozi' must add a row
 * reading 'Sat 2pm', not a copy of the last row"). The add is the list's own (+ Add, or the item's copy); then the item
 * that was not there before takes the words, part by part in the order they read, as typing into it would. Any Kit
 * list, a row of one part or a card of several.
 */
const list = (html) => {
    document.body.innerHTML = html;

    return document.querySelector('[data-edit-list]');
};

describe('an item added with its words', () => {
    it('finds the item an add made, and gives its one part the words', () => {
        const hours = list(`<ul data-edit-list="tpl:hours">
            <li data-edit-item="t1"><span data-edit="setting:tpl:h1">Mon 6pm</span></li>
            <li data-edit-item="t2"><span data-edit="setting:tpl:h2">Fri 5pm</span></li></ul>`);
        const had = itemIdsOf(hours);
        hours.insertAdjacentHTML('beforeend', '<li data-edit-item="t2-copy"><span data-edit="setting:tpl:h2@t2-copy">Fri 5pm</span></li>');

        const made = newItemIn(hours, had);
        expect(made.dataset.editItem).toBe('t2-copy');
        expect(wordsForNewItem(made, ['Sat 2pm'])).toEqual([{ key: 'tpl:h2@t2-copy', value: 'Sat 2pm' }]);
    });

    it('gives a card of several parts its words in the order they read, keeping a part left empty, never a part that only holds others', () => {
        const rows = list(`<ul data-edit-list="tpl:dates"><li data-edit-item="t1">
            <span data-edit="setting:tpl:w">Every Tue, 6:30pm–9pm</span> ·
            <span data-edit="setting:tpl:s"><span data-edit="setting:tpl:n">24</span> places</span></li></ul>`);

        expect(wordsForNewItem(rows.firstElementChild, ['Every Wed, 6:30pm–9pm', '20'])).toEqual([
            { key: 'tpl:w', value: 'Every Wed, 6:30pm–9pm' }, { key: 'tpl:n', value: '20' },
        ]);
        expect(wordsForNewItem(rows.firstElementChild, [null, '18'])).toEqual([{ key: 'tpl:n', value: '18' }]);
    });

    it('leaves a nested list\'s parts to that list, and fills nothing without words or a new item', () => {
        const cards = list(`<ul data-edit-list="tpl:cards"><li data-edit-item="c1">
            <h3 data-edit="setting:tpl:title">Plan</h3>
            <ul data-edit-list="tpl:points"><li data-edit-item="p1"><span data-edit="setting:tpl:point">A point</span></li></ul>
        </li></ul>`);

        expect(wordsForNewItem(cards.firstElementChild, ['Gold', 'Not this'])).toEqual([{ key: 'tpl:title', value: 'Gold' }]);
        expect(wordsForNewItem(cards.firstElementChild, [])).toEqual([]);
        expect(newItemIn(cards, itemIdsOf(cards))).toBeNull();
    });
});
