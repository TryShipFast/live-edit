/**
 * The page as the chat sends it to the assistant: every word, link and photo the editor marks, the sections it can
 * show or hide, and the lists it can add to or reorder (LIVE-EDIT-STRUCTURE.md section 13).
 *
 * Read from the page the owner is looking at, so it is right on every adapter (a hosted website, WordPress, Laravel,
 * React, Next.js, plain HTML) and includes their unpublished drafts. A locked part is left out: the assistant is not
 * told about what this person may not change (and the server refuses it anyway, by its key).
 */

import { declaredStyleProps, displayedValue, ownTextOf, shownWords, stylePropsFor } from './support.js';
import { columnsOf, rowsOf, tableOf } from './data-kit.js';
import { seedForm, staysBecause, TYPE_NAMES } from './forms.js';
import { PAIRINGS, PALETTES } from './brand.js';
import { partName } from './part-name.js';

// enough for the longest home page (The Speaker: 491 parts; at 400 its FAQ and footer were never told to Ask AI, 13 Nov 2026)
const MOST_FIELDS = 800;
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

/**
 * The section a part is in, by the name the Sections list shows; the page's hero is said to be at the top as well,
 * since its name is often its heading ("Jordan Reese") and owners call it the hero or the top (owner, 13 Nov 2026:
 * "struggling to delete a check a date button on the hero section"; "how does it know the section i'm talking about").
 */
const isTheTop = (section) => Boolean(section.querySelector('[data-hero="headline"]')) || /(^|[.\-])hero$/i.test(section.getAttribute('data-instance') || '');
const sectionOf = (element) => {
    const section = element.closest('[data-edit-section]');
    if (!section) return '';
    const name = cut(section.getAttribute('data-edit-section-label') || '', 70);

    return isTheTop(section) ? `${name || 'Hero'} (the hero, at the top)` : name;
};

/**
 * The page's other layouts the design carries hidden (The Speaker's home holds Home 1, 2 and 3; one is shown): their
 * parts are not on the owner's screen, so they are not told to Ask AI, as their lists are not.
 */
const inAHiddenLayout = (element, shown) => {
    const layout = element.closest('[data-edit-list-kind="sections"]');

    return Boolean(layout && shown.length && !shown.includes(layout));
};

/** A part that is itself a card of a list (a button in a row of buttons): it goes with the list's Remove. */
const itemOf = (element) => {
    const item = element.closest('[data-edit-item]');
    const list = item?.parentElement?.closest('[data-edit-list]');
    if (!item || !list || list.getAttribute('data-edit-list-kind') === 'sections') return null;
    if (item !== element && item !== element.closest('a, button')) return null;

    return { list: list.getAttribute('data-edit-list'), id: item.getAttribute('data-edit-item') };
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
    // a link's words say what it is ("Shop women")
    if (kind === 'link') return cut(element.getAttribute('data-edit-label') || element.textContent, 80) || 'Link';
    if (kind === 'icon') return cut(element.getAttribute('data-edit-label') || '', 80);

    // every other part by the one name the editor shows for it (part-name.js): the panel, the page's label, Ask AI
    // and voice say the same word
    return cut(partName(element), 80);
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

    const shownLayouts = [...root.querySelectorAll('[data-edit-list-kind="sections"]')].filter((list) => list.getClientRects().length > 0);
    const marked = root.querySelectorAll('[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon]');
    for (const element of marked) {
        if (fields.length >= MOST_FIELDS) break;
        if (element.closest('#live-edit-ui') || locked(element) || inAHiddenLayout(element, shownLayouts)) continue;
        // one part can hold more than one thing to change (a button's words and where it goes): each is its own
        // field, under its own marker, so a change to the address never lands on the words' key
        for (const [attribute, kind] of MARKERS) {
            if (!element.hasAttribute(attribute)) continue;
            // the business's own facts (name, logo, phone, WhatsApp, email, address) are one value for the whole site,
            // changed in Brand (below, `business`): never one copy here, which publish would overwrite (owner,
            // 13 Nov 2026, the coverage walk: 181 on The Speaker). A link marked "link" keeps its own words.
            if (followsTheBrand(element, attribute)) continue;
            // a shop's terms (delivery prices, free delivery over, the code on offer) are changed as the Shop tab does,
            // every copy at once (`shop_terms`), never one copy here
            if (doc.defaultView?.liveEditShop && element.closest(SHOP_TERMS)) continue;
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
            const said = /^(hero|top|intro|introduction|banner|masthead)$/i.test(where) || where.endsWith('(the hero, at the top)') ? 'at the top' : `in ${where}`;
            if (label) field.label = where && ['Heading', 'Photo', 'Paragraph'].includes(label) ? `${label} ${said}` : label;
            if (where) field.section = where;
            // a button that is one of a row of buttons is taken away with that list's Remove, as its panel does
            const item = itemOf(element);
            if (item) field.list_item = item;
            // a link whose design keeps "open in a new tab" (the link panel shows the box only there)
            if (kind === 'link' && element.hasAttribute('data-edit-target')) field.new_tab = element.getAttribute('target') === '_blank';
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
        // a page carrying the design's other layouts hidden (The Speaker's home: Home 1, 2 and 3) is told the one shown
        if (ofSections && shownLayouts.length && !shownLayouts.includes(element)) continue;
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
            // which section it is in: a page can have six lists called Buttons
            ...(!ofSections && sectionOf(element) ? { section: sectionOf(element) } : {}),
        });
    }

    return {
        page: { title: cut(doc.title || '', 200), path: (doc.defaultView?.location?.pathname) || '/' },
        fields,
        sections,
        lists,
        sectionsList,
        business: businessOf(doc, root),
        tables: tablesOf(root),
        forms: formsOf(doc, root),
        brand: brandOf(doc),
        shop_terms: shopTermsOf(doc),
        // the design's own sections and forms that can be added, by name (the + Section picker)
        library: (doc.defaultView?.liveEditPages?.library ?? []).slice(0, 80).map((section) => ({ name: cut(String(section.label ?? '').replace(/ · \d+ left$/, ''), 80), ...(section.kind === 'form' ? { form: true } : {}) })).filter((section) => section.name),
        seo: seoOf(doc),
        // the site's pages, by name, so "link it to the Booking page" picks one as the link panel's Goes to does
        // a page the owner added (made) is renamed, hidden and moved in the Pages list; the design's own pages by their
        // words in the menu and the menu's list, as a click does (pages-list.js pageRows)
        pages: (doc.defaultView?.liveEditPages?.pages ?? []).slice(0, 80).map((page) => ({
            id: String(page.id ?? ''),
            title: cut(page.title || page.id || 'Home', 80),
            ...((doc.defaultView?.liveEditPages?.made ?? []).some((made) => made.id === page.id) ? { made: true } : {}),
        })),
    };
}

