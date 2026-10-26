/**
 * The drawer for a chart or a table (data-kit.js knows the kinds; this draws their panels).
 *
 * A chart's row opens as that kind's item ("Slice 2 of 4 · Search") with that kind's fields, all
 * of them at once, and the kind's rules kept as they are typed: an edit that breaks one is refused
 * with the reason, one that leaves the chart unfinished is saved with what to do next. The chart
 * itself opens with its settings (the ones its kind offers), its rows and "Paste rows". A table's
 * cell opens with its row and its column, each of which can be added, moved and deleted, every row
 * kept in step with the columns.
 */
import {
    KINDS, cellContext, cellsOf, cellPlace, chartData, chartOf, columnsOf, fieldNames, itemContext, kindOf, mostFor,
    movedColumn, pastePlan, rowsOf, tablePastePlan, tryEdit, tryOrder, freshIds,
} from './data-kit.js';

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
};

const button = (text, className, onClick, disabled = false) => {
    const node = el('button', className, text);
    node.type = 'button';
    node.disabled = disabled;
    node.addEventListener('click', onClick);

    return node;
};

/** What a new item is a copy of: the item it was added after, or what that one is itself a copy of. */
const sourceOf = (id) => String(id ?? '').match(/^n[0-9a-z]+_([A-Za-z0-9-]+)$/)?.[1] ?? (/^n[0-9a-z]+$/.test(String(id ?? '')) ? null : id);

const keyOf = (node) => {
    const marker = node?.getAttribute?.('data-edit') ?? '';

    return marker.startsWith('setting:') ? marker.slice('setting:'.length) : '';
};

/** The element holding a cell's words: the cell, or the marked element inside it. */
const wordsIn = (cell) => (cell?.matches?.('[data-edit]') ? cell : cell?.querySelector?.('[data-edit]')) ?? null;

const said = (problems) => {
    const box = el('div', 'le-data-said');
    for (const problem of problems) {
        const line = el('p', problem.refuse ? 'le-hint le-hint--warn' : 'le-hint le-data-note', problem.message);
        line.setAttribute('role', problem.refuse ? 'alert' : 'status');
        box.append(line);
    }

    return box;
};

/**
 * The row of a chart: the kind's fields, each saved as it is typed (on change), unless the kind's
 * rules refuse it. Its place in the list (move, add after, delete) is below, in the kind's words.
 *
 * @param {{ row: HTMLElement, save: Function, saveOrder: Function, refresh: Function, notify: Function }} deps
 */
