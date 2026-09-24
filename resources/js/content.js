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
 *   <script>window.liveEditContent = { snapshot: 'https://cdn.example.com/content/sites/acme' }</script>
 *   <script type="module" src="/editor/content.js"></script>
 *
 * The snapshot is preferred over the API and needs no key, because published
 * content is what every visitor is being shown anyway. That is the whole point
 * of publishing to files: a busy site is served from an edge and never reaches
 * the application, so traffic costs its owner nothing and costs us nothing.
 * Reading through the API instead would have put every page view of every
 * customer back through one server.
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

/**
 * Swap an icon's class for another, leaving the theme's own classes alone.
 *
 * One name replaces the one that is there. Several mean the editor moved this
 * icon to a different variant of the theme's own set, which takes a different
 * list — so the list stands in for the whole attribute.
 */
export const applyIcon = (element, value) => {
    // Class names land in an attribute, so nothing but class names goes in.
    const chosen = String(value).replace(/[^A-Za-z0-9_\- ]/g, '').split(/\s+/).filter(Boolean);
    const was = element.getAttribute('data-edit-icon-current');

    if (chosen.length === 0 || !was) {
        return false;
    }

    const classes = chosen.length === 1
        ? (element.getAttribute('class') ?? '').trim().split(/\s+/).map((c) => (c === was ? chosen[0] : c))
        : chosen;

    element.setAttribute('class', classes.join(' '));
    element.setAttribute('data-edit-icon-current', chosen.length === 1 ? chosen[0] : chosen[chosen.length - 1]);

    return true;
};

/**
 * Point a background at a new picture.
 *
 * Both the theme's own lazy-loading attributes and an inline style, because a
 * theme that reads one on load will otherwise put the old picture back.
 */
export const applyBackground = (element, url) => {
    for (const attribute of ['data-background', 'data-bg', 'data-background-image']) {
        if (element.hasAttribute(attribute)) {
            element.setAttribute(attribute, url);
        }
    }

    const style = (element.getAttribute('style') ?? '').replace(/background-image\s*:[^;]*;?/gi, '').trim();

    element.setAttribute('style', `${style ? style.replace(/;?$/, ';') : ''}background-image:url('${url}')`);
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

    // A picture is marked differently from words, because replacing it means
    // setting a source rather than writing text. Missing this meant a client
    // could change an image, publish it, and go on seeing the old one.
    for (const element of root.querySelectorAll('[data-edit-img]')) {
        const key = (element.getAttribute('data-edit-img') ?? '').replace(/^setting:/, '');

        if (Object.hasOwn(settings, key)) {
            applyValue(element, settings[key]);
            applied++;
        }
    }

    // An icon is a set of class names, not words. The server swaps them the
    // same way; two implementations of one rule is how an icon ends up
    // different depending on which kind of site it is on.
    for (const element of root.querySelectorAll('[data-edit-icon]')) {
        const key = (element.getAttribute('data-edit-icon') ?? '').replace(/^setting:/, '');
        const value = settings[key];

        if (!Object.hasOwn(settings, key) || value === '') {
            continue;
        }

        if (applyIcon(element, value)) {
            applied++;
        }
    }

    // A background set by the theme's own CSS or by its lazy-loading
    // attributes, rather than by an <img>.
    for (const element of root.querySelectorAll('[data-edit-bg]')) {
        const key = (element.getAttribute('data-edit-bg') ?? '').replace(/^setting:/, '');
        const value = settings[key];

        if (!Object.hasOwn(settings, key) || value === '') {
            continue;
        }

        applyBackground(element, value);
        applied++;
    }

    // A link's target carries its own key alongside the element's.
    for (const element of root.querySelectorAll('[data-edit-href]')) {
        const key = element.getAttribute('data-edit-href');
        if (Object.hasOwn(settings, key)) {
            element.setAttribute('href', settings[key]);
            applied++;
        }
    }

    return applied;
};

/**
 * Published content from the files, without troubling the application.
 *
 * Two requests, both cacheable and neither of them ours to serve: the pointer,
 * which moves on each publish and is cached for seconds, and the version,
 * which never changes and is cached forever.
 */
