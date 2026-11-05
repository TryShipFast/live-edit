/**
 * Search over a collection, for visitors (resources/dist/kit-search.js, one small file with no dependencies).
 *
 * A host puts it beside a published site (assets/kit/kit-search.js) on a page holding a search section
 * (`[data-search]`), and on the page whose form a record's "Request a quote" leads to. Publishing writes
 * the collection's index beside it (`data-search-index`, a JSON file), so every search runs here, in the
 * visitor's browser, with no server: up to a few thousand records answer each keystroke at once.
 *
 * The section's words are the owner's (data-edit in the host's markup): the title, the lead, the box's
 * label, "Search", the count ("parts found", "part found"), "Nothing found" and its sentence, and the
 * words the results use (View details, Request a quote, Back to the search, All, From, To, Only, Sort by,
 * Show more, Clear). Filters come from the data's shape (collection-search.js), less the ones the owner
 * switched off (`data-search-filters` on the form). Results are cards or rows (`data-search-layout`).
 *
 * A record's own page is the search page's address with ?record=<id>: the section shows that record
 * alone, with its photo, every field and its two ways onward, and the browser's Back returns to the
 * search. A search that found nothing is sent once to the owner's list (`data-search-missed`) after
 * the visitor stops typing; nothing else is sent, and nothing about the visitor.
 *
 * On a form's page, ?from=search&record=<id>&about=<words> fills the form's message with the record
 * ("Request a quote for: 2-1586-3, Main wheel brake assembly, Condition: SV") and keeps its id in a
 * hidden field, so the request names what was asked about.
 */

import { filtersFor, fromParams, prepare, recordId, search, shown, sortsFor, summaryOf, toParams } from './collection-search.js';

const MOST_SHOWN = 24;

import { carry } from './kit-carry.js';

export { carry };

