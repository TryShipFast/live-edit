import { describe, expect, it } from 'vitest';
import { looksLikeAPicture } from '../../resources/js/support.js';

/**
 * Telling a stored picture from something to read.
 *
 * The list of pending changes renders every value as text, which for a picture
 * is a hundred-character address truncated to seventy. A customer asked how to
 * undo replacing a picture, and the honest answer was that the row had been
 * there all along and was already revertible - it just could not be
 * recognised: two unreadable URLs, one of them struck through.
 *
 * Asked of the value because the keys say nothing - they are
 * `auto:4d90041f39e2`. The page is the better authority where the element is
 * still on it, and the panel checks that first; this is what is left for a
 * change made on a page somebody has since navigated away from, which is
 * exactly when the panel is most useful.
 */
describe('recognising a stored picture', () => {
    it('knows the path this runtime stores pictures under', () => {
        /*
         * The case that matters most and the one an extension check misses:
         * stored pictures are served with a generated name and frequently no
         * extension at all. This is a real address from a real site.
         */
        expect(looksLikeAPicture(
            'https://live.tryshipfast.com/storage/live-edit/sites/learnkasts/WVVwnmgPZ44bELcsd81nsDqidKTp2mc4yCAHthKr'
        )).toBe(true);
    });

    it('knows an ordinary picture address', () => {
        expect(looksLikeAPicture('/images/marketing/hero-devices.webp')).toBe(true);
        expect(looksLikeAPicture('https://cdn.example.com/a/b/photo.JPG')).toBe(true);
        expect(looksLikeAPicture('https://example.com/logo.svg')).toBe(true);
    });

    it('is not fooled by a query string hung off the end', () => {
        // Cache busters and resize parameters are ordinary on these addresses,
        // and a check anchored to the end of the string misses every one.
        expect(looksLikeAPicture('/hero.webp?v=3')).toBe(true);
        expect(looksLikeAPicture('/hero.png#frag')).toBe(true);
    });

    it('knows a picture pasted in as data', () => {
        expect(looksLikeAPicture('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    });

    it('does not mistake words for a picture', () => {
        // The ordinary case: a heading, a sentence, a link. Getting this wrong
        // puts a broken thumbnail where somebody expected to read their words.
        expect(looksLikeAPicture('Built for African realities')).toBe(false);
        expect(looksLikeAPicture('https://example.com/pricing')).toBe(false);
        expect(looksLikeAPicture('A dashboard on a laptop')).toBe(false);
    });

    it('treats nothing at all as nothing to show', () => {
        expect(looksLikeAPicture('')).toBe(false);
        expect(looksLikeAPicture('   ')).toBe(false);
        expect(looksLikeAPicture(null)).toBe(false);
        expect(looksLikeAPicture(undefined)).toBe(false);
    });

    it('does not read a sentence that merely mentions a file as a picture', () => {
        // "Download the logo.png file" is words about a picture, not one.
        expect(looksLikeAPicture('Download the logo.png file from here')).toBe(false);
    });
});
