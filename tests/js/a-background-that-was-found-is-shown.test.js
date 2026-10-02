import { describe, expect, it } from 'vitest';
import { backgroundImageOf } from '../../resources/js/support.js';

/**
 * Finding a background and then not showing it.
 *
 * Reported in those words from a real site, and it is the worst shape a bug
 * can take: the work was done, the answer was recorded on the element, and the
 * panel said "No image set" to somebody looking straight at the picture.
 *
 * A background in a stylesheet can only be found by asking the browser what it
 * is drawing, and the answer is written onto the element as data-kb-bg. Asking
 * again later is a different question - a builder applies a background when a
 * section arrives and removes it when it leaves, which is written down in the
 * watcher that exists because of it. The panel asked late, got "none", and
 * believed it.
 */
const element = (html) => {
    document.body.innerHTML = html;

    return document.body.firstElementChild;
};

describe('a background that was found is shown', () => {
    it('uses what was written down when the browser no longer reports one', () => {
        // The reported case. Nothing in the computed style any more; the
        // recorded answer is all that is left, and it is correct.
        const section = element('<section data-kb-bg="/hero.jpg"><h1>Ready to grow?</h1></section>');

        expect(backgroundImageOf(section)).toBe('/hero.jpg');
    });

    it('prefers what the page is drawing now over what it drew before', () => {
        /*
         * If both answers exist they normally agree. When they do not, the
         * live one is the truth and the recorded one is history - showing the
         * old picture would be a different wrong answer.
         */
        const section = element('<section data-kb-bg="/old.jpg"><h1>Ready to grow?</h1></section>');
        const view = { getComputedStyle: () => ({ backgroundImage: 'url("/new.jpg")' }) };

        expect(backgroundImageOf(section, view)).toBe('/new.jpg');
    });

    it('prefers what the builder declared over either', () => {
        // An author saying outright what the picture is does not go stale.
        const section = element('<section data-background="/declared.jpg" data-kb-bg="/found.jpg"></section>');

        expect(backgroundImageOf(section)).toBe('/declared.jpg');
    });

    it('reads a background out of the stylesheet when there is nothing recorded', () => {
        const section = element('<section><h1>Ready to grow?</h1></section>');
        const view = { getComputedStyle: () => ({ backgroundImage: 'url(/from-css.jpg)' }) };

        expect(backgroundImageOf(section, view)).toBe('/from-css.jpg');
    });

    it('offers nothing for an element that has no picture', () => {
        // The guard against showing a picture where there is none, which would
        // be the same fault pointing the other way.
        const section = element('<section><h1>Ready to grow?</h1></section>');

        expect(backgroundImageOf(section)).toBe('');
        expect(backgroundImageOf(null)).toBe('');
    });

    it('does not offer a data URI as something to replace', () => {
        /*
         * Not a picture anybody swaps, and megabytes of markup if it is sent
         * anywhere. Refused whether it is being drawn now or was recorded.
         */
        const recorded = element('<section data-kb-bg="data:image/png;base64,iVBORw0KGgo="></section>');
        const drawn = element('<section></section>');
        const view = { getComputedStyle: () => ({ backgroundImage: 'url("data:image/png;base64,iVBORw0KGgo=")' }) };

        expect(backgroundImageOf(recorded)).toBe('');
        expect(backgroundImageOf(drawn, view)).toBe('');
    });
});
