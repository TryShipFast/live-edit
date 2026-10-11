import { afterEach, describe, expect, it } from 'vitest';
import { createChrome, PAGE_CSS } from '../../resources/js/chrome.js';

/**
 * Where the editor's own furniture lives in the document.
 *
 * It reads like housekeeping and it is not. Everything the chrome draws over
 * the page - the hover outline, the pencil, the background handle - is placed
 * from getBoundingClientRect(), which answers in post-zoom pixels. Templates
 * scale themselves up on wide screens, and they do it on the body:
 *
 *   @media (min-width: 1880px) { body { zoom: 1.25; } }
 *
 * Inside the body our overlay inherits that and applies it a second time. An
 * outline told to sit at 334px paints at 418px, the error grows down the page,
 * and the editor appears to be pointing at the wrong element. jsdom has no
 * layout and so cannot catch that by measuring; what it can hold is the one
 * structural fact the fix rests on.
 */
const chrome = () => {
    document.documentElement.querySelectorAll('#live-edit-ui').forEach((node) => node.remove());
    document.body.innerHTML = '';

    return createChrome({ api: {}, links: [] });
};

afterEach(() => {
    document.documentElement.querySelectorAll('#live-edit-ui').forEach((node) => node.remove());
});

describe('the editor is not part of the page', () => {
    it('mounts on the root rather than inside the body', () => {
        chrome();

        const root = document.querySelector('#live-edit-ui');

        expect(root).not.toBeNull();
        expect(root.parentElement).toBe(document.documentElement);
        expect(document.body.contains(root)).toBe(false);
    });

    it('still asks the page for room at the bottom, through the root', () => {
        /*
         * The clearance used to be written as `body:has(#live-edit-ui)`, which
         * stops matching the moment the editor is no longer a descendant of
         * the body. Losing it is not obvious in a screenshot - the bar simply
         * covers the last line of the footer, on the one page somebody is
         * editing - so it is named here beside the move that could drop it.
         */
        expect(PAGE_CSS).toContain('html:has(#live-edit-ui) > body');
        expect(PAGE_CSS).not.toMatch(/(^|[^>\s])\s*body:has\(#live-edit-ui\)/m);
    });
});
