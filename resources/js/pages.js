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
export function kindSays(kind) {
    if (kind === 'table') {
        return [
            'A table, for what is compared across columns: plans, fees, a timetable.',
            'You name the columns and fill the rows; add, move and delete either, or paste rows from a spreadsheet. On a phone each row reads as a card.',
            'It arrives with sample rows to replace.',
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
export function addedWith(added, id, from) {
    const next = { ...(added ?? {}) };
    if (from) next[id] = from;
    else delete next[id];

    return JSON.stringify({ added: next });
}

/** A page's section order with an added section placed after another (or last). */
export function orderWith(order, itemId, after = null) {
    const next = order.filter((id) => id !== itemId);
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

    return [...groups.entries()].map(([page, sections]) => ({ page, sections }));
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
    const named = (from) => (library.find((section) => section.from === from) ?? {}).label ?? from;
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

    if (!String(key ?? '').startsWith('structure:page:')) return null;

    const id = key.slice('structure:page:'.length);
    const title = (pages.find((page) => page.id === id) ?? {}).title ?? `/${id}`;
    const was = sectionsIn(before);
    const now = sectionsIn(after);
    const added = now.filter((name) => !was.includes(name));
    const removed = was.filter((name) => !now.includes(name));
    const said = [added.length ? `Added ${listed(added)}` : '', removed.length ? `Removed ${listed(removed)}` : '']
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
        ? config.starts.map((start) => ({ id: start.id, title: start.title, sections: (start.sections ?? []).filter((from) => known.has(from)) }))
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
function thumbnail(href, title) {
    const holder = el('div', 'le-start-thumb');
    if (!href) {
        holder.classList.add('is-empty');

        return holder;
    }
    const frame = el('iframe', 'le-start-frame');
    frame.setAttribute('sandbox', '');
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
export function renderNewPage({ ui, config, save, go, notify }) {
    const library = config.library ?? [];
    const taken = config.taken ?? [];
    const kinds = startingPoints(config);
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
                    el('span', 'le-start-meta', `${count} · ${names.slice(0, 3).join(', ')}${names.length > 3 ? '…' : ''}`),
                );
                card.append(thumbnail(kind.at, kind.title), about);
                card.addEventListener('click', () => {
                    state.kind = kind;
                    state.sections = [...kind.sections];
                    nameIt();
                });
                grid.append(card);
            }
            if (!shown.length) grid.append(el('p', 'le-hint', 'No page like that. Try a word from its name, or choose the sections yourself.'));
        };

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
        const own = button('Or choose the sections yourself', 'le-link-btn', chooseSections);
        top.append(own);

        ui.body.replaceChildren(top, grid);
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
                chip.append(el('span', null, labelOf(library, from)));
                if (state.sections.length > 1) {
                    const remove = button('×', 'le-chip-x', () => {
                        state.sections = state.sections.filter((other) => other !== from);
                        drawChips();
                    });
                    remove.setAttribute('aria-label', `Leave out ${labelOf(library, from)}`);
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
        if (state.kind.at) look.append(thumbnail(state.kind.at, state.kind.title), el('p', 'le-hint', `Your new page starts as a copy of ${state.kind.title}. Change any word or photo once it is open.`));
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
export function renderSectionBrowser({ container, library, add, multiple = false, onChange = () => {}, fetchPage = (href) => fetch(href).then((r) => r.text()), actionLabel = 'Add this section' }) {
    const wrap = el('div', 'le-browser');
    const side = el('div', 'le-browser-list');
    const search = el('input', 'le-input le-library-search');
    search.type = 'search';
    search.placeholder = 'Find a section: team, prices, questions...';
    search.setAttribute('aria-label', 'Find a section');
    const list = el('div', 'le-library-list');
    side.append(search, list);

    const stage = el('div', 'le-browser-stage');
    const stageHead = el('div', 'le-browser-head');
    const stageName = el('div', 'le-browser-name', 'Point at a section to see it');
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
    stage.append(stageHead, view, action);
    wrap.append(side, stage);
    container.append(wrap);

    const on = new Set();
    const pageHtml = new Map();
    let looking = null;

    const paintSize = () => Object.entries(sizeButtons).forEach(([key, b]) => b.classList.toggle('is-on', key === size));
    paintSize();

    const paintAction = () => {
        if (!looking) return;
        action.disabled = false;
        action.textContent = multiple ? (on.has(looking.from) ? 'Remove from the page' : 'Add to the page') : actionLabel;
        action.classList.toggle('is-added', multiple && on.has(looking.from));
    };

    const show = async (section) => {
        looking = section;
        stageName.textContent = section.label;
        stageFrom.textContent = section.kind ? 'Drawn in your site’s own colours and type' : section.page ? `From your ${section.page} page` : '';
        paintAction();
        list.querySelectorAll('.le-library-item').forEach((row) => row.classList.toggle('is-looking', row.dataset.from === section.from));
        // A chart or a table (data-kit.js): what it holds and the rules it keeps, since it is not on any page yet.
        if (section.kind) {
            view.replaceChildren(...kindSays(section.kind).map((line) => el('p', 'le-hint', line)));

            return;
        }
        if (!section.at) {
            view.replaceChildren(el('p', 'le-hint', 'This section cannot be shown on its own. It can still be added.'));

            return;
        }
        view.replaceChildren(el('p', 'le-hint', 'Loading…'));
        try {
            if (!pageHtml.has(section.at)) pageHtml.set(section.at, await fetchPage(section.at));
            if (looking !== section) return;
            const markup = sectionMarkup(pageHtml.get(section.at), section.from);
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
        if (multiple) {
            on.has(looking.from) ? on.delete(looking.from) : on.add(looking.from);
            draw();
            paintAction();
            onChange([...on]);
        } else {
            add(looking);
        }
    });

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
                row.dataset.from = section.from;
                row.classList.toggle('is-looking', looking?.from === section.from);
                row.append(el('span', 'le-library-name', section.label));
                if (multiple && on.has(section.from)) row.append(el('span', 'le-library-mark', 'Added'));
                row.setAttribute('aria-pressed', multiple && on.has(section.from) ? 'true' : 'false');
                row.addEventListener('mouseenter', () => { if (looking !== section) show(section); });
                row.addEventListener('focus', () => { if (looking !== section) show(section); });
                row.addEventListener('click', () => show(section));
                list.append(row);
            }
        }
    };
    search.addEventListener('input', draw);
    draw();
    const first = library?.[0];
    if (first) show(first);

    return { chosen: () => [...on], focus: () => search.focus() };
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
