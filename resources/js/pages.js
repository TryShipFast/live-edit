/*
 * The page builder: the site's pages, a page the owner makes, and sections
 * added from the design's own library.
 *
 * The host hands the editor everything it needs as window.liveEditPages
 * (README, "Page builder contract"): the pages, the library of sections the
 * design has (each named as the designer named it, and from which page), and
 * the two settings the arrangement is saved under. Saving is the ordinary
 * setting save, so a new page or an added section is a draft until it is
 * published, shows under Changes, and rolls back with everything else.
 *
 * Only sections the design already has can be added: every page an owner
 * makes is still one its designer drew.
 */

import { KINDS } from './data-kit.js';

/** What a chart of a kind, or a table, holds and keeps to, for choosing one before it is added. */
export function kindSays(kind, section = {}) {
    // A form the host offers (a contact or quote form): what it asks, as the host says it.
    if (kind === 'form') {
        return [...(Array.isArray(section.says) ? section.says : []), 'It is drawn with your website’s own form style, and posts to your enquiries.'];
    }
    if (kind === 'table') {
        return [
            'A table, for what is compared across columns: plans, fees, a timetable.',
            'You name the columns and fill the rows; add, move and delete either, or paste rows from a spreadsheet. On a phone each row reads as a card.',
            'It arrives with sample rows to replace.',
        ];
    }
    if (kind === 'search') {
        return [
            'A search over one of your collections: a box for words or a part number (found with or without dashes and spaces), and filters made from the collection\'s fields.',
            'Visitors see how many were found, cards or rows, each with its own page and Request a quote. You change every word, which filters show and how results look.',
            'Its records are the collection\'s: change them in the Search tab, then publish.',
        ];
    }
    const spec = KINDS[kind];
    if (!spec) return [];
    const rules = {
        bar: 'One unit for every bar.',
        line: 'Points stay in date order.',
        donut: 'Shares add up to the whole, and six slices at most: the smallest go together as “Other”.',
        funnel: 'Stages stay in order, and each count is no larger than the one before.',
        progress: 'Each value and its target are in the same unit.',
        sparkline: 'Drawn small, with no axes, beside its latest figure.',
    }[kind];

    return [
        `Each ${spec.one.toLowerCase()} has ${[spec.label, ...spec.fields].map((f) => f.toLowerCase()).join(', ')}. Type them, or paste rows from a spreadsheet.`,
        rules,
        spec.choices ? `You choose: ${spec.choices.charAt(0).toLowerCase()}${spec.choices.slice(1)}` : '',
        'It arrives with sample figures to replace, and redraws as you edit.',
    ].filter(Boolean);
}

/** Addresses the host keeps for itself, matched to the host's own rule. */
const RESERVED = ['assets', 'home', 'index', '404', 'sites', 'live-edit', 'api', 'admin'];
const PAGE_ID = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?(?:\/[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?)?$/;

/** The address a title suggests: "Open days 2027!" becomes "open-days-2027". */
export function slugFor(title) {
    return String(title ?? '')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48)
        .replace(/-+$/g, '');
}

/** Why an address cannot be used, or null when it can. */
export function addressProblem(id, taken = []) {
    if (!id) return 'Give the page an address.';
    if (!PAGE_ID.test(id)) return 'Use lower-case letters, numbers and dashes.';
    if (RESERVED.includes(id.split('/')[0])) return 'That address is kept for the website itself.';
    if (taken.includes(id)) return 'A page already has that address.';

    return null;
}

/**
 * The preview frame: a desktop page laid out at full size and scaled to fit the
 * panel. The scale lives here because the holder's height is worked out from it.
 */
const FRAME = { width: 1280, height: 760, scale: 0.25 };

/**
 * What is still missing before a page can be made, in the owner's words.
 *
 * The button was simply dead until all three were right, and a disabled button
 * says nothing about why. The usual way to lose somebody is to type a title,
 * watch the address fill itself in, and find the button still grey with no
 * account of what is wrong: the section list is further up the panel and reads
 * as optional, so the one thing actually missing is the one thing they cannot
 * see. Null when nothing is missing.
 */
export function whyNotYet({ title = '', address = '', chosen = [], taken = [] } = {}) {
    if (!String(title).trim()) return 'Give the page a title.';

    const problem = addressProblem(address, taken);
    if (problem) return problem;
    if (!chosen.length) return 'Choose at least one section to start the page with.';

    return null;
}

/** A fresh name for an added section, never one the engine would read as its own copy (n + base 36). */
export function newAddedId(random = Math.random) {
    let id = '';
    while (id.length < 8) id += Math.floor(random() * 36).toString(36);

    return `add-${id}`;
}

/** The saved value for a page's additions, with one more (or one fewer). */
export function addedWith(added, id, from, beside = {}, place = null) {
    const next = { ...(added ?? {}) };
    if (from) next[id] = from;
    else delete next[id];
    /*
     * Charts and tables set beside another (owner, 7 Nov 2026: "only have above and below. But no left of or right
     * of"): kept while both are still on the page, and the one just added takes its place beside its partner.
     */
    const pairs = Object.fromEntries(Object.entries(beside ?? {}).filter(([one, at]) => one !== id && one in next && at?.of in next && at.of !== id));
    if (from && place?.of in next && (place.side === 'left' || place.side === 'right')) pairs[id] = { of: place.of, side: place.side };

    return JSON.stringify(Object.keys(pairs).length ? { added: next, beside: pairs } : { added: next });
}

/** A chart or a table from the library: the only things that can be set beside another. */
export function aChartOrTable(section) {
    return Boolean(section && (KINDS[section.kind] || section.kind === 'table'));
}

/** Where the add window's "On the left of" / "On the right of" choices are said: `beside:left:s-add-…`. */
export function besidePlace(value) {
    const found = /^beside:(left|right):(s-(add-[a-z0-9]+))$/.exec(String(value ?? ''));

    return found ? { side: found[1], item: found[2], of: found[3] } : null;
}

/** A page's section order with an added section placed after another (or last). */
/** Where "at the top of the page" is said to orderWith, since `null` already means the end. */
export const AT_THE_TOP = '^top';

export function orderWith(order, itemId, after = null) {
    const next = order.filter((id) => id !== itemId);
    if (after === AT_THE_TOP) {
        next.unshift(itemId);

        return next;
    }
    const at = after === null ? -1 : next.indexOf(after);
    next.splice(at === -1 ? next.length : at + 1, 0, itemId);

    return next;
}

/** The owner's pages with one put in the menus, or taken out. */
export function withMenu(made, id, on) {
    return (made ?? []).map((page) => (page.id === id ? { ...page, menu: on } : page));
}

/** The library grouped by the page each section comes from, in the design's order, filtered by what was typed. */
export function grouped(library, query = '') {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const groups = new Map();

    for (const section of library ?? []) {
        const haystack = `${section.label} ${section.page}`.toLowerCase();
        if (!words.every((word) => haystack.includes(word))) continue;
        if (!groups.has(section.page)) groups.set(section.page, []);
        groups.get(section.page).push(section);
    }

    // Forms first (owner, 7 Nov 2026: adding a form was "confusing", found only by scrolling past every section and
    // chart): the thing most owners come to add is at the top, as the builders they know list it.
    const all = [...groups.entries()].map(([page, sections]) => ({ page, sections }));
    const forms = all.filter((group) => group.sections.some((section) => section.kind === 'form'));

    return [...forms, ...all.filter((group) => !forms.includes(group))];
}

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
};

