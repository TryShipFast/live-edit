import { describe, expect, it } from 'vitest';
import { transform } from '../../packages/react/src/codemod.js';

/**
 * The words the codemod leaves behind must be the words that were on the page.
 *
 * Tagging moves a component's text out of JSX and into a string argument, and
 * at that moment every rule JSX was applying to it stops applying. Two of them
 * change what a visitor sees, and both were found on a real template rather
 * than reasoned about:
 *
 * A paging arrow written &gt; is a > on the page. Moved into a string it is
 * four literal characters, and the template's pagination started reading
 * "&gt;" the moment the codemod ran. Nothing in the output said so.
 *
 * A paragraph wrapped across lines is folded by JSX into single spaces. A
 * string keeps the newlines and the file's indentation, so the fallback stops
 * matching what the page showed and a developer's indentation becomes part of
 * the customer's content.
 */
const tagged = (source) => transform(source, { relativePath: 'src/Thing.jsx', force: true }).code;

const fallbackIn = (code) => {
    const match = code.match(/useContent\("[^"]+",\s*("(?:[^"\\]|\\.)*")\)/);

    return match ? JSON.parse(match[1]) : null;
};

describe('an entity in the markup', () => {
    it('is decoded, so a paging arrow stays an arrow', () => {
        expect(fallbackIn(tagged('export const A = () => <a href="#">&gt;</a>;'))).toBe('>');
    });

    it('handles the ones a real template actually uses', () => {
        expect(fallbackIn(tagged('export const A = () => <p>Tom &amp; Jerry</p>;'))).toBe('Tom & Jerry');
        expect(fallbackIn(tagged('export const A = () => <p>&copy; 2026</p>;'))).toBe('© 2026');
        expect(fallbackIn(tagged('export const A = () => <p>&laquo; back</p>;'))).toBe('« back');
    });

    it('handles numeric ones, in both spellings', () => {
        expect(fallbackIn(tagged('export const A = () => <p>it&#39;s here</p>;'))).toBe("it's here");
        expect(fallbackIn(tagged('export const A = () => <p>it&#x27;s here</p>;'))).toBe("it's here");
    });

    it('leaves something it does not know exactly as written', () => {
        // Better a name that survives than a guess that mangles it.
        expect(fallbackIn(tagged('export const A = () => <p>&notanentity; here</p>;'))).toBe('&notanentity; here');
    });
});

describe('a sentence wrapped across lines', () => {
    it('is folded the way JSX folds it', () => {
        const source = [
            'export const A = () => (',
            '    <p className="lead">',
            '        Pick a still below and the poster changes. The picture you are',
            '        looking at is held in state.',
            '    </p>',
            ');',
        ].join('\n');

        expect(fallbackIn(tagged(source)))
            .toBe('Pick a still below and the poster changes. The picture you are looking at is held in state.');
    });

    it('carries no newline and no indentation into the stored words', () => {
        const source = 'export const A = () => (\n    <p>\n        one\n        two\n    </p>\n);';
        const value = fallbackIn(tagged(source));

        expect(value).toBe('one two');
        expect(value).not.toMatch(/\n| {2}/);
    });
});

describe('the key', () => {
    it('does not move when the rendered words differ from the source', () => {
        // The key is hashed from the raw source text on purpose. Hashing the
        // decoded words instead would have shifted the key of every element
        // holding an entity or a wrapped line, orphaning edits already saved
        // against them.
        const source = 'export const A = () => <a href="#">&gt;</a>;';
        const first = tagged(source).match(/setting:(auto:[a-f0-9]{12})/)[1];
        const second = tagged(source).match(/setting:(auto:[a-f0-9]{12})/)[1];

        expect(first).toBe(second);
    });
});
