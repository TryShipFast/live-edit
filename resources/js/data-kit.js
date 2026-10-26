/**
 * Charts and tables: what Live Edit knows about each kind (LIVE-EDIT-STRUCTURE.md section 7,
 * "Charts and tables the owner adds"; the template side is briefs/STANDARDS.md BH-12).
 *
 * A chart says what it is (data-chart="bar|line|donut|funnel|progress|sparkline") and its data is
 * the table inside it: one row per bar, point, slice, stage or measure, a list like any other. The
 * drawer is never one generic panel for all of them: each kind names its items in its own terms
 * ("Bar 3 of 6", "Slice", "Stage", "Point"), shows that kind's fields, and keeps that kind's rules,
 * refusing an edit that breaks one or saying what it does ("Shares now add to 104%").
 *
 * A table the owner adds (data-kit-table) is rows and columns: its rows are a list, and every row,
 * the header row too, is a list of its columns under one key, so a column added, removed or moved
 * is one saved order and every row follows (content.js, innermostFirst).
 *
 * Everything here reads the page and returns words or plans; live-edit.js draws the panel and saves.
 */

/** Each kind: what one item is called, its fields after the label, and how many it holds at most. */
export const KINDS = {
    bar: { one: 'Bar', many: 'bars', label: 'Category', fields: ['Value'], most: 24, choices: 'Columns or bars across; as written or largest first.' },
    line: { one: 'Point', many: 'points', label: 'Date or period', fields: ['Value'], most: 60, choices: 'A line or a filled area; points marked or not.' },
    donut: { one: 'Slice', many: 'slices', label: 'Name', fields: ['Share'], most: 6, choices: 'A donut or a pie.' },
    funnel: { one: 'Stage', many: 'stages', label: 'Stage', fields: ['Count'], most: 8, choices: '' },
    progress: { one: 'Measure', many: 'measures', label: 'Name', fields: ['Value', 'Target'], most: 8, choices: '' },
    sparkline: { one: 'Point', many: 'points', label: 'Period', fields: ['Value'], most: 60, choices: '' },
};

/** A row's cells, in order (th and td). */
export const cellsOf = (tr) => [...(tr?.children ?? [])].filter((cell) => /^(TH|TD)$/.test(cell.tagName));

const words = (el) => String(el?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** A figure as the owner typed it: "1,240", "42%", "$3.5", "−8". Null when it holds none. */
export const figure = (text) => {
    const s = String(text ?? '').replace(/[−–]/g, '-').replace(/[\s,  ]/g, '');
    const m = s.match(/-?\d+(?:\.\d+)?/);

    return m ? parseFloat(m[0]) : null;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthOf = (word) => MONTHS.indexOf(String(word).slice(0, 3).toLowerCase());

/**
 * Where a date or period falls, as a number to compare, or null when the words are not one we can
 * read ("Spring launch"): then the order is the owner's and nothing is refused. Reads 2026-03-14,
 * 2026-03, 2026, Mar 2026, March 2026, 14 Mar 2026, Q1 2026, Week 3, W3, and a month on its own.
 */
export const periodValue = (label) => {
    const s = String(label ?? '').trim();
    let m;
    if ((m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/))) return +m[1] * 400 + +m[2] * 32 + (+m[3] || 0);
    if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})$/)) && monthOf(m[2]) >= 0) return +m[3] * 400 + (monthOf(m[2]) + 1) * 32 + +m[1];
    if ((m = s.match(/^([A-Za-z]{3,})\.?\s+(\d{4})$/)) && monthOf(m[1]) >= 0) return +m[2] * 400 + (monthOf(m[1]) + 1) * 32;
    if ((m = s.match(/^Q([1-4])\s+(\d{4})$/i))) return +m[2] * 400 + (+m[1] * 3 - 2) * 32;
    if ((m = s.match(/^(\d{4})$/))) return +m[1] * 400;
    if ((m = s.match(/^(?:week|wk|w)\s*(\d{1,2})$/i))) return +m[1];
    if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})$/)) && monthOf(m[2]) >= 0) return (monthOf(m[2]) + 1) * 32 + +m[1];
    if ((m = s.match(/^([A-Za-z]{3,})\.?$/)) && monthOf(m[1]) >= 0) return monthOf(m[1]) + 1;

    return null;
};

