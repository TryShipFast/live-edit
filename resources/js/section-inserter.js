/**
 * Where "+ Add a section" goes on a page the owner is editing.
 *
 * A page's sections are a list of kind "sections" (data-edit-list-kind), on
 * every page the host draws: the design's own pages as well as the ones the
 * owner made. Adding one used to be offered only inside the panel of a
 * section that had been clicked on its own words, so on a page the design
 * came with it was effectively hidden: click a card, a question or a photo
 * and the panel was about that card. A new page offers sections up front,
 * which is why the owner believed only new pages could have them.
 *
 * So the page says it where the section would go: on the line between two
 * sections (the one nearest the pointer) and after the last one. These work
 * the place out; the editor draws the button over the page, never in it, so
 * nothing in the design moves to make room.
 */

/** Whether an element is drawn at all (a home layout not shown is display:none). */
const isShown = (element) => Boolean(element) && element.getClientRects().length > 0;

/** The page's lists of sections a visitor can see, in page order. */
export function shownSectionLists(root = document) {
    return [...root.querySelectorAll('[data-edit-list-kind="sections"]')]
        .filter((list) => isShown(list) && !list.closest('[data-live-lock], [data-live-edit-lock]'));
}

/** A list's sections that are drawn, in order. */
export function shownSections(list) {
    return [...(list?.children ?? [])].filter((child) => child.dataset?.editItem && isShown(child));
}

/**
 * The line a section added here goes on: after which section (its item id),
 * and where that line is on screen. `after: null` on a list with nothing in it.
 */
const lineAfter = (list, sections, index) => {
    const box = list.getBoundingClientRect();
    if (index < 0) {
        return { list, after: null, top: box.top, left: box.left, width: box.width, last: true };
    }
    const rect = sections[index].getBoundingClientRect();
    const next = sections[index + 1]?.getBoundingClientRect();

    return {
        list,
        after: sections[index].dataset.editItem,
        // Halfway across any gap between the two, so the line sits between them rather than on either.
        top: next ? (rect.bottom + next.top) / 2 : rect.bottom,
        left: Math.min(rect.left, next?.left ?? rect.left),
        width: Math.max(rect.right, next?.right ?? rect.right) - Math.min(rect.left, next?.left ?? rect.left),
        last: !next,
    };
};

/**
 * The line nearest a point inside a section: above it when the point is in
 * its top half (below the section before it), below it otherwise. The first
 * section has no line above it to offer, because a section added always goes
 * after another one.
 */
export function insertionNear(list, element, clientY) {
    const sections = shownSections(list);
    const index = sections.findIndex((section) => section === element || section.contains(element));
    if (index === -1) return null;
    const rect = sections[index].getBoundingClientRect();
    const upper = clientY < rect.top + rect.height / 2;

    return lineAfter(list, sections, upper && index > 0 ? index - 1 : index);
}

/** The line after the last section of a list: the end of the page's sections. */
export function insertionAtEnd(list) {
    const sections = shownSections(list);

    return lineAfter(list, sections, sections.length - 1);
}

/** The section list a point on the page belongs to, and the section it is in. */
export function sectionUnder(element, root = document) {
    for (const list of shownSectionLists(root)) {
        const section = shownSections(list).find((candidate) => candidate === element || candidate.contains(element));
        if (section) return { list, section };
    }

    return null;
}

/** What a section is called, for "It goes below …". */
export function sectionName(section) {
    const name = section?.dataset?.editSectionLabel
        || section?.querySelector?.('h1, h2, h3')?.textContent
        || 'this section';

    return String(name).replace(/\s+/g, ' ').trim().slice(0, 48);
}
