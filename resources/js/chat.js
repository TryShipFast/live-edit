/**
 * Ask AI: the chat beside the page (LIVE-EDIT-STRUCTURE.md section 13; owner, 12 Nov 2026: "a simple chat box that
 * understand live edit and you can change things via chats and pop up widgets if need for things like uploads").
 *
 * Laid out the way people know it from Notion AI, Canva and Shopify Sidekick: a panel at the side, their words on the
 * right, the answer on the left, the input at the bottom, a few suggestions to start. A change shows on the page at
 * once as a draft, with Keep and Undo under the answer (owner: "Show it, Keep or Undo"). A photo opens the editor's
 * own photo panel for that picture (upload, free photos, generate); publishing opens the editor's own Publish window,
 * so neither has a second way of working.
 *
 * Everything the page needs is passed in by live-edit.js: how to call the API, how to read the page, how to show a
 * saved change, how to open a photo's panel and the Publish window.
 */

import { pageForTheChat, tappedForTheChat } from './chat-page.js';

export const CHAT_CSS = `
.le-chat { position: fixed; right: 16px; bottom: 84px; z-index: 2147483600; width: min(400px, calc(100vw - 32px));
  max-height: min(640px, calc(100vh - 120px)); display: flex; flex-direction: column; background: #fff; color: var(--le-ink, #0B0C0F);
  border: 1px solid var(--le-line, #E6E7EA); border-radius: 16px; box-shadow: 0 24px 60px rgba(11,12,15,.18), 0 2px 6px rgba(11,12,15,.08);
  font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; overflow: hidden; }
.le-chat[hidden] { display: none; }
.le-chat-head { display: flex; align-items: flex-start; gap: 12px; padding: 16px 16px 12px; border-bottom: 1px solid var(--le-line, #E6E7EA); }
.le-chat-head h2 { margin: 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.le-chat-head p { margin: 2px 0 0; font-size: 13px; color: var(--le-muted, #6B6F78); }
.le-chat-head .le-chat-x { margin-left: auto; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: inherit; font-size: 20px; line-height: 1; cursor: pointer; }
.le-chat-head .le-chat-x:hover { background: var(--le-soft, #F4F5F7); }
.le-chat-log { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.le-chat-msg { max-width: 88%; padding: 10px 12px; border-radius: 14px; white-space: pre-wrap; word-wrap: break-word; }
.le-chat-msg.is-owner { align-self: flex-end; background: var(--le-ink, #0B0C0F); color: #fff; border-bottom-right-radius: 4px; }
.le-chat-msg.is-ai { align-self: flex-start; background: var(--le-soft, #F4F5F7); border-bottom-left-radius: 4px; }
.le-chat-msg.is-wait { color: var(--le-muted, #6B6F78); }
.le-chat-card { align-self: stretch; border: 1px solid var(--le-line, #E6E7EA); border-radius: 12px; padding: 12px; display: grid; gap: 8px; }
.le-chat-card h3 { margin: 0; font-size: 13px; font-weight: 600; }
.le-chat-card ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.le-chat-card li { font-size: 13px; color: var(--le-body, #45484F); }
.le-chat-card li b { color: var(--le-ink, #0B0C0F); font-weight: 600; }
.le-chat-card p { margin: 0; font-size: 13px; color: var(--le-body, #45484F); }
.le-chat-acts { display: flex; gap: 8px; flex-wrap: wrap; }
.le-chat-btn { min-height: 36px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--le-field, #DADCE0); background: #fff; color: inherit; font: inherit; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none; }
.le-chat-btn:hover { border-color: var(--le-ink, #0B0C0F); }
.le-chat-btn.is-main { background: var(--le-ink, #0B0C0F); color: #fff; border-color: var(--le-ink, #0B0C0F); }
.le-chat-btn.is-publish { background: var(--le-blue, #1B6EF3); color: #fff; border-color: var(--le-blue, #1B6EF3); }
.le-chat-btn[disabled] { opacity: .5; cursor: default; }
.le-chat-done { font-size: 13px; color: var(--le-muted, #6B6F78); }
.le-chat-held { font-size: 13px; color: #7A4B00; background: #FFF8E8; border: 1px solid #F0C36D; border-radius: 8px; padding: 8px 10px; }
.le-chat-tips { display: flex; flex-wrap: wrap; gap: 8px; }
.le-chat-tip { min-height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--le-field, #DADCE0); background: #fff; color: inherit; font: inherit; font-size: 13px; cursor: pointer; }
.le-chat-tip:hover { border-color: var(--le-ink, #0B0C0F); }
.le-chat-about { display: flex; align-items: center; gap: 8px; margin: 0 16px; padding: 6px 10px; border-radius: 8px; background: var(--le-soft, #F4F5F7); font-size: 13px; }
.le-chat-about[hidden] { display: none; }
.le-chat-about button { margin-left: auto; border: 0; background: transparent; cursor: pointer; font-size: 16px; line-height: 1; color: inherit; }
.le-chat-form { display: flex; gap: 8px; align-items: flex-end; padding: 12px 16px 16px; }
.le-chat-form textarea { flex: 1; min-height: 44px; max-height: 140px; resize: none; padding: 11px 12px; border: 1px solid var(--le-field, #DADCE0); border-radius: 12px; font: inherit; color: inherit; }
.le-chat-form textarea:focus { outline: 2px solid var(--le-ink, #0B0C0F); outline-offset: 1px; }
.le-chat-send { width: 44px; height: 44px; flex: none; border: 0; border-radius: 12px; background: var(--le-ink, #0B0C0F); color: #fff; cursor: pointer; display: grid; place-items: center; }
.le-chat-send[disabled] { opacity: .4; cursor: default; }
.le-chat-tool { width: 44px; height: 44px; flex: none; border: 1px solid var(--le-field, #DADCE0); border-radius: 12px; background: #fff; color: inherit; cursor: pointer; display: grid; place-items: center; position: relative; }
.le-chat-tool:hover { border-color: var(--le-ink, #0B0C0F); }
.le-chat-tool[hidden] { display: none; }
.le-chat-tool[aria-disabled=true] { color: #8A8E96; cursor: default; }
.le-chat-tool[aria-disabled=true]:hover { border-color: var(--le-field, #DADCE0); }
.le-chat-soon { position: absolute; bottom: 52px; right: -8px; white-space: nowrap; background: var(--le-ink, #0B0C0F); color: #fff; font-size: 12px; padding: 5px 9px; border-radius: 6px; pointer-events: none; }
.le-chat-soon[hidden] { display: none; }
.le-chat-mic.is-recording { background: #C0392B; border-color: #C0392B; color: #fff; }
.le-chat-mic.is-recording:hover { border-color: #C0392B; }
.le-chat-mic[aria-busy=true] { cursor: progress; opacity: .6; }
.le-chat-attached { display: flex; align-items: center; gap: 8px; margin: 0 16px; padding: 6px 8px; border: 1px solid var(--le-line, #E6E7EA); border-radius: 10px; font-size: 13px; }
.le-chat-attached[hidden] { display: none; }
.le-chat-attached img { width: 36px; height: 36px; object-fit: cover; border-radius: 6px; }
.le-chat-attached span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.le-chat-attached button { border: 0; background: none; font-size: 18px; cursor: pointer; color: var(--le-muted, #6B6F78); }
.le-chat-pack { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 10px; border: 1px solid var(--le-field, #DADCE0); border-radius: 10px; font-size: 14px; cursor: pointer; }
.le-chat-pack:has(input:checked) { border: 2px solid var(--le-accent, #1B6EF3); padding: 0 9px; }
.le-chat-pack b { margin-left: auto; font-weight: 600; }
.le-chat-note { margin: 0; font-size: 12px; line-height: 1.5; color: var(--le-muted, #6B6F78); }
.le-chat-foot { padding: 0 16px 12px; margin-top: -6px; font-size: 12px; color: var(--le-muted, #6B6F78); }
/* An editor panel open (the photo the chat asked for, or anything tapped): the chat moves to the left of it, so both
   stay in view; where there is no room beside it, the chat steps aside until the panel closes. */
:host(.le-drawer-open) .le-chat { right: 416px; }
@media (max-width: 900px) { :host(.le-drawer-open) .le-chat { display: none; } }
/* a phone: a sheet over the lower half, so the page and what changed on it stay in view above (Google Maps, Canva) */
@media (max-width: 600px) { .le-chat { right: 8px; left: 8px; width: auto; bottom: 76px; max-height: min(calc(100vh - 96px), 56vh); } }
`;

