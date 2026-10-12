import { describe, expect, it } from 'vitest';
import { applyValue } from '../../resources/js/content.js';

/**
 * A heading whose insides the theme rewrites before we get to them.
 *
 * Templates animate their own type. One ships this:
 *
 *   <h1 data-split="lines" data-edit="text">Hi, I'm<br>Temitope</h1>
 *
 * and on load its script wraps each visual line in a div so the lines can rise
 * in one after another. By the time the runtime applies the saved words, the
 * two text runs the markup had are gone and there are only the theme's divs.
 *
 * The applier used to answer that by appending, which put the sentence beside
 * a copy of itself. It showed up at the worst possible moment - the instant
 * after Save, when somebody is looking to check their edit took - on a page
 * where the stored content was perfectly correct the whole time.
 */
const heading = (html) => {
    document.body.innerHTML = html;

    return document.querySelector('h1');
};

describe('a theme that rebuilds its own heading', () => {
    it('leaves it alone when it already says the words', () => {
        // The server rendered the saved words, then the theme's animation
        // wrapped each line. Nothing has changed and nothing should be done.
        const h1 = heading('<h1 data-edit="setting:auto:abc"><div>The outline lands</div><div>on the words.</div></h1>');

        applyValue(h1, 'The outline lands on the words.');

        expect(h1.textContent.replace(/\s+/g, ' ').trim()).toBe('The outline lands on the words.');
        expect(h1.querySelectorAll('div')).toHaveLength(2);
    });

    it('does not count the theme\'s spacing as a difference', () => {
        // Three indented lines of markup hold tabs and newlines the person
        // never typed. Comparing raw would call every such heading changed.
        const h1 = heading('<h1 data-edit="setting:auto:abc">\n    Hi,\n    I am Temitope\n</h1>');

        applyValue(h1, 'Hi, I am Temitope');

        expect(h1.textContent.replace(/\s+/g, ' ').trim()).toBe('Hi, I am Temitope');
    });

    it('writes new words into the wrappers rather than beside them', () => {
        const h1 = heading('<h1 data-edit="setting:auto:abc"><div>Hi, I am</div><div>Temitope</div></h1>');

        applyValue(h1, 'Something else entirely.');

        expect(h1.textContent.replace(/\s+/g, ' ').trim()).toBe('Something else entirely.');
        // Said explicitly: the failure being guarded is the sentence appearing
        // twice, which a textContent check alone would also catch, but this
        // says which half of it went wrong.
        expect(h1.textContent).not.toContain('Hi, I am');
    });

    it('finds the words through a single wrapper, however deep', () => {
        const h1 = heading('<h1 data-edit="setting:auto:abc"><span class="line"><em>Hi, I am Temitope</em></span></h1>');

        applyValue(h1, 'Something else entirely.');

        expect(h1.textContent.trim()).toBe('Something else entirely.');
        // The theme's own markup is still there to animate.
        expect(h1.querySelector('span.line em')).not.toBeNull();
    });

    it('passes over a child that holds no words', () => {
        // An icon beside a label. The sentence is not hiding in the icon, and
        // counting it as a place it might be is how the label gets orphaned.
        const link = (() => {
            document.body.innerHTML = '<a data-edit="setting:auto:abc"><i class="icon"></i><span>Book</span></a>';

            return document.querySelector('a');
        })();

        applyValue(link, 'Book a call');

        expect(link.textContent.trim()).toBe('Book a call');
        expect(link.querySelector('i.icon')).not.toBeNull();
    });

    it('still fills an element that is genuinely empty', () => {
        const h1 = heading('<h1 data-edit="setting:auto:abc"></h1>');

        applyValue(h1, 'The first words it has had.');

        expect(h1.textContent).toBe('The first words it has had.');
    });
});
