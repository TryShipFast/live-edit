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
.le-chat-foot { padding: 0 16px 12px; margin-top: -6px; font-size: 12px; color: var(--le-muted, #6B6F78); }
/* An editor panel open (the photo the chat asked for, or anything tapped): the chat moves to the left of it, so both
   stay in view; where there is no room beside it, the chat steps aside until the panel closes. */
:host(.le-drawer-open) .le-chat { right: 416px; }
@media (max-width: 900px) { :host(.le-drawer-open) .le-chat { display: none; } }
@media (max-width: 600px) { .le-chat { right: 8px; left: 8px; width: auto; bottom: 76px; max-height: calc(100vh - 96px); } }
`;

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
    const heading = page.fields.find((field) => field.kind === 'text' && field.label === 'Heading');
    if (heading) tips.push('Make the headline shorter and punchier');
    if (page.fields.some((field) => field.kind === 'image' || field.kind === 'background image')) tips.push('Replace the main photo');
    // a list with a name a person would use ("Questions", "Team"), never the editor's own words for one
    const list = page.lists.find((candidate) => !['media', 'items', 'list', 'page sections', 'section'].includes(candidate.label.trim().toLowerCase()));
    if (list) tips.push(`Add another to ${list.label.toLowerCase()}`);
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
 * @param {Function} [deps.selected]         the element the owner has open in the editor, if any
 * @param {string}   [deps.site]             to keep the conversation for this website through a reload
 */
export function createChat({ shadow, request, showSaved, openPhoto, openPublish, selected = () => null, site = '' }) {
    const memoryKey = `le-chat:${site}:${location.pathname}`;
    const remembered = (() => {
        try { return JSON.parse(sessionStorage.getItem(memoryKey) || 'null'); } catch { return null; }
    })();
    /** What was said, and what each answer did, so the conversation is still there after the page reloads. */
    const log = Array.isArray(remembered?.log) ? remembered.log : [];
    let credits = remembered?.credits ?? null;
    let busy = false;
    let about = null;

    const remember = () => {
        try {
            sessionStorage.setItem(memoryKey, JSON.stringify({ log: log.slice(-40), credits, open: !panel.hidden }));
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
    input.placeholder = 'Ask for a change, or ask a question';
    input.setAttribute('aria-label', 'Message');
    const send = el('button', 'le-chat-send');
    send.type = 'submit';
    send.innerHTML = SEND_ICON;
    send.setAttribute('aria-label', 'Send');
    form.append(input, send);

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
        card.append(el('h3', '', entry.changes.length === 1 ? 'Changed on your page' : `${entry.changes.length} changes on your page`));
        const items = el('ul');
        for (const change of entry.changes) {
            const item = el('li');
            if (change.type === 'field') {
                item.append(el('b', '', `${change.label}: `), document.createTextNode(change.kind === 'link' ? `now goes to ${change.value}` : `“${change.value}”`));
            } else if (change.type === 'style') {
                item.append(el('b', '', change.label), document.createTextNode(change.visible ? ' is shown again' : ' is hidden from visitors'));
            } else {
                const did = { add: 'one added', duplicate: 'one copied', remove: 'one removed', move_up: 'one moved up', move_down: 'one moved down' }[change.action] ?? 'changed';
                item.append(el('b', '', `${change.label}: `), document.createTextNode(did));
            }
            items.append(item);
        }
        card.append(items);

        if (entry.state === 'kept') {
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
                    await request('/live-edit/assistant/chat/undo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ undo: entry.undo }),
                    });
                    entry.state = 'undone';
                    remember();
                    draw();
                    // a part put back to how the design had it has no draft left to show: the page is drawn again,
                    // as the editor's own Undo does, and the chat opens again where it was
                    await showSaved('Undone', { reload: entry.undo.some((step) => step.discard) });
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

    const photoCard = (card) => {
        const box = el('div', 'le-chat-card');
        box.append(el('h3', '', `New photo for ${card.label.toLowerCase() === 'photo' ? 'this picture' : card.label}`));
        if (card.suggestion) box.append(el('p', '', `Idea: ${card.suggestion}`));
        box.append(el('p', '', 'Upload your own, pick a free photo, or have one made.'));
        const acts = el('div', 'le-chat-acts');
        const choose = button('Choose a photo', 'is-main');
        choose.addEventListener('click', () => openPhoto(card.key));
        acts.append(choose);
        box.append(acts);

        return box;
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

    const creditsCard = (buy) => {
        const box = el('div', 'le-chat-card');
        const acts = el('div', 'le-chat-acts');
        const link = el('a', 'le-chat-btn is-main', 'Add AI credits');
        link.href = buy;
        link.target = '_blank';
        link.rel = 'noopener';
        acts.append(link);
        box.append(acts);

        return box;
    };

    const greeting = () => {
        const box = el('div', 'le-chat-msg is-ai', 'Hi! Tell me what to change on this page: the words, a photo, a list. I show it on the page straight away, and you can undo it.');
        const tips = el('div', 'le-chat-tips');
        for (const tip of startersFor(pageForTheChat(document))) {
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
            if (entry.changes?.length) list.append(changeCard(entry));
            for (const card of entry.cards ?? []) {
                if (card.type === 'photo') list.append(photoCard(card));
                if (card.type === 'publish') list.append(publishCard());
            }
            if (entry.buy) list.append(creditsCard(entry.buy));
        }
        showCredits();
        scrollDown();
    }

    const say = (entry) => {
        log.push(entry);
        remember();
        draw();
    };

    const showAbout = () => {
        aboutRow.hidden = !about;
        aboutText.textContent = about ? `About: ${about.label}` : '';
    };

    /* ── sending ──────────────────────────────────────────────── */

    async function ask() {
        const text = input.value.trim();
        if (!text || busy) return;
        busy = true;
        send.disabled = true;
        input.value = '';
        const history = log.filter((entry) => !entry.wait && entry.text).map((entry) => ({ role: entry.role, text: entry.text })).slice(-12);
        say({ role: 'user', text });
        const waiting = { role: 'assistant', text: 'Working on it…', wait: true };
        log.push(waiting);
        draw();

        let entry;
        try {
            const response = await request('/live-edit/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history, page: pageForTheChat(document), tapped: about }),
            });
            const data = await response.json();
            credits = data.credits ?? credits;
            entry = { role: 'assistant', text: data.reply || 'Done.', changes: data.changes ?? [], cards: data.cards ?? [], undo: data.undo ?? [] };
        } catch (error) {
            entry = { role: 'assistant', text: error.message || 'Something went wrong. Please try again.' };
            // where to add credits: the host's own page (the photo tool sends people to the same one), owner only
            const billing = window.liveEditChat?.credits ?? window.liveEditEditor?.billing;
            if (error.status === 402 && billing) entry.buy = String(billing).includes('#') ? billing : `${billing}#credits`;
        }

        log.splice(log.indexOf(waiting), 1);
        say(entry);
        busy = false;
        send.disabled = false;
        input.focus();

        if (entry.changes?.length) {
            await showSaved(entry.changes.length === 1 ? 'Changed' : `${entry.changes.length} changes`);
        }
    }

    form.addEventListener('submit', (event) => { event.preventDefault(); ask(); });
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

    const open = () => {
        about = tappedForTheChat(selected());
        showAbout();
        draw();
        panel.hidden = false;
        remember();
        input.focus();
    };
    const shut = () => { panel.hidden = true; remember(); };
    close.addEventListener('click', shut);
    panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') shut(); });

    return {
        open,
        close: shut,
        toggle: () => (panel.hidden ? open() : shut()),
        get isOpen() { return !panel.hidden; },
        wasOpen: remembered?.open === true,
        panel,
    };
}
