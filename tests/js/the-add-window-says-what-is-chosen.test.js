import { describe, expect, it } from 'vitest';
import { nounFor, renderSectionBrowser } from '../../resources/js/pages.js';

/*
 * Owner, 10 Nov 2026: "live edit add form modal is always add form, even when you click on table or chart, the button
 * and modal header title is still add form". Opened from + Add a form, the window kept its first words whatever was
 * chosen in it. The button and the title now say what is being looked at.
 */
describe('the add window says what is chosen', () => {
    const library = [
        { from: 'kit.form.contact', label: 'Form: contact', page: 'Forms', kind: 'form' },
        { from: 'kit.table.data', label: 'Table', page: 'Charts and tables', kind: 'table' },
        { from: 'kit.chart.bar', label: 'Chart: bars', page: 'Charts and tables', kind: 'bar' },
        { from: 'about.team', label: 'Team', page: 'About', at: null },
    ];

    it('names each kind', () => {
        expect(['form', 'table', 'chart', 'section']).toEqual(library.map((s) => nounFor(s)));
        expect(nounFor({ kind: 'search' })).toBe('search');
        expect(nounFor(null)).toBe('section');
    });

    it('changes the button and tells the window as each one is chosen', async () => {
        const container = document.createElement('div');
        document.body.append(container);
        const looked = [];
        renderSectionBrowser({
            container,
            library,
            add: () => {},
            fetchPage: () => Promise.resolve(''),
            only: 'Forms',
            actionLabel: (section) => (section ? `Add this ${nounFor(section)}` : 'Add this form'),
            onLook: (section) => looked.push(nounFor(section)),
        });
        const button = container.querySelector('.le-browser-add');
        const pick = async (from) => {
            const tab = [...container.querySelectorAll('.le-subtab')].find((b) => b.textContent === 'All');
            tab?.click();
            [...container.querySelectorAll('.le-library-item')].find((row) => row.dataset.from === from).click();
            await Promise.resolve();
        };
        await pick('kit.table.data');
        expect(button.textContent).toBe('Add this table');
        await pick('kit.chart.bar');
        expect(button.textContent).toBe('Add this chart');
        await pick('kit.form.contact');
        expect(button.textContent).toBe('Add this form');
        expect(looked).toContain('table');
        expect(looked).toContain('chart');
        expect(looked.at(-1)).toBe('form');
    });
});