export const renderChartRow = ({ row, save, saveOrder, refresh, notify }) => {
    const chart = chartOf(row);
    const kind = kindOf(chart);
    const spec = KINDS[kind];
    const wrap = el('div', 'le-data');
    wrap.append(el('div', 'le-section-heading le-item-context', itemContext(chart, row)));

    const names = fieldNames(chart);
    const fields = el('div', 'le-data-fields');
    const status = el('div', 'le-data-status');
    const showStatus = (problems) => status.replaceChildren(said(problems));
    const heads = cellsOf(chartData(chart).table?.querySelector('thead tr'));
    cellsOf(row).forEach((cell, column) => {
        const target = wordsIn(cell);
        const key = keyOf(target);
        // A figure the chart works out (a column of changes) is counted, not typed.
        if (!key || cell.closest('[data-kit-computed]') || cell.querySelector('[data-kit-computed]') || heads[column]?.hasAttribute('data-chart-change')) return;
        const label = el('label', 'le-field');
        const name = el('span', 'le-label', names[column] ?? `Column ${column + 1}`);
        const input = el('input', 'le-input');
        input.type = 'text';
        input.value = target.textContent.replace(/\s+/g, ' ').trim();
        input.dataset.dataColumn = String(column);
        if (column > 0) input.inputMode = 'decimal';
        const why = el('div', 'le-data-why');
        label.append(name, input, why);
        let saved = input.value;
        const commit = async () => {
            const value = input.value.trim();
            if (value === saved) return;
            const problems = tryEdit(chart, row, column, value);
            // Refused only for what this edit breaks, never for what was already so.
            const before = new Set(tryEdit(chart, null, null, null).filter((p) => p.refuse).map((p) => p.message));
            const refused = problems.filter((p) => p.refuse && !before.has(p.message));
            if (refused.length) {
                why.replaceChildren(said(refused));
                input.setAttribute('aria-invalid', 'true');
                return;
            }
            why.replaceChildren();
            input.removeAttribute('aria-invalid');
            try {
                await save(key, value);
                // On the page at once: the chart redraws from its table (kit-data.js).
                target.textContent = value;
                saved = value;
                showStatus(problems);
                notify(`${names[column] ?? 'Value'} saved ✓`);
            } catch (error) {
                notify(error.message);
            }
        };
        input.addEventListener('change', commit);
        input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); void commit(); } });
        fields.append(label);
    });
    wrap.append(fields, status);
    showStatus(tryEdit(chart, null, null, null).filter((p) => !p.refuse));

    // Its place in the list, in the kind's words.
    const { list, rows } = chartData(chart);
    const ids = rows.map((tr) => tr.dataset.editItem).filter(Boolean);
    const id = row.dataset.editItem;
    const index = ids.indexOf(id);
    const most = mostFor(chart);
    const one = spec.one.toLowerCase();
    const actions = el('div', 'le-row');
    const reorder = async (next, message) => {
        const problems = tryOrder(chart, next).filter((p) => p.refuse);
        if (problems.length) {
            status.replaceChildren(said(problems));
            return;
        }
        try {
            await saveOrder(list, next);
            await refresh(message);
        } catch (error) {
            notify(error.message);
        }
    };
    if (index > 0) actions.append(button('↑ Move up', 'le-chip-btn', () => reorder(movedColumn(ids, id, -1), `${spec.one} moved ✓`)));
    if (index < ids.length - 1) actions.append(button('↓ Move down', 'le-chip-btn', () => reorder(movedColumn(ids, id, 1), `${spec.one} moved ✓`)));
    actions.append(button(`+ Add a ${one} after`, 'le-chip-btn', () => {
        const next = [...ids];
        next.splice(index + 1, 0, freshIds(1, ids, Date.now(), sourceOf(id))[0]);
        void (async () => {
            try {
                await saveOrder(list, next);
                await refresh(`${spec.one} added ✓ Give it its own ${names[0]?.toLowerCase() ?? 'name'} and figure.`);
            } catch (error) {
                notify(error.message);
            }
        })();
    }, ids.length >= most));
    actions.append(button(`Delete this ${one}`, 'le-btn-danger', () => {
        if (!window.confirm(`Delete this ${one}?`)) return;
        void reorder(ids.filter((other) => other !== id), `${spec.one} deleted ✓`);
    }, ids.length <= 1));
    wrap.append(el('div', 'le-section-heading', `This ${one}`), actions);
    if (ids.length >= most) {
        wrap.append(el('p', 'le-hint', kind === 'donut'
            ? `A donut reads at ${most} slices at most. Put the smallest together as one called “Other”.`
            : `This chart holds ${most} ${spec.many}. Delete one to add another.`));
    }

    return wrap;
};

/**
 * The chart as a whole: its kind, its settings (the ones its kind offers), its rows to open, and
 * "Paste rows" to fill it from a spreadsheet.
 */
