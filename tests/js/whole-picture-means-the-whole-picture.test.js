import { describe, expect, it } from 'vitest';

import { WHOLE_PICTURE } from '../../resources/js/live-edit.js';

/**
 * The crop sheet offers two buttons: "Use this part" and "Whole picture".
 *
 * Both used to resolve to the same thing. "Use this part" returned a
 * rectangle, "Whole picture" returned null - and null already meant "nobody
 * chose a rectangle", which the server reads as "take the middle of it, cut to
 * the shape of the spot". So the button labelled Whole picture cropped the
 * picture, and a client who uploaded a 4000px photograph into a 644px slot got
 * 644px of its middle.
 *
 * Reported as exactly that: an upload is held to the size that was there
 * before. And only on upload, because a free photograph from the picker is
 * pointed at rather than stored and never passes through any of this - which
 * is the detail that located it.
 *
 * What follows is the rule the fix rests on: the sentinel has to be
 * distinguishable from both a rectangle and from null, because those three
 * mean three different things and only one of them keeps the whole file.
 */
describe('choosing the whole picture', () => {
    it('is not the same answer as choosing nothing', () => {
        /*
         * The bug in one line. If these were ever equal again, the server
         * would go back to centre-cropping a picture somebody asked to keep
         * all of.
         */
        expect(WHOLE_PICTURE).not.toBe(null);
        expect(WHOLE_PICTURE).not.toBeUndefined();
    });

    it('is truthy, because the send path checks for a choice before reading it', () => {
        // `if (current.crop && !keepingAllOfIt)` - a falsy sentinel would be
        // skipped by the first half and never reach the second.
        expect(Boolean(WHOLE_PICTURE)).toBe(true);
    });

    it('is not mistakable for a rectangle', () => {
        /*
         * It travels through the same variable a crop rectangle does. Anything
         * that could be read as one would be sent as cropX/cropY and cut the
         * picture to a rectangle nobody drew.
         */
        expect(typeof WHOLE_PICTURE).toBe('string');
        expect(WHOLE_PICTURE).not.toHaveProperty('x');
        expect(WHOLE_PICTURE).not.toHaveProperty('width');
    });
});
