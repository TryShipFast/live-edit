/**
 * Making a page editable that nobody prepared.
 *
 * A site built on a framework is tagged while it renders, and one we sold was
 * tagged before it shipped. Somebody who bought a template elsewhere has
 * neither — and telling them to install PHP and run a command is the
 * difference between a product and a favour.
 *
 * So the page sends what it has and is told which of its own elements are
 * editable. Nothing is written to their files and there is no build step. The
 * scanner stays on the server, which is where the work worth paying for is.
 */

const CACHE_PREFIX = 'kb_tags_';

/** Cheap, stable, and enough to notice a page that has changed. */
export const fingerprint = (html) => {
    let h = 0x811c9dc5;

    for (let i = 0; i < html.length; i++) {
        h ^= html.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }

    return (h >>> 0).toString(16);
};

/**
 * Follow a path of child indices from the document root.
 *
 * Positions rather than selectors, because the server computed them from the
 * very markup this page sent — so the two agree by construction, where a
 * generated selector can still match the wrong thing on a page nobody wrote
 * carefully.
 */
export const elementAt = (root, path) => {
    let node = root.documentElement;

    for (const index of path) {
        const children = [...(node?.children ?? [])];
        node = children[index];

        if (!node) {
            return null;
        }
    }

    return node;
};

/** @param {Array<{at: number[], attributes: Record<string,string>}>} elements */
export const applyTags = (root, elements) => {
    let applied = 0;

    for (const { at, attributes } of elements ?? []) {
        const node = elementAt(root, at);

        if (!node) {
            continue;
        }

        for (const [name, value] of Object.entries(attributes)) {
            // Never overwrite a marker already in the markup: a site that was
            // properly prepared keeps the keys it shipped with, and a client's
            // saved words stay attached to them.
            if (!node.hasAttribute(name)) {
                node.setAttribute(name, value);
            }
        }

        applied++;
    }

    return applied;
};

const cached = (key) => {
    try {
        return JSON.parse(window.sessionStorage?.getItem(key) ?? 'null');
    } catch {
        return null;
    }
};

const remember = (key, value) => {
    try {
        window.sessionStorage?.setItem(key, JSON.stringify(value));
    } catch {
        // Storage refused. It costs one request per page view, which is worse
        // than caching and better than not working.
    }
};

/**
 * Write down the pictures that only a browser can see.
 *
 * The scanner reads markup, and a page builder does not put its background
 * images in the markup. Elementor writes
 *
 *   .elementor-16 .elementor-element-20e6f5a:not(.…){background-image:url(…)}
 *
 * into a generated stylesheet, and leaves the element itself with no style
 * attribute at all. On the site this was found on, that rule was the hero:
 * 1440x1000, the first thing anybody sees, and the first thing anybody would
 * want to change after buying the template. The scanner could not see it, so
 * the client could not replace it, and nothing on the page said why.
 *
 * Resolving a stylesheet means matching selectors, following the cascade and
 * knowing which rules won — which is precisely what the browser has already
 * done by the time this runs. So it is asked, and the answer is written onto
 * the element as an attribute the scanner already understands. The scanner
 * stays the authority on what is editable; this only tells it what is there.
 *
 * Gradients and data: URIs are skipped — one is not a picture anybody
 * replaces, the other is already in the markup and would be sent back to the
 * server in full, a few hundred kilobytes at a time.
 */
