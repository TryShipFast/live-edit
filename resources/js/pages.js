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

/**
 * The library as a list to choose from: a search field, then each page's
 * sections under its name. `pick(section)` runs for a section chosen; with
 * `multiple`, sections toggle and `chosen()` says which are on.
 */
export function renderLibrary({ container, library, pick, multiple = false }) {
    const wrap = el('div', 'le-library');
    const search = el('input', 'le-input le-library-search');
    search.type = 'search';
    search.placeholder = 'Find a section: team, prices, questions...';
    search.setAttribute('aria-label', 'Find a section');
    const list = el('div', 'le-library-list');
    const on = new Set();

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
                list.append(row);
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
 * The Pages tab: every page of the website, and a way to make another.
 *
 * `save(key, value)` saves one setting; `go(href)` opens a page in the editor.
 */
export function renderPagesPanel({ container, config, save, go, notify }) {
    container.replaceChildren();

    const intro = el('p', 'le-hint le-sitemap-intro', 'Every page of your website. A new page is built from sections your design already has, so it looks like the rest of the site.');
    container.append(intro);

    const list = el('div', 'le-sitemap');
    for (const page of config.pages ?? []) {
        const row = el('a', 'le-sitemap-row');
        row.href = page.href;
        if (page.id === config.page) row.setAttribute('aria-current', 'page');
        const words = el('span', 'le-sitemap-words');
        words.append(el('span', 'le-sitemap-title', page.title), el('span', 'le-sitemap-address', `/${page.id}`));
        row.append(words);
        if (page.id === config.page) row.append(el('span', 'le-sitemap-tag', 'This page'));
        else if (page.made) row.append(el('span', 'le-sitemap-tag le-sitemap-tag--yours', 'Yours'));
        row.addEventListener('click', (event) => {
            event.preventDefault();
            go(page.href);
        });
        list.append(row);
    }
    container.append(list);

    // ---- a new page --------------------------------------------------------
    container.append(el('div', 'le-section-heading', 'Add a page'));

    const titleField = el('label', 'le-field', 'Page title');
    const title = el('input', 'le-input');
    title.placeholder = 'Open days';
    title.maxLength = 120;
    titleField.append(title);

    const addressField = el('label', 'le-field', 'Address');
    const addressRow = el('div', 'le-address');
    const origin = el('span', 'le-address-origin', '/');
    const address = el('input', 'le-input');
    address.placeholder = 'open-days';
    address.maxLength = 97;
    addressRow.append(origin, address);
    const addressHint = el('span', 'le-hint');
    addressField.append(addressRow, addressHint);

    let addressTouched = false;
    title.addEventListener('input', () => {
        if (!addressTouched) address.value = slugFor(title.value);
        refresh();
    });
    address.addEventListener('input', () => {
        addressTouched = address.value !== '';
        refresh();
    });

    const sectionsField = el('div', 'le-field', 'Start it with');
    const sectionsHint = el('span', 'le-hint', 'Choose one or more. You can add, move and hide sections on the page afterwards.');
    sectionsField.append(sectionsHint);
    const library = renderLibrary({ container: sectionsField, library: config.library, multiple: true, pick: () => refresh() });

    const create = el('button', 'le-btn-publish le-create-page', 'Create page');
    create.type = 'button';
    const actions = el('div', 'le-row le-sitemap-actions');
    actions.append(create);

    container.append(titleField, addressField, sectionsField, actions);

    const taken = config.taken ?? [];
    function refresh() {
        const problem = address.value ? addressProblem(address.value, taken) : null;
        addressHint.textContent = problem ?? (address.value ? `Visitors will find it at /${address.value}` : '');
        addressHint.classList.toggle('le-hint--warn', Boolean(problem));
        create.disabled = !title.value.trim() || Boolean(addressProblem(address.value, taken)) || library.chosen().length === 0;
    }
    refresh();

    create.addEventListener('click', async () => {
        const id = address.value;
        const problem = addressProblem(id, taken);
        if (problem || !title.value.trim()) {
            notify(problem ?? 'Give the page a title.');

            return;
        }

        create.disabled = true;
        create.textContent = 'Creating…';
        try {
            const added = {};
            for (const from of library.chosen()) added[newAddedId()] = from;
            await save(`structure:page:${id}`, JSON.stringify({ added }));
            await save(config.pagesKey, JSON.stringify([...(config.made ?? []), { id, title: title.value.trim() }]));
            go(`${config.editorBase}${id}`);
        } catch (error) {
            notify(error.message);
            create.textContent = 'Create page';
            refresh();
        }
    });

    return { focus: () => title.focus() };
}
