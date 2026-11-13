/**
 * The page as the chat sends it to the assistant: every word, link and photo the editor marks, the sections it can
 * show or hide, and the lists it can add to or reorder (LIVE-EDIT-STRUCTURE.md section 13).
 *
 * Read from the page the owner is looking at, so it is right on every adapter (a hosted website, WordPress, Laravel,
 * React, Next.js, plain HTML) and includes their unpublished drafts. A locked part is left out: the assistant is not
 * told about what this person may not change (and the server refuses it anyway, by its key).
 */

import { declaredStyleProps, displayedValue, ownTextOf, shownWords, stylePropsFor } from './support.js';

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

/*
 * A link's address is saved under its marker as written: "setting:tpl:abc" on some sites, the bare "tpl:abc" on the
 * Kit's templates (the editor's link panel saves `dataset.editHref` as it is). The chat never saw the bare ones, so it
 * could change no link on The Speaker (owner, 13 Nov 2026, the coverage walk: 1,127 links). An engine guess ("auto:")
 * is still not offered.
 */
const hrefKeyOf = (marker) => {
    if (typeof marker !== 'string' || marker === '') return null;
    if (marker.startsWith('setting:')) return marker.slice(8);

    return /^[a-z][\w-]*:[\w.:-]+$/i.test(marker) && !marker.startsWith('auto:') ? marker : null;
};

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
    // the parts at the top of a page, named by what they are, as owners say them (owner, 13 Nov 2026: "how is paragraph
    // related to introduction"; they said "the paragraph in the hero section"): the templates mark them
    const hero = element.getAttribute('data-hero');
    if (kind === 'text' && hero === 'headline') return 'Heading at the top';
    if (kind === 'text' && hero === 'intro' && !element.closest('a, button')) {
        return /lead|intro|sub|summary|text/i.test(element.getAttribute('data-field') || '') ? 'Paragraph at the top' : 'Line under the paragraph at the top';
    }
    if (/^H[1-6]$/.test(element.tagName)) return 'Heading';
    if (kind === 'text' && element.tagName === 'P') return 'Paragraph';
    // a button by its words, as people point at one ("the Book me button"), never "This part"
    if (kind === 'text' && (element.tagName === 'BUTTON' || element.closest('a, button'))) {
        const words = cut(element.textContent, 40);
        return words ? `\u201C${words}\u201D button` : 'Button';
    }
    // the brand's mark is not "the photo": a picture in the header or the menu, or one named a logo, is the logo
    if (kind === 'image' || kind === 'background image') {
        const named = `${element.getAttribute('class') || ''} ${element.getAttribute('src') || ''} ${element.closest('a')?.getAttribute('class') || ''}`;
        return element.closest('header, nav') || /logo|brand-mark/i.test(named) ? 'Logo' : 'Photo';
    }

    return '';
};

/**
 * What sits next to each part on the screen: the nearest part above, below, to the left and to the right, named the
 * way the owner sees it (owner, 13 Nov 2026: "the moat is chatting to replace mouse control"; "if i say delete
 * paragraph next to or beside or above an element, does the ai ask understand that"). Worked out from where each
 * part is drawn, so two paragraphs side by side in columns are beside each other, not one under the other. A part
 * not drawn (a closed menu, a hidden tab) has none, and a button's words and its link are one part.
 *
 * @param {{field: object, element: Element}[]} placed
 */
const besides = (placed) => {
    const nameOf = (field) => {
        if (field.kind === 'text') {
            const label = field.label ?? '';
            // a button is already named by its words
            if (/\u201D button$/.test(label)) return label;
            const words = cut(field.value, 28);
            return `${label || 'Text'} \u201C${words}\u201D`;
        }

        return field.label || (field.kind === 'link' ? 'Link' : 'Photo');
    };
    // one box per drawn part (a button's words and its link share the element: its words name it)
    const boxes = [];
    const byElement = new Map();
    for (const { field, element } of placed) {
        if (byElement.has(element)) continue;
        const rect = element.getBoundingClientRect?.();
        if (!rect || rect.width <= 0 || rect.height <= 0) continue;
        const box = { field, element, top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, name: nameOf(field) };
        byElement.set(element, box);
        boxes.push(box);
    }
    const across = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const down = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    for (const box of boxes) {
        let above = null; let below = null; let left = null; let right = null;
        for (const other of boxes) {
            if (other === box || other.element.contains(box.element) || box.element.contains(other.element)) continue;
            // in the same column: overlapping across; beside: sharing at least a third of the shorter one's height
            if (across(box, other) > 0) {
                if (other.bottom <= box.top + 2 && (!above || other.bottom > above.bottom)) above = other;
                if (other.top >= box.bottom - 2 && (!below || other.top < below.top)) below = other;
            } else if (down(box, other) >= Math.min(box.bottom - box.top, other.bottom - other.top) / 3) {
                if (other.right <= box.left + 2 && (!left || other.right > left.right)) left = other;
                if (other.left >= box.right - 2 && (!right || other.left < right.left)) right = other;
            }
        }
        const near = {};
        if (above) near.above = above.name;
        if (below) near.below = below.name;
        if (left) near.left = left.name;
        if (right) near.right = right.name;
        if (Object.keys(near).length) {
            box.field.near = near;
            // the same neighbours for its link, which is the same part
            for (const { field, element } of placed) if (element === box.element && field !== box.field) field.near = near;
        }
    }
};

