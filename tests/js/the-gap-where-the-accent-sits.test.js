import { describe, expect, it } from 'vitest';
import { applyValue } from '../../resources/js/content.js';
import { ownTextOf, shownWords } from '../../resources/js/support.js';

/**
 * "Get Your Music Heardby the People Who Matter."
 *
 * Reported as the hero fading, and found beside it: type a single character in
 * the drawer and the space in front of the accent word disappears.
 *
 * What the panel shows has always been collapsed to single spaces, because
 * theme markup is full of tabs and newlines. That is right inside a run of
 * text and wrong across the boundary between two - the gap between runs is
 * where an inline element sits, and collapsing it loses the space that keeps
 * the words apart from it.
 *
 * So the panel showed one space where the page had two, the applier compared
 * the two, correctly concluded that a space had been deleted, and deleted it.
 * From the separator run, which is the only place it could come from.
 *
 * The fixture here is the real structure, read off the live page rather than
 * imagined: React writes {" "} as its own text node with a comment beside it,
 * so the heading has FOUR runs and not the two a hand-written one would have.
 * Two runs never reproduced this, which is why the first fixture was wrong and
 * the bug looked unreproducible.
 */
const realHero = () => {
    document.body.innerHTML = '<h1></h1>';
    const heading = document.querySelector('h1');
    const span = document.createElement('span');
    span.className = 'text-primary';
    span.textContent = 'Heard';

    heading.append(
        document.createTextNode('Get Your Music'),
        document.createComment(' '),
        document.createTextNode(' '),
        span,
        document.createTextNode(' '),
        document.createComment(' '),
        document.createTextNode('by the People Who Matter')
    );

    return heading;
};

const textRuns = (element) => [...element.childNodes].filter((node) => node.nodeType === 3);

describe('the gap where the accent sits', () => {
    it('shows the gap rather than closing it', () => {
        const heading = realHero();

        expect(shownWords(heading, ownTextOf(heading)))
            .toBe('Get Your Music  by the People Who Matter');
    });

    it('still tidies tabs and newlines inside a single run', () => {
        // The reason the collapsing exists, which this must not undo.
        document.body.innerHTML = '<p>\n    Lots of   room\n  </p>';
        const paragraph = document.querySelector('p');

        expect(shownWords(paragraph, ownTextOf(paragraph))).toBe('Lots of room');
    });

    it('tidies inside each run and leaves the gap between them', () => {
        document.body.innerHTML = '<h2>One\n\ttwo <em>bold</em> three\n\tfour</h2>';
        const heading = document.querySelector('h2');

        expect(shownWords(heading, ownTextOf(heading))).toBe('One two  three four');
    });

    it('keeps the space when a character is typed', () => {
        /*
         * The reported keystroke. One full stop, and the hero lost the space
         * in front of its accent word.
         */
        const heading = realHero();
        applyValue(heading, `${shownWords(heading, ownTextOf(heading))}.`, { keepRuns: true });

        expect(heading.textContent).toBe('Get Your Music Heard by the People Who Matter.');
    });

    it('leaves the separator runs where they are, so Cancel can put the words back', () => {
        /*
         * The second half of what was reported: the drawer closed and the page
         * kept the half-typed words. Restoring works by writing the original
         * run values back, which it can only do while the runs are still the
         * same ones - and emptying a separator is how that stops being true.
         */
        const heading = realHero();
        const original = textRuns(heading).map((node) => node.nodeValue);

        applyValue(heading, `${shownWords(heading, ownTextOf(heading))}.`, { keepRuns: true });

        const now = textRuns(heading);
        expect(now.length).toBe(original.length);

        now.forEach((node, index) => { node.nodeValue = original[index]; });
        expect(heading.textContent).toBe('Get Your Music Heard by the People Who Matter');
    });

    it('rewords the sentence without disturbing the accent', () => {
        const heading = realHero();
        const shown = shownWords(heading, ownTextOf(heading));

        applyValue(heading, shown.replace('Music', 'Songs'), { keepRuns: true });

        expect(heading.textContent).toBe('Get Your Songs Heard by the People Who Matter');
        expect(heading.querySelector('span').textContent).toBe('Heard');
    });
});
