/**
 * The editor's own UI — a package-owned overlay, not host markup.
 *
 * Everything the editor renders (toolbar, drawer, fields, toast, link handle)
 * is built here and mounted inside a shadow root, with the stylesheet below.
 * A shadow root is the only reliable isolation: the host theme's CSS cannot
 * reach inside it, and our styles cannot leak out. That is what makes the
 * editor look and behave identically on every site, whether the host uses
 * Tailwind, Bootstrap, or a hand-rolled premium theme.
 *
 * Hosts therefore need no drawer markup and no colour tokens; they only mark
 * the body `data-admin` and (optionally) declare toolbar extras.
 */

/** Styles for the overlay itself — scoped to the shadow root. */
const CHROME_CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
:host {
  --le-ink: #0f172a;
  --le-muted: #64748b;
  --le-line: #e2e8f0;
  --le-field: #cbd5e1;
  --le-soft: #f1f5f9;
  --le-brand: #2563eb;
  --le-danger: #dc2626;
  --le-live: #22c55e;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--le-ink);
}
button, input, select, textarea { font: inherit; color: inherit; margin: 0; }

/* Toolbar */
.le-toolbar {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 2147483000; display: flex; align-items: center; gap: 10px;
  max-width: calc(100vw - 24px); overflow-x: auto; white-space: nowrap;
  padding: 8px 10px 8px 16px; border-radius: 999px;
  background: var(--le-ink); color: #fff; font-size: 13px;
  box-shadow: 0 16px 40px rgba(2, 6, 23, .35);
  scrollbar-width: none;
}
.le-toolbar::-webkit-scrollbar { display: none; }
.le-status { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.le-dot { width: 8px; height: 8px; border-radius: 999px; background: #38bdf8; flex: none; }
.le-toolbar.is-editing .le-dot { background: var(--le-live); }
.le-btn {
  cursor: pointer; border: 0; border-radius: 999px; padding: 9px 16px;
  font-size: 13px; font-weight: 600; background: var(--le-brand); color: #fff;
  text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
}
.le-btn:hover { filter: brightness(1.08); }
.le-btn-ghost {
  cursor: pointer; border: 1px solid rgba(255,255,255,.25); background: transparent;
  color: #cbd5e1; border-radius: 999px; padding: 9px 14px; font-size: 13px;
  text-decoration: none; display: inline-flex; align-items: center;
}
.le-btn-ghost:hover { color: #fff; }
.le-locale {
  cursor: pointer; border: 1px solid rgba(255,255,255,.25); background: var(--le-ink);
  color: #cbd5e1; border-radius: 999px; padding: 8px 12px; font-size: 13px;
}

/* Drawer */
.le-drawer {
  position: fixed; inset-block: 0; right: 0; z-index: 2147483000;
  width: min(420px, 100vw); display: none; flex-direction: column;
  background: #fff; border-left: 1px solid var(--le-line);
  box-shadow: -24px 0 64px rgba(2, 6, 23, .18);
}
.le-drawer.is-open { display: flex; }
.le-drawer-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px; padding: 20px 24px; border-bottom: 1px solid var(--le-line);
}
.le-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--le-muted); margin-bottom: 4px; }
.le-title { font-size: 18px; font-weight: 700; }
.le-trail { display: none; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 11px; color: var(--le-muted); margin-bottom: 4px; }
.le-trail.is-visible { display: flex; }
.le-crumb { cursor: pointer; border: 0; background: transparent; color: var(--le-brand); padding: 0 2px; font-size: 11px; text-decoration: underline; }
.le-close { cursor: pointer; width: 34px; height: 34px; flex: none; border-radius: 999px; border: 1px solid var(--le-line); background: #fff; font-size: 18px; line-height: 1; }
.le-fields { flex: 1; overflow: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.le-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--le-line); }
.le-btn-outline { cursor: pointer; border: 1.5px solid var(--le-brand); background: transparent; color: var(--le-brand); border-radius: 999px; padding: 10px 18px; font-size: 14px; font-weight: 600; }
.le-btn-danger { cursor: pointer; border: 1.5px solid #f0c4c0; background: transparent; color: var(--le-danger); border-radius: 999px; padding: 9px 16px; font-size: 13px; font-weight: 600; }
.le-btn-danger.le-start { margin-right: auto; }
.le-hidden { display: none !important; }

/* Fields */
.le-field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; }
.le-field.le-divided { border-top: 1px solid var(--le-line); padding-top: 16px; }
.le-input {
  width: 100%; border: 1px solid var(--le-field); border-radius: 10px; background: #fff;
  padding: 12px 14px; font-size: 14px; font-weight: 400; color: var(--le-ink); outline: none; resize: vertical;
}
.le-input:focus { border-color: var(--le-brand); }
.le-hint { font-size: 11px; font-weight: 400; color: var(--le-muted); }
.le-section-heading { margin-top: 8px; border-top: 1px solid var(--le-line); padding-top: 16px; font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--le-muted); }
.le-row { display: flex; align-items: center; gap: 12px; }
.le-label { font-size: 13px; font-weight: 600; }
.le-chip-btn { cursor: pointer; border: 1px solid var(--le-field); background: #fff; color: var(--le-ink); border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 600; }
.le-chip-btn:hover { background: var(--le-soft); }
.le-color { width: 64px; height: 40px; cursor: pointer; border: 1px solid var(--le-field); border-radius: 10px; background: #fff; padding: 2px; }
.le-default { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 400; color: var(--le-muted); }
.le-tools { display: flex; align-items: center; gap: 4px; }
.le-tool { height: 28px; min-width: 28px; cursor: pointer; border: 1px solid var(--le-field); border-radius: 6px; background: #fff; padding: 0 6px; font-size: 12px; }
.le-tool:hover { background: var(--le-soft); }
.le-tool.is-bold { font-weight: 700; }
.le-tool.is-italic { font-style: italic; }
.le-icons { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.le-icon { display: flex; height: 40px; cursor: pointer; align-items: center; justify-content: center; border: 1px solid var(--le-field); border-radius: 10px; background: #fff; color: var(--le-ink); }
.le-icon:hover { background: var(--le-soft); }
.le-icon.is-active { border-color: var(--le-brand); background: var(--le-brand); color: #fff; }
.le-icon svg { width: 20px; height: 20px; }
.le-preview { display: flex; height: 200px; align-items: center; justify-content: center; overflow: hidden; border-radius: 12px; background: var(--le-soft); font-size: 13px; color: var(--le-muted); }
.le-preview img { width: 100%; height: 100%; object-fit: cover; }
.le-thumb { margin-top: 8px; height: 96px; width: 100%; object-fit: cover; border-radius: 8px; }
.le-upload { display: flex; cursor: pointer; flex-direction: column; gap: 8px; border: 2px dashed var(--le-field); border-radius: 12px; background: var(--le-soft); padding: 16px; font-size: 13px; font-weight: 600; }
.le-upload:hover { border-color: var(--le-brand); }
.le-upload input[type=file] { cursor: pointer; font-size: 13px; font-weight: 400; color: var(--le-muted); }

/* Floating pencil for links */
.le-handle {
  position: fixed; z-index: 2147483001; display: none; width: 24px; height: 24px;
  align-items: center; justify-content: center; border-radius: 999px;
  border: 1px solid var(--le-brand); background: #fff; color: var(--le-brand);
  font-size: 12px; line-height: 1; cursor: pointer; box-shadow: 0 4px 12px rgba(2,6,23,.2);
}
.le-handle.is-visible { display: flex; }

/* Toast */
.le-toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  z-index: 2147483002; border-radius: 999px; background: var(--le-ink); color: #fff;
  padding: 10px 20px; font-size: 13px; font-weight: 600;
  box-shadow: 0 10px 30px rgba(2,6,23,.3); transition: opacity .5s ease;
}
`;

/**
 * Affordances that must style the HOST page (outlines on editable elements),
 * so these go in the document, not the shadow root.
 */
export const PAGE_CSS = `
body.editing [data-edit],
body.editing [data-edit-href]:not([data-edit]) {
  outline: 2px dashed rgba(37, 99, 235, .55);
  outline-offset: 3px;
  border-radius: 3px;
  cursor: pointer;
}
body.editing [data-edit]:hover,
body.editing [data-edit-href]:not([data-edit]):hover {
  outline-style: solid;
  outline-color: #2563eb;
  background: rgba(37, 99, 235, .06);
}
body.editing [data-style]:not([data-edit]):hover {
  outline: 1px dashed rgba(37, 99, 235, .4);
  outline-offset: 2px;
}
body.editing [data-edit-img],
body.editing [data-edit-bg] {
  display: flex;
  opacity: 0;
  transition: opacity .15s ease;
}
body.editing [data-edit-img]:hover,
body.editing [data-edit-bg]:hover,
body.editing [data-edit-img]:focus-visible { opacity: 1; }
`;

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

/**
 * Mount the overlay and return every element the editor drives.
 */
export function createChrome() {
    // Page-level affordances live in the document; the UI lives in the shadow.
    const pageStyle = document.createElement('style');
    pageStyle.id = 'live-edit-page-css';
    pageStyle.textContent = PAGE_CSS;
    document.head.append(pageStyle);

    const root = document.createElement('div');
    root.id = 'live-edit-ui';
    document.body.append(root);
    const shadow = root.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CHROME_CSS;
    shadow.append(style);

    const config = window.liveEditToolbar ?? {};

    // ---- toolbar -----------------------------------------------------------
    const toolbar = el('div', 'le-toolbar');
    const status = el('span', 'le-status');
    const dot = el('span', 'le-dot');
    const statusText = el('span', null, 'Viewing as visitor');
    status.append(dot, statusText);
    toolbar.append(status);

    let localeSelect = null;
    const locales = config.locales ?? {};
    if (Object.keys(locales).length > 1) {
        localeSelect = el('select', 'le-locale');
        localeSelect.title = 'Language you are editing';
        Object.entries(locales).forEach(([code, label]) => {
            const option = el('option', null, label);
            option.value = code;
            option.selected = code === (config.locale ?? 'en');
            localeSelect.append(option);
        });
        localeSelect.addEventListener('change', () => {
            window.location.search = '?locale=' + localeSelect.value;
        });
        toolbar.append(localeSelect);
    }

    const toggleButton = el('button', 'le-btn', 'Edit site');
    toggleButton.type = 'button';
    const undoButton = el('button', 'le-btn-ghost', 'Undo');
    undoButton.type = 'button';
    undoButton.title = 'Undo the last change';
    toolbar.append(toggleButton, undoButton);

    (config.links ?? []).forEach((link) => {
        const anchor = el('a', 'le-btn-ghost', link.label);
        anchor.href = link.href;
        if (link.title) anchor.title = link.title;
        toolbar.append(anchor);
    });

    if (config.logout?.href) {
        if ((config.logout.method ?? 'get').toLowerCase() === 'post') {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = config.logout.href;
            const token = document.createElement('input');
            token.type = 'hidden';
            token.name = '_token';
            token.value = document.body.dataset.csrf ?? '';
            const submit = el('button', 'le-btn-ghost', 'Log out');
            submit.type = 'submit';
            form.append(token, submit);
            toolbar.append(form);
        } else {
            const anchor = el('a', 'le-btn-ghost', 'Log out');
            anchor.href = config.logout.href;
            toolbar.append(anchor);
        }
    }

    // ---- drawer ------------------------------------------------------------
    const drawer = el('div', 'le-drawer');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Edit content');

    const head = el('div', 'le-drawer-head');
    const headText = el('div');
    const drawerTrail = el('div', 'le-trail');
    const drawerTitle = el('div', 'le-title', 'Text');
    headText.append(el('div', 'le-eyebrow', 'Editing'), drawerTrail, drawerTitle);
    const closeButton = el('button', 'le-close', '×');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close');
    head.append(headText, closeButton);

    const drawerFields = el('div', 'le-fields');

    const foot = el('div', 'le-foot');
    const drawerDelete = el('button', 'le-btn-danger le-start le-hidden', 'Delete');
    drawerDelete.type = 'button';
    const cancelButton = el('button', 'le-btn-outline', 'Cancel');
    cancelButton.type = 'button';
    const saveButton = el('button', 'le-btn', 'Save changes');
    saveButton.type = 'button';
    foot.append(drawerDelete, cancelButton, saveButton);

    drawer.append(head, drawerFields, foot);

    // ---- floating link handle ---------------------------------------------
    const linkHandle = el('button', 'le-handle');
    linkHandle.type = 'button';
    linkHandle.setAttribute('aria-label', 'Edit this link');
    linkHandle.innerHTML = '&#9998;';

    shadow.append(toolbar, drawer, linkHandle);

    const toast = (message) => {
        const node = el('div', 'le-toast', message);
        shadow.append(node);
        setTimeout(() => (node.style.opacity = '0'), 1800);
        setTimeout(() => node.remove(), 2400);
    };

    return {
        root,
        shadow,
        toolbar,
        toggleButton,
        undoButton,
        statusText,
        dot,
        localeSelect,
        drawer,
        drawerTitle,
        drawerTrail,
        drawerFields,
        drawerDelete,
        closeButton,
        cancelButton,
        saveButton,
        linkHandle,
        toast,
    };
}