/** The section's own markup, cut from the page the design keeps it on. */
export function sectionMarkup(html, from) {
    const page = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
    const found = page.querySelector(`[data-instance="${CSS.escape(String(from ?? ''))}"]`);

    return found ? found.outerHTML : null;
}

/**
 * A page holding one section, for the owner to look at before they choose it.
 *
 * It is the section's own markup under the site's own stylesheets, so what
 * they see is what the page will hold. A component has to render on its own
 * for the Kit to accept it at all (the Kit check places each one on a blank
 * page), so showing one alone asks nothing new of the design.
 *
 * Nothing in here runs: the frame is sandboxed with no scripts allowed, and
 * the markup is the design's, already served to every visitor.
 */
export function previewDoc({ styles = [], markup = '', background = '#fff' }) {
    const sheets = styles.map((href) => `<link rel="stylesheet" href="${String(href).replace(/"/g, '&quot;')}">`).join('');

    return `<!doctype html><html><head><meta charset="utf-8">${sheets}`
        + `<style>html,body{margin:0;padding:0;background:${background};overflow-x:hidden}`
        + `body>*{animation:none!important;transition:none!important}`
        + `[data-reveal],[data-split],[data-stagger]>*{opacity:1!important;visibility:visible!important;transform:none!important}`
        + `</style></head><body>${markup}</body></html>`;
}

/** The stylesheets the site is wearing, so a preview wears them too. */
export function styleHrefs(doc = document) {
    return [...doc.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.href).filter(Boolean);
}

/** The words for a list of things, so a row reads as a sentence: "a, b and c". */
const listed = (names) => (names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/** The stored value, whether it arrives as JSON text or already read. */
const parsed = (value, fallback) => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value !== 'string') return value;

    try {
        return JSON.parse(value) ?? fallback;
    } catch {
        return fallback;
    }
};

/**
 * A page and section change, said in the owner's words rather than printed as
 * what is stored against the key.
 *
 * The panel is what somebody reads before pressing Publish, so a row there has
 * to be checkable. Arranging a page stores its sections as
 * `{"added":{"add-mqnnlyvb":"about.ethos"}}`, and printing that back asks the
 * owner to approve a change they cannot read: the id is one the engine minted
 * and `about.ethos` is the designer's name for the section, not the name the
 * library showed them. This says "Added What we believe" instead, and names
 * the page it happened on.
 *
 * Returns null for any other key, which the caller describes as it always did.
 */
export function describeStructure(key, before, after, { library = [], pages = [] } = {}) {
    // The add window's own label carries how many are left ("Table · 1 left"); a change names the section only.
    const named = (from) => String((library.find((section) => section.from === from) ?? {}).label ?? from).replace(/\s*·\s*(\d+|None) left$/i, '');
    const sectionsIn = (value) => Object.values(parsed(value, { added: {} }).added ?? {}).map(named);
    const titlesIn = (value) => (Array.isArray(parsed(value, [])) ? parsed(value, []) : []).map((page) => page.title ?? page.id);

    if (key === 'structure:pages') {
        const was = titlesIn(before);
        const now = titlesIn(after);
        const made = now.filter((title) => !was.includes(title));
        const gone = was.filter((title) => !now.includes(title));
        const said = [made.length ? `Added the page ${listed(made)}` : '', gone.length ? `Removed the page ${listed(gone)}` : '']
            .filter(Boolean).join('. ');
        // Renaming or reordering leaves the same titles on both sides; say that rather than list them back.
        const otherwise = now.length ? `Your pages: ${listed(now)}` : 'The pages you made changed';

        return { label: 'Pages', before: was.length ? `Your pages: ${listed(was)}` : 'No pages of your own', after: said || otherwise };
    }

    // A form the owner shaped (form-builder.js): its questions, before and after.
    if (String(key ?? '').startsWith('form:')) {
        const questions = (value) => (parsed(value, { fields: [] }).fields ?? []).filter((field) => !field.retired).map((field) => field.label);
        const was = questions(before);
        const now = questions(after);
        const added = now.filter((label) => !was.includes(label));
        const gone = was.filter((label) => !now.includes(label));
        const said = [added.length ? `Added ${listed(added)}` : '', gone.length ? `Took off ${listed(gone)}` : ''].filter(Boolean).join('. ');

        return {
            label: 'Form questions',
            before: was.length ? listed(was) : 'The questions the design asks',
            after: said || (now.length ? listed(now) : 'No questions'),
        };
    }

    // The design's own pages the owner deleted (the Pages list's Delete): named, not printed as addresses.
    if (key === 'structure:removed') {
        const named = (value) => (Array.isArray(parsed(value, [])) ? parsed(value, []) : []).map((id) => (pages.find((page) => page.id === id) ?? {}).title ?? `/${id}`);
        const was = named(before);
        const now = named(after);
        const gone = now.filter((title) => !was.includes(title));
        const back = was.filter((title) => !now.includes(title));
        const said = [gone.length ? `Deleted the page ${listed(gone)}` : '', back.length ? `Brought back ${listed(back)}` : ''].filter(Boolean).join('. ');

        return { label: 'Deleted pages', before: was.length ? listed(was) : 'None', after: said || (now.length ? listed(now) : 'None') };
    }

    if (!String(key ?? '').startsWith('structure:page:')) return null;

    const id = key.slice('structure:page:'.length);
    const title = (pages.find((page) => page.id === id) ?? {}).title ?? `/${id}`;
    const was = sectionsIn(before);
    const now = sectionsIn(after);
    const added = now.filter((name) => !was.includes(name));
    const removed = was.filter((name) => !now.includes(name));
    // A chart or table set beside another: said as where it now sits ("Table on the right of Chart: bars").
    const pairsIn = (value) => {
        const { added: sections = {}, beside = {} } = parsed(value, { added: {} }) ?? {};

        return Object.entries(beside ?? {}).filter(([one, at]) => sections[one] && sections[at?.of])
            .map(([one, at]) => `${named(sections[one])} on the ${at.side === 'left' ? 'left' : 'right'} of ${named(sections[at.of])}`);
    };
    const wasBeside = pairsIn(before);
    const set = pairsIn(after).filter((pair) => !wasBeside.includes(pair));
    const said = [added.length ? `Added ${listed(added)}` : '', set.length ? `Set ${listed(set)}` : '', removed.length ? `Removed ${listed(removed)}` : '']
        .filter(Boolean).join('. ');

    return {
        label: `Sections on ${title}`,
        before: was.length ? listed(was) : 'No sections added',
        after: said || (now.length ? listed(now) : 'No sections added'),
    };
}

/**
 * The library as a list to choose from: a search field, then each page's
 * sections under its name. `pick(section)` runs for a section chosen; with
 * `multiple`, sections toggle and `chosen()` says which are on.
 */
