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
.le-chat-tool[aria-disabled=true] { color: #8A8E96; cursor: default; }
.le-chat-tool[aria-disabled=true]:hover { border-color: var(--le-field, #DADCE0); }
.le-chat-soon { position: absolute; bottom: 52px; right: -8px; white-space: nowrap; background: var(--le-ink, #0B0C0F); color: #fff; font-size: 12px; padding: 5px 9px; border-radius: 6px; pointer-events: none; }
.le-chat-soon[hidden] { display: none; }
.le-chat-mic.is-recording { background: #C0392B; border-color: #C0392B; color: #fff; }
.le-chat-mic.is-recording:hover { border-color: #C0392B; }
.le-chat-mic[aria-busy=true] { cursor: progress; opacity: .6; }
.le-chat-photos { border: 1px solid var(--le-line, #E6E7EA); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.le-chat-photos h3 { margin: 0; font-size: 14px; font-weight: 600; }
.le-chat-pack { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 10px; border: 1px solid var(--le-field, #DADCE0); border-radius: 10px; font-size: 14px; cursor: pointer; }
.le-chat-pack:has(input:checked) { border: 2px solid var(--le-accent, #1B6EF3); padding: 0 9px; }
.le-chat-pack b { margin-left: auto; font-weight: 600; }
.le-chat-note { margin: 0; font-size: 12px; line-height: 1.5; color: var(--le-muted, #6B6F78); }
.le-chat-foot { padding: 0 16px 12px; margin-top: -6px; font-size: 12px; color: var(--le-muted, #6B6F78); }
/* An editor panel open (the photo the chat asked for, or anything tapped): the chat moves to the left of it, so both
   stay in view; where there is no room beside it, the chat steps aside until the panel closes. */
:host(.le-drawer-open) .le-chat { right: 416px; }
@media (max-width: 900px) { :host(.le-drawer-open) .le-chat { display: none; } }
@media (max-width: 600px) { .le-chat { right: 8px; left: 8px; width: auto; bottom: 76px; max-height: calc(100vh - 96px); } }
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
 * @param {Function} deps.act                carries out one planned change the way a press does (live-edit.js)
 * @param {Function} deps.snapshot           what is waiting to publish now, for Undo
 * @param {Function} deps.undoPlan           what Undo takes back, from a snapshot before and after
 * @param {Function} deps.undo               takes it back, the Changes list's own way
 * @param {Function} [deps.busy]             the parts teammates hold now
 * @param {Function} [deps.selected]         the element the owner has open in the editor, if any
 * @param {string}   [deps.site]             to keep the conversation for this website through a reload
 */
export function createChat({ shadow, request, showSaved, openPhoto, openPublish, act = async () => ({ ok: false }), snapshot = async () => null, undoPlan = () => ({ revert: [], restore: [] }), undo: takeBack = async () => {}, busy: heldNow = () => [], selected = () => null, site = '' }) {
    const memoryKey = `le-chat:${site}:${location.pathname}`;
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
    attach.setAttribute('aria-label', 'Add a photo');
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
                item.append(el('b', '', `${change.label}: `), document.createTextNode(change.kind === 'link' ? `now goes to ${change.value}` : `“${change.value}”`));
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
        const text = typeof again === 'string' ? again : input.value.trim();
        if (!text || busy) return;
        busy = true;
        send.disabled = true;
        if (typeof again !== 'string') input.value = '';
        const history = log.filter((entry) => !entry.wait && entry.text && !entry.buy).map((entry) => ({ role: entry.role, text: entry.text })).slice(-12);
        if (typeof again !== 'string') say({ role: 'user', text });
        const waiting = { role: 'assistant', text: 'Working on it…', wait: true };
        log.push(waiting);
        draw();

        let entry;
        try {
            const response = await request('/live-edit/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history, page: pageForTheChat(document), tapped: about, busy: heldNow() }),
            });
            const data = await response.json();
            credits = data.credits ?? credits;
            entry = { role: 'assistant', text: data.reply || 'Done.', changes: [], missed: [], cards: data.cards ?? [], undo: { revert: [], restore: [] } };
            const planned = data.actions ?? [];
            if (planned.length) {
                // each one done as a press does it (live-edit.js), one after another, then Undo worked out from
                // what is waiting to publish before and after
                waiting.text = planned.length === 1 ? 'Changing it on your page…' : `Making ${planned.length} changes on your page…`;
                draw();
                const before = await snapshot();
                for (const action of planned) {
                    const done = await act(action).catch((error) => ({ ok: false, error: error.message }));
                    if (done?.ok && !done.unchanged) entry.changes.push(action);
                    else if (!done?.ok) entry.missed.push({ label: action.label, locked: done?.locked ?? null, error: done?.error ?? null });
                }
                if (entry.changes.length && before) entry.undo = undoPlan(before, await snapshot());
                if (!entry.changes.length) entry.text = entry.missed.some((missed) => missed.locked)
                    ? 'I could not change that: someone else is working on that part right now.'
                    : 'I could not make that change on this page.';
            }
        } catch (error) {
            entry = { role: 'assistant', text: error.message || 'Something went wrong. Please try again.' };
            if (error.status === 402) {
                waitingToSend = text;
                outOfCredits(entry);
            }
        }

        log.splice(log.indexOf(waiting), 1);
        say(entry);
        busy = false;
        send.disabled = false;
        input.focus();

    }

    form.addEventListener('submit', (event) => { event.preventDefault(); ask(); });

    /** Out of credits: where to add some, on the answer that says so. */
    function outOfCredits(entry) {
        // here, over the editor, when the host sells them so; else the host's own page (the photo tool sends people to
        // the same one); neither is given to a teammate, who asks the owner
        const billing = window.liveEditChat?.credits ?? window.liveEditEditor?.billing;
        if (typeof window.liveEditChat?.buy?.pay === 'function') entry.buy = 'here';
        else if (billing) entry.buy = String(billing).includes('#') ? billing : `${billing}#credits`;
        else entry.text = 'There are no AI credits left on this website. Ask its owner to add some, and I will carry on from here.';
    }

    /*
     * Voice (owner, 12 Nov 2026: "it's almost same as text just that someone's voice is converted to text / So we don't
     * do it two times"; "Use the open transcribe"; "It's speak to mic, no audio upload"): tap the mic and speak; the
     * words appear in the box as they are said, and when the owner stops talking they are sent, as Siri, Google
     * Assistant and ChatGPT's voice mode do ("Use what other popular platforms are using"): a pause of about a second
     * after a finished sentence, or a tap on the mic, sends; Escape, or typing in the box, keeps the words to finish by
     * hand; a cough or one word is not sent. One request a tap, as those assistants do. The host gives a short-lived pass (POST /live-edit/assistant/voice)
     * and the microphone streams straight to the speech service over WebRTC (OpenAI's Realtime transcription): no audio
     * goes through the host. At most two minutes at a time.
     */
    const PAUSE_SENDS_AFTER = 1200;
    const LAST_WORDS_WAIT = 1500;
    let talk = null;
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
        input.placeholder = state === 'listening' ? 'Listening… I send it when you stop talking' : state === 'starting' ? 'Starting…' : 'Ask for a change';
    };
    const stopTalking = () => {
        if (!talk) return;
        const ending = talk;
        talk = null;
        clearInterval(ending.clock);
        clearTimeout(ending.pause);
        try { ending.channel?.close(); } catch { /* already closed */ }
        try { ending.peer?.close(); } catch { /* already closed */ }
        ending.stream?.getTracks().forEach((track) => track.stop());
        micNote.hidden = true;
        micAs('idle');
        input.focus();
    };
    /** Done talking: what was heard is sent, as an assistant acts when you stop speaking. */
    const finishTalking = (session) => {
        if (talk !== session) return;
        const said = [...session.heard.values()].join(' ').trim();
        stopTalking();
        // a cough, a click or one word is not a request: kept in the box, nothing spent
        if (said.split(/\s+/).filter((word) => /\w/.test(word)).length < 2) return;
        ask();
    };
    /** The mic tapped while talking: the microphone goes off at once, the last words settle, then it is sent. */
    const doneSpeaking = (session) => {
        if (talk !== session) return;
        session.stream?.getTracks().forEach((track) => { track.enabled = false; });
        micAs('starting');
        input.placeholder = 'Sending what you said…';
        session.finishing = true;
        clearTimeout(session.pause);
        session.pause = setTimeout(() => finishTalking(session), session.speaking ? LAST_WORDS_WAIT : 0);
    };
    const startTalking = async () => {
        if (!navigator.mediaDevices?.getUserMedia || typeof window.RTCPeerConnection !== 'function') {
            noteOnMic('Talking needs a newer browser. You can type instead.');
            return;
        }
        micAs('starting');
        const session = { heard: new Map(), before: input.value.trim() };
        talk = session;
        try {
            const response = await request('/live-edit/assistant/voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hint: [...new Set([document.querySelector('meta[property="og:site_name"]')?.content, document.title].filter(Boolean))].join(', ').slice(0, 600) }),
            });
            const pass = await response.json();
            if (talk !== session) return;
            try {
                session.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            } catch {
                talk = null;
                micAs('idle');
                noteOnMic('Allow the microphone for this website in your browser, then tap again.');
                return;
            }
            const peer = new window.RTCPeerConnection();
            session.peer = peer;
            session.stream.getTracks().forEach((track) => peer.addTrack(track, session.stream));
            const channel = peer.createDataChannel('oai-events');
            session.channel = channel;
            // the words as they come: a sentence grows (delta) and is then settled (completed); shown in order after
            // whatever the owner had already typed
            const show = () => {
                const said = [...session.heard.values()].join(' ').replace(/\s+/g, ' ').trim();
                input.value = [session.before, said].filter(Boolean).join(' ');
                input.dispatchEvent(new Event('input'));
            };
            channel.addEventListener('message', (event) => {
                let said;
                try { said = JSON.parse(event.data); } catch { return; }
                const id = said.item_id ?? 'now';
                if (said.type === 'input_audio_buffer.speech_started') {
                    // talking again: not done yet
                    session.speaking = true;
                    if (!session.finishing) clearTimeout(session.pause);
                } else if (said.type === 'conversation.item.input_audio_transcription.delta') {
                    session.speaking = true;
                    if (!session.finishing) clearTimeout(session.pause);
                    session.heard.set(id, `${session.heard.get(id) ?? ''}${said.delta ?? ''}`);
                    show();
                } else if (said.type === 'conversation.item.input_audio_transcription.completed') {
                    session.speaking = false;
                    session.heard.set(id, String(said.transcript ?? session.heard.get(id) ?? '').trim());
                    show();
                    // a finished sentence and then a pause: the owner is done, so it is sent
                    clearTimeout(session.pause);
                    session.pause = setTimeout(() => finishTalking(session), session.finishing ? 0 : PAUSE_SENDS_AFTER);
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
            if (!answer.ok) throw new Error('I could not hear that just now. Please try again, or type it.');
            await peer.setRemoteDescription({ type: 'answer', sdp: await answer.text() });
            if (talk !== session) return;
            micAs('listening');
            const started = Date.now();
            const most = Number(pass.seconds) || 120;
            const tick = () => {
                const seconds = Math.floor((Date.now() - started) / 1000);
                noteOnMic(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, false);
                if (seconds >= most) stopTalking();
            };
            tick();
            session.clock = setInterval(tick, 500);
        } catch (error) {
            const wasTalking = talk === session;
            stopTalking();
            if (!wasTalking) return;
            if (error.status === 402) {
                const entry = { role: 'assistant', text: error.message || 'You have no AI credits left.' };
                outOfCredits(entry);
                say(entry);
            } else {
                noteOnMic(error.message || 'Talking is not available just now. Please type instead, or try again in a moment.');
            }
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

    const photoKeyOf = (element) => {
        const holder = element?.closest?.('[data-edit-img], [data-edit-bg]');
        const marker = holder?.getAttribute('data-edit-img') || holder?.getAttribute('data-edit-bg') || '';

        return marker.startsWith('setting:') ? marker.slice('setting:'.length) : null;
    };
    attach.addEventListener('click', () => {
        const chosen = photoKeyOf(selected());
        if (chosen) {
            openPhoto(chosen);
            return;
        }
        const photos = pageForTheChat(document).fields.filter((field) => field.kind === 'image' || field.kind === 'background image');
        list.querySelector('.le-chat-photos')?.remove();
        const box = el('div', 'le-chat-photos');
        if (photos.length === 0) {
            box.append(el('p', '', 'This page has no photos to change.'));
        } else {
            box.append(el('h3', '', 'Which photo?'));
            const tips = el('div', 'le-chat-tips');
            const named = new Map();
            for (const photo of photos.slice(0, 12)) {
                // two photos called "Photo" in one section read as one: number them
                const base = [photo.label, photo.section].filter(Boolean).join(', ') || 'Photo';
                const count = (named.get(base) ?? 0) + 1;
                named.set(base, count);
                const chip = el('button', 'le-chat-tip', count > 1 ? `${base} (${count})` : base);
                chip.type = 'button';
                chip.addEventListener('click', () => { box.remove(); openPhoto(photo.key); });
                tips.append(chip);
            }
            box.append(tips);
        }
        list.append(box);
        scrollDown();
    });
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
