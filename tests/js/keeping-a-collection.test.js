import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    collectionsIn, fieldsFromCsv, guessMapping, idFrom, keyFrom, pagesOf, parseCsv, readCsvRows, readValue, retyped,
    rowsKey, schemaKey, schemaProblems, toCsv, writesFor, MOST_CHARACTERS,
} from '../../resources/js/collections.js';
import { renderCsvImport, renderSearchPanel, renderTableEditor, saveCollection } from '../../resources/js/collections-panel.js';

/*
 * A collection kept by the owner (the website's LIVE-EDIT-STRUCTURE.md, "Search over a collection"): typed
 * fields, records saved in pages of rows that each fit one setting, a spreadsheet read in with every bad
 * row said in plain words, and a table to edit it in. The sample is the host's own fictional parts file.
 */
const SAMPLE = readFileSync(join(process.cwd(), 'tests/support/aircraft-parts.csv'), 'utf8');

const parts = {
    name: 'Aircraft parts', one: 'part', many: 'parts', title: 'name',
    fields: [
        { key: 'part_number', label: 'Part number', type: 'text', code: true },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'condition', label: 'Condition', type: 'choice', options: ['NE', 'OH', 'SV', 'AR'] },
        { key: 'quantity', label: 'Quantity', type: 'number' },
        { key: 'certificate', label: 'Certificate', type: 'yesno' },
        { key: 'listed', label: 'Listed on', type: 'date' },
        { key: 'photo', label: 'Photo', type: 'photo' },
    ],
};

describe('a new collection is worked out from a spreadsheet', () => {
    it('every column becomes the right kind of field', () => {
        const fields = fieldsFromCsv(parseCsv(SAMPLE));
        expect(fields.map((f) => [f.key, f.type, f.code ?? false])).toEqual([
            ['part_number', 'text', true],
            ['name', 'text', false],
            ['manufacturer', 'text', false],
            ['aircraft_type', 'choice', false],
            ['condition', 'choice', false],
            ['quantity', 'number', false],
            ['price', 'number', false],
            ['certificate', 'yesno', false],
            ['listed_on', 'date', false],
        ]);
        expect(fields.find((f) => f.key === 'condition').options.sort()).toEqual(['AR', 'NE', 'OH', 'SV']);
        // a price is in naira, and an empty one reads On request
        expect(fields.find((f) => f.key === 'price')).toMatchObject({ unit: '₦', blank: 'On request' });
    });

    it('names and keys are made from the words', () => {
        expect(keyFrom('Aircraft type')).toBe('aircraft_type');
        expect(keyFrom('Name', ['name'])).toBe('name_2');
        expect(idFrom('Aircraft parts')).toBe('aircraft-parts');
        expect(idFrom('Aircraft parts', ['aircraft-parts'])).toBe('aircraft-parts-2');
    });
});