/**
 * The same rules the server writes, written here instead.
 *
 * A server-rendered page gets these as a stylesheet before it is sent. A
 * static page has nobody to do that — so without this, a client can change a
 * button's colour, watch it save, and see nothing happen. The save was fine.
 * There was simply nothing rendering it.
 *
 * Kept deliberately in step with the server's version: two implementations of
 * one mapping is how a button ends up a different colour depending on which
 * kind of site it is on.
 */
export const styleRules = (key, props) => {
    const selector = `[data-style="${key}"]`;
    let css = '';
    let rules = '';

    for (const [prop, value] of Object.entries(props ?? {})) {
        if (value === '' || value === null || value === undefined) {
            continue;
        }

        if (prop === 'hidden') {
            css += `body:not(.editing) ${selector}{display:none !important}`;
            css += `body.editing ${selector}{opacity:.45}`;
            continue;
        }

        // !important, because a saved value has to beat the theme's own
        // stylesheet — that is the entire point of being able to restyle
        // something a class already coloured.
        rules += {
            backgroundImage: `background-image:url('${value}') !important;background-size:cover !important;background-position:center !important;`,
            background: `background:${value} !important;`,
            textColor: `color:${value} !important;`,
            fontSize: `font-size:${value}px !important;`,
            radius: `border-radius:${value}px !important;`,
            paddingX: `padding-left:${value}px !important;padding-right:${value}px !important;`,
            paddingY: `padding-top:${value}px !important;padding-bottom:${value}px !important;`,
        }[prop] ?? '';
    }

    return rules === '' ? css : css + `${selector}{${rules}}`;
};

/** @param {Record<string, Record<string, string>>} styles */
export const applyStyles = (root, styles) => {
    const css = Object.entries(styles ?? {})
        .map(([key, props]) => styleRules(key, props))
        .join('');

    if (css === '') {
        return 0;
    }

    // One tag, reused: applying content twice — a locale change, a refresh
    // after publishing — must not stack another sheet on the page.
    const id = 'live-edit-styles';
    const tag = root.getElementById?.(id) ?? root.querySelector?.(`#${id}`) ?? null;
    const style = tag ?? root.createElement('style');

    style.id = id;
    style.textContent = css;

    if (!tag) {
        (root.head ?? root.body)?.appendChild(style);
    }

    return Object.keys(styles).length;
};

export const fetchSnapshot = async ({ snapshot, locale }) => {
    const base = String(snapshot).replace(/\/$/, '');
    const pointer = await fetch(`${base}/current.json`).then((r) => {
        if (!r.ok) {
            throw new Error(`Pointer answered ${r.status}`);
        }

        return r.json();
    });

    // A site that has published nothing has a pointer saying so. Its words
    // are the ones already in the file, which is exactly right.
    if (!pointer.version) {
        return { settings: {}, styles: {} };
    }

    const language = locale ?? 'en';
    const response = await fetch(`${base}/v${pointer.version}/${language}.json`);

    if (!response.ok) {
        throw new Error(`Version answered ${response.status}`);
    }

    return response.json();
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

    if (!config) {
        return;
    }

    try {
        const payload = await resolve(config);

        if (payload) {
            applyContent(document, payload.settings ?? {});
            applyStyles(document, payload.styles ?? {});
        }
    } catch (error) {
        // The words already in the file are perfectly good. A page must never
        // break because a content service is briefly unreachable.
        console.warn('[live-edit] serving the words already in the page:', error.message);
    }
};

/**
 * Files first, the application only if there are none.
 *
 * A site that has never published has no snapshot, and one that cannot reach
 * its CDN should still show its words rather than nothing — so the API remains
 * a fallback rather than the usual path.
 */
export const resolve = async (config) => {
    if (config.snapshot) {
        try {
            return await fetchSnapshot(config);
        } catch (error) {
            // A browser reports a blocked cross-origin fetch as an ordinary
            // network failure, so the most likely cause is named here. Without
            // it the page simply shows its original words forever and nothing
            // says why — which is exactly how this was first met.
            const hint = error.message.includes('fetch')
                ? ' (if the files are on another origin, the bucket or CDN must allow cross-origin reads)'
                : '';

            if (!config.base) {
                throw new Error(error.message + hint);
            }

            console.warn('[live-edit] falling back to the content API:', error.message + hint);
        }
    }

    return config.base && config.site && config.key ? fetchContent(config) : null;
};

if (typeof document !== 'undefined') {
    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', start)
        : start();
}
