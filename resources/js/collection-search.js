/**
 * Search over a collection: what a visitor's search finds, worked out in the browser.
 *
 * A collection is records with typed fields (the website's LIVE-EDIT-STRUCTURE.md, "Search over a
 * collection"). The data's shape decides the search, and nothing is configured by hand:
 *
 *   text    searched; a field marked as a code (a part number) is matched exactly and loosely,
 *           with dashes, spaces, dots and slashes ignored, so "21586-3" and "2 1586 3" find 2-1586-3
 *   choice  a filter: chips when there are few options, a select when there are many
 *   number  a range (from, to) and a sort (low to high, high to low)
 *   date    a range (from, to)
 *   yesno   a toggle ("Only with a certificate")
 *   photo, link   shown on a result, never searched
 *
 * Pure: no document, no network. The visitor's runtime (kit-search.js) and the editor's table both
 * use it, and it is what the unit tests hold.
 */

export const TYPES = ['text', 'number', 'choice', 'date', 'yesno', 'photo', 'link'];

/** Choices drawn as chips up to this many; a select beyond. */
export const MOST_CHIPS = 6;

/** Lower case, accents off, one space between words. */
export const plain = (value) => String(value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** A code as it is matched loosely: letters and figures only ("2-1586-3" and "2 1586 3" are both "215863"). */
export const loose = (value) => plain(value).replace(/[^a-z0-9]+/g, '');

/** A figure from what a person typed: "₦12,500", "12 500", "1.5" and "-3" read; anything else is null. */
export const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const text = String(value ?? '').trim();
    if (text === '') return null;
    const cleaned = text.replace(/[\s,₦$£€]/g, '').replace(/^NGN/i, '');
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
    const figure = Number(cleaned);

    return Number.isFinite(figure) ? figure : null;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n) => String(n).padStart(2, '0');
const realDate = (y, m, d) => {
    const at = new Date(Date.UTC(y, m - 1, d));

    return at.getUTCFullYear() === y && at.getUTCMonth() === m - 1 && at.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
};

/** A date as YYYY-MM-DD from "2026-03-04", "4/3/2026" (day first, as in Nigeria) or "4 Mar 2026"; null otherwise. */
export const toDate = (value) => {
    const text = String(value ?? '').trim();
    let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return realDate(+m[1], +m[2], +m[3]);
    m = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
    if (m) return realDate(+m[3], +m[2], +m[1]);
    m = text.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})$/);
    if (m && MONTHS.includes(m[2].slice(0, 3).toLowerCase())) return realDate(+m[3], MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1, +m[1]);

    return null;
};

/** Yes or no from what a person typed: yes/no, true/false, y/n, 1/0, ticked; null when it is neither. */
export const toYesNo = (value) => {
    if (typeof value === 'boolean') return value;
    const text = plain(value);
    if (['yes', 'y', 'true', '1', 'ticked', 'x'].includes(text)) return true;
    if (['no', 'n', 'false', '0', ''].includes(text)) return false;

    return null;
};

/** How a stored value reads on a result ("Yes", "4 Mar 2026", "₦12,500"). */
export const shown = (field, value) => {
    if (value === null || value === undefined || value === '') return field.blank ?? '';
    if (field.type === 'yesno') return value ? (field.yes ?? 'Yes') : (field.no ?? 'No');
    if (field.type === 'number') {
        const figure = toNumber(value);
        if (figure === null) return String(value);
        const words = figure.toLocaleString('en-NG', { maximumFractionDigits: 2 });

        return field.unit ? (/^[₦$£€]$/.test(field.unit) ? `${field.unit}${words}` : `${words} ${field.unit}`) : words;
    }
    if (field.type === 'date') {
        const date = toDate(value);
        if (!date) return String(value);
        const [y, m, d] = date.split('-').map(Number);

        return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
    }

    return String(value);
};

/** The fields that are searched as words, and the ones matched as codes. */
const searchedFields = (fields) => fields.filter((f) => f.type === 'text' || f.type === 'choice');

/**
 * The collection made ready to search: each record with its words and its codes worked out once.
 *
 * @param {{ fields: Array<object>, records: Array<object>, title?: string }} collection
 */
export function prepare(collection) {
    const fields = Array.isArray(collection?.fields) ? collection.fields : [];
    const records = Array.isArray(collection?.records) ? collection.records : [];
    const words = searchedFields(fields);
    const codes = fields.filter((f) => f.type === 'text' && f.code);
    const titleKey = collection?.title && fields.some((f) => f.key === collection.title)
        ? collection.title
        : (fields.find((f) => f.type === 'text' && !f.code) ?? fields.find((f) => f.type === 'text'))?.key;

    return {
        ...collection,
        fields,
        title: titleKey,
        rows: records.map((record, at) => ({
            record,
            at,
            text: words.map((f) => plain(record[f.key])).join(' \u0001 '),
            title: plain(record[titleKey]),
            looseText: words.map((f) => loose(record[f.key])).join('\u0001'),
            codes: codes.map((f) => loose(record[f.key])).filter(Boolean),
        })),
    };
}

