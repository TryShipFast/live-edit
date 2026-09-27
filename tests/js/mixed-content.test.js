import { describe, expect, it } from 'vitest';
import { applyValue } from '../../resources/js/content.js';
import { ownTextOf } from '../../resources/js/support.js';

/**
 * Editing a sentence that has something else inside it.
 *
 * "We design for the <strong>street it stands on</strong>, not for a
 * photograph" is two runs of text with an element between them. The applier
 * used to write the whole sentence into the first run and delete the rest, so
 * every word after the bold phrase was destroyed and the phrase itself ended
 * up trailing the sentence.
 *
 * Silently, which is the worst of it: the page still read as a sentence, just
 * not the client's. Measured on a real Laravel page before anybody thought to
 * look at the markup.
 *
 * These drive the round trip the editor actually makes — show the element's
 * own words, let somebody change them, write them back — because the fault
 * lived in the gap between those two halves rather than in either.
 */
const edited = (html, change) => {
    const element = document.createElement('div');
    element.innerHTML = html;

    applyValue(element, change(ownTextOf(element)));

    return element.innerHTML;
};

const SENTENCE = 'We design for the <strong>street it stands on</strong>, not a photograph.';

describe('a sentence with an element inside it', () => {
    it('keeps the element where the designer put it when words before it change', () => {
        expect(edited(SENTENCE, (words) => words.replace('design', 'build')))
            .toBe('We build for the <strong>street it stands on</strong>, not a photograph.');
    });

    it('keeps it in place when words after it change', () => {
        expect(edited(SENTENCE, (words) => words.replace('photograph', 'postcard')))
            .toBe('We design for the <strong>street it stands on</strong>, not a postcard.');
    });

    it('never destroys the words on the far side of it', () => {
        // The specific loss: ", not a photograph." used to disappear on any
        // edit at all, including one that did not touch it.
        expect(edited(SENTENCE, (words) => words.replace('We', 'They')))
            .toContain('not a photograph.');
    });

    it('holds several elements and the words between them', () => {
        expect(edited('Call <a href="#">us</a> or <a href="#">write</a> today', (w) => w.replace('today', 'now')))
            .toBe('Call <a href="#">us</a> or <a href="#">write</a> now');
    });

    it('shows the words without inventing a space where the element was', () => {
        // Joined with a space, the drawer showed "the , not a photograph" with
        // a gap before the comma, and the string it showed was not quite the
        // string the page held — so writing it back could not be exact.
        const element = document.createElement('div');
        element.innerHTML = SENTENCE;

        expect(ownTextOf(element)).toBe('We design for the , not a photograph.');
    });

    it('loses no words when somebody replaces the sentence outright', () => {
        // Nothing can be inferred about where the element belongs in a
        // sentence that shares nothing with the old one, so the runs collapse
        // into one. That costs the arrangement and must never cost a word.
        const result = edited(SENTENCE, () => 'Something completely different');

        expect(result).toContain('Something completely different');
        expect(result).toContain('<strong>street it stands on</strong>');
    });
});

describe('previewing a value as somebody types', () => {
    /*
     * Typing replaces the whole box, so the first character shares almost
     * nothing with the sentence on the page. Applied directly, that collapsed
     * the runs on keystroke one — and every keystroke after it was editing a
     * sentence that had already lost its shape, so the bold phrase could never
     * find its way back.
     *
     * This is the round trip the editor makes: put back what the page said,
     * then apply the box as it stands.
     */
    const typing = (html, finalValue) => {
        const element = document.createElement('div');
        element.innerHTML = html;

        const runsOf = (node) => [...node.childNodes].filter((child) => child.nodeType === 3);
        const original = runsOf(element).map((node) => node.nodeValue);

        for (let at = 1; at <= finalValue.length; at += 1) {
            const now = runsOf(element);

            if (now.length === original.length) {
                now.forEach((node, index) => {
                    node.nodeValue = original[index];
                });
            }

            applyValue(element, finalValue.slice(0, at), { keepRuns: true });
        }

        return element.innerHTML;
    };

    it('still has the bold phrase in place after every keystroke', () => {
        // One change, which is what an edit usually is. Every intermediate
        // value straddles both runs and would have collapsed them; only the
        // finished sentence decides where the words go.
        expect(typing(SENTENCE, 'We build for the , not a photograph.'))
            .toBe('We build for the <strong>street it stands on</strong>, not a photograph.');
    });

    it('loses no words when two separate parts of the sentence change at once', () => {
        // Changing a word on each side of the phrase leaves nothing to say
        // which side of it the new words belong on, so the runs collapse. That
        // is the documented fallback: the arrangement goes, the words do not.
        const result = typing(SENTENCE, 'We build for the , not a postcard.');

        expect(result).toContain('We build for the , not a postcard.');
        expect(result).toContain('<strong>street it stands on</strong>');
    });

    it('keeps the runs so the original can be put back', () => {
        // Removing them instead left detached nodes the editor could not
        // restore, so Cancel could not undo a preview.
        const element = document.createElement('div');
        element.innerHTML = SENTENCE;

        applyValue(element, 'W', { keepRuns: true });

        expect([...element.childNodes].filter((n) => n.nodeType === 3)).toHaveLength(2);
    });
});

describe('a decoration beside the words', () => {
    it('keeps a leading icon in front of them, with its space', () => {
        // Without the space the icon wears the sentence: "→Book a call".
        expect(edited('<svg width="8"></svg> Book a call', () => 'Book a visit'))
            .toBe('<svg width="8"></svg> Book a visit');
    });

    it('keeps a trailing badge after them', () => {
        expect(edited('Four projects a year <span class="pill">Limited</span>', () => 'Six projects a year'))
            .toBe('Six projects a year <span class="pill">Limited</span>');
    });

    it('puts the words inside a wrapper that has only one child to hold them', () => {
        expect(edited('<span class="inner">Every drawing is made here</span>', () => 'Every drawing is made in this office'))
            .toBe('<span class="inner">Every drawing is made in this office</span>');
    });

    it('does not double a space that the words already carry', () => {
        // A value taken straight from the page round-trips unchanged; only a
        // trimmed one, as published content arrives, gets the space back.
        expect(edited('<svg width="8"></svg> Book a call', (words) => words))
            .toBe('<svg width="8"></svg> Book a call');
    });
});
