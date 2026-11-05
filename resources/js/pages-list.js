/*
 * The Pages list: every page of the website in one panel, in the order the menu shows them, the way
 * Wix ("Pages & Menu"), Squarespace ("Pages") and WordPress ("Pages") list them. From each row: open
 * it, rename it, show it in the menu or not, move it up or down the menu (drag, or the arrow buttons
 * from a keyboard), duplicate it and delete it, where the host allows; "Add page" at the top opens New
 * page (pages.js). CONVENTIONS.md section 5, change 5.
 *
 * Nothing here keeps a list of its own. What it changes is what the host already stores
 * (LIVE-EDIT-STRUCTURE.md section 7, the engine's README "Page builder contract"):
 *
 *   structure:pages     the owner's pages, in menu order, each with its title and whether it is in the menu
 *   structure:page:<id> the sections a page the owner made starts with (for a duplicate)
 *   structure:removed   the design's own pages the owner deleted (`removedKey`, where the host gives it)
 *
 * The design's own pages keep their titles and their place in the menu: the design draws its menu,
 * and no setting moves or renames an entry the design wrote (README, "Pages list: what the host
 * decides"). Their rows say so rather than offering buttons that would do nothing.
 *
 * Pages a website needs but nobody puts in a menu (a checkout, a bag, search results, a brand sheet,
 * a 404, a privacy notice) and the record pages of a collection (a product, a post) are listed apart,
 * marked "Not in menu", and are never offered as a kind of page to start a new one from.
 */

import { freeAddress, newAddedId, pageOfLink, startingPoints } from './pages.js';

/** Pages a website needs and nobody puts in a menu, by the last part of their address. */
const INTERNAL = new Set([
    'brand', 'checkout', 'bag', 'cart', 'basket', 'search', 'search-results', 'results', '404', 'not-found',
    'thank-you', 'thanks', 'order-received', 'order-confirmed', 'confirmation', 'account', 'login', 'sign-in',
]);
/** Notices a website keeps for the law: listed, not in the menu, never a kind of page to copy. */
const LEGAL = new Set(['privacy', 'privacy-policy', 'privacy-notice', 'terms', 'terms-and-conditions', 'terms-of-service', 'cookies', 'cookie-policy', 'legal', 'disclaimer']);
/** Folders whose pages are one record each: a product, a post, a story. */
const RECORDS = new Set(['products', 'product', 'journal', 'blog', 'news', 'posts', 'post', 'articles', 'perspectives', 'records', 'parts', 'items', 'events', 'stories', 'insights', 'updates']);

/**
 * What kind of page this is: 'page' (an ordinary page of the website), 'internal' (one a website needs
 * that nobody puts in a menu), 'legal' (a privacy notice, terms) or 'record' (a product, a post). A
 * host that knows says so (`kind` on the page); otherwise it is read from the address and title.
 */
export function pageKind(page = {}) {
    if (['page', 'internal', 'legal', 'record'].includes(page.kind)) return page.kind;
    if (page.internal === true) return 'internal';
    if (page.catalogue) return 'record';
    const id = String(page.id ?? '');
    const last = id.split('/').pop();
    if (INTERNAL.has(last) || /^(your )?(bag|basket|cart|checkout|brand)$/i.test(String(page.title ?? '').trim())) return 'internal';
    if (LEGAL.has(last)) return 'legal';
    if (id.includes('/') && RECORDS.has(id.split('/')[0])) return 'record';

    return 'page';
}

/** Whether a page may be offered as a kind of page to start a new one from. */
export const aPageToStartFrom = (page) => page?.id === null || page?.id === undefined || pageKind(page) === 'page';

/** The kinds of page New page offers: never a checkout, a bag, a brand sheet, a notice or one record. */
export function startsOffered(config = {}) {
    const all = startingPoints(config);
    const offered = all.filter((kind) => aPageToStartFrom({ id: kind.id, title: kind.title }));

    return offered.length ? offered : all;
}

/**
 * The menu the website shows, as the pages its links open, in order. The design's main menu
 * (data-kit-menu, not a shop's row of categories and not the phone copy of the same menu), or else
 * the header's navigation.
 */
