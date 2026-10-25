/*
 * A card and the page it opens.
 *
 * A product, a journal post or a project is two things on a site: a card in a
 * list, and a detail page the card opens. The owner manages them from the
 * card, so this is everything the card's panel needs to do to its page:
 *
 *   - show that page's own detail component, edited in place, inside a window
 *     over the list (the editor itself, loaded in a frame in "detail" mode);
 *   - give a copied card a page of its own that is a full copy of the page it
 *     shared, every edit included, so the copy starts as everything the
 *     original says rather than as the design's sample;
 *   - delete a card's page along with the card, saying first what else links
 *     to it.
 *
 * Everything here works on documents and saved settings handed to it, and
 * saves through the function it is given, so the same ordinary setting save
 * (drafts, Changes, undo, publish) covers all of it.
 */

import { linkedDetailComponents } from './linked-detail-scope.js';
import { cardFacts, factTargets, freeAddress, newAddedId, pageOfLink } from './pages.js';

/** The value of `?live-edit=` that loads the editor showing only a page's detail. */
export const DETAIL_MODE = 'detail';

/** The editor's address for a page, in detail mode. */
export function detailAddress(editorBase, id) {
    const address = `${editorBase ?? ''}${id}`;

    return `${address}${address.includes('?') ? '&' : '?'}live-edit=${DETAIL_MODE}`;
}

/* ------------------------------ detail only ------------------------------ */

/** Tags that are never part of what anybody sees, so hiding them would only break the page. */
const INVISIBLE = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'BASE', 'TITLE']);

/**
 * Hide everything on the page except its detail component.
 *
 * The page is the real page, with its own styles and scripts, so the detail
 * looks and behaves exactly as it does there. Only what is not the record is
 * put away: the header, the menus, the footer, related cards, the sticky buy
 * bar. Which components are the record is the same rule the rest of the
 * editor uses (linked-detail-scope.js).
 *
 * Hidden by an attribute and one rule rather than removed, so the template's
 * own scripts still find every element they expect and nothing throws.
 *
 * Returns the components left showing.
 */
export function showOnlyTheDetail(doc = document) {
    const body = doc.body;
    const main = doc.querySelector('main') ?? body;
    const roots = linkedDetailComponents(main);
    const showing = new Set(roots);
    const onTheWay = new Set();
    for (const root of roots) {
        for (let node = root.parentElement; node && node !== body; node = node.parentElement) onTheWay.add(node);
    }

    const putAway = (parent) => {
        for (const child of [...parent.children]) {
            if (showing.has(child) || INVISIBLE.has(child.tagName) || child.id === 'live-edit-ui') continue;
            if (onTheWay.has(child)) putAway(child);
            else child.setAttribute('data-le-detail-hidden', '');
        }
    };
    putAway(body);

    doc.documentElement.classList.add('le-detail-only');
    if (!doc.getElementById('le-detail-only')) {
        const style = doc.createElement('style');
        style.id = 'le-detail-only';
        // The toolbar's room at the foot of the page is given back: in this mode there is no toolbar.
        style.textContent = '[data-le-detail-hidden]{display:none!important}'
            + 'html.le-detail-only>body{padding-bottom:0!important}'
            + 'html.le-detail-only main{padding-top:0!important;margin-top:0!important}';
        (doc.head ?? body).append(style);
    }

    return roots;
}

/* ------------------------------ the page's facts ------------------------------ */

/**
 * The page builder an editor page was served with (window.liveEditPages),
 * read from that page's markup without running it. Another page's builder
 * knows that page's own added sections, which the current page's does not.
 */
export function builderIn(doc) {
    for (const script of doc.querySelectorAll('script:not([src])')) {
        const text = (script.textContent ?? '').trim();
        if (!text.startsWith('window.liveEditPages=')) continue;
        try {
            return JSON.parse(text.slice('window.liveEditPages='.length).replace(/;\s*$/, ''));
        } catch {
            return null;
        }
    }

    return null;
}

/**
 * The sections of a page that a copy of it is made of, in the order the
 * owner arranged them, each with the design's section it is drawn from.
 *
 * A section the design put on the page is drawn from itself (its instance).
 * One the owner added is drawn from what they added it from, which only that
 * page's own builder knows. Shared bands (`site.*`, the header and footer)
 * are every page's already, and the section that holds the menu is the one a
 * new page keeps from the site's shell, so neither is copied: the host would
 * draw it twice (ThePagesTheOwnerArranged::emptied()).
 *
 * @returns {{ element: Element, from: string }[]}
 */