export const renderChartPanel = ({ chart, save, saveOrder, refresh, notify, renderChoice, applyOrder, openRow }) => {
    const kind = kindOf(chart);
    const spec = KINDS[kind];
    const wrap = el('div', 'le-data');
    const { list, rows } = chartData(chart);
    wrap.append(el('p', 'le-hint', `A ${kind === 'bar' ? 'bar chart' : kind === 'line' ? 'line chart' : kind === 'progress' ? 'chart of progress to targets' : kind}, drawn from its ${spec.many} in your site’s own colours. Click a ${spec.one.toLowerCase()} to change it.`));

    const settings = chart.querySelector('[data-edit-choice]');
    const choices = settings ? renderChoice({ item: settings, list: chart, save, notify, hint: 'How this chart is drawn. The figures stay as they are.' }) : null;
    if (choices) wrap.append(el('div', 'le-section-heading', 'How it is drawn'), choices);

    wrap.append(el('div', 'le-section-heading', `${spec.many[0].toUpperCase()}${spec.many.slice(1)} (${rows.length} of at most ${mostFor(chart)})`));
    const listed = el('div', 'le-row');
    rows.forEach((tr, i) => listed.append(button(`${i + 1}. ${cellsOf(tr)[0]?.textContent.trim().slice(0, 28) ?? ''}`, 'le-chip-btn', () => openRow(tr))));
    wrap.append(listed);

    wrap.append(el('div', 'le-section-heading', 'Paste rows'));
    const names = [spec.label, ...spec.fields];
    const area = el('textarea', 'le-input le-textarea');
    area.rows = 5;
    area.setAttribute('aria-label', `Rows to paste: ${names.join(', ')}`);
    area.placeholder = `${names.join('\t')}\n…`;
    const why = el('div', 'le-data-why');
    const fill = button(`Fill the chart`, 'le-btn', async () => {
        const plan = pastePlan(chart, area.value);
        if (plan.refused.length) {
            why.replaceChildren(said(plan.refused.map((message) => ({ refuse: true, message }))));
            return;
        }
        fill.disabled = true;
        try {
            await fillRows({ list, plan: plan.order, values: plan.grid, heads: plan.heads, headCells: chartData(chart).table?.querySelector('thead tr') ? cellsOf(chartData(chart).table.querySelector('thead tr')) : null, save, saveOrder, applyOrder });
            await refresh(`${plan.grid.length} ${spec.many} filled in ✓${plan.notes.length ? ` ${plan.notes[0]}` : ''}`);
        } catch (error) {
            fill.disabled = false;
            notify(error.message);
        }
    });
    wrap.append(el('p', 'le-hint', `From a spreadsheet, or typed: one ${spec.one.toLowerCase()} per line, ${names.length} columns (${names.join(', ')}), separated by tabs or commas. A first line of column names is used for the headings.`), area, fill, why);

    return wrap;
};

/**
 * Save a list's new order, draw it on the page (copying rows the way the server will), then save
 * every cell of every row, and the headings when there are some.
 */
const fillRows = async ({ list, plan, values, heads = null, headCells = null, save, saveOrder, applyOrder }) => {
    await saveOrder(list, plan);
    await applyOrder(list, plan);
    const rows = [...list.children].filter((tr) => tr.dataset?.editItem);
    for (const [r, tr] of rows.entries()) {
        for (const [c, cell] of cellsOf(tr).entries()) {
            const target = wordsIn(cell);
            const key = keyOf(target);
            const value = values[r]?.[c];
            if (key && value !== undefined && target.textContent.trim() !== value) {
                await save(key, value);
                target.textContent = value;
            }
        }
    }
    if (heads && headCells) {
        for (const [c, cell] of [...headCells].entries()) {
            const target = wordsIn(cell);
            const key = keyOf(target);
            if (key && heads[c] !== undefined && heads[c] !== '' && target.textContent.trim() !== heads[c]) {
                await save(key, heads[c]);
                target.textContent = heads[c];
            }
        }
    }
};

/**
 * A table's cell: its row and its column, each added to, moved and deleted, and the whole table
 * filled from pasted rows. A column is one order saved for the header and every row.
 */