describe('a spreadsheet is read into records, each bad row said with its number', () => {
    it('columns are matched to fields by their headings, whatever they are called', () => {
        expect(guessMapping(['P/N', 'Name', 'Qty', 'Nonsense', 'condition'], parts.fields)).toEqual(['part_number', 'name', 'quantity', '', 'condition']);
    });

    it('good rows are ready and bad ones refused in plain words', () => {
        const rows = parseCsv('P/N,Name,Qty,Condition,Listed on\n9-9999-1,Good pump,3,oh,4/3/2026\n9-9999-2,,2,NE,\n9-9999-3,Bad quantity,ten,SV,\n9-9999-4,Bad condition,1,Broken,\n9-9999-1,Same number,1,NE,\n9-9999-6,Bad date,1,NE,soon\n');
        const read = readCsvRows(rows, parts, guessMapping(rows[0], parts.fields), { now: 1 });
        expect(read.ready).toHaveLength(1);
        expect(read.ready[0]).toMatchObject({ part_number: '9-9999-1', name: 'Good pump', quantity: 3, condition: 'OH', listed: '2026-03-04' });
        expect(read.problems.map((p) => p.says)).toEqual([
            'Row 3: it has no name.',
            'Row 4: Quantity "ten" is not a number.',
            'Row 5: Condition "Broken" is not one of its options (NE, OH, SV, AR).',
            'Row 6: Part number 9-9999-1 is also on row 2.',
            'Row 7: Listed on "soon" is not a date (write 2026-03-04 or 4/3/2026).',
        ]);
    });

    it('a file with no column matched says so', () => {
        expect(readCsvRows([['x'], ['y']], parts, ['']).problems[0].says).toMatch(/No column is matched/);
    });

    it('values are kept as their type, and a photo must be a web address', () => {
        expect(readValue(parts.fields[3], '₦1,200')).toEqual({ value: 1200 });
        expect(readValue(parts.fields[4], 'Yes')).toEqual({ value: true });
        expect(readValue(parts.fields[6], 'javascript:alert(1)').says).toMatch(/web address/);
        expect(readValue(parts.fields[1], '<b>x</b>').says).toMatch(/< or >/);
    });

    it('the collection goes back out as the same CSV', () => {
        const rows = parseCsv(SAMPLE);
        const fields = fieldsFromCsv(rows);
        const schema = { name: 'Parts', fields, title: 'name' };
        const { ready } = readCsvRows(rows, schema, fields.map((f) => f.key), { now: 1 });
        expect(ready).toHaveLength(40);
        const again = parseCsv(toCsv(schema, ready));
        expect(again[0]).toEqual(rows[0]);
        expect(again[1].slice(0, 6)).toEqual(rows[1].slice(0, 6));
    });
});

describe('a collection is saved in pages that each fit one setting', () => {
    const many = Array.from({ length: 3000 }, (_, i) => ({ id: `r${i}`, part_number: `${i}-1586-3`, name: `Main wheel brake assembly number ${i}`, condition: 'OH', quantity: i, certificate: true, listed: '2026-01-01', photo: '' }));

    it('three thousand records fit, every page under the most a setting holds', () => {
        const pages = pagesOf(many);
        expect(pages.flat()).toHaveLength(3000);
        for (const page of pages) expect(JSON.stringify(page).length).toBeLessThanOrEqual(MOST_CHARACTERS);
    });

    it('the rows are written first and the collection last, and pages it no longer needs are emptied', () => {
        const writes = writesFor('parts', parts, many.slice(0, 10), 3);
        expect(writes.map((w) => w.key)).toEqual([rowsKey('parts', 1), rowsKey('parts', 2), rowsKey('parts', 3), schemaKey('parts')]);
        expect(writes[1].value).toBe('');
        expect(JSON.parse(writes.at(-1).value)).toMatchObject({ name: 'Aircraft parts', pages: 1 });
    });

    it('read back from the settings, records and all', () => {
        const settings = Object.fromEntries(writesFor('parts', parts, many.slice(0, 500)).map((w) => [w.key, w.value]));
        const [found] = collectionsIn(settings);
        expect(found.id).toBe('parts');
        expect(found.records).toHaveLength(500);
    });

    it('a collection that cannot be saved says why', () => {
        expect(schemaProblems({ name: '', fields: [] })).toEqual(['Give the collection a name.', 'A collection needs at least one field.']);
        expect(schemaProblems({ name: 'X', fields: [{ key: 'a', label: 'A', type: 'number' }] })).toContain('A collection needs at least one field of words, for its records\' names.');
        expect(schemaProblems({ name: 'X', fields: [{ key: 'a', label: 'A', type: 'text' }, { key: 'b', label: 'a', type: 'text' }] })).toContain('Two fields are both called "a".');
    });

    it('a save refused for speed waits as the server asks and goes on', async () => {
        let refused = false;
        const save = vi.fn(async () => {
            if (!refused) { refused = true; throw Object.assign(new Error('Too many'), { status: 429, retryAfter: 3 }); }
        });
        const waited = [];
        await saveCollection({ id: 'parts', schema: parts, records: many.slice(0, 5), save, wait: async (s) => { waited.push(s); } });
        expect(waited).toEqual([3]);
        expect(save).toHaveBeenCalledTimes(3);
    });

    it('a field retyped reads every record again, and refuses the ones that do not fit', () => {
        const records = [{ id: 'a', quantity_words: '4' }, { id: 'b', quantity_words: 'four' }];
        const result = retyped(records, { key: 'quantity_words', label: 'Quantity', type: 'text' }, 'number');
        expect(result.refused).toEqual(['Record 2: Quantity "four" is not a number']);
        expect(result.records[0].quantity_words).toBe(4);
    });
});

