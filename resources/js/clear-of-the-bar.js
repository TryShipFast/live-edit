/**
 * The site's own fixed things, kept clear of the editor's bar while editing.
 *
 * The bar sits fixed at the foot of the screen. A site's fixed things sit
 * there too: a phone's Book and Call bar, a cookie notice, a chat button. No
 * scrolling brings them out from under the bar, so the owner could not click
 * them to change their words. While editing, each one the bar covers is lifted
 * just above it (the CSS `translate` property, which leaves the site's own
 * `transform` alone), and put back exactly as it was when editing stops. A
 * visitor never sees any of it: it only runs in the editor.
 */

const GAP = 8;

/** Fixed, or stuck: a thing that stays put on screen whatever the scroll. */
const staysPut = (element, view) => {
    const position = view.getComputedStyle(element).position;
    return position === 'fixed' || position === 'sticky';
};

/**
 * How far to lift `rect` so it clears `bar`, or 0 when it does not need to.
 * Only things that overlap the bar and sit in the lower half of the screen are
 * lifted: a full-screen menu or dialog is the owner's to open and close, not
 * something to slide away.
 */
export const liftFor = (rect, bar, viewHeight) => {
    if (!rect.width || !rect.height) return 0;
    const overlaps = rect.bottom > bar.top && rect.top < bar.bottom && rect.right > bar.left && rect.left < bar.right;
    if (!overlaps) return 0;
    if (rect.height > viewHeight / 2) return 0;
    const lift = rect.bottom - (bar.top - GAP);
    return lift > 0 && lift <= viewHeight / 2 ? Math.ceil(lift) : 0;
};

/**
 * How much room to add at the foot of a full-screen fixed thing (a phone menu, a dialog) that the bar covers, or 0.
 * It is not slid away (the owner opens and closes it); room at its foot lets its last links scroll up above the bar,
 * where they can be pressed. Adeola Crest's phone menu kept its last four links under the bar.
 */
export const roomFor = (rect, bar, viewHeight) => {
    if (!rect.width || !rect.height || rect.height <= viewHeight / 2) return 0;
    const overlaps = rect.bottom > bar.top && rect.top < bar.bottom && rect.right > bar.left && rect.left < bar.right;
    // what the bar covers of it on screen, never more: a menu taller than the screen is not covered below it
    return overlaps ? Math.ceil(Math.min(rect.bottom, viewHeight) - bar.top + GAP) : 0;
};

/**
 * The element's own padding before any room was added, kept on the element itself. Room is always added to this,
 * never to what is there now: added to what is there now, every change on the page added the room again (Adeola
 * Crest's phone menu grew to millions of pixels), since a second watcher, or a re-run before the first was put back,
 * read the room already added as the element's own.
 */
const ROOM = 'data-le-room-before';
const GIVEN = 'data-le-room';

/**
 * Keep the page's fixed things clear of `bar` while `isEditing()` holds.
 * Returns a function that stops watching and puts everything back.
 */
export const keepClearOfTheBar = ({ bar, isEditing, doc = document, skip = () => false }) => {
    const view = doc.defaultView;
    const lifted = new Map();
    const roomed = new Map();
    const unroom = (element) => {
        if (element.hasAttribute(ROOM)) element.style.paddingBottom = element.getAttribute(ROOM);
        element.removeAttribute(ROOM);
        element.removeAttribute(GIVEN);
    };
    const putBack = () => {
        for (const [element, before] of lifted) element.style.translate = before;
        lifted.clear();
        for (const element of roomed.keys()) unroom(element);
        roomed.clear();
    };
    const apply = () => {
        if (!isEditing()) { putBack(); return; }
        // lifts are measured from where things sit unlifted, so they are put back first; room is not taken off and
        // put back, since a menu without it for a moment is scrolled back by the browser, and what the owner was
        // pointing at jumps away under the pointer
        for (const [element, before] of lifted) element.style.translate = before;
        lifted.clear();
        const barRect = bar.getBoundingClientRect();
        if (!barRect.width || !barRect.height) { putBack(); return; }
        const roomNow = new Set();
        for (const element of doc.body.querySelectorAll('*')) {
            if (skip(element) || !staysPut(element, view)) continue;
            if ([...lifted.keys()].some((outer) => outer.contains(element))) continue;
            const rect = element.getBoundingClientRect();
            const room = roomFor(rect, barRect, view.innerHeight);
            if (room) {
                if ([...roomNow].some((outer) => outer !== element && outer.contains(element))) continue;
                if (!element.hasAttribute(ROOM)) element.setAttribute(ROOM, element.style.paddingBottom);
                roomed.set(element, true);
                roomNow.add(element);
                // read with transitions off: a menu that animates its padding reports the padding it is animating
                // from, which is the room added last time
                const transition = element.style.transition;
                const was = element.style.paddingBottom;
                element.style.transition = 'none';
                element.style.paddingBottom = element.getAttribute(ROOM);
                const own = parseFloat(view.getComputedStyle(element).paddingBottom) || 0;
                // never less than it was given: the bar grows and shrinks for a moment (a "Saved" note), and room
                // taken away from a menu scrolled to its foot scrolls it back under the owner's pointer
                const given = Math.max(room, Number(element.getAttribute(GIVEN)) || 0);
                element.setAttribute(GIVEN, String(given));
                const want = `${own + given}px`;
                element.style.paddingBottom = was === want ? was : want;
                element.style.transition = transition;
                continue;
            }
            const lift = liftFor(rect, barRect, view.innerHeight);
            if (!lift) continue;
            lifted.set(element, element.style.translate);
            element.style.translate = `0 ${-lift}px`;
        }
        for (const element of [...roomed.keys()]) {
            if (roomNow.has(element)) continue;
            unroom(element);
            roomed.delete(element);
        }
    };
    let timer = 0;
    const soon = () => {
        view.clearTimeout(timer);
        timer = view.setTimeout(apply, 120);
    };
    // A cookie notice shown by the site's script, a bar shown at a breakpoint, editing turned on or off.
    // Style is not watched: the lift itself writes style, and would wake this again.
    const watcher = new view.MutationObserver(soon);
    watcher.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden', 'open'] });
    view.addEventListener('resize', soon);
    const barSize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(soon) : null;
    barSize?.observe(bar);
    apply();
    return () => {
        watcher.disconnect();
        barSize?.disconnect();
        view.removeEventListener('resize', soon);
        view.clearTimeout(timer);
        putBack();
    };
};
