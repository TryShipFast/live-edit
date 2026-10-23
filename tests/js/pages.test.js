// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { addedWith, addressProblem, describeStructure, grouped, newAddedId, orderWith, previewDoc, renderLibrary, renderNewPage, renderSectionBrowser, sectionMarkup, slugFor, startingPoints, whyNotYet, withMenu } from '../../resources/js/pages.js';

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

    // The editor's window, as chrome.js hands it over.
    const fakeModal = () => {
        const card = document.createElement('div');
        const body = document.createElement('div');
        const foot = document.createElement('div');
        card.append(body, foot);
        const said = {};

        return { card, body, foot, title: (t) => (said.title = t), subtitle: (t) => (said.subtitle = t), allowDismiss: () => {}, close: () => {}, said };
    };
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    const starting = {
        ...config,
        library: [
            ...config.library,
            { from: 'contact.form', label: 'Contact form', page: 'Contact', at: '/sites/trial/edit/contact' },
            { from: 'p1.detail', label: 'Product detail', page: 'Aster Veil', at: '/sites/trial/edit/p1' },
        ],
        starts: [
            { id: 'about', title: 'About', sections: ['about.team'] },
            { id: 'contact', title: 'Contact', sections: ['contact.form', 'visit.book'] },
            { id: 'p1', title: 'Aster Veil', sections: ['p1.detail'] },
            { id: 'p2', title: 'Cedar Letter', sections: ['p1.detail'] },
            { id: 'p3', title: 'Fig Archive', sections: ['p1.detail'] },
        ],
    };

    it('offers the kinds of page the design has, one card for pages made alike', () => {
        const kinds = startingPoints(starting);
        expect(kinds.map((k) => k.title)).toEqual(['About', 'Contact', 'Aster Veil']);
        expect(kinds[2].alike).toBe(2);
        expect(kinds[0].at).toBe('/sites/trial/edit/about');
        // No starts from the host: the library grouped by its page is the same idea.
        expect(startingPoints({ library: config.library }).map((k) => k.title)).toEqual(['About', 'Visit']);
    });

    it('makes a page in two steps: a kind of page, then a title', async () => {
        const ui = fakeModal();
        const saved = [];
        let went = null;
        renderNewPage({ ui, config: starting, save: async (key, value) => saved.push([key, value]), go: (href) => (went = href), notify: () => {} });

        expect(ui.said.title).toBe('New page');
        const cards = [...ui.body.querySelectorAll('.le-start')];
        expect(cards).toHaveLength(3);
        expect(cards[2].textContent).toContain('Aster Veil, and 2 like it');
        cards[1].click();

        expect(ui.said.title).toBe('Name your page');
        expect(ui.said.subtitle).toContain('Contact');
        const create = ui.foot.querySelector('.le-create-page');
        expect(create.disabled).toBe(true);
        expect(ui.foot.textContent).toMatch(/title/i);

        // The address follows the title and is said as a line, not asked for.
        const title = ui.body.querySelector('.le-name-title');
        title.value = 'Visit the studio';
        title.dispatchEvent(new Event('input'));
        expect(ui.body.textContent).toContain('/visit-the-studio');
        expect(create.disabled).toBe(false);

        // A near miss is one click: leave a section out.
        expect(ui.body.querySelectorAll('.le-chip')).toHaveLength(2);
        ui.body.querySelector('.le-chip-x').click();
        expect(ui.body.querySelectorAll('.le-chip')).toHaveLength(1);

        create.click();
        await tick();
        expect(saved[0][0]).toBe('structure:page:visit-the-studio');
        expect(Object.values(JSON.parse(saved[0][1]).added)).toEqual(['visit.book']);
        expect(saved[1]).toEqual(['structure:pages', JSON.stringify([{ id: 'open-days', title: 'Open days', menu: false }, { id: 'visit-the-studio', title: 'Visit the studio', menu: true }])]);
        expect(went).toBe('/sites/trial/edit/visit-the-studio');
    });

    it('will not take an address a page already has, and says so where the address is', () => {
        const ui = fakeModal();
        renderNewPage({ ui, config: starting, save: async () => {}, go: () => {}, notify: () => {} });
        ui.body.querySelector('.le-start').click();
        const title = ui.body.querySelector('.le-name-title');
        title.value = 'About';
        title.dispatchEvent(new Event('input'));

        expect(ui.foot.querySelector('.le-create-page').disabled).toBe(true);
        expect(ui.body.textContent).toContain('A page already has that address.');
        // The address field opens by itself so it can be changed.
        expect(ui.body.querySelector('.le-address').hidden).toBe(false);
    });

    it('lets somebody choose the sections themselves, seen at full size first', async () => {
        const ui = fakeModal();
        renderNewPage({ ui, config: starting, save: async () => {}, go: () => {}, notify: () => {} });
        [...ui.body.querySelectorAll('button')].find((b) => /yourself/.test(b.textContent)).click();

        expect(ui.said.title).toBe('Choose its sections');
        const next = [...ui.foot.querySelectorAll('button')].find((b) => b.textContent === 'Next');
        expect(next.disabled).toBe(true);
        [...ui.body.querySelectorAll('.le-library-item')].find((r) => /Contact form/.test(r.textContent)).click();
        ui.body.querySelector('.le-browser-add').click();
        expect(next.disabled).toBe(false);
        expect(ui.foot.textContent).toContain('1 chosen');
        next.click();
        expect(ui.said.title).toBe('Name your page');
        expect(ui.body.querySelectorAll('.le-chip')).toHaveLength(1);
    });

    it('shows the section being pointed at, and adds it from under the picture', async () => {
        const container = document.createElement('div');
        const added = [];
        renderSectionBrowser({ container, library: config.library, add: (section) => added.push(section.from), fetchPage: async () => '<section data-instance="visit.book"><h2>Book a visit</h2></section>' });
        const rows = [...container.querySelectorAll('.le-library-item')];
        rows[1].dispatchEvent(new Event('mouseenter'));
        await tick();
        expect(container.querySelector('.le-browser-name').textContent).toBe('Book a visit');
        expect(container.querySelector('.le-browser-from').textContent).toContain('Visit');
        expect(container.querySelector('.le-browser-frame').srcdoc).toContain('<h2>Book a visit</h2>');
        // Looking is not adding.
        expect(added).toEqual([]);
        container.querySelector('.le-browser-add').click();
        expect(added).toEqual(['visit.book']);
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

    it('says what is still missing rather than leaving a dead button', () => {
        expect(whyNotYet({})).toMatch(/title/i);
        expect(whyNotYet({ title: 'Open days', address: 'open-days' })).toMatch(/at least one section/i);
        expect(whyNotYet({ title: 'About', address: 'about', chosen: ['x'], taken: ['about'] })).toMatch(/already has that address/i);
        expect(whyNotYet({ title: 'Open days', address: 'open-days', chosen: ['x'] })).toBeNull();
    });
});