export function menuOrder(doc, pages = [], base = doc?.baseURI) {
    const menus = [...doc.querySelectorAll('[data-kit-menu]')].filter((menu) => !['categories', 'phone'].includes(menu.getAttribute('data-kit-menu')));
    const menu = menus.find((one) => one.getAttribute('data-kit-menu') === 'main') ?? menus[0] ?? doc.querySelector('header nav') ?? doc.querySelector('nav');
    if (!menu) return [];
    const ids = [];
    for (const link of menu.querySelectorAll('a[href]')) {
        const page = pageOfLink(link, pages, base);
        if (page && !ids.includes(page.id)) ids.push(page.id);
    }

    return ids;
}

/** The owner's pages as the host stores them: id, title and menu, nothing else (WhatTheOwnerArranged::permits). */
export const stored = (made = []) => made.map(({ id, title, menu }) => ({ id, title, menu: menu === true }));

/** The owner's pages with one renamed. */
export const renamed = (made, id, title) => made.map((page) => (page.id === id ? { ...page, title: String(title).trim().slice(0, 120) } : page));

/**
 * The owner's pages with the ones in the menu put in a new order (`ids`, those pages only); the ones
 * not in the menu keep their places.
 */
export function reordered(made, ids) {
    const queue = ids.filter((id) => made.some((page) => page.id === id));
    const moving = new Set(queue);

    return made.map((page) => {
        if (!moving.has(page.id)) return page;
        const next = queue.shift();

        return made.find((other) => other.id === next);
    });
}

/** The owner's pages with one moved a step up (-1) or down (+1) among those in the menu. */
export function movedBy(made, id, by) {
    const inMenu = made.filter((page) => page.menu).map((page) => page.id);
    const at = inMenu.indexOf(id);
    const to = at + by;
    if (at === -1 || to < 0 || to >= inMenu.length) return made;
    const next = [...inMenu];
    [next[at], next[to]] = [next[to], next[at]];

    return reordered(made, next);
}

/**
 * Every page as a row of the list, in the menu's order, each with what can be done to it here.
 *
 * `menu` is menuOrder() of the page being edited. The groups: the menu (Home first, then as the menu
 * shows them), the other pages, and the pages a website needs that are not in a menu.
 */
export function pageRows(config = {}, menu = []) {
    const made = config.made ?? [];
    const removable = Boolean(config.removedKey);
    const starts = new Map((config.starts ?? []).map((start) => [start.id, start]));
    const drawnProducts = new Set((config.catalogue?.drawn ?? []).map((product) => product.href));
    const rows = (config.pages ?? []).map((page) => {
        const mine = made.find((entry) => entry.id === page.id) ?? null;
        const kind = drawnProducts.has(page.href) ? 'record' : pageKind(page);
        const home = page.id === '';
        const inMenu = home || (mine ? mine.menu === true : menu.includes(page.id));
        // The sections a copy starts with: the design's page as its starting point has them, or the
        // page the owner made, where the host hands over what it holds (or it is the page open now).
        const added = mine ? (mine.added ?? (page.id === config.page ? config.added : null)) : null;
        const sections = mine ? (added ? Object.values(added) : null) : (starts.get(page.id)?.own ?? starts.get(page.id)?.sections ?? null);

        return {
            id: page.id,
            title: home ? (page.title || 'Home') : page.title,
            href: page.href,
            here: page.id === config.page,
            made: Boolean(mine),
            home,
            kind,
            inMenu,
            canRename: Boolean(mine) && kind === 'page',
            canHide: Boolean(mine) && kind === 'page',
            canMove: Boolean(mine) && mine.menu === true && kind === 'page',
            canDuplicate: kind === 'page' && Array.isArray(sections) && sections.length > 0 && Boolean(config.pagesKey),
            canDelete: kind === 'page' && !home && (Boolean(mine) || (removable && page.id !== '404')),
            sections: sections ?? [],
        };
    });

    /*
     * The order: the menu as drawn, with the owner's pages in the order they are now stored (moving one
     * here is shown at once, before the page is drawn again); one put in the menu and not drawn there
     * yet comes after the rest.
     */
    const madeIds = new Set(made.map((entry) => entry.id));
    const queue = made.filter((entry) => entry.menu === true).map((entry) => entry.id);
    const order = menu
        .filter((id) => !madeIds.has(id) || queue.includes(id))
        .map((id) => (madeIds.has(id) ? queue.shift() : id));
    order.push(...queue);
    const position = (row) => (row.home ? -1 : (order.indexOf(row.id) === -1 ? order.length : order.indexOf(row.id)));
    const inMenu = rows.filter((row) => row.inMenu && row.kind === 'page').sort((a, b) => position(a) - position(b));
    const others = rows.filter((row) => !row.inMenu && row.kind === 'page');
    const needed = rows.filter((row) => row.kind !== 'page');

    return { inMenu, others, needed };
}