export function sectionsToCopy(doc, pageId, builder = builderIn(doc)) {
    const added = builder?.added ?? {};
    const owner = pageId === '' ? 'home' : pageId;
    const outermost = [...doc.querySelectorAll('[data-instance]')]
        .filter((element) => !element.parentElement?.closest('[data-instance]'));
    const sections = [];

    for (const element of outermost) {
        const instance = element.getAttribute('data-instance') ?? '';
        if (!instance || instance.startsWith('site.')) continue;
        if (element.matches('[data-key^="nav."]') || element.querySelector('[data-key^="nav."]')) continue;

        const own = instance.startsWith(`${owner}.`) ? instance.slice(owner.length + 1) : null;
        if (own && Object.hasOwn(added, own)) {
            sections.push({ element, from: added[own] });
        } else if (own && /^add-/.test(own)) {
            // Added from a section the design no longer has: nothing to draw it from.
            continue;
        } else {
            sections.push({ element, from: instance });
        }
    }

    return sections;
}

/** The sections of a page made from `added`, in the same order, matched to the ids they were added under. */
export function sectionsMadeAs(doc, pageId, addedIds) {
    const owner = pageId === '' ? 'home' : pageId;

    return addedIds.map((id) => doc.querySelector(`[data-instance="${CSS_ESCAPE(`${owner}.${id}`)}"]`));
}

const CSS_ESCAPE = (value) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, '\\$&'));

/* ------------------------------ one key for another ------------------------------ */

/** Every attribute an element names a saved setting in. */
const KEYED = ['data-edit', 'data-edit-img', 'data-edit-bg', 'data-edit-href', 'data-edit-svg', 'data-edit-icon', 'data-edit-slide-caption', 'data-edit-choice', 'data-edit-target'];

const bare = (value) => String(value ?? '').replace(/^setting:/, '');

/** Keys saved beside a picture under its key with a word on the end (Companions.php). */
const COMPANIONS = ['CreditSourceUrl', 'CreditSource', 'CreditUrl', 'CreditBy', 'Credit', 'Srcset', 'Title', 'Href', 'Alt'];

const isItem = (element) => element.hasAttribute('data-edit-item');

/**
 * Walk two copies of the same markup side by side.
 *
 * Both sides are drawn from the same design file, so an element is matched
 * the way the host keys it: by its position among siblings with the same tag
 * (TheDesignersMarkersBecomeKeys::whereItSits). The one exception is a list,
 * whose items the owner may have reordered, removed or copied: those are
 * matched by their item id, which is the same on both sides once the copy's
 * list holds the same order. An item only one side has is left out.
 */
function walkTogether(a, b, visit) {
    visit(a, b);
    const pair = (as, bs) => {
        const byTag = new Map();
        for (const child of bs) {
            if (!byTag.has(child.tagName)) byTag.set(child.tagName, []);
            byTag.get(child.tagName).push(child);
        }
        const seen = new Map();
        for (const child of as) {
            const n = seen.get(child.tagName) ?? 0;
            seen.set(child.tagName, n + 1);
            const match = byTag.get(child.tagName)?.[n];
            if (match) walkTogether(child, match, visit);
        }
    };

    const as = [...a.children];
    const bs = [...b.children];
    if (a.hasAttribute('data-edit-list') && b.hasAttribute('data-edit-list')) {
        const items = new Map(bs.filter(isItem).map((item) => [item.getAttribute('data-edit-item'), item]));
        for (const item of as.filter(isItem)) {
            const match = items.get(item.getAttribute('data-edit-item'));
            if (match) walkTogether(item, match, visit);
        }
        pair(as.filter((child) => !isItem(child)), bs.filter((child) => !isItem(child)));
    } else {
        pair(as, bs);
    }
}

/**
 * Which key on the copy each key on the original became.
 *
 * `keys` covers words, pictures, links, drawings, icons, captions and card
 * settings; `styles` the style keys; `lists` the list-order keys. A key that
 * is the same on both sides (a field the design named, shared by every page)
 * is left out: it is already the copy's.
 *
 * @param {[Element, Element][]} pairs  each original section with its copy
 */
