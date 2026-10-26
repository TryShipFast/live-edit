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
 * Keep the page's fixed things clear of `bar` while `isEditing()` holds.
 * Returns a function that stops watching and puts everything back.
 */
export const keepClearOfTheBar = ({ bar, isEditing, doc = document, skip = () => false }) => {
    const view = doc.defaultView;
    const lifted = new Map();
    const putBack = () => {
        for (const [element, before] of lifted) element.style.translate = before;
        lifted.clear();
    };
    const apply = () => {
        putBack();
        if (!isEditing()) return;
        const barRect = bar.getBoundingClientRect();
        if (!barRect.width || !barRect.height) return;
        for (const element of doc.body.querySelectorAll('*')) {
            if (skip(element) || !staysPut(element, view)) continue;
            if ([...lifted.keys()].some((outer) => outer.contains(element))) continue;
            const lift = liftFor(element.getBoundingClientRect(), barRect, view.innerHeight);
            if (!lift) continue;
            lifted.set(element, element.style.translate);
            element.style.translate = `0 ${-lift}px`;
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
