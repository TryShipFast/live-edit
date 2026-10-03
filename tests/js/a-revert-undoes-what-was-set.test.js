import { describe, expect, it } from 'vitest';
import { PUTS_BACK, worthReverting } from '../../resources/js/support.js';

/**
 * Typing a full stop turned the hero black.
 *
 * Reported with steps, which is the only reason it was found: click the hero
 * text, add "." in the drawer, watch the hero. The words were never in danger
 * - they sat there correctly the whole time - but "Get Your Music" and "by the
 * People Who Matter" went from white to near-black on a dark hero, so the
 * section somebody was editing became unreadable while they edited it.
 *
 * The cause was a revert written for a property nobody had set. A revert
 * exists to take a property BACK to the design, and an untouched property is
 * already there; written anyway it does the opposite of its name, because the
 * rule is `revert-layer !important` and rolls the value back past the site's
 * own utility layer. Tailwind's text-white went with it.
 *
 * Every keystroke in the drawer re-runs the preview, and TEXT COLOUR sits on
 * "use default" - empty - so every keystroke wrote one.
 *
 * Undo what was set; leave everything else alone.
 */
describe('a revert undoes what was set', () => {
    it('writes nothing for a colour nobody ever set', () => {
        // The reported case. Stored holds nothing, so there is nothing to undo.
        expect(worthReverting('textColor', '', {})).toBe(false);
    });

    it('writes one for a colour that was set and has now been cleared', () => {
        /*
         * The behaviour being protected. Clearing a colour this site stored
         * must put the design's own back, and that is what revert is for.
         */
        expect(worthReverting('textColor', '', { textColor: '#ff0000' })).toBe(true);
    });

    it('writes nothing while a value is present', () => {
        expect(worthReverting('textColor', '#ffffff', { textColor: '#ff0000' })).toBe(false);
    });

    it('leaves every untouched property alone, not only colour', () => {
        /*
         * The same fault was waiting on all of them: padding, radius and a
         * background would each have discarded the host's own utility classes
         * the moment somebody typed into a drawer.
         */
        for (const prop of ['background', 'fontSize', 'radius', 'backgroundImage', 'paddingX', 'paddingY']) {
            expect(worthReverting(prop, '', {})).toBe(false);
        }
    });

    it('still reverts hidden, which is ours and has nothing underneath it', () => {
        // Drawn only while editing, so there is no host styling to protect.
        expect(worthReverting('hidden', '', {})).toBe(true);
    });

    it('knows which CSS property each control puts back', () => {
        expect(PUTS_BACK.textColor).toBe('color');
        expect(PUTS_BACK.background).toBe('background');
        expect(PUTS_BACK.fontSize).toBe('font-size');
        expect(PUTS_BACK.radius).toBe('border-radius');
    });
});
