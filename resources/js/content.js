/**
 * Puts published content into a static page.
 *
 * A server-rendered site has something that can substitute words before the
 * page is sent. A file on a CDN does not — so without this, a static site can
 * be tagged, edited and published, and still show its original words forever.
 * The save works, the API holds the change, and the visitor sees nothing. That
 * was the gap that made "static sites are supported" untrue in the only way
 * that matters.
 *
 * Kept separate from the editor and deliberately small: every visitor loads
 * this, and almost none of them will ever edit anything.
 *
 *   <script>window.liveEditContent = { base, site, key }</script>
 *   <script type="module" src="/editor/content.js"></script>
 */

const PREFIX = 'setting:';

/** What a value means depends on what is holding it. */
export const applyValue = (element, value) => {
    const tag = element.tagName?.toLowerCase();

    if (tag === 'img') {
        element.setAttribute('src', value);

        return;
    }

    if (tag === 'source') {
        element.setAttribute('srcset', value);

        return;
    }

    // Anything else is words. textContent rather than innerHTML: published
    // values come from an API, and writing markup from a network response into
    // a page is how a content service becomes a way to run scripts on every
    // visitor's browser.
    element.textContent = value;
};

/** @param {Record<string, string>} settings */
export const applyContent = (root, settings) => {
    let applied = 0;

    for (const element of root.querySelectorAll('[data-edit]')) {
        const declared = element.getAttribute('data-edit') ?? '';

        if (!declared.startsWith(PREFIX)) {
            continue;
        }

        const key = declared.slice(PREFIX.length);

        // An empty string is a real edit — somebody cleared the field — but an
        // absent key is not, and treating them alike would make a cleared
        // heading spring back to the words in the file.
        if (!Object.hasOwn(settings, key)) {
            continue;
        }

        applyValue(element, settings[key]);
        applied++;
    }

    // Links and images carry their own keys alongside the element's.
    for (const element of root.querySelectorAll('[data-edit-href]')) {
        const key = element.getAttribute('data-edit-href');
        if (Object.hasOwn(settings, key)) {
            element.setAttribute('href', settings[key]);
            applied++;
        }
    }

    return applied;
};

export const fetchContent = async ({ base, site, key, locale }) => {
    const url = `${String(base).replace(/\/$/, '')}/${site}/content${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });

    if (!response.ok) {
        // A page must not break because the content service is briefly
        // unreachable: the words already in the file are perfectly good.
        throw new Error(`Content service answered ${response.status}`);
    }

    return response.json();
};

const start = async () => {
    const config = typeof window !== 'undefined' ? window.liveEditContent : null;

    if (!config?.base || !config?.site || !config?.key) {
        return;
    }

    try {
        const payload = await fetchContent(config);
        applyContent(document, payload.settings ?? {});
    } catch (error) {
        console.warn('[live-edit] serving the words already in the page:', error.message);
    }
};

if (typeof document !== 'undefined') {
    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', start)
        : start();
}