describe('a card and its page', () => {
    it('finds the page a card opens, the longest id first', async () => {
        const { pageOfLink } = await import('../../resources/js/pages.js');
        const pages = [{ id: '' }, { id: 'arc' }, { id: 'products/arc' }, { id: 'journal/battery-life' }];
        expect(pageOfLink('../products/arc/', pages, 'http://x.test/shop/').id).toBe('products/arc');
        expect(pageOfLink('../../journal/battery-life/index.html', pages, 'http://x.test/a/b/').id).toBe('journal/battery-life');
        expect(pageOfLink('https://elsewhere.test/', pages, 'http://x.test/')).toBeNull();
        const a = document.createElement('a'); a.setAttribute('href', '../products/arc/'); a.dataset.linkPage = 'arc';
        expect(pageOfLink(a, [{ id: 'product-arc' }, { id: 'arc' }], 'http://x.test/shop/').id).toBe('arc');
        a.dataset.linkPage = 'product-arc';
        expect(pageOfLink(a, [{ id: 'product-arc' }], 'http://x.test/shop/').id).toBe('product-arc');
        a.setAttribute('href', '../fig-archive/');
        expect(pageOfLink(a, [{ id: 'product-arc' }, { id: 'fig-archive' }], 'http://x.test/shop/').id).toBe('fig-archive');
    });
    it('names a free address and points the link at it', async () => {
        const { freeAddress, hrefTo } = await import('../../resources/js/pages.js');
        expect(freeAddress('Fig Archive', ['fig-archive'])).toBe('fig-archive-2');
        expect(hrefTo('../products/arc/', 'fig-archive')).toBe('../fig-archive/');
        expect(hrefTo('products/arc/', 'fig-archive')).toBe('fig-archive/');
    });
    it('makes a page like another, out of the menu', async () => {
        const { makePageLike } = await import('../../resources/js/pages.js');
        const saved = [];
        const id = await makePageLike({ config: { pagesKey: 'structure:pages', made: [], taken: [] }, save: async (k, v) => saved.push([k, v]), sections: ['product.detail', 'product.details'], title: 'Fig Archive' });
        expect(id).toBe('fig-archive');
        expect(Object.values(JSON.parse(saved[0][1]).added)).toEqual(['product.detail', 'product.details']);
        expect(JSON.parse(saved[1][1])).toEqual([{ id: 'fig-archive', title: 'Fig Archive', menu: false }]);
    });
});
