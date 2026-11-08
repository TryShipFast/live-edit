import { describe, expect, it } from 'vitest';
import { agoSaid, changeSaid, describeVersion, exactSaid, listSaid, pageOfUnit, shortWords, versionsWorthShowing } from '../../resources/js/history.js';

/*
 * History said the way people already read it (owner, 8 Nov 2026: "published changes needs to be fixed too, it's
 * confusing"): when, who, and what changed by page and section, with the words before and after.
 */

const NOW = new Date('2026-11-08T14:14:00').getTime();
const pages = [{ id: '', title: 'Home' }, { id: 'packages', title: 'Packages' }, { id: 'products/kemi-gingham-dress', title: 'Kemi gingham dress' }];

describe('when', () => {
    it('says it as a person would, one of a thing as one', () => {
        expect(agoSaid(new Date(NOW - 30000).toISOString(), NOW)).toBe('Just now');
        expect(agoSaid(new Date(NOW - 3600000).toISOString(), NOW)).toBe('1 hour ago');
        expect(agoSaid(new Date(NOW - 86400000).toISOString(), NOW)).toBe('1 day ago');
        expect(agoSaid(new Date(NOW - 2 * 86400000).toISOString(), NOW)).toBe('2 days ago');
    });

    it('gives the exact day and time', () => {
        expect(exactSaid(new Date('2026-11-07T14:14:00').toISOString())).toBe('Sat 7 Nov, 2:14pm');
        expect(exactSaid(new Date('2026-11-08T09:05:00').toISOString())).toBe('Sun 8 Nov, 9:05am');
    });
});

describe('what', () => {
    it('names the page from its part of the page', () => {
        expect(pageOfUnit('section:packages.prices', pages)).toBe('Packages');
        expect(pageOfUnit('section:products-kemi-gingham-dress.detail', pages)).toBe('Kemi gingham dress');
        expect(pageOfUnit('section:home.hero', pages)).toBe('Home');
        expect(pageOfUnit('arrangement:packages', pages)).toBe('Packages');
        expect(pageOfUnit('site/header', pages)).toBe('Every page');
        expect(pageOfUnit('key:x', pages)).toBeNull();
    });

    it('says words before and after, shortened', () => {
        expect(changeSaid({ what: 'the price', before: '₦25,000', after: '₦28,000' })).toBe('Price: “₦25,000” → “₦28,000”');
        expect(changeSaid({ what: 'the heading', before: null, after: 'Spring sale' })).toBe('Heading: “Spring sale”');
        expect(changeSaid({ what: null, before: 'a', after: null })).toBe('Words changed');
        expect(changeSaid({ kind: 'style', what: 'the styling' })).toBe('Changed how it looks');
        expect(shortWords('word '.repeat(30)).length).toBeLessThanOrEqual(61);
    });

    it('says what happened to a list', () => {
        expect(listSaid('1 item removed, leaving 9 items', 'section')).toBe('Removed a section');
        expect(listSaid('2 items added, leaving 5 items')).toBe('Added 2 cards');
        expect(listSaid('The order changed')).toBe('Changed the order of the cards');
        expect(changeSaid({ unit: 'arrangement:packages', list: '1 item removed, leaving 9 items' })).toBe('Removed a section');
    });
});

describe('a publish', () => {
    const version = {
        number: 7,
        changes: 4,
        published_at: new Date(NOW - 86400000).toISOString(),
        published_by: 'Ada',
        published_by_id: 'u1',
        lines: [
            { unit: 'section:packages.prices', label: 'Service price list', what: 'the price', before: '₦25,000', after: '₦28,000' },
            { unit: 'arrangement:packages', label: 'Page layout', list: '1 item removed, leaving 9 items' },
            { unit: 'sale:kemi', label: 'Kemi gingham dress', what: 'the sale price', before: 'No sale', after: '₦49,950' },
            { unit: 'sale:kemi', label: 'Kemi gingham dress', what: 'the sale end day', before: 'No end date', after: '15 Nov 2026' },
        ],
    };

    it('reads as who, when, and what by page and section', () => {
        const said = describeVersion(version, { you: 'u1', pages, all: [version], now: NOW });
        expect(said.title).toBe('You published 4 changes');
        expect(said.when).toBe('1 day ago');
        expect(said.places).toEqual([
            { place: 'Packages · Service price list', changes: ['Price: “₦25,000” → “₦28,000”'] },
            { place: 'Packages', changes: ['Removed a section'] },
            { place: 'Kemi gingham dress', changes: ['On sale at ₦49,950 until 15 Nov'] },
        ]);
        expect(said.undoable).toBe(true);
        expect(describeVersion(version, { you: 'u2', pages, now: NOW }).title).toBe('Ada published 4 changes');
    });

    it('is not shown when it changed nothing, and says when it was undone', () => {
        const nothing = { number: 8, changes: 0, lines: [] };
        expect(versionsWorthShowing([version, nothing])).toEqual([version]);
        const undo = { number: 9, changes: 1, undoes: 7, published_by: 'Ada', lines: [{ unit: 'section:packages.prices', label: 'Service price list', what: 'the price', before: '₦28,000', after: '₦25,000', undid: true }] };
        const all = [undo, version];
        expect(describeVersion(version, { pages, all, now: NOW }).undoneLater).toBe(true);
        expect(describeVersion(version, { pages, all, now: NOW }).undoable).toBe(false);
        expect(describeVersion(undo, { pages, all, now: NOW }).title).toMatch(/^Ada undid the changes published /);
    });

    it('never says "Other changes": a change with no page says only what it was', () => {
        const said = describeVersion({ number: 1, changes: 2, lines: [{ what: 'the text', before: 'a', after: 'b' }, { what: 'the text', after: 'c' }] }, { pages, now: NOW });
        expect(said.title).toBe('Published 2 changes');
        expect(said.places).toEqual([{ place: '', changes: ['Text: “a” → “b”', 'Text: “c”'] }]);
    });
});
