/**
 * The page as the chat sends it to the assistant: every word, link and photo the editor marks, the sections it can
 * show or hide, and the lists it can add to or reorder (LIVE-EDIT-STRUCTURE.md section 13).
 *
 * Read from the page the owner is looking at, so it is right on every adapter (a hosted website, WordPress, Laravel,
 * React, Next.js, plain HTML) and includes their unpublished drafts. A locked part is left out: the assistant is not
 * told about what this person may not change (and the server refuses it anyway, by its key).
 */

import { displayedValue, ownTextOf, shownWords } from './support.js';

const MOST_FIELDS = 400;
const LONGEST_VALUE = 600;

const LOCKED = '[data-live-lock], [data-live-edit-lock]';

const clean = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();

const cut = (text, most = LONGEST_VALUE) => {
    const said = clean(text);

    return said.length > most ? `${said.slice(0, most - 1)}…` : said;
};

/** "setting:tpl:8440ea8208b6" is the key "tpl:8440ea8208b6"; other markers save elsewhere and are not offered. */
const keyOf = (marker) => (typeof marker === 'string' && marker.startsWith('setting:') ? marker.slice(8) : null);

const locked = (element) => Boolean(element.closest(LOCKED));

const sectionOf = (element) => {
    const section = element.closest('[data-edit-section]');

    return section ? cut(section.getAttribute('data-edit-section-label') || '', 80) : '';
};

/** Each marker the editor reads, and what the chat calls the thing it marks. */
const MARKERS = [
    ['data-edit', 'text'],
    ['data-edit-href', 'link'],
    ['data-edit-img', 'image'],
    ['data-edit-bg', 'background image'],
    ['data-edit-icon', 'icon'],
];

const kindOf = (element) => {
    if (element.hasAttribute('data-edit-img')) return 'image';
    if (element.hasAttribute('data-edit-bg')) return 'background image';
    if (element.hasAttribute('data-edit-href')) return 'link';
    if (element.hasAttribute('data-edit-icon')) return 'icon';

    return 'text';
};

const markerOf = (element) => element.getAttribute('data-edit')
    || element.getAttribute('data-edit-img')
    || element.getAttribute('data-edit-bg')
    || element.getAttribute('data-edit-href')
    || element.getAttribute('data-edit-icon')
    || '';

const valueOf = (element, kind) => {
    if (kind === 'image') {
        const alt = element.getAttribute('alt');

        return cut(alt ? `alt: ${alt}` : (element.getAttribute('src') || '').split('/').pop(), 200);
    }
    if (kind === 'background image') return 'a background photo';
    if (kind === 'link') return cut(element.getAttribute('href') || '', 300);
    if (kind === 'icon') return cut(element.getAttribute('aria-label') || 'an icon', 80);

    // the words exactly as the editor's own words panel holds them (live-edit.js editText): what it shows, the words
    // around formatted parts that have keys of their own, a rich setting as it is; so the chat never writes words the
    // panel would not have held
    const key = keyOf(element.getAttribute('data-edit'));
    const raw = displayedValue({ editValue: element.dataset.editValue, ownText: ownTextOf(element), fullText: element.textContent });
    const rich = key !== null && (window.liveEditRich?.settings ?? []).includes(key);

    return cut(rich ? raw.trim() : shownWords(element, raw));
};

const labelOf = (element, kind) => {
    const given = element.getAttribute('data-edit-label');
    if (given) return cut(given, 80);
    // a link's words say what it is ("Shop women"); a heading says it is the heading
    if (kind === 'link') return cut(element.textContent, 80) || 'Link';
    if (/^H[1-6]$/.test(element.tagName)) return 'Heading';
    // the brand's mark is not "the photo": a picture in the header or the menu, or one named a logo, is the logo
    if (kind === 'image' || kind === 'background image') {
        const named = `${element.getAttribute('class') || ''} ${element.getAttribute('src') || ''} ${element.closest('a')?.getAttribute('class') || ''}`;
        return element.closest('header, nav') || /logo|brand-mark/i.test(named) ? 'Logo' : 'Photo';
    }

    return '';
};

