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
        const row = el('div', 'le-sitemap-row');
        const open = el('a', 'le-sitemap-open');
        open.href = page.href;
        if (page.id === config.page) open.setAttribute('aria-current', 'page');
        const words = el('span', 'le-sitemap-words');
        words.append(el('span', 'le-sitemap-title', page.title), el('span', 'le-sitemap-address', `/${page.id}`));
        open.append(words);
        if (page.id === config.page) open.append(el('span', 'le-sitemap-tag', 'This page'));
        else if (page.made) open.append(el('span', 'le-sitemap-tag le-sitemap-tag--yours', 'Yours'));
        open.addEventListener('click', (event) => {
            event.preventDefault();
            go(page.href);
        });
        row.append(open);

        // A page the owner made goes in the site's menus, or comes out, with one press.
        const mine = (config.made ?? []).find((made) => made.id === page.id);
        if (mine) {
            const menu = el('button', 'le-sitemap-menu', mine.menu ? 'In the menu' : 'Add to menu');
            menu.type = 'button';
            menu.setAttribute('aria-pressed', mine.menu ? 'true' : 'false');
            menu.title = mine.menu ? 'Take this page out of the menu' : 'Show this page in the menu';
            menu.addEventListener('click', async () => {
                menu.disabled = true;
                try {
                    await save(config.pagesKey, JSON.stringify(withMenu(config.made, page.id, !mine.menu)));
                    go(window.location.href);
                } catch (error) {
                    notify(error.message);
                    menu.disabled = false;
                }
            });
            row.append(menu);
        }
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
    // A composed page shows only the sections chosen, so one that starts with a heading is
    // one that says its own name. We say so rather than adding a heading for them: the
    // heading would arrive carrying the words of the page it was taken from, and a page
    // announcing itself as another page is the thing this panel should not produce.
    const sectionsHint = el('span', 'le-hint', 'Choose one or more. Starting with a heading gives the page its name at the top. You can add, move and hide sections afterwards.');
    sectionsField.append(sectionsHint);
    const library = renderLibrary({ container: sectionsField, library: config.library, multiple: true, pick: () => refresh() });

    const inMenu = el('label', 'le-default le-in-menu');
    const inMenuBox = el('input');
    inMenuBox.type = 'checkbox';
    inMenuBox.checked = true;
    inMenu.append(inMenuBox, document.createTextNode('Show it in the menu'));

    const create = el('button', 'le-btn-publish le-create-page', 'Create page');
    create.type = 'button';
    const waiting = el('span', 'le-hint le-create-waiting');
    const actions = el('div', 'le-row le-sitemap-actions');
    actions.append(waiting, create);

    container.append(titleField, addressField, sectionsField, inMenu, actions);

    const taken = config.taken ?? [];
    function refresh() {
        const problem = address.value ? addressProblem(address.value, taken) : null;
        addressHint.textContent = problem ?? (address.value ? `Visitors will find it at /${address.value}` : '');
        addressHint.classList.toggle('le-hint--warn', Boolean(problem));

        const missing = whyNotYet({ title: title.value, address: address.value, chosen: library.chosen(), taken });
        create.disabled = Boolean(missing);
        // Said beside the button rather than only where the problem is, because the
        // button is what they are looking at when they find they cannot press it.
        waiting.textContent = missing ?? '';
        waiting.hidden = !missing;
        create.title = missing ?? 'Make this page';
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
            await save(config.pagesKey, JSON.stringify([...(config.made ?? []), { id, title: title.value.trim(), menu: inMenuBox.checked }]));
            go(`${config.editorBase}${id}`);
        } catch (error) {
            notify(error.message);
            create.textContent = 'Create page';
            refresh();
        }
    });

    return { focus: () => title.focus() };
}