export function renderLibrary({ container, library, pick, multiple = false, fetchPage = (href) => fetch(href).then((r) => r.text()) }) {
    const wrap = el('div', 'le-library');
    const search = el('input', 'le-input le-library-search');
    search.type = 'search';
    search.placeholder = 'Find a section: team, prices, questions...';
    search.setAttribute('aria-label', 'Find a section');
    const list = el('div', 'le-library-list');
    const on = new Set();
    const open = new Set();
    const pageHtml = new Map();

    /**
     * Show the section itself under the row.
     *
     * A name alone ("Page heading", "Inside the stage") does not say what a
     * section looks like, and the design has dozens of them, so choosing from
     * the list was choosing blind: the first sight of a section was after it
     * had been added. The page it comes from is fetched once and kept, so
     * opening a second section from the same page costs nothing.
     */
    const showPreview = async (section, holder) => {
        holder.style.height = '';
        holder.replaceChildren(el('p', 'le-hint', 'Loading…'));

        try {
            if (!pageHtml.has(section.at)) pageHtml.set(section.at, await fetchPage(section.at));
            const markup = sectionMarkup(pageHtml.get(section.at), section.from);

            if (!markup) {
                holder.replaceChildren(el('p', 'le-hint', 'This section cannot be shown on its own. It will still be added.'));

                return;
            }

            const frame = el('iframe', 'le-library-frame');
            frame.setAttribute('sandbox', '');
            frame.style.width = `${FRAME.width}px`;
            frame.style.height = `${FRAME.height}px`;
            frame.style.transform = `scale(${FRAME.scale})`;
            frame.setAttribute('loading', 'lazy');
            frame.setAttribute('scrolling', 'no');
            frame.title = `${section.label}, as it looks on the site`;
            frame.srcdoc = previewDoc({ styles: styleHrefs(), markup });
            // The frame is laid out at full size and scaled down, and a transform does not
            // change what an element takes up, so the holder is told how tall the scaled
            // picture is. Set here rather than in the stylesheet, where it was being
            // overruled and the preview opened to nothing but its own borders.
            holder.style.height = `${Math.round(FRAME.height * FRAME.scale)}px`;
            holder.replaceChildren(frame);
        } catch {
            holder.replaceChildren(el('p', 'le-hint', 'The preview could not be loaded.'));
        }
    };

    const draw = () => {
        list.replaceChildren();
        const groups = grouped(library, search.value);

        if (!groups.length) {
            list.append(el('p', 'le-hint', 'No section by that name. Try a word from its heading.'));

            return;
        }

        for (const group of groups) {
            list.append(el('div', 'le-library-page', group.page));
            for (const section of group.sections) {
                const row = el('button', 'le-library-item');
                row.type = 'button';
                row.append(el('span', 'le-library-name', section.label));
                if (multiple) {
                    row.setAttribute('aria-pressed', on.has(section.from) ? 'true' : 'false');
                    row.append(el('span', 'le-library-mark', on.has(section.from) ? 'Added' : 'Add'));
                } else {
                    row.append(el('span', 'le-library-mark', 'Add here'));
                }
                row.addEventListener('click', () => {
                    if (multiple) {
                        on.has(section.from) ? on.delete(section.from) : on.add(section.from);
                        draw();
                    }
                    pick(section, [...on]);
                });

                // A section the host gave no page to is one we cannot show; the row still adds it.
                if (!section.at) {
                    list.append(row);

                    continue;
                }

                // The two are side by side, never nested: pressing "See it" must not add the section.
                const line = el('div', 'le-library-line');
                const holder = el('div', 'le-library-preview');
                const see = el('button', 'le-library-see', open.has(section.from) ? 'Hide it' : 'See it');
                see.type = 'button';
                see.setAttribute('aria-expanded', open.has(section.from) ? 'true' : 'false');
                see.title = `Look at "${section.label}" before you choose it`;
                see.addEventListener('click', () => {
                    open.has(section.from) ? open.delete(section.from) : open.add(section.from);
                    draw();
                });
                line.append(row, see);
                list.append(line, holder);
                if (open.has(section.from)) showPreview(section, holder);
            }
        }
    };

    search.addEventListener('input', draw);
    wrap.append(search, list);
    container.append(wrap);
    draw();

    return { chosen: () => [...on], focus: () => search.focus() };
}


/**
 * The kinds of page the design already has, to start a new page from.
 *
 * The host may say so outright (`config.starts`: each of the design's pages and
 * the sections it is made of, in order). Without that, the library is grouped
 * by the page each section is kept on, which is the same thing for every
 * section the design draws once.
 *
 * Pages that are made of exactly the same sections are one kind: sixteen
 * product pages are one choice ("Cedar Letter, and 15 like it"), not sixteen.
 */
export function startingPoints(config = {}) {
    const library = config.library ?? [];
    const known = new Set(library.map((section) => section.from));
    const hrefs = new Map((config.pages ?? []).map((page) => [page.id, page.href]));
    const given = Array.isArray(config.starts) && config.starts.length
        ? config.starts.map((start) => {
            // `own` is the same sections as the page has them (its heading says Headphones, not
            // About); a host that does not send it is copied by the library's names.
            const kept = (start.sections ?? []).map((from, i) => [from, start.own?.[i] ?? from]).filter(([from]) => known.has(from));

            return { id: start.id, title: start.title, sections: kept.map(([from]) => from), own: kept.map(([, own]) => own) };
        })
        : grouped(library).map((group) => ({ id: null, title: group.page, sections: group.sections.map((section) => section.from) }));

    const kinds = new Map();
    for (const start of given) {
        if (!start.sections.length) continue;
        const signature = start.sections.join('|');
        if (kinds.has(signature)) {
            kinds.get(signature).alike += 1;
            continue;
        }
        kinds.set(signature, {
            id: start.id,
            title: start.title,
            sections: start.sections,
            own: start.own ?? start.sections,
            alike: 0,
            at: start.id !== null && start.id !== undefined ? hrefs.get(start.id) ?? null : null,
        });
    }

    return [...kinds.values()];
}

/** A section's name as the library gives it. */
const labelOf = (library, from) => (library.find((section) => section.from === from) ?? {}).label ?? from;

/**
 * A page shown small: the real page, laid out at desktop width and scaled into
 * a card, so a kind of page is chosen by how it looks rather than by its name.
 * Nothing in it runs (the frame is sandboxed), and it loads only when the card
 * scrolls into view.
 */
function thumbnail(href, title, names = []) {
    const holder = el('div', 'le-start-thumb');
    if (!href) {
        // No page to show (a kind made of sections the host gave without a page):
        // its outline instead, one block for each section it starts with, named.
        holder.classList.add('is-outline');
        const page = el('div', 'le-outline');
        page.setAttribute('aria-hidden', 'true');
        page.append(el('span', 'le-outline-bar'));
        (names.length ? names : ['Your sections']).slice(0, 4).forEach((name, index) => {
            page.append(el('span', `le-outline-block${index === 0 ? ' is-first' : ''}`, name));
        });
        if (names.length > 4) page.append(el('span', 'le-outline-more', `+${names.length - 4} more`));
        holder.append(page);

        return holder;
    }
    const frame = el('iframe', 'le-start-frame');
    // Same origin, so the page's own stylesheets and pictures load (an opaque origin sends no
    // sign-in with them, and the editor's page was drawn blank); no scripts, so nothing runs.
    frame.setAttribute('sandbox', 'allow-same-origin');
    frame.setAttribute('loading', 'lazy');
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('aria-hidden', 'true');
    frame.title = title;
    frame.src = href;
    holder.append(frame);

    return holder;
}

/**
 * New page: two short steps in a window of its own.
 *
 *   1. What kind of page?  The design's own pages as pictures to choose from
 *      (or, for somebody who wants to, the sections one by one).
 *   2. What is it called?  A title; the address follows it; in the menu or not.
 *
 * It replaces a form that asked for a title and an address first and then for a
 * choice among every section of the design, which is the order a developer
 * thinks in. An owner thinks "a page like our Contact page, called Visit us".
 *
 * `ui` is the editor's modal handle (chrome.js `modal()`); `save(key, value)`
 * saves one setting; `go(href)` opens the page just made.
 */
