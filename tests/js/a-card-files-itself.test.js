import { describe, expect, it } from 'vitest';
import { applyContent } from '../../resources/js/content.js';
import { choiceLabel, choicesFor, choiceOf, renderChoice } from '../../resources/js/choice.js';

/*
 * A card's category that its words do not show: a gallery photo filed under
 * "Exterior", a project under its sector. The owner adds or copies a card and
 * says where it belongs, choosing from the filter's own options.
 */
const page = (html) => {
    document.body.innerHTML = html;
    return document;
};

const GALLERY = `
<div class="chips"><button data-filter="all">All <span class="num">(3)</span></button><button data-filter="ext">Exterior <span class="num">(2)</span></button><button data-filter="int">Interior (1)</button></div>
<ul data-edit-list="photos" data-edit-choice-attr="data-cat" data-edit-choice-label="Room" data-edit-choice-from="[data-filter]" data-edit-choice-value="data-filter">
  <li data-edit-item="one" data-cat="ext" data-edit-choice="setting:photos.cat"><img alt=""></li>
  <li data-edit-item="two" data-cat="int" data-edit-choice="setting:photos.cat#2"><img alt=""></li>
</ul>`;

describe('a card files itself under the category the owner chose', () => {
    it('offers the filter\'s own options, in its words, without "All" or counts', () => {
        const root = page(GALLERY);
        const choice = choiceOf(root.querySelector('[data-edit-list]'));

        expect(choice).toMatchObject({ attr: 'data-cat', label: 'Room', value: 'data-filter', many: false });
        expect(choicesFor(choice, root)).toEqual([{ value: 'ext', label: 'Exterior' }, { value: 'int', label: 'Interior' }]);
    });

    it('reads a radio\'s label and an option\'s text', () => {
        const root = page('<label><input type="radio" name="t" value="cost"> Cost and margin</label><select><option value="all">All</option><option value="ops">Operations</option></select>');

        expect(choiceLabel(root.querySelector('input'))).toBe('Cost and margin');
        expect(choicesFor({ from: 'option', value: 'value' }, root)).toEqual([{ value: 'ops', label: 'Operations' }]);
    });

    it('puts the saved choice on the card, and a copy keeps a choice of its own', () => {
        const root = page(GALLERY);

        applyContent(root, { photos: '["one","nabc","two"]', 'photos.cat': 'int', 'photos.cat@nabc': 'ext' });

        const cards = [...root.querySelectorAll('[data-edit-item]')];
        expect(cards.map((c) => c.getAttribute('data-cat'))).toEqual(['int', 'ext', 'int']);
        expect(cards[1].getAttribute('data-edit-choice')).toBe('setting:photos.cat@nabc');
    });

    it('leaves a card alone when nothing was chosen, or the list declares no setting', () => {
        const root = page('<ul data-edit-list="x"><li data-edit-item="a" data-cat="ext" data-edit-choice="setting:x.cat"></li></ul>');

        applyContent(root, { 'x.cat': 'int' });

        expect(root.querySelector('li').getAttribute('data-cat')).toBe('ext');
    });

    it('saves what the owner picks and shows it on the card at once', async () => {
        const root = page(GALLERY);
        const item = root.querySelector('[data-edit-item="one"]');
        const saved = [];
        const control = renderChoice({ item, list: item.parentElement, save: async (key, value) => saved.push([key, value]) });
        const select = control.querySelector('select');

        expect([...select.options].map((o) => o.textContent)).toEqual(['Exterior', 'Interior']);
        select.value = 'int';
        select.dispatchEvent(new Event('change'));
        await Promise.resolve();

        expect(item.getAttribute('data-cat')).toBe('int');
        expect(saved).toEqual([['photos.cat', 'int']]);
    });

    it('lets an item belong to several when the list says so', async () => {
        const root = page(GALLERY.replace('data-edit-choice-value="data-filter"', 'data-edit-choice-value="data-filter" data-edit-choice-many'));
        const item = root.querySelector('[data-edit-item="one"]');
        const saved = [];
        const control = renderChoice({ item, list: item.parentElement, save: async (key, value) => saved.push(value) });
        const boxes = [...control.querySelectorAll('input[type=checkbox]')];

        expect(boxes.map((b) => b.checked)).toEqual([true, false]);
        boxes[1].checked = true;
        boxes[1].dispatchEvent(new Event('change'));
        await Promise.resolve();

        expect(item.getAttribute('data-cat')).toBe('ext int');
        expect(saved).toEqual(['ext int']);
    });
});