/**
 * The page's tables (data-kit-table), each with its columns and rows as its grid shows them, so the chat can change a
 * cell, a row or a column the way the grid does (owner, 13 Nov 2026, the coverage walk: 115 table cells on The
 * Speaker could not be changed by chat). Its id is its rows' list key.
 */
const tablesOf = (root) => {
    const tables = [];
    for (const block of root.querySelectorAll('[data-kit-table]')) {
        if (block.closest('#live-edit-ui') || locked(block) || tables.length >= 10) continue;
        const info = tableOf(block.querySelector('th, td') ?? block);
        const id = info?.rowsList?.dataset?.editList;
        if (!info || !id) continue;
        const section = block.closest('[data-edit-section]');
        // named as its panel is (the table's own title), else its caption or its section's heading
        const named = clean(block.querySelector('.kit-data__title, h2, h3')?.textContent ?? '')
            || clean(info.table.querySelector('caption')?.textContent ?? '')
            || clean(section?.querySelector('h1, h2, h3')?.textContent ?? '')
            || 'Table';
        tables.push({
            id,
            name: cut(named, 80),
            columns: columnsOf(info).map((column) => cut(column.name, 80)),
            rows: rowsOf(info).slice(0, 40).map((tr) => [...tr.children].filter((cell) => cell.matches('th, td')).slice(0, 8).map((cell) => cut(cell.textContent, 200))),
            most: { rows: parseInt(info.rowsList.dataset.editListMax ?? '', 10) || 40, columns: parseInt(info.head?.dataset?.editListMax ?? '', 10) || 8 },
        });
    }

    return tables;
};

/**
 * The page's forms a click can shape (the form builder: where the host keeps forms), each with its questions as the
 * builder shows them, so the chat can reword, add, remove, move a question or change its choices the builder's way.
 */
const formsOf = (doc, root) => {
    const kept = doc.defaultView?.liveEditForms;
    if (!kept) return [];
    const forms = [];
    for (const element of root.querySelectorAll('form[data-kit-form]')) {
        if (element.closest('#live-edit-ui') || locked(element) || forms.length >= 6) continue;
        const key = element.dataset.kitForm;
        const instance = element.closest('[data-component^="form."]') ?? element;
        const handed = kept.forms?.[key] ?? seedForm(instance);
        if (!key || !handed?.fields) continue;
        forms.push({
            key,
            name: cut(handed.label || element.dataset.kitFormLabel || 'Form', 80),
            questions: handed.fields.slice(0, 30).map((field) => ({
                key: field.key,
                question: cut(field.label, 200),
                answer: TYPE_NAMES[field.type] ?? field.type,
                ...(field.required ? { required: true } : {}),
                ...(field.help ? { help: cut(field.help, 200) } : {}),
                ...((field.options ?? []).some((o) => !o.retired) ? { choices: field.options.filter((o) => !o.retired).map((o) => cut(o.label, 120)) } : {}),
                // choices that are words on the page (the template's own dropdown): changed there, as list items
                ...(field.choices === 'template' ? { choices_on_page: true } : {}),
                ...(field.retired ? { taken_off: true } : {}),
                ...(staysBecause(field) ? { stays: true } : {}),
            })),
        });
    }

    return forms;
};

