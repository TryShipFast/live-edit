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

/*
 * "Then I add to section for chart is not working" (owner, 7 Nov 2026): with none left on the plan the save was refused
 * and the reason went to a toast behind the add window. The window says it and offers the upgrade instead.
 */
describe('a chart with none left on the plan', () => {
    const library = [
        { from: 'kit.chart.bar', label: 'Chart: bars or columns · None left', page: 'Charts and tables', kind: 'bar', locked: true, locked_reason: 'Your plan includes 1 chart or table on this website. Upgrade to add more.' },
        { from: 'kit.table.data', label: 'Table · 2 left', page: 'Charts and tables', kind: 'table' },
    ];
    const open = (upgrade) => {
        const container = document.createElement('div');
        document.body.append(container);
        const added = [];
        const picker = renderSectionBrowser({ container, library, add: (section) => added.push(section.from), fetchPage: () => Promise.resolve(''), upgrade });
        const row = (from) => [...container.querySelectorAll('.le-library-item')].find((r) => r.dataset.from === from);

        return { container, added, picker, row, action: container.querySelector('.le-browser-add'), note: container.querySelector('.le-browser-note') };
    };

    it('says why and offers the upgrade rather than a button that does nothing', async () => {
        const opened = [];
        window.open = (href) => opened.push(href);
        const w = open('/billing?site=x');
        w.row('kit.chart.bar').click();
        await Promise.resolve();
        expect(w.note.hidden).toBe(false);
        expect(w.note.textContent).toContain('Your plan includes 1 chart or table');
        expect(w.action.textContent).toBe('Upgrade to add more');
        w.action.click();
        expect(w.added).toEqual([]);
        expect(opened).toEqual(['/billing?site=x']);

        // One with some left adds as before, and the note goes.
        w.row('kit.table.data').click();
        await Promise.resolve();
        expect(w.note.hidden).toBe(true);
        expect(w.action.textContent).toBe('Add this section');
        w.action.click();
        expect(w.added).toEqual(['kit.table.data']);
    });

    it('is not offered at all to a teammate without billing, and a refused save is said in the window', async () => {
        const w = open(null);
        w.row('kit.chart.bar').click();
        await Promise.resolve();
        expect(w.action.disabled).toBe(true);
        w.picker.say('Your plan includes 1 chart or table on this website. Upgrade to add more.');
        expect(w.note.hidden).toBe(false);
    });
});
