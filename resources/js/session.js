/**
 * Getting an edit session on a site that has no server of its own.
 *
 * Every other adapter borrows someone else's answer to "who is this" —
 * Laravel's users, WordPress's, whatever a Next app was built with. A folder
 * of HTML on a CDN has none, so the content service does the asking, and this
 * is the small part of that which lives in the page.
 */

const STORAGE_KEY = 'kb_session';
const FRAGMENT_KEY = 'kb_session=';

/**
 * Take a key out of the address bar and put it somewhere it will survive a
 * click to the next page.
 *
 * It arrives in the fragment rather than the query, so it was never sent to a
 * server and is in no access log. It is removed from the address bar
 * immediately, because a URL gets copied, pasted into chats and shared in
 * screenshots.
 */
export const collectFromFragment = (win = window) => {
    const fragment = win.location?.hash ?? '';
    const at = fragment.indexOf(FRAGMENT_KEY);

    if (at === -1) {
        return null;
    }

    const token = decodeURIComponent(fragment.slice(at + FRAGMENT_KEY.length).split('&')[0]);

    if (token === '') {
        return null;
    }

    store(token, win);

    const cleaned = fragment.slice(0, at).replace(/[#&]$/, '');
    win.history?.replaceState?.(null, '', win.location.pathname + win.location.search + cleaned);

    return token;
};

/**
 * sessionStorage, not localStorage: an edit session should end when the tab
 * does, and a shared computer should not keep one lying about.
 */
export const store = (token, win = window) => {
    try {
        win.sessionStorage?.setItem(STORAGE_KEY, token);
    } catch {
        // Private browsing, or storage turned off. Editing still works for
        // this page; it simply will not survive a navigation.
    }
};

export const stored = (win = window) => {
    try {
        return win.sessionStorage?.getItem(STORAGE_KEY) ?? null;
    } catch {
        return null;
    }
};

export const forget = (win = window) => {
    try {
        win.sessionStorage?.removeItem(STORAGE_KEY);
    } catch {
        // Nothing to do; it was never stored.
    }
};

/** Ask the content service to send a link to this address. */
export const requestLink = async ({ base, site }, email, win = window) => {
    const response = await fetch(`${String(base).replace(/\/$/, '')}/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            site,
            email,
            // Back to the page they were on, so they carry on where they were.
            return_to: win.location.origin + win.location.pathname,
        }),
    });

    // The service answers the same way whether or not that address can edit,
    // so there is nothing here to report beyond "we asked".
    return response.ok;
};

/** The key for this page, from the address bar or from an earlier arrival. */
export const currentSession = (win = window) => collectFromFragment(win) ?? stored(win);