export function renderNewPage({ ui, config, save, go, notify, offer = startingPoints }) {
    const library = config.library ?? [];
    const taken = config.taken ?? [];
    // `offer` narrows the kinds (pages-list.js startsOffered: never a checkout, a brand sheet or one product).
    const kinds = offer(config);
    // A page's own copy of a section (shop-headphones.intro) is named as the library names it (Page heading).
    const likeOf = new Map(kinds.flatMap((kind) => kind.own.map((own, i) => [own, kind.sections[i]])));
    const nameOf = (from) => labelOf(library, likeOf.get(from) ?? from);
    const state = { kind: null, sections: [], title: '', address: '', addressTouched: false, inMenu: true };

    const footer = (...buttons) => {
        ui.foot.replaceChildren(...buttons);
        ui.foot.hidden = !buttons.length;
    };
    const button = (text, className, onClick) => {
        const node = el('button', className, text);
        node.type = 'button';
        node.addEventListener('click', onClick);

        return node;
    };

    // ---- step 1: what kind of page --------------------------------------------
    const chooseKind = () => {
        ui.title('New page');
        ui.subtitle('Start from a page your design already has. You can change every word and photo afterwards.');
        footer();

        const grid = el('div', 'le-starts');
        const draw = (query = '') => {
            const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
            grid.replaceChildren();
            const shown = kinds.filter((kind) => {
                const haystack = `${kind.title} ${kind.sections.map((from) => labelOf(library, from)).join(' ')}`.toLowerCase();

                return words.every((word) => haystack.includes(word));
            });
            for (const kind of shown) {
                const card = el('button', 'le-start');
                card.type = 'button';
                const names = kind.sections.map((from) => labelOf(library, from));
                const count = `${names.length} ${names.length === 1 ? 'section' : 'sections'}`;
                card.setAttribute('aria-label', `A page like ${kind.title}: ${count}, ${listed(names)}`);
                const about = el('span', 'le-start-text');
                about.append(
                    el('span', 'le-start-name', kind.alike ? `${kind.title}, and ${kind.alike} like it` : kind.title),
                    el('span', 'le-start-meta', names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : listed(names)),
                );
                card.append(thumbnail(kind.at, kind.title, names), about);
                card.addEventListener('click', () => {
                    state.kind = kind;
                    // Copied as that page has them: its heading, its words.
                    state.sections = [...kind.own];
                    nameIt();
                });
                grid.append(card);
            }
            if (!shown.length) grid.append(el('p', 'le-hint le-starts-none', 'No page like that. Try a word from its name, or build it from sections.'));
            grid.append(own);
        };

        // The other way in, as a choice beside the pages rather than a line of small print.
        const own = el('button', 'le-start-own');
        own.type = 'button';
        own.append(
            el('span', 'le-start-own-plus', '+'),
            el('span', 'le-start-name', 'Build it from sections'),
            el('span', 'le-start-meta', 'Choose the sections yourself, one by one'),
        );
        own.addEventListener('click', chooseSections);

        const top = el('div', 'le-starts-top');
        if (kinds.length > 6) {
            const search = el('input', 'le-input le-starts-search');
            search.type = 'search';
            search.placeholder = 'Find a kind of page: contact, product, about…';
            search.setAttribute('aria-label', 'Find a kind of page');
            search.addEventListener('input', () => draw(search.value));
            top.append(search);
            setTimeout(() => search.focus(), 0);
        }
        ui.body.replaceChildren(...(top.childElementCount ? [top] : []), grid);
        draw();
    };

    // ---- step 1, the long way: sections one by one ------------------------------
    const chooseSections = () => {
        ui.title('Choose its sections');
        ui.subtitle('Pick the sections to start with, in any order. You can move them on the page afterwards.');
        const holder = el('div', 'le-starts-own');
        const next = button('Next', 'le-btn-publish', () => {
            state.kind = { id: null, title: 'Your own choice', sections: picker.chosen(), alike: 0, at: null };
            state.sections = picker.chosen();
            nameIt();
        });
        const back = button('Back', 'le-btn-outline', chooseKind);
        const count = el('span', 'le-modal-note');
        const picker = renderSectionBrowser({
            container: holder,
            library,
            multiple: true,
            onChange: (on) => {
                next.disabled = !on.length;
                count.textContent = on.length ? `${on.length} chosen` : 'Choose at least one';
            },
        });
        next.disabled = true;
        count.textContent = 'Choose at least one';
        ui.body.replaceChildren(holder);
        footer(count, back, next);
        picker.focus();
    };

    // ---- step 2: what is it called ---------------------------------------------
    const nameIt = () => {
        ui.title('Name your page');
        ui.subtitle(state.kind.id === null && state.kind.title === 'Your own choice'
            ? 'It starts with the sections you chose.'
            : `It starts like your ${state.kind.title} page.`);

        const form = el('div', 'le-name-page');

        const titleField = el('label', 'le-field', 'Page title');
        const title = el('input', 'le-input le-name-title');
        title.placeholder = 'Open days';
        title.maxLength = 120;
        title.value = state.title;
        titleField.append(title);

        // The address is worked out from the title and shown as a line, not as a
        // second field to fill in: almost nobody wants to choose it.
        const where = el('div', 'le-name-address');
        const whereText = el('span', 'le-name-address-text');
        const change = button('Change', 'le-link-btn', () => {
            addressRow.hidden = false;
            change.hidden = true;
            address.focus();
        });
        where.append(whereText, change);
        const addressRow = el('div', 'le-address');
        addressRow.hidden = !state.addressTouched;
        change.hidden = state.addressTouched;
        const address = el('input', 'le-input');
        address.setAttribute('aria-label', 'Page address');
        address.maxLength = 97;
        address.value = state.address;
        addressRow.append(el('span', 'le-address-origin', '/'), address);

        const menu = el('label', 'le-switch');
        const menuBox = el('input');
        menuBox.type = 'checkbox';
        menuBox.checked = state.inMenu;
        menu.append(menuBox, el('span', 'le-switch-track'), el('span', 'le-switch-label', 'Show it in the menu'));
        menuBox.addEventListener('change', () => { state.inMenu = menuBox.checked; });

        // What it starts with, each one removable here so a near miss ("like the
        // About page, without the team") is one click rather than a second visit.
        const sections = el('div', 'le-field le-name-sections', 'Starts with');
        const chips = el('div', 'le-chips');
        const drawChips = () => {
            chips.replaceChildren();
            state.sections.forEach((from) => {
                const chip = el('span', 'le-chip');
                chip.append(el('span', null, nameOf(from)));
                if (state.sections.length > 1) {
                    const remove = button('×', 'le-chip-x', () => {
                        state.sections = state.sections.filter((other) => other !== from);
                        drawChips();
                    });
                    remove.setAttribute('aria-label', `Leave out ${nameOf(from)}`);
                    chip.append(remove);
                }
                chips.append(chip);
            });
        };
        drawChips();
        sections.append(chips);

        form.append(titleField, where, addressRow, menu, sections);
        // What it will look like before any words change: the page it is copied from.
        const layout = el('div', 'le-name-layout');
        const look = el('div', 'le-name-look');
        const ownChoice = state.kind.title === 'Your own choice';
        look.append(
            thumbnail(state.kind.at, state.kind.title, state.sections.map((from) => nameOf(from))),
            el('p', 'le-hint', ownChoice
                ? 'Your new page starts with these sections, filled with your design\'s words and photos. Change any of them once it is open.'
                : `Your new page starts as a copy of ${state.kind.title}. Change any word or photo once it is open.`),
        );
        layout.append(form, look);
        ui.body.replaceChildren(layout);

        const waiting = el('span', 'le-modal-note le-create-waiting');
        const back = button('Back', 'le-btn-outline', () => {
            state.title = title.value;
            state.address = address.value;
            if (state.kind.title === 'Your own choice') chooseSections();
            else chooseKind();
        });
        const create = button('Create page', 'le-btn-publish le-create-page', async () => {
            const missing = refresh();
            if (missing) {
                notify(missing);

                return;
            }
            create.disabled = true;
            create.textContent = 'Creating…';
            ui.allowDismiss(false);
            try {
                const id = address.value;
                const added = {};
                for (const from of state.sections) added[newAddedId()] = from;
                await save(`structure:page:${id}`, JSON.stringify({ added }));
                await save(config.pagesKey, JSON.stringify([...(config.made ?? []), { id, title: title.value.trim(), menu: state.inMenu }]));
                go(`${config.editorBase}${id}`);
            } catch (error) {
                ui.allowDismiss(true);
                notify(error.message);
                create.textContent = 'Create page';
                refresh();
            }
        });
        footer(waiting, back, create);

        function refresh() {
            if (!state.addressTouched) address.value = slugFor(title.value);
            const problem = address.value ? addressProblem(address.value, taken) : null;
            whereText.textContent = address.value ? `Its address: /${address.value}` : 'Its address follows the title.';
            whereText.classList.toggle('le-hint--warn', Boolean(problem));
            if (problem) {
                whereText.textContent = problem;
                addressRow.hidden = false;
                change.hidden = true;
            }
            const missing = whyNotYet({ title: title.value, address: address.value, chosen: state.sections, taken });
            create.disabled = Boolean(missing);
            waiting.textContent = missing ?? '';
            create.title = missing ?? 'Make this page';

            return missing;
        }
        title.addEventListener('input', () => { state.title = title.value; refresh(); });
        title.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !create.disabled) create.click(); });
        address.addEventListener('input', () => {
            state.addressTouched = address.value !== '';
            state.address = address.value;
            refresh();
        });
        refresh();
        title.focus();
    };

    if (kinds.length) chooseKind();
    else chooseSections();

    return { kinds };
}

