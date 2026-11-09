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
    KINDS, cellContext, cellsOf, cellPlace, chartData, chartOf, chartPlan, columnsOf, fieldNames, figure, itemContext, kindOf, mostFor,
    movedColumn, parsePasted, pastePlan, rowsOf, tableOf, tablePastePlan, tablePlan, tryEdit, tryOrder, freshIds,
} from './data-kit.js';

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
};

/** A question asked in the editor (its own dialog), or the browser's where there is none. */
const askFirst = async (ask, title) => (ask ? ask({ title, subtitle: 'Undo brings it back.', yes: 'Delete', no: 'Keep it' }) : window.confirm(title));

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
export const renderChartRow = ({ row, save, saveOrder, refresh, notify, ask = null }) => {
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
    actions.append(button(`Delete this ${one}`, 'le-btn-danger', async () => {
        if (!await askFirst(ask, `Delete this ${one}?`)) return;
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
export const renderChartPanel = ({ chart, save, saveOrder, refresh, notify, renderChoice, applyOrder, focusRow = null }) => {
    const kind = kindOf(chart);
    const spec = KINDS[kind];
    const wrap = el('div', 'le-data');
    const { list, rows } = chartData(chart);
    wrap.append(el('p', 'le-hint', `A ${kind === 'bar' ? 'bar chart' : kind === 'line' ? 'line chart' : kind === 'progress' ? 'chart of progress to targets' : kind}, drawn from its ${spec.many} in your site’s own colours. Type in the grid below, then Save changes.`));

    wrap.append(el('div', 'le-section-heading', `Its ${spec.many}`));
    const headCells = chartData(chart).table?.querySelector('thead tr') ? cellsOf(chartData(chart).table.querySelector('thead tr')) : [];
    const width = 1 + spec.fields.length;
    wrap.append(renderDataGrid({
        heads: Array.from({ length: width }, (_, i) => String(headCells[i]?.textContent ?? [spec.label, ...spec.fields][i] ?? '').trim()),
        rows: rows.map((tr) => cellWords(tr).slice(0, width)),
        fixedColumns: true,
        mostRows: mostFor(chart),
        figures: [false, ...spec.fields.map(() => true)],
        rowNoun: spec.one.toLowerCase(),
        focus: focusRow && rows.includes(focusRow) ? { row: rows.indexOf(focusRow), col: 1 } : null,
        onSave: async ({ heads, rows: grid }) => {
            const plan = chartPlan(chart, grid, heads);
            if (plan.refused.length) return plan.refused;
            await fillRows({ list, plan: plan.order, values: plan.grid, heads: plan.heads, headCells: headCells.length ? headCells : null, save, saveOrder, applyOrder });
            await refresh(`Chart saved ✓ ${plan.grid.length} ${plan.grid.length === 1 ? spec.one.toLowerCase() : spec.many}.${plan.notes.length ? ` ${plan.notes[0]}` : ''}`);

            return [];
        },
    }));

    // How it is drawn comes after its figures: the figures are what an owner opens a chart to change.
    const settings = chart.querySelector('[data-edit-choice]');
    const choices = settings ? renderChoice({ item: settings, list: chart, save, notify, hint: 'How this chart is drawn. The figures stay as they are.' }) : null;
    if (choices) wrap.append(el('div', 'le-section-heading', 'How it is drawn'), choices);

    const more = el('details', 'le-figures-more');
    more.append(el('summary', null, 'Paste many rows at once'));
    wrap.append(more);
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
    more.append(el('p', 'le-hint', `From a spreadsheet, or typed: one ${spec.one.toLowerCase()} per line, ${names.length} columns (${names.join(', ')}), separated by tabs or commas. A first line of column names is used for the headings.`), area, fill, why);

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
export const renderTableControls = ({ element, save, saveOrder, refresh, notify, applyOrder, ask = null }) => {
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
    col.append(button('Delete this column', 'le-btn-danger', async () => {
        if (!await askFirst(ask, `Delete the column “${place.columns[place.columnIndex]?.name ?? ''}” from every row?`)) return;
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
        r.append(button('Delete this row', 'le-btn-danger', async () => {
            if (!await askFirst(ask, 'Delete this row?')) return;
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

/*
 * The data grid (owner, 7 Nov 2026: "It should be easy to update the components. Table, charts, etc. They are being
 * used by novice"). A chart's figures and a table's cells as the small spreadsheet people already know from Canva,
 * Google Slides and PowerPoint's "Edit data": type in any cell, + Add a row, + Add a column, ✕ to remove one, paste
 * straight from Excel or Google Sheets into any cell, then Save changes. Saving runs the same rules as pasting
 * (chartPlan, tablePlan), so a donut still takes six slices at most and a figure must be a figure.
 */
/*
 * The same grid for a list the page already has (a shop's flash sale, sale.js): `fixedRows` (no rows added or
 * deleted, no count), `kinds` per column ('tick' a box, 'read' words that are shown and not typed, 'text' the
 * default), headings that are the columns' names (`fixedColumns`), `onCell(row, col, cells)` to keep one cell in
 * step with another (a sale price and its percent off), `picked` a row drawn as the one pressed on the page, and
 * `wrap.changed()` for fields beside the grid that are saved with it. `kindOf(row, col)` overrides a column's kind
 * for one cell ('blank' shows nothing: a row still loading); a 'count' cell is a whole number whose 0 reads "Sold
 * out". `renderCell(row, col, value)` draws a cell of its own (a product's stock across its sizes), `afterRow(row)` a row
 * of its own under it (those sizes, opened), `hiddenRow(row)` leaves one out; `wrap.setRow(row, cells)` fills a row that
 * arrived later (as it now stands, so Undo changes keeps it), and `wrap.redraw()` draws again, keeping the box typed in.
 * `afterDraw(table)` runs each time the rows are drawn (the Products grid marks an SKU two rows share), and
 * `wrap.setCell(row, col, value)` changes one cell a cell of its own holds (a product's collections), as typing would.
 */
export const renderDataGrid = ({ heads = [], rows = [], fixedColumns = false, mostRows = 40, mostColumns = 8, figures = [], rowNoun = 'row', focus = null, onSave, fixedRows = false, kinds = [], onCell = null, picked = null, numbered = true, onUndo = null, kindOf = null, renderCell = null, afterRow = null, hiddenRow = null, afterDraw = null, nameColumn = null }) => {
    const state = {
        heads: [...heads],
        rows: rows.map((cells) => [...cells]),
    };
    // what Undo changes goes back to: the rows as they were given, and as they arrived since
    const base = rows.map((cells) => [...cells]);
    const width = () => Math.max(state.heads.length, ...state.rows.map((cells) => cells.length), 1);
    const wrap = el('div', 'le-figures-wrap');
    const scroll = el('div', 'le-figures-scroll');
    const table = el('table', 'le-figures');
    scroll.append(table);
    // a box taken to is brought into view, clear of anything stuck over the panel's foot (its scroll margin)
    table.addEventListener('focusin', (event) => {
        if (event.target.matches?.('input')) event.target.scrollIntoView?.({ block: 'nearest' });
    });
    const tools = el('div', 'le-figures-tools');
    const count = el('span', 'le-figures-count');
    const why = el('div', 'le-data-why');
    const foot = el('div', 'le-figures-foot');
    const saveButton = button('Save changes', 'le-btn le-btn-primary', () => void saveNow());
    const undo = button('Undo changes', 'le-chip-btn', () => {
        state.heads = [...heads];
        state.rows = base.map((cells) => [...cells]);
        onUndo?.();
        dirty(false);
        draw();
    });
    let changed = false;
    const dirty = (on = true) => {
        changed = on;
        saveButton.disabled = !on;
        undo.hidden = !on;
        if (on) why.replaceChildren();
    };
    const plural = (n, one) => `${n} ${one}${n === 1 ? '' : 's'}`;

    const input = (value, label, r, c) => {
        const box = el('input', 'le-figures-cell');
        box.type = 'text';
        box.value = value ?? '';
        box.setAttribute('aria-label', label);
        box.dataset.row = String(r);
        box.dataset.col = String(c);
        if (r >= 0 && figures[c]) box.inputMode = 'decimal';
        // left: the row says it as it will be kept (a price with its currency)
        if (r >= 0 && onCell) box.addEventListener('change', () => { onCell(r, c, state.rows[r], true); syncRow(r, -1); });
        box.addEventListener('input', () => {
            if (r < 0) state.heads[c] = box.value;
            else state.rows[r][c] = box.value;
            if (r >= 0 && onCell) {
                onCell(r, c, state.rows[r]);
                syncRow(r, c);
            }
            dirty();
        });
        // Enter goes down a row, as in a spreadsheet.
        box.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            table.querySelector(`input[data-row="${r + 1}"][data-col="${c}"]`)?.focus();
        });
        // Rows copied from a spreadsheet fill the grid from this cell, as many rows and columns as there are room for.
        box.addEventListener('paste', (event) => {
            const text = event.clipboardData?.getData('text/plain') ?? '';
            if (!/[\t\n]/.test(text.trim())) return;
            event.preventDefault();
            const pasted = parsePasted(text);
            pasted.forEach((cells, i) => {
                const at = r + i;
                if (at < 0) {
                    cells.forEach((cell, j) => { if (!fixedColumns || c + j < width()) state.heads[c + j] = cell; });

                    return;
                }
                while (state.rows.length <= at && state.rows.length < mostRows) state.rows.push(Array(width()).fill(''));
                if (!state.rows[at]) return;
                cells.forEach((cell, j) => {
                    const col = c + j;
                    if (col >= (fixedColumns ? width() : mostColumns)) return;
                    state.rows[at][col] = cell;
                });
            });
            dirty();
            draw({ row: r, col: c });
        });

        return box;
    };

    // A row's other cells, after onCell changed them, without drawing the grid again (the box typed in keeps its place).
    const syncRow = (r, typedIn) => {
        table.querySelectorAll(`[data-row="${r}"]`).forEach((box) => {
            const c = Number(box.dataset.col);
            if (c === typedIn) return;
            if (box.type === 'checkbox') box.checked = Boolean(state.rows[r][c]);
            else if (box.tagName === 'INPUT') box.value = state.rows[r][c] ?? '';
            else box.textContent = state.rows[r][c] ?? '';
        });
    };
    const tick = (value, label, r, c) => {
        const box = el('input', 'le-figures-tick');
        box.type = 'checkbox';
        box.checked = Boolean(value);
        box.setAttribute('aria-label', label);
        box.dataset.row = String(r);
        box.dataset.col = String(c);
        box.addEventListener('change', () => {
            state.rows[r][c] = box.checked ? '1' : '';
            if (onCell) { onCell(r, c, state.rows[r]); syncRow(r, c); }
            dirty();
        });
        // the whole cell is the box to press (44px high), not only the small square
        const hit = el('label', 'le-figures-tick-hit');
        hit.append(box);

        return hit;
    };
    const cellFor = (value, r, c) => {
        const label = `${state.rows[r][nameColumn ?? kinds.indexOf('read')] || `Row ${r + 1}`}, ${state.heads[c] || `column ${c + 1}`}`;
        const kind = kindOf?.(r, c) ?? kinds[c];
        if (kind === 'blank') return el('span', 'le-figures-blank');
        if (kind === 'tick') return tick(value, label, r, c);
        if (kind === 'count') {
            const box = input(value, label, r, c);
            box.inputMode = 'numeric';
            box.classList.add('le-figures-count-cell');
            const sold = () => {
                const out = box.value.trim() === '0';
                box.closest('td')?.classList.toggle('is-sold-out', out);
                // said as well as shown
                box.setAttribute('aria-label', out ? `${label}, sold out` : label);
            };
            box.addEventListener('input', sold);
            requestAnimationFrame(sold);

            return box;
        }
        if (kind === 'read') {
            const words = el('span', 'le-figures-read', value ?? '');
            words.dataset.row = String(r);
            words.dataset.col = String(c);

            return words;
        }

        return input(value, label, r, c);
    };

    const draw = (focusOn = null) => {
        const w = width();
        state.rows = state.rows.map((cells) => Array.from({ length: w }, (_, i) => cells[i] ?? ''));
        state.heads = Array.from({ length: w }, (_, i) => state.heads[i] ?? '');
        const head = el('tr');
        if (numbered) head.append(el('th', 'le-figures-corner'));
        state.heads.forEach((name, c) => {
            const th = el('th', kinds[c] ? `le-col-${kinds[c]}` : undefined);
            if (fixedColumns && kinds.length) th.append(el('span', 'le-figures-head', name));
            else th.append(input(name, `Column ${c + 1} name`, -1, c));
            if (!fixedColumns && w > 1) {
                th.append(button('✕', 'le-figures-x', () => {
                    state.heads.splice(c, 1);
                    state.rows.forEach((cells) => cells.splice(c, 1));
                    dirty();
                    draw();
                }));
                th.lastChild.setAttribute('aria-label', `Delete column ${c + 1}${name ? ` “${name}”` : ''}`);
                th.lastChild.title = 'Delete this column';
            }
            head.append(th);
        });
        if (!fixedRows) head.append(el('th', 'le-figures-corner'));
        const body = el('tbody');
        state.rows.forEach((cells, r) => {
            const tr = el('tr', r === picked ? 'is-picked' : undefined);
            if (numbered) tr.append(el('th', 'le-figures-n', String(r + 1)));
            if (hiddenRow?.(r)) return;
            cells.forEach((value, c) => {
                const td = el('td', kinds[c] ? `le-col-${kinds[c]}` : undefined);
                // its column's name, for a phone, where each row reads as a small card (CSS, a narrow drawer)
                if (fixedColumns && kinds.length) {
                    td.dataset.th = state.heads[c] ?? '';
                    // said above the value where rows stack; the box itself is named for a screen reader
                    const th = el('span', 'le-figures-th', state.heads[c] ?? '');
                    th.setAttribute('aria-hidden', 'true');
                    td.append(th);
                }
                const own = renderCell?.(r, c, value) ?? null;
                if (!own && kindOf?.(r, c) === 'blank') td.classList.add('is-blank');
                td.append(own ?? (kinds.length ? cellFor(value, r, c) : input(value, `Row ${r + 1}, ${state.heads[c] || `column ${c + 1}`}`, r, c)));
                tr.append(td);
            });
            if (fixedRows) {
                body.append(tr);
                const under = afterRow?.(r);
                if (under) {
                    tr.classList.add('has-under');
                    body.append(under);
                }

                return;
            }
            const x = el('td');
            if (state.rows.length > 1) {
                const del = button('✕', 'le-figures-x', () => {
                    state.rows.splice(r, 1);
                    dirty();
                    draw();
                });
                del.setAttribute('aria-label', `Delete row ${r + 1}`);
                del.title = `Delete this ${rowNoun}`;
                x.append(del);
            }
            tr.append(x);
            body.append(tr);
        });
        const thead = el('thead');
        thead.append(head);
        table.replaceChildren(thead, body);

        afterDraw?.(table);
        if (fixedRows) {
            tools.hidden = true;
            if (focusOn) table.querySelector(`input[data-row="${focusOn.row}"][data-col="${focusOn.col}"]`)?.focus();

            return;
        }
        const addRow = button(`+ Add a ${rowNoun}`, 'le-chip-btn', () => {
            state.rows.push(Array(width()).fill(''));
            dirty();
            draw({ row: state.rows.length - 1, col: 0 });
        }, state.rows.length >= mostRows);
        const parts = [addRow];
        if (!fixedColumns) {
            parts.push(button('+ Add a column', 'le-chip-btn', () => {
                state.heads.push('');
                state.rows.forEach((cells) => cells.push(''));
                dirty();
                draw({ row: -1, col: width() - 1 });
            }, w >= mostColumns));
        }
        count.textContent = `${plural(state.rows.length, rowNoun)} of at most ${mostRows}${fixedColumns ? '' : ` · ${plural(w, 'column')} of at most ${mostColumns}`}`;
        tools.replaceChildren(...parts, count);
        if (focusOn) table.querySelector(`input[data-row="${focusOn.row}"][data-col="${focusOn.col}"]`)?.focus();
    };
    // The cell pressed on the page is the one ready to type in, once the drawer has opened and settled its own focus.
    if (focus) setTimeout(() => {
        const box = table.querySelector(`input[data-row="${focus.row}"][data-col="${focus.col}"]`);
        if (box && box.isConnected) { box.focus(); box.select?.(); box.scrollIntoView?.({ block: 'nearest' }); }
    }, 120);

    const saveNow = async () => {
        if (!changed) return;
        saveButton.disabled = true;
        saveButton.textContent = 'Saving…';
        try {
            const refused = await onSave({ heads: [...state.heads], rows: state.rows.map((cells) => [...cells]) });
            if (refused?.length) {
                why.replaceChildren(said(refused.map((message) => ({ refuse: true, message }))));
                saveButton.disabled = false;
            } else {
                changed = false;
            }
        } catch (error) {
            why.replaceChildren(said([{ refuse: true, message: error.message || 'It could not be saved. Try again.' }]));
            saveButton.disabled = false;
        } finally {
            saveButton.textContent = 'Save changes';
        }
    };

    foot.append(saveButton, undo);
    wrap.append(scroll, tools, why, foot);
    dirty(false);
    draw(focus);
    // fields beside the grid, saved with it
    wrap.changed = () => dirty();
    wrap.saveNow = () => saveNow();
    // a change to many rows at once (one % off for every product ticked)
    wrap.update = (change) => { state.rows.forEach((cells, r) => change(cells, r)); dirty(); redraw(); };
    // drawn again where it was: the box being typed in keeps its place and its caret
    const redraw = () => {
        const active = table.getRootNode?.()?.activeElement;
        const at = active && table.contains(active) ? { row: active.dataset.row, col: active.dataset.col, sizeKey: active.dataset.sizeKey, start: active.selectionStart, end: active.selectionEnd } : null;
        const scrolled = scroll.scrollLeft;
        draw();
        scroll.scrollLeft = scrolled;
        if (!at) return;
        const again = at.sizeKey ? table.querySelector(`[data-size-key="${CSS.escape(at.sizeKey)}"]`) : table.querySelector(`[data-row="${at.row}"][data-col="${at.col}"]`);
        if (!again) return;
        again.focus({ preventScroll: true });
        try { if (at.start !== null && at.start !== undefined) again.setSelectionRange(at.start, at.end); } catch { /* a box with no caret */ }
    };
    wrap.redraw = redraw;
    wrap.setRow = (r, cells) => {
        base[r] = [...cells];
        state.rows[r] = [...cells];
        redraw();
    };
    wrap.rowsNow = () => state.rows.map((cells) => [...cells]);
    wrap.setCell = (r, c, value) => {
        if (!state.rows[r]) return;
        state.rows[r][c] = value;
        dirty();
    };
    wrap.isChanged = () => changed;

    return wrap;
};

/** A row's cells as words, for the grid. */
const cellWords = (tr) => cellsOf(tr).map((cell) => String(wordsIn(cell)?.textContent ?? cell.textContent ?? '').replace(/\s+/g, ' ').trim());

/** Save a table from a plan: its columns, its rows, then every cell and heading. */
const fillTable = async ({ info, plan, save, saveOrder, applyOrder }) => {
    // Columns first, so every row (the new ones too) has them; then the rows; then every cell.
    await saveOrder(info.head, plan.columns);
    await applyOrder(info.head, plan.columns);
    await saveOrder(info.rowsList, plan.rows);
    await applyOrder(info.rowsList, plan.rows);
    const rows = rowsOf(info);
    const cells = [...(plan.heads ? [[info.head, plan.heads]] : []), ...rows.map((tr, i) => [tr, plan.grid[i]])];
    const heads = plan.heads ?? [...info.head.children].filter((n) => n.dataset?.editItem).map((cell) => String(wordsIn(cell)?.textContent ?? cell.textContent ?? '').replace(/\s+/g, ' ').trim());
    for (const [r, [tr, values]] of cells.entries()) {
        const isHead = Boolean(plan.heads) && r === 0;
        for (const [c, cell] of [...tr.children].filter((n) => n.dataset?.editItem).entries()) {
            const target = wordsIn(cell);
            const key = keyOf(target);
            if (key && values?.[c] !== undefined && target.textContent.trim() !== values[c]) {
                // named for History by its row and column: "Express wash, Saloon / hatchback"
                const where = isHead ? `the heading of column ${c + 1}` : [c > 0 ? values[0] : null, heads[c]].filter(Boolean).join(', ');
                await save(key, values[c], where || null);
                target.textContent = values[c];
            }
        }
    }
};

/**
 * A table: the whole of it as a grid, opened on the cell that was clicked; pasting many rows at once below it.
 */
export const renderTablePanel = ({ element, save, saveOrder, refresh, applyOrder }) => {
    const info = tableOf(element);
    if (!info) return null;
    const columns = columnsOf(info);
    const rows = rowsOf(info);
    const place = cellPlace(element);
    const wrap = el('div', 'le-data');
    wrap.append(el('p', 'le-hint', 'Type in any cell. Add or delete rows and columns, or paste rows from Excel or Google Sheets into a cell. Then Save changes.'));
    wrap.append(renderDataGrid({
        heads: columns.map((c) => c.name),
        rows: rows.map((tr) => cellWords(tr).slice(0, columns.length)),
        mostRows: parseInt(info.rowsList?.dataset?.editListMax ?? '', 10) || 40,
        mostColumns: parseInt(info.head?.dataset?.editListMax ?? '', 10) || 8,
        focus: place ? { row: place.rowIndex, col: Math.max(0, place.columnIndex) } : { row: 0, col: 0 },
        onSave: async ({ heads, rows: grid }) => {
            const plan = tablePlan(info, grid, heads);
            if (plan.refused.length) return plan.refused;
            await fillTable({ info, plan, save, saveOrder, applyOrder });
            await refresh(`Table saved ✓ ${plan.grid.length} rows, ${plan.columns.length} columns.`);

            return [];
        },
    }));

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