/** Whether this element's picture is one the scanner can already read itself. */
const speaksForItself = (el) => el.hasAttribute('data-kb-bg')
    || el.hasAttribute('data-background')
    || el.hasAttribute('data-bg')
    || el.hasAttribute('data-background-image')
    // An element declaring its own background-image is one the scanner can
    // already read. A background-COLOUR is not, and matching on "background"
    // alone quietly skipped those — the element still had a picture, just not
    // one it mentioned itself.
    || /background-image|url\(/i.test(el.getAttribute('style') ?? '');

/** Write down one element's picture, if it has one and has not said so. */
const readBackground = (el, view) => {
    if (speaksForItself(el)) {
        return false;
    }

    const image = view.getComputedStyle(el).backgroundImage;

    if (!image || image === 'none' || !image.includes('url(')) {
        return false;
    }

    const url = image.match(/url\(\s*["']?([^"')]+)/)?.[1];

    if (!url || url.startsWith('data:')) {
        return false;
    }

    el.setAttribute('data-kb-bg', url);

    return true;
};

export const resolveBackgrounds = (doc = document) => {
    const view = doc.defaultView ?? window;

    if (!view?.getComputedStyle) {
        return 0;
    }

    let found = 0;

    for (const el of doc.querySelectorAll('body *')) {
        if (readBackground(el, view)) {
            found++;
        }
    }

    return found;
};

/**
 * Make sure this page's pictures get found, wherever the editor came from.
 *
 * There are two ways in. A site we sold loads boot.js, which reads its
 * settings off the script tag and walks through session, tagging, content and
 * then the editor. WordPress loads the editor on its own, because the plugin
 * has already done the tagging on the server and supplies its own token — and
 * boot.js would overwrite that token with a null.
 *
 * So the background pass had a home in only one of the two, and WordPress —
 * the whole reason backgrounds were worth finding, since that is where the
 * bought templates are — silently had none. It ran everywhere except the
 * place it was written for.
 *
 * Idempotent, so both entries can ask and only the first one does the work.
 */
export const ensureBackgroundsAreFound = async (config, doc = document) => {
    const view = doc.defaultView ?? window;

    if (view.liveEditBackgroundsWatched) {
        return 0;
    }

    view.liveEditBackgroundsWatched = true;

    const applied = await autoTag(config, doc);

    watchForLateBackgrounds(doc, () => {
        autoTag(config, doc).catch((error) => {
            console.warn('[live-edit] could not tag a late background:', error.message);
        });
    });

    return applied;
};

/**
 * Look again, now, because somebody has just said they want to edit.
 *
 * Watching for a section to scroll past is guesswork about when a builder will
 * decide to load something, and guesswork has an edge case for every builder.
 * One banner on the test site kept its picture the whole time and was never
 * reported as arriving anywhere — it simply had it, a second after the page
 * settled, and no amount of waiting for it to cross the viewport helped.
 *
 * Pressing "Edit site" is not guesswork. It is a person telling us they are
 * about to change something, at a moment when the page has finished doing
 * whatever it was going to do. Everything on it then is everything there is,
 * so the whole page is read again and anything new is asked about. It costs one
 * pass and at most one request, once, and only for somebody editing.
 *
 * This matters most for the person who knows least: someone who bought a
 * template and wants to change the picture at the top should not have to
 * discover that scrolling past it first is what makes it clickable.
 */
export const refreshBackgrounds = async (config, doc = document) => {
    const found = resolveBackgrounds(doc);

    if (found === 0 && doc.querySelector('[data-kb-bg]:not([data-edit-bg])') === null) {
        return 0;
    }

    return autoTag(config, doc);
};

/**
 * The ones that are not there yet.
 *
 * A builder loads a container's background when it scrolls into view and lets
 * it go again afterwards, so asking from the top of the document is asking at
 * the one moment the answer is false. Measured on a real Elementor page: five
 * backgrounds, one of which came and went depending on where the page was
 * scrolled — a full-width banner a client would certainly want to replace, and
 * one that simply was not offered.
 *
 * Nothing about the first pass was wrong; it just cannot see the future. So
 * each candidate is watched, asked again the moment it comes into view, and
 * asked once more a beat later because the builder sets the image in response
 * to the same event we are reacting to.
 *
 * Anything newly found is handed back in batches rather than one at a time: a
 * scroll down a long page crosses many sections, and re-tagging once per
 * section would be one request per section.
 */
export const watchForLateBackgrounds = (doc = document, onFound = () => {}) => {
    const view = doc.defaultView ?? window;

    if (!view?.IntersectionObserver || !view.getComputedStyle) {
        return null;
    }

    const found = new Set();
    let pending = null;

    const announce = () => {
        pending = null;

        if (found.size === 0) {
            return;
        }

        const batch = [...found];
        found.clear();
        onFound(batch);
    };

    // How many times one element is worth asking about. A builder can apply a
    // background a moment after the section arrives, and take it away again
    // when it leaves — measured on a real page: a full-width banner that read
    // "none" from anywhere except while it was actually on screen. Giving up
    // after the first crossing meant asking at the one moment the answer was
    // still no.
    const TRIES = 5;
    const tries = new WeakMap();

    const ask = (el) => {
        if (readBackground(el, view)) {
            found.add(el);
            observer.unobserve(el);

            if (!pending) {
                pending = view.setTimeout(announce, 250);
            }

            return true;
        }

        const spent = (tries.get(el) ?? 0) + 1;
        tries.set(el, spent);

        if (spent >= TRIES) {
            // It has had its chances on screen. Watching forever would make
            // scrolling cost a style recalculation per element per crossing.
            observer.unobserve(el);
        }

        return false;
    };

    const observer = new view.IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) {
                continue;
            }

            const el = entry.target;

            if (!ask(el)) {
                // The builder is reacting to the same scroll we are, so it may
                // not have got there yet. Ask once more while the section is
                // still likely to be on screen.
                view.setTimeout(() => ask(el), 400);
            }
        }
    }, {
        // Ahead of the viewport, so a section is asked about just before
        // somebody reaches it rather than just after.
        rootMargin: '300px',
    });

    const candidates = [...doc.querySelectorAll('body *')].filter((el) => !speaksForItself(el));

    // A ceiling, because a page can hold tens of thousands of elements and
    // each one observed costs the browser something on every scroll. Said out
    // loud rather than trimmed quietly: a silent cap reads as "there was
    // nothing else to find".
    const WATCHABLE = 4000;

    if (candidates.length > WATCHABLE) {
        console.warn(`[live-edit] watching the first ${WATCHABLE} of ${candidates.length} elements for late backgrounds`);
    }

    candidates.slice(0, WATCHABLE).forEach((el) => observer.observe(el));

    return observer;
};

