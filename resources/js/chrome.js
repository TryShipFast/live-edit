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
  --le-ink: #0b1220;
  --le-body: #334155;
  --le-muted: #7c8899;
  --le-line: #e8ecf1;
  --le-field: #d6dde7;
  --le-soft: #f6f8fb;
  --le-accent: #111827;
  --le-accent-soft: rgba(17, 24, 39, .10);
  --le-danger: #e11d48;
  --le-live: #22c55e;
  --le-shadow: 0 24px 60px -12px rgba(11, 18, 32, .28), 0 8px 20px -8px rgba(11, 18, 32, .16);
  font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  font-size: 14px; line-height: 1.5; color: var(--le-body);
  -webkit-font-smoothing: antialiased;
}
button, input, select, textarea { font: inherit; color: inherit; margin: 0; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }

/* ---- toolbar ---- */
.le-toolbar {
  position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
  z-index: 2147483000; display: flex; align-items: center; gap: 8px;
  max-width: calc(100vw - 24px); overflow-x: auto; white-space: nowrap;
  padding: 7px 8px 7px 16px; border-radius: 999px;
  background: rgba(11, 18, 32, .92); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.08);
  color: #fff; font-size: 13px; box-shadow: var(--le-shadow);
  scrollbar-width: none;
}
.le-toolbar::-webkit-scrollbar { display: none; }
.le-status { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #e6ebf3; padding-right: 4px; }
.le-dot { width: 7px; height: 7px; border-radius: 999px; background: #64748b; flex: none; box-shadow: 0 0 0 3px rgba(100,116,139,.18); transition: background .2s ease, box-shadow .2s ease; }
.le-toolbar.is-editing .le-dot { background: var(--le-live); box-shadow: 0 0 0 3px rgba(34,197,94,.22); }
.le-btn {
  cursor: pointer; border: 0; border-radius: 999px; padding: 9px 18px;
  font-size: 13px; font-weight: 600; background: var(--le-accent); color: #fff;
  text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
  box-shadow: 0 6px 16px -8px rgba(11,18,32,.6); transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.le-btn:hover { background: #000; transform: translateY(-1px); }
.le-btn:active { transform: translateY(0); }
.le-btn-ghost {
  cursor: pointer; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.04);
  color: #cbd5e1; border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 500;
  text-decoration: none; display: inline-flex; align-items: center; transition: background .15s ease, color .15s ease;
}
.le-btn-ghost:hover { background: rgba(255,255,255,.12); color: #fff; }
.le-toolbar .le-btn { background: #fff; color: #0b1220; box-shadow: none; }
.le-toolbar .le-btn:hover { background: #e9edf3; }
.le-locale {
  cursor: pointer; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.04);
  color: #cbd5e1; border-radius: 999px; padding: 8px 12px; font-size: 13px;
}

/* ---- drawer ---- */
.le-drawer {
  position: fixed; inset-block: 0; right: 0; z-index: 2147483000;
  width: min(430px, 100vw); display: none; flex-direction: column;
  background: #fff; border-left: 1px solid var(--le-line);
  border-radius: 20px 0 0 20px; box-shadow: var(--le-shadow); overflow: hidden;
}
.le-drawer.is-open { display: flex; animation: le-slide .28s cubic-bezier(.22,.7,.28,1); }
@keyframes le-slide { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
.le-drawer-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--le-line); background: #fff;
}
.le-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--le-muted); margin-bottom: 6px; }
.le-title { font-size: 19px; font-weight: 700; color: var(--le-ink); letter-spacing: -.01em; }
.le-trail { display: none; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 11px; color: var(--le-muted); margin-bottom: 6px; }
.le-trail.is-visible { display: flex; }
.le-crumb {
  cursor: pointer; border: 0; background: var(--le-soft); color: var(--le-accent);
  padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; transition: background .15s ease, color .15s ease;
}
.le-crumb:hover { background: var(--le-accent); color: #fff; }
.le-close {
  cursor: pointer; width: 32px; height: 32px; flex: none; border-radius: 10px;
  border: 1px solid var(--le-line); background: #fff; color: var(--le-body);
  font-size: 17px; line-height: 1; transition: background .15s ease, color .15s ease;
}
.le-close:hover { background: var(--le-soft); color: var(--le-ink); }
.le-fields { flex: 1; overflow: auto; padding: 22px 24px; display: flex; flex-direction: column; gap: 18px; }
.le-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 24px; border-top: 1px solid var(--le-line); background: var(--le-soft);
}
.le-btn-outline {
  cursor: pointer; border: 1px solid var(--le-field); background: #fff; color: var(--le-body);
  border-radius: 999px; padding: 10px 18px; font-size: 13px; font-weight: 600; transition: background .15s ease, border-color .15s ease;
}
.le-btn-outline:hover { background: var(--le-soft); border-color: var(--le-muted); }
.le-btn-danger {
  cursor: pointer; border: 1px solid rgba(225,29,72,.3); background: rgba(225,29,72,.05);
  color: var(--le-danger); border-radius: 999px; padding: 8px 16px; font-size: 13px; font-weight: 600; transition: background .15s ease;
}
.le-btn-danger:hover { background: rgba(225,29,72,.12); }
.le-btn-danger.le-start { margin-right: auto; }
.le-hidden { display: none !important; }

/* ---- fields ---- */
.le-field { display: flex; flex-direction: column; gap: 7px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--le-muted); }
.le-field.le-divided { border-top: 1px solid var(--le-line); padding-top: 18px; }
.le-input {
  width: 100%; border: 1px solid var(--le-field); border-radius: 12px; background: #fff;
  padding: 11px 14px; font-size: 14px; font-weight: 400; letter-spacing: normal; text-transform: none;
  color: var(--le-ink); outline: none; resize: vertical; transition: border-color .15s ease, box-shadow .15s ease;
}
.le-input::placeholder { color: #aab4c2; }
.le-input:focus { border-color: var(--le-accent); box-shadow: 0 0 0 4px var(--le-accent-soft); }
.le-hint { font-size: 11px; font-weight: 400; letter-spacing: normal; text-transform: none; color: var(--le-muted); }
.le-section-heading {
  margin-top: 4px; border-top: 1px solid var(--le-line); padding-top: 18px;
  font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--le-muted);
}
.le-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.le-label { font-size: 13px; font-weight: 600; color: var(--le-body); letter-spacing: normal; text-transform: none; }
.le-chip-btn {
  cursor: pointer; border: 1px solid var(--le-field); background: #fff; color: var(--le-body);
  border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 600; transition: background .15s ease, border-color .15s ease;
}
.le-chip-btn:hover { background: var(--le-soft); border-color: var(--le-accent); color: var(--le-accent); }
.le-color { width: 56px; height: 38px; cursor: pointer; border: 1px solid var(--le-field); border-radius: 10px; background: #fff; padding: 3px; }
.le-default { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 500; letter-spacing: normal; text-transform: none; color: var(--le-muted); }
.le-tools { display: flex; align-items: center; gap: 5px; }
.le-tool { height: 28px; min-width: 28px; cursor: pointer; border: 1px solid var(--le-field); border-radius: 8px; background: #fff; color: var(--le-body); padding: 0 7px; font-size: 12px; transition: background .15s ease; }
.le-tool:hover { background: var(--le-soft); }
.le-tool.is-bold { font-weight: 700; }
.le-tool.is-italic { font-style: italic; }
.le-icons { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.le-icon { display: flex; height: 40px; cursor: pointer; align-items: center; justify-content: center; border: 1px solid var(--le-field); border-radius: 10px; background: #fff; color: var(--le-body); transition: background .15s ease, border-color .15s ease; }
.le-icon:hover { background: var(--le-soft); border-color: var(--le-accent); }
.le-icon.is-active { border-color: var(--le-accent); background: var(--le-accent); color: #fff; }
.le-icon svg { width: 20px; height: 20px; }
.le-preview { display: flex; height: 190px; align-items: center; justify-content: center; overflow: hidden; border-radius: 14px; background: var(--le-soft); border: 1px solid var(--le-line); font-size: 13px; font-weight: 400; letter-spacing: normal; text-transform: none; color: var(--le-muted); }
.le-preview img { width: 100%; height: 100%; object-fit: cover; }
.le-thumb { height: 92px; width: 100%; object-fit: cover; border-radius: 12px; border: 1px solid var(--le-line); }
.le-upload {
  display: flex; cursor: pointer; flex-direction: column; gap: 8px;
  border: 1.5px dashed var(--le-field); border-radius: 14px; background: var(--le-soft);
  padding: 14px 16px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--le-muted);
  transition: border-color .15s ease, background .15s ease;
}
.le-upload:hover { border-color: var(--le-accent); background: #fff; }
.le-upload input[type=file] { cursor: pointer; font-size: 13px; font-weight: 400; letter-spacing: normal; text-transform: none; color: var(--le-body); }

/* ---- floating pencil ---- */
.le-handle {
  position: fixed; z-index: 2147483001; display: none; width: 26px; height: 26px;
  align-items: center; justify-content: center; border-radius: 999px;
  border: 0; background: var(--le-accent); color: #fff;
  font-size: 12px; line-height: 1; cursor: pointer; box-shadow: 0 6px 16px -4px rgba(11,18,32,.6);
}
.le-handle.is-visible { display: flex; }
.le-handle-bg { width: 28px; height: 28px; font-size: 13px; background: #0b1220; }

/* ---- toast ---- */
.le-toast {
  position: fixed; bottom: 86px; left: 50%; transform: translateX(-50%);
  z-index: 2147483002; border-radius: 999px; background: var(--le-ink); color: #fff;
  padding: 10px 20px; font-size: 13px; font-weight: 600;
  box-shadow: var(--le-shadow); transition: opacity .5s ease;
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

    // Backgrounds painted by the theme's stylesheet have nothing in the markup
    // to click, so they get their own hover handle.
    const bgHandle = el('button', 'le-handle le-handle-bg');
    bgHandle.type = 'button';
    bgHandle.setAttribute('aria-label', 'Replace this background image');
    bgHandle.title = 'Replace background image';
    bgHandle.innerHTML = '&#9635;';

    shadow.append(toolbar, drawer, linkHandle, bgHandle);

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
        bgHandle,
        toast,
    };
}
