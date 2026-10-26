import { describe, expect, it } from 'vitest';
import { liftFor } from '../../resources/js/clear-of-the-bar.js';

/*
 * A site's fixed things at the foot of a phone screen (a Book and Call bar, a
 * cookie notice) sat under the editor's bar, where no scrolling reaches, so
 * the owner could not click them. Found on Maren Salon at 390 by the walk.
 */
const bar = { left: 10, right: 380, top: 688, bottom: 824, width: 370, height: 136 };
const rect = (top, bottom, left = 0, right = 390) => ({ top, bottom, left, right, width: right - left, height: bottom - top });

describe('what the bar covers is lifted just above it', () => {
    it('lifts a phone action bar under it clear of its top, with a gap', () => {
        expect(liftFor(rect(786, 834), bar, 844)).toBe(834 - (688 - 8));
    });

    it('lifts a cookie notice it half covers', () => {
        expect(liftFor(rect(654, 744), bar, 844)).toBe(744 - 680);
    });

    it('leaves what it does not touch', () => {
        expect(liftFor(rect(0, 64), bar, 844)).toBe(0);
        expect(liftFor(rect(700, 760, 382, 390), bar, 844)).toBe(0);
    });

    it('never slides away a full-screen menu or dialog', () => {
        expect(liftFor(rect(0, 844), bar, 844)).toBe(0);
    });

    it('leaves what is not drawn', () => {
        expect(liftFor({ top: 700, bottom: 700, left: 0, right: 0, width: 0, height: 0 }, bar, 844)).toBe(0);
    });
});
