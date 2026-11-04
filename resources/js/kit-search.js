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

const BASE = [
    ':where(.kit-search){display:block;padding-block:var(--kit-section-space,clamp(48px,7vw,96px));color:var(--brand-body,#374151);font-family:var(--font-body,inherit)}',
    ':where(.kit-search__in){width:min(100% - 2*var(--kit-gutter,clamp(16px,4vw,48px)),var(--kit-measure,1200px));margin-inline:auto}',
    ':where(.kit-search__head){max-width:44rem;margin-bottom:clamp(20px,3vw,32px)}',
    ':where(.kit-search__title){font-family:var(--font-display,inherit);color:var(--brand-ink,inherit);margin:0 0 .4em}',
    ':where(.kit-search__lead){margin:0;color:var(--brand-muted,#6b7280)}',
    ':where(.kit-search__label){display:block;font-weight:600;color:var(--brand-ink,inherit);margin-bottom:8px}',
    ':where(.kit-search__box){display:flex;gap:8px;flex-wrap:wrap}',
    ':where(.kit-search__input){flex:1 1 220px;min-width:0;min-height:48px;padding:10px 14px;font:inherit;font-size:max(16px,1rem);color:var(--brand-ink,inherit);background:var(--brand-surface,#fff);border:1px solid var(--brand-line,#cbd5e1);border-radius:var(--kit-radius,6px)}',
    ':where(.kit-search__input:focus-visible,.kit-search button:focus-visible,.kit-search a:focus-visible,.kit-search select:focus-visible,.kit-search input:focus-visible){outline:3px solid var(--brand-accent,#2e6b9f);outline-offset:2px}',
    ':where(.kit-search__go,.kit-search__quote){min-height:48px;padding:10px 20px;font:inherit;font-weight:600;color:var(--brand-surface,#fff);background:var(--brand-accent,#2e6b9f);border:0;border-radius:var(--kit-radius,6px);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}',
    ':where(.kit-search__filters){display:flex;flex-wrap:wrap;gap:12px 20px;margin-top:16px;align-items:flex-end}',
    ':where(.kit-search__filter){border:0;padding:0;margin:0;min-width:0;max-width:100%}',
    ':where(.kit-search__filter legend,.kit-search__filter>label>span:first-child){display:block;font-size:.875rem;font-weight:600;color:var(--brand-ink,inherit);margin-bottom:6px;padding:0}',
    ':where(.kit-search__chips){display:flex;flex-wrap:wrap;gap:6px}',
    ':where(.kit-search__chip){min-height:40px;padding:6px 12px;font:inherit;font-size:.9375rem;color:var(--brand-ink,inherit);background:var(--brand-surface,#fff);border:1px solid var(--brand-line,#cbd5e1);border-radius:999px;cursor:pointer}',
    ':where(.kit-search__chip[aria-pressed="true"]){background:var(--brand-ink,#0f2447);color:var(--brand-surface,#fff);border-color:var(--brand-ink,#0f2447)}',
    ':where(.kit-search__select,.kit-search__number,.kit-search__date){min-height:40px;padding:6px 10px;font:inherit;font-size:max(16px,.9375rem);color:var(--brand-ink,inherit);background:var(--brand-surface,#fff);border:1px solid var(--brand-line,#cbd5e1);border-radius:var(--kit-radius,6px);max-width:100%}',
    ':where(.kit-search__number){width:7.5em}',
    ':where(.kit-search__range){display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
    ':where(.kit-search__toggle){display:inline-flex;gap:8px;align-items:center;min-height:40px;cursor:pointer}',
    ':where(.kit-search__toggle input){width:20px;height:20px;accent-color:var(--brand-accent,#2e6b9f)}',
    ':where(.kit-search__clear){min-height:40px;padding:6px 4px;font:inherit;color:var(--brand-accent,#2e6b9f);background:none;border:0;text-decoration:underline;cursor:pointer}',
    ':where(.kit-search__bar){display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin:24px 0 12px}',
    ':where(.kit-search__count){margin:0;font-weight:600;color:var(--brand-ink,inherit)}',
    ':where(.kit-search__count [data-search-one],.kit-search__count [data-search-many]){display:none}',
    ':where(.kit-search__count.is-one [data-search-one],.kit-search__count.is-many [data-search-many]){display:inline}',
    ':where(.kit-search__results){display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));list-style:none;margin:0;padding:0}',
    ':where(.kit-search[data-layout="rows"] .kit-search__results){grid-template-columns:1fr;gap:0}',
    ':where(.kit-search__card){display:flex;flex-direction:column;gap:8px;padding:16px;background:var(--brand-surface,#fff);border:1px solid var(--brand-line,#d1d9e2);border-radius:var(--kit-radius,8px);min-width:0}',
    ':where(.kit-search[data-layout="rows"] .kit-search__card){flex-direction:row;flex-wrap:wrap;align-items:center;border-width:0 0 1px;border-radius:0;padding:14px 0;gap:8px 20px}',
    ':where(.kit-search__photo){width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:calc(var(--kit-radius,8px) - 2px);background:var(--brand-raised,#eef2f6)}',
    ':where(.kit-search[data-layout="rows"] .kit-search__photo){width:72px;aspect-ratio:1}',
    ':where(.kit-search__code){margin:0;font-family:var(--font-mono,ui-monospace,monospace);font-size:.875rem;color:var(--brand-muted,#6b7280);overflow-wrap:anywhere}',
    ':where(.kit-search__name){margin:0;font-family:var(--font-display,inherit);font-size:1.125rem;color:var(--brand-ink,inherit);overflow-wrap:anywhere}',
    ':where(.kit-search[data-layout="rows"] .kit-search__name){flex:1 1 200px}',
    ':where(.kit-search__facts){display:flex;flex-wrap:wrap;gap:4px 14px;margin:0;font-size:.875rem}',
    ':where(.kit-search__facts div){display:flex;gap:4px}',
    ':where(.kit-search__facts dt){color:var(--brand-muted,#6b7280)}',
    ':where(.kit-search__facts dd){margin:0;color:var(--brand-ink,inherit);font-weight:600}',
    ':where(.kit-search__ways){display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:4px}',
    ':where(.kit-search__details){min-height:44px;display:inline-flex;align-items:center;padding:8px 14px;font-weight:600;color:var(--brand-ink,inherit);border:1px solid var(--brand-line,#cbd5e1);border-radius:var(--kit-radius,6px);text-decoration:none}',
    ':where(.kit-search__more){display:block;margin:20px auto 0;min-height:44px;padding:8px 20px;font:inherit;font-weight:600;color:var(--brand-ink,inherit);background:var(--brand-surface,#fff);border:1px solid var(--brand-line,#cbd5e1);border-radius:var(--kit-radius,6px);cursor:pointer}',
    ':where(.kit-search__empty){padding:24px;background:var(--brand-raised,#eef2f6);border-radius:var(--kit-radius,8px)}',
    ':where(.kit-search__empty-title){margin:0 0 4px;font-weight:600;color:var(--brand-ink,inherit)}',
    ':where(.kit-search__empty p:last-child){margin:0}',
    ':where(.kit-search__record){display:grid;gap:24px;grid-template-columns:minmax(0,1fr)}',
    '@media (min-width:768px){:where(.kit-search__record.has-photo){grid-template-columns:minmax(0,2fr) minmax(0,3fr)}}',
    ':where(.kit-search__record .kit-search__photo){aspect-ratio:4/3}',
    ':where(.kit-search__record h3){margin:0 0 12px;font-family:var(--font-display,inherit);font-size:clamp(1.5rem,3vw,2rem);color:var(--brand-ink,inherit);overflow-wrap:anywhere}',
    ':where(.kit-search__all){display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:8px 16px;margin:0 0 20px}',
    ':where(.kit-search__all dt){color:var(--brand-muted,#6b7280)}',
    ':where(.kit-search__all dd){margin:0;color:var(--brand-ink,inherit);font-weight:600;overflow-wrap:anywhere}',
    ':where(.kit-search__back){display:inline-flex;align-items:center;min-height:44px;margin-bottom:16px;color:var(--brand-accent,#2e6b9f);font-weight:600}',
    ':where(.kit-search__words){display:none}',
    ':where(body.editing .kit-search__words){display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:24px;padding:12px;border:1px dashed var(--brand-line,#cbd5e1);font-size:.875rem}',
    ':where(body.editing .kit-search__words)::before{content:attr(data-said);width:100%;color:var(--brand-muted,#6b7280)}',
    ':where(body.editing .kit-search__count [data-search-one],body.editing .kit-search__count [data-search-many]){display:inline}',
    ':where(body.editing .kit-search__count [data-search-one])::before{content:" / "}',
    '[data-search] [hidden]{display:none!important}',
    /*
     * The layout itself, one class above a template's own element rules (a form drawn as a grid, every input
     * a full-width block, every link in the brand's ink): without it the search inherits the template's
     * contact form. Colours and faces stay at no specificity above, so a template's search kit sets them.
     */
    '.kit-search .kit-search__form{display:block;margin:0;padding:0;border:0;background:none;box-shadow:none;max-width:none}',
    '.kit-search .kit-search__label{display:block;width:auto;margin:0 0 8px}',
    '.kit-search .kit-search__box{display:flex;flex-wrap:wrap;gap:8px;width:100%;margin:0}',
    '.kit-search .kit-search__input{flex:1 1 220px;width:auto;min-width:0;max-width:100%;margin:0;box-sizing:border-box}',
    '.kit-search .kit-search__go{flex:0 0 auto;width:auto;margin:0}',
    '.kit-search .kit-search__go,.kit-search .kit-search__quote{color:var(--kit-search-on-accent,var(--brand-surface,#fff))}',
    '.kit-search .kit-search__go:hover,.kit-search .kit-search__quote:hover{color:var(--kit-search-on-accent,var(--brand-surface,#fff));filter:brightness(.92)}',
    '.kit-search .kit-search__details,.kit-search .kit-search__details:hover{color:var(--brand-ink,inherit)}',
    '.kit-search .kit-search__filters{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:flex-end;margin:16px 0 0;padding:0;grid-template-columns:none}',
    '.kit-search .kit-search__filter{display:block;width:auto;max-width:100%;margin:0;padding:0;border:0;min-width:0}',
    '.kit-search .kit-search__chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.kit-search .kit-search__chip{width:auto;margin:0;flex:none}',
    '.kit-search .kit-search__range{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
    '.kit-search .kit-search__range>span{display:inline;margin:0}',
    '.kit-search .kit-search__number{width:7.5em;flex:none;margin:0;box-sizing:border-box}',
    '.kit-search .kit-search__date{width:auto;flex:none;margin:0}',
    '.kit-search .kit-search__select{width:auto;max-width:100%;margin:0}',
    '.kit-search .kit-search__toggle{display:inline-flex;flex-direction:row;align-items:center;gap:8px;width:auto;margin:0}',
    '.kit-search .kit-search__toggle input{width:20px;height:20px;min-height:0;margin:0;padding:0;flex:none;appearance:auto;-webkit-appearance:checkbox}',
    '.kit-search .kit-search__clear{width:auto;margin:0}',
    '.kit-search .kit-search__results{list-style:none;margin:0;padding:0}',
    '.kit-search .kit-search__card{margin:0}',
    '.kit-search .kit-search__facts{padding:0}',
    '.kit-search .kit-search__all{padding:0;margin:0 0 20px}',
    ':where(.kit-search__filters-toggle){display:none;min-height:44px;padding:8px 16px;font:inherit;font-weight:600;color:var(--brand-ink,inherit);background:var(--brand-surface,#fff);border:1px solid var(--brand-line,#cbd5e1);border-radius:var(--kit-radius,6px);cursor:pointer}',
    '@media (max-width:640px){.kit-search .kit-search__filters-toggle{display:inline-flex;align-items:center;width:auto;margin:0}',
    '.kit-search .kit-search__filters:not(.is-open)>:not(.kit-search__filters-toggle){display:none}',
    '.kit-search .kit-search__filters.is-open{flex-direction:column;align-items:stretch}',
    '.kit-search .kit-search__filters.is-open>.kit-search__filters-toggle{align-self:flex-start}}',
].join('');

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
        const open = make(doc, 'a', 'kit-search__details', words('details', 'View details'));
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
            const ask = make(doc, 'a', 'kit-search__quote', words('quote', 'Request a quote'));
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
            const ask = make(doc, 'a', 'kit-search__quote', words('quote', 'Request a quote'));
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
        more = make(doc, 'button', 'kit-search__more');
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

