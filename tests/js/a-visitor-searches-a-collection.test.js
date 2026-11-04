import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * The visitor's side (resources/js/kit-search.js, built to resources/dist/kit-search.js), on the host's own
 * markup (tests/support/search-component.json, written by the website's TheSearchComponent): a part found by
 * its number with or without dashes, filters from the data's shape, one switched off by the owner, a record's
 * own page, a quote request carried into the form, and a search that found nothing told once.
 */
window.__kitSearchTest = true;
const { mount, carry } = await import('../../resources/js/kit-search.js');
const COMPONENT = JSON.parse(readFileSync(join(process.cwd(), 'tests/support/search-component.json'), 'utf8'));

const records = [
    { id: 'r1', part_number: '2-1586-3', name: 'Main wheel brake assembly', aircraft: 'B737-800', condition: 'SV', quantity: 2, certificate: true },
    { id: 'r2', part_number: '3214552-4', name: 'Starter generator', aircraft: 'ATR 72', condition: 'OH', quantity: 1, certificate: true },
    { id: 'r3', part_number: '2-1586-30', name: 'Brake wear pin', aircraft: 'B737-800', condition: 'NE', quantity: 40, certificate: false },
    { id: 'r4', part_number: '066-50008-0101', name: 'Weather radar receiver', aircraft: 'Dash 8', condition: 'OH', quantity: 3, certificate: false },
];
const data = { ...COMPONENT.collection, records };

const page = (filters = null) => {
    document.body.className = '';
    document.body.innerHTML = COMPONENT.markup.replace('__INSTANCE__', 'parts.add-k3x9q');
    const section = document.querySelector('[data-search]');
    if (filters !== null) section.querySelector('[data-search-settings]').setAttribute('data-search-filters', filters);
    return section;
};
const hits = (section) => [...section.querySelectorAll('[data-search-hit]')].map((li) => li.getAttribute('data-search-hit'));
const type = (section, words) => {
    const input = section.querySelector('input[type="search"]');
    input.value = words;
    input.dispatchEvent(new Event('input'));
};

beforeEach(() => { window.history.replaceState(null, '', '/parts/'); });

describe('a visitor searches the parts', () => {
    it('every part shows at first, with the count in the owner\'s words', () => {
        const section = page();
        mount(section, data);
        expect(hits(section)).toEqual(['r1', 'r2', 'r3', 'r4']);
        expect(section.querySelector('[data-search-number]').textContent).toBe('4');
        expect(section.querySelector('[data-search-count]').classList.contains('is-many')).toBe(true);
        expect(section.querySelector('input[type="search"]').placeholder).toBe('2-1586-3');
    });

    it('a part number is found with and without its dashes, the exact one first', () => {
        const section = page();
        mount(section, data);
        type(section, '2-1586-3');
        expect(hits(section)).toEqual(['r1', 'r3']);
        type(section, '215863');
        expect(hits(section)[0]).toBe('r1');
        type(section, '2 1586 3');
        expect(hits(section)[0]).toBe('r1');
        expect(window.location.search).toBe('?q=2+1586+3');
    });

    it('filters come from the data: chips for a condition, a toggle for a certificate', () => {
        const section = page();
        mount(section, data);
        const legends = [...section.querySelectorAll('.kit-search__filter legend, .kit-search__filter > span')].map((n) => n.textContent);
        expect(legends).toEqual(['Aircraft type', 'Condition', 'Quantity', 'Only with certificate', 'Sort by']);
        const oh = [...section.querySelectorAll('.kit-search__chip')].find((chip) => chip.textContent === 'OH');
        oh.click();
        expect(hits(section)).toEqual(['r2', 'r4']);
        const only = section.querySelector('.kit-search__toggle input');
        only.checked = true;
        only.dispatchEvent(new Event('change'));
        expect(hits(section)).toEqual(['r2']);
        expect(section.querySelector('.kit-search__toggle').textContent).toBe('Only with certificate');
    });

    it('a filter the owner switched off is not offered, and switching it in the editor redraws at once', async () => {
        const section = page('condition');
        mount(section, data);
        expect(section.querySelectorAll('.kit-search__filter legend').length).toBe(1);
        expect(section.querySelector('.kit-search__filter legend').textContent).toBe('Condition');
        section.querySelector('[data-search-settings]').setAttribute('data-search-filters', 'aircraft condition');
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect([...section.querySelectorAll('.kit-search__filter legend')].map((n) => n.textContent)).toEqual(['Aircraft type', 'Condition']);
    });

    it('results can be rows', () => {
        const section = page();
        section.querySelector('[data-search-settings]').setAttribute('data-search-layout', 'rows');
        mount(section, data);
        expect(section.getAttribute('data-layout')).toBe('rows');
    });

    it('a record opens its own page, and Back returns to the search', () => {
        const section = page();
        mount(section, data);
        type(section, 'radar');
        section.querySelector('[data-search-hit="r4"] .kit-search__details').click();
        expect(window.location.search).toBe('?record=r4');
        const record = section.querySelector('[data-search-record]');
        expect(record.hidden).toBe(false);
        expect(record.querySelector('h3').textContent).toBe('Weather radar receiver');
        expect(record.querySelector('.kit-search__all').textContent).toContain('Part number066-50008-0101');
        expect(section.querySelector('[data-search-results]').hidden).toBe(true);
        expect(section.querySelector('form').hidden).toBe(true);
    });

    it('opened at a record\'s address, the record is shown straight away', () => {
        window.history.replaceState(null, '', '/parts/?record=r2');
        const section = page();
        mount(section, data);
        expect(section.querySelector('[data-search-record] h3').textContent).toBe('Starter generator');
    });

    it('Request a quote carries the part to the quote form', () => {
        const section = page();
        mount(section, data);
        const ask = section.querySelector('[data-search-hit="r1"] .kit-search__quote');
        const url = new URL(ask.href);
        expect(url.pathname).toBe('/edit/contact');
        expect(url.searchParams.get('from')).toBe('search');
        expect(url.searchParams.get('record')).toBe('r1');
        expect(url.searchParams.get('about')).toBe('2-1586-3, Main wheel brake assembly, Aircraft type: B737-800, Condition: SV');
    });

    it('nothing found says so in the owner\'s words, and is told to the owner once', async () => {
        vi.useFakeTimers();
        const sent = [];
        const section = page();
        mount(section, data, { send: (url, body) => sent.push([url, JSON.parse(body)]) });
        type(section, 'zzqx');
        type(section, 'zzqx-nonsense');
        expect(hits(section)).toEqual([]);
        expect(section.querySelector('[data-search-empty]').hidden).toBe(false);
        expect(section.querySelector('[data-search-empty]').textContent).toContain('Nothing found');
        vi.advanceTimersByTime(1600);
        type(section, 'zzqx-nonsense ');
        vi.advanceTimersByTime(1600);
        expect(sent).toEqual([['/search/missed/abc', { collection: 'parts', query: 'zzqx-nonsense', filters: {} }]]);
        vi.useRealTimers();
    });

    it('in the editor, nothing is told and the words of nothing found stay to be edited', () => {
        vi.useFakeTimers();
        const sent = [];
        const section = page();
        document.body.classList.add('editing');
        mount(section, data, { send: (url, body) => sent.push(url) });
        type(section, 'zzqx-nonsense');
        vi.advanceTimersByTime(2000);
        expect(sent).toEqual([]);
        expect(section.querySelector('[data-search-empty]').hidden).toBe(false);
        vi.useRealTimers();
    });
});

describe('the quote form, on its own page', () => {
    it('is filled with the part asked about, and keeps its id', () => {
        window.history.replaceState(null, '', '/contact/?from=search&record=r1&about=2-1586-3%2C%20Main%20wheel%20brake%20assembly');
        document.body.innerHTML = '<section data-component="form.newsletter"><form><input type="text" name="email"></form></section>'
            + '<section data-component="form.booking-request"><form><input name="name" type="text"><textarea name="message"></textarea></form></section>';
        expect(carry(document, window)).toBe(true);
        const form = document.querySelector('[data-component="form.booking-request"] form');
        expect(form.querySelector('textarea').value).toBe('Request a quote for: 2-1586-3, Main wheel brake assembly');
        expect(form.querySelector('input[name="search_record"]').value).toBe('r1');
    });

    it('fills a template\'s own part box as it is, and leaves what the visitor typed', () => {
        window.history.replaceState(null, '', '/contact/?from=search&record=r1&about=2-1586-3');
        document.body.innerHTML = '<section data-component="form.rfq"><form><textarea data-carry-pn name="ow_details"></textarea><input type="hidden" data-carried-field name="ow_carried"></form></section>';
        carry(document, window);
        expect(document.querySelector('[data-carry-pn]').value).toBe('2-1586-3');
        expect(document.querySelector('[data-carried-field]').value).toBe('2-1586-3');
    });

    it('does nothing for any other visit', () => {
        window.history.replaceState(null, '', '/contact/');
        document.body.innerHTML = '<form><textarea name="message"></textarea></form>';
        expect(carry(document, window)).toBe(false);
    });
});

describe('the owner\'s words, changed in the editor', () => {
    it('a word the results use is changed on every card at once', async () => {
        window.history.replaceState(null, '', '/parts/');
        const section = page();
        mount(section, data);
        section.querySelector('[data-search-word="quote"]').textContent = 'Request a quote for this part';
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect([...section.querySelectorAll('.kit-search__quote')].map((a) => a.textContent)).toEqual(Array(4).fill('Request a quote for this part'));
    });
});

describe('the design\'s own buttons, and what the request is for', () => {
    it('a search\'s buttons take the design\'s own button classes, and a card\'s two buttons stack', () => {
        window.history.replaceState(null, '', '/parts/');
        const section = page();
        section.setAttribute('data-search-buttons', JSON.stringify({ primary: 'btn btn--ink', secondary: 'btn btn--line' }));
        mount(section, data);
        const card = section.querySelector('[data-search-hit="r1"]');
        expect([...card.querySelector('.kit-search__quote').classList]).toEqual(['kit-search__quote', 'btn', 'btn--ink']);
        expect([...card.querySelector('.kit-search__details').classList]).toEqual(['kit-search__details', 'btn', 'btn--line']);
        expect(section.querySelector('.kit-search__go').classList.contains('btn--ink')).toBe(true);
    });

    it('a class that is not a class name is never added', () => {
        const section = page();
        section.setAttribute('data-search-buttons', JSON.stringify({ primary: 'btn "><script>', secondary: '' }));
        mount(section, data);
        expect([...section.querySelector('.kit-search__quote').classList]).toEqual(['kit-search__quote', 'btn']);
    });

    it('the form\'s purpose is chosen when one option plainly means buying', () => {
        window.history.replaceState(null, '', '/contact/?from=search&record=r1&about=2-1586-3');
        document.body.innerHTML = '<section data-component="form.rfq"><form><select name="ow_intent"><option value="">Choose one</option><option>Buy aircraft spare parts</option><option>Sell aircraft spare parts</option><option>Report an AOG</option></select><textarea name="details"></textarea></form></section>';
        carry(document, window);
        expect(document.querySelector('select').value).toBe('Buy aircraft spare parts');
    });

    it('two options that could be it, or none, are left for the visitor', () => {
        window.history.replaceState(null, '', '/contact/?from=search&record=r1&about=2-1586-3');
        document.body.innerHTML = '<section data-component="form.quote"><form><select name="a"><option value="">Choose</option><option>Buy new</option><option>Buy used</option></select><select name="b"><option value="">Vehicle</option><option>Saloon</option><option>SUV</option></select><textarea name="m"></textarea></form></section>';
        carry(document, window);
        expect([...document.querySelectorAll('select')].map((s) => s.value)).toEqual(['', '']);
    });

    it('a template\'s own default for a record wins', () => {
        window.history.replaceState(null, '', '/contact/?from=search&record=r1&about=2-1586-3');
        document.body.innerHTML = '<section data-component="form.quote"><form><select name="a"><option value="">Choose</option><option>Buy new</option><option data-search-purpose>Buy used</option></select><textarea name="m"></textarea></form></section>';
        carry(document, window);
        expect(document.querySelector('select').value).toBe('Buy used');
    });
});
