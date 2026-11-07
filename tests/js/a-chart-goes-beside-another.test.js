// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { aChartOrTable, addedWith, besidePlace, describeStructure, renderSectionBrowser } from '../../resources/js/pages.js';

/*
 * A chart or table set on the left or right of another one the owner added (owner, 7 Nov 2026: "The charts and
 * other others only have above and below. But no left of or right of").
 */
describe('a chart or table beside another', () => {
    it('is saved with the one it sits beside, and kept while both are on the page', () => {
        const first = { 'add-aaaa1': 'kit.chart.bars' };
        const saved = JSON.parse(addedWith(first, 'add-bbbb2', 'kit.table', {}, { of: 'add-aaaa1', side: 'right' }));
        expect(saved).toEqual({ added: { 'add-aaaa1': 'kit.chart.bars', 'add-bbbb2': 'kit.table' }, beside: { 'add-bbbb2': { of: 'add-aaaa1', side: 'right' } } });

        // Another section added later keeps the pair.
        const later = JSON.parse(addedWith(saved.added, 'add-cccc3', 'about.team', saved.beside));
        expect(later.beside).toEqual(saved.beside);

        // Removing either one undoes the pair; nothing beside is left behind.
        expect(JSON.parse(addedWith(saved.added, 'add-aaaa1', null, saved.beside))).toEqual({ added: { 'add-bbbb2': 'kit.table' } });
        expect(JSON.parse(addedWith(saved.added, 'add-bbbb2', null, saved.beside))).toEqual({ added: { 'add-aaaa1': 'kit.chart.bars' } });
    });

    it('reads the window\'s choice and knows charts and tables', () => {
        expect(besidePlace('beside:left:s-add-aaaa1')).toEqual({ side: 'left', item: 's-add-aaaa1', of: 'add-aaaa1' });
        expect(besidePlace('s-add-aaaa1')).toBeNull();
        expect(aChartOrTable({ kind: 'table' })).toBe(true);
        expect(aChartOrTable({ kind: 'bar' })).toBe(true);
        expect(aChartOrTable({ kind: 'form' })).toBe(false);
        expect(aChartOrTable({ from: 'about.team' })).toBe(false);
    });

    it('is said in words on the publish review', () => {
        const library = [{ from: 'kit.chart.bars', label: 'Chart: bars · 2 left' }, { from: 'kit.table', label: 'Table' }];
        const before = JSON.stringify({ added: { 'add-aaaa1': 'kit.chart.bars' } });
        const after = JSON.stringify({ added: { 'add-aaaa1': 'kit.chart.bars', 'add-bbbb2': 'kit.table' }, beside: { 'add-bbbb2': { of: 'add-aaaa1', side: 'right' } } });
        expect(describeStructure('structure:page:about', before, after, { library }).after).toBe('Added Table. Set Table on the right of Chart: bars');
    });

    it('offers left and right only while a chart or table is looked at', async () => {
        const container = document.createElement('div');
        document.body.append(container);
        renderSectionBrowser({
            container,
            library: [{ from: 'about.team', label: 'Team', page: 'About', at: null }, { from: 'kit.table', label: 'Table', page: 'Charts and tables', kind: 'table' }],
            add: () => {},
            fetchPage: () => Promise.resolve(''),
            places: [{ value: 's-a', label: 'Below “Team”' }, { value: 'beside:left:s-add-aaaa1', label: 'On the left of “Chart”', chartsAndTables: true }],
            place: 's-a',
        });
        const option = container.querySelector('option[value="beside:left:s-add-aaaa1"]');
        const rows = [...container.querySelectorAll('.le-library-item')];
        rows.find((row) => row.dataset.from === 'about.team').click();
        await Promise.resolve();
        expect(option.disabled).toBe(true);
        rows.find((row) => row.dataset.from === 'kit.table').click();
        await Promise.resolve();
        expect(option.disabled).toBe(false);
    });
});
