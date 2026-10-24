import { describe, expect, it } from 'vitest';
import { applyContent } from '../../resources/js/content.js';
import { choiceLabel, choicesOf, optionsFor, renderChoice } from '../../resources/js/choice.js';

/*
 * Settings a card's words do not show: a gallery photo filed under "Exterior",
 * a course under its faculty and start month. The owner adds or copies a card
 * and says where it belongs, choosing from the filter's own options.
 */
const page = (html) => {
    document.body.innerHTML = html;
    return document;
};

const declare = (choices) => JSON.stringify(choices).replace(/"/g, '&quot;');

const GALLERY = `
<div class="chips"><button data-filter="all">All <span class="num">(3)</span></button><button data-filter="ext">Exterior <span class="num">(2)</span></button><button data-filter="int">Interior (1)</button></div>
<select data-f="start"><option value="">Any month</option><option value="sep">September</option><option value="jan">January</option></select>
<ul data-edit-list="photos" data-edit-choices="${declare([
    { attr: 'data-cat', label: 'Room', from: '[data-filter]', value: 'data-filter' },
    { attr: 'data-starts', label: 'Starts', from: 'select[data-f="start"] option', many: true },
])}">
  <li data-edit-item="one" data-cat="ext" data-starts="sep" data-edit-choice="setting:photos.one"><img alt=""></li>
  <li data-edit-item="two" data-cat="int" data-starts="jan" data-edit-choice="setting:photos.two"><img alt=""></li>
</ul>`;

describe('a card files itself under the settings the owner chose', () => {
    it('offers each filter\'s own options, in its words, without "All", a blank or counts', () => {
        const root = page(GALLERY);
        const [room, starts] = choicesOf(root.querySelector('[data-edit-list]'));

        expect(room).toMatchObject({ attr: 'data-cat', label: 'Room', value: 'data-filter', many: false });
        expect(optionsFor(room, root)).toEqual([{ value: 'ext', label: 'Exterior' }, { value: 'int', label: 'Interior' }]);
        expect(starts).toMatchObject({ attr: 'data-starts', value: 'value', many: true });
        expect(optionsFor(starts, root)).toEqual([{ value: 'sep', label: 'September' }, { value: 'jan', label: 'January' }]);
    });

    it('reads a radio\'s label', () => {
        const root = page('<label><input type="radio" name="t" value="cost"> Cost and margin</label>');

        expect(choiceLabel(root.querySelector('input'))).toBe('Cost and margin');
    });

    it('puts the saved settings on the card, and a copy keeps settings of its own', () => {
        const root = page(GALLERY);

        applyContent(root, {
            photos: '["one","nabc","two"]',
            'photos.one': '{"data-cat":"int","data-starts":"sep jan"}',
            'photos.one@nabc': '{"data-cat":"ext"}',
        });

        const cards = [...root.querySelectorAll('[data-edit-item]')];
        expect(cards.map((c) => c.getAttribute('data-cat'))).toEqual(['int', 'ext', 'int']);
        expect(cards[0].getAttribute('data-starts')).toBe('sep jan');
        expect(cards[1].getAttribute('data-edit-choice')).toBe('setting:photos.one@nabc');
    });

    it('writes only what the list declares, and nothing without a declaration', () => {
        const root = page(GALLERY);
        applyContent(root, { 'photos.one': '{"data-cat":"int","class":"x","onclick":"alert(1)"}' });
        const card = root.querySelector('[data-edit-item="one"]');
        expect(card.getAttribute('class')).toBeNull();
        expect(card.getAttribute('onclick')).toBeNull();

        const bare = page('<ul data-edit-list="x"><li data-edit-item="a" data-cat="ext" data-edit-choice="setting:x.a"></li></ul>');
        applyContent(bare, { 'x.a': '{"data-cat":"int"}' });
        expect(bare.querySelector('li').getAttribute('data-cat')).toBe('ext');
    });

    it('saves what the owner picks with the card\'s other settings, and shows it at once', async () => {
        const root = page(GALLERY);
        const item = root.querySelector('[data-edit-item="one"]');
        const saved = [];
        const panel = renderChoice({ item, list: item.parentElement, save: async (key, value) => saved.push([key, JSON.parse(value)]) });
        const select = panel.querySelector('select');

        expect([...select.options].map((o) => o.textContent)).toEqual(['Exterior', 'Interior']);
        select.value = 'int';
        select.dispatchEvent(new Event('change'));
        await Promise.resolve();

        expect(item.getAttribute('data-cat')).toBe('int');
        expect(saved).toEqual([['photos.one', { 'data-cat': 'int', 'data-starts': 'sep' }]]);
    });

    it('lets an item belong to several when the setting says so', async () => {
        const root = page(GALLERY);
        const item = root.querySelector('[data-edit-item="one"]');
        const saved = [];
        const panel = renderChoice({ item, list: item.parentElement, save: async (key, value) => saved.push(JSON.parse(value)) });
        const boxes = [...panel.querySelectorAll('input[type=checkbox]')];

        expect(boxes.map((b) => b.checked)).toEqual([true, false]);
        boxes[1].checked = true;
        boxes[1].dispatchEvent(new Event('change'));
        await Promise.resolve();

        expect(item.getAttribute('data-starts')).toBe('sep jan');
        expect(saved).toEqual([{ 'data-cat': 'ext', 'data-starts': 'sep jan' }]);
    });
});