const PLUS_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
const STOP_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
const MIC_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/></svg>';
const SEND_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
};

const button = (text, className = '') => {
    const node = el('button', `le-chat-btn ${className}`.trim(), text);
    node.type = 'button';

    return node;
};

/** Suggestions to start with, from what this page has: the way people are shown what to type in Notion AI and Canva. */
export function startersFor(page) {
    const tips = [];
    const heading = page.fields.find((field) => field.kind === 'text' && /^(Main heading|Heading)\b/.test(field.label ?? ''));
    if (heading) tips.push('Make the headline shorter and punchier');
    if (page.fields.some((field) => field.kind === 'image' || field.kind === 'background image')) tips.push('Replace the main photo');
    // a list of things the page shows ("Talks", "Questions"), said as a person would ("Add another talk"); never the
    // editor's own words for one, nor the page's furniture (buttons, links, menus), which no one starts with
    // (owner, 12 Nov 2026, the novice walk: "Add another to buttons" read as jargon)
    const furniture = /^(media|items?|list|page sections|sections?|buttons?|links?|menu|menus|nav|navigation|icons?|logos?|social|socials|columns?|rows?|tiles?|footer|header)$/;
    const list = page.lists.find((candidate) => !furniture.test(candidate.label.trim().toLowerCase()));
    if (list) {
        const name = list.label.trim().toLowerCase();
        tips.push(/[^s]s$/.test(name) ? `Add another ${name.slice(0, -1)}` : `Add to ${name}`);
    }
    tips.push('What can I change on this page?');

    return tips.slice(0, 4);
}

/**
 * @param {object} deps
 * @param {ShadowRoot} deps.shadow           where the panel goes
 * @param {Function} deps.request            the editor's request(url, options): the session's API
 * @param {Function} deps.showSaved          shows what was just saved on the page (re-reads the drafts); with
 *                                           { reload: true } draws the page again
 * @param {Function} deps.openPhoto          opens the photo panel for the picture with this key
 * @param {Function} deps.openPublish        opens the editor's own Publish window
 * @param {Function} deps.act                carries out one planned change the way a press does (live-edit.js)
 * @param {Function} deps.snapshot           what is waiting to publish now, for Undo
 * @param {Function} deps.undoPlan           what Undo takes back, from a snapshot before and after
 * @param {Function} deps.undo               takes it back, the Changes list's own way
 * @param {Function} [deps.busy]             the parts teammates hold now
 * @param {Function} [deps.selected]         the element the owner has open in the editor, if any
 * @param {string}   [deps.site]             to keep the conversation for this website through a reload
 */
