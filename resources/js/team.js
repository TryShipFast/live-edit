/**
 * Team editing: one person per section.
 *
 * Owner, 5 Nov 2026: "if we allow for collaboration, we should lock a section
 * a team member is working on and publish releases it, otherwise, they
 * override eachother works".
 *
 * What a person sees:
 *
 *   - a section a teammate is working on has a quiet outline and a label,
 *     "Ada is editing this section", and pressing anything in it says so
 *     instead of opening it (with "Take over" for the owner and admins);
 *   - the first thing they open or change in a section makes it theirs until
 *     they publish or discard, or go quiet for half an hour;
 *   - opening a section somebody left unfinished says "Ada left unpublished
 *     changes here" and offers to continue from them (or, for an admin, to
 *     throw them away).
 *
 * The server is the authority (SectionLocks): this file only shows what it
 * says and asks it before opening. Who holds what is one small answer per
 * site, polled every few seconds while somebody is working, every thirty
 * seconds when they are not, and not at all while the tab is hidden. An
 * unchanged answer is a 304 with no body.
 *
 * Pure helpers are exported on their own so they can be tested without a page.
 */

/* ------------------------------ which part of the page ------------------------------ */

const keyOfElement = (element) => {
    for (const attribute of ['data-edit', 'data-edit-img', 'data-edit-bg', 'data-edit-href', 'data-edit-icon', 'data-edit-svg', 'data-style']) {
        const value = element.getAttribute?.(attribute);
        if (value) return value.replace(/^setting:/, '');
    }

    return null;
};

const plainName = (id) => {
    const tail = String(id).split('.').pop() ?? '';
    const words = tail.replace(/[-_]+/g, ' ').trim();

    return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'This section';
};

/**
 * The lock unit an element belongs to, and what to call it.
 *
 * A Kit section (data-edit-section, data-instance) first; a band shared by
 * every page ("site.header") is one unit for the whole site; a part of the page
 * with an id next; and on a site with no sections at all, the element itself.
 */
export const unitOf = (element) => {
    if (!element?.closest) return null;

    const section = element.closest('[data-edit-section]');
    if (section) {
        const id = section.getAttribute('data-edit-section');

        return { unit: `section:${id}`, label: section.getAttribute('data-edit-section-label') || section.getAttribute('data-label') || plainName(id) };
    }

    const instance = element.closest('[data-instance]');
    if (instance) {
        const id = instance.getAttribute('data-instance');
        const label = instance.getAttribute('data-label') || plainName(id);

        return id.startsWith('site.')
            ? { unit: `site/${id.slice(5)}`, label }
            : { unit: `section:${id}`, label };
    }

    const area = element.closest('section[id], header[id], footer[id], article[id], aside[id], nav[id]');
    if (area) return { unit: `area:${area.id}`, label: plainName(area.id) };

    const key = keyOfElement(element);

    return key ? { unit: `key:${key}`, label: 'This part of the page' } : null;
};

/** The elements on this page that a unit covers (for the outline). */
export const elementsFor = (doc, unit) => {
    const css = (value) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, '\\$&'));
    const [kind, ...rest] = String(unit).split(':');
    const id = rest.join(':');

    if (unit.startsWith('site/')) return [...doc.querySelectorAll(`[data-instance="${css(`site.${unit.slice(5)}`)}"]`)];
    if (kind === 'section') return [...doc.querySelectorAll(`[data-edit-section="${css(id)}"], [data-instance="${css(id)}"]:not([data-edit-section])`)];
    if (kind === 'area') return [...doc.querySelectorAll(`[id="${css(id)}"]`)];
    if (kind === 'key') return [...doc.querySelectorAll(`[data-edit="setting:${css(id)}"], [data-edit-img="setting:${css(id)}"], [data-style="${css(id)}"]`)];

    return [];
};

/* ------------------------------ how often to ask ------------------------------ */

/**
 * Milliseconds until the next poll, or null to stop (the tab is hidden).
 *
 * Active (something done in the last two minutes): every `active` seconds.
 * Otherwise every `idle` seconds. Jittered by up to a fifth either way, so a
 * room full of editors opened at the same moment does not ask in step.
 */