/**
 * Ask what is editable here, and mark it.
 *
 * Asked once per version of a page: the answer is kept against a fingerprint
 * of the markup, so a redeploy asks again and an unchanged page does not.
 */
export const autoTag = async ({ base, site, key, page }, doc = document) => {
    // Already prepared — by the CLI, by a framework, or by whoever sold it.
    const prepared = doc.querySelector('[data-edit], [data-edit-img]') !== null;

    // Before the markup is sent, not after: the fingerprint has to cover these
    // too, or a page whose only change is a swapped hero is served a cached
    // answer that still points at the old one.
    //
    // This runs even on a prepared page, because a page tagged on the SERVER
    // cannot have found its backgrounds: they live in a stylesheet, and the
    // server was looking at markup. Measured on a WordPress install, the
    // plugin tagged 107 pieces of text and not one of the pictures the theme
    // draws from CSS, the hero among them. Asking again is safe — applyTags
    // never overwrites a marker the page already had, so keys a client's work
    // is already saved against are left exactly as they were.
    resolveBackgrounds(doc);

    // A picture we have written down that has not been given a key yet. This
    // is the question rather than "did this pass find anything", because a
    // background discovered later — when its section finally scrolled into
    // view — is already written down by the time we are asked again, and
    // counting finds would say nothing had changed.
    const unanswered = () => doc.querySelector('[data-kb-bg]:not([data-edit-bg])') !== null;

    if (prepared && !unanswered()) {
        return 0;
    }

    const html = doc.documentElement.outerHTML;
    const id = CACHE_PREFIX + fingerprint(html);
    const known = cached(id);

    if (known) {
        return applyTags(doc, known);
    }

    const response = await fetch(`${String(base).replace(/\/$/, '')}/${site}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ html, page: page ?? doc.location?.pathname ?? '' }),
    });

    if (!response.ok) {
        throw new Error(`Tagging answered ${response.status}`);
    }

    const { elements } = await response.json();
    remember(id, elements);

    return applyTags(doc, elements);
};
