/**
 * Collections an owner keeps: typed records, saved as settings, imported and exported as CSV.
 *
 * Stored the way every edit is (one setting per key), so a collection is a draft until it is
 * published, shows under Changes, and is rolled back with the rest of the site:
 *
 *   collection:<id>            {"name":"Aircraft parts","one":"part","many":"parts","title":"name",
 *                               "fields":[{"key":"part_number","label":"Part number","type":"text","code":true}, …],
 *                               "pages":2}
 *   collection:<id>:rows:<n>   [{"id":"r1","part_number":"2-1586-3","quantity":4,"certificate":true}, …]
 *
 * A setting holds at most `MOST_CHARACTERS` characters, so the records are saved in pages of rows
 * (1 to `pages`); the collection itself is saved last, so a reader never counts a page that is not
 * there yet. Values are kept as their type: a number as a number (or null), yes/no as true or
 * false, a date as YYYY-MM-DD, everything else as words.
 *
 * The host checks every save against the same rules (the website's TheCollectionsASiteKeeps).
 */

import { TYPES, toDate, toNumber, toYesNo } from './collection-search.js';
import { parseCsv } from './catalogue.js';

export { parseCsv };

export const PREFIX = 'collection:';
export const MOST_FIELDS = 20;
export const MOST_RECORDS = 3000;
export const MOST_OPTIONS = 100;
export const MOST_CHARACTERS = 16000;
export const MOST_WORDS = 500;
export const ID = /^[a-z][a-z0-9-]{0,39}$/;
export const FIELD_KEY = /^[a-z][a-z0-9_]{0,39}$/;

/** What each type is called in the editor, and what it says it holds. */
export const TYPE_WORDS = {
    text: { label: 'Words', hint: 'Searched. Tick "Part number" for a code visitors type, like 2-1586-3.' },
    number: { label: 'Number', hint: 'A quantity or a price. Visitors can sort by it and choose a range.' },
    choice: { label: 'Choice', hint: 'One of a few options, like a condition. Visitors filter by it.' },
    date: { label: 'Date', hint: 'Visitors can choose a range of dates.' },
    yesno: { label: 'Yes or no', hint: 'Visitors can show only the yes ones.' },
    photo: { label: 'Photo', hint: 'A picture of the record, shown on its card.' },
    link: { label: 'Link', hint: 'A web address, like a datasheet.' },
};

export const schemaKey = (id) => `${PREFIX}${id}`;
export const rowsKey = (id, page) => `${PREFIX}${id}:rows:${page}`;

/** A key the words make: "Aircraft type" becomes "aircraft_type". */
export const keyFrom = (words, taken = []) => {
    const base = String(words ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^(\d)/, 'f$1').slice(0, 36) || 'field';
    let key = base;
    for (let n = 2; taken.includes(key); n += 1) key = `${base}_${n}`;

    return key;
};

export const idFrom = (words, taken = []) => {
    const base = keyFrom(words).replace(/_/g, '-').replace(/^f(?=\d)/, 'c').slice(0, 36) || 'collection';
    let id = /^[a-z]/.test(base) ? base : `c-${base}`;
    for (let n = 2; taken.includes(id); n += 1) id = `${base}-${n}`;

    return id;
};

/** A fresh record id, never one already used. */
export const freshRecordId = (taken, now = Date.now()) => {
    const seen = new Set(taken);
    let n = 0;
    let id;
    do { id = `r${now.toString(36)}${n ? n.toString(36) : ''}`; n += 1; } while (seen.has(id));

    return id;
};