export const pollDelay = ({ active = 5, idle = 30, lastActivity = 0, now = Date.now(), hidden = false, random = Math.random } = {}) => {
    if (hidden) return null;

    const seconds = now - lastActivity < 120000 ? active : idle;

    return Math.round(seconds * 1000 * (0.8 + 0.4 * random()));
};

/* ------------------------------ words ------------------------------ */

const what = (line) => {
    if (line.list) return null;

    return line.what || (line.kind === 'style' ? 'the styling' : 'some words');
};

/**
 * One line of History in plain words: "Ada changed the headline in Hero".
 * `you` is the reader's id, so their own lines read "You changed ...".
 */
export const sentenceFor = (line, you = null) => {
    const who = line.author && you && line.author === you ? 'You' : (line.author_name || 'Someone');
    const where = line.label ? ` in ${line.label}` : '';

    if (line.undid) return `${who} put back ${what(line) ?? 'a list'}${where}`;
    if (line.list) return `${who}: ${line.list.charAt(0).toLowerCase()}${line.list.slice(1)}${where}`;

    return `${who} changed ${what(line)}${where}`;
};

/** A version's lines grouped by the section they were in, keeping their order. */
export const groupLines = (lines = []) => {
    const groups = [];

    for (const line of lines) {
        const label = line.label || 'Other changes';
        let group = groups.find((entry) => entry.label === label);
        if (!group) {
            group = { label, lines: [] };
            groups.push(group);
        }
        group.lines.push(line);
    }

    return groups;
};

/** What a published version says at the top: who and what. */
export const versionHeadline = (version, you = null) => {
    const by = version.published_by_id && you && version.published_by_id === you ? 'You' : (version.published_by || null);
    const count = version.changes ?? 0;
    const changes = `${count} change${count === 1 ? '' : 's'}`;

    if (version.undoes) return `${by ?? 'Someone'} undid the changes in version ${version.undoes}`;
    if (version.restored_from) return `${by ?? 'Someone'} went back to version ${version.restored_from}`;

    return by ? `${by} published ${changes}` : `Published ${changes}`;
};

/**
 * The Changes list in two halves: what goes live when this person publishes,
 * and everybody else's, by name.
 */
export const splitChanges = (changes = []) => {
    const yours = [];
    const others = new Map();

    for (const change of changes) {
        if (change.mine !== false) {
            yours.push(change);
            continue;
        }
        const name = change.author_name || 'A teammate';
        if (!others.has(name)) others.set(name, []);
        others.get(name).push(change);
    }

    return { yours, others };
};

/** The label for a lock someone else holds. */
export const lockLabel = (lock) => `${lock.name || 'Someone'} is editing this section`;

/* ------------------------------ the running part ------------------------------ */

/**
 * Starts the team layer for an open editor.
 *
 * `send(path, options)` makes an API request and resolves to the Response
 * (any status), never ending the session: a failed poll is not a reason to
 * sign somebody out. `ui` is the editor chrome (shadow root, modal, toast).
 */