/**
 * @param {Document|Element} root
 * @returns {{page: {title: string, path: string}, fields: object[], sections: object[], lists: object[]}}
 */
export function pageForTheChat(root = document) {
    const doc = root.ownerDocument || root;
    const fields = [];
    const seen = new Set();
    const placed = [];

    const marked = root.querySelectorAll('[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon]');
    for (const element of marked) {
        if (fields.length >= MOST_FIELDS) break;
        if (element.closest('#live-edit-ui') || locked(element)) continue;
        // one part can hold more than one thing to change (a button's words and where it goes): each is its own
        // field, under its own marker, so a change to the address never lands on the words' key
        for (const [attribute, kind] of MARKERS) {
            if (!element.hasAttribute(attribute)) continue;
            const key = attribute === 'data-edit-href' ? hrefKeyOf(element.getAttribute(attribute)) : keyOf(element.getAttribute(attribute));
            if (key === null || seen.has(key)) continue;
            const value = valueOf(element, kind);
            if (value === '' && kind === 'text') continue;
            seen.add(key);
            const field = { key, kind, value };
            const label = labelOf(element, kind);
            const where = sectionOf(element);
            // a plain name says which one ("Heading in Talks"), so the change card tells the owner what changed where
            // (owner, 12 Nov 2026, the novice walk: "Heading" alone named any of a page's headings)
            // a section a designer calls the hero is "at the top" to everyone else
            const said = /^(hero|top|intro|introduction|banner|masthead)$/i.test(where) ? 'at the top' : `in ${where}`;
            if (label) field.label = where && ['Heading', 'Photo', 'Paragraph'].includes(label) ? `${label} ${said}` : label;
            if (where) field.section = where;
            // how it looks, where the design lets it be changed (colour, size, spacing): the same choices its panel
            // offers, so Ask AI can do what the panel's style controls do and no more
            const styleKey = element.getAttribute('data-style');
            if (styleKey && attribute !== 'data-edit-href') {
                const props = declaredStyleProps(element.getAttribute('data-style-props'), doc.defaultView?.liveEditStyleProps);
                if (props.length) {
                    field.style_key = styleKey;
                    field.style = props.filter((prop) => prop !== 'backgroundImage' && prop !== 'hidden').slice(0, 12);
                    // the panel's Delete for one part (a paragraph, a heading, a button): Ask AI may press it too; never
                    // one already deleted (owner, 13 Nov 2026: the chat tried the paragraph they had just deleted)
                    const deleted = String((doc.defaultView?.liveEditStyles ?? {})[styleKey]?.hidden ?? '') === '1';
                    if (!deleted && stylePropsFor(element, props).includes('hidden') && !element.matches('[data-edit-section], [data-edit-item], [data-edit-list]')) field.can_delete = true;
                }
            }
            fields.push(field);
            placed.push({ field, element });
        }
    }
    besides(placed);

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
    // the clicked part as one thing: the first of its markers, with that marker's own key and kind (a button's words,
    // not its words' key called a link)
    const [attribute, kind] = MARKERS.find(([name]) => holder.hasAttribute(name)) ?? [];
    const key = !attribute ? null : attribute === 'data-edit-href' ? hrefKeyOf(holder.getAttribute(attribute)) : keyOf(holder.getAttribute(attribute));
    if (key === null) return null;

    return { key, kind, label: labelOf(holder, kind) || cut(holder.textContent, 80) || 'This part' };
}
