import { describe, expect, it } from 'vitest';
import {
    filtersFor, filterableFields, fromParams, loose, passes, prepare, scoreOf, search, shown, sortsFor, summaryOf,
    toDate, toNumber, toParams, toYesNo,
} from '../../resources/js/collection-search.js';

/*
 * The owner's case (the website's CUSTOMER-CASES.md): an aviation parts supplier whose visitors search its
 * parts by part number, filter by aircraft and condition, and ask for a quote. Fictional parts.
 */
const fields = [
    { key: 'part_number', label: 'Part number', type: 'text', code: true },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'maker', label: 'Manufacturer', type: 'text' },
    { key: 'aircraft', label: 'Aircraft type', type: 'choice', options: ['ATR 72', 'B737-300', 'B737-800', 'Dash 8'] },
    { key: 'condition', label: 'Condition', type: 'choice', options: ['NE', 'OH', 'SV', 'AR'] },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'price', label: 'Price', type: 'number', unit: '₦', blank: 'On request' },
    { key: 'certificate', label: 'Certificate', type: 'yesno' },
    { key: 'listed', label: 'Listed on', type: 'date' },
    { key: 'photo', label: 'Photo', type: 'photo' },
];
const records = [
    { id: 'r1', part_number: '2-1586-3', name: 'Main wheel brake assembly', maker: 'Meggitt', aircraft: 'B737-800', condition: 'SV', quantity: 2, price: 4500000, certificate: true, listed: '2026-09-01' },
    { id: 'r2', part_number: '3214552-4', name: 'Starter generator', maker: 'Thales', aircraft: 'ATR 72', condition: 'OH', quantity: 1, price: null, certificate: true, listed: '2026-10-12' },
    { id: 'r3', part_number: '2-1586-30', name: 'Brake wear pin', maker: 'Meggitt', aircraft: 'B737-800', condition: 'NE', quantity: 40, price: 12000, certificate: false, listed: '2026-08-20' },
    { id: 'r4', part_number: 'D23189000-5', name: 'Fuel boost pump', maker: 'Crane', aircraft: 'B737-300', condition: 'AR', quantity: 1, price: 900000, certificate: false, listed: '2026-07-02' },
    { id: 'r5', part_number: '066-50008-0101', name: 'Weather radar receiver', maker: 'Honeywell', aircraft: 'Dash 8', condition: 'OH', quantity: 3, price: 2500000, certificate: true, listed: '2026-10-30' },
];
const parts = prepare({ fields, records, title: 'name' });
const ids = (found) => found.results.map((r) => r.id);

describe('a part number is found exactly and loosely', () => {
    it('ignores dashes, spaces, dots and slashes', () => {
        expect(loose('2-1586-3')).toBe('215863');
        expect(loose(' 2 1586/3. ')).toBe('215863');
        expect(ids(search(parts, { query: '2-1586-3' }))[0]).toBe('r1');
        expect(ids(search(parts, { query: '215863' }))[0]).toBe('r1');
        expect(ids(search(parts, { query: '2 1586 3' }))[0]).toBe('r1');
    });

    it('puts the exact part first and says which one it is, with the longer number after it', () => {
        const found = search(parts, { query: '2-1586-3' });
        expect(ids(found)).toEqual(['r1', 'r3']);
        expect(found.exact.id).toBe('r1');
    });

    it('finds a number by its start, and holds no exact match when there is none', () => {
        const found = search(parts, { query: '066-500' });
        expect(ids(found)).toEqual(['r5']);
        expect(found.exact).toBeNull();
    });

    it('a code is matched case-free', () => {
        expect(ids(search(parts, { query: 'd23189000-5' }))).toEqual(['r4']);
    });
});

describe('words are searched', () => {
    it('every word typed must be in the record, in any field of words or choice', () => {
        expect(ids(search(parts, { query: 'brake meggitt' })).sort()).toEqual(['r1', 'r3']);
        expect(ids(search(parts, { query: 'brake thales' }))).toEqual([]);
        expect(ids(search(parts, { query: 'atr 72' }))).toEqual(['r2']);
    });

    it('a record whose name holds the words comes before one that only mentions them', () => {
        const generator = scoreOf(parts.rows[1], 'starter');
        const elsewhere = scoreOf(parts.rows[0], 'meggitt');
        expect(generator).toBeGreaterThan(elsewhere);
    });

    it('ignores accents and capitals', () => {
        expect(ids(search(parts, { query: 'WEATHER Rádar' }))).toEqual(['r5']);
    });

    it('nothing typed shows every record in its own order', () => {
        expect(search(parts, {}).count).toBe(5);
        expect(ids(search(parts, {}))).toEqual(['r1', 'r2', 'r3', 'r4', 'r5']);
    });

    it('nonsense finds nothing', () => {
        expect(search(parts, { query: 'zzqx-nonsense' }).count).toBe(0);
    });
});