/** The chart an element belongs to, and its kind. */
export const chartOf = (el) => el?.closest?.('[data-chart]') ?? null;
export const kindOf = (chart) => (KINDS[chart?.getAttribute?.('data-chart')] ? chart.getAttribute('data-chart') : null);

/** The chart's list of rows (its table's body), the header's names, and each row's cells. */
export const chartData = (chart) => {
    const table = chart?.querySelector('[data-chart-table]') ?? chart?.querySelector('table');
    const list = table?.querySelector('tbody[data-edit-list]') ?? table?.querySelector('tbody') ?? null;
    const heads = table?.querySelector('thead tr') ? cellsOf(table.querySelector('thead tr')).map(words) : [];
    const rows = list ? [...list.children].filter((tr) => tr.matches('tr')) : [];

    return { table, list, heads, rows };
};

/** The words a field is called by: the column's own heading, else the kind's name for it. */
export const fieldNames = (chart) => {
    const kind = KINDS[kindOf(chart)];
    const { heads } = chartData(chart);
    const generic = [kind?.label ?? 'Label', ...(kind?.fields ?? [])];
    const count = Math.max(generic.length, heads.length);

    return Array.from({ length: count }, (_, i) => heads[i] || generic[i] || `Column ${i + 1}`);
};

/** "Slice 2 of 4 · Search": the row, in its kind's words. */
export const itemContext = (chart, row) => {
    const kind = KINDS[kindOf(chart)];
    const { rows } = chartData(chart);
    const index = rows.indexOf(row) + 1;
    const name = words(cellsOf(row)[0]).slice(0, 40);

    return `${kind?.one ?? 'Item'} ${index} of ${rows.length}${name ? ` · ${name}` : ''}`;
};

/** The unit the chart's figures are in ("%", "$k", "orders"), from its units line. */
export const unitOf = (chart) => words(chart?.querySelector('[data-chart-units]'));

/** How many the chart may hold: the design's room (data-edit-list-max), never past its kind's most. */
export const mostFor = (chart) => {
    const kind = KINDS[kindOf(chart)];
    const { list } = chartData(chart);
    const room = parseInt(list?.dataset?.editListMax ?? list?.getAttribute?.('data-max') ?? '', 10);

    return Math.min(kind?.most ?? 60, Number.isFinite(room) && room > 0 ? room : Infinity);
};

/**
 * What is wrong with a chart's figures, in its kind's terms: each a { refuse, message, row }.
 * `refuse` is an edit that may not be saved (a word where a figure goes, a funnel that rises, a
 * point out of date order, a seventh slice); otherwise it is said, and saved (shares that do not
 * add up yet, which they cannot while the owner moves one share to another).
 *
 * @param {string} kind
 * @param {string[][]} grid  each row's cells as typed: [label, ...figures]
 * @param {{ unit?: string, total?: number|null, most?: number }} options
 */