export function keyMap(pairs) {
    const keys = new Map();
    const styles = new Map();
    const lists = new Map();
    const note = (into, from, to) => {
        if (from && to && from !== to && !from.startsWith('auto:')) into.set(from, to);
    };

    for (const [original, copy] of pairs) {
        if (!original || !copy) continue;
        walkTogether(original, copy, (a, b) => {
            for (const attribute of KEYED) note(keys, bare(a.getAttribute(attribute)), bare(b.getAttribute(attribute)));
            note(styles, a.getAttribute('data-style'), b.getAttribute('data-style'));
            note(lists, a.getAttribute('data-edit-list'), b.getAttribute('data-edit-list'));
        });
    }

    return { keys, styles, lists };
}

/**
 * The copy's key for a saved setting of the original, or null when the
 * setting is not one of the original page's.
 *
 * Besides the keys on the page, a picture keeps its description, title and
 * credit under its key with a word on the end, and a copied list item keeps
 * its words under its original's key with `@<item id>`; both follow the key
 * they hang from.
 */
export function mappedKey(saved, keys) {
    const direct = (key) => {
        if (keys.has(key)) return keys.get(key);
        const row = key.match(/^(.+)(@[A-Za-z0-9_.~-]{1,64})$/);

        return row && keys.has(row[1]) ? `${keys.get(row[1])}${row[2]}` : null;
    };

    const found = direct(saved);
    if (found) return found;
    for (const suffix of COMPANIONS) {
        if (!saved.endsWith(suffix) || saved.length === suffix.length) continue;
        const base = direct(saved.slice(0, -suffix.length));
        if (base) return `${base}${suffix}`;
    }

    return null;
}

/** Every saved setting of the original, under the copy's keys. */
export function copiedSettings(keys, settings = {}, leaveOut = new Set()) {
    const writes = [];
    for (const [key, value] of Object.entries(settings)) {
        if (leaveOut.has(key) || typeof value !== 'string') continue;
        const to = mappedKey(key, keys);
        if (to && to !== key && !leaveOut.has(to)) writes.push([to, value]);
    }

    return writes;
}

/** Every saved style of the original, under the copy's style keys. */
export function copiedStyles(styleKeys, styles = {}) {
    const writes = [];
    for (const [from, to] of styleKeys) {
        const props = styles?.[from];
        if (props && typeof props === 'object' && Object.keys(props).length) writes.push([to, props]);
    }

    return writes;
}

/* ------------------------------ a page of its own ------------------------------ */

const wordsOf = (element) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Where a card's facts go on a page: within its detail components first, else anywhere in it. */
export function detailFactTargets(doc) {
    const main = doc.querySelector('main') ?? doc.body;
    const found = { name: null, photo: null, price: null, notes: null };
    for (const root of [...linkedDetailComponents(main), main]) {
        const targets = factTargets(root);
        for (const what of Object.keys(found)) found[what] ??= targets[what];
    }

    return found;
}

/**
 * Make a card a page of its own: a full copy of the page it opens now.
 *
 * Three steps, all ordinary setting saves, so the new page is a draft until
 * published and shows under Changes:
 *
 *   1. The page: one section added for every section of the original, from
 *      the same design section, in the owner's order, out of the menu. The
 *      host draws each with keys of its own (`added:<page>/<id>`).
 *   2. Its lists: every list's saved order, so the copy holds the same items
 *      (an option the owner added, one they deleted) before anything else is
 *      matched. Reading the copy again after this is what lets an item the
 *      owner added find its counterpart.
 *   3. Everything else: every saved word, picture, link, style and card
 *      setting of the original, under the copy's own keys. Then the name,
 *      photo, price and short description the owner gave the card, where
 *      they differ from the page.
 *
 * After this the two pages share no key, so an edit to either never reaches
 * the other.
 *
 * `fetchPage(id)` returns the editor's page for that address as a Document;
 * `readContent()` returns { settings, styles } with drafts over published;
 * `save(key, value)` and `saveStyle(key, props)` store one change each.
 *
 * Returns the new page's id.
 */
