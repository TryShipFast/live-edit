/**
 * The Search tab: the collections an owner keeps for visitors to search, each edited as a table.
 *
 *   Search tab        each collection with its number of records: Open the table, Add from a
 *                     spreadsheet, Download as CSV; + New collection; the searches that found nothing.
 *   The table         a window as wide as the screen: a row per record and a column per field, each
 *                     cell the right kind of box (a number, a choice, a date, a tick); + Add a record,
 *                     Delete, Find a record, Fields (add, rename, retype, reorder, remove), Save.
 *   A spreadsheet     a CSV file whose columns are matched to the fields (guessed from the headings,
 *                     changed by the owner), every row checked first and each refused row said in
 *                     plain words with its row number; added to the records or put in their place.
 *
 * Only where the host hands the editor its collections (window.liveEditCollections): our hosted
 * templates with search switched on. Saved through the ordinary setting save (collections.js), so it
 * is a draft until published.
 *
 * config = {
 *   collections: [{ id, name, one, many, title, fields, pages, records }],
 *   missed: { href, count } | null,    // the dashboard's list of searches that found nothing
 * }
 */

import { TYPES } from './collection-search.js';
import {
    MOST_FIELDS, MOST_RECORDS, TYPE_WORDS, fieldsFromCsv, freshRecordId, guessMapping, idFrom, keyFrom, parseCsv,
    readCsvRows, readRecord, retyped, schemaProblems, toCsv, writesFor,
} from './collections.js';
import { uploadWidget } from './upload.js';

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};
const button = (className, text, label) => {
    const node = el('button', className, text);
    node.type = 'button';
    if (label) node.setAttribute('aria-label', label);
    return node;
};
const opt = (label, value) => {
    const node = document.createElement('option');
    node.value = value;
    node.textContent = label;
    return node;
};
const plural = (n, one, many) => `${n.toLocaleString('en-NG')} ${n === 1 ? one : many}`;

/** Download a file made here. */
const offer = (name, text, doc = document) => {
    const a = doc.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.download = name;
    doc.body.append(a);
    a.click();
    a.remove();
};

/** Save every write of a collection, saying how far it has got. */
export async function saveCollection({ id, schema, records, before = 0, save, progress = () => {}, wait = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000)) }) {
    const problems = schemaProblems(schema);
    if (problems.length) throw new Error(problems[0]);
    if (records.length > MOST_RECORDS) throw new Error(`A collection holds ${MOST_RECORDS} records at most.`);
    const writes = writesFor(id, schema, records, before);
    for (const [n, write] of writes.entries()) {
        progress(n + 1, writes.length);
        // A big collection is many saves, more than a person makes in a minute: a refusal for speed
        // waits as long as the server asks and goes on, rather than stopping halfway.
        for (let attempt = 0; ; attempt += 1) {
            try {
                await save(write.key, write.value);
                break;
            } catch (error) {
                if (error?.status !== 429 || attempt >= 8) throw error;
                const seconds = Math.min(65, Math.max(2, error.retryAfter ?? 10));
                progress(n + 1, writes.length, seconds);
                await wait(seconds);
            }
        }
    }

    return writes.length;
}

/* ------------------------------ the tab ------------------------------ */