describe('the data\'s shape decides the filters', () => {
    it('a choice is chips when few, a number a range, a date a range, a yes or no a toggle', () => {
        const filters = filtersFor({ fields, records });
        expect(filters.map((f) => [f.key, f.kind, f.as ?? ''])).toEqual([
            ['aircraft', 'choice', 'chips'],
            ['condition', 'choice', 'chips'],
            ['quantity', 'range', ''],
            ['price', 'range', ''],
            ['certificate', 'toggle', ''],
            ['listed', 'dates', ''],
        ]);
        const condition = filters.find((f) => f.key === 'condition');
        expect(condition.options).toEqual([{ value: 'NE', count: 1 }, { value: 'OH', count: 2 }, { value: 'SV', count: 1 }, { value: 'AR', count: 1 }]);
        expect(filters.find((f) => f.key === 'quantity')).toMatchObject({ min: 1, max: 40 });
    });

    it('a choice with many options is a select', () => {
        const many = Array.from({ length: 9 }, (_, i) => ({ id: `m${i}`, name: `Part ${i}`, aircraft: `Type ${i}` }));
        const [filter] = filtersFor({ fields: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'aircraft', label: 'Aircraft', type: 'choice', options: [] }], records: many });
        expect(filter.as).toBe('select');
    });

    it('a filter the owner switched off is not offered, and one with nothing to choose between is left out', () => {
        expect(filtersFor({ fields, records }, ['condition']).map((f) => f.key)).toEqual(['condition']);
        expect(filtersFor({ fields, records: records.slice(0, 1) })).toEqual([]);
    });

    it('a collection of words only is a search box and nothing more', () => {
        expect(filtersFor({ fields: [{ key: 'name', label: 'Name', type: 'text' }], records })).toEqual([]);
        expect(filterableFields(fields).map((f) => f.key)).toEqual(['aircraft', 'condition', 'quantity', 'price', 'certificate', 'listed']);
    });

    it('filters narrow the results', () => {
        expect(ids(search(parts, { filters: { condition: ['OH'] } }))).toEqual(['r2', 'r5']);
        expect(ids(search(parts, { filters: { condition: ['OH', 'NE'], aircraft: 'Dash 8' } }))).toEqual(['r5']);
        expect(ids(search(parts, { filters: { quantity: { from: 2, to: '' } } }))).toEqual(['r1', 'r3', 'r5']);
        expect(ids(search(parts, { filters: { certificate: true } }))).toEqual(['r1', 'r2', 'r5']);
        expect(ids(search(parts, { filters: { listed: { from: '2026-10-01', to: '' } } }))).toEqual(['r2', 'r5']);
        expect(ids(search(parts, { query: 'brake', filters: { condition: ['NE'] } }))).toEqual(['r3']);
    });

    it('a price on request is left out of a price range, and sorts last', () => {
        expect(passes(records[1], { price: { from: 1 } }, fields)).toBe(false);
        expect(ids(search(parts, { sort: 'price:up' }))).toEqual(['r3', 'r4', 'r5', 'r1', 'r2']);
        expect(ids(search(parts, { sort: 'price:down' }))).toEqual(['r1', 'r5', 'r4', 'r3', 'r2']);
        expect(sortsFor(parts).map((s) => s.id)).toEqual(['best', 'quantity:up', 'quantity:down', 'price:up', 'price:down', 'title']);
    });
});

describe('values read as people write them', () => {
    it('numbers, in naira or with commas', () => {
        expect(toNumber('₦12,500')).toBe(12500);
        expect(toNumber('12 500')).toBe(12500);
        expect(toNumber('1.5')).toBe(1.5);
        expect(toNumber('ten')).toBeNull();
        expect(toNumber('')).toBeNull();
    });

    it('dates, day first', () => {
        expect(toDate('2026-03-04')).toBe('2026-03-04');
        expect(toDate('4/3/2026')).toBe('2026-03-04');
        expect(toDate('4 Mar 2026')).toBe('2026-03-04');
        expect(toDate('31/2/2026')).toBeNull();
        expect(toDate('soon')).toBeNull();
    });

    it('yes or no', () => {
        expect(toYesNo('Yes')).toBe(true);
        expect(toYesNo('n')).toBe(false);
        expect(toYesNo('')).toBe(false);
        expect(toYesNo('maybe')).toBeNull();
    });

    it('shown on a result in plain words, a blank price as the owner\'s words', () => {
        const price = fields.find((f) => f.key === 'price');
        expect(shown(price, 4500000)).toBe('₦4,500,000');
        expect(shown(price, null)).toBe('On request');
        expect(shown(fields.find((f) => f.key === 'certificate'), true)).toBe('Yes');
        expect(shown(fields.find((f) => f.key === 'listed'), '2026-03-04')).toBe('4 Mar 2026');
    });
});

describe('a search has an address, and a record carries itself into a quote', () => {
    it('the search is written into the address and read back', () => {
        const asked = { query: '2-1586-3', filters: { condition: ['OH', 'SV'], quantity: { from: 2, to: '' }, certificate: true }, sort: 'price:up' };
        const params = toParams(asked, fields);
        expect(params.toString()).toBe('q=2-1586-3&condition=OH%7CSV&quantity=2%7E&certificate=yes&sort=price%3Aup');
        expect(fromParams(params, fields)).toEqual({ query: '2-1586-3', filters: { condition: ['OH', 'SV'], quantity: { from: '2', to: '' }, certificate: true }, sort: 'price:up' });
    });

    it('a quote request names the part number, the part and its choices', () => {
        expect(summaryOf(records[0], fields, 'name')).toBe('2-1586-3, Main wheel brake assembly, Aircraft type: B737-800, Condition: SV');
    });
});

describe('fast on a phone', () => {
    it('three thousand records answer a keystroke in well under a frame', () => {
        const many = Array.from({ length: 3000 }, (_, i) => ({ id: `r${i}`, part_number: `${i % 97}-${1000 + i}-${i % 9}`, name: `Part ${i} assembly`, maker: ['Meggitt', 'Thales', 'Crane'][i % 3], aircraft: ['ATR 72', 'B737-300'][i % 2], condition: ['NE', 'OH', 'SV', 'AR'][i % 4], quantity: i % 50 }));
        const ready = prepare({ fields, records: many });
        const started = performance.now();
        for (const query of ['15-1500-5', '151500', 'assembly thales', 'zz']) search(ready, { query, filters: { condition: ['OH'] } });
        expect((performance.now() - started) / 4).toBeLessThan(16);
        expect(search(ready, { query: '15 1500 5' }).exact.id).toBe('r500');
    });
});