/** Why a collection's description cannot be saved, in plain words; empty when it can. */
export function schemaProblems(schema) {
    const says = [];
    if (!schema || typeof schema !== 'object') return ['That is not a collection.'];
    const name = String(schema.name ?? '').trim();
    if (!name) says.push('Give the collection a name.');
    else if (name.length > 60) says.push('Its name must be 60 characters or fewer.');
    const fields = Array.isArray(schema.fields) ? schema.fields : [];
    if (!fields.length) says.push('A collection needs at least one field.');
    if (fields.length > MOST_FIELDS) says.push(`A collection holds ${MOST_FIELDS} fields at most.`);
    const keys = new Set();
    const labels = new Set();
    for (const field of fields) {
        const label = String(field?.label ?? '').trim();
        if (!label) says.push('Every field needs a name.');
        else if (label.length > 60) says.push(`The field name "${label.slice(0, 20)}…" is longer than 60 characters.`);
        else if (labels.has(label.toLowerCase())) says.push(`Two fields are both called "${label}".`);
        labels.add(label.toLowerCase());
        if (!FIELD_KEY.test(field?.key ?? '') || keys.has(field.key)) says.push(`The field "${label}" needs a key of its own.`);
        keys.add(field?.key);
        if (!TYPES.includes(field?.type)) says.push(`"${label}" is not a kind of field this knows.`);
        if (field?.type === 'choice') {
            const options = Array.isArray(field.options) ? field.options : [];
            if (options.length > MOST_OPTIONS) says.push(`"${label}" offers more than ${MOST_OPTIONS} options.`);
            if (options.some((o) => typeof o !== 'string' || !o.trim() || o.length > 60)) says.push(`Every option of "${label}" needs words, 60 characters at most.`);
            if (new Set(options.map((o) => String(o).toLowerCase())).size !== options.length) says.push(`"${label}" lists the same option twice.`);
        }
    }
    if (fields.filter((f) => f?.type === 'text').length === 0 && fields.length) says.push('A collection needs at least one field of words, for its records\' names.');

    return [...new Set(says)];
}

/** One value checked against its field: `{ value }` to save, or `{ says }` saying why it cannot be. */
export function readValue(field, raw) {
    const text = typeof raw === 'string' ? raw.trim() : raw;
    const empty = text === '' || text === null || text === undefined;
    if (field.required && empty) return { says: `${field.label} is needed` };
    switch (field.type) {
        case 'number': {
            if (empty) return { value: null };
            const figure = toNumber(text);

            return figure === null ? { says: `${field.label} "${text}" is not a number` } : { value: figure };
        }
        case 'date': {
            if (empty) return { value: '' };
            const date = toDate(text);

            return date ? { value: date } : { says: `${field.label} "${text}" is not a date (write 2026-03-04 or 4/3/2026)` };
        }
        case 'yesno': {
            const yes = toYesNo(text);

            return yes === null ? { says: `${field.label} "${text}" is not yes or no` } : { value: yes };
        }
        case 'choice': {
            if (empty) return { value: '' };
            const options = field.options ?? [];
            const match = options.find((o) => o.toLowerCase() === String(text).toLowerCase());

            return match ? { value: match } : { says: `${field.label} "${text}" is not one of its options (${options.slice(0, 8).join(', ')}${options.length > 8 ? ', …' : ''})` };
        }
        case 'photo':
        case 'link': {
            if (empty) return { value: '' };
            if (!/^(https:\/\/\S+|\/[^\s/]\S*)$/.test(String(text))) {
                return { says: `${field.label} is not a web address starting https://` };
            }

            return { value: String(text).slice(0, MOST_WORDS) };
        }
        default: {
            if (empty) return { value: '' };
            if (String(text).length > MOST_WORDS) return { says: `${field.label} is longer than ${MOST_WORDS} characters` };
            if (/[<>]/.test(String(text))) return { says: `${field.label} has < or > in it` };

            return { value: String(text) };
        }
    }
}

/** A whole record checked: the record to save, and what is wrong with it. */
export function readRecord(schema, raw, id) {
    const record = { id };
    const says = [];
    for (const field of schema.fields) {
        const read = readValue(field, raw?.[field.key]);
        if (read.says) says.push(read.says);
        else record[field.key] = read.value;
    }
    const title = schema.title ?? schema.fields.find((f) => f.type === 'text')?.key;
    if (!says.length && title && !String(record[title] ?? '').trim()) says.push(`it has no ${schema.fields.find((f) => f.key === title)?.label.toLowerCase() ?? 'name'}`);

    return { record, says };
}