export function renderSearchPanel({ container, config, openTable, openImport, openNew, doc = document }) {
    container.replaceChildren();
    const part = el('section', 'le-shop-section le-search-panel');
    part.append(el('h3', 'le-shop-heading', 'What visitors can search'));
    part.append(el('p', 'le-hint', 'A collection is a list you keep, like your parts or your stock. Visitors search it on any page you add a search to: press + Add a section on a page and choose Search.'));
    const list = el('ul', 'le-shop-list le-collections');
    for (const collection of config?.collections ?? []) {
        const li = el('li', 'le-shop-row le-collection');
        li.dataset.collection = collection.id;
        const words = el('span', 'le-shop-name', collection.name);
        const count = el('span', 'le-hint le-shop-count', plural(collection.records.length, collection.one || 'record', collection.many || 'records'));
        const actions = el('span', 'le-shop-actions');
        const open = button('le-link-btn le-collection-open', 'Open the table', `Open the table of ${collection.name}`);
        open.addEventListener('click', () => openTable(collection));
        const bring = button('le-link-btn le-collection-import', 'Add from a spreadsheet', `Add ${collection.name} from a spreadsheet`);
        bring.addEventListener('click', () => openImport(collection));
        const take = button('le-link-btn le-collection-export', 'Download as CSV', `Download ${collection.name} as a CSV file`);
        take.addEventListener('click', () => offer(`${collection.id}.csv`, toCsv(collection, collection.records), doc));
        actions.append(open, bring, take);
        li.append(words, count, actions);
        list.append(li);
    }
    if (!(config?.collections ?? []).length) list.append(el('li', 'le-hint', 'No collections yet. Make one from a spreadsheet you already keep, or start with an empty table.'));
    const add = button('le-btn-outline le-wide le-collection-new', '+ New collection');
    add.addEventListener('click', () => openNew());
    part.append(list, add);
    container.append(part);

    if (config?.missed?.href) {
        const missed = el('section', 'le-shop-section le-search-missed');
        missed.append(el('h3', 'le-shop-heading', 'Searches that found nothing'));
        missed.append(el('p', 'le-hint', config.missed.count
            ? `${plural(config.missed.count, 'search', 'searches')} found nothing. They show what visitors look for that you do not list yet.`
            : 'None yet. When a visitor searches for something you do not list, it is kept here for you.'));
        const go = el('a', 'le-chip-btn', 'See them in your dashboard');
        go.href = config.missed.href;
        missed.append(go);
        container.append(missed);
    }
}

/* ------------------------------ a value's box ------------------------------ */

const boxFor = (field, value, onChange, label) => {
    let box;
    if (field.type === 'yesno') {
        box = el('input', 'le-cell-check');
        box.type = 'checkbox';
        box.checked = Boolean(value);
        box.addEventListener('change', () => onChange(box.checked ? 'yes' : 'no'));
    } else if (field.type === 'choice') {
        box = el('select', 'le-input le-cell');
        box.append(opt('', ''));
        for (const option of field.options ?? []) box.append(opt(option, option));
        if (value && !(field.options ?? []).includes(value)) box.append(opt(value, value));
        box.value = value ?? '';
        box.addEventListener('change', () => onChange(box.value));
    } else {
        box = el('input', 'le-input le-cell');
        box.type = field.type === 'date' ? 'date' : 'text';
        if (field.type === 'number') box.inputMode = 'decimal';
        if (field.type === 'photo' || field.type === 'link') { box.inputMode = 'url'; box.placeholder = 'https://'; }
        box.value = value === null || value === undefined ? '' : String(value);
        box.addEventListener('input', () => onChange(box.value));
    }
    box.setAttribute('aria-label', label);

    return box;
};

/* ------------------------------ the table ------------------------------ */

const PAGE = 50;