/**
 * The filters a collection's shape gives, in the order of its fields. `on` lists the keys the owner
 * left switched on (null: all of them). A choice offers only the options its records use, in the
 * order the field lists them, with how many records hold each.
 */
export function filtersFor(collection, on = null) {
    const fields = collection?.fields ?? [];
    const records = collection?.records ?? (collection?.rows ?? []).map((row) => row.record);
    const allowed = on === null ? null : new Set(on);
    const filters = [];

    for (const field of fields) {
        if (allowed && !allowed.has(field.key)) continue;
        if (field.type === 'choice') {
            const counts = new Map();
            for (const record of records) {
                const value = String(record[field.key] ?? '').trim();
                if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
            }
            const listed = [...(field.options ?? []).filter((o) => counts.has(o)), ...[...counts.keys()].filter((v) => !(field.options ?? []).includes(v))];
            if (listed.length < 2) continue;
            filters.push({ key: field.key, label: field.label, kind: 'choice', as: listed.length <= MOST_CHIPS ? 'chips' : 'select', options: listed.map((value) => ({ value, count: counts.get(value) })) });
        } else if (field.type === 'number') {
            const figures = records.map((r) => toNumber(r[field.key])).filter((n) => n !== null);
            if (figures.length < 2 || Math.min(...figures) === Math.max(...figures)) continue;
            filters.push({ key: field.key, label: field.label, kind: 'range', min: Math.min(...figures), max: Math.max(...figures), unit: field.unit ?? '' });
        } else if (field.type === 'date') {
            const dates = records.map((r) => toDate(r[field.key])).filter(Boolean).sort();
            if (dates.length < 2 || dates[0] === dates[dates.length - 1]) continue;
            filters.push({ key: field.key, label: field.label, kind: 'dates', from: dates[0], to: dates[dates.length - 1] });
        } else if (field.type === 'yesno') {
            const yes = records.filter((r) => toYesNo(r[field.key]) === true).length;
            if (yes === 0 || yes === records.length) continue;
            filters.push({ key: field.key, label: field.label, kind: 'toggle', count: yes });
        }
    }

    return filters;
}

/** The fields a collection's filters can come from, whatever the records hold now: what the owner switches on and off. */
export const filterableFields = (fields) => (fields ?? []).filter((f) => ['choice', 'number', 'date', 'yesno'].includes(f.type));

/** The sorts a collection offers: best match, then each number low to high and high to low, then the title A to Z. */
export function sortsFor(collection) {
    const sorts = [{ id: 'best', label: 'Best match' }];
    for (const field of collection?.fields ?? []) {
        if (field.type !== 'number') continue;
        sorts.push({ id: `${field.key}:up`, label: `${field.label}: low to high` }, { id: `${field.key}:down`, label: `${field.label}: high to low` });
    }
    if (collection?.title) sorts.push({ id: 'title', label: 'A to Z' });

    return sorts;
}

/** How well one prepared record answers the words typed: 0 when it does not. */
export function scoreOf(row, query) {
    const asked = plain(query);
    if (!asked) return 1;
    const asCode = loose(asked);
    let score = 0;

    // A code: the same once dashes and spaces are gone, then one that starts with it, then one that holds it.
    for (const code of row.codes) {
        if (asCode && code === asCode) score = Math.max(score, 100);
        else if (asCode.length >= 2 && code.startsWith(asCode)) score = Math.max(score, 60);
        else if (asCode.length >= 3 && code.includes(asCode)) score = Math.max(score, 40);
    }

    // Words: every word typed is somewhere in the record (a word with figures in it may be typed without its dashes).
    const terms = asked.split(' ').filter(Boolean);
    const found = terms.every((term) => row.text.includes(term) || (/\d/.test(term) && loose(term).length >= 2 && row.looseText.includes(loose(term))));
    if (found) {
        let words = 10;
        if (terms.every((term) => row.title.includes(term))) words += 8;
        if (row.title.startsWith(terms[0])) words += 4;
        score = Math.max(score, words);
    }

    return score;
}

