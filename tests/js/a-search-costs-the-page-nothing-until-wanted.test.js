import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * A search adds no Lighthouse issue to a published page (the website's owner, 5 Nov 2026: "i hope all the charts
 * and others plugin won't added to lighthouse issues, so it should be optimized from get go"). Its index is read
 * only when the search is near the screen or reached for, a big catalogue arrives in parts read one task at a time,
 * its look is in the page's head (the script carries none), and the quote form's page gets carry() on its own.
 */
window.__kitSearchTest = true;
const { boot, loadIndex, mount, recordsOf, whenWanted } = await import('../../resources/js/kit-search.js');
const { BASE } = await import('../../resources/js/kit-search-base.js');
const COMPONENT = JSON.parse(readFileSync(join(process.cwd(), 'tests/support/search-component.json'), 'utf8'));

const page = () => {
    document.head.innerHTML = '';
    document.body.className = '';
    document.body.innerHTML = COMPONENT.markup.replace('__INSTANCE__', 'parts.add-k3x9q');
    return document.querySelector('[data-search]');
};
const json = (body) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

/** An IntersectionObserver the test moves: `near()` brings every watched section near the screen. */
const observer = () => {
    const watched = [];
    class Watcher {
        constructor(callback, options) { this.callback = callback; this.options = options; watched.push(this); }
        observe(el) { this.el = el; }
        disconnect() { this.gone = true; }
    }
    return { Watcher, watched, near: () => watched.filter((w) => !w.gone).forEach((w) => w.callback([{ isIntersecting: true, target: w.el }])) };
};
const winWith = (extra = {}) => ({ location: window.location, history: window.history, setTimeout, clearTimeout, MutationObserver, addEventListener() {}, document, ...extra });

beforeEach(() => { window.history.replaceState(null, '', '/parts/'); });

describe('the index is read when the search is wanted, not before', () => {
    it('far below the screen nothing is fetched; near it, the index is read once', () => {
        const section = page();
        const { Watcher, watched, near } = observer();
        const go = vi.fn();
        whenWanted(section, go, { win: winWith({ IntersectionObserver: Watcher }) });
        expect(go).not.toHaveBeenCalled();
        expect(watched[0].options.rootMargin).toBe('150% 0px');
        near();
        near();
        expect(go).toHaveBeenCalledTimes(1);
    });

    it('a visitor reaching for the box reads it at once', () => {
        const section = page();
        const { Watcher } = observer();
        const go = vi.fn();
        whenWanted(section, go, { win: winWith({ IntersectionObserver: Watcher }) });
        section.querySelector('input[type="search"]').dispatchEvent(new Event('focusin', { bubbles: true }));
        expect(go).toHaveBeenCalledTimes(1);
    });

    it('an address that asks for a record or a search reads it straight away', () => {
        window.history.replaceState(null, '', '/parts/?record=r2');
        const go = vi.fn();
        whenWanted(page(), go, { win: winWith({ IntersectionObserver: observer().Watcher }) });
        expect(go).toHaveBeenCalledTimes(1);
    });

    it('words typed while the index was on its way are the search when it comes', () => {
        const section = page();
        section.querySelector('input[type="search"]').value = 'radar';
        mount(section, { ...COMPONENT.collection, records: [
            { id: 'r1', part_number: '2-1586-3', name: 'Main wheel brake assembly' },
            { id: 'r4', part_number: '066-50008-0101', name: 'Weather radar receiver' },
        ] });
        expect([...section.querySelectorAll('[data-search-hit]')].map((li) => li.getAttribute('data-search-hit'))).toEqual(['r4']);
    });
});

describe('a big catalogue arrives in parts, half the bytes of objects', () => {
    it('columns and rows read as records, with nothing for a blank', () => {
        expect(recordsOf({ keys: ['id', 'name', 'price'], rows: [['r1', 'Pump', null], ['r2', 'Valve', 12]] }))
            .toEqual([{ id: 'r1', name: 'Pump' }, { id: 'r2', name: 'Valve', price: 12 }]);
        expect(recordsOf({ records: [{ id: 'r1' }] })).toEqual([{ id: 'r1' }]);
        expect(recordsOf({})).toEqual([]);
    });

    it('every part is fetched beside the first and read in order, each in a task of its own', async () => {
        const asked = [];
        const fetch = vi.fn((url) => {
            asked.push(url);
            if (url.endsWith('parts.json?v=aaaaaaaaaa')) return json({ v: 2, id: 'parts', keys: ['id', 'name'], rows: [['r1', 'One']], parts: ['parts-2.json?v=bbbbbbbbbb', 'parts-3.json?v=cccccccccc'] });
            if (url.includes('parts-2')) return json({ rows: [['r2', 'Two']] });
            return json({ rows: [['r3', 'Three']] });
        });
        const yields = vi.fn(() => Promise.resolve());
        const index = await loadIndex('../assets/kit/search/parts.json?v=aaaaaaaaaa', { win: { fetch, scheduler: { yield: yields }, setTimeout }, base: 'https://site.example/services/' });
        expect(asked[0]).toBe('../assets/kit/search/parts.json?v=aaaaaaaaaa');
        expect(asked.slice(1)).toEqual(['https://site.example/assets/kit/search/parts-2.json?v=bbbbbbbbbb', 'https://site.example/assets/kit/search/parts-3.json?v=cccccccccc']);
        expect(index.records.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
        expect(index).not.toHaveProperty('rows');
        expect(index).not.toHaveProperty('parts');
        expect(yields).toHaveBeenCalledTimes(2);
    });
});

describe('its look is in the page, not in the script', () => {
    it('a page published with the look gets nothing more; one without gets the stylesheet beside the script', () => {
        page();
        const style = document.createElement('style');
        style.setAttribute('data-kit-search-base', '');
        document.head.append(style);
        boot(document, winWith({ IntersectionObserver: observer().Watcher, fetch: vi.fn() }), 'https://site.example/assets/kit/kit-search.js?v=1234567890');
        expect(document.querySelectorAll('[data-kit-search-base]').length).toBe(1);

        page();
        boot(document, winWith({ IntersectionObserver: observer().Watcher, fetch: vi.fn() }), 'https://site.example/assets/kit/kit-search.js?v=1234567890');
        expect(document.querySelector('link[data-kit-search-base]').getAttribute('href')).toBe('https://site.example/assets/kit/kit-search.css');
    });

    it('the built script carries no CSS, and the carry script is small and alone', () => {
        const built = readFileSync(join(process.cwd(), 'resources/dist/kit-search.js'), 'utf8');
        expect(built).not.toContain('.kit-search__chip{');
        const carry = readFileSync(join(process.cwd(), 'resources/dist/kit-carry.js'), 'utf8');
        expect(carry.length).toBeLessThan(3000);
        expect(carry).not.toContain('kit-search__results');
        expect(readFileSync(join(process.cwd(), 'resources/dist/kit-search.css'), 'utf8').trim()).toBe(BASE);
    });

    it('a filter\'s name sits 6px above its control, filters wrap rather than squeeze, every control 44px', () => {
        expect(BASE).toContain('.kit-search .kit-search__filter>span:first-child,.kit-search .kit-search__filter>legend{display:block;float:none;width:auto;margin:0 0 6px');
        expect(BASE).toContain('.kit-search .kit-search__filter{display:block;flex:0 0 auto;');
        expect(BASE).not.toMatch(/min-height:40px/);
        expect(BASE).toContain('.kit-search .kit-search__filters.is-open>.kit-search__filter{width:100%}');
        expect(BASE).toContain(':where(.kit-search:not([data-search-ready]):not([data-search-failed]) .kit-search__results){min-height:');
    });
});
