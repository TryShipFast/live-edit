/*
 * Unsaved changes: asked about before they are lost, the way every editor people already use asks.
 *
 * Shopify admin, Squarespace and Google Docs all do the same two things. Closing the tab or reloading
 * with work not saved brings up the browser's own "Leave site?" question (beforeunload: the only thing
 * a page may do there). Leaving from inside the app (a link in the bar, opening another page, finishing
 * editing) asks in the app's own words: "You have unsaved changes. Leave without saving?", Leave or Stay.
 * Nothing is asked when nothing is unsaved (CONVENTIONS.md section 5, change 4).
 */

/** The question, in the words Shopify and Google Docs use. */
export const LEAVE_QUESTION = {
    title: 'You have unsaved changes',
    subtitle: 'Leave without saving? What you changed and did not save will be lost.',
    leave: 'Leave',
    stay: 'Stay',
};

/**
 * Whether a press on a link takes the browser away from this page: a plain press on a link to
 * another address in this window. A new tab, a download, a jump within the page, a phone number or
 * a press with a modifier key (a new tab again) leaves nothing behind.
 */
export function leavesThePage(link, event = {}, here = globalThis.location?.href ?? 'http://localhost/') {
    if (!link || typeof link.getAttribute !== 'function') return false;
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    const href = link.getAttribute('href');
    if (href === null || href === '' || href.startsWith('#')) return false;
    const target = (link.getAttribute('target') ?? '').toLowerCase();
    if (target && target !== '_self') return false;
    if (link.hasAttribute('download')) return false;
    let to;
    try {
        to = new URL(href, here);
    } catch {
        return false;
    }
    if (!/^https?:$/.test(to.protocol)) return false;
    const from = new URL(here);

    return !(to.origin === from.origin && to.pathname === from.pathname && to.search === from.search);
}

/**
 * Watch for leaving with unsaved changes.
 *
 *   isUnsaved()   true while anything is not saved
 *   ask()         resolves true to leave, false to stay (the editor's own dialog)
 *   roots         where links are pressed: the page, and the editor's shadow root
 *
 * Returns `leave(go)`: run `go` now when nothing is unsaved, or once the person says Leave; and
 * `allow()`, for a navigation already agreed to, so the browser does not ask a second time.
 */
export function guardLeaving({ win = window, isUnsaved, ask, roots = [] }) {
    let agreed = false;

    const onBeforeUnload = (event) => {
        if (agreed || !isUnsaved()) return undefined;
        event.preventDefault();
        // Older browsers show the question only when this is set.
        event.returnValue = '';

        return '';
    };
    win.addEventListener('beforeunload', onBeforeUnload);

    const leave = (go) => {
        if (!isUnsaved()) {
            go();

            return Promise.resolve(true);
        }

        return Promise.resolve(ask()).then((yes) => {
            if (yes) {
                agreed = true;
                go();
            }

            return yes;
        });
    };

    const onClick = (event) => {
        if (!isUnsaved()) return;
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
        const link = path.find((node) => node?.tagName === 'A' && node.hasAttribute?.('href'));
        if (!link || !leavesThePage(link, event, win.location.href)) return;
        // A link the editor handles itself while editing (a menu word being renamed) is not a way out.
        if (link.closest?.('[data-edit], [data-edit-href]') && win.document.body.classList.contains('editing')) return;
        event.preventDefault();
        event.stopPropagation();
        const href = link.href;
        leave(() => { win.location.assign(href); });
    };
    roots.forEach((root) => root.addEventListener('click', onClick, true));

    return {
        leave,
        allow: () => { agreed = true; },
        stop: () => {
            win.removeEventListener('beforeunload', onBeforeUnload);
            roots.forEach((root) => root.removeEventListener('click', onClick, true));
        },
    };
}
