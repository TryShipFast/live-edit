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
/* A class that sets display beats the browser's rule for [hidden], so a button
   hidden in script stayed on screen. The preview link showed on every site
   without publishing, doing nothing when pressed. */
[hidden] { display: none !important; }
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
/* On a narrow screen the bar clipped its own controls behind a scrollbar it
   hides, so a phone showed the status sentence and no buttons at all. The
   sentence is the widest thing in it and the least useful — the dot already
   says whether editing is on — so it goes, and what is left wraps rather than
   scrolling out of reach. */
@media (max-width: 760px) {
  .le-toolbar {
    left: 10px; right: 10px; transform: none; max-width: none;
    flex-wrap: wrap; justify-content: center; gap: 6px;
    border-radius: 18px; padding: 8px; overflow-x: visible; white-space: normal;
  }
  .le-status { padding-right: 0; }
  .le-status span { display: none; }
}
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
/* The text box holds the client's own words, so it reads like a page rather
   than a form control: a longer measure, room to breathe, and a surface that
   lifts to white as they type. */
.le-prose {
  font-size: 15px; line-height: 1.65; padding: 14px 16px; min-height: 76px;
  background: var(--le-soft); border-radius: 14px; resize: none; overflow: hidden;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}
.le-prose:hover { background: #fff; }
.le-prose:focus { background: #fff; }
/* The address sits beside the words, so it is built from the same surface:
   one field, not a form control bolted under a designed one. */
.le-link {
  font-size: 15px; padding: 13px 16px; border-radius: 14px; background: var(--le-soft);
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}
.le-link:hover, .le-link:focus { background: #fff; }
.le-input:focus { border-color: var(--le-accent); box-shadow: 0 0 0 4px var(--le-accent-soft); }
.le-icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
    gap: 6px;
    max-height: 320px;
    overflow-y: auto;
    padding: 4px 2px;
}
.le-icon-choice {
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    font-size: 19px;
    color: var(--le-ink);
    background: #fff;
    border: 1px solid var(--le-field);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color .12s, background .12s;
}
.le-icon-choice:hover { border-color: var(--le-accent); background: var(--le-soft); }
.le-icon-choice.is-current { border-color: var(--le-accent); box-shadow: inset 0 0 0 1px var(--le-accent); }
/* The glyph is drawn with the page's icon font, set inline per element. */
.le-icon-choice { line-height: 1; }
.le-btn-publish {
  border: none; background: var(--le-live); color: #05300f; font-weight: 650;
  border-radius: 999px; padding: 8px 16px; cursor: pointer; font-size: 13px;
  transition: filter .15s ease;
}
.le-btn-publish:hover { filter: brightness(1.06); }
.le-btn-publish:disabled { opacity: .5; cursor: default; filter: none; }
.le-immediate {
  margin-top: 10px; padding: 10px 12px; border-radius: 10px;
  background: #fff8e6; border: 1px solid #f0dfae; color: #7a5b12;
}
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

/* ---- form controls ---- */
input[type=checkbox], input[type=radio] {
  appearance: none; -webkit-appearance: none; width: 18px; height: 18px; flex: none;
  cursor: pointer; border: 1.5px solid var(--le-field); background: #fff;
  display: inline-grid; place-content: center;
  transition: border-color .15s ease, background .15s ease;
}
input[type=checkbox] { border-radius: 6px; }
input[type=radio] { border-radius: 999px; }
input[type=checkbox]:hover, input[type=radio]:hover { border-color: var(--le-ink); }
input[type=checkbox]::after {
  content: ''; width: 10px; height: 10px; transform: scale(0); transition: transform .12s ease-in-out;
  box-shadow: inset 1em 1em #fff;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
}
input[type=radio]::after {
  content: ''; width: 8px; height: 8px; border-radius: 999px; transform: scale(0);
  transition: transform .12s ease-in-out; box-shadow: inset 1em 1em #fff;
}
input[type=checkbox]:checked, input[type=radio]:checked { background: var(--le-ink); border-color: var(--le-ink); }
input[type=checkbox]:checked::after, input[type=radio]:checked::after { transform: scale(1); }
input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid var(--le-ink); outline-offset: 2px; }

select.le-input {
  appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 38px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237c8899' stroke-width='2.5' stroke-linecap='round'><path d='M6 9l6 6 6-6'/></svg>");
  background-repeat: no-repeat; background-position: right 13px center; background-size: 13px;
}

/* radio pills, for short option sets */
.le-choices { display: flex; flex-wrap: wrap; gap: 8px; }
.le-choice {
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
  border: 1px solid var(--le-field); border-radius: 999px; padding: 7px 14px;
  font-size: 13px; font-weight: 500; letter-spacing: normal; text-transform: none;
  color: var(--le-body); background: #fff; transition: border-color .15s ease, background .15s ease, color .15s ease;
}
.le-choice:hover { border-color: var(--le-ink); }
.le-choice.is-selected { border-color: var(--le-ink); background: var(--le-ink); color: #fff; }
.le-choice.is-selected input[type=radio] { background: #fff; border-color: #fff; }
.le-choice.is-selected input[type=radio]::after { box-shadow: inset 1em 1em var(--le-ink); transform: scale(1); }

/* upload widget */
.le-upload input[type=file] { display: none; }
.le-upload.is-dragover { border-color: var(--le-ink); background: #fff; }
.le-upload-inner { display: flex; align-items: center; gap: 12px; }
.le-upload-icon {
  width: 36px; height: 36px; flex: none; border-radius: 10px; background: #fff;
  border: 1px solid var(--le-line); display: grid; place-content: center; font-size: 15px; color: var(--le-body);
}
.le-upload-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.le-upload-title { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--le-body); }
.le-upload-hint { font-size: 11px; font-weight: 400; letter-spacing: normal; text-transform: none; color: var(--le-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.le-upload-btn {
  margin-left: auto; flex: none; border: 1px solid var(--le-field); background: #fff;
  border-radius: 999px; padding: 7px 14px; font-size: 12px; font-weight: 600; color: var(--le-ink);
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.le-upload:hover .le-upload-btn { background: var(--le-ink); color: #fff; border-color: var(--le-ink); }

/* ---- hover indicator ---- */
.le-hover {
  position: fixed; z-index: 2147482999; pointer-events: none; display: none;
  border: 2px solid var(--le-ink); border-radius: 5px;
  background: rgba(17, 24, 39, .06);
  transition: top .06s linear, left .06s linear, width .06s linear, height .06s linear;
}
.le-hover.is-visible { display: block; }
.le-hover-label {
  position: absolute; top: -23px; left: -2px;
  background: var(--le-ink); color: #fff; font-size: 11px; font-weight: 600;
  letter-spacing: .02em; padding: 3px 8px; border-radius: 5px; white-space: nowrap;
}
.le-hover.is-flipped .le-hover-label { top: auto; bottom: -23px; }

/* ---- floating pencil ---- */
.le-handle {
  position: fixed; z-index: 2147483001; display: none; width: 26px; height: 26px;
  align-items: center; justify-content: center; border-radius: 999px;
  border: 0; background: var(--le-accent); color: #fff;
  font-size: 12px; line-height: 1; cursor: pointer; box-shadow: 0 6px 16px -4px rgba(11,18,32,.6);
}
.le-handle.is-visible { display: flex; }
.le-handle-bg {
  width: auto; height: auto; padding: 7px 13px; border-radius: 999px;
  font-size: 12px; font-weight: 600; letter-spacing: .01em; background: #0b1220; color: #fff;
  box-shadow: 0 8px 20px -6px rgba(11,18,32,.7);
}

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
  outline: 1px dashed rgba(17, 24, 39, .35);
  outline-offset: 3px;
  border-radius: 3px;
  cursor: pointer;
}
/* Hover is drawn by the overlay's indicator, which also names the element. */
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

    // Publishing: shown only where the site holds edits back. The count is on
    // the button because "Publish" alone does not say whether there is
    // anything to publish.
    const publishButton = el('button', 'le-btn-publish', 'Publish');
    publishButton.type = 'button';
    publishButton.title = 'Put your changes live';
    publishButton.hidden = true;

    const previewButton = el('button', 'le-btn-ghost', 'Preview link');
    previewButton.type = 'button';
    previewButton.title = 'Copy a link that shows the unpublished version';
    previewButton.hidden = true;

    toolbar.append(toggleButton, undoButton, publishButton, previewButton);

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
    bgHandle.textContent = 'Replace background';

    const hoverBox = el('div', 'le-hover');
    const hoverLabel = el('span', 'le-hover-label');
    hoverBox.append(hoverLabel);

    shadow.append(toolbar, drawer, linkHandle, bgHandle, hoverBox);

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
        publishButton,
        previewButton,
        closeButton,
        cancelButton,
        saveButton,
        linkHandle,
        bgHandle,
        hoverBox,
        hoverLabel,
        toast,
    };
}