export function renderTableEditor({ ui, collection, save, done, notify, openImport = null, doc = document }) {
    let schema = { name: collection.name, one: collection.one || 'record', many: collection.many || 'records', title: collection.title, fields: collection.fields.map((f) => ({ ...f })) };
    // Each record kept as the owner typed it until Save, so a half-typed figure is not lost.
    let rows = collection.records.map((record) => ({ id: record.id, raw: Object.fromEntries(schema.fields.map((f) => [f.key, f.type === 'yesno' ? (record[f.key] ? 'yes' : 'no') : record[f.key] ?? ''])) }));
    const dirty = new Set();
    let shown = PAGE;
    let find = '';
    let view = 'table';

    ui.title(collection.name);
    ui.subtitle(`Each row is ${schema.one === 'record' ? 'a record' : `a ${schema.one}`}, each column a field. Changes are kept when you press Save, and visitors see them once you publish.`);

    const status = el('span', 'le-modal-note le-table-status');
    const saveButton = el('button', 'le-btn-publish le-table-save', 'Save');
    saveButton.type = 'button';
    ui.foot.replaceChildren(status, saveButton);
    ui.foot.hidden = false;

    const said = () => {
        status.textContent = dirty.size ? `${plural(dirty.size, 'change', 'changes')} not saved yet` : `${plural(rows.length, schema.one, schema.many)}`;
    };
    const touch = (what = 'fields') => { dirty.add(what); said(); };

    const draw = () => (view === 'fields' ? drawFields() : drawTable());

    function drawTable() {
        const tools = el('div', 'le-table-tools');
        const search = el('input', 'le-input le-table-find');
        search.type = 'search';
        search.placeholder = `Find ${schema.one === 'record' ? 'a record' : `a ${schema.one}`}`;
        search.setAttribute('aria-label', search.placeholder);
        search.value = find;
        search.addEventListener('input', () => { find = search.value; shown = PAGE; drawRows(); });
        const add = button('le-btn-outline le-table-add', `+ Add ${schema.one === 'record' ? 'a record' : `a ${schema.one}`}`);
        add.addEventListener('click', () => {
            const id = freshRecordId(rows.map((r) => r.id));
            rows.unshift({ id, raw: Object.fromEntries(schema.fields.map((f) => [f.key, f.type === 'yesno' ? 'no' : ''])), fresh: true });
            find = '';
            search.value = '';
            touch(id);
            drawRows();
            ui.body.querySelector('tbody input, tbody select')?.focus();
        });
        const fieldsButton = button('le-btn-outline le-table-fields', 'Fields');
        fieldsButton.addEventListener('click', () => { view = 'fields'; draw(); });
        tools.append(search, add, fieldsButton);
        if (openImport) {
            const bring = button('le-link-btn le-table-import', 'Add from a spreadsheet');
            bring.addEventListener('click', () => openImport());
            tools.append(bring);
        }
        const take = button('le-link-btn le-table-export', 'Download as CSV');
        take.addEventListener('click', () => offer(`${collection.id}.csv`, toCsv(schema, rows.map((r) => readRecord(schema, r.raw, r.id).record)), doc));
        tools.append(take);

        const scroll = el('div', 'le-table-scroll');
        const table = el('table', 'le-table');
        const head = el('tr');
        for (const field of schema.fields) {
            const th = el('th', null, field.label);
            th.scope = 'col';
            th.append(el('span', 'le-table-type', TYPE_WORDS[field.type]?.label ?? field.type));
            head.append(th);
        }
        head.append(el('th', 'le-table-actions-head', ''));
        const thead = el('thead');
        thead.append(head);
        const tbody = el('tbody');
        table.append(thead, tbody);
        scroll.append(table);
        const more = button('le-btn-outline le-table-more', 'Show more');
        const why = el('div', 'le-table-why');
        why.setAttribute('aria-live', 'polite');
        ui.body.replaceChildren(tools, scroll, more, why);

        function drawRows() {
            const wanted = find.trim().toLowerCase();
            const matching = wanted ? rows.filter((r) => Object.values(r.raw).some((v) => String(v).toLowerCase().includes(wanted))) : rows;
            tbody.replaceChildren();
            matching.slice(0, shown).forEach((row) => {
                const tr = el('tr', 'le-table-row');
                tr.dataset.record = row.id;
                const name = row.raw[schema.title] || `${schema.one} ${rows.indexOf(row) + 1}`;
                for (const field of schema.fields) {
                    const td = el('td');
                    const box = boxFor(field, row.raw[field.key], (value) => {
                        row.raw[field.key] = value;
                        box.removeAttribute('aria-invalid');
                        touch(row.id);
                    }, `${field.label} of ${name}`);
                    td.append(box);
                    tr.append(td);
                }
                const td = el('td', 'le-table-actions');
                const remove = button('le-link-btn le-table-delete', 'Delete', `Delete ${name}`);
                remove.addEventListener('click', () => {
                    rows = rows.filter((r) => r !== row);
                    dirty.delete(row.id);
                    if (!row.fresh) touch(`gone:${row.id}`);
                    else said();
                    drawRows();
                });
                td.append(remove);
                tr.append(td);
                tbody.append(tr);
            });
            if (!matching.length) {
                const tr = el('tr');
                const td = el('td', 'le-hint', wanted ? 'Nothing in the table matches that.' : 'No records yet. Press + Add, or add them from a spreadsheet.');
                td.colSpan = schema.fields.length + 1;
                tr.append(td);
                tbody.append(tr);
            }
            more.hidden = matching.length <= shown;
            more.textContent = `Show more (${(matching.length - shown).toLocaleString('en-NG')} more)`;
        }
        more.addEventListener('click', () => { shown += PAGE * 4; drawRows(); });
        drawRows();
        said();
    }

    function drawFields() {
        const wrap = el('div', 'le-collection-fields');
        wrap.append(el('p', 'le-hint', 'The fields every record has. Visitors filter by a choice, a number, a date or a yes-or-no; words are searched. Renaming a field keeps what each record holds.'));
        const list = el('ol', 'le-fields-list');
        const problems = el('div', 'le-table-why');
        problems.setAttribute('aria-live', 'polite');
        const work = schema.fields.map((f) => ({ ...f, was: f.key }));
        const drawList = () => {
            list.replaceChildren();
            work.forEach((field, i) => {
                const li = el('li', 'le-field-row');
                const name = el('input', 'le-input le-field-name');
                name.value = field.label;
                name.setAttribute('aria-label', `Name of field ${i + 1}`);
                name.addEventListener('input', () => { field.label = name.value; });
                const type = el('select', 'le-input le-field-type');
                type.setAttribute('aria-label', `Kind of field ${i + 1}`);
                for (const t of TYPES) type.append(opt(TYPE_WORDS[t].label, t));
                type.value = field.type;
                type.addEventListener('change', () => { field.type = type.value; drawList(); });
                li.append(name, type);
                li.append(el('span', 'le-hint le-field-hint', TYPE_WORDS[field.type]?.hint ?? ''));
                if (field.type === 'text') {
                    const tag = el('label', 'le-check');
                    const tick = el('input');
                    tick.type = 'checkbox';
                    tick.checked = Boolean(field.code);
                    tick.addEventListener('change', () => { field.code = tick.checked; });
                    tag.append(tick, doc.createTextNode(' Part number (found with or without dashes and spaces)'));
                    li.append(tag);
                }
                if (field.type === 'choice') {
                    const options = el('input', 'le-input le-field-options');
                    options.value = (field.options ?? []).join(', ');
                    options.placeholder = 'NE, OH, SV, AR';
                    options.setAttribute('aria-label', `Options of ${field.label}, separated by commas`);
                    options.addEventListener('input', () => { field.options = options.value.split(',').map((o) => o.trim()).filter(Boolean); });
                    li.append(options);
                }
                if (field.type === 'number') {
                    const unit = el('input', 'le-input le-field-unit');
                    unit.value = field.unit ?? '';
                    unit.placeholder = '₦, kg, hours';
                    unit.setAttribute('aria-label', `Unit of ${field.label}`);
                    unit.addEventListener('input', () => { field.unit = unit.value.trim().slice(0, 12); if (!field.unit) delete field.unit; });
                    const blank = el('input', 'le-input le-field-blank');
                    blank.value = field.blank ?? '';
                    blank.placeholder = 'Words when empty: On request';
                    blank.setAttribute('aria-label', `Words shown when ${field.label} is empty`);
                    blank.addEventListener('input', () => { field.blank = blank.value.trim().slice(0, 40); if (!field.blank) delete field.blank; });
                    li.append(unit, blank);
                }
                const actions = el('span', 'le-shop-actions');
                if (i > 0) {
                    const up = button('le-link-btn', '↑ Up', `Move ${field.label} up`);
                    up.addEventListener('click', () => { [work[i - 1], work[i]] = [work[i], work[i - 1]]; drawList(); });
                    actions.append(up);
                }
                const title = el('label', 'le-check');
                const radio = el('input');
                radio.type = 'radio';
                radio.name = 'le-field-title';
                radio.checked = schema.title === field.was || schema.title === field.key;
                radio.disabled = field.type !== 'text';
                radio.addEventListener('change', () => { schema.title = field.was ?? field.key; });
                title.append(radio, doc.createTextNode(' The record\'s name'));
                actions.append(title);
                const remove = button('le-link-btn le-shop-remove', 'Remove', `Remove the field ${field.label}`);
                remove.addEventListener('click', () => {
                    if (!(doc.defaultView ?? window).confirm(`Remove ${field.label}? What every record holds in it goes too.`)) return;
                    work.splice(i, 1);
                    drawList();
                });
                actions.append(remove);
                li.append(actions);
                list.append(li);
            });
        };
        drawList();
        const add = button('le-btn-outline le-field-add', '+ Add a field');
        add.addEventListener('click', () => {
            if (work.length >= MOST_FIELDS) { notify(`A collection holds ${MOST_FIELDS} fields at most.`); return; }
            work.push({ key: '', label: '', type: 'text', was: null });
            drawList();
            list.lastElementChild?.querySelector('input')?.focus();
        });
        const back = button('le-btn le-fields-done', 'Use these fields');
        back.addEventListener('click', () => {
            const taken = work.filter((f) => f.was).map((f) => f.was);
            const next = work.map((f) => {
                const field = { ...f, key: f.was ?? keyFrom(f.label, taken) };
                if (!f.was) taken.push(field.key);
                delete field.was;
                if (field.type !== 'choice') delete field.options;
                if (field.type !== 'text') delete field.code;
                if (field.type !== 'number') { delete field.unit; delete field.blank; }
                field.label = String(field.label).trim();

                return field;
            });
            const draft = { ...schema, fields: next, title: next.some((f) => f.key === schema.title && f.type === 'text') ? schema.title : next.find((f) => f.type === 'text')?.key };
            const says = schemaProblems(draft);
            // A field whose kind changed reads every record's value again; one that does not fit stops it.
            const refused = [];
            let records = rows.map((r) => readRecord(schema, r.raw, r.id).record);
            for (const field of next) {
                const before = schema.fields.find((f) => f.key === field.key);
                if (before && before.type !== field.type) {
                    const result = retyped(records, before, field.type);
                    refused.push(...result.refused.slice(0, 5).map((line) => `${field.label}: ${line}`));
                    records = result.records;
                    if (field.type === 'choice' && !(field.options ?? []).length) field.options = result.field.options;
                }
            }
            if (says.length || refused.length) {
                problems.replaceChildren(...[...says, ...refused].map((line) => el('p', 'le-data-refuse', line)));
                return;
            }
            schema = draft;
            rows = rows.map((row) => ({ id: row.id, raw: Object.fromEntries(next.map((f) => [f.key, row.raw[f.key] ?? (f.type === 'yesno' ? 'no' : '')])) }));
            touch();
            view = 'table';
            draw();
        });
        const cancel = button('le-link-btn', 'Back to the table');
        cancel.addEventListener('click', () => { view = 'table'; draw(); });
        wrap.append(list, add, problems, el('div', 'le-row'));
        wrap.lastElementChild.append(back, cancel);
        ui.body.replaceChildren(wrap);
    }

    saveButton.addEventListener('click', async () => {
        if (view === 'fields') { notify('Press "Use these fields" first, or go back to the table.'); return; }
        const read = rows.map((row) => readRecord(schema, row.raw, row.id));
        const wrong = read.map((r, i) => ({ ...r, row: rows[i] })).filter((r) => r.says.length);
        if (wrong.length) {
            const why = ui.body.querySelector('.le-table-why');
            why?.replaceChildren(el('p', 'le-data-refuse', `${plural(wrong.length, 'row needs', 'rows need')} a fix before saving:`),
                ...wrong.slice(0, 8).map((w) => el('p', 'le-hint', `${w.row.raw[schema.title] || 'A new row'}: ${w.says.join('; ')}.`)));
            for (const w of wrong) {
                const tr = ui.body.querySelector(`tr[data-record="${w.row.id}"]`);
                for (const box of tr?.querySelectorAll('input, select') ?? []) {
                    const field = schema.fields[[...tr.querySelectorAll('input, select')].indexOf(box)];
                    if (field && w.says.some((s) => s.startsWith(field.label))) box.setAttribute('aria-invalid', 'true');
                }
            }
            notify(`${plural(wrong.length, 'row needs', 'rows need')} a fix before saving. They are listed under the table.`);
            return;
        }
        saveButton.disabled = true;
        ui.allowDismiss?.(false);
        try {
            await saveCollection({
                id: collection.id, schema, records: read.map((r) => r.record), before: collection.pages ?? 0, save,
                progress: (n, of, waiting) => { saveButton.textContent = waiting ? `Saving ${n} of ${of}: waiting ${waiting} seconds…` : of > 2 ? `Saving ${n} of ${of}…` : 'Saving…'; },
            });
            done(`${collection.name} saved: ${plural(read.length, schema.one, schema.many)}. Publish to show the changes to visitors.`);
        } catch (error) {
            ui.allowDismiss?.(true);
            saveButton.disabled = false;
            saveButton.textContent = 'Save';
            notify(error.message);
        }
    });

    draw();

    return { rows: () => rows, schema: () => schema };
}