/**
 * Sections to choose from, seen as they are.
 *
 * The list on the left, the section itself on the right: chosen by how it
 * looks, at the size it will be, on a desktop or a phone. Pointing at a row
 * shows it; the button under the picture adds it. This replaces opening a small
 * preview under each row of a narrow list, where a section was a thumbnail
 * three rows tall and only one could be compared at a time.
 *
 * `add(section)` runs for the button under the picture. With `multiple`, the
 * button toggles and `chosen()` says which are on; `onChange(chosen)` follows.
 * The page each section is kept on is fetched once and kept.
 */
/**
 * A chart or a table drawn before it is chosen (owner, 7 Nov 2026: "should have a preview beyond text"): its markup
 * put off screen at the width it is shown at, drawn there by the site's own kit-data.js (loaded once from `script`),
 * and read back as drawn, so the sandboxed picture, which runs nothing, shows the chart and not its figures.
 */
const loadedScripts = new Map();
const loadScript = (src) => {
    if (!loadedScripts.has(src)) {
        loadedScripts.set(src, new Promise((resolve) => {
            const tag = document.createElement('script');
            tag.src = src;
            tag.onload = () => resolve(true);
            tag.onerror = () => resolve(false);
            document.head.append(tag);
        }));
    }

    return loadedScripts.get(src);
};
/** The pages a section is shown from, fetched once in a visit to the editor (renderSectionBrowser). */
const pagesFetched = new Map();

export async function drawnOffScreen(markup, width, script) {
    if (!window.kitData && script) await loadScript(script);
    if (!window.kitData?.draw) return markup;
    const box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    Object.assign(box.style, { position: 'fixed', left: '-30000px', top: '0', width: `${width}px`, visibility: 'hidden', pointerEvents: 'none' });
    box.innerHTML = markup;
    document.body.append(box);
    try {
        window.kitData.draw(box);
        for (let i = 0; i < 3; i++) await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise((resolve) => setTimeout(resolve, 120));

        return box.innerHTML;
    } finally {
        box.remove();
    }
}

