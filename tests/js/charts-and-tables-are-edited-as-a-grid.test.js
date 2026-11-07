// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderDataGrid } from '../../resources/js/data-panel.js';
import { chartPlan, tablePlan } from '../../resources/js/data-kit.js';

/*
 * "It should be easy to update the components. Table, charts, etc. They are being used by novice" (owner, 7 Nov 2026):
 * a chart's figures and a table's cells as a small spreadsheet, the way Canva, Google Slides and PowerPoint's "Edit
 * data" show them. Typed in, rows and columns added and removed, rows pasted from a spreadsheet, one Save changes.
 */
const open = (options) => {
    const saved = [];
    const node = renderDataGrid({ onSave: async (data) => { saved.push(data); return options.refuse ?? []; }, ...options });
    document.body.replaceChildren(node);
    const cell = (r, c) => node.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
    const press = (name) => [...node.querySelectorAll('button')].find((b) => b.textContent === name || b.getAttribute('aria-label') === name);
    const type = (r, c, value) => { const box = cell(r, c); box.value = value; box.dispatchEvent(new Event('input')); };

    return { node, saved, cell, press, type };
};

describe('the data grid', () => {
    it('shows every figure to type in, and saves them all with one press', async () => {
        const g = open({ heads: ['Month', 'Orders'], rows: [['Jan', '120'], ['Feb', '135']], fixedColumns: true, mostRows: 12, figures: [false, true], rowNoun: 'bar' });
        expect(g.cell(1, 1).value).toBe('135');
        expect(g.cell(1, 1).inputMode).toBe('decimal');
        expect(g.press('Save changes').disabled).toBe(true);
        g.type(1, 1, '160');
        g.press('+ Add a bar').click();
        g.type(2, 0, 'Mar');
        g.type(2, 1, '190');
        expect(g.press('Save changes').disabled).toBe(false);
        g.press('Save changes').click();
        await new Promise((r) => setTimeout(r));
        expect(g.saved[0]).toEqual({ heads: ['Month', 'Orders'], rows: [['Jan', '120'], ['Feb', '160'], ['Mar', '190']] });
        // A chart's columns are its kind's: none added or removed.
        expect(g.press('+ Add a column')).toBeUndefined();
    });

    it('adds and deletes rows and columns of a table', () => {
        const g = open({ heads: ['Plan', 'Price'], rows: [['Starter', '₦0'], ['Team', '₦15,000']] });
        g.press('+ Add a column').click();
        g.type(-1, 2, 'Support');
        g.press('Delete row 1').click();
        expect(g.cell(0, 0).value).toBe('Team');
        expect(g.cell(-1, 2).value).toBe('Support');
        g.press('Delete column 2 “Price”').click();
        expect([...g.node.querySelectorAll('thead input')].map((i) => i.value)).toEqual(['Plan', 'Support']);
        expect(g.node.textContent).toContain('1 row of at most 40 · 2 columns of at most 8');
    });

    it('takes rows pasted from a spreadsheet into a cell, growing as it needs to', () => {
        const g = open({ heads: ['Plan', 'Price'], rows: [['Starter', '₦0']] });
        const paste = new Event('paste', { cancelable: true });
        paste.clipboardData = { getData: () => 'Team\t₦15,000\t5\nBusiness\t₦45,000\t20' };
        g.cell(0, 0).dispatchEvent(paste);
        expect(paste.defaultPrevented).toBe(true);
        expect([0, 1].map((r) => [0, 1, 2].map((c) => g.cell(r, c).value))).toEqual([['Team', '₦15,000', '5'], ['Business', '₦45,000', '20']]);
    });

    it('says why a save is refused, in the panel', async () => {
        const g = open({ heads: ['Name', 'Share'], rows: [['Search', '40']], fixedColumns: true, refuse: ['A donut reads at 6 slices at most.'] });
        g.type(0, 1, '41');
        g.press('Save changes').click();
        await new Promise((r) => setTimeout(r));
        expect(g.node.querySelector('[role="alert"]').textContent).toBe('A donut reads at 6 slices at most.');
        expect(g.press('Save changes').disabled).toBe(false);
    });

    it('keeps every chart rule when saving: a figure must be a figure', () => {
        const chart = document.createElement('section');
        chart.setAttribute('data-chart', 'bar');
        chart.innerHTML = '<table data-chart-table><tbody data-edit-list="k"><tr data-edit-item="b1"><th>Jan</th><td>1</td></tr></tbody></table>';
        expect(chartPlan(chart, [['Jan', 'lots']]).refused.join(' ')).toContain('lots');
        expect(chartPlan(chart, [['Jan', '5'], ['', '']]).grid).toEqual([['Jan', '5']]);
        const table = document.createElement('div');
        table.setAttribute('data-kit-table', '');
        table.innerHTML = '<table><thead><tr data-edit-list="c"><th data-edit-item="c1">A</th></tr></thead><tbody data-edit-list="r"><tr data-edit-item="r1"><td data-edit-item="c1">x</td></tr></tbody></table>';
        const plan = tablePlan({ head: table.querySelector('thead tr'), rowsList: table.querySelector('tbody') }, [['x', 'y'], ['z', 'w']], ['A', 'B']);
        expect(plan.columns.length).toBe(2);
        expect(plan.rows.length).toBe(2);
        expect(plan.heads).toEqual(['A', 'B']);
    });
});