export const problems = (kind, grid, { unit = '', total = null, most = Infinity } = {}) => {
    const spec = KINDS[kind];
    const out = [];
    if (!spec) return out;
    const one = spec.one.toLowerCase();

    if (grid.length > most) {
        out.push({ refuse: true, row: most, message: kind === 'donut'
            ? `A donut reads at ${most} slices at most. Put the smallest together as one slice called “Other”.`
            : `This chart holds ${most} ${spec.many} at most.` });
    }

    grid.forEach((cells, r) => {
        spec.fields.forEach((field, f) => {
            const said = String(cells[f + 1] ?? '').trim();
            if (figure(said) === null) {
                out.push({ refuse: true, row: r, message: said
                    ? `“${said}” is not a figure. ${field} for ${spec.one.toLowerCase()} ${r + 1} needs a number, like 42.`
                    : `${field} for ${one} ${r + 1} is empty. Give it a number.` });
            } else if (figure(said) < 0 && ['donut', 'funnel'].includes(kind)) {
                out.push({ refuse: true, row: r, message: `${field} can’t be below zero on a ${kind}.` });
            }
        });
    });
    if (out.some((p) => p.refuse)) return out;

    const values = grid.map((cells) => figure(cells[1]));

    if (kind === 'line' || kind === 'sparkline') {
        const at = grid.map((cells) => periodValue(cells[0]));
        if (at.every((v) => v !== null)) {
            for (let r = 1; r < at.length; r++) {
                if (at[r] < at[r - 1]) {
                    out.push({ refuse: true, row: r, message: `“${grid[r][0]}” comes before “${grid[r - 1][0]}”, the point above it. Points stay in date order: change the date, or move the point.` });
                } else if (at[r] === at[r - 1]) {
                    out.push({ refuse: false, row: r, message: `Points ${r} and ${r + 1} have the same date, “${grid[r][0]}”. Give the new one its own date.` });
                }
            }
        }
    }

    if (kind === 'funnel') {
        for (let r = 1; r < values.length; r++) {
            if (values[r] > values[r - 1]) {
                out.push({ refuse: true, row: r, message: `“${grid[r][0]}” (${grid[r][1]}) can’t be more than the stage before it, “${grid[r - 1][0]}” (${grid[r - 1][1]}). Each stage holds the people who reached it, so the counts only go down.` });
            }
        }
    }

    if (kind === 'donut') {
        const sum = values.reduce((a, b) => a + b, 0);
        const whole = total ?? (unit.trim() === '%' ? 100 : null);
        const rounded = Math.round(sum * 10) / 10;
        if (whole !== null && Math.abs(sum - whole) > 0.5) {
            const gap = Math.round((sum - whole) * 10) / 10;
            out.push({ refuse: false, row: null, message: `Shares now add to ${rounded}${unit.trim() === '%' ? '%' : ''}, not ${whole}${unit.trim() === '%' ? '%' : ''}. ${gap > 0 ? `Take ${gap} off` : `Add ${-gap} to`} one of them so the slices make the whole.` });
        }
    }

    return out;
};

/** The chart's rows as typed, with one cell replaced (the edit being tried). */
export const gridWith = (chart, row = null, column = null, value = null) => chartData(chart).rows.map((tr) => cellsOf(tr).map((cell, c) => (
    tr === row && c === column ? String(value) : words(cell)
)));

/** The stated whole for a donut, when the chart says one (data-chart-total), else null. */
export const totalOf = (chart) => {
    const stated = chart?.querySelector('[data-chart-total]');

    return stated ? figure(words(stated)) : null;
};

/** The chart's problems as it would be with this one edit. */
export const tryEdit = (chart, row, column, value) => problems(kindOf(chart), gridWith(chart, row, column, value), {
    unit: unitOf(chart), total: totalOf(chart), most: mostFor(chart),
});

/** The chart's problems with its rows in another order (a move). */
export const tryOrder = (chart, order) => {
    const { rows } = chartData(chart);
    const byId = new Map(rows.map((tr) => [tr.dataset.editItem, tr]));
    const grid = order.map((id) => byId.get(id)).filter(Boolean).map((tr) => cellsOf(tr).map(words));

    return problems(kindOf(chart), grid, { unit: unitOf(chart), total: totalOf(chart), most: mostFor(chart) });
};

/**
 * Rows pasted from a spreadsheet or typed: one per line, cells split by tabs, or else by commas
 * (or semicolons) with "quoted, cells" kept whole.
 */