export function renderSectionBrowser({ container, library, add, multiple = false, onChange = () => {}, fetchPage = (href) => fetch(href).then((r) => r.text()), actionLabel = 'Add this section', only = null, places = [], place = null, drawWith = null, upgrade = null }) {
    const wrap = el('div', 'le-browser');
    const side = el('div', 'le-browser-list');
    const search = el('input', 'le-input le-library-search');
    search.type = 'search';
    search.placeholder = 'Find a section: team, prices, questions...';
    search.setAttribute('aria-label', 'Find a section');
    const list = el('div', 'le-library-list');

    /*
     * The kinds of thing to add, one press each (owner, 7 Nov 2026: a form was found only by scrolling to the
     * bottom). "All", then each group of things not taken from a page (Forms, Charts and tables, Search), as the
     * builders owners know put their categories beside the list.
     */
    let showing = only;
    const kindGroups = [...new Set((library ?? []).filter((section) => section.kind).map((section) => section.page))]
        .sort((a, b) => Number((library ?? []).some((s) => s.page === b && s.kind === 'form')) - Number((library ?? []).some((s) => s.page === a && s.kind === 'form')));
    const tabs = el('div', 'le-library-kinds');
    tabs.setAttribute('role', 'group');
    tabs.setAttribute('aria-label', 'Show');
    const tabButtons = new Map();
    for (const [value, label] of [[null, 'All'], ...kindGroups.map((group) => [group, group])]) {
        const b = el('button', 'le-subtab', label);
        b.type = 'button';
        b.addEventListener('click', () => {
            showing = value;
            paintTabs();
            draw();
            const first = list.querySelector('.le-library-item');
            if (first) first.click();
        });
        tabButtons.set(value, b);
        tabs.append(b);
    }
    const paintTabs = () => tabButtons.forEach((b, value) => {
        b.classList.toggle('is-on', value === showing);
        b.setAttribute('aria-pressed', value === showing ? 'true' : 'false');
    });
    paintTabs();
    side.append(search, ...(kindGroups.length ? [tabs] : []), list);

    const stage = el('div', 'le-browser-stage');
    const stageHead = el('div', 'le-browser-head');
    const stageName = el('div', 'le-browser-name', 'Choose a section to see it');
    const stageFrom = el('div', 'le-browser-from');
    const sizes = el('div', 'le-browser-sizes');
    const sizeButtons = {};
    let size = 'desktop';
    for (const [key, label] of [['desktop', 'Desktop'], ['phone', 'Phone']]) {
        const b = el('button', 'le-subtab', label);
        b.type = 'button';
        b.addEventListener('click', () => { size = key; paintSize(); if (looking) show(looking); });
        sizeButtons[key] = b;
        sizes.append(b);
    }
    const titleBox = el('div');
    titleBox.append(stageName, stageFrom);
    stageHead.append(titleBox, sizes);
    const view = el('div', 'le-browser-view');
    const action = el('button', 'le-btn-publish le-browser-add', actionLabel);
    action.type = 'button';
    action.disabled = true;

    /*
     * Where it goes, said and changeable before it is added (owner, 7 Nov 2026: "where to add it is not
     * specified"): the top of the page, below any of its sections, or the end, starting where they pointed.
     */
    const foot = el('div', 'le-browser-foot');
    let whereTo = null;
    if (places.length) {
        const where = el('label', 'le-browser-where');
        where.append(el('span', null, 'Put it'));
        whereTo = el('select', 'le-input le-browser-where-pick');
        for (const option of places) {
            const o = el('option', null, option.label);
            o.value = option.value === null ? '' : option.value;
            // Beside another chart or table: offered only while a chart or a table is the one being looked at.
            if (option.chartsAndTables) {
                o.dataset.chartsAndTables = '';
                o.hidden = o.disabled = true;
            }
            whereTo.append(o);
        }
        whereTo.value = place === null ? '' : place;
        where.append(whereTo);
        foot.append(where);
    }
    /*
     * Why it cannot be added, said where the button is (owner, 7 Nov 2026: "add to section for chart is not
     * working"): with none left on the plan the save was refused and the message went to a toast behind this
     * window, so the button looked dead. As builders do it, the limit is said and the button offers the upgrade.
     */
    const note = el('p', 'le-browser-note');
    note.setAttribute('role', 'alert');
    note.hidden = true;
    const say = (message) => {
        note.textContent = String(message ?? '').trim();
        note.hidden = note.textContent === '';
    };
    foot.append(action);
    stage.append(stageHead, view, note, foot);
    wrap.append(side, stage);
    container.append(wrap);

    const on = new Set();
    const drawnCache = new Map();
    /*
     * Each section's page, fetched once and kept for the visit (owner, 7 Nov 2026: "sometimes you don't see the
     * preview on the right when you scroll the bottom left"): a page of the editor takes a second or more to make,
     * so the pages are fetched in the background as soon as the window opens, two at a time, in the list's order,
     * and a row pointed at fetches its page first. Choosing one then shows it at once.
     */
    const pageOf = (href) => {
        if (!pagesFetched.has(href)) pagesFetched.set(href, Promise.resolve(fetchPage(href)).catch(() => null));

        return pagesFetched.get(href);
    };
    const toFetch = [...new Set(grouped(library).flatMap((group) => group.sections).map((section) => section.at).filter(Boolean))];
    const fetchNext = async () => {
        while (toFetch.length) {
            const href = toFetch.shift();
            if (!pagesFetched.has(href)) await pageOf(href);
        }
    };
    setTimeout(() => { fetchNext(); fetchNext(); }, 0);
    // A chart's drawing script, loaded now so the first chart chosen is drawn without waiting for it.
    if (drawWith && (library ?? []).some((section) => KINDS[section.kind] || section.kind === 'table') && !window.kitData) loadScript(drawWith);
    let looking = null;

    const paintSize = () => Object.entries(sizeButtons).forEach(([key, b]) => b.classList.toggle('is-on', key === size));
    paintSize();

    const lockedNow = () => Boolean(looking?.locked) && !(multiple && on.has(looking.from));
    const paintAction = () => {
        if (!looking) return;
        const locked = lockedNow();
        action.disabled = locked && !upgrade;
        action.textContent = locked ? (upgrade ? 'Upgrade to add more' : 'None left on your plan')
            : multiple ? (on.has(looking.from) ? 'Remove from the page' : 'Add to the page') : actionLabel;
        action.classList.toggle('is-added', multiple && on.has(looking.from));
        say(locked ? (looking.locked_reason || 'Your plan has none of these left on this website.') : '');
    };

    const show = async (section) => {
        looking = section;
        if (whereTo) {
            const beside = aChartOrTable(section);
            whereTo.querySelectorAll('option[data-charts-and-tables]').forEach((o) => { o.hidden = o.disabled = !beside; });
            if (whereTo.selectedOptions[0]?.disabled) whereTo.value = place === null ? '' : place;
        }
        stageName.textContent = section.label;
        stageFrom.textContent = section.kind ? 'Drawn in your site’s own colours and type' : section.page ? `From your ${section.page} page` : '';
        paintAction();
        list.querySelectorAll('.le-library-item').forEach((row) => row.classList.toggle('is-looking', row.dataset.from === section.from));
        // A form (TheFormsAnOwnerAdds), a chart or a table: the thing itself as it will be added, then what it holds.
        if (section.preview) {
            const width = size === 'phone' ? 390 : 1280;
            let markup = section.preview;
            if ((KINDS[section.kind] || section.kind === 'table') && drawWith) {
                view.replaceChildren(el('p', 'le-hint', 'Drawing…'));
                const key = `${section.from}|${width}`;
                if (!drawnCache.has(key)) drawnCache.set(key, drawnOffScreen(section.preview, width, drawWith));
                markup = await drawnCache.get(key);
                if (looking !== section) return;
            }
            const room = Math.max(200, view.clientWidth - 2);
            const scale = Math.min(1, room / width);
            const frame = el('iframe', 'le-browser-frame');
            frame.setAttribute('sandbox', 'allow-same-origin');
            frame.setAttribute('scrolling', 'no');
            frame.title = `${section.label}, as it will look on the site`;
            frame.style.width = `${width}px`;
            frame.style.transform = `scale(${scale})`;
            frame.srcdoc = previewDoc({ styles: styleHrefs(), markup });
            const holder = el('div', `le-browser-shot is-${size}`);
            holder.style.width = `${Math.round(width * scale)}px`;
            holder.append(frame);
            frame.addEventListener('load', () => {
                const tall = frame.contentDocument?.body?.scrollHeight || 600;
                frame.style.height = `${tall}px`;
                holder.style.height = `${Math.round(tall * scale)}px`;
            });
            view.replaceChildren(holder, ...(section.kind ? kindSays(section.kind, section) : []).map((line) => el('p', 'le-hint', line)));

            return;
        }
        // A chart or a table (data-kit.js): what it holds and the rules it keeps, since it is not on any page yet.
        if (section.kind) {
            view.replaceChildren(...kindSays(section.kind, section).map((line) => el('p', 'le-hint', line)));

            return;
        }
        if (!section.at) {
            view.replaceChildren(el('p', 'le-hint', 'This section cannot be shown on its own. It can still be added.'));

            return;
        }
        view.replaceChildren(el('p', 'le-hint', 'Loading…'));
        try {
            const html = await pageOf(section.at);
            if (looking !== section) return;
            const markup = html === null ? null : sectionMarkup(html, section.from);
            if (!markup) {
                view.replaceChildren(el('p', 'le-hint', 'This section cannot be shown on its own. It can still be added.'));

                return;
            }
            const width = size === 'phone' ? 390 : 1280;
            const room = Math.max(200, view.clientWidth - 2);
            const scale = Math.min(1, room / width);
            const frame = el('iframe', 'le-browser-frame');
            frame.setAttribute('sandbox', 'allow-same-origin');
            frame.setAttribute('scrolling', 'no');
            frame.title = `${section.label}, as it looks on the site`;
            frame.style.width = `${width}px`;
            frame.style.transform = `scale(${scale})`;
            frame.srcdoc = previewDoc({ styles: styleHrefs(), markup });
            const holder = el('div', `le-browser-shot is-${size}`);
            holder.style.width = `${Math.round(width * scale)}px`;
            holder.append(frame);
            frame.addEventListener('load', () => {
                // As tall as the section is, scaled; a long section scrolls in the pane.
                const tall = frame.contentDocument?.body?.scrollHeight || 600;
                frame.style.height = `${tall}px`;
                holder.style.height = `${Math.round(tall * scale)}px`;
            });
            view.replaceChildren(holder);
        } catch {
            view.replaceChildren(el('p', 'le-hint', 'The preview could not be loaded.'));
        }
    };

    action.addEventListener('click', () => {
        if (!looking) return;
        if (lockedNow()) {
            // The billing page opens beside the editor, so nothing on this page is lost while they upgrade.
            if (upgrade) window.open(upgrade, '_blank', 'noopener');

            return;
        }
        if (multiple) {
            on.has(looking.from) ? on.delete(looking.from) : on.add(looking.from);
            draw();
            paintAction();
            onChange([...on]);
        } else {
            add(looking, whereTo ? (whereTo.value === '' ? null : whereTo.value) : undefined);
        }
    });

    const draw = () => {
        list.replaceChildren();
        const groups = grouped(library, search.value).filter((group) => showing === null || group.page === showing);
        if (!groups.length) {
            list.append(el('p', 'le-hint', 'No section by that name. Try a word from its heading.'));

            return;
        }
        for (const group of groups) {
            list.append(el('div', 'le-library-page', group.page));
            for (const section of group.sections) {
                const row = el('button', 'le-library-item');
                row.type = 'button';
                row.dataset.from = section.from;
                row.classList.toggle('is-looking', looking?.from === section.from);
                row.append(el('span', 'le-library-name', section.label));
                if (multiple && on.has(section.from)) row.append(el('span', 'le-library-mark', 'Added'));
                row.setAttribute('aria-pressed', multiple && on.has(section.from) ? 'true' : 'false');
                // The picture is of the row chosen (owner, 7 Nov 2026: "the right should preview what the left has
                // selected"): pointing at a row only lights it, so scrolling the list past others never changes it.
                row.addEventListener('focus', () => { if (looking !== section) show(section); });
                row.addEventListener('mouseenter', () => { if (section.at) pageOf(section.at); });
                row.addEventListener('click', () => show(section));
                list.append(row);
            }
        }
    };
    search.addEventListener('input', draw);
    draw();
    const first = grouped(library).find((group) => showing === null || group.page === showing)?.sections[0];
    if (first) show(first);

    return { chosen: () => [...on], focus: () => search.focus(), say };
}

