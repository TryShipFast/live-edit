import { describe, expect, it } from 'vitest';
import { applyValue } from '../../resources/js/content.js';
import { ownTextOf } from '../../resources/js/support.js';

/**
 * The space between somebody's words and their designer's markup.
 *
 * A heading like
 *
 *   <h1>Get Your Music <span>Heard</span> by the People Who Matter</h1>
 *
 * is two runs of text with an element between them, and the second run begins
 * with a space because of where that element sits. The panel shows the words
 * with their whitespace collapsed - themes are full of tabs and newlines - so
 * the value coming back carries one space at that junction where the markup
 * had two, one on each side.
 *
 * The diff read that as a deletion, replaced the whole run, and took the space
 * in front of "by" with it. On a live site that rendered as "Get Your Music
 * Heardby the People Who Matter" - in the hero, after an ordinary edit.
 *
 * Found by making a real edit on a real page rather than by reading. Every
 * fixture here already checked that the span, its colour and the drawing
 * inside it survived, and they all did; not one of them looked at the spacing.
 */
const hero = () => {
    document.body.innerHTML = '<h1 data-edit="setting:auto:hero">Get Your Music <span>Heard<svg></svg></span> by the People Who Matter</h1>';

    return document.body.firstElementChild;
};

/** What the panel would put in the box: own text, whitespace collapsed. */
const asThePanelShowsIt = (element) => ownTextOf(element).replace(/\s+/g, ' ').trim();

describe('the space beside the markup', () => {
    it('survives an edit that adds words to the end', () => {
        const h1 = hero();

        applyValue(h1, `${asThePanelShowsIt(h1)} Today`);

        expect(h1.textContent).toBe('Get Your Music Heard by the People Who Matter Today');
    });

    it('survives an edit that changes a word in the middle', () => {
        const h1 = hero();

        applyValue(h1, asThePanelShowsIt(h1).replace('People', 'Listeners'));

        expect(h1.textContent).toBe('Get Your Music Heard by the Listeners Who Matter');
    });

    it('still keeps the markup it always kept', () => {
        // The part that was already right, so a fix for the spacing cannot
        // quietly cost the thing the spacing was beside.
        const h1 = hero();

        applyValue(h1, `${asThePanelShowsIt(h1)} Today`);

        expect(h1.querySelector('span')?.textContent).toContain('Heard');
        expect(h1.querySelector('svg')).not.toBeNull();
    });

    it('leaves a plain sentence exactly as it was', () => {
        // The guard against a rule that invents spaces where there were none.
        document.body.innerHTML = '<p data-edit="setting:auto:p">We build things.</p>';
        const p = document.body.firstElementChild;

        applyValue(p, 'We build better things.');

        expect(p.textContent).toBe('We build better things.');
    });

    it('does not add a space when the new words bring their own', () => {
        /*
         * Somebody deliberately starting their words with a space is making a
         * decision about their own sentence. Only the gap against the markup
         * is put back, never a second one.
         */
        const h1 = hero();

        applyValue(h1, 'Get Your Music  by the People Who Matter');

        expect(h1.textContent).not.toContain('  by');
    });
});