export function createChat({ shadow, request, showSaved, openPhoto, openPublish, shown = () => {}, act = async () => ({ ok: false }), snapshot = async () => null, undoPlan = () => ({ revert: [], restore: [] }), undo: takeBack = async () => {}, busy: heldNow = () => [], selected = () => null, site = '' }) {
    // one conversation for the whole website, carried from page to page (owner, 13 Nov 2026: "seems ask AI feels new on
    // each page"): "take me to the Book page" and then what to change there is one conversation
    const memoryKey = `le-chat:${site}`;
    const remembered = (() => {
        try { return JSON.parse(sessionStorage.getItem(memoryKey) || 'null'); } catch { return null; }
    })();
    /** What was said, and what each answer did, so the conversation is still there after the page reloads. */
    const log = Array.isArray(remembered?.log) ? remembered.log : [];
    let credits = remembered?.credits ?? null;
    /** The message that ran out of credits, sent again once credits are added (here, or back from a card page). */
    let waitingToSend = typeof remembered?.waiting === 'string' ? remembered.waiting : null;
    let busy = false;
    let about = null;

    const remember = () => {
        try {
            sessionStorage.setItem(memoryKey, JSON.stringify({ log: log.slice(-40), credits, open: !panel.hidden, waiting: waitingToSend }));
        } catch { /* private mode: the chat still works */ }
    };

    const panel = el('section', 'le-chat');
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Ask AI');

    const head = el('header', 'le-chat-head');
    const titles = el('div');
    titles.append(el('h2', '', 'Ask AI'), el('p', '', 'Changes show on your page at once. Visitors see them when you publish.'));
    const close = el('button', 'le-chat-x', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close Ask AI');
    head.append(titles, close);

    const list = el('div', 'le-chat-log');
    list.setAttribute('aria-live', 'polite');

    const aboutRow = el('div', 'le-chat-about');
    aboutRow.hidden = true;
    const aboutText = el('span');
    const aboutClear = el('button', '', '×');
    aboutClear.type = 'button';
    aboutClear.setAttribute('aria-label', 'Ask about the whole page');
    aboutRow.append(aboutText, aboutClear);

    const form = el('form', 'le-chat-form');
    const input = el('textarea');
    input.rows = 1;
    input.placeholder = 'Ask for a change';
    input.setAttribute('aria-label', 'Message');
    const send = el('button', 'le-chat-send');
    send.type = 'submit';
    send.innerHTML = SEND_ICON;
    send.setAttribute('aria-label', 'Send');
    /*
     * + opens the editor's own photo chooser (owner, 12 Nov 2026: "pop up widgets if need for things like uploads"):
     * for the picture the owner has selected, or else the page's photos by name, one press each. The mic turns what
     * the owner says into the words of a message (voice, further down).
     */
    const attach = el('button', 'le-chat-tool');
    attach.type = 'button';
    attach.innerHTML = PLUS_ICON;
    attach.setAttribute('aria-label', 'Add a photo to your message');
    const mic = el('button', 'le-chat-tool le-chat-mic');
    mic.type = 'button';
    mic.innerHTML = MIC_ICON;
    mic.setAttribute('aria-label', 'Talk instead of typing');
    // a short note above the mic: how long it has been listening, or why it cannot
    const micNote = el('span', 'le-chat-soon');
    micNote.hidden = true;
    mic.append(micNote);
    form.append(attach, input, mic, send);

    const foot = el('p', 'le-chat-foot');

    panel.append(head, list, aboutRow, form, foot);
    shadow.append(panel);

    const showCredits = () => {
        foot.textContent = credits && typeof credits.balance === 'number'
            ? `Each message uses ${credits.cost ?? 1} AI credit. ${credits.balance} left.`
            : 'Each message uses 1 AI credit.';
    };

    const scrollDown = () => { list.scrollTop = list.scrollHeight; };

    /* ── drawing the conversation ─────────────────────────────── */

    const changeCard = (entry) => {
        const card = el('div', 'le-chat-card');
        card.append(el('h3', '', entry.changes.length === 0 ? 'Nothing changed' : entry.changes.length === 1 ? 'Changed on your page' : `${entry.changes.length} changes on your page`));
        const items = el('ul');
        for (const change of entry.changes) {
            const item = el('li');
            if (change.type === 'field') {
                const goesTo = change.to ?? change.value;
                const tab = change.new_tab === true ? ', opens in a new tab' : change.new_tab === false ? ', opens in the same tab' : '';
                item.append(el('b', '', `${change.label}: `), document.createTextNode(change.kind === 'link' ? `${goesTo ? `now goes to ${goesTo}` : 'link changed'}${tab}` : `“${change.value}”`));
            } else if (change.type === 'image') {
                item.append(el('b', '', `${change.label}: `), document.createTextNode('new photo'));
            } else if (change.type === 'style') {
                // said in the panel's own words: "text size 24, colour #1B6EF3", "spacing as designed"
                const named = { textColor: 'text colour', background: 'background', fontSize: 'text size', fontWeight: 'boldness', textAlign: 'alignment', lineHeight: 'line spacing', paddingY: 'space above and below', paddingX: 'space left and right', radius: 'rounded corners' };
                const said = Object.entries(change.props ?? {}).map(([prop, value]) => `${named[prop] ?? prop} ${value === '' ? 'as designed' : value}`).join(', ');
                item.append(el('b', '', `${change.label}: `), document.createTextNode(said || 'look changed'));
            } else if (change.type === 'seo') {
                item.append(el('b', '', 'In Google: '), document.createTextNode([change.title ? `title “${change.title}”` : null, change.description ? 'description changed' : null].filter(Boolean).join(', ')));
            } else if (change.type === 'brand') {
                item.append(el('b', '', 'Brand: '), document.createTextNode([change.palette ? `${change.palette} palette` : null, change.fonts ? `${change.fonts} type` : null, ...Object.entries(change.colours ?? {}).map(([role, colour]) => `${role} ${colour}`)].filter(Boolean).join(', ')));
            } else if (change.type === 'shop_term') {
                item.append(el('b', '', `${change.label}: `), document.createTextNode(`${change.value}, everywhere it is written`));
            } else if (change.type === 'add_section') {
                item.append(el('b', '', `${change.label}: `), document.createTextNode('added'));
            } else if (change.type === 'page') {
                const did = { add: 'added', rename: `renamed “${change.title}”`, menu: change.in_menu ? 'in the menu' : 'out of the menu', move: change.by < 0 ? 'moved up the menu' : 'moved down the menu', duplicate: 'copied', delete: 'deleted' }[change.do] ?? 'changed';
                item.append(el('b', '', `${change.label}: `), document.createTextNode(did));
            } else if (change.type === 'open') {
                item.append(document.createTextNode(change.label));
            } else if (change.type === 'undo') {
                item.append(document.createTextNode(change.which === 'redo' ? 'Your last undone change is back' : 'Your last change is taken back'));
            } else if (change.type === 'picture') {
                const what = change.make ? 'a picture made by AI' : change.find ? `a free photo of “${change.find}”` : null;
                item.append(el('b', '', `${change.label}: `), document.createTextNode([what, change.description ? 'description changed' : null].filter(Boolean).join(', ')));
            } else if (change.type === 'form') {
                item.append(el('b', '', `${change.label}: `), document.createTextNode(`${change.changes.length} change${change.changes.length === 1 ? '' : 's'} to its questions`));
            } else if (change.type === 'table') {
                item.append(el('b', '', `${change.label}: `), document.createTextNode(`table changed, ${change.rows.length} row${change.rows.length === 1 ? '' : 's'}`));
            } else if (change.type === 'business') {
                item.append(el('b', '', `${change.label}: `), document.createTextNode(`“${change.value}”, on every page`));
            } else if (change.type === 'delete') {
                item.append(el('b', '', `${change.label}: `), document.createTextNode('deleted'));
            } else {
                const did = { add: 'one added', duplicate: 'one copied', remove: 'one removed', move_up: 'one moved up', move_down: 'one moved down' }[change.action] ?? 'changed';
                item.append(el('b', '', `${change.label}: `), document.createTextNode(did));
            }
            items.append(item);
        }
        card.append(items);
        for (const missed of entry.missed ?? []) {
            card.append(el('p', 'le-chat-held', missed.locked ? `Not changed: ${missed.label}. ${missed.locked.name} is editing ${missed.locked.label} right now.` : `Not changed: ${missed.label}. ${missed.error ?? ''}`.trim()));
        }

        if (!entry.changes.length) {
            // nothing changed, nothing to keep or undo
        } else if (entry.state === 'kept') {
            card.append(el('p', 'le-chat-done', 'Kept.'));
        } else if (entry.state === 'undone') {
            card.append(el('p', 'le-chat-done', 'Undone.'));
        } else {
            const acts = el('div', 'le-chat-acts');
            const keep = button('Keep', 'is-main');
            const undo = button('Undo');
            keep.addEventListener('click', () => { entry.state = 'kept'; remember(); draw(); });
            undo.addEventListener('click', async () => {
                keep.disabled = true;
                undo.disabled = true;
                undo.textContent = 'Undoing…';
                try {
                    await takeBack(entry.undo);
                    entry.state = 'undone';
                    remember();
                    draw();
                    // the page is drawn again, as the editor's own Undo does, and the chat opens again where it was
                    await showSaved('Undone', { reload: true });
                } catch (error) {
                    keep.disabled = false;
                    undo.disabled = false;
                    undo.textContent = 'Undo';
                    say({ role: 'assistant', text: error.message || 'That could not be undone. Try again.' });
                }
            });
            acts.append(keep, undo);
            card.append(acts);
        }

        return card;
    };

    /*
     * A new photo, chosen and put in place in the chat (owner, 12 Nov 2026: "you're chatting with your website page /
     * Not looking for what to click / Click should only come up if it's uploading a file"): Upload a photo opens the
     * file picker and the photo goes in at once, with Keep and Undo. Free photos opens the picture's own chooser.
     */
    const photoCard = (card) => {
        const box = el('div', 'le-chat-card');
        box.append(el('h3', '', `New photo for ${card.label.toLowerCase() === 'photo' ? 'this picture' : card.label}`));
        if (card.suggestion) box.append(el('p', '', `Idea: ${card.suggestion}`));
        const acts = el('div', 'le-chat-acts');
        const upload = button('Upload a photo', 'is-main');
        upload.addEventListener('click', () => pickAFile((file) => putPhoto({ type: 'image', key: card.key, label: card.label, file, name: file.name })));
        const free = button('Free photos');
        free.addEventListener('click', () => openPhoto(card.key));
        acts.append(upload, free);
        box.append(acts);

        return box;
    };

    /** A file picker for one photo, as every upload button opens. */
    const pickAFile = (then) => {
        const picker = document.createElement('input');
        picker.type = 'file';
        picker.accept = 'image/*';
        picker.addEventListener('change', () => { if (picker.files?.[0]) then(picker.files[0]); });
        picker.click();
    };

    /** A photo uploaded from a card: put in place as the editor does, said like any change, with Undo. */
    const putPhoto = async (action) => {
        if (busy) return;
        busy = true;
        const waiting = { role: 'assistant', text: 'Putting your photo in…', wait: true };
        log.push(waiting);
        draw();
        const entry = { role: 'assistant', text: 'Done. Your photo is on the page.', changes: [], missed: [], cards: [], undo: { revert: [], restore: [] } };
        const before = await snapshot();
        const done = await act(action).catch((error) => ({ ok: false, error: error.message }));
        if (done?.ok) {
            entry.changes.push({ type: 'image', key: action.key, label: action.label });
            if (before) entry.undo = undoPlan(before, await snapshot());
        } else {
            entry.text = done?.locked ? `${done.locked.name} is editing ${done.locked.label} right now.` : (done?.error || 'That photo did not go in. Please try again.');
        }
        log.splice(log.indexOf(waiting), 1);
        say(entry);
        busy = false;
    };

    const publishCard = () => {
        const box = el('div', 'le-chat-card');
        box.append(el('p', '', 'When you are happy with the page, publish it and your visitors see it.'));
        const acts = el('div', 'le-chat-acts');
        const go = button('Publish…', 'is-publish');
        go.addEventListener('click', () => openPublish());
        acts.append(go);
        box.append(acts);

        return box;
    };

    /*
     * Out of credits. The owner adds some here, in a window over the editor (owner, 12 Nov 2026: "After they pay with
     * card. Are they redirected back to their last page / And last edit"): the packs and prices the host sells, Pay
     * with card, and the message they sent goes again once the credits are in. A host without that (another
     * adapter) gives its billing page instead; a teammate is told to ask the owner, who pays.
     */
    const creditsCard = (entry) => {
        const box = el('div', 'le-chat-card');
        const buy = window.liveEditChat?.buy;
        if (entry.buy !== 'here' || typeof buy?.pay !== 'function') {
            const acts = el('div', 'le-chat-acts');
            const link = el('a', 'le-chat-btn is-main', 'Add AI credits');
            link.href = entry.buy;
            link.target = '_blank';
            link.rel = 'noopener';
            acts.append(link);
            box.append(acts);

            return box;
        }
        box.append(el('h3', '', 'Add AI credits'));
        const choices = el('div', 'le-chat-tips');
        choices.style.display = 'grid';
        const pay = el('button', 'le-chat-btn is-main', 'Pay with card');
        pay.type = 'button';
        pay.disabled = true;
        const note = el('p', 'le-chat-note', 'Loading the packs…');
        box.append(choices, pay, note);
        const name = `le-pack-${Math.random().toString(36).slice(2, 7)}`;
        Promise.resolve(buy.packs()).then((offer) => {
            const packs = Array.isArray(offer?.packs) ? offer.packs : [];
            if (packs.length === 0) {
                note.textContent = 'AI credits are not on sale just now.';
                return;
            }
            const usual = Math.max(0, packs.findIndex((pack) => pack.featured));
            const chosenFirst = packs.some((pack) => pack.featured) ? usual : Math.min(1, packs.length - 1);
            packs.forEach((pack, index) => {
                const row = el('label', 'le-chat-pack');
                const radio = el('input');
                radio.type = 'radio';
                radio.name = name;
                radio.value = String(pack.credits);
                // the pack the price list puts forward chosen first (else the middle one), as a price list does
                radio.checked = index === chosenFirst;
                row.append(radio, document.createTextNode(` ${pack.credits} credits`), el('b', '', pack.price ?? ''));
                choices.append(row);
            });
            pay.disabled = false;
            note.textContent = 'Your message is kept and sent as soon as the credits are in.';
        }).catch(() => { note.textContent = 'The packs could not be loaded. Check your connection and try again.'; });

        pay.addEventListener('click', async () => {
            const chosen = box.querySelector(`input[name="${name}"]:checked`);
            if (!chosen) return;
            pay.disabled = true;
            pay.textContent = 'Opening…';
            remember();
            try {
                const result = await buy.pay(Number(chosen.value));
                if (result?.left) return; // off to the card page; this page comes back with the message waiting
                if (result?.paid) {
                    credits = { ...(credits ?? {}), balance: result.balance };
                    entry.buy = null;
                    entry.text = 'Thank you. Your credits are in.';
                    showCredits();
                    draw();
                    sendTheWaiting();
                    return;
                }
                note.textContent = result?.cancelled ? 'Payment closed. Nothing was charged.' : (result?.message ?? 'That payment did not go through. Nothing was charged.');
            } catch (error) {
                note.textContent = error?.message || 'That payment did not go through. Nothing was charged.';
            }
            pay.disabled = false;
            pay.textContent = 'Pay with card';
        });

        return box;
    };

    const greeting = () => {
        const box = el('div', 'le-chat-msg is-ai', 'Hi! Tell me what to change on this page: the words, a photo, a list. I show it on the page straight away, and you can undo it.');
        const tips = el('div', 'le-chat-tips');
        // about a part the owner clicked: what owners ask of that kind of part; else ideas from the page
        const forThePart = about ? ({
            text: ['Rewrite this', 'Make this shorter', 'Make this sound more friendly'],
            image: ['Replace this photo'],
            'background image': ['Replace this photo'],
            link: ['Change where this goes'],
        }[about.kind] ?? null) : null;
        for (const tip of forThePart ?? startersFor(pageForTheChat(document))) {
            const chip = el('button', 'le-chat-tip', tip);
            chip.type = 'button';
            chip.addEventListener('click', () => { input.value = tip; ask(); });
            tips.append(chip);
        }

        return [box, tips];
    };

    function draw() {
        list.replaceChildren();
        if (log.length === 0) list.append(...greeting());
        for (const entry of log) {
            if (entry.role === 'user') {
                list.append(el('div', 'le-chat-msg is-owner', entry.text));
                continue;
            }
            list.append(el('div', `le-chat-msg is-ai${entry.wait ? ' is-wait' : ''}`, entry.text));
            if (entry.changes?.length || entry.missed?.length) list.append(changeCard(entry));
            for (const card of entry.cards ?? []) {
                if (card.type === 'photo') list.append(photoCard(card));
                if (card.type === 'publish') list.append(publishCard());
            }
            if (entry.buy) list.append(creditsCard(entry));
        }
        showCredits();
        scrollDown();
    }

    const say = (entry) => {
        // the page it was said on, as the conversation now follows the owner from page to page
        entry.page ??= location.pathname;
        log.push(entry);
        remember();
        draw();
    };

    const showAbout = () => {
        aboutRow.hidden = !about;
        aboutText.textContent = about ? `About: ${about.label}` : '';
    };

    /* ── sending ──────────────────────────────────────────────── */

    // `again`: the message that ran out of credits, sent once they are in; it is already in the conversation
    async function ask(again = null) {
        let text = typeof again === 'string' ? again : input.value.trim();
        const sending = typeof again === 'string' ? null : attached;
        if (!text && sending) text = 'Put this photo on my page';
        if (!text || busy) return;
        if (sending) { attached = null; showAttached(); }
        busy = true;
        send.disabled = true;
        if (typeof again !== 'string') input.value = '';
        refreshAbout();
        // what each answer really changed goes with its words (owner, 13 Nov 2026: "if i type change heading and now make
        // it bigger, does it still know it's the heading"): "it" then means the part changed last, by its key
        const said = (entry) => {
            // said on another page: the model is told where, so "it" there is not a part of this page
            const elsewhere = entry.page && entry.page !== location.pathname ? `[On the page ${entry.page}] ` : '';
            const done = (entry.changes ?? []).filter((change) => change.label || change.key);
            if (entry.role !== 'assistant' || !done.length || entry.state === 'undone') return `${elsewhere}${entry.text}`;
            return `${elsewhere}${entry.text}\n[Changed: ${done.map((change) => `${change.label ?? 'a part'}${change.key ? ` (${change.field ?? change.key})` : ''}`).join('; ')}]`;
        };
        const history = log.filter((entry) => !entry.wait && entry.text && !entry.buy).map((entry) => ({ role: entry.role, text: said(entry) })).slice(-12);
        if (typeof again !== 'string') say({ role: 'user', text: sending ? `${text} 📎 ${sending.file.name || 'photo'}` : text });
        const waiting = { role: 'assistant', text: 'Working on it…', wait: true };
        log.push(waiting);
        draw();

        let entry;
        try {
            const response = await request('/live-edit/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history, page: pageForTheChat(document), tapped: about, busy: await heldNow(), attachments: sending ? [{ id: sending.id, name: String(sending.file.name || 'photo').slice(0, 120) }] : [], voice_seconds: Math.min(voiceSeconds, 600) }),
            });
            let data = await response.json();
            // the host answers on its queue (no web worker waits on the model): collect the answer when it is ready
            for (let tries = 0; response.status === 202 && data?.waiting && data.id && tries < 90; tries++) {
                await new Promise((resolve) => setTimeout(resolve, tries < 3 ? 600 : 1000));
                const answered = await request(`/live-edit/assistant/chat/${data.id}`, { method: 'GET' });
                const next = await answered.json();
                if (answered.status !== 202) { data = next; break; }
            }
            if (data?.waiting) throw new Error('The assistant is taking too long. Please try again in a moment.');
            credits = data.credits ?? credits;
            entry = { role: 'assistant', text: `${data.reply || 'Done.'}${data.credits?.refunded ? ' This one did not use a credit.' : ''}`, changes: [], missed: [], cards: data.cards ?? [], undo: { revert: [], restore: [] } };
            const planned = data.actions ?? [];
            if (planned.length) {
                // each one done as a press does it (live-edit.js), one after another, then Undo worked out from
                // what is waiting to publish before and after
                waiting.text = planned.length === 1 ? 'Changing it on your page…' : `Making ${planned.length} changes on your page…`;
                draw();
                const before = await snapshot();
                // a business detail shows on every page: the page is drawn again once the answer is kept
                let drawAgain = false;
                // another page, gone to once the answer is shown
                let goTo = null;
                for (const action of planned) {
                    // a photo the owner attached goes with the change that asks for it
                    const doing = action.type === 'image' ? { ...action, file: sending?.id === action.attachment ? sending.file : null, name: sending?.file?.name } : action;
                    const done = await act(doing).catch((error) => ({ ok: false, error: error.message }));
                    if (done?.ok && !done.unchanged) entry.changes.push(action);
                    if (done?.ok && done.reload) drawAgain = true;
                    if (done?.ok && done.goTo) goTo = done.goTo;
                    else if (!done?.ok) entry.missed.push({ label: action.label, locked: done?.locked ?? null, error: done?.error ?? null });
                }
                if (entry.changes.length && before) entry.undo = undoPlan(before, await snapshot());
                entry.drawAgain = drawAgain;
                entry.goTo = goTo;
                if (!entry.changes.length) entry.text = entry.missed.some((missed) => missed.locked)
                    ? 'I could not change that: someone else is working on that part right now.'
                    : 'I could not make that change on this page.';
            }
        } catch (error) {
            entry = { role: 'assistant', text: error.message || 'Something went wrong. Please try again.' };
            if (error.status === 402) {
                waitingToSend = text;
                outOfCredits(entry, error);
            }
        }

        log.splice(log.indexOf(waiting), 1);
        say(entry);
        busy = false;
        send.disabled = false;
        input.focus();
        // the conversation is kept (sessionStorage), so the page can be drawn again to show every copy
        if (entry?.goTo) {
            const where = entry.goTo;
            entry.goTo = null;
            remember();
            setTimeout(() => { window.location.href = where; }, 900);
        } else if (entry?.drawAgain) {
            entry.drawAgain = false;
            remember();
            showSaved('Saved \u2713', { reload: true });
        }

    }

    form.addEventListener('submit', (event) => { event.preventDefault(); ask(); });

    /** Out of credits: where to add some, on the answer that says so. */
    function outOfCredits(entry, error = null) {
        // here, over the editor, when the host sells them so; else the host's own page (the photo tool sends people to
        // the same one), or the billing page the service names (an adapter: WordPress, HTML, React, Next.js); none is
        // given to a teammate on Go Live, who asks the owner
        const billing = window.liveEditChat?.credits ?? window.liveEditEditor?.billing ?? error?.buy ?? null;
        if (typeof window.liveEditChat?.buy?.pay === 'function') entry.buy = 'here';
        else if (billing) entry.buy = String(billing).includes('#') ? billing : `${billing}#credits`;
        else entry.text = 'There are no AI credits left on this website. Ask its owner to add some, and I will carry on from here.';
    }

    /*
     * Voice (owner, 12 Nov 2026: "it's almost same as text just that someone's voice is converted to text / So we don't
     * do it two times"; "Use the open transcribe"; "It's speak to mic, no audio upload"; "Use what other popular
     * platforms are using"): tap the mic and speak; the words appear in the box as they are said. Tap the mic again when
     * done: the words stay in the box to check and correct, and Send sends them, as dictation does on a phone's keyboard
     * and in WhatsApp. Never sent on a pause (owner, 13 Nov 2026: "due to accent and noise, the mic might not be
     * interpreting that quite good, add edit"; "the mic takes pause and send it"; "so it sends incomplete command most
     * times"). Send while listening stops and sends what is in the box. One request a tap.
     *
     * Two ways to hear, the same from there on:
     *   1. OpenAI's Realtime transcription: the host gives a short-lived pass (POST /live-edit/assistant/voice) and the
     *      microphone streams straight to it over WebRTC; no audio goes through the host. Every browser; the site's
     *      name as a hint.
     *   2. The browser's own speech recognition, when the host has no OpenAI set up (liveEditChat.voice === false) or
     *      it cannot be reached: free, in Chrome, Edge, Android and Safari (owner: "Yes please" to the backup).
     * Where neither can work the mic is not shown: never a dead button. At most two minutes at a time.
     */
    const LAST_WORDS_WAIT = 1500;
    const BrowserSpeech = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    const canStream = () => Boolean(navigator.mediaDevices?.getUserMedia) && typeof window.RTCPeerConnection === 'function';
    const hostHears = () => window.liveEditChat?.voice !== false;
    // never a dead button: shown only where one of the two ways can hear
    mic.hidden = !((hostHears() && canStream()) || BrowserSpeech);
    let talk = null;
    // seconds a paid transcription listened since the last message (sent with it, then zero)
    let voiceSeconds = 0;
    let noteTimer = null;
    const noteOnMic = (text, forMoment = true) => {
        micNote.textContent = text;
        micNote.hidden = false;
        clearTimeout(noteTimer);
        if (forMoment) noteTimer = setTimeout(() => { micNote.hidden = true; }, 3500);
    };
    const micAs = (state) => {
        mic.classList.toggle('is-recording', state === 'listening');
        if (state === 'starting') mic.setAttribute('aria-busy', 'true'); else mic.removeAttribute('aria-busy');
        mic.innerHTML = state === 'listening' ? STOP_ICON : MIC_ICON;
        mic.append(micNote);
        mic.setAttribute('aria-label', state === 'listening' ? 'Stop talking' : 'Talk instead of typing');
        input.placeholder = state === 'listening' ? 'Listening… tap the mic when you finish' : state === 'starting' ? 'Starting…' : 'Ask for a change';
    };
    const stopTalking = () => {
        if (!talk) return;
        const ending = talk;
        talk = null;
        // how long a paid transcription listened, sent with the next message so its real cost is kept (owner,
        // 13 Nov 2026: "we need to be sure of the prices"); the browser's own recognition costs nothing
        if (ending.paid && ending.started) voiceSeconds += Math.ceil((Date.now() - ending.started) / 1000);
        clearInterval(ending.clock);
        clearTimeout(ending.pause);
        try { ending.close?.(); } catch { /* already closed */ }
        micNote.hidden = true;
        micAs('idle');
        input.focus();
    };
    /** Done talking: what was heard stays in the box, to check, correct and Send. */
    const finishTalking = (session) => {
        if (talk !== session) return;
        const said = [...session.heard.values()].join(' ').trim();
        stopTalking();
        input.setSelectionRange?.(input.value.length, input.value.length);
        if (said) noteOnMic('Check the words, then press Send');
    };
    /** The mic tapped while talking: listening ends at once, the last words settle, then it is sent. */
    const doneSpeaking = (session) => {
        if (talk !== session) return;
        session.quiet?.();
        micAs('starting');
        input.placeholder = 'Writing down what you said…';
        session.finishing = true;
        clearTimeout(session.pause);
        session.pause = setTimeout(() => finishTalking(session), session.speaking ? LAST_WORDS_WAIT : 0);
    };
    /** What both ways share: the words shown as they come, a finished sentence and a pause sending them, the clock. */
    const newSession = () => {
        const session = { heard: new Map(), before: input.value.trim(), speaking: false, finishing: false };
        session.show = () => {
            const said = [...session.heard.values()].join(' ').replace(/\s+/g, ' ').trim();
            input.value = [session.before, said].filter(Boolean).join(' ');
            input.dispatchEvent(new Event('input'));
        };
        session.growing = (id, words, replace = false) => {
            session.speaking = true;
            if (!session.finishing) clearTimeout(session.pause);
            session.heard.set(id, replace ? words : `${session.heard.get(id) ?? ''}${words}`);
            session.show();
        };
        session.settled = (id, words) => {
            session.speaking = false;
            session.heard.set(id, String(words ?? session.heard.get(id) ?? '').trim());
            session.show();
            // a pause is only a pause: listening goes on until the owner taps the mic (never sent half said)
            clearTimeout(session.pause);
            if (session.finishing) session.pause = setTimeout(() => finishTalking(session), 0);
        };
        session.listening = (most = 120) => {
            micAs('listening');
            const started = Date.now();
            session.started = started;
            const tick = () => {
                const seconds = Math.floor((Date.now() - started) / 1000);
                noteOnMic(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, false);
                if (seconds >= most) doneSpeaking(session);
            };
            tick();
            session.clock = setInterval(tick, 500);
        };
        return session;
    };

    /** 1. OpenAI's Realtime transcription, over WebRTC with the host's short-lived pass. Throws to fall back. */
    const hearWithTheService = async (session) => {
        const response = await request('/live-edit/assistant/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // no hint: a transcriber given the site's name and title wrote them into what it heard in a pause (owner,
            // 13 Nov 2026: "the mic is always appending Temitope Olotin The heading at the top")
            body: JSON.stringify({}),
        });
        const pass = await response.json();
        if (talk !== session) return;
        try {
            session.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        } catch {
            const refused = new Error('Allow the microphone for this website in your browser, then tap again.');
            refused.microphone = true;
            throw refused;
        }
        const peer = new window.RTCPeerConnection();
        session.stream.getTracks().forEach((track) => peer.addTrack(track, session.stream));
        const channel = peer.createDataChannel('oai-events');
        session.quiet = () => session.stream?.getTracks().forEach((track) => { track.enabled = false; });
        session.close = () => {
            try { channel.close(); } catch { /* closed */ }
            try { peer.close(); } catch { /* closed */ }
            session.stream?.getTracks().forEach((track) => track.stop());
        };
        channel.addEventListener('message', (event) => {
            let said;
            try { said = JSON.parse(event.data); } catch { return; }
            const id = said.item_id ?? 'now';
            if (said.type === 'input_audio_buffer.speech_started') {
                session.speaking = true;
                if (!session.finishing) clearTimeout(session.pause);
            } else if (said.type === 'conversation.item.input_audio_transcription.delta') {
                session.growing(id, said.delta ?? '');
            } else if (said.type === 'conversation.item.input_audio_transcription.completed') {
                session.settled(id, said.transcript);
            } else if (said.type === 'error') {
                noteOnMic('I could not hear that just now. Please try again, or type it.');
                stopTalking();
            }
        });
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        const answer = await fetch(pass.url, {
            method: 'POST',
            body: offer.sdp,
            headers: { Authorization: `Bearer ${pass.secret}`, 'Content-Type': 'application/sdp' },
        });
        if (!answer.ok) throw new Error('The speech service did not answer.');
        await peer.setRemoteDescription({ type: 'answer', sdp: await answer.text() });
        if (talk !== session) return;
        session.paid = true;
        session.listening(Number(pass.seconds) || 120);
    };

    /** 2. The browser's own speech recognition: words as they are said, settled at each pause. */
    const hearWithTheBrowser = (session) => {
        const recognition = new BrowserSpeech();
        recognition.lang = document.documentElement.lang || navigator.language || 'en-NG';
        recognition.continuous = true;
        recognition.interimResults = true;
        session.quiet = () => { try { recognition.stop(); } catch { /* stopped */ } };
        session.close = () => { session.closing = true; try { recognition.abort(); } catch { /* stopped */ } };
        recognition.addEventListener('result', (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const words = result[0]?.transcript ?? '';
                if (result.isFinal) session.settled(i, words); else session.growing(i, words, true);
            }
        });
        recognition.addEventListener('error', (event) => {
            if (talk !== session) return;
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                stopTalking();
                noteOnMic('Allow the microphone for this website in your browser, then tap again.');
            } else if (event.error === 'audio-capture') {
                stopTalking();
                noteOnMic('No microphone was found. Check it is connected, or type instead.');
            } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                stopTalking();
                noteOnMic('I could not hear that just now. Please try again, or type it.');
            }
        });
        // the browser ends listening on its own after a long silence: what was heard stays in the box to Send
        recognition.addEventListener('end', () => { if (talk === session && !session.closing) finishTalking(session); });
        recognition.start();
        session.listening(120);
    };

    const startTalking = async () => {
        micAs('starting');
        const session = newSession();
        talk = session;
        const fallBack = () => {
            if (talk !== session || !BrowserSpeech) return false;
            try { session.close?.(); } catch { /* closed */ }
            hearWithTheBrowser(session);
            return true;
        };
        if (!hostHears() || !canStream()) {
            if (!fallBack()) {
                stopTalking();
                noteOnMic('Talking needs a newer browser. You can type instead.');
            }
            return;
        }
        try {
            await hearWithTheService(session);
        } catch (error) {
            if (talk !== session) return;
            if (error.status === 402) {
                stopTalking();
                const entry = { role: 'assistant', text: error.message || 'You have no AI credits left.' };
                outOfCredits(entry, error);
                say(entry);
                return;
            }
            if (error.microphone) {
                stopTalking();
                noteOnMic(error.message);
                return;
            }
            // the service could not be reached: the browser hears instead, where it can
            if (fallBack()) return;
            stopTalking();
            noteOnMic('Talking is not available just now. Please type instead, or try again in a moment.');
        }
    };
    mic.addEventListener('click', () => {
        if (mic.getAttribute('aria-busy') === 'true') return;
        if (talk) doneSpeaking(talk); else startTalking();
    });
    // typing while it listens: the owner is finishing it by hand, so it stops listening and waits for Send
    input.addEventListener('input', (event) => { if (talk && event.isTrusted) stopTalking(); });
    panel.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && talk) {
            event.stopPropagation();
            stopTalking();
        }
    }, true);
    // Send pressed while talking: stop listening first, and send what was heard
    form.addEventListener('submit', () => { if (talk) stopTalking(); }, true);

    /** The message that ran out of credits, sent now that there are some. */
    function sendTheWaiting() {
        const text = waitingToSend;
        waitingToSend = null;
        // the packs are not offered again: the credits are in
        for (const entry of log) if (entry.buy === 'here') entry.buy = null;
        draw();
        remember();
        if (!text || busy) return;
        ask(text);
    }
    // back from a card page (the billing callback sends the owner to this editor page): carry on where they were
    if (waitingToSend && /[?&]ai-credits=back\b/.test(location.search)) {
        try { history.replaceState(history.state, '', location.pathname + location.search.replace(/[?&]ai-credits=back\b/, '').replace(/^&/, '?') + location.hash); } catch { /* the address keeps it */ }
        setTimeout(sendTheWaiting, 0);
    }

    /*
     * + attaches a photo to the message, as ChatGPT and WhatsApp do: the owner says where it goes ("put this on my About
     * page", "make this the main photo") and the chat puts it there. One photo a message; × takes it off.
     */
    let attached = null;
    const attachedRow = el('div', 'le-chat-attached');
    attachedRow.hidden = true;
    panel.insertBefore(attachedRow, form);
    const showAttached = () => {
        attachedRow.replaceChildren();
        attachedRow.hidden = !attached;
        input.placeholder = attached ? 'Where does it go?' : 'Ask for a change';
        if (!attached) return;
        const thumb = el('img');
        thumb.alt = '';
        thumb.src = URL.createObjectURL(attached.file);
        const name = el('span', '', attached.file.name || 'Photo');
        const off = el('button', '', '×');
        off.type = 'button';
        off.setAttribute('aria-label', 'Take the photo off');
        off.addEventListener('click', () => { attached = null; showAttached(); input.focus(); });
        attachedRow.append(thumb, name, off);
    };
    attach.addEventListener('click', () => pickAFile((file) => {
        attached = { id: `p${Date.now().toString(36)}`, file };
        showAttached();
        input.focus();
    }));
    input.addEventListener('keydown', (event) => {
        // Enter sends, Shift+Enter makes a new line: as in every chat people use
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            ask();
        }
    });
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
    });
    aboutClear.addEventListener('click', () => { about = null; showAbout(); });
    /*
     * The part the owner clicked, read again when they come back to the box and when they send (owner, 12 Nov 2026:
     * "if they click, is the AI chat aware of where they clicked"): a click on the page while the chat is open makes
     * "this" mean that part. Clearing it (×) stays cleared until another part is clicked.
     */
    let lastClicked = null;
    const refreshAbout = () => {
        const now = tappedForTheChat(selected());
        if (now && now.key !== lastClicked) {
            about = now;
            lastClicked = now.key;
            showAbout();
        }
    };
    input.addEventListener('focus', refreshAbout);

    const open = () => {
        about = tappedForTheChat(selected());
        lastClicked = about?.key ?? null;
        showAbout();
        draw();
        panel.hidden = false;
        remember();
        input.focus();
        shown(true);
    };
    const shut = () => { panel.hidden = true; remember(); shown(false); };
    close.addEventListener('click', shut);
    panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') shut(); });

    /** Opened from a part's own panel ("Ask AI about this"): pointed at that part, with what owners ask of it. */
    const openAbout = (element, say = null) => {
        const part = tappedForTheChat(element);
        open();
        if (part) {
            about = part;
            lastClicked = part.key;
            showAbout();
            draw();
        }
        // a one-press request from the part's panel (Rewrite, Shorten): sent at once, as if typed
        if (say && part) {
            input.value = say;
            ask();
        }
    };

    /** From the always-there chat box: open with what was typed there, sent at once on Enter, or listening at once. */
    const openWith = (text = '', { send = false, talk: listen = false } = {}) => {
        open();
        const typed = String(text ?? '').trim();
        if (typed) {
            input.value = input.value.trim() ? `${input.value.trim()} ${typed}` : typed;
            input.dispatchEvent(new Event('input'));
        }
        if (send && input.value.trim()) ask();
        else if (listen && !talk) startTalking();
    };

    return {
        open,
        openAbout,
        openWith,
        close: shut,
        toggle: () => (panel.hidden ? open() : shut()),
        get isOpen() { return !panel.hidden; },
        wasOpen: remembered?.open === true,
        panel,
    };
}