/**
 * The address a page's relative links are written from.
 *
 * The host's, where it says (the builder's `base`): a hosted editor serves a page at
 * .../edit/services/exterior, without the closing slash the page's folder has on the
 * website, so "../polish/" resolved against the window lands a folder too high, and a card
 * linking there seemed to open no page. Otherwise the address it is given (the window's).
 */
export function pageBase(builder, fallback) {
    return typeof builder?.base === 'string' && builder.base !== '' ? builder.base : fallback;
}

/**
 * The page a card's link opens: the page whose address the link ends in (the
 * longest id that fits), or else the one it names (`data-link-page`, the Kit's
 * record of where the design's link goes). A card on a shop grid, a journal list or
 * a projects page leads to a detail page this way, and the editor can offer
 * that page from the card.
 */
export function pageOfLink(link, pages = [], base = 'http://localhost/') {
    // The address first: a card the owner pointed at a page they made opens that
    // page, whatever page the design's own data-link-page still names.
    const named = link?.dataset?.linkPage;
    const byName = named ? pages.find((page) => page.id === named) ?? null : null;
    let path;
    try {
        path = new URL(link?.getAttribute?.('href') ?? link, base).pathname.replace(/index\.html$/, '');
    } catch {
        return byName;
    }
    if (!path.endsWith('/')) path += '/';
    let best = null;
    for (const page of pages) {
        if (!page.id) continue;
        if (path.endsWith(`/${page.id}/`) && (!best || page.id.length > best.id.length)) best = page;
    }

    return best ?? byName;
}

/** An address not yet taken, from a title: "Fig Archive" → fig-archive, then fig-archive-2. */
export function freeAddress(title, taken = []) {
    const first = slugFor(title) || 'new-page';
    let id = first;
    for (let n = 2; addressProblem(id, taken); n += 1) id = `${first}-${n}`;

    return id;
}

/**
 * A card's link, pointed at a page the owner made: the same way up to the site
 * root (`../`), then that page's folder, which is where a made page is
 * published. "../products/arc/" becomes "../fig-archive/".
 */
export function hrefTo(oldHref, newId) {
    return `${(String(oldHref).match(/^(?:\.\.\/)*/) ?? [''])[0]}${newId}/`;
}

/**
 * What a card says about the thing it stands for: its name, its photo, its
 * price and its short description, read from the card as the owner sees it.
 * A copied card's own page (card-page.js) is given these where the card says
 * something its original's page does not, so the owner corrects a page that is
 * already theirs rather than one still describing another product.
 */
export function cardFacts(card) {
    const words = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const img = card.querySelector('img');
    const priced = card.querySelector('[data-kit-price], [data-field="price"]');

    return {
        name: words(card.querySelector('h1, h2, h3, h4')),
        photo: img ? (img.currentSrc || img.src || '') : '',
        price: words(priced),
        notes: words(card.querySelector('[data-field="notes"], [data-field="lead"], [data-field="k"]')),
    };
}

/**
 * Where those facts go on a page made from a detail page's sections: its
 * heading, its first picture, its price (the page's own, not a size's), and
 * its short description, each only where the owner could edit it.
 */
export function factTargets(root) {
    const editable = (el) => (el?.dataset?.edit?.startsWith('setting:') ? el : null);
    const prices = [...root.querySelectorAll('[data-price-out], [data-field="price"]')].filter((el) => !el.closest('[data-kit-variant]'));

    return {
        name: editable(root.querySelector('h1[data-edit]') ?? root.querySelector('h1 [data-edit]')),
        photo: root.querySelector('img[data-edit-img]'),
        price: editable(prices.find((el) => el.dataset.edit) ?? null),
        notes: editable(root.querySelector('[data-field="notes"][data-edit], [data-field="lead"][data-edit]')),
    };
}

/**
 * A shop's categories, as the owner thinks of them (LIVE-EDIT-STRUCTURE.md, "A shop's categories").
 *
 * The host finds them (`config.categories`): the design's pages the menu links to that list the
 * shop's products, and the ones the owner made like them. A new one is a page made like one of them,
 * named once: its heading, breadcrumb, tab title and menu link all say the name, and its menu link
 * goes beside the other categories. Nothing here asks what kind of page it is, or for its sections.
 *
 * `from` is the category being duplicated, or null for a new one; it then starts like the first
 * category that is not the parent of another (Headphones rather than All products).
 */
export const leafCategories = (categories = []) => categories.filter((one) => !categories.some((other) => other !== one && one.id !== '' && String(other.id).startsWith(`${one.id}/`)));

/**
 * What a new category starts like: a category, not the page that holds them all; one the menu links
 * where the menu has any (Women rather than Oxbow's gift guide); and of those the fullest, so it does
 * not start as Car Wash Auto's two gift cards. `products` and `inMenu` come from the host.
 */
export const firstLike = (categories = []) => {
    const leaves = leafCategories(categories);
    const linked = leaves.filter((category) => category.inMenu);
    const pool = linked.length ? linked : leaves.length ? leaves : categories;

    return pool.reduce((best, category) => ((category.products ?? 0) > (best?.products ?? 0) ? category : best), pool[0] ?? null);
};