/** Whether a record passes the visitor's filters. */
export function passes(record, chosen, fields) {
    for (const [key, want] of Object.entries(chosen ?? {})) {
        const field = fields.find((f) => f.key === key);
        if (!field || want === undefined || want === null || want === '') continue;
        const value = record[key];
        if (field.type === 'choice') {
            const wanted = Array.isArray(want) ? want : [want];
            if (wanted.length && !wanted.includes(String(value ?? '').trim())) return false;
        } else if (field.type === 'number') {
            const figure = toNumber(value);
            const from = toNumber(want.from);
            const to = toNumber(want.to);
            if ((from !== null || to !== null) && figure === null) return false;
            if (from !== null && figure < from) return false;
            if (to !== null && figure > to) return false;
        } else if (field.type === 'date') {
            const date = toDate(value);
            if ((want.from || want.to) && !date) return false;
            if (want.from && date < want.from) return false;
            if (want.to && date > want.to) return false;
        } else if (field.type === 'yesno') {
            if (want === true && toYesNo(value) !== true) return false;
        }
    }

    return true;
}

/**
 * The visitor's search: what was typed, the filters chosen and the order asked for.
 *
 * @param {ReturnType<typeof prepare>} prepared
 * @param {{ query?: string, filters?: object, sort?: string }} asked
 * @returns {{ results: Array<object>, count: number, exact: object|null }}
 */
export function search(prepared, { query = '', filters = {}, sort = 'best' } = {}) {
    const hits = [];
    for (const row of prepared.rows) {
        if (!passes(row.record, filters, prepared.fields)) continue;
        const score = scoreOf(row, query);
        if (score > 0) hits.push({ row, score });
    }

    const [key, direction] = String(sort).split(':');
    const field = prepared.fields.find((f) => f.key === key && f.type === 'number');
    if (field) {
        const sign = direction === 'down' ? -1 : 1;
        hits.sort((a, b) => {
            const x = toNumber(a.row.record[key]);
            const y = toNumber(b.row.record[key]);
            if (x === null && y === null) return a.row.at - b.row.at;
            if (x === null) return 1;
            if (y === null) return -1;

            return (x - y) * sign || a.row.at - b.row.at;
        });
    } else if (sort === 'title') {
        hits.sort((a, b) => a.row.title.localeCompare(b.row.title) || a.row.at - b.row.at);
    } else {
        hits.sort((a, b) => b.score - a.score || a.row.at - b.row.at);
    }

    const exact = hits.find((hit) => hit.score === 100)?.row.record ?? null;

    return { results: hits.map((hit) => hit.row.record), count: hits.length, exact };
}

/** The search as an address's query ("?q=2-1586-3&condition=OH&quantity=1-"), and back. */
export function toParams(asked, fields) {
    const params = new URLSearchParams();
    if (asked.query) params.set('q', asked.query);
    for (const [key, want] of Object.entries(asked.filters ?? {})) {
        const field = fields.find((f) => f.key === key);
        if (!field) continue;
        if (field.type === 'choice' && (Array.isArray(want) ? want.length : want)) params.set(key, (Array.isArray(want) ? want : [want]).join('|'));
        else if ((field.type === 'number' || field.type === 'date') && (want?.from || want?.to || want?.from === 0)) params.set(key, `${want.from ?? ''}~${want.to ?? ''}`);
        else if (field.type === 'yesno' && want === true) params.set(key, 'yes');
    }
    if (asked.sort && asked.sort !== 'best') params.set('sort', asked.sort);

    return params;
}

export function fromParams(params, fields) {
    const asked = { query: params.get('q') ?? '', filters: {}, sort: params.get('sort') ?? 'best' };
    for (const field of fields) {
        const value = params.get(field.key);
        if (value === null) continue;
        if (field.type === 'choice') asked.filters[field.key] = value.split('|').filter(Boolean);
        else if (field.type === 'number' || field.type === 'date') {
            const [from, to] = value.split('~');
            asked.filters[field.key] = { from: from ?? '', to: to ?? '' };
        } else if (field.type === 'yesno') asked.filters[field.key] = value === 'yes';
    }

    return asked;
}

/** A record's own address part: its id, kept to letters, figures, dashes and underscores. */
export const recordId = (record) => String(record?.id ?? '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);

/** What a quote request for a record says, in one line: "2-1586-3, Fuel pump, Condition: OH". */
export function summaryOf(record, fields, title) {
    const parts = [];
    for (const field of fields) {
        if (!(field.type === 'text' && field.code)) continue;
        if (record[field.key]) parts.push(String(record[field.key]));
    }
    if (title && record[title] && !parts.includes(String(record[title]))) parts.push(String(record[title]));
    for (const field of fields) {
        if (field.type !== 'choice' || !record[field.key]) continue;
        parts.push(`${field.label}: ${record[field.key]}`);
        if (parts.length >= 5) break;
    }

    return parts.join(', ').slice(0, 200);
}