export async function copyPageForCard({ page, title, card = null, builder, fetchPage, readContent, save, saveStyle, progress = () => {} }) {
    const name = String(title ?? '').trim() || String(page.title ?? '').trim() || 'New page';
    const original = await fetchPage(page.id);
    const sections = sectionsToCopy(original, page.id);
    if (!sections.length) throw new Error(`${page.title || 'That page'} has no sections a copy can be made from.`);

    const id = freeAddress(name, builder.taken ?? []);
    const added = {};
    const addedIds = sections.map(({ from }) => {
        let fresh = newAddedId();
        while (Object.hasOwn(added, fresh)) fresh = newAddedId();
        added[fresh] = from;

        return fresh;
    });

    progress('Making its page…');
    await save(`structure:page:${id}`, JSON.stringify({ added }));
    const made = [...(builder.made ?? []), { id, title: name, menu: false }];
    await save(builder.pagesKey, JSON.stringify(made));
    // This editor keeps going without a reload, so what it knows about the site's pages moves with it.
    builder.made = made;
    builder.taken = [...(builder.taken ?? []), id];
    builder.pages = [...(builder.pages ?? []), { id, title: name, href: `${builder.editorBase ?? ''}${id}`, made: true }];

    const content = await readContent();
    const settings = content?.settings ?? {};
    const styles = content?.styles ?? {};
    const pairsWith = (copy) => {
        const made = sectionsMadeAs(copy, id, addedIds);

        return sections.map(({ element }, n) => [element, made[n]]);
    };

    let copy = await fetchPage(id);
    const written = new Set();
    let ordered = 0;
    for (const [from, to] of keyMap(pairsWith(copy)).lists) {
        if (typeof settings[from] !== 'string') continue;
        await save(to, settings[from]);
        written.add(to);
        ordered += 1;
    }
    if (ordered) copy = await fetchPage(id);

    const map = keyMap(pairsWith(copy));
    const words = copiedSettings(map.keys, settings, written);
    const looks = copiedStyles(map.styles, styles);
    const total = words.length + looks.length;
    let done = 0;
    for (const [key, value] of words) {
        await save(key, value);
        written.add(key);
        progress(`Copying its details (${++done} of ${total})…`);
    }
    for (const [key, props] of looks) {
        await saveStyle(key, props);
        progress(`Copying its details (${++done} of ${total})…`);
    }

    if (card) {
        await sayWhatTheCardSays({ card, original, copy, settings, save });
    }

    return id;
}

/** The card's own editable element for each fact, where the card has one. */
function cardFactElements(card) {
    const keyed = (element) => (element?.matches?.('[data-edit]') ? element : element?.querySelector?.('[data-edit]') ?? null);

    return {
        name: keyed(card.querySelector('h1, h2, h3, h4')),
        price: keyed(card.querySelector('[data-kit-price], [data-field="price"]')),
        notes: keyed(card.querySelector('[data-field="notes"], [data-field="lead"], [data-field="k"]')),
        photo: card.querySelector('img[data-edit-img]'),
    };
}

/**
 * The card's own words on its new page, where the owner wrote something on
 * the card that the page it was copied from does not say: a copied product
 * renamed "Fig Archive" and priced $132 opens a page headed "Fig Archive" at
 * $132.
 *
 * Only what the owner saved on the card counts. A card still showing the
 * design's sample photo says nothing about the product, and letting it win
 * would put the sample back over the photo the owner chose for the page.
 */
async function sayWhatTheCardSays({ card, original, copy, settings, save }) {
    const facts = cardFacts(card);
    const owned = cardFactElements(card);
    const was = detailFactTargets(original);
    const now = detailFactTargets(copy);
    const ownerSaid = (element, attribute) => {
        const key = element ? bare(element.getAttribute(attribute)) : '';

        return key && typeof settings[key] === 'string' ? key : '';
    };

    for (const what of ['name', 'price', 'notes']) {
        const target = now[what];
        const key = target ? bare(target.getAttribute('data-edit')) : '';
        if (!key || !facts[what] || !ownerSaid(owned[what], 'data-edit')) continue;
        if (facts[what] === wordsOf(was[what] ?? target)) continue;
        await save(key, facts[what]);
    }

    // The picture as the card holds it, its description and credit with it.
    const from = ownerSaid(owned.photo, 'data-edit-img');
    const to = now.photo ? bare(now.photo.getAttribute('data-edit-img')) : '';
    if (!from || !to) return;
    const before = was.photo ? bare(was.photo.getAttribute('data-edit-img')) : '';
    const shownOnPage = (before && settings[before]) || was.photo?.getAttribute('src') || '';
    if (settings[from] === shownOnPage) return;
    await save(to, settings[from]);
    for (const suffix of COMPANIONS) {
        if (typeof settings[`${from}${suffix}`] === 'string') await save(`${to}${suffix}`, settings[`${from}${suffix}`]);
    }
}