/**
 * @param {Document|Element} root
 * @returns {{page: {title: string, path: string}, fields: object[], sections: object[], lists: object[]}}
 */
export function pageForTheChat(root = document) {
    const doc = root.ownerDocument || root;
    const fields = [];
    const seen = new Set();

    const marked = root.querySelectorAll('[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon]');
    for (const element of marked) {
        if (fields.length >= MOST_FIELDS) break;
        if (element.closest('#live-edit-ui') || locked(element)) continue;
        // one part can hold more than one thing to change (a button's words and where it goes): each is its own
        // field, under its own marker, so a change to the address never lands on the words' key
        for (const [attribute, kind] of MARKERS) {
            if (!element.hasAttribute(attribute)) continue;
            const key = keyOf(element.getAttribute(attribute));
            if (key === null || seen.has(key)) continue;
            const value = valueOf(element, kind);
            if (value === '' && kind === 'text') continue;
            seen.add(key);
            const field = { key, kind, value };
            const label = labelOf(element, kind);
            const where = sectionOf(element);
            if (label) field.label = label;
            if (where) field.section = where;
            fields.push(field);
        }
    }

    const sections = [];
    for (const element of root.querySelectorAll('[data-edit-section]')) {
        if (locked(element) || element.closest('[data-edit-item]')) continue;
        const id = element.getAttribute('data-edit-section');
        if (!id || sections.length >= 80) continue;
        // named, so the owner's words ("the reviews") find it; taken away with the sections list's Delete, as a press does
        sections.push({ id, label: cut(element.getAttribute('data-edit-section-label') || 'Section', 80) });
    }

    const lists = [];
    let sectionsList = null;
    for (const element of root.querySelectorAll('[data-edit-list]')) {
        const key = element.getAttribute('data-edit-list');
        // the engine's guesses at a list are not offered on a page that names its own (the Kit)
        if (!key || locked(element) || lists.length >= 80) continue;
        if (key.startsWith('auto:') && root.querySelector('[data-instance]')) continue;
        // the page's own sections are a list too: a section is taken away with its Delete, as in the panel
        const ofSections = element.getAttribute('data-edit-list-kind') === 'sections';
        if (ofSections && sectionsList) continue;
        const items = [...element.querySelectorAll(':scope > [data-edit-item]')].slice(0, 200).map((item) => ({
            id: item.getAttribute('data-edit-item'),
            label: cut((ofSections && (item.getAttribute('data-edit-section-label') || item.querySelector('[data-edit-section-label]')?.getAttribute('data-edit-section-label')))
                || item.getAttribute('data-edit-item-label') || item.textContent, 80),
        })).filter((item) => item.id);
        if (items.length === 0) continue;
        if (ofSections) sectionsList = key;
        const max = Number.parseInt(element.getAttribute('data-edit-list-max') || '', 10);
        lists.push({
            key,
            label: ofSections ? 'Page sections' : cut(element.getAttribute('data-edit-list-label') || 'List', 80),
            max: Number.isInteger(max) && max > 0 ? max : null,
            items,
        });
    }

    return {
        page: { title: cut(doc.title || '', 200), path: (doc.defaultView?.location?.pathname) || '/' },
        fields,
        sections,
        lists,
        sectionsList,
    };
}

/** What the owner has tapped, so "this" means it. */
export function tappedForTheChat(element) {
    if (!element || !(element instanceof Element)) return null;
    const holder = element.closest('[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon]');
    if (!holder || locked(holder)) return null;
    const key = keyOf(markerOf(holder));
    if (key === null) return null;
    const kind = kindOf(holder);

    return { key, kind, label: labelOf(holder, kind) || cut(holder.textContent, 80) || 'This part' };
}