export const renderTableControls = ({ element, save, saveOrder, refresh, notify, applyOrder }) => {
    const place = cellPlace(element);
    if (!place) return null;
    const wrap = el('div', 'le-data le-item-actions');
    wrap.append(el('div', 'le-section-heading le-item-context', cellContext(place)));

    const { info } = place;
    const columnIds = place.columns.map((c) => c.id);
    const columnsMost = parseInt(info.head?.dataset?.editListMax ?? '', 10) || 8;
    const columnsList = info.head;
    const go = async (list, ids, message) => {
        try {
            await saveOrder(list, ids);
            await refresh(message);
        } catch (error) {
            notify(error.message);
        }
    };

    const col = el('div', 'le-row');
    const left = movedColumn(columnIds, place.column, -1);
    const right = movedColumn(columnIds, place.column, 1);
    if (left) col.append(button('← Move left', 'le-chip-btn', () => go(columnsList, left, 'Column moved ✓')));
    if (right) col.append(button('Move right →', 'le-chip-btn', () => go(columnsList, right, 'Column moved ✓')));
    col.append(button('+ Add a column after', 'le-chip-btn', () => {
        const next = [...columnIds];
        next.splice(place.columnIndex + 1, 0, freshIds(1, [...columnIds, ...place.rows.map((tr) => tr.dataset.editItem)], Date.now(), sourceOf(place.column))[0]);
        void go(columnsList, next, 'Column added to every row ✓ Name it in the heading.');
    }, columnIds.length >= columnsMost));
    col.append(button('Delete this column', 'le-btn-danger', () => {
        if (!window.confirm(`Delete the column “${place.columns[place.columnIndex]?.name ?? ''}” from every row?`)) return;
        void go(columnsList, columnIds.filter((id) => id !== place.column), 'Column deleted ✓');
    }, columnIds.length <= 1));
    wrap.append(el('div', 'le-section-heading', 'This column'), col);
    if (columnIds.length >= columnsMost) wrap.append(el('p', 'le-hint', `This table holds ${columnsMost} columns. Delete one to add another.`));

    const rowIds = place.rows.map((tr) => tr.dataset.editItem);
    const rowsMost = parseInt(info.rowsList?.dataset?.editListMax ?? '', 10) || 40;
    if (place.row) {
        const id = place.row.dataset.editItem;
        const r = el('div', 'le-row');
        const up = movedColumn(rowIds, id, -1);
        const down = movedColumn(rowIds, id, 1);
        if (up) r.append(button('↑ Move up', 'le-chip-btn', () => go(info.rowsList, up, 'Row moved ✓')));
        if (down) r.append(button('↓ Move down', 'le-chip-btn', () => go(info.rowsList, down, 'Row moved ✓')));
        r.append(button('+ Add a row after', 'le-chip-btn', () => {
            const next = [...rowIds];
            next.splice(place.rowIndex + 1, 0, freshIds(1, [...rowIds, ...columnIds], Date.now(), sourceOf(id))[0]);
            void go(info.rowsList, next, 'Row added ✓');
        }, rowIds.length >= rowsMost));
        r.append(button('Delete this row', 'le-btn-danger', () => {
            if (!window.confirm('Delete this row?')) return;
            void go(info.rowsList, rowIds.filter((other) => other !== id), 'Row deleted ✓');
        }, rowIds.length <= 1));
        wrap.append(el('div', 'le-section-heading', 'This row'), r);
    }

    const area = el('textarea', 'le-input le-textarea');
    area.rows = 5;
    area.setAttribute('aria-label', 'Rows to paste into the table');
    area.placeholder = `${place.columns.map((c) => c.name).join('\t')}\n…`;
    const why = el('div', 'le-data-why');
    const fill = button('Fill the table', 'le-btn', async () => {
        const plan = tablePastePlan(info, area.value);
        if (plan.refused.length) {
            why.replaceChildren(said(plan.refused.map((message) => ({ refuse: true, message }))));
            return;
        }
        fill.disabled = true;
        try {
            // Columns first, so every row (the new ones too) has them; then the rows; then every cell.
            await saveOrder(columnsList, plan.columns);
            await applyOrder(columnsList, plan.columns);
            await saveOrder(info.rowsList, plan.rows);
            await applyOrder(info.rowsList, plan.rows);
            const rows = rowsOf(info);
            const cells = [...(plan.heads ? [[info.head, plan.heads]] : []), ...rows.map((tr, i) => [tr, plan.grid[i]])];
            for (const [tr, values] of cells) {
                for (const [c, cell] of [...tr.children].filter((n) => n.dataset?.editItem).entries()) {
                    const target = wordsIn(cell);
                    const key = keyOf(target);
                    if (key && values?.[c] !== undefined && target.textContent.trim() !== values[c]) {
                        await save(key, values[c]);
                        target.textContent = values[c];
                    }
                }
            }
            await refresh(`${plan.grid.length} rows and ${plan.columns.length} columns filled in ✓`);
        } catch (error) {
            fill.disabled = false;
            notify(error.message);
        }
    });
    wrap.append(
        el('div', 'le-section-heading', 'Paste rows'),
        el('p', 'le-hint', 'From a spreadsheet, or typed: one row per line, cells separated by tabs or commas. A first line of names becomes the headings. The table takes as many columns as the rows have.'),
        area, fill, why,
    );

    return wrap;
};

/** Whether an element is a chart's row, or inside one. */
export const chartRowOf = (node) => {
    const chart = chartOf(node);
    if (!chart || !kindOf(chart)) return null;
    const mark = node.closest?.('[data-chart-item]');
    const { rows } = chartData(chart);
    if (mark) return rows.find((tr) => tr.dataset.editItem === mark.getAttribute('data-chart-item') || tr.getAttribute('data-item') === mark.getAttribute('data-chart-item')) ?? null;
    const tr = node.closest?.('tr');

    return tr && rows.includes(tr) ? tr : null;
};

/** The columns of a table, for tests and the panel. */
export { columnsOf };