export function createTeam({ send, ui, doc = document, win = window, onChanged = () => {}, isEditing = () => true } = {}) {
    let state = { you: null, locks: [], left: [], poll: { active_seconds: 5, idle_seconds: 30 } };
    let etag = null;
    let timer = null;
    let lastActivity = Date.now();
    let current = null;
    let available = true;
    const boxes = new Map();
    const announced = new Set();

    const layer = doc.createElement('div');
    layer.className = 'le-locks';
    ui?.shadow?.append(layer);

    const youId = () => state.you?.id ?? null;
    // The owner, or an admin they made, may take over and throw away left changes.
    const mayManage = () => ['owner', 'admin'].includes(state.you?.role);
    const othersLocks = () => state.locks.filter((lock) => lock.holder !== youId());
    const lockOn = (unit) => state.locks.find((lock) => lock.unit === unit) ?? null;

    const jsonOf = async (response) => {
        try { return await response.json(); } catch { return {}; }
    };

    /* ---- the outlines ---- */

    const place = () => {
        for (const [, entry] of boxes) {
            const rect = entry.element.getBoundingClientRect();
            const visible = rect.width > 4 && rect.height > 4 && isEditing();
            entry.box.style.display = visible ? 'block' : 'none';
            if (!visible) continue;
            Object.assign(entry.box.style, { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px` });
            entry.box.classList.toggle('is-flipped', rect.top < 30);
        }
    };

    let frame = null;
    const placeSoon = () => {
        if (frame) return;
        frame = win.requestAnimationFrame(() => { frame = null; place(); });
    };

    const draw = () => {
        const wanted = new Map();
        for (const lock of othersLocks()) {
            elementsFor(doc, lock.unit).forEach((element, index) => wanted.set(`${lock.unit}#${index}`, { lock, element }));
        }

        for (const [id, entry] of boxes) {
            if (!wanted.has(id) || wanted.get(id).element !== entry.element) {
                entry.box.remove();
                entry.element.removeAttribute('data-le-locked');
                boxes.delete(id);
            }
        }

        for (const [id, { lock, element }] of wanted) {
            let entry = boxes.get(id);
            if (!entry) {
                const box = doc.createElement('div');
                box.className = 'le-lock';
                const label = doc.createElement('button');
                label.type = 'button';
                label.className = 'le-lock-label';
                box.append(label);
                label.addEventListener('click', () => explain(lockOn(lock.unit) ?? lock));
                layer.append(box);
                entry = { box, label, element };
                boxes.set(id, entry);
            }
            entry.label.textContent = lockLabel(lock);
            entry.element.setAttribute('data-le-locked', lock.name || 'Someone');
        }

        place();
    };

    win.addEventListener('scroll', placeSoon, { passive: true, capture: true });
    win.addEventListener('resize', placeSoon, { passive: true });

    /* ---- telling people ---- */

    const tellTakenOver = () => {
        for (const lock of state.locks) {
            if (!youId() || lock.taken_from !== youId()) continue;
            const id = `${lock.unit}@${lock.since}`;
            let seen = false;
            try { seen = win.sessionStorage?.getItem(`le-taken:${id}`) === '1'; } catch { /* private window */ }
            if (seen || announced.has(id)) continue;
            announced.add(id);
            try { win.sessionStorage?.setItem(`le-taken:${id}`, '1'); } catch { /* private window */ }
            ui?.toast?.(`${lock.name || 'An admin'} took over ${lock.label}. Your changes there are now theirs to publish.`, 8000);
        }
    };

    /** The dialog for a section somebody else is working on. */
    const explain = (lock, { onTaken = () => {} } = {}) => {
        if (!ui?.modal) {
            ui?.toast?.(`${lockLabel(lock)}.`, 6000);

            return;
        }

        const sheet = ui.modal({ title: lockLabel(lock), subtitle: lock.label, size: 'is-narrow is-fit' });
        const p = (text) => {
            const node = doc.createElement('p');
            node.className = 'le-hint le-lock-words';
            node.textContent = text;

            return node;
        };

        sheet.body.append(p(`${lock.name || 'Someone'} is working on ${lock.label} right now, so it cannot be changed until they publish their changes or stop editing.`));
        sheet.body.append(p('If they leave it alone for 30 minutes, it opens up again and their unpublished changes stay saved.'));

        sheet.foot.hidden = false;
        const ok = doc.createElement('button');
        ok.type = 'button';
        ok.className = 'le-btn-outline';
        ok.textContent = 'OK';
        ok.addEventListener('click', () => sheet.close());

        if (mayManage()) {
            const take = doc.createElement('button');
            take.type = 'button';
            take.className = 'le-btn-publish';
            take.textContent = 'Take over';
            take.addEventListener('click', async () => {
                take.disabled = true;
                take.textContent = 'Taking over\u2026';
                const response = await send('/live-edit/team/take-over', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unit: lock.unit, label: lock.label }),
                }).catch(() => null);
                if (!response?.ok) {
                    take.disabled = false;
                    take.textContent = 'Take over';
                    ui.toast?.('Could not take it over just now. Try again.', 5000);

                    return;
                }
                sheet.close();
                ui.toast?.(`${lock.label} is yours now, with ${lock.name || 'their'}'s unpublished changes. ${lock.name || 'They'} will be told.`, 6000);
                await refresh();
                onTaken();
            });
            sheet.foot.append(ok, take);
        } else {
            sheet.body.append(p('Cannot wait? Ask an admin to take over. An admin can take over any section.'));
            sheet.foot.append(ok);
        }
    };

    /** The dialog for changes somebody left in a section that is now this person's. */
    const offerLeft = (unit, label, left) => {
        if (!left?.length || !ui?.modal) return;

        const names = [...new Set(left.map((entry) => entry.name || 'A teammate'))].join(' and ');
        const count = left.reduce((total, entry) => total + (entry.changes ?? 0), 0);
        const sheet = ui.modal({ title: `${names} left unpublished changes here`, subtitle: label, size: 'is-narrow is-fit' });
        const words = doc.createElement('p');
        words.className = 'le-hint le-lock-words';
        words.textContent = `${count} change${count === 1 ? '' : 's'} in ${label} ${count === 1 ? 'is' : 'are'} saved but not published. You can carry on from them: they become yours and go live when you publish.`;
        sheet.body.append(words);
        sheet.foot.hidden = false;

        const carry = doc.createElement('button');
        carry.type = 'button';
        carry.className = 'le-btn-publish';
        carry.textContent = 'Continue from them';
        carry.addEventListener('click', async () => {
            await send('/live-edit/team/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unit, label, continue: true }) }).catch(() => null);
            sheet.close();
            void refresh();
        });

        if (mayManage()) {
            const bin = doc.createElement('button');
            bin.type = 'button';
            bin.className = 'le-btn-outline';
            bin.textContent = 'Discard them';
            bin.addEventListener('click', async () => {
                const response = await send('/live-edit/team/discard-left', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unit }) }).catch(() => null);
                sheet.close();
                if (response?.ok) {
                    ui.toast?.(`${names}'s unpublished changes in ${label} were thrown away.`, 5000);
                    onChanged({ reload: true });
                }
            });
            sheet.foot.append(bin, carry);
        } else {
            sheet.foot.append(carry);
        }
    };

    /* ---- asking the server ---- */

    const refresh = async () => {
        if (!available) return state;

        let response;
        try {
            response = await send('/live-edit/team', { method: 'GET', cache: 'no-store', headers: etag ? { 'If-None-Match': etag } : {} });
        } catch {
            return state;
        }

        if (response.status === 304) return state;
        if (response.status === 404) {
            // A host without team editing (a site keeping its own content).
            available = false;

            return state;
        }
        if (!response.ok) return state;

        const payload = await jsonOf(response);
        etag = response.headers?.get?.('ETag') ?? null;
        state = { ...state, ...payload, locks: payload.locks ?? [], left: payload.left ?? [] };
        draw();
        tellTakenOver();
        onChanged({ state });

        return state;
    };

    const schedule = () => {
        win.clearTimeout(timer);
        const delay = pollDelay({
            active: state.poll?.active_seconds ?? 5,
            idle: state.poll?.idle_seconds ?? 30,
            lastActivity,
            hidden: doc.visibilityState === 'hidden',
        });
        if (delay === null || !available) return;
        timer = win.setTimeout(async () => {
            await refresh();
            schedule();
        }, delay);
    };

    // Somebody typing in a panel for a long time without saving still holds their section:
    // a heartbeat at most once a minute while they are active and hold something.
    let lastBeat = Date.now();
    const noteActivity = () => {
        const wasIdle = Date.now() - lastActivity >= 120000;
        lastActivity = Date.now();
        if (wasIdle) schedule();
        if (available && youId() && Date.now() - lastBeat > 60000 && state.locks.some((lock) => lock.holder === youId())) {
            lastBeat = Date.now();
            void send('/live-edit/team/heartbeat', { method: 'POST' }).catch(() => {});
        }
    };

    doc.addEventListener('visibilitychange', () => {
        if (doc.visibilityState === 'hidden') {
            win.clearTimeout(timer);

            return;
        }
        void refresh().then(schedule);
    });
    for (const type of ['pointerdown', 'keydown']) doc.addEventListener(type, noteActivity, { passive: true, capture: true });

    /**
     * Before a section opens for editing: refuse at once if a teammate holds
     * it, otherwise claim it (in the background) and say so if that fails.
     * Returns false when the section must not open.
     */
    const beforeEdit = (element, { onRefused = () => {} } = {}) => {
        const where = unitOf(element);
        current = where ? { ...where } : null;
        if (!where || !available) return true;

        const lock = lockOn(where.unit);
        if (lock && lock.holder !== youId()) {
            explain(lock);

            return false;
        }

        if (!youId()) return true;

        void send('/live-edit/team/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unit: where.unit, label: where.label }),
        }).then(async (response) => {
            const payload = await jsonOf(response);
            if (response.status === 409) {
                onRefused();
                await refresh();
                explain(payload.error?.lock?.unit ? payload.error.lock : { unit: where.unit, label: where.label, name: payload.error?.lock?.name });

                return;
            }
            if (response.ok) {
                if (!lockOn(where.unit)) void refresh();
                offerLeft(where.unit, where.label, payload.left);
            }
        }).catch(() => {});

        return true;
    };

    /** The headers every save carries, so the server knows which part of the page it is in. */
    const headers = (describe = null) => {
        if (!current) return {};
        const out = { 'X-Live-Edit-Unit': encodeURIComponent(current.unit), 'X-Live-Edit-Unit-Label': encodeURIComponent(current.label ?? '') };
        const said = describe ?? current.what;
        if (said) out['X-Live-Edit-What'] = encodeURIComponent(said);

        return out;
    };

    /** A save was refused because somebody holds the section: say so and show it. */
    const refused = (error) => {
        void refresh();
        const lock = error?.lock;
        if (error?.reason === 'taken_over') {
            ui?.toast?.(error.message, 8000);

            return;
        }
        if (lock?.unit) explain(lock);
        else ui?.toast?.(error?.message ?? 'Someone else is editing this section.', 6000);
    };

    return {
        get state() { return state; },
        get you() { return state.you; },
        get available() { return available; },
        mayManage,
        lockOn,
        unitOf,
        beforeEdit,
        headers,
        refused,
        setCurrent: (unit, label, describe = null) => { current = unit ? { unit, label, what: describe } : null; },
        // "Name" from the panel becomes "the name", so History reads "Ada changed the name in Product".
        setWhat: (describe) => { if (current && describe) current.what = `the ${describe.charAt(0).toLowerCase()}${describe.slice(1)}`; },
        refresh,
        start: async () => { await refresh(); schedule(); },
        stop: () => { win.clearTimeout(timer); layer.remove(); },
        place,
        explain,
    };
}

