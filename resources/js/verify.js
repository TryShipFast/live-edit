/**
 * Checking that a change actually reached the page.
 *
 * "Saved" has meant "the request returned 200". That is not the same thing,
 * and every serious fault this editor has had lived in the gap between them: a
 * picture stored in the bucket that no page pointed at; a draft written under
 * a key the page read with a different token; an edit that replaced the words
 * and destroyed the picture beside them; a release that never reached a
 * browser because the address had not changed. In each case the save reported
 * success, the data really was stored, and the client looked at the old
 * version. Nobody files a bug for that — they stop believing the tool.
 *
 * So the editor now says what it expects to see before it reloads, and looks
 * for it afterwards. The check is against the rendered page, which is the only
 * definition of "it worked" a client recognises.
 *
 * It fails quiet rather than loud where it cannot be sure: a false alarm on
 * every save would be worse than the silence it replaces.
 */

const STORAGE_KEY = 'kb_verify';

/**
 * What the page should look like once it comes back.
 *
 * sessionStorage because the page is about to reload: the expectation has to
 * outlive the document that made it, and must not outlive the tab.
 */
export const expectChange = (check, win = globalThis) => {
    try {
        win.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(check));
    } catch {
        // Storage off. Editing still works; it simply goes unchecked.
    }
};

/** Read the expectation and forget it — a check is used once. */
export const takeExpected = (win = globalThis) => {
    try {
        const raw = win.sessionStorage?.getItem(STORAGE_KEY);
        win.sessionStorage?.removeItem(STORAGE_KEY);

        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

/** The element the check is about, found again in the reloaded page. */
export const locate = (root, check) => {
    if (!check?.attr || !check?.marker) {
        return null;
    }

    return root.querySelector(`[${check.attr}="${check.marker.replace(/"/g, '\\"')}"]`);
};

/**
 * What that element says now.
 *
 * Deliberately reads the same thing the drawer showed, so a client is never
 * warned about a difference they could not see.
 */
export const observed = (element, kind) => {
    if (!element) {
        return null;
    }

    if (kind === 'image') {
        const picture = pictureFor(element);

        return picture ? picture.getAttribute('src') : null;
    }

    if (kind === 'href') {
        return element.getAttribute('href');
    }

    if (kind === 'icon') {
        return element.getAttribute('class') ?? '';
    }

    const own = [...element.childNodes]
        .filter((node) => node.nodeType === 3)
        .map((node) => node.textContent)
        .join(' ')
        .trim();

    // A button written as "<a><span>Book</span></a>" has no words of its own;
    // the words it wraps are what the drawer offered to edit.
    return normalise(own === '' ? element.textContent : own);
};

/**
 * The picture a marker governs — the element itself when it is the picture,
 * and otherwise the one the panel covers.
 */
const pictureFor = (element) => {
    if (element.tagName?.toLowerCase() === 'img') {
        return element;
    }

    return element.querySelector('img') ?? element.parentElement?.querySelector('img') ?? null;
};

const normalise = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/**
 * Whether what is on the page is what was saved.
 *
 * Each kind is compared the way that kind can honestly be compared. Where the
 * answer would be a guess, this returns true: warning a client about a change
 * that did land is worse than missing one that did not, because a check nobody
 * believes is a check nobody reads.
 */
export const matches = (kind, wanted, saw) => {
    if (saw === null) {
        return false;
    }

    if (kind === 'image') {
        // A stored address is rewritten on the way to the page — made
        // absolute, moved to a CDN, given a cache-busting tail — so the file
        // it ends at is the honest comparison.
        return fileOf(saw) !== '' && fileOf(saw) === fileOf(wanted);
    }

    if (kind === 'icon') {
        // The value is one name, or the whole list when the editor moved the
        // icon to another of the theme's faces.
        const names = normalise(wanted).split(' ').filter(Boolean);
        const on = normalise(saw).split(' ').filter(Boolean);

        return names.length > 0 && names.every((name) => on.includes(name));
    }

    if (kind === 'href') {
        return normalise(saw) === normalise(wanted) || normalise(saw).endsWith(normalise(wanted));
    }

    return normalise(saw) === normalise(wanted);
};

/** The file an address ends at, ignoring how it was addressed. */
const fileOf = (url) => {
    const withoutQuery = String(url ?? '').split(/[?#]/)[0];

    return withoutQuery.split('/').filter(Boolean).pop() ?? '';
};

/**
 * Run a recorded check against the page.
 *
 * Returns null when there is nothing to check or nothing can be said, so a
 * caller only ever has to handle a real answer.
 */
export const confirm = (root, check) => {
    if (!check?.kind) {
        return null;
    }

    const element = locate(root, check);

    // The element is gone. That is a fact about the page, not about the save —
    // an item may have been deleted, or the check may be on another page now.
    if (!element) {
        return null;
    }

    const saw = observed(element, check.kind);

    return { ok: matches(check.kind, check.value, saw), wanted: check.value, saw, kind: check.kind };
};
