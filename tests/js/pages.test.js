// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { addedWith, addressProblem, grouped, newAddedId, orderWith, renderPagesPanel, slugFor } from '../../resources/js/pages.js';

describe('the page builder names and places things the way the host reads them', () => {
    it('suggests an address from a title', () => {
        expect(slugFor('Open days 2027!')).toBe('open-days-2027');
        expect(slugFor('Fees & bursaries')).toBe('fees-and-bursaries');
        expect(slugFor('Crèche')).toBe('creche');
        expect(slugFor('  ')).toBe('');
        expect(slugFor('x'.repeat(80)).length).toBeLessThanOrEqual(48);
    });

    it('refuses an address the host would refuse, and one already taken', () => {
        expect(addressProblem('open-days', ['about'])).toBeNull();
        expect(addressProblem('', [])).toMatch(/address/);
        expect(addressProblem('Open Days', [])).toMatch(/lower-case/);
        expect(addressProblem('assets', [])).toMatch(/kept/);
        expect(addressProblem('about', ['about'])).toMatch(/already/);
        expect(addressProblem('-x', [])).not.toBeNull();
    });

    it('names an added section so it can never read as a copy the engine made', () => {
        const id = newAddedId();
        expect(id).toMatch(/^add-[a-z0-9]{8}$/);
        expect(newAddedId(() => 0)).toBe('add-00000000');
    });

    it('saves additions as the host reads them, and takes one out again', () => {
        expect(JSON.parse(addedWith({ 'add-a': 'about.team' }, 'add-b', 'visit.book'))).toEqual({ added: { 'add-a': 'about.team', 'add-b': 'visit.book' } });
        expect(JSON.parse(addedWith({ 'add-a': 'about.team' }, 'add-a', null))).toEqual({ added: {} });
        expect(JSON.parse(addedWith(undefined, 'add-a', 'x.y'))).toEqual({ added: { 'add-a': 'x.y' } });
    });

    it('places a section below the one it was added from, or last', () => {
        expect(orderWith(['s-intro', 's-team', 's-faq'], 's-add-a', 's-intro')).toEqual(['s-intro', 's-add-a', 's-team', 's-faq']);
        expect(orderWith(['s-intro', 's-team'], 's-add-a')).toEqual(['s-intro', 's-team', 's-add-a']);
        expect(orderWith(['s-intro'], 's-add-a', 's-gone')).toEqual(['s-intro', 's-add-a']);
    });

    it('groups the library under the page each section comes from, and finds by any word', () => {
        const library = [
            { from: 'about.team', label: 'Leadership team', page: 'About' },
            { from: 'fees.table', label: 'Fees for 2026', page: 'Fees' },
            { from: 'about.hist', label: 'Our history', page: 'About' },
        ];
        expect(grouped(library).map((g) => [g.page, g.sections.length])).toEqual([['About', 2], ['Fees', 1]]);
        expect(grouped(library, 'team').flatMap((g) => g.sections.map((s) => s.from))).toEqual(['about.team']);
        expect(grouped(library, 'about history')).toHaveLength(1);
        expect(grouped(library, 'nothing')).toEqual([]);
    });
});

describe('the Pages tab', () => {
    const config = {
        page: 'about',
        pagesKey: 'structure:pages',
        made: [{ id: 'open-days', title: 'Open days' }],
        editorBase: '/sites/trial/edit/',
        taken: ['', 'about', 'open-days'],
        pages: [
            { id: '', title: 'Home', href: '/sites/trial/edit/' },
            { id: 'about', title: 'About', href: '/sites/trial/edit/about' },
            { id: 'open-days', title: 'Open days', href: '/sites/trial/edit/open-days', made: true },
        ],
        library: [
            { from: 'about.team', label: 'Leadership team', page: 'About' },
            { from: 'visit.book', label: 'Book a visit', page: 'Visit' },
        ],
    };

    it('lists the pages, marks this one and the owner\'s, and makes a page from chosen sections', async () => {
        const container = document.createElement('div');
        const saved = [];
        let went = null;
        renderPagesPanel({ container, config, save: async (key, value) => saved.push([key, value]), go: (href) => (went = href), notify: () => {} });

        const rows = [...container.querySelectorAll('.le-sitemap-row')].map((row) => row.textContent);
        expect(rows).toEqual(['Home/', 'About/aboutThis page', 'Open days/open-daysYours']);

        const create = container.querySelector('.le-create-page');
        expect(create.disabled).toBe(true);

        const [title, address] = container.querySelectorAll('input.le-input:not(.le-library-search)');
        title.value = 'Admissions events';
        title.dispatchEvent(new Event('input'));
        expect(address.value).toBe('admissions-events');
        expect(create.disabled).toBe(true); // no section chosen yet

        container.querySelector('.le-library-item').click();
        expect(create.disabled).toBe(false);

        create.click();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(saved[0][0]).toBe('structure:page:admissions-events');
        expect(Object.values(JSON.parse(saved[0][1]).added)).toEqual(['about.team']);
        expect(saved[1]).toEqual(['structure:pages', JSON.stringify([{ id: 'open-days', title: 'Open days' }, { id: 'admissions-events', title: 'Admissions events' }])]);
        expect(went).toBe('/sites/trial/edit/admissions-events');
    });

    it('will not take an address a page already has', () => {
        const container = document.createElement('div');
        renderPagesPanel({ container, config, save: async () => {}, go: () => {}, notify: () => {} });
        const [title, address] = container.querySelectorAll('input.le-input:not(.le-library-search)');
        title.value = 'About';
        title.dispatchEvent(new Event('input'));
        container.querySelector('.le-library-item').click();

        expect(address.value).toBe('about');
        expect(container.querySelector('.le-create-page').disabled).toBe(true);
        expect(container.textContent).toContain('A page already has that address.');
    });
});