export const parsePasted = (text) => {
    const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n').filter((line) => line.trim() !== '');
    if (!lines.length) return [];
    const tab = lines.some((line) => line.includes('\t'));
    const sep = tab ? '\t' : (lines.every((line) => line.includes(';')) && !lines.some((line) => line.includes(',')) ? ';' : ',');

    return lines.map((line) => {
        if (tab) return line.split('\t').map((cell) => cell.trim());
        const cells = [];
        let cell = '';
        let quoted = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (quoted) {
                if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
                else if (ch === '"') quoted = false;
                else cell += ch;
            } else if (ch === '"' && cell.trim() === '') { quoted = true; cell = ''; }
            else if (ch === sep) { cells.push(cell.trim()); cell = ''; }
            else cell += ch;
        }
        cells.push(cell.trim());

        return cells;
    });
};

/** Whether a pasted first line is the column names rather than data: its figures are words. */
export const looksLikeHeads = (grid, figuresFrom = 1) => grid.length > 1
    && grid[0].slice(figuresFrom).some((cell) => cell !== '' && figure(cell) === null)
    && grid[1].slice(figuresFrom).every((cell) => cell === '' || figure(cell) !== null);

/** A fresh item id, in the editor's own form ("n" and base 36), never one already in use. */
export const freshIds = (count, taken = [], now = Date.now(), from = null) => {
    const out = [];
    const used = new Set(taken);
    // The item each is a copy of, named in the id, so moving it later never changes what it copies.
    const source = from && /^[A-Za-z0-9-]+$/.test(from) && !/^n[0-9a-z]+(?:_|$)/.test(from) ? `_${from}` : '';
    for (let t = now; out.length < count; t++) {
        const id = `n${t.toString(36)}${source}`;
        if (!used.has(id)) { out.push(id); used.add(id); }
    }

    return out;
};

/**
 * How pasted rows fill a chart: the order to save (existing rows reused first, new ones after,
 * extra ones dropped) and what each row's cells will hold. Refuses with its reasons when the rows
 * break the kind's rules or do not have the kind's columns.
 */
export const pastePlan = (chart, text, now = Date.now()) => {
    const kind = kindOf(chart);
    const spec = KINDS[kind];
    let grid = parsePasted(text);
    const width = 1 + spec.fields.length;
    let heads = null;
    if (looksLikeHeads(grid)) { heads = grid[0]; grid = grid.slice(1); }
    if (!grid.length) return { refused: ['Nothing to fill it with: paste one row per line.'] };
    const short = grid.findIndex((cells) => cells.length < width);
    if (short !== -1) {
        return { refused: [`Line ${short + 1 + (heads ? 1 : 0)} has ${grid[short].length} column${grid[short].length === 1 ? '' : 's'}; a ${kind} needs ${width}: ${[spec.label, ...spec.fields].join(', ')}.`] };
    }
    grid = grid.map((cells) => cells.slice(0, width));
    const found = problems(kind, grid, { unit: unitOf(chart), total: totalOf(chart), most: mostFor(chart) });
    const refused = found.filter((p) => p.refuse).map((p) => p.message);
    if (refused.length) return { refused };
    const existing = chartData(chart).rows.map((tr) => tr.dataset.editItem).filter(Boolean);
    const added = freshIds(Math.max(0, grid.length - existing.length), existing, now, existing.filter((id) => !/^n[0-9a-z]+(?:_|$)/.test(id)).at(-1));
    const order = [...existing.slice(0, grid.length), ...added];

    return { order, grid, heads: heads ? heads.slice(0, width) : null, notes: found.map((p) => p.message), refused: [] };
};

/* ---------------------------------------------------------------- tables */

/** The table block an element belongs to (data-kit-table), its table, and its lists. */
export const tableOf = (el) => {
    const block = el?.closest?.('[data-kit-table]') ?? null;
    const table = block?.matches('table') ? block : block?.querySelector('table') ?? null;
    if (!table) return null;
    const head = table.querySelector('thead tr');
    const rowsList = table.querySelector('tbody[data-edit-list]') ?? table.querySelector('tbody');

    return { block, table, head, rowsList, columnsKey: head?.dataset?.editList ?? null };
};

/** The columns, in order, by id: [{ id, name }]. */
export const columnsOf = (tableInfo) => [...(tableInfo?.head?.children ?? [])]
    .filter((cell) => cell.dataset.editItem)
    .map((cell) => ({ id: cell.dataset.editItem, name: words(cell) }));