/**
 * Which field each column of a file goes to, guessed from its heading: the field's name or key,
 * ignoring case, spaces and punctuation ("Part No." and "part_number" both find "Part number").
 */
export function guessMapping(header, fields) {
    const squash = (words) => String(words ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const alias = (words) => squash(words).replace(/^(pn|partno|partnum|partnumber)$/, 'partnumber').replace(/^qty$/, 'quantity');
    const used = new Set();

    return header.map((heading) => {
        const wanted = alias(heading);
        const field = fields.find((f) => !used.has(f.key) && (alias(f.label) === wanted || alias(f.key) === wanted));
        if (field) used.add(field.key);

        return field?.key ?? '';
    });
}

/**
 * The rows of a file read into records: what is ready, and each row that needs a fix, in plain words.
 * `mapping[c]` names the field column c fills ('' leaves it out). Row numbers are the file's own (the
 * heading is row 1), so the owner can find each one in their spreadsheet.
 */
export function readCsvRows(rows, schema, mapping, { taken = [], most = MOST_RECORDS, now = Date.now() } = {}) {
    const ready = [];
    const problems = [];
    const ids = new Set(taken);
    if (!mapping.some(Boolean)) {
        problems.push({ row: 1, says: 'No column is matched to a field. Choose a field for at least one column.' });

        return { ready, problems };
    }
    const codes = schema.fields.filter((f) => f.type === 'text' && f.code).map((f) => f.key);
    const seenCodes = new Map();
    rows.slice(1).forEach((cells, index) => {
        const raw = {};
        mapping.forEach((key, c) => { if (key) raw[key] = cells[c] ?? ''; });
        let id = freshRecordId([...ids], now + index);
        ids.add(id);
        const { record, says } = readRecord(schema, raw, id);
        for (const key of codes) {
            const value = String(record[key] ?? '').toLowerCase();
            if (!value) continue;
            if (seenCodes.has(`${key}:${value}`)) says.push(`${schema.fields.find((f) => f.key === key).label} ${record[key]} is also on row ${seenCodes.get(`${key}:${value}`)}`);
            else seenCodes.set(`${key}:${value}`, index + 2);
        }
        if (says.length) problems.push({ row: index + 2, says: `Row ${index + 2}: ${says.join('; ')}.` });
        else ready.push(record);
    });
    if (ready.length > most) {
        problems.push({ row: 0, says: `A collection holds ${most} records; the last ${ready.length - most} are left out.` });
        ready.length = most;
    }

    return { ready, problems };
}

const cell = (value) => {
    const text = String(value ?? '');

    return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** The collection as a CSV file: a heading row of field names, then a row per record. */
export function toCsv(schema, records) {
    const lines = [schema.fields.map((f) => cell(f.label)).join(',')];
    for (const record of records) {
        lines.push(schema.fields.map((f) => {
            const value = record[f.key];
            if (f.type === 'yesno') return value ? 'yes' : 'no';
            if (value === null || value === undefined) return '';

            return cell(value);
        }).join(','));
    }

    return `${lines.join('\r\n')}\r\n`;
}

/**
 * A new collection's fields worked out from a file's headings and rows: figures make a number,
 * dates a date, yes/no a yes-or-no, web addresses a photo or a link, a few words repeated a choice,
 * anything else words. A heading that says "part number" (or P/N) is a code.
 */
export function fieldsFromCsv(rows) {
    const header = rows[0] ?? [];
    const body = rows.slice(1);
    const taken = [];

    return header.map((heading, c) => {
        const label = String(heading).trim().slice(0, 60) || `Column ${c + 1}`;
        const key = keyFrom(label, taken);
        taken.push(key);
        const values = body.map((r) => String(r[c] ?? '').trim()).filter(Boolean);
        const all = (test) => values.length > 0 && values.every(test);
        const distinct = [...new Set(values)];
        let field;
        if (all((v) => /^https:\/\/\S+\.(jpe?g|png|webp|gif|avif)(\?\S*)?$/i.test(v))) field = { type: 'photo' };
        else if (all((v) => /^https:\/\/\S+$/.test(v))) field = { type: 'link' };
        else if (all((v) => toYesNo(v) !== null) && distinct.length <= 4) field = { type: 'yesno' };
        else if (all((v) => toNumber(v) !== null) && !/part|number|no\.?$|code|serial/i.test(label)) {
            // A price is in naira, and one left empty reads "On request" (both the owner's to change in Fields).
            field = /price|cost|amount|naira|₦/i.test(label) ? { type: 'number', unit: '₦', blank: 'On request' } : { type: 'number' };
        }
        else if (all((v) => toDate(v) !== null)) field = { type: 'date' };
        else if (values.length >= 4 && distinct.length <= Math.min(12, Math.ceil(values.length / 2)) && distinct.every((v) => v.length <= 40)) field = { type: 'choice', options: distinct.slice(0, MOST_OPTIONS) };
        else field = { type: 'text', ...(/part\s*(no|num|#)|p\/?n\b|part number|serial|sku|\bcode\b/i.test(label) ? { code: true } : {}) };

        return { key, label, ...field };
    });
}

/** The records cut into pages that each fit one setting. */
export function pagesOf(records, most = MOST_CHARACTERS) {
    const pages = [];
    let page = [];
    let size = 2;
    for (const record of records) {
        const length = JSON.stringify(record).length + 1;
        if (page.length && size + length > most) {
            pages.push(page);
            page = [];
            size = 2;
        }
        page.push(record);
        size += length;
    }
    if (page.length) pages.push(page);

    return pages;
}

/**
 * Every write that saves a collection: each page of rows, any page it no longer needs emptied, then
 * the collection itself with its number of pages. `before` is how many pages it had.
 */
export function writesFor(id, schema, records, before = 0) {
    const pages = pagesOf(records);
    const writes = pages.map((rows, i) => ({ key: rowsKey(id, i + 1), value: JSON.stringify(rows) }));
    for (let n = pages.length + 1; n <= before; n += 1) writes.push({ key: rowsKey(id, n), value: '' });
    const { records: _records, id: _id, ...kept } = schema;
    writes.push({ key: schemaKey(id), value: JSON.stringify({ ...kept, pages: pages.length }) });

    return writes;
}

/** The collections in a site's settings, each with its records gathered from its pages. */
export function collectionsIn(settings) {
    const found = [];
    for (const [key, value] of Object.entries(settings ?? {})) {
        const id = key.startsWith(PREFIX) ? key.slice(PREFIX.length) : '';
        if (!ID.test(id) || !value) continue;
        let schema;
        try { schema = JSON.parse(value); } catch { continue; }
        if (!schema || !Array.isArray(schema.fields)) continue;
        const records = [];
        for (let n = 1; n <= (schema.pages ?? 0); n += 1) {
            try { records.push(...(JSON.parse(settings[rowsKey(id, n)] || '[]') ?? [])); } catch { /* a page that does not read is left out */ }
        }
        found.push({ id, ...schema, records });
    }

    return found;
}

/** Changing a field's type: each record's value read again as the new type, or the rows it cannot be. */
export function retyped(records, field, type) {
    const next = { ...field, type };
    if (type === 'choice' && !Array.isArray(next.options)) {
        next.options = [...new Set(records.map((r) => String(r[field.key] ?? '').trim()).filter(Boolean))].slice(0, MOST_OPTIONS);
    }
    if (type !== 'choice') delete next.options;
    if (type !== 'text') delete next.code;
    const refused = [];
    const changed = records.map((record, i) => {
        const was = record[field.key];
        const text = was === null || was === undefined ? '' : field.type === 'yesno' ? (was ? 'yes' : 'no') : String(was);
        const read = readValue(next, text);
        if (read.says) {
            refused.push(`Record ${i + 1}: ${read.says}`);

            return record;
        }

        return { ...record, [field.key]: read.value };
    });

    return { field: next, records: changed, refused };
}
