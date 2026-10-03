import { describe, expect, it } from 'vitest';
import { wordsEditedElsewhere } from '../../resources/js/support.js';
import { applyValue } from '../../resources/js/content.js';
import { ownTextOf } from '../../resources/js/support.js';

/**
 * A hero that opens with one of its own words missing.
 *
 * Reported against a live site as the auto-tagger staging a destructive change
 * on the hero heading. Driven against the real markup, the save is innocent:
 * pressing Save on an untouched field changes nothing, and an ordinary edit
 * rewrites the words around the span and leaves the span, its colour and the
 * drawing inside it exactly as they were.
 *
 * The panel is what causes the damage. A heading built as
 *
 *     Get Your Music <span>Heard<svg/></span> by the People Who Matter
 *
 * opens showing "Get Your Music  by the People Who Matter" - the word cut out
 * and a gap left where it was - under a note saying only that "some words" are
 * edited separately. Somebody does the obvious thing, types the word back, and
 * the page then reads "Get Your Music Heard Heard by the People Who Matter".
 *
 * Which is worth being precise about: nothing was lost, something was
 * duplicated, and the editor was told to do it by what they were shown.
 */
const HERO = '<h1>Get Your Music <span class="text-primary">Heard<svg height="6"></svg></span> by the People Who Matter</h1>';

const hero = (html = HERO) => {
    document.body.innerHTML = html;

    return document.body.firstElementChild;
};

describe('the word that looks missing', () => {
    it('names the words that live somewhere else', () => {
        expect(wordsEditedElsewhere(hero())).toEqual(['Heard']);
    });

    it('names every one of them when there are several', () => {
        const heading = hero('<h1>Built <em>fast</em> and <strong>cheap</strong> for you</h1>');

        expect(wordsEditedElsewhere(heading)).toEqual(['fast', 'cheap']);
    });

    it('shortens one too long to sit in a hint', () => {
        const heading = hero('<h1>We <span>build websites for people who would rather be doing something else</span> daily</h1>');
        const [named] = wordsEditedElsewhere(heading);

        expect(named.endsWith('…')).toBe(true);
        expect(named.length).toBeLessThanOrEqual(24);
    });

    it('says nothing about a child that holds no words', () => {
        // An arrow after a call to action. There is nothing to name and
        // nothing a person could click to edit.
        const heading = hero('<h1>Read more <svg viewBox="0 0 24 24"><path d="M13 4"/></svg></h1>');

        expect(wordsEditedElsewhere(heading)).toEqual([]);
    });
});

describe('what the save actually does to that hero', () => {
    it('leaves it alone when nobody typed anything', () => {
        const heading = hero();
        applyValue(heading, ownTextOf(heading));

        expect(heading.textContent.replace(/\s+/g, ' ').trim())
            .toBe('Get Your Music Heard by the People Who Matter');
        expect(heading.querySelector('svg')).not.toBeNull();
    });

    it('rewrites the words around the span and keeps the span', () => {
        const heading = hero();
        applyValue(heading, ownTextOf(heading).replace('Music', 'Songs'));

        expect(heading.textContent.replace(/\s+/g, ' ').trim())
            .toBe('Get Your Songs Heard by the People Who Matter');
        expect(heading.querySelector('svg')).not.toBeNull();
    });

    it('duplicates the word if somebody types it back, which is why it is named', () => {
        /*
         * The measured consequence, kept as a test so the hint above is never
         * quietly dropped as cosmetic. This is what the panel used to invite.
         */
        const heading = hero();
        applyValue(heading, 'Get Your Music Heard by the People Who Matter');

        expect(heading.textContent.replace(/\s+/g, ' ').trim())
            .toBe('Get Your Music Heard Heard by the People Who Matter');
    });
});