/** What Brand offers on this design (the palettes, pairs of fonts and colour roles its tab shows), for the chat. */
const brandOf = (doc) => {
    const config = doc.defaultView?.liveEditBrand;
    const tokens = config?.tokens ?? [];
    if (!tokens.length) return null;
    const roles = tokens.filter((t) => t.kind === 'colour').map((t) => t.key.split('.').pop());
    const faces = new Set((config.faces ?? []).map((face) => face.id));
    const styles = doc.defaultView.getComputedStyle(doc.documentElement);

    return {
        palettes: PALETTES.filter((p) => roles.every((role) => p.colours[role])).map((p) => p.name),
        fonts: PAIRINGS.filter((p) => faces.has(p.display) && faces.has(p.body)).map((p) => p.name),
        colours: Object.fromEntries(tokens.filter((t) => t.kind === 'colour').map((t) => [t.key.split('.').pop(), styles.getPropertyValue(t.property).trim()])),
    };
};

/** The page's title and description as Google shows them, where the SEO tab can change them. */
const seoOf = (doc) => {
    const config = doc.defaultView?.liveEditSeo;
    if (!config?.title?.key && !config?.descriptionKey) return null;

    return {
        title: cut(config.title?.title ?? doc.title, 200),
        description: cut(config.description ?? doc.querySelector('meta[name="description"]')?.content ?? '', 400),
    };
};

/** A shop's terms, written as words on its pages, which the Shop tab saves everywhere at once. */
const SHOP_TERMS = '[data-kit-rate], [data-kit-free-over], [data-kit-deal-code], [data-kit-deal-percent]';

/** The shop's terms and delivery choices as the Shop tab shows them, for the chat to change the same way. */
const shopTermsOf = (doc) => {
    const shop = doc.defaultView?.liveEditShop;
    if (!shop) return [];
    const terms = (shop.fields ?? []).filter((f) => f.label).map((f) => ({ term: cut(f.label, 80), value: cut(f.value ?? '', 120) }));
    for (const choice of shop.delivery?.choices ?? []) {
        terms.push({ term: cut(`Delivery: ${choice.name}`, 80), value: cut(choice.price ?? '', 60) });
    }

    return terms.slice(0, 30);
};

/** The business's own facts, set once in Brand and shown wherever the template marks them. */
const BRAND_MARKERS = ['data-logo', 'data-brand-name', 'data-brand-phone', 'data-brand-phone-2', 'data-brand-whatsapp', 'data-brand-email', 'data-brand-address'];

/** Whether this marker on this element shows a business fact rather than words of its own. */
const followsTheBrand = (element, attribute) => {
    const marker = BRAND_MARKERS.find((name) => element.hasAttribute(name));
    if (!marker) return false;
    // "link": only where it leads follows the brand; its words are the owner's here
    if (element.getAttribute(marker) === 'link') return attribute === 'data-edit-href';

    return true;
};

/**
 * The business details the chat can change for the whole site, as Brand does (key, what it is, what it says now):
 * the name and the ways it is reached that this page shows.
 */
const businessOf = (doc, root) => {
    const identity = doc.defaultView?.liveEditBrand?.identity ?? {};
    const details = [];
    if (identity.nameKey && root.querySelector('[data-brand-name]')) {
        const shown = clean(root.querySelector('[data-brand-name]')?.textContent ?? '');
        details.push({ key: identity.nameKey, label: 'Business name', value: cut(identity.name || shown, 120) });
    }
    for (const contact of identity.contacts ?? []) {
        if (!contact?.key || !contact.marker || !root.querySelector(`[${contact.marker}]`)) continue;
        // what the page shows when Brand holds nothing yet (the design's own), as the Brand tab fills its box
        const shown = clean(root.querySelector(`[${contact.marker}]:not([${contact.marker}="link"])`)?.textContent ?? '');
        details.push({ key: contact.key, label: cut(contact.label || 'Contact', 60), value: cut(contact.value || shown, 240) });
    }

    return details;
};

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