/** The styles for the outline and its label, for the editor's shadow root. */
export const TEAM_CSS = `
.le-locks { position: fixed; inset: 0; pointer-events: none; z-index: 2147482998; }
.le-lock { position: fixed; display: none; border: 2px dashed #b45309; border-radius: 6px; background: rgba(180, 83, 9, .05); pointer-events: none; }
.le-lock-label { position: absolute; top: -26px; left: -2px; pointer-events: auto; cursor: pointer; border: 0;
  background: #b45309; color: #fff; font: 600 12px/1 system-ui, sans-serif; padding: 6px 10px; border-radius: 6px; white-space: nowrap; }
.le-lock.is-flipped .le-lock-label { top: 6px; left: 6px; }
.le-lock-words { margin: 0 0 10px; font-size: 14px; line-height: 1.5; color: #1f2937; }
.le-team-head { margin: 14px 0 6px; font-size: 13px; font-weight: 700; color: #111827; }
.le-team-head:first-child { margin-top: 0; }
.le-team-sub { margin: -2px 0 8px; font-size: 12px; color: #6b7280; }
.le-change.is-others { opacity: .85; }
.le-fields:has(> .le-version), .le-fields:has(> .le-change), .le-fields:has(> .le-team-head) { align-content: start; }
.le-change-who { font-size: 11px; color: #6b7280; margin-top: 2px; }
.le-version-lines { margin: 6px 0 0; padding: 0; list-style: none; }
.le-version-group { font-size: 12px; font-weight: 700; color: #374151; margin-top: 6px; }
.le-version-line { font-size: 13px; color: #1f2937; margin: 2px 0 0 0; }
.le-version-undo { margin-top: 6px; }
`;