export function renderNewCategory({ ui, config, from = null, save, go, notify, products = [], including = null }) {
    const categories = (config.categories ?? []).filter((category) => (category.copies ?? []).length);
    const taken = config.taken ?? [];
    let like = from ?? firstLike(categories);
    if (!like) {
        notify('This design has no collection to start one like.');
        ui.close?.();

        return null;
    }

    ui.title(from ? `Duplicate ${from.title}` : 'New collection');
    ui.subtitle(from ? 'A copy of this collection, with its products, under a new name.' : 'A page for a group of your products, linked from your menu.');

    const form = el('div', 'le-name-page le-new-category');
    const nameField = el('label', 'le-field', 'Name');
    const name = el('input', 'le-input le-name-title');
    name.placeholder = 'Cables';
    name.maxLength = 120;
    name.value = from ? `${from.title} 2` : '';
    nameField.append(name);
    const where = el('p', 'le-hint le-name-address');

    const parts = [nameField, where];
    let pick = null;
    if (!from && categories.length > 1) {
        const likeField = el('label', 'le-field', 'Looks like');
        pick = el('select', 'le-input le-category-like');
        for (const category of categories) {
            const option = el('option', null, category.title);
            option.value = category.id;
            pick.append(option);
        }
        pick.value = like.id;
        pick.addEventListener('change', () => {
            like = categories.find((category) => category.id === pick.value) ?? like;
            if (picker && !touched) picker.set(like.has ?? []);
            refresh();
        });
        likeField.append(pick);
        parts.push(likeField);
    }

    // Which products it shows: those of the collection it looks like, until the owner ticks otherwise; made for one
    // product (the Products grid's + New collection on its row), that product alone.
    let touched = Boolean(including);
    const picker = products.length && like.has ? productPicker({ products, ticked: including ? [including] : like.has, onChange: () => { touched = true; refresh(); } }) : null;
    const starts = el('p', 'le-hint le-category-starts');
    const menu = el('label', 'le-switch');
    const menuBox = el('input');
    menuBox.type = 'checkbox';
    // In the menu where the shop's categories are in it; Car Wash Auto's are reached from its shop page.
    const anyInMenu = categories.some((category) => category.inMenu);
    const told = categories.some((category) => typeof category.inMenu === 'boolean');
    menuBox.checked = from ? from.inMenu ?? true : !told || anyInMenu;
    menu.append(menuBox, el('span', 'le-switch-track'), el('span', 'le-switch-label', 'Show it in the menu'));
    parts.push(...(picker ? [picker.node] : [starts]), menu);
    form.append(...parts);
    ui.body.replaceChildren(form);

    const waiting = el('span', 'le-modal-note le-create-waiting');
    const create = el('button', 'le-btn-publish le-create-category', from ? 'Duplicate collection' : 'Create collection');
    create.type = 'button';

    function address() { return slugFor(name.value); }
    function refresh() {
        const id = address();
        const problem = id ? addressProblem(id, taken) : null;
        where.textContent = problem ?? (id ? `Its address: /${id}` : 'Its address follows the name.');
        where.classList.toggle('le-hint--warn', Boolean(problem));
        starts.textContent = `It starts as a copy of ${like.title}, with its products: change or remove them on the new page.`;
        const missing = !name.value.trim() ? 'Give the collection a name.'
            : picker && !picker.chosen().length ? 'Choose at least one product.'
            : whyNotYet({ title: name.value, address: id, chosen: like.copies, taken });
        create.disabled = Boolean(missing);
        waiting.textContent = missing ?? '';

        return missing;
    }

    create.addEventListener('click', async () => {
        if (refresh()) return;
        create.disabled = true;
        create.textContent = 'Creating…';
        ui.allowDismiss?.(false);
        try {
            const id = address();
            const added = {};
            for (const section of like.copies) added[newAddedId()] = section;
            await save(`structure:page:${id}`, JSON.stringify({ added }));
            if (picker && config.productsKey) await save(`${config.productsKey}${id}`, JSON.stringify(picker.chosen()));
            await save(config.pagesKey, JSON.stringify([...(config.made ?? []), { id, title: name.value.trim(), menu: menuBox.checked }]));
            go(`${config.editorBase}${id}`);
        } catch (error) {
            ui.allowDismiss?.(true);
            notify(error.message);
            create.textContent = from ? 'Duplicate collection' : 'Create collection';
            refresh();
        }
    });
    name.addEventListener('input', refresh);
    name.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !create.disabled) create.click(); });
    ui.foot.replaceChildren(waiting, create);
    ui.foot.hidden = false;
    refresh();
    setTimeout(() => { name.focus(); name.select(); }, 0);

    return { like: () => like };
}

/**
 * The shop's products as a list to tick (`products`: [{ id, name }], the Shop tab's own), with a
 * search above it once there are more than eight. `ticked` is what starts ticked.
 */
export function productPicker({ products = [], ticked = [], onChange = () => {} }) {
    const chosen = new Set(ticked.filter((id) => products.some((product) => product.id === id)));
    const box = el('div', 'le-field le-product-picker');
    const head = el('div', 'le-product-picker-head');
    const label = el('span', 'le-label', 'Products in it');
    const count = el('span', 'le-hint le-product-count');
    head.append(label, count);
    box.append(head);

    let search = null;
    if (products.length > 8) {
        search = el('input', 'le-input le-product-search');
        search.type = 'search';
        search.placeholder = 'Find a product';
        search.setAttribute('aria-label', 'Find a product');
        box.append(search);
    }

    const list = el('div', 'le-product-list');
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', 'Products in it');
    // What it shows first, then the rest by name; sorted once, so a row never jumps as it is ticked.
    const shown = [...products].sort((a, b) => Number(chosen.has(b.id)) - Number(chosen.has(a.id)) || a.name.localeCompare(b.name));
    const rows = shown.map((product) => {
        const row = el('label', 'le-product-row');
        const tick = el('input');
        tick.type = 'checkbox';
        tick.value = product.id;
        tick.checked = chosen.has(product.id);
        tick.addEventListener('change', () => {
            if (tick.checked) chosen.add(product.id); else chosen.delete(product.id);
            say();
            onChange([...chosen]);
        });
        row.append(tick, el('span', 'le-product-name', product.name));
        list.append(row);

        return { row, tick, product };
    });
    box.append(list);

    function say() {
        count.textContent = chosen.size === 1 ? '1 chosen' : `${chosen.size} chosen`;
    }
    search?.addEventListener('input', () => {
        const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        for (const { row, product } of rows) row.hidden = !words.every((word) => product.name.toLowerCase().includes(word));
    });
    say();

    return {
        node: box,
        // In the shop's order, whatever order they were ticked in.
        chosen: () => products.map((product) => product.id).filter((id) => chosen.has(id)),
        set(ids) {
            chosen.clear();
            for (const id of ids) chosen.add(id);
            for (const { tick, product } of rows) tick.checked = chosen.has(product.id);
            say();
        },
    };
}

/**
 * A category's products, ticked in and out (the Shop tab's Products beside a category). Saved as the
 * category's `productsKey`; its page then shows those products, each as the card the design draws
 * for it, and nothing it shows is lost: a product unticked is only left off this category.
 */
export function renderCategoryProducts({ ui, category, products = [], save, done, notify }) {
    ui.title(`Products in ${category.title}`);
    ui.subtitle('Tick the products this collection shows. A product left out stays in your shop.');
    const picker = productPicker({ products, ticked: category.has ?? [], onChange: () => refresh() });
    ui.body.replaceChildren(picker.node);

    const waiting = el('span', 'le-modal-note');
    const keep = el('button', 'le-btn-publish le-save-products', 'Save products');
    keep.type = 'button';
    function refresh() {
        const none = picker.chosen().length === 0;
        keep.disabled = none;
        waiting.textContent = none ? 'Choose at least one product.' : '';
    }
    keep.addEventListener('click', async () => {
        keep.disabled = true;
        keep.textContent = 'Saving…';
        try {
            await save(category.productsKey, JSON.stringify(picker.chosen()));
            done(`${category.title} now shows ${picker.chosen().length} ${picker.chosen().length === 1 ? 'product' : 'products'}.`);
        } catch (error) {
            notify(error.message);
            keep.textContent = 'Save products';
            refresh();
        }
    });
    ui.foot.replaceChildren(waiting, keep);
    ui.foot.hidden = false;
    refresh();

    return picker;
}