/* ------------------------------ a spreadsheet ------------------------------ */

/**
 * Add from a spreadsheet: into a collection (`collection`), or as a new one (`collection` null, with
 * `taken` its id may not be). The columns are matched to the fields before anything is checked.
 */
export function renderCsvImport({ ui, collection = null, taken = [], save, done, notify, now = Date.now }) {
    const isNew = !collection;
    ui.title(isNew ? 'A new collection from a spreadsheet' : `Add ${collection.name} from a spreadsheet`);
    ui.subtitle(isNew
        ? 'The first row names the columns; each row after it is one record. You can change the kind of each field before it is made.'
        : 'Each column is matched to a field. Every row is checked before anything is added, and a row that needs a fix is said with its number.');

    const intro = el('div', 'le-import-steps');
    const box = uploadWidget({ accept: '.csv,text/csv', title: 'Upload your spreadsheet', hint: 'A CSV file, or drag one here. In Excel or Google Sheets: File, Save as (or Download), CSV.', label: 'Choose a CSV file', onFile: (file) => read(file) });
    box.classList.add('le-import-file');
    intro.append(box);
    const plan = el('div', 'le-import-plan');
    const report = el('div', 'le-import-report');
    report.setAttribute('aria-live', 'polite');
    ui.body.replaceChildren(intro, plan, report);

    const waiting = el('span', 'le-modal-note');
    const go = el('button', 'le-btn-publish le-import-go', 'Add these records');
    go.type = 'button';
    go.disabled = true;
    ui.foot.replaceChildren(waiting, go);
    ui.foot.hidden = false;

    let rows = [];
    let schema = collection ? { name: collection.name, one: collection.one, many: collection.many, title: collection.title, fields: collection.fields } : null;
    let mapping = [];
    let replace = false;
    let checked = { ready: [], problems: [] };
    const name = el('input', 'le-input le-import-name');

    async function read(file) {
        if (!file) return;
        try {
            accept(parseCsv(await file.text()));
        } catch (error) {
            notify(error.message);
        }
    }

    function accept(parsed) {
        rows = parsed;
        if (rows.length < 2) {
            report.replaceChildren(el('p', 'le-data-refuse', 'The file has no rows after its first one. The first row names the columns; put a record on each row after it.'));
            go.disabled = true;
            return;
        }
        if (isNew) {
            schema = { name: '', one: 'record', many: 'records', fields: fieldsFromCsv(rows) };
            schema.title = (schema.fields.find((f) => f.type === 'text' && !f.code) ?? schema.fields.find((f) => f.type === 'text'))?.key;
            mapping = schema.fields.map((f) => f.key);
        } else {
            mapping = guessMapping(rows[0], schema.fields);
        }
        drawPlan();
        check();
    }

    function drawPlan() {
        plan.replaceChildren();
        if (isNew) {
            const wrap = el('div', 'le-field');
            const tag = el('label', 'le-label', 'What is this collection called?');
            name.id = 'le-import-collection-name';
            name.placeholder = 'Aircraft parts';
            tag.htmlFor = name.id;
            wrap.append(tag, name);
            const one = el('input', 'le-input le-import-one');
            one.placeholder = 'part';
            one.value = schema.one === 'record' ? '' : schema.one;
            one.setAttribute('aria-label', 'What one record is called, like part');
            one.addEventListener('input', () => { schema.one = one.value.trim().toLowerCase() || 'record'; schema.many = schema.one === 'record' ? 'records' : `${schema.one}s`; });
            wrap.append(el('label', 'le-label', 'One record is a'), one, el('p', 'le-hint', 'Visitors read it in "4 parts found".'));
            plan.append(wrap);
        }
        plan.append(el('p', 'le-label', isNew ? 'The fields, one per column' : 'Which field each column fills'));
        const table = el('table', 'le-import-map');
        rows[0].forEach((heading, c) => {
            const tr = el('tr');
            tr.append(el('th', null, heading || `Column ${c + 1}`));
            const td = el('td');
            const pick = el('select', 'le-input');
            if (isNew) {
                pick.setAttribute('aria-label', `Kind of field for ${heading}`);
                for (const t of TYPES) pick.append(opt(TYPE_WORDS[t].label, t));
                pick.append(opt('Leave this column out', ''));
                pick.value = schema.fields[c].type;
                pick.addEventListener('change', () => {
                    mapping[c] = pick.value ? schema.fields[c].key : '';
                    if (pick.value) {
                        const values = rows.slice(1).map((r) => String(r[c] ?? '').trim()).filter(Boolean);
                        schema.fields[c] = { key: schema.fields[c].key, label: schema.fields[c].label, type: pick.value, ...(pick.value === 'choice' ? { options: [...new Set(values)].slice(0, 100) } : {}) };
                    }
                    check();
                });
            } else {
                pick.setAttribute('aria-label', `Field for the column ${heading}`);
                pick.append(opt('Leave this column out', ''));
                for (const field of schema.fields) pick.append(opt(field.label, field.key));
                pick.value = mapping[c];
                pick.addEventListener('change', () => { mapping[c] = pick.value; check(); });
            }
            td.append(pick);
            const sample = String(rows[1]?.[c] ?? '').slice(0, 40);
            tr.append(td, el('td', 'le-hint', sample ? `e.g. ${sample}` : ''));
            table.append(tr);
        });
        plan.append(table);
        if (!isNew) {
            const how = el('fieldset', 'le-import-how');
            how.append(el('legend', 'le-label', 'What happens to the records you have'));
            for (const [value, words] of [[false, `Add these to the ${plural(collection.records.length, collection.one || 'record', collection.many || 'records')} you have`], [true, 'Put these in their place (the ones you have go)']]) {
                const tag = el('label', 'le-check');
                const radio = el('input');
                radio.type = 'radio';
                radio.name = 'le-import-how';
                radio.checked = replace === value;
                radio.addEventListener('change', () => { replace = value; check(); });
                tag.append(radio, document.createTextNode(` ${words}`));
                how.append(tag);
            }
            plan.append(how);
        }
    }

    function check() {
        const fields = isNew ? schema.fields.filter((_, c) => mapping[c]) : schema.fields;
        const used = isNew ? { ...schema, fields } : schema;
        const kept = replace || isNew ? [] : collection.records;
        checked = readCsvRows(rows, used, mapping, { taken: kept.map((r) => r.id), most: MOST_RECORDS - kept.length, now: now() });
        const extra = isNew ? schemaProblems({ ...used, name: name.value || 'A name' }) : [];
        report.replaceChildren(el('p', 'le-import-summary', `${plural(checked.ready.length, 'row is', 'rows are')} ready${checked.problems.length ? `, ${plural(checked.problems.length, 'row needs', 'rows need')} a fix first` : ''}.`));
        if (extra.length) report.append(...extra.map((line) => el('p', 'le-data-refuse', line)));
        if (checked.problems.length) {
            const list = el('ul', 'le-import-problems');
            for (const problem of checked.problems.slice(0, 30)) list.append(el('li', null, problem.says));
            if (checked.problems.length > 30) list.append(el('li', 'le-hint', `and ${checked.problems.length - 30} more`));
            report.append(el('p', 'le-hint', 'Fix these in your file and upload it again, or add the rest now:'), list);
        }
        go.disabled = !checked.ready.length || extra.length > 0;
        go.textContent = checked.ready.length ? `Add ${plural(checked.ready.length, 'record', 'records')}` : 'Add these records';
    }
    name.addEventListener('input', () => check());

    go.addEventListener('click', async () => {
        if (isNew && !name.value.trim()) { notify('Give the collection a name first.'); name.focus(); return; }
        go.disabled = true;
        ui.allowDismiss?.(false);
        try {
            const id = isNew ? idFrom(name.value, taken) : collection.id;
            const fields = isNew ? schema.fields.filter((_, c) => mapping[c]) : schema.fields;
            const final = { ...schema, name: isNew ? name.value.trim() : schema.name, fields };
            if (isNew && !fields.some((f) => f.key === final.title)) final.title = fields.find((f) => f.type === 'text')?.key;
            const records = [...(replace || isNew ? [] : collection.records), ...checked.ready];
            await saveCollection({ id, schema: final, records, before: collection?.pages ?? 0, save, progress: (n, of, waiting) => { go.textContent = waiting ? `Saving ${n} of ${of}: waiting ${waiting} seconds…` : `Saving ${n} of ${of}…`; } });
            done(`${plural(checked.ready.length, 'record', 'records')} added to ${final.name}.${checked.problems.length ? ` ${plural(checked.problems.length, 'row was', 'rows were')} left out.` : ''} Publish to show them to visitors.`, id);
        } catch (error) {
            ui.allowDismiss?.(true);
            go.disabled = false;
            notify(error.message);
        }
    });

    return { accept, check: () => checked, setName: (words) => { name.value = words; check(); }, setMapping: (c, key) => { mapping[c] = key; check(); }, setReplace: (value) => { replace = value; check(); } };
}