/** The design's own button classes (data-search-buttons, from the host), added to a search's buttons. */
const styled = (node, section, which) => {
    try {
        const classes = JSON.parse(section.getAttribute('data-search-buttons') || 'null')?.[which];
        if (typeof classes === 'string') for (const name of classes.split(/\s+/)) if (/^[A-Za-z][\w-]*$/.test(name)) node.classList.add(name);
    } catch { /* the base look stays */ }

    return node;
};
const said = (section, name, fallback) => (section.querySelector(`[data-search-word="${name}"]`)?.textContent ?? '').trim() || fallback;
const make = (doc, tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

/** The page's address with this search (or record) in its query, keeping anything else it had. */
const addressWith = (win, params) => {
    const url = new URL(win.location.href);
    for (const key of [...url.searchParams.keys()]) url.searchParams.delete(key);
    for (const [key, value] of params) url.searchParams.set(key, value);

    return `${url.pathname}${url.search}${url.hash}`;
};

function quoteHref(section, record, collection) {
    const base = section.getAttribute('data-search-quote');
    if (!base) return null;
    const url = new URL(base, section.ownerDocument.baseURI);
    url.searchParams.set('from', 'search');
    url.searchParams.set('record', recordId(record));
    url.searchParams.set('about', summaryOf(record, collection.fields, collection.title));

    return url.href;
}

/** One search section, drawn and answered. */
export function mount(section, data, { win = window, send = null } = {}) {
    const doc = section.ownerDocument;
    const collection = prepare(data);
    const form = section.querySelector('[data-search-settings]') ?? section.querySelector('form');
    const input = section.querySelector('input[type="search"], .kit-search__input');
    const area = section.querySelector('[data-search-filter-area]');
    const count = section.querySelector('[data-search-count]');
    const number = section.querySelector('[data-search-number]');
    const list = section.querySelector('[data-search-results]');
    const empty = section.querySelector('[data-search-empty]');
    const searching = section.querySelectorAll('[data-search-part="search"]');
    const editing = () => doc.body.classList.contains('editing');
    const switchedOn = () => {
        const listed = form?.getAttribute('data-search-filters');

        return listed === null || listed === undefined ? null : listed.split(/\s+/).filter(Boolean);
    };
    const words = (name, fallback) => said(section, name, fallback);
    let filters = filtersFor(collection, switchedOn());
    let asked = fromParams(new URLSearchParams(win.location.search), collection.fields);
    let limit = MOST_SHOWN;
    let missedTimer = null;
    const missedSent = new Set();

    // A record's page, or the search.
    let record = null;
    const recordWanted = new URLSearchParams(win.location.search).get('record');
    if (recordWanted) record = collection.rows.find((row) => recordId(row.record) === recordWanted)?.record ?? null;

    let detail = section.querySelector('[data-search-record]');
    if (!detail) {
        detail = make(doc, 'div', 'kit-search__record');
        detail.setAttribute('data-search-record', '');
        detail.setAttribute('data-kit-computed', 'search');
        detail.hidden = true;
        list?.parentNode?.insertBefore(detail, list);
    }

    const go = section.querySelector('.kit-search__go');
    if (go) styled(go, section, 'primary');

    if (input && collection.rows[0] && !input.placeholder) {
        const code = collection.fields.find((f) => f.type === 'text' && f.code);
        if (code && collection.rows[0].record[code.key]) input.placeholder = String(collection.rows[0].record[code.key]);
    }

    const layout = () => (form?.getAttribute('data-search-layout') === 'rows' ? 'rows' : 'cards');

    let filtersOpen = false;
    function drawFilters() {
        if (!area) return;
        area.replaceChildren();
        area.setAttribute('data-kit-computed', 'search');
        // On a phone the filters wait behind one button, so the results are not a screen away.
        const chosen = Object.values(asked.filters).filter((v) => (Array.isArray(v) ? v.length : v && (v === true || v.from || v.to))).length;
        const toggle = make(doc, 'button', 'kit-search__filters-toggle', `${words('filters', 'Filters')}${chosen ? ` (${chosen})` : ''}`);
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', String(filtersOpen));
        toggle.addEventListener('click', () => { filtersOpen = !filtersOpen; area.classList.toggle('is-open', filtersOpen); toggle.setAttribute('aria-expanded', String(filtersOpen)); });
        area.classList.toggle('is-open', filtersOpen);
        area.append(toggle);
        for (const filter of filters) {
            const want = asked.filters[filter.key];
            if (filter.kind === 'choice' && filter.as === 'chips') {
                const set = make(doc, 'fieldset', 'kit-search__filter');
                set.append(make(doc, 'legend', null, filter.label));
                const chips = make(doc, 'div', 'kit-search__chips');
                for (const option of filter.options) {
                    const chip = make(doc, 'button', 'kit-search__chip', option.value);
                    chip.type = 'button';
                    const on = Array.isArray(want) && want.includes(option.value);
                    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
                    chip.addEventListener('click', () => {
                        const now = new Set(asked.filters[filter.key] ?? []);
                        if (now.has(option.value)) now.delete(option.value); else now.add(option.value);
                        asked.filters[filter.key] = [...now];
                        changed();
                    });
                    chips.append(chip);
                }
                set.append(chips);
                area.append(set);
            } else if (filter.kind === 'choice') {
                const tag = make(doc, 'label', 'kit-search__filter');
                tag.append(make(doc, 'span', null, filter.label));
                const select = make(doc, 'select', 'kit-search__select');
                select.append(Object.assign(make(doc, 'option', null, words('all', 'All')), { value: '' }));
                for (const option of filter.options) select.append(Object.assign(make(doc, 'option', null, option.value), { value: option.value }));
                select.value = Array.isArray(want) ? (want[0] ?? '') : '';
                select.addEventListener('change', () => { asked.filters[filter.key] = select.value ? [select.value] : []; changed(); });
                tag.append(select);
                area.append(tag);
            } else if (filter.kind === 'range' || filter.kind === 'dates') {
                const set = make(doc, 'fieldset', 'kit-search__filter');
                set.append(make(doc, 'legend', null, `${filter.label}${filter.unit ? ` (${filter.unit})` : ''}`));
                const range = make(doc, 'div', 'kit-search__range');
                for (const end of ['from', 'to']) {
                    const box = make(doc, 'input', filter.kind === 'dates' ? 'kit-search__date' : 'kit-search__number');
                    box.type = filter.kind === 'dates' ? 'date' : 'text';
                    if (filter.kind === 'range') { box.inputMode = 'decimal'; box.placeholder = String(end === 'from' ? filter.min : filter.max); }
                    else { box.min = filter.from; box.max = filter.to; }
                    box.value = want?.[end] ?? '';
                    box.setAttribute('aria-label', `${filter.label} ${words(end, end === 'from' ? 'From' : 'To').toLowerCase()}`);
                    box.addEventListener('change', () => { asked.filters[filter.key] = { ...(asked.filters[filter.key] ?? {}), [end]: box.value }; changed(); });
                    range.append(make(doc, 'span', null, words(end, end === 'from' ? 'From' : 'To')), box);
                }
                set.append(range);
                area.append(set);
            } else if (filter.kind === 'toggle') {
                const tag = make(doc, 'label', 'kit-search__toggle kit-search__filter');
                const box = make(doc, 'input');
                box.type = 'checkbox';
                box.checked = want === true;
                box.addEventListener('change', () => { asked.filters[filter.key] = box.checked; changed(); });
                tag.append(box, make(doc, 'span', null, `${words('only', 'Only with')} ${filter.label.toLowerCase()}`));
                area.append(tag);
            }
        }
        const sorts = sortsFor(collection);
        if (sorts.length > 1) {
            const tag = make(doc, 'label', 'kit-search__filter');
            tag.append(make(doc, 'span', null, words('sort', 'Sort by')));
            const select = make(doc, 'select', 'kit-search__select');
            for (const sort of sorts) select.append(Object.assign(make(doc, 'option', null, sort.id === 'best' ? words('best', sort.label) : sort.label), { value: sort.id }));
            select.value = asked.sort;
            select.addEventListener('change', () => { asked.sort = select.value; changed(); });
            tag.append(select);
            area.append(tag);
        }
        if (filters.length) {
            const clear = make(doc, 'button', 'kit-search__clear', words('clear', 'Clear filters'));
            clear.type = 'button';
            clear.addEventListener('click', () => { asked = { query: asked.query, filters: {}, sort: 'best' }; drawFilters(); changed(); });
            area.append(clear);
        }
    }

    function card(item) {
        const li = make(doc, 'li', 'kit-search__card');
        li.setAttribute('data-search-hit', recordId(item));
        const photo = collection.fields.find((f) => f.type === 'photo' && item[f.key]);
        if (photo) {
            const img = make(doc, 'img', 'kit-search__photo');
            img.src = item[photo.key];
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            li.append(img);
        }
        const code = collection.fields.find((f) => f.type === 'text' && f.code && item[f.key]);
        if (code) li.append(make(doc, 'p', 'kit-search__code', item[code.key]));
        li.append(make(doc, 'h3', 'kit-search__name', String(item[collection.title] ?? '')));
        const facts = make(doc, 'dl', 'kit-search__facts');
        for (const field of collection.fields) {
            if (field.key === collection.title || field === code || ['photo', 'link'].includes(field.type) || (field.type === 'text' && !field.code)) continue;
            const value = shown(field, item[field.key]);
            if (!value) continue;
            const pair = make(doc, 'div');
            pair.append(make(doc, 'dt', null, field.label), make(doc, 'dd', null, value));
            facts.append(pair);
            if (facts.children.length >= 5) break;
        }
        if (facts.children.length) li.append(facts);
        const ways = make(doc, 'div', 'kit-search__ways');
        const open = styled(make(doc, 'a', 'kit-search__details', words('details', 'View details')), section, 'secondary');
        const params = new URLSearchParams();
        params.set('record', recordId(item));
        open.href = addressWith(win, params);
        open.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || editing()) return;
            event.preventDefault();
            win.history.pushState({ kitSearch: true }, '', open.href);
            record = item;
            draw();
            section.scrollIntoView?.({ block: 'start' });
        });
        ways.append(open);
        const quote = quoteHref(section, item, collection);
        if (quote) {
            const ask = styled(make(doc, 'a', 'kit-search__quote', words('quote', 'Request a quote')), section, 'primary');
            ask.href = quote;
            ways.append(ask);
        }
        li.append(ways);

        return li;
    }

    function drawRecord() {
        detail.replaceChildren();
        const back = make(doc, 'a', 'kit-search__back', `← ${words('back', 'Back to the search')}`);
        back.href = addressWith(win, toParams(asked, collection.fields));
        back.addEventListener('click', (event) => {
            if (editing()) return;
            event.preventDefault();
            if (win.history.state?.kitSearch) win.history.back();
            else { win.history.replaceState(null, '', back.href); record = null; draw(); }
        });
        const photo = collection.fields.find((f) => f.type === 'photo' && record[f.key]);
        detail.classList.toggle('has-photo', Boolean(photo));
        const words_ = make(doc, 'div');
        words_.append(back);
        if (photo) {
            const img = make(doc, 'img', 'kit-search__photo');
            img.src = record[photo.key];
            img.alt = String(record[collection.title] ?? '');
            detail.append(img);
        }
        words_.append(make(doc, 'h3', null, String(record[collection.title] ?? '')));
        const all = make(doc, 'dl', 'kit-search__all');
        for (const field of collection.fields) {
            if (field.key === collection.title || field.type === 'photo') continue;
            const value = shown(field, record[field.key]);
            if (!value) continue;
            const dd = make(doc, 'dd');
            if (field.type === 'link') {
                const a = make(doc, 'a', null, value.replace(/^https:\/\//, '').slice(0, 60));
                a.href = value;
                a.rel = 'noopener';
                dd.append(a);
            } else dd.textContent = value;
            all.append(make(doc, 'dt', null, field.label), dd);
        }
        words_.append(all);
        const quote = quoteHref(section, record, collection);
        if (quote) {
            const ask = styled(make(doc, 'a', 'kit-search__quote', words('quote', 'Request a quote')), section, 'primary');
            ask.href = quote;
            words_.append(ask);
        }
        detail.append(words_);
        if (!editing()) doc.title = `${record[collection.title] ?? ''} | ${doc.title.replace(/^.*? \| /, '')}`;
    }

    function draw() {
        section.setAttribute('data-layout', layout());
        const inRecord = Boolean(record);
        detail.hidden = !inRecord;
        for (const part of searching) part.hidden = inRecord;
        if (count) count.hidden = inRecord;
        if (list) list.hidden = inRecord;
        if (inRecord) {
            if (empty) empty.hidden = true;
            if (more) more.hidden = true;
            drawRecord();
            return;
        }
        const found = search(collection, asked);
        if (number) number.textContent = found.count.toLocaleString('en-NG');
        count?.classList.toggle('is-one', found.count === 1);
        count?.classList.toggle('is-many', found.count !== 1);
        if (list) {
            list.setAttribute('data-kit-computed', 'search');
            list.replaceChildren(...found.results.slice(0, limit).map(card));
        }
        if (empty) empty.hidden = editing() ? false : found.count > 0;
        if (more) {
            more.hidden = found.count <= limit;
            more.textContent = words('more', 'Show more');
        }
        if (!found.count && asked.query.trim().length >= 2) missed();
    }

    function missed() {
        const url = section.getAttribute('data-search-missed');
        if (!url || editing()) return;
        win.clearTimeout(missedTimer);
        missedTimer = win.setTimeout(() => {
            const query = asked.query.trim().slice(0, 120);
            if (!query || missedSent.has(query.toLowerCase())) return;
            if (search(collection, asked).count) return;
            missedSent.add(query.toLowerCase());
            const body = JSON.stringify({ collection: data.id, query, filters: Object.fromEntries(Object.entries(asked.filters).filter(([, v]) => (Array.isArray(v) ? v.length : v))) });
            try {
                (send ?? ((to, text) => win.fetch(to, { method: 'POST', body: text, headers: { 'Content-Type': 'application/json' }, keepalive: true, mode: 'cors', credentials: 'omit' }).catch(() => {})))(url, body);
            } catch { /* a search still works when the list cannot be told */ }
        }, 1500);
    }

    let more = section.querySelector('[data-search-more]');
    if (!more && list) {
        more = styled(make(doc, 'button', 'kit-search__more'), section, 'secondary');
        more.type = 'button';
        more.setAttribute('data-search-more', '');
        list.after(more);
    }
    more?.addEventListener('click', () => { limit += MOST_SHOWN * 2; draw(); });

    function changed() {
        limit = MOST_SHOWN;
        if (!editing()) win.history.replaceState(win.history.state, '', addressWith(win, toParams(asked, collection.fields)));
        drawFilters();
        draw();
    }

    if (input) {
        // Words typed while the index was on its way are the search, unless the address asks for another.
        if (!asked.query && input.value.trim()) asked.query = input.value;
        input.value = asked.query;
        input.addEventListener('input', () => { asked.query = input.value; limit = MOST_SHOWN; draw(); if (!editing()) win.history.replaceState(win.history.state, '', addressWith(win, toParams(asked, collection.fields))); });
    }
    form?.addEventListener('submit', (event) => { event.preventDefault(); if (input) asked.query = input.value; draw(); if (!search(collection, asked).count) missed(); });

    win.addEventListener('popstate', () => {
        const id = new URLSearchParams(win.location.search).get('record');
        record = id ? collection.rows.find((row) => recordId(row.record) === id)?.record ?? null : null;
        if (!record) asked = fromParams(new URLSearchParams(win.location.search), collection.fields);
        if (input) input.value = asked.query;
        drawFilters();
        draw();
    });

    // The owner switching a filter off, or the layout, in Live Edit: drawn again at once.
    if (form && typeof win.MutationObserver === 'function') {
        new win.MutationObserver(() => { filters = filtersFor(collection, switchedOn()); drawFilters(); draw(); })
            .observe(form, { attributes: true, attributeFilter: ['data-search-filters', 'data-search-layout'] });
    }

    // The owner changing a word the results use (View details, Request a quote): every card says it at once.
    const strip = section.querySelector('[data-search-words]');
    if (strip && typeof win.MutationObserver === 'function') {
        new win.MutationObserver(() => { drawFilters(); draw(); }).observe(strip, { characterData: true, childList: true, subtree: true });
    }

    drawFilters();
    draw();

    return { search: (query) => { asked.query = query; if (input) input.value = query; draw(); return search(collection, asked); }, collection };
}

/** Records from an index: objects (v1, and the editor's), or columns and rows (v2, as published: half the bytes). */
export function recordsOf(index) {
    if (Array.isArray(index?.records)) return index.records;
    if (!Array.isArray(index?.keys) || !Array.isArray(index?.rows)) return [];
    const keys = index.keys;
    return index.rows.map((row) => {
        const record = {};
        for (let i = 0; i < keys.length; i++) if (row[i] !== null && row[i] !== undefined) record[keys[i]] = row[i];
        return record;
    });
}

const yielded = (win) => new Promise((resolve) => {
    if (win.scheduler?.yield) win.scheduler.yield().then(resolve);
    else win.setTimeout(resolve, 0);
});

/**
 * A collection's index, whole. A big catalogue is published in parts (`parts`, each a file beside the first, named
 * by its fingerprint): fetched together, and each read in a task of its own, so no single task holds the page.
 */
export async function loadIndex(address, { win = window, base = win.document?.baseURI } = {}) {
    const read = (url) => win.fetch(url, { credentials: 'same-origin' })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`${response.status}`))));
    const first = await read(address);
    const records = recordsOf(first);
    const parts = Array.isArray(first.parts) ? first.parts.filter((part) => typeof part === 'string') : [];
    if (parts.length) {
        const from = new URL(address, base);
        const pending = parts.map((part) => read(new URL(part, from).href));
        for (const part of pending) {
            const data = await part;
            await yielded(win);
            for (const record of recordsOf({ keys: first.keys, ...data })) records.push(record);
        }
    }
    const { rows, keys, parts: _parts, ...rest } = first;

    return { ...rest, records };
}

