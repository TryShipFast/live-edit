import { describe, expect, it } from 'vitest';
import { applyContent, applyValue } from '../../resources/js/content.js';

/**
 * Swapping a picture without it reading as a fault.
 *
 * The page paints the picture in its own markup, then the applier puts the
 * stored one in, so for a moment a visitor sees the old photograph and then
 * the new one. Reported as "it loads old image then new one, especially when
 * you just replaced it" - which is when the two differ most and when somebody
 * is certainly looking.
 *
 * The fade itself needs a browser to judge and is covered in the e2e journey.
 * What is worth pinning here is the pair of invariants that make it safe: the
 * source is still set in the same breath, and a picture that is not changing
 * is left entirely alone.
 */
const page = (html) => {
    document.body.innerHTML = html;

    return document;
};

describe('applying a picture', () => {
    it('sets the source in the same breath, so a save can be checked', () => {
        /*
         * The reason the swap is not deferred. A save is confirmed by reading
         * this attribute straight afterwards; wait for the file to decode
         * first and a correct save is reported to the customer as the page
         * refusing to update - which is a worse bug than the flash.
         */
        const root = page('<img data-edit-img="setting:auto:hero" src="/old.jpg">');

        applyContent(root, { 'auto:hero': '/new.jpg' });

        expect(root.querySelector('img').getAttribute('src')).toBe('/new.jpg');
    });

    it('leaves a picture that is not changing completely alone', () => {
        /*
         * Every page load applies the same stored picture that is already
         * there. Touching it would mean a fade on every load, for no change -
         * the flicker this exists to remove, reintroduced by the cure.
         */
        const root = page('<img data-edit-img="setting:auto:hero" src="/same.jpg">');
        const img = root.querySelector('img');

        applyValue(img, '/same.jpg');

        expect(img.getAttribute('style')).toBeNull();
    });

    it('treats a relative and an absolute form of one address as the same picture', () => {
        // The stored value is an absolute URL and the markup may hold a path
        // to the same file. Compared as strings, those look like a change.
        const root = page(`<img data-edit-img="setting:auto:hero" src="${document.baseURI}same.jpg">`);
        const img = root.querySelector('img');

        applyValue(img, '/same.jpg');

        expect(img.getAttribute('style')).toBeNull();
    });

    it('still replaces a picture that has never painted, without fading it in', () => {
        // Nothing to fade from. Fading in from nothing would invent a flicker
        // on a first load to hide one that was not there.
        const root = page('<img data-edit-img="setting:auto:hero">');
        const img = root.querySelector('img');

        applyValue(img, '/new.jpg');

        expect(img.getAttribute('src')).toBe('/new.jpg');
        expect(img.style.opacity).toBe('');
    });
});
