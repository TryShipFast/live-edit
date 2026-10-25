import { beforeEach, describe, expect, it } from 'vitest';
import {
    cellContext, cellPlace, fieldNames, figure, itemContext, mostFor, parsePasted, pastePlan, periodValue,
    problems, tablePastePlan, tableOf, tryEdit, tryOrder,
} from '../../resources/js/data-kit.js';
import { renderChartRow, renderTableControls, chartRowOf } from '../../resources/js/data-panel.js';
import { kindSays } from '../../resources/js/pages.js';

/*
 * What Live Edit shows depends on the kind of chart (briefs/STANDARDS.md BH-12): its items in
 * its own terms, its own fields, its own rules. Never one generic panel.
 */
const chart = (kind, heads, rows, { unit = '', max = 12 } = {}) => {
    document.body.innerHTML = `<section data-chart="${kind}"><p data-chart-units data-edit="setting:u">${unit}</p>
      <div data-chart-plot></div>
      <table data-chart-table><thead><tr>${heads.map((h, i) => `<th data-edit="setting:h${i}">${h}</th>`).join('')}</tr></thead>
      <tbody data-edit-list="L" data-edit-list-max="${max}">${rows.map((r, i) => `<tr data-edit-item="r${i + 1}">${r.map((c, j) => `<${j ? 'td' : 'th'} data-edit="setting:c${i}${j}">${c}</${j ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</tbody></table></section>`;

    return document.querySelector('[data-chart]');
};
const rowsOf = (el) => [...el.querySelectorAll('tbody tr')];

describe('each chart is edited in its own terms', () => {
    it('names an item by its kind: a bar, a point, a slice, a stage, a measure', () => {
        const bars = chart('bar', ['Month', 'Orders'], [['Jan', '12'], ['Feb', '14'], ['Mar', '9']]);
        expect(itemContext(bars, rowsOf(bars)[2])).toBe('Bar 3 of 3 · Mar');
        const donut = chart('donut', ['Source', 'Share'], [['Friends', '60'], ['Search', '40']], { unit: '%' });
        expect(itemContext(donut, rowsOf(donut)[0])).toBe('Slice 1 of 2 · Friends');
        expect(itemContext(chart('funnel', ['Stage', 'People'], [['Visit', '9'], ['Buy', '2']]), rowsOf(document)[1])).toBe('Stage 2 of 2 · Buy');
        expect(itemContext(chart('line', ['Month', 'Visitors'], [['Jan 2026', '1']]), rowsOf(document)[0])).toBe('Point 1 of 1 · Jan 2026');
        expect(itemContext(chart('progress', ['Goal', 'So far', 'Target'], [['Reviews', '8', '10']]), rowsOf(document)[0])).toBe('Measure 1 of 1 · Reviews');
    });

    it('shows that kind’s fields, named by the chart’s own headings', () => {
        const progress = chart('progress', ['Goal', 'So far', 'Target'], [['Reviews', '8', '10']]);
        expect(fieldNames(progress)).toEqual(['Goal', 'So far', 'Target']);
        const panel = renderChartRow({ row: rowsOf(progress)[0], save: async () => {}, saveOrder: async () => {}, refresh: async () => {}, notify: () => {} });
        expect([...panel.querySelectorAll('.le-label')].map((l) => l.textContent)).toEqual(['Goal', 'So far', 'Target']);
        expect(panel.textContent).toContain('+ Add a measure after');
        expect(panel.textContent).toContain('Delete this measure');
    });

    it('a donut: shares that stop adding up are said, a seventh slice is refused', () => {
        const donut = chart('donut', ['Source', 'Share'], [['A', '42'], ['B', '27'], ['C', '18'], ['D', '13']], { unit: '%', max: 6 });
        expect(tryEdit(donut, rowsOf(donut)[0], 1, '46')).toEqual([expect.objectContaining({ refuse: false, message: expect.stringContaining('Shares now add to 104%, not 100%. Take 4 off one of them') })]);
        expect(tryEdit(donut, rowsOf(donut)[0], 1, '42')).toEqual([]);
        expect(tryEdit(donut, rowsOf(donut)[0], 1, 'lots')[0]).toMatchObject({ refuse: true, message: expect.stringContaining('“lots” is not a figure') });
        expect(problems('donut', Array.from({ length: 7 }, (_, i) => [`S${i}`, '10']), { unit: '%', most: 6 })[0]).toMatchObject({ refuse: true, message: expect.stringContaining('six'.length ? '6 slices at most' : '') });
        expect(mostFor(donut)).toBe(6);
    });

    it('a funnel never rises: a count larger than the stage before is refused, and so is a move that would make one', () => {
        const funnel = chart('funnel', ['Stage', 'People'], [['Visited', '4,800'], ['Viewed', '2,100'], ['Bought', '310']]);
        expect(tryEdit(funnel, rowsOf(funnel)[2], 1, '2,500')[0]).toMatchObject({ refuse: true, message: expect.stringContaining('can’t be more than the stage before it, “Viewed” (2,100)') });
        expect(tryEdit(funnel, rowsOf(funnel)[1], 1, '200')[0]).toMatchObject({ refuse: true, message: expect.stringContaining('“Bought” (310)') });
        expect(tryEdit(funnel, rowsOf(funnel)[2], 1, '2,000')).toEqual([]);
        expect(tryOrder(funnel, ['r1', 'r3', 'r2'])[0]).toMatchObject({ refuse: true });
    });

    it('a line keeps its points in date order', () => {
        const line = chart('line', ['Month', 'Visitors'], [['Jan 2026', '1'], ['Feb 2026', '2'], ['Mar 2026', '3']]);
        expect(tryEdit(line, rowsOf(line)[1], 0, 'Apr 2026')[0]).toMatchObject({ refuse: true, message: expect.stringContaining('“Mar 2026” comes before “Apr 2026”') });
        expect(tryEdit(line, rowsOf(line)[2], 0, 'Feb 2026')[0]).toMatchObject({ refuse: false, message: expect.stringContaining('same date') });
        expect(tryOrder(line, ['r2', 'r1', 'r3'])[0]).toMatchObject({ refuse: true });
        // Words that are not dates are the owner's order.
        expect(problems('line', [['Launch', '1'], ['Spring', '2']])).toEqual([]);
        expect(periodValue('2026-03') < periodValue('2026-04-01')).toBe(true);
        expect(periodValue('Q2 2026') > periodValue('Mar 2026')).toBe(true);
        expect(periodValue('14 Mar 2026') > periodValue('Mar 2026')).toBe(true);
    });

    it('reads a figure as the owner types it', () => {
        expect(figure('1,240')).toBe(1240);
        expect(figure('$3.50')).toBe(3.5);
        expect(figure('−8%')).toBe(-8);
        expect(figure('about')).toBeNull();
    });

    it('a row panel refuses what breaks the rule and saves what does not', async () => {
        const funnel = chart('funnel', ['Stage', 'People'], [['Visited', '100'], ['Bought', '10']]);
        const saved = [];
        const panel = renderChartRow({ row: rowsOf(funnel)[1], save: async (k, v) => saved.push([k, v]), saveOrder: async () => {}, refresh: async () => {}, notify: () => {} });
        document.body.append(panel);
        const count = panel.querySelector('input[data-data-column="1"]');
        count.value = '150';
        count.dispatchEvent(new Event('change'));
        await new Promise((r) => setTimeout(r));
        expect(saved).toEqual([]);
        expect(panel.querySelector('[role="alert"]').textContent).toContain('can’t be more than the stage before it');
        count.value = '40';
        count.dispatchEvent(new Event('change'));
        await new Promise((r) => setTimeout(r));
        expect(saved).toEqual([['c11', '40']]);
        expect(rowsOf(funnel)[1].cells[1].textContent).toBe('40');
    });

    it('a drawn mark opens the row it was drawn from', () => {
        const bars = chart('bar', ['Month', 'Orders'], [['Jan', '12'], ['Feb', '14']]);
        bars.querySelector('[data-chart-plot]').innerHTML = '<svg><rect data-chart-item="r2"></rect></svg>';
        expect(chartRowOf(bars.querySelector('rect'))).toBe(rowsOf(bars)[1]);
    });
});

describe('pasting rows', () => {
    it('reads tabs, commas and quoted cells', () => {
        expect(parsePasted('Jan\t12\nFeb\t14\n')).toEqual([['Jan', '12'], ['Feb', '14']]);
        expect(parsePasted('"Smith, J",1,240\nB,2')).toEqual([['Smith, J', '1', '240'], ['B', '2']]);
        expect(parsePasted('a;1\nb;2')).toEqual([['a', '1'], ['b', '2']]);
    });

    it('fills a chart: rows reused first, new ones added, a heading line used for the headings', () => {
        const bars = chart('bar', ['Month', 'Orders'], [['Jan', '12'], ['Feb', '14']]);
        const plan = pastePlan(bars, 'Month\tSales\nMar\t1\nApr\t2\nMay\t3', 1700000000000);
        expect(plan.refused).toEqual([]);
        expect(plan.heads).toEqual(['Month', 'Sales']);
        expect(plan.order.slice(0, 2)).toEqual(['r1', 'r2']);
        expect(plan.order[2]).toMatch(/^n[0-9a-z]+_r2$/);
        expect(plan.grid).toEqual([['Mar', '1'], ['Apr', '2'], ['May', '3']]);
    });

    it('refuses rows that break the kind’s rules or miss its columns', () => {
        const funnel = chart('funnel', ['Stage', 'People'], [['A', '9']]);
        expect(pastePlan(funnel, 'A,10\nB,20').refused[0]).toContain('can’t be more than the stage before it');
        expect(pastePlan(funnel, 'A\nB').refused[0]).toContain('a funnel needs 2: Stage, Count');
        const donut = chart('donut', ['Source', 'Share'], [['A', '100']], { unit: '%', max: 6 });
        expect(pastePlan(donut, Array.from({ length: 7 }, (_, i) => `S${i},10`).join('\n')).refused[0]).toContain('6 slices at most');
        expect(pastePlan(donut, 'A,60\nB,30').notes[0]).toContain('Shares now add to 90%');
    });
});

describe('a table the owner adds keeps its columns in step', () => {
    beforeEach(() => {
        document.body.innerHTML = `<section data-kit-table><table>
          <thead><tr data-edit-list="cols" data-edit-list-max="8"><th data-edit-item="c1"><span data-edit="setting:h1">Plan</span></th><th data-edit-item="c2"><span data-edit="setting:h2">Price</span></th></tr></thead>
          <tbody data-edit-list="rows" data-edit-list-max="40">
            <tr data-edit-item="r1" data-edit-list="cols"><th data-edit-item="c1"><span data-edit="setting:a1">Starter</span></th><td data-edit-item="c2"><span data-edit="setting:a2">$0</span></td></tr>
            <tr data-edit-item="r2" data-edit-list="cols"><th data-edit-item="c1"><span data-edit="setting:b1">Team</span></th><td data-edit-item="c2"><span data-edit="setting:b2">$24</span></td></tr>
          </tbody></table></section>`;
    });

    it('says where a cell is, by row and by column', () => {
        expect(cellContext(cellPlace(document.querySelector('[data-edit="setting:b2"]')))).toBe('Row 2 of 2 · Team · Column 2 of 2 · Price');
        expect(cellContext(cellPlace(document.querySelector('[data-edit="setting:h1"]')))).toBe('Heading · Column 1 of 2 · Plan');
    });

    it('adds, moves and deletes a column as one order for every row', async () => {
        const saved = [];
        const panel = renderTableControls({ element: document.querySelector('[data-edit="setting:a1"]'), save: async () => {}, saveOrder: async (list, ids) => saved.push([list.dataset.editList, ids]), refresh: async () => {}, notify: () => {}, applyOrder: async () => {} });
        const press = (words) => [...panel.querySelectorAll('button')].find((b) => b.textContent === words).click();
        press('Move right →');
        press('+ Add a column after');
        await new Promise((r) => setTimeout(r));
        expect(saved[0]).toEqual(['cols', ['c2', 'c1']]);
        expect(saved[1][0]).toBe('cols');
        expect(saved[1][1].slice(0, 1)).toEqual(['c1']);
        expect(saved[1][1][1]).toMatch(/^n/);
        expect(panel.textContent).toContain('This row');
    });

    it('fills from pasted rows, the first line as headings, as many columns as the rows have', () => {
        const plan = tablePastePlan(tableOf(document.querySelector('table')), 'Plan,Price,Seats\nStarter,$0,1\nTeam,$24,5\nBusiness,$59,20', {}, 1700000000000);
        expect(plan.heads).toEqual(['Plan', 'Price', 'Seats']);
        expect(plan.columns.slice(0, 2)).toEqual(['c1', 'c2']);
        expect(plan.columns).toHaveLength(3);
        expect(plan.rows.slice(0, 2)).toEqual(['r1', 'r2']);
        expect(plan.rows).toHaveLength(3);
        expect(new Set([...plan.columns, ...plan.rows]).size).toBe(6);
    });
});

describe('choosing a kind before it is added', () => {
    it('says what each kind holds and keeps to', () => {
        expect(kindSays('donut').join(' ')).toContain('six slices at most');
        expect(kindSays('funnel').join(' ')).toContain('no larger than the one before');
        expect(kindSays('table').join(' ')).toContain('columns');
    });
});
