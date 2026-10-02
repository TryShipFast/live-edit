import { describe, expect, it } from 'vitest';
import { attrsWorthSending, creditWorthSending } from '../../resources/js/only-what-changed.js';

/**
 * The half of "one change counts as one" that only the panel can decide.
 *
 * The store refuses a write matching what it already holds, which covers every
 * client and every second save. It cannot judge a first write: an empty credit
 * where nothing is stored, and a description that came from the page's own
 * markup, both look like new information from the server's side. Only the panel
 * knows neither was ever typed.
 */

const field = (value, was) => ({ value, dataset: { imgAttrWas: was } });

describe('the credit fields worth sending', () => {
    it('drops the empty ones, which is five of the six', () => {
        /*
         * What the stock picker hands over for a photograph whose owner filled
         * in nothing but their name. Five empty strings were five changes.
         */
        const worth = creditWorthSending({
            credit: 'Jane Doe',
            creditBy: '',
            creditUrl: '',
            creditSource: '',
            creditSourceUrl: '',
            creditTitle: '',
        });

        expect(worth).toEqual([['credit', 'Jane Doe']]);
    });

    it('keeps every field that says something', () => {
        // The guard must not be so keen that a real credit goes missing - the
        // wrong credit is worse than none, and so is no credit where one was
        // given.
        const worth = creditWorthSending({ credit: 'Jane Doe', creditUrl: 'https://example.com' });

        expect(worth).toHaveLength(2);
    });

    it('says nothing about a picture that carries no credit at all', () => {
        expect(creditWorthSending(null)).toEqual([]);
        expect(creditWorthSending(undefined)).toEqual([]);
        expect(creditWorthSending({})).toEqual([]);
    });
});

describe('the text fields worth sending', () => {
    it('ignores a description handed back exactly as it was found', () => {
        // Filled from the page when the panel opens. Sending it back asked the
        // service to store what it would have rendered anyway, and it counted.
        const worth = attrsWorthSending([
            field('A dashboard on a laptop', 'A dashboard on a laptop'),
        ]);

        expect(worth).toEqual([]);
    });

    it('sends one somebody actually typed in', () => {
        const typed = field('A dashboard on a desk', 'A dashboard on a laptop');

        expect(attrsWorthSending([typed])).toEqual([typed]);
    });

    it('sends a description somebody deliberately cleared', () => {
        /*
         * The case that stops this being "ignore empty fields". Clearing a
         * description that came from the markup is a real intention, and the
         * store cannot tell it from an untouched field because nothing was
         * ever written for that key.
         */
        const cleared = field('', 'A dashboard on a laptop');

        expect(attrsWorthSending([cleared])).toEqual([cleared]);
    });

    it('treats a field with no remembered value as untouched when still empty', () => {
        expect(attrsWorthSending([{ value: '', dataset: {} }])).toEqual([]);
    });

    it('picks out only the touched ones from a panel full of fields', () => {
        const alt = field('Something new', 'Something old');

        expect(attrsWorthSending([
            field('A tooltip', 'A tooltip'),
            alt,
            field('', ''),
        ])).toEqual([alt]);
    });
});