/** The rows, in order: their elements. */
export const rowsOf = (tableInfo) => [...(tableInfo?.rowsList?.children ?? [])].filter((tr) => tr.dataset?.editItem);

/** Where a cell sits: its row (null in the header), its column id, and both positions. */
export const cellPlace = (el) => {
    const info = tableOf(el);
    const cell = el?.closest?.('th, td');
    if (!info || !cell || !cell.dataset.editItem) return null;
    const columns = columnsOf(info);
    const rows = rowsOf(info);
    const tr = cell.parentElement;
    const row = rows.includes(tr) ? tr : null;

    return {
        info,
        cell,
        column: cell.dataset.editItem,
        columnIndex: columns.findIndex((c) => c.id === cell.dataset.editItem),
        columns,
        row,
        rowIndex: row ? rows.indexOf(row) : -1,
        rows,
    };
};

/** "Row 2 of 3 · Team · Column 3 of 4 · People included", or the header's "Column 3 of 4 · …". */
export const cellContext = (place) => {
    const column = place.columns[place.columnIndex];
    const col = `Column ${place.columnIndex + 1} of ${place.columns.length}${column?.name ? ` · ${column.name.slice(0, 32)}` : ''}`;
    if (!place.row) return `Heading · ${col}`;
    const name = words(cellsOf(place.row)[0]).slice(0, 32);

    return `Row ${place.rowIndex + 1} of ${place.rows.length}${name ? ` · ${name}` : ''} · ${col}`;
};

/** The order of columns with one moved by `delta`, or null when it cannot move that way. */
export const movedColumn = (ids, id, delta) => {
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= ids.length) return null;
    const next = [...ids];
    [next[from], next[to]] = [next[to], next[from]];

    return next;
};

/**
 * How pasted rows fill a table: the first line is the column names when it reads like them. The
 * columns and rows to save (existing ones reused first) and what every cell holds.
 */
export const tablePastePlan = (tableInfo, text, { most = { columns: 8, rows: 40 } } = {}, now = Date.now()) => {
    let grid = parsePasted(text);
    if (!grid.length) return { refused: ['Nothing to fill it with: paste one row per line.'] };
    const width = Math.max(...grid.map((cells) => cells.length));
    const columnRoom = parseInt(tableInfo.head?.dataset?.editListMax ?? '', 10) || most.columns;
    const rowRoom = parseInt(tableInfo.rowsList?.dataset?.editListMax ?? '', 10) || most.rows;
    // A table's first line is its headings unless every cell of it is a figure.
    const heads = grid.length > 1 && grid[0].some((cell) => figure(cell) === null) ? grid[0] : null;
    if (heads) grid = grid.slice(1);
    if (width > columnRoom) return { refused: [`This table holds ${columnRoom} columns at most; the rows pasted have ${width}.`] };
    if (grid.length > rowRoom) return { refused: [`This table holds ${rowRoom} rows at most; ${grid.length} were pasted.`] };
    grid = grid.map((cells) => Array.from({ length: width }, (_, i) => cells[i] ?? ''));
    const columns = columnsOf(tableInfo).map((c) => c.id);
    const rows = rowsOf(tableInfo).map((tr) => tr.dataset.editItem);
    const lastOriginal = (ids) => ids.filter((id) => !/^n[0-9a-z]+(?:_|$)/.test(id)).at(-1);
    const newColumns = freshIds(Math.max(0, width - columns.length), [...columns, ...rows], now, lastOriginal(columns));
    const newRows = freshIds(Math.max(0, grid.length - rows.length), [...columns, ...rows, ...newColumns], now + 1000, lastOriginal(rows));

    return {
        columns: [...columns.slice(0, width), ...newColumns],
        rows: [...rows.slice(0, grid.length), ...newRows],
        heads: heads ? Array.from({ length: width }, (_, i) => heads[i] ?? '') : null,
        grid,
        refused: [],
    };
};