/* ------------------------------ the editor's windows ------------------------------ */

const handle = () => {
    const card = document.createElement('div');
    const body = document.createElement('div');
    const foot = document.createElement('div');
    card.append(body, foot);
    document.body.append(card);
    return { card, body, foot, title: vi.fn(), subtitle: vi.fn(), close: vi.fn(), allowDismiss: vi.fn() };
};

describe('the Search tab and the table', () => {
    const collection = { id: 'parts', ...parts, pages: 1, records: [
        { id: 'r1', part_number: '2-1586-3', name: 'Main wheel brake assembly', condition: 'SV', quantity: 2, certificate: true, listed: '2026-09-01', photo: '' },
        { id: 'r2', part_number: '3214552-4', name: 'Starter generator', condition: 'OH', quantity: 1, certificate: false, listed: '', photo: '' },
    ] };

    it('the tab lists each collection with its records, and ways to keep it', () => {
        const container = document.createElement('div');
        const openTable = vi.fn();
        renderSearchPanel({ container, config: { collections: [collection], missed: { href: '/dashboard#search', count: 3 } }, openTable, openImport: vi.fn(), openNew: vi.fn() });
        expect(container.querySelector('.le-collection').textContent).toContain('Aircraft parts2 parts');
        container.querySelector('.le-collection-open').click();
        expect(openTable).toHaveBeenCalledWith(collection);
        expect(container.querySelector('.le-search-missed').textContent).toContain('3 searches found nothing');
    });

    it('a record is added, edited and deleted in the table, and saved as the collection', async () => {
        const ui = handle();
        const saved = {};
        const done = vi.fn();
        renderTableEditor({ ui, collection, save: async (key, value) => { saved[key] = value; }, done, notify: vi.fn() });
        expect(ui.body.querySelectorAll('tbody tr')).toHaveLength(2);
        // the quantity of the starter generator
        const quantity = ui.body.querySelector('tr[data-record="r2"] input[aria-label="Quantity of Starter generator"]');
        quantity.value = '7';
        quantity.dispatchEvent(new Event('input'));
        // a new part
        ui.body.querySelector('.le-table-add').click();
        const fresh = ui.body.querySelector('tbody tr');
        const boxes = fresh.querySelectorAll('input, select');
        boxes[0].value = '066-50008-0101'; boxes[0].dispatchEvent(new Event('input'));
        boxes[1].value = 'Weather radar receiver'; boxes[1].dispatchEvent(new Event('input'));
        boxes[2].value = 'OH'; boxes[2].dispatchEvent(new Event('change'));
        // the brake goes
        ui.body.querySelector('tr[data-record="r1"] .le-table-delete').click();
        expect(ui.foot.querySelector('.le-table-status').textContent).toBe('3 changes not saved yet');
        ui.foot.querySelector('.le-table-save').click();
        await vi.waitFor(() => expect(done).toHaveBeenCalled());
        const rows = JSON.parse(saved['collection:parts:rows:1']);
        expect(rows.map((r) => r.name)).toEqual(['Weather radar receiver', 'Starter generator']);
        expect(rows[1].quantity).toBe(7);
        expect(JSON.parse(saved['collection:parts']).pages).toBe(1);
    });

    it('a cell that does not fit its field stops the save and is said', async () => {
        const ui = handle();
        const save = vi.fn();
        const notify = vi.fn();
        renderTableEditor({ ui, collection, save, done: vi.fn(), notify });
        const quantity = ui.body.querySelector('tr[data-record="r2"] input[aria-label="Quantity of Starter generator"]');
        quantity.value = 'lots';
        quantity.dispatchEvent(new Event('input'));
        ui.foot.querySelector('.le-table-save').click();
        await Promise.resolve();
        expect(save).not.toHaveBeenCalled();
        expect(notify).toHaveBeenCalledWith('1 row needs a fix before saving. They are listed under the table.');
        expect(ui.body.querySelector('.le-table-why').textContent).toContain('Quantity "lots" is not a number');
        expect(quantity.getAttribute('aria-invalid')).toBe('true');
    });

    it('a field is added and renamed in Fields, and every record keeps what it holds', async () => {
        const ui = handle();
        const saved = {};
        renderTableEditor({ ui, collection, save: async (key, value) => { saved[key] = value; }, done: vi.fn(), notify: vi.fn() });
        ui.body.querySelector('.le-table-fields').click();
        const names = ui.body.querySelectorAll('.le-field-name');
        names[1].value = 'Part name';
        names[1].dispatchEvent(new Event('input'));
        ui.body.querySelector('.le-field-add').click();
        const added = [...ui.body.querySelectorAll('.le-field-name')].at(-1);
        added.value = 'Aircraft type';
        added.dispatchEvent(new Event('input'));
        const type = [...ui.body.querySelectorAll('.le-field-type')].at(-1);
        type.value = 'choice';
        type.dispatchEvent(new Event('change'));
        const options = [...ui.body.querySelectorAll('.le-field-options')].at(-1);
        options.value = 'ATR 72, B737-800';
        options.dispatchEvent(new Event('input'));
        ui.body.querySelector('.le-fields-done').click();
        expect(ui.body.querySelector('thead').textContent).toContain('Part name');
        expect(ui.body.querySelector('thead').textContent).toContain('Aircraft type');
        ui.foot.querySelector('.le-table-save').click();
        await vi.waitFor(() => expect(saved['collection:parts']).toBeTruthy());
        const schema = JSON.parse(saved['collection:parts']);
        expect(schema.fields.find((f) => f.key === 'name').label).toBe('Part name');
        expect(schema.fields.at(-1)).toEqual({ key: 'aircraft_type', label: 'Aircraft type', type: 'choice', options: ['ATR 72', 'B737-800'] });
        expect(JSON.parse(saved['collection:parts:rows:1'])[0].name).toBe('Main wheel brake assembly');
    });

    it('a spreadsheet is added to the records, after its columns are matched', async () => {
        const ui = handle();
        const saved = {};
        const done = vi.fn();
        const importer = renderCsvImport({ ui, collection, save: async (key, value) => { saved[key] = value; }, done, notify: vi.fn(), now: () => 5 });
        importer.accept(parseCsv('P/N,Name,Qty,Condition\n9-9999-1,Good pump,3,OH\n9-9999-3,Bad quantity,ten,SV\n'));
        expect(ui.body.querySelector('.le-import-summary').textContent).toBe('1 row is ready, 1 row needs a fix first.');
        expect(ui.body.querySelector('.le-import-problems').textContent).toBe('Row 3: Quantity "ten" is not a number.');
        ui.foot.querySelector('.le-import-go').click();
        await vi.waitFor(() => expect(done).toHaveBeenCalled());
        expect(JSON.parse(saved['collection:parts:rows:1']).map((r) => r.name)).toEqual(['Main wheel brake assembly', 'Starter generator', 'Good pump']);
        expect(done.mock.calls[0][0]).toBe('1 record added to Aircraft parts. 1 row was left out. Publish to show them to visitors.');
    });

    it('a new collection is made from a spreadsheet, named by the owner', async () => {
        const ui = handle();
        const saved = {};
        const done = vi.fn();
        const importer = renderCsvImport({ ui, collection: null, taken: [], save: async (key, value) => { saved[key] = value; }, done, notify: vi.fn(), now: () => 5 });
        importer.accept(parseCsv(SAMPLE));
        importer.setName('Aircraft parts');
        ui.foot.querySelector('.le-import-go').click();
        await vi.waitFor(() => expect(done).toHaveBeenCalled());
        expect(done.mock.calls[0][1]).toBe('aircraft-parts');
        const [found] = collectionsIn(saved);
        expect(found.records).toHaveLength(40);
        expect(found.fields.find((f) => f.key === 'part_number').code).toBe(true);
    });
});