/** On a form's page: the record a visitor asked about, carried into the form. */
export function carry(doc = document, win = window) {
    const params = new URLSearchParams(win.location.search);
    if (params.get('from') !== 'search' || !params.get('about')) return false;
    const about = params.get('about').slice(0, 200);
    const id = (params.get('record') ?? '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
    const forms = [...doc.querySelectorAll('[data-component^="form."] form, form[data-component^="form."], form')]
        .filter((form) => !form.closest('[data-search]') && !/newsletter|search/.test(form.closest('[data-component]')?.getAttribute('data-component') ?? '') && form.querySelector('textarea, input[type="text"]'));
    const order = ['quote', 'rfq', 'enquiry', 'contact', 'booking'];
    const purpose = (form) => form.closest('[data-component]')?.getAttribute('data-component') ?? form.getAttribute('data-component') ?? '';
    forms.sort((a, b) => {
        const rank = (form) => { const at = order.findIndex((word) => purpose(form).includes(word)); return at < 0 ? order.length : at; };
        return rank(a) - rank(b);
    });
    const form = forms[0];
    if (!form) return false;
    const message = form.querySelector('[data-carry-pn]') ?? form.querySelector('textarea[name*="message" i], textarea[name*="detail" i], textarea[name*="enquir" i]') ?? form.querySelector('textarea');
    const words = `Request a quote for: ${about}`;
    if (message && !message.value.trim()) message.value = message.matches('[data-carry-pn]') ? about : words;
    const kept = form.querySelector('[data-carried-field]');
    if (kept && !kept.value) kept.value = about;
    if (id && !form.querySelector('input[name="search_record"]')) {
        const hidden = doc.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'search_record';
        hidden.value = id;
        form.append(hidden);
    }
    const carried = doc.querySelector('[data-carried]');
    const carriedList = doc.querySelector('[data-carried-list]');
    if (carried && carriedList && !carriedList.children.length) {
        const li = doc.createElement('li');
        li.textContent = about;
        carriedList.append(li);
        carried.hidden = false;
    }

    return true;
}

export function boot(doc = document, win = window) {
    if (!doc.getElementById('kit-search-base')) {
        const style = doc.createElement('style');
        style.id = 'kit-search-base';
        style.textContent = BASE;
        doc.head.prepend(style);
    }
    for (const section of doc.querySelectorAll('[data-search][data-search-index]')) {
        if (section.__kitSearch) continue;
        section.__kitSearch = true;
        const words = section.querySelector('[data-search-words]');
        if (words && !words.hasAttribute('data-said')) words.setAttribute('data-said', 'Words visitors see in the results. Click one to change it.');
        win.fetch(section.getAttribute('data-search-index'), { credentials: 'same-origin' })
            .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`${response.status}`))))
            .then((data) => { section.__kitSearchMounted = mount(section, data, { win }); section.setAttribute('data-search-ready', ''); })
            .catch(() => { section.setAttribute('data-search-failed', ''); });
    }
    carry(doc, win);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.__kitSearchTest) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot());
    else boot();
}