/* ------------------------------ deleting a card's page ------------------------------ */

/**
 * Whether a page can be deleted from here, and how: `made` for one the owner
 * made (it leaves their list of pages), `design` for one the design came with
 * (only where the host keeps a list of those the owner removed,
 * `removedKey`), or null.
 */
export function deletablePage(page, builder) {
    if (!page || !builder) return null;
    if ((builder.made ?? []).some((made) => made.id === page.id)) return 'made';
    if (builder.removedKey && page.id !== '') return 'design';

    return null;
}

/**
 * What else links to a page: links on this page (other cards, the menu), and
 * links the owner pointed at it anywhere on the site, which are saved
 * settings. Links the design wrote into other pages are not known here.
 *
 * `except` are elements whose links do not count (the card being deleted).
 *
 * @returns {{ here: string[], elsewhere: number, inMenu: boolean }}
 */
export function linksTo(page, { doc = document, settings = {}, pages = [], base = 'http://localhost/', except = [], builder = null } = {}) {
    const here = [];
    const keysHere = new Set();
    for (const link of doc.querySelectorAll('a[href]')) {
        if (link.dataset.editHref) keysHere.add(bare(link.dataset.editHref));
        if (except.some((element) => element === link || element.contains?.(link))) continue;
        if (pageOfLink(link, pages, base)?.id !== page.id) continue;
        const said = wordsOf(link) || link.getAttribute('aria-label') || link.querySelector('img')?.getAttribute('alt') || 'A link';
        here.push(said.slice(0, 60));
    }

    let elsewhere = 0;
    for (const [key, value] of Object.entries(settings)) {
        if (keysHere.has(key) || typeof value !== 'string') continue;
        if (!/^(?:\.\.?\/|\/|https?:\/\/)/.test(value) && !/\/$/.test(value)) continue;
        if (pageOfLink(value, pages, base)?.id === page.id) elsewhere += 1;
    }

    const inMenu = (builder?.made ?? []).some((made) => made.id === page.id && made.menu);

    return { here: [...new Set(here)], elsewhere, inMenu };
}

/** The warning before a page goes, in the owner's words; empty when nothing else links to it. */
export function linksWarning({ here = [], elsewhere = 0, inMenu = false } = {}) {
    const parts = [];
    if (here.length) parts.push(`on this page: ${here.slice(0, 4).map((said) => `“${said}”`).join(', ')}${here.length > 4 ? ` and ${here.length - 4} more` : ''}`);
    if (elsewhere) parts.push(`${elsewhere} ${elsewhere === 1 ? 'link' : 'links'} you set on other pages`);
    const linked = parts.length ? `Other links still lead to it (${parts.join('; ')}). They will lead nowhere once it is deleted.` : '';
    const menu = inMenu ? 'It is in your menu, and leaves the menu with it.' : '';

    return [linked, menu].filter(Boolean).join(' ');
}

/**
 * Delete a page: one the owner made leaves their pages, and what it was made
 * of is cleared, so a page made later at the same address starts clean. One
 * the design came with is added to the host's list of removed pages. Both are
 * ordinary saves, so the page is gone from the website when the owner next
 * publishes, and Undo brings it back.
 */
export async function deletePage({ page, builder, save }) {
    const kind = deletablePage(page, builder);
    if (kind === 'made') {
        const made = (builder.made ?? []).filter((entry) => entry.id !== page.id);
        await save(builder.pagesKey, JSON.stringify(made));
        await save(`structure:page:${page.id}`, '');
        builder.made = made;
        builder.taken = (builder.taken ?? []).filter((id) => id !== page.id);
        builder.pages = (builder.pages ?? []).filter((entry) => entry.id !== page.id);

        return kind;
    }
    if (kind === 'design') {
        const removed = [...new Set([...(builder.removed ?? []), page.id])];
        await save(builder.removedKey, JSON.stringify(removed));
        builder.removed = removed;
        builder.pages = (builder.pages ?? []).filter((entry) => entry.id !== page.id);

        return kind;
    }
    throw new Error(`${page?.title || 'That page'} cannot be deleted here.`);
}