/**
 * When a search reads its index: at once when the address already asks for something (a record, a search
 * someone shared) or in the editor; otherwise as it comes near the screen (a screen and a half ahead), or the
 * moment a visitor reaches for it, whichever is first. A page whose search is far below costs nothing until then.
 */
export function whenWanted(section, go, { win = window } = {}) {
    let done = false;
    let watcher = null;
    const once = () => {
        if (done) return;
        done = true;
        watcher?.disconnect();
        for (const name of ['focusin', 'pointerover', 'touchstart']) section.removeEventListener(name, once);
        go();
    };
    const asked = [...new URLSearchParams(win.location.search).keys()].length > 0;
    if (asked || section.ownerDocument.body.classList.contains('editing') || typeof win.IntersectionObserver !== 'function') {
        once();
        return;
    }
    for (const name of ['focusin', 'pointerover', 'touchstart']) section.addEventListener(name, once, { passive: true });
    watcher = new win.IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) once(); }, { rootMargin: '150% 0px' });
    watcher.observe(section);
}

// Where this file was loaded from, for its stylesheet beside it (read while the file runs: after, it is gone).
const OWN_ADDRESS = typeof document !== 'undefined' ? document.currentScript?.src ?? '' : '';

export function boot(doc = document, win = window, from = OWN_ADDRESS) {
    /*
     * The base look (kit-search-base.js) is in the page's head as the host publishes it (<style
     * data-kit-search-base>), so the section is in its final shape at first paint and this file carries no CSS. A
     * page without it (an older host) gets the stylesheet published beside this file (kit-search.css).
     */
    if (!doc.querySelector('style[data-kit-search-base], link[data-kit-search-base], #kit-search-base') && /\.js(\?|$)/.test(from)) {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = from.replace(/\.js(\?.*)?$/, '.css');
        link.setAttribute('data-kit-search-base', '');
        doc.head.prepend(link);
    }
    for (const section of doc.querySelectorAll('[data-search][data-search-index]')) {
        if (section.__kitSearch) continue;
        section.__kitSearch = true;
        const words = section.querySelector('[data-search-words]');
        if (words && !words.hasAttribute('data-said')) words.setAttribute('data-said', 'Words visitors see in the results. Click one to change it.');
        whenWanted(section, () => loadIndex(section.getAttribute('data-search-index'), { win, base: doc.baseURI })
            .then((data) => { section.__kitSearchMounted = mount(section, data, { win }); section.setAttribute('data-search-ready', ''); })
            .catch(() => { section.setAttribute('data-search-failed', ''); }), { win });
    }
    carry(doc, win);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.__kitSearchTest) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot());
    else boot();
}