/** A copy of a page: a free address, "<title> (copy)", the same sections, not in the menu until asked. */
export function duplicateOf(row, config = {}, random = Math.random) {
    const title = `${row.title} (copy)`.slice(0, 120);
    const id = freeAddress(`${row.title} copy`, config.taken ?? []);
    const added = {};
    for (const from of row.sections) added[newAddedId(random)] = from;

    return { id, title, added };
}

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
};

/**
 * The Pages panel, drawn in the editor's modal (`ui`, chrome.js modal()).
 *
 *   save(key, value)   saves one setting (a draft, like every other change)
 *   go(href)           opens a page (the editor asks first if anything is unsaved)
 *   addPage()          opens New page
 *   ask({ title, subtitle, yes, no, danger })  resolves true for yes
 *   menu               the page ids the menu links, in order (menuOrder)
 */
export function renderPagesList({ ui, config, menu = [], save, go, addPage, ask, notify = () => {} }) {
    ui.title('Pages');
    ui.subtitle('Your website’s pages, in the order your menu shows them.');

    const wrap = el('div', 'le-pages');
    const top = el('div', 'le-pages-top');
    const add = el('button', 'le-btn-publish le-pages-add', '+ Add page');
    add.type = 'button';
    add.addEventListener('click', () => addPage());
    top.append(add);

    const status = el('p', 'le-hint le-pages-status');
    status.setAttribute('role', 'status');
    const reload = el('button', 'le-link-btn le-pages-reload', 'Reload to see it');
    reload.type = 'button';
    reload.hidden = true;
    reload.addEventListener('click', () => go(window.location.href));
    const said = el('div', 'le-pages-said');
    said.append(status, reload);

    const lists = el('div', 'le-pages-lists');
    wrap.append(top, said, lists);
    ui.body.replaceChildren(wrap);
    ui.foot.hidden = true;

    let busy = false;
    let renaming = null;
    let dragging = null;

    const tell = (words, menuChanged = false) => {
        status.textContent = words;
        reload.hidden = !menuChanged;
    };

    /** Save the owner's pages (and anything with them), then draw the list again. */
    const keep = async (made, words, { menuChanged = false, before = [] } = {}) => {
        if (busy) return false;
        busy = true;
        try {
            for (const [key, value] of before) await save(key, value);
            await save(config.pagesKey, JSON.stringify(stored(made)));
            config.made = made;
            config.pages = (config.pages ?? []).map((page) => {
                const mine = made.find((entry) => entry.id === page.id);

                return mine ? { ...page, title: mine.title } : page;
            });
            tell(words, menuChanged);

            return true;
        } catch (error) {
            notify(error?.message || 'That could not be saved. Try again.');

            return false;
        } finally {
            busy = false;
            draw();
        }
    };

    const chip = (text, className, onClick, label) => {
        const button = el('button', `le-chip-btn ${className}`.trim(), text);
        button.type = 'button';
        if (label) button.setAttribute('aria-label', label);
        button.addEventListener('click', onClick);

        return button;
    };

    const rowOf = (row, list, movable) => {
        const item = el('li', `le-page-row${row.here ? ' is-here' : ''}`);
        item.dataset.page = row.id;
        const line = el('div', 'le-page-line');

        if (row.canMove) {
            const handle = el('span', 'le-page-handle', '⠿');
            handle.setAttribute('aria-hidden', 'true');
            handle.title = 'Drag to move it in the menu';
            line.append(handle);
            item.draggable = true;
            item.addEventListener('dragstart', (event) => {
                dragging = row.id;
                item.classList.add('is-dragging');
                event.dataTransfer?.setData('text/plain', row.id);
                if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
            });
            item.addEventListener('dragend', () => { dragging = null; item.classList.remove('is-dragging'); });
            item.addEventListener('dragover', (event) => {
                if (!dragging || dragging === row.id) return;
                event.preventDefault();
                if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
            });
            item.addEventListener('drop', (event) => {
                event.preventDefault();
                const from = dragging || event.dataTransfer?.getData('text/plain');
                dragging = null;
                if (!from || from === row.id) return;
                const ids = movable.map((one) => one.id).filter((id) => id !== from);
                const at = ids.indexOf(row.id);
                const downwards = movable.findIndex((one) => one.id === from) < movable.findIndex((one) => one.id === row.id);
                ids.splice(downwards ? at + 1 : at, 0, from);
                const title = movable.find((one) => one.id === from)?.title ?? 'The page';
                keep(reordered(config.made, ids), `${title} moved. Your menu shows the new order once it is published.`, { menuChanged: true });
            });
        }

        const name = el('div', 'le-page-name');
        if (renaming === row.id) {
            const input = el('input', 'le-input le-page-rename');
            input.value = row.title;
            input.maxLength = 120;
            input.setAttribute('aria-label', `New name for ${row.title}`);
            const done = chip('Save', 'le-page-rename-save', () => finish(true));
            const stop = chip('Cancel', 'le-page-rename-cancel', () => finish(false));
            const finish = (yes) => {
                const title = input.value.trim();
                renaming = null;
                if (!yes || !title || title === row.title) {
                    draw();

                    return;
                }
                keep(renamed(config.made, row.id, title), `Renamed to ${title}.`, { menuChanged: row.inMenu });
            };
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') { event.preventDefault(); finish(true); }
                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(false); }
            });
            name.append(input, done, stop);
            setTimeout(() => { input.focus(); input.select(); }, 0);
        } else {
            name.append(el('span', 'le-page-title', row.title));
            if (row.here) name.append(el('span', 'le-page-badge is-here', 'You are here'));
            if (row.home) name.append(el('span', 'le-page-badge', 'Home'));
            if (!row.inMenu) name.append(el('span', 'le-page-badge is-quiet', 'Not in menu'));
        }
        line.append(name);

        const open = chip('Open', 'le-page-open', () => go(row.href), `Open ${row.title}`);
        if (row.here) open.disabled = true;
        line.append(open);
        item.append(line);

        const actions = el('div', 'le-page-actions');
        if (row.canMove) {
            const at = movable.findIndex((one) => one.id === row.id);
            const up = chip('↑', 'le-page-up', () => keep(movedBy(config.made, row.id, -1), `${row.title} moved up.`, { menuChanged: true }), `Move ${row.title} up`);
            const down = chip('↓', 'le-page-down', () => keep(movedBy(config.made, row.id, 1), `${row.title} moved down.`, { menuChanged: true }), `Move ${row.title} down`);
            up.disabled = at <= 0;
            down.disabled = at === -1 || at >= movable.length - 1;
            actions.append(up, down);
        }
        if (row.canRename && renaming !== row.id) {
            actions.append(chip('Rename', 'le-page-rename-btn', () => { renaming = row.id; draw(); }, `Rename ${row.title}`));
        }
        if (row.canHide) {
            const label = el('label', 'le-switch le-page-menu');
            const box = el('input');
            box.type = 'checkbox';
            box.checked = row.inMenu;
            box.setAttribute('aria-label', `Show ${row.title} in the menu`);
            box.addEventListener('change', () => {
                const next = config.made.map((page) => (page.id === row.id ? { ...page, menu: box.checked } : page));
                keep(next, box.checked ? `${row.title} is in the menu.` : `${row.title} is out of the menu. The page is still there.`, { menuChanged: true });
            });
            label.append(box, el('span', 'le-switch-track'), el('span', 'le-switch-label', 'In menu'));
            actions.append(label);
        }
        if (row.canDuplicate) {
            actions.append(chip('Duplicate', 'le-page-duplicate', async () => {
                const copy = duplicateOf(row, config);
                const ok = await keep([...config.made, { id: copy.id, title: copy.title, menu: false }], `${copy.title} made. It is not in the menu yet.`, {
                    before: [[`structure:page:${copy.id}`, JSON.stringify({ added: copy.added })]],
                });
                if (ok) {
                    config.taken = [...(config.taken ?? []), copy.id];
                    config.pages = [...config.pages, { id: copy.id, title: copy.title, href: `${config.editorBase}${copy.id}`, made: true }];
                    draw();
                }
            }, `Duplicate ${row.title}`));
        }
        if (row.canDelete) {
            actions.append(chip('Delete', 'le-page-delete', async () => {
                const yes = await ask({
                    title: `Delete ${row.title}?`,
                    subtitle: row.made
                        ? 'The page and its words go, and it leaves your menu. Until you publish, Changes can bring it back.'
                        : `It leaves your website when you publish. Until then, Changes can bring it back.${row.inMenu ? ' Your design’s menu link to it stays until you take the link out.' : ''}`,
                    yes: 'Delete page',
                    no: 'Keep it',
                    danger: true,
                });
                if (!yes) return;
                if (row.made) {
                    const ok = await keep(config.made.filter((page) => page.id !== row.id), `${row.title} deleted.`, {
                        menuChanged: row.inMenu,
                        before: [[`structure:page:${row.id}`, JSON.stringify({ added: {} })]],
                    });
                    if (!ok) return;
                } else {
                    try {
                        const removed = [...new Set([...(config.removed ?? []), row.id])];
                        await save(config.removedKey, JSON.stringify(removed));
                        config.removed = removed;
                        tell(`${row.title} deleted.`, row.inMenu);
                    } catch (error) {
                        notify(error?.message || 'That could not be deleted. Try again.');

                        return;
                    }
                }
                config.pages = config.pages.filter((page) => page.id !== row.id);
                draw();
                // The page open now has gone: the first one left is opened instead.
                if (row.here) {
                    const next = config.pages.find((page) => page.id === '') ?? config.pages[0];
                    if (next) go(next.href);
                }
            }, `Delete ${row.title}`));
        }
        if (actions.childElementCount) item.append(actions);
        list.append(item);
    };

    const group = (title, rows, { movable = [], note = '' } = {}) => {
        if (!rows.length) return null;
        const section = el('section', 'le-pages-group');
        const heading = el('h3', 'le-section-heading', title);
        heading.id = `le-pages-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`;
        const list = el('ol', 'le-page-list');
        list.setAttribute('aria-labelledby', heading.id);
        section.append(heading);
        if (note) section.append(el('p', 'le-hint', note));
        rows.forEach((row) => rowOf(row, list, movable));
        section.append(list);

        return section;
    };

    function draw() {
        const { inMenu, others, needed } = pageRows(config, menu.filter((id) => (config.pages ?? []).some((page) => page.id === id)));
        const movable = inMenu.filter((row) => row.canMove);
        const fixedToo = inMenu.some((row) => !row.made && !row.home);
        const note = [
            fixedToo ? 'Your design’s own pages keep their name and place in the menu: to rename one, click its menu link on the page.' : '',
            movable.length > 1 ? 'Pages you made move up and down.' : '',
        ].filter(Boolean).join(' ');
        const parts = [
            group('In your menu', inMenu, { movable, note }),
            group('Not in your menu', others),
        ];
        if (needed.length) {
            const more = el('details', 'le-pages-needed');
            const summary = el('summary', null, `Pages your website uses (${needed.length})`);
            more.append(summary, el('p', 'le-hint', 'A checkout, a bag, a brand sheet, notices, and one page for each product or post. They are not in the menu; open them to edit their words.'));
            const list = el('ol', 'le-page-list');
            list.setAttribute('aria-label', 'Pages your website uses');
            needed.forEach((row) => rowOf(row, list, []));
            more.append(list);
            parts.push(more);
        }
        lists.replaceChildren(...parts.filter(Boolean));
    }

    draw();
    setTimeout(() => add.focus(), 0);

    return { draw, rows: () => pageRows(config, menu) };
}