/** + New collection: from a spreadsheet, or an empty table with a name and one field of words. */
export function renderNewCollection({ ui, taken = [], fromSpreadsheet, save, done, notify }) {
    ui.title('New collection');
    ui.subtitle('A list visitors can search, like your parts or your stock.');
    const one = button('le-btn le-wide le-new-from-csv', 'Start from a spreadsheet');
    one.addEventListener('click', () => fromSpreadsheet());
    const form = el('form', 'le-new-collection');
    form.noValidate = true;
    const name = el('input', 'le-input');
    name.id = 'le-new-collection-name';
    name.placeholder = 'Aircraft parts';
    const tag = el('label', 'le-label', 'Or start with an empty table called');
    tag.htmlFor = name.id;
    const go = el('button', 'le-btn-outline le-wide', 'Make the empty table');
    go.type = 'submit';
    form.append(tag, name, go);
    ui.body.replaceChildren(el('p', 'le-hint', 'Most people start from a spreadsheet they already keep: every column becomes a field, every row a record.'), one, form);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!name.value.trim()) { notify('Give the collection a name.'); name.focus(); return; }
        const id = idFrom(name.value, taken);
        const schema = { name: name.value.trim(), one: 'record', many: 'records', title: 'name', fields: [{ key: 'name', label: 'Name', type: 'text' }] };
        go.disabled = true;
        try {
            await saveCollection({ id, schema, records: [], save });
            done(`${schema.name} is made. Add its fields and records in its table.`, id);
        } catch (error) {
            go.disabled = false;
            notify(error.message);
        }
    });
}
