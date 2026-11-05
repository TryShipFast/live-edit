/**
 * The toolbar's own icons, and which of its controls wait under More.
 *
 * Small outline SVG paths drawn in the same style as icon-library.js (24px
 * grid, round caps, currentColor), so they load with the editor, work offline
 * and need nothing new. Host links may name one of LINK_ICONS in their `icon`
 * field ({ label, href, icon: 'dashboard' }) and are then drawn as a round icon
 * button with the label as its name and tooltip. A link without one, or with a
 * name not in this set, keeps its words, as it always did.
 */

const paths = {
    // the ones a host link may ask for
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    tracking: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/><path d="M16 8h4v4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.8-.6a8 8 0 0 1-1.7 1l-.3 1.9h-2.8l-.3-1.9a8 8 0 0 1-1.7-1l-1.8.6-1.4-2.4L7.1 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.8.6a8 8 0 0 1 1.7-1l.3-1.9h2.8l.3 1.9a8 8 0 0 1 1.7 1l1.8-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01"/>',
    external: '<path d="M15 3h6v6m-11 5L21 3M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    // the editor's own, for the More sheet
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9h-7a6 6 0 0 0 0 12h3"/>',
    page: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6m-3-3h6"/>',
    section: '<rect x="3" y="3" width="18" height="7" rx="1.5"/><path d="M3 14h8m-8 4h8m6-4v6m-3-3h6"/>',
    brand: '<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 22Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15.5" cy="7.5" r="1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    changes: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
    preview: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/>',
    language: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20m0-20a15 15 0 0 0 0 20"/>',
};

/** The names a host link may give as its `icon`. */
export const LINK_ICONS = ['dashboard', 'tracking', 'settings', 'help', 'external', 'logout'];

/** The icon a host link asked for, when it is one we draw; otherwise null and the link keeps its words. */
export const linkIcon = (link) => {
    const name = String(link?.icon ?? '').trim().toLowerCase();

    return LINK_ICONS.includes(name) ? name : null;
};

/** An icon as SVG markup, hidden from assistive technology: the control around it carries the name. */
export const toolbarIcon = (name, size = 18) => (paths[name]
    ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`
    : '');

/**
 * What the More sheet offers, in order: each control the bar hides when it is
 * folded, that this site has (not `hidden`). Disabled ones are listed, and
 * stay disabled, so the sheet does not change shape as undo history comes and
 * goes.
 */
export const sheetEntries = (entries) => entries.filter((entry) => entry && entry.control && !entry.control.hidden);
