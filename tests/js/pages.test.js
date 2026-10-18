// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { addedWith, addressProblem, describeStructure, grouped, newAddedId, orderWith, previewDoc, renderLibrary, renderPagesPanel, sectionMarkup, slugFor, withMenu } from '../../resources/js/pages.js';

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
        made: [{ id: 'open-days', title: 'Open days', menu: false }],
        editorBase: '/sites/trial/edit/',
        taken: ['', 'about', 'open-days'],
        pages: [
            { id: '', title: 'Home', href: '/sites/trial/edit/' },
            { id: 'about', title: 'About', href: '/sites/trial/edit/about' },
            { id: 'open-days', title: 'Open days', href: '/sites/trial/edit/open-days', made: true },
        ],
        library: [
            { from: 'about.team', label: 'Leadership team', page: 'About', at: '/sites/trial/edit/about' },
            { from: 'visit.book', label: 'Book a visit', page: 'Visit', at: '/sites/trial/edit/visit' },
        ],
    };

    it('lists the pages, marks this one and the owner\'s, and makes a page from chosen sections', async () => {
        const container = document.createElement('div');
        const saved = [];
        let went = null;
        renderPagesPanel({ container, config, save: async (key, value) => saved.push([key, value]), go: (href) => (went = href), notify: () => {} });

        const rows = [...container.querySelectorAll('.le-sitemap-open')].map((row) => row.textContent);
        expect(rows).toEqual(['Home/', 'About/aboutThis page', 'Open days/open-daysYours']);
        // only the owner's own page can go in or out of the menu
        expect([...container.querySelectorAll('.le-sitemap-menu')].map((b) => b.textContent)).toEqual(['Add to menu']);

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
        expect(saved[1]).toEqual(['structure:pages', JSON.stringify([{ id: 'open-days', title: 'Open days', menu: false }, { id: 'admissions-events', title: 'Admissions events', menu: true }])]);
        expect(went).toBe('/sites/trial/edit/admissions-events');
    });

    it('puts a page the owner made in the menu with one press', async () => {
        const container = document.createElement('div');
        const saved = [];
        renderPagesPanel({ container, config, save: async (key, value) => saved.push([key, value]), go: () => {}, notify: () => {} });

        container.querySelector('.le-sitemap-menu').click();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(saved).toEqual([['structure:pages', JSON.stringify([{ id: 'open-days', title: 'Open days', menu: true }])]]);
        expect(withMenu([{ id: 'a', title: 'A', menu: true }], 'a', false)).toEqual([{ id: 'a', title: 'A', menu: false }]);
    });

    it('shows a section before it is chosen, and pressing See it does not choose it', async () => {
        const container = document.createElement('div');
        const asked = [];
        const fetchPage = async (href) => {
            asked.push(href);

            return '<html><body><section data-instance="about.team"><h2>Leadership team</h2></section>'
                + '<section data-instance="about.other">Not this one</section></body></html>';
        };
        renderLibrary({ container, library: config.library, pick: () => {}, multiple: true, fetchPage });

        container.querySelector('.le-library-see').click();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const frame = container.querySelector('.le-library-frame');
        expect(asked).toEqual(['/sites/trial/edit/about']);
        expect(frame.getAttribute('sandbox')).toBe('');
        expect(frame.srcdoc).toContain('<h2>Leadership team</h2>');
        expect(frame.srcdoc).not.toContain('Not this one');
        // Looking is not choosing: the row is still unpressed.
        expect(container.querySelector('.le-library-item').getAttribute('aria-pressed')).toBe('false');

        container.querySelector('.le-library-see').click();
        expect(container.querySelector('.le-library-frame')).toBeNull();
    });

    it('cuts the right section out, and says so when it cannot', () => {
        const html = '<body><section data-instance="a.one">One</section><section data-instance="a.two">Two</section></body>';
        expect(sectionMarkup(html, 'a.two')).toContain('Two');
        expect(sectionMarkup(html, 'a.two')).not.toContain('One');
        expect(sectionMarkup(html, 'a.missing')).toBeNull();
    });

    it('builds a preview that wears the site stylesheets and runs nothing', () => {
        const doc = previewDoc({ styles: ['/assets/css/site.css'], markup: '<section>Hello</section>' });
        expect(doc).toContain('<link rel="stylesheet" href="/assets/css/site.css">');
        expect(doc).toContain('<section>Hello</section>');
        expect(doc).not.toContain('<script');
    });

    it('says what was arranged in the owner words, never the stored json', () => {
        const said = describeStructure(
            'structure:page:open-days',
            JSON.stringify({ added: {} }),
            JSON.stringify({ added: { 'add-mqnnlyvb': 'about.team' } }),
            config,
        );

        expect(said.label).toBe('Sections on Open days');
        expect(said.after).toBe('Added Leadership team');
        expect(said.after).not.toContain('add-mqnnlyvb');
        expect(said.after).not.toContain('about.team');

        const removed = describeStructure(
            'structure:page:open-days',
            JSON.stringify({ added: { 'add-1': 'about.team', 'add-2': 'visit.book' } }),
            JSON.stringify({ added: { 'add-1': 'about.team' } }),
            config,
        );
        expect(removed.after).toBe('Removed Book a visit');

        const made = describeStructure('structure:pages', '[]', JSON.stringify([{ id: 'open-days', title: 'Open days' }]), config);
        expect(made.label).toBe('Pages');
        expect(made.after).toBe('Added the page Open days');

        // The value already read for us, rather than JSON text, says the same thing.
        expect(describeStructure('structure:page:open-days', null, { added: { 'add-1': 'about.team' } }, config).after).toBe('Added Leadership team');
        expect(describeStructure('structure:pages', null, [{ id: 'open-days', title: 'Open days' }], config).after).toBe('Added the page Open days');

        // Anything else is still described the way it always was.
        expect(describeStructure('tpl:abc', 'a', 'b', config)).toBeNull();
        // Unreadable stored value: a row that says something beats a row that throws.
        expect(describeStructure('structure:page:open-days', 'not json', 'not json', config).after).toBe('No sections added');
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
