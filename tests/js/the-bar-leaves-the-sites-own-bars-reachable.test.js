import { describe, expect, it } from 'vitest';
import { keepClearOfTheBar, liftFor, roomFor } from '../../resources/js/clear-of-the-bar.js';

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

describe('a full-screen menu the bar covers gets room at its foot', () => {
    it('adds as much room as the bar covers, with a gap, so its last links scroll above it', () => {
        expect(roomFor(rect(0, 844), bar, 844)).toBe(844 - 688 + 8);
    });

    it('adds none to what is small (that is lifted) or what the bar does not touch', () => {
        expect(roomFor(rect(786, 834), bar, 844)).toBe(0);
        expect(roomFor(rect(0, 600), bar, 844)).toBe(0);
    });
});

describe('the room is added once, however often the page changes', () => {
    /*
     * Adeola Crest's phone menu grew by the bar's height at every change on the page, to millions of pixels, and its
     * last links went out of reach: the menu animates its padding, so the padding read back after the room was taken
     * off was still the room. The room is added to the menu's own padding, read with transitions off.
     */
    it('keeps a menu that animates its padding at its own padding plus the room', () => {
        // a menu whose padding is animated: straight after a change, what is read is the value it animates from,
        // unless transitions are off
        let before = '', now = '';
        const attributes = new Map();
        const style = { transition: '' };
        Object.defineProperty(style, 'paddingBottom', { get: () => now, set: (v) => { before = now; now = v; } });
        const menu = {
            style,
            contains: (other) => other === menu,
            getBoundingClientRect: () => rect(0, 844),
            hasAttribute: (name) => attributes.has(name),
            getAttribute: (name) => attributes.get(name) ?? null,
            setAttribute: (name, value) => attributes.set(name, String(value)),
            removeAttribute: (name) => attributes.delete(name),
        };
        let changed = () => {};
        const timers = [];
        const view = {
            innerHeight: 844,
            getComputedStyle: () => ({ position: 'fixed', paddingBottom: (style.transition === 'none' ? now : before) || '0px' }),
            MutationObserver: class { constructor(callback) { changed = callback; } observe() {} disconnect() {} },
            setTimeout: (fn) => timers.push(fn),
            clearTimeout: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
        };
        const doc = { defaultView: view, body: { querySelectorAll: () => [menu] } };
        const stop = keepClearOfTheBar({ bar: { getBoundingClientRect: () => bar }, isEditing: () => true, doc });
        const room = 844 - 688 + 8;
        expect(now).toBe(`${room}px`);
        for (let i = 0; i < 4; i++) { changed(); timers.shift()(); }
        expect(now).toBe(`${room}px`);
        stop();
        expect(now).toBe('');
        expect(menu.hasAttribute('data-le-room-before')).toBe(false);
    });
});
