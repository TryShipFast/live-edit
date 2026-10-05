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

import { masked } from './every-render.js';
import { givesUpAfter, retrying } from './support.js';

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

    // And words. A mega menu built when it opens, a testimonial that exists
    // one slide at a time - neither is in the markup the scanner was sent, and
    // until this the only thing that could bring us back was a picture.
    watchForLateContent(doc, () => {
        // Told why, so the guard inside does not answer "already prepared,
        // nothing to do" about a menu that has just built itself.
        autoTag(config, doc, { because: 'new content' }).catch((error) => {
            console.warn('[live-edit] could not tag what just appeared:', error.message);
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
/**
 * Words that were not on the page when it was tagged.
 *
 * The gap this closes, reported from a real site: a mega menu whose items are
 * built when it opens, and testimonials that exist one slide at a time. Both
 * are ordinary ways to build a website and neither is visible to a scanner
 * reading the markup that was sent - so the parent links were editable and
 * nothing inside the menu was, and whichever testimonial happened to be
 * showing at page load was the only one anybody could change.
 *
 * There was already a watcher for backgrounds that arrive late, and it is the
 * right shape: ask again when the page has changed. It only ever asked about
 * pictures, so a menu full of new words went unnoticed - refreshBackgrounds
 * returns early unless a NEW BACKGROUND turned up.
 *
 * Only while somebody is editing. A visitor gains nothing from a page that
 * re-tags itself, and would pay for every one of these requests.
 *
 * Three guards, because a page that re-tags on every mutation is worse than
 * one that misses a menu:
 *
 *   - it waits for the page to settle, so a carousel mid-animation is one ask
 *     rather than thirty;
 *   - it asks only when something added actually holds words or a picture
 *     that is not already marked, so a class flipping on a wrapper is free;
 *   - it stops after a while. A page that rebuilds itself forever - a ticker,
 *     a live feed - must not spend somebody's afternoon posting its own markup
 *     back to us.
 */
/**
 * The page, without the half of it that is not a page.
 *
 * Measured on a live Next install: 329KB goes up on every tagging request, and
 * 181KB of that - 55 per cent - is the text inside 57 inline <script> tags and
 * the <style> blocks beside them. The scanner skips all three by name and has
 * always skipped them, so every byte of it was carried across the wire, parsed
 * into a document, walked past, and thrown away.
 *
 * The tags stay. Only what is inside them goes, because an element's position
 * is part of its name and removing a node would move everything after it.
 *
 * The second gain is the one that matters more. A framework's inline payload
 * changes between renders, so the fingerprint this page is remembered under
 * changed every time and the cache that exists to make the second visit free
 * could never hit. Emptying them leaves a name made of the markup a person
 * could actually edit, which is the thing that genuinely does not change.
 */
export const worthSending = (doc) => {
    const copy = doc.documentElement.cloneNode(true);

    for (const node of copy.querySelectorAll('script, style, noscript')) {
        /*
         * The text, and only the text.
         *
         * `textContent = ''` would have been the obvious line and it is wrong:
         * it empties ELEMENT children too. A <noscript> is parsed as markup
         * wherever scripting is on, and the first page this was measured
         * against kept a custom element inside one - so the obvious line
         * removed a node, and removing a node shifts the position of every
         * element after it. Position is how an element is named here, so that
         * would have quietly renamed the back half of the page and orphaned
         * whatever was saved against it.
         *
         * Caught by counting elements before and against after, which is worth
         * doing to anything that edits a document on its way out.
         */
        for (const child of [...node.childNodes]) {
            if (child.nodeType === 3) {
                child.remove();
            }
        }
    }

    return copy.outerHTML;
};

export const watchForLateContent = (doc = document, onFound = () => {}) => {
    const view = doc.defaultView ?? window;

    if (!view?.MutationObserver) {
        return null;
    }

    /*
     * Enough for a menu, a few slides and a modal, and not enough to matter if
     * a page turns out to rebuild itself forever. Each ask is the page's own
     * markup going back over the wire - a third of a megabyte on a real site -
     * so this is a budget rather than a formality.
     */
    const MOST_ASKS = 10;

    /** What a scanner has already put a name to. */
    const KEYED = '[data-edit], [data-edit-img], [data-edit-bg]';

    let asks = 0;
    let pending = null;

    /** Does this subtree hold anything worth asking about, and not already marked? */
    const worthAsking = (node) => {
        if (!node || node.nodeType !== 1) {
            return false;
        }

        if (node.matches?.('[data-edit], [data-edit-img], [data-style]')) {
            return false;
        }

        const words = (node.textContent ?? '').trim();

        if (words !== '' && !node.querySelector?.('[data-edit]')) {
            return true;
        }

        // The node itself as well as anything under it: a picture that arrives
        // on its own is added as the <img>, not as a wrapper around one, and
        // looking only at descendants missed exactly that.
        return Boolean(
            node.matches?.('img:not([data-edit-img])')
            || node.querySelector?.('img:not([data-edit-img])')
        );
    };

    /** Did this node carry content the scanner had already named? */
    const wasKeyed = (node) => node?.nodeType === 1
        && Boolean(node.matches?.(KEYED) || node.querySelector?.(KEYED));

    /**
     * Content that replaced content, as against content that merely arrived.
     *
     * A testimonial slider renders one testimonial and swaps the others into
     * the same node, so each of them is offered the same position - and a name
     * taken from position hands all five one key. Editing the second does not
     * sit beside the first, it overwrites it.
     *
     * The scanner cannot see this: at render time the other four do not exist.
     * This can. Keyed content leaving a parent and different content arriving
     * in its place is exactly what a slide change looks like, and the mark
     * tells the scanner to name what arrived by what it holds instead.
     *
     * Counted across the whole batch rather than per record, because React
     * takes the old node out and puts the new one in as two separate steps on
     * the same parent.
     */
    const wordsOf = (node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim();

    /*
     * What the page was showing before anybody touched it.
     *
     * The first slide is the one the server rendered, so the scanner named it
     * by position and anything already saved against it is filed under that
     * name. Press Next and then Previous and it comes back - and marking it on
     * the way back would rename it, so an edit made to it would be stored
     * under a name the next page load never derives. It would save, show, and
     * be gone on reload, which is the failure that is hardest to report.
     *
     * A node that leaves without the mark is one of these originals. One that
     * leaves carrying the mark was swapped in earlier and is named by content
     * already, so it keeps being named that way when it returns.
     */
    const originals = new WeakMap();

    const rememberOriginal = (parent, node) => {
        const held = originals.get(parent) ?? new Set();
        held.add(wordsOf(node));
        originals.set(parent, held);
    };

    const markSwaps = (records) => {
        const lost = new Set();
        const gained = new Map();

        for (const record of records) {
            for (const node of record.removedNodes) {
                if (!wasKeyed(node)) {
                    continue;
                }

                lost.add(record.target);

                if (!node.hasAttribute?.('data-kb-swaps')) {
                    rememberOriginal(record.target, node);
                }
            }

            const arrived = [...record.addedNodes].filter((node) => node.nodeType === 1);

            if (arrived.length > 0) {
                gained.set(record.target, (gained.get(record.target) ?? []).concat(arrived));
            }
        }

        for (const [parent, arrived] of gained) {
            if (!lost.has(parent)) {
                continue;
            }

            const wasHereFirst = originals.get(parent) ?? new Set();

            for (const node of arrived) {
                if (wasHereFirst.has(wordsOf(node))) {
                    continue;
                }

                node.setAttribute('data-kb-swaps', '1');
            }
        }
    };

    const observer = new view.MutationObserver((records) => {
        if (asks >= MOST_ASKS) {
            observer.disconnect();

            return;
        }

        // Before the settle rather than after it: the nodes have to carry the
        // mark by the time the markup is posted, and a later burst may well
        // have moved on to a different slide by then.
        markSwaps(records);

        const anythingNew = records.some((record) => [...record.addedNodes].some(worthAsking));

        if (!anythingNew || pending) {
            return;
        }

        // After the page has settled rather than during. A menu opening is a
        // burst of mutations, and asking on the first one asks about half a
        // menu.
        pending = view.setTimeout(() => {
            pending = null;
            asks += 1;
            onFound();
        }, 600);
    });

    observer.observe(doc.body ?? doc.documentElement, { childList: true, subtree: true });

    return observer;
};

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

const LOCKS_PREFIX = 'kb_locks_';

/**
 * Tell the service which of this page's elements the developer kept.
 *
 * Only for pages that never tag. A tagged page records this as a side effect
 * of the scan, which is where it belongs; a page that arrives already prepared
 * - React's codemod, a CLI run, a plugin - never scans, and so never recorded
 * anything. The lock then held in the editor, which is only a guardrail, and
 * not on the write, which is the boundary it is sold as.
 *
 * No scanner involved on either side. The markers and the lock attributes are
 * both already in the markup; the service only reads which of the first sit
 * inside the second.
 *
 * Remembered against the markup like tagging is, so this is one request per
 * version of a page rather than one per page view, and silent: a page whose
 * locks could not be reported is a page that still works, and saying so in the
 * console would be a red line on a working install.
 */
const reportLocks = async ({ base, site, key, page }, doc) => {
    if (!doc.querySelector('[data-live-lock], [data-live-edit-lock]')) {
        return;
    }

    try {
        const html = worthSending(doc);
        const id = LOCKS_PREFIX + fingerprint(masked(html));

        if (cached(id)) {
            return;
        }

        const response = await fetch(`${String(base).replace(/\/$/, '')}/${site}/locks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${key}` },
            body: JSON.stringify({ html, page: page ?? doc.location?.pathname ?? '' }),
            signal: givesUpAfter(20000),
        });

        if (response.ok) {
            remember(id, true);
        }
    } catch {
        // Reported next page view. Nothing here is worth failing over.
    }
};

/**
 * Ask what is editable here, and mark it.
 *
 * Asked once per version of a page: the answer is kept against a fingerprint
 * of the markup, so a redeploy asks again and an unchanged page does not.
 */
export const autoTag = async ({ base, site, key, page }, doc = document, { because = null } = {}) => {
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

    /*
     * `because` is somebody saying the page is not what it was.
     *
     * The guard below asks one question - is there a picture we have written
     * down and not yet keyed - and answers "nothing to do" for everything
     * else. That was right while the only thing that could arrive late was a
     * background. It is wrong the moment words can: a mega menu built when it
     * opens, a testimonial that exists one slide at a time.
     *
     * Measured on a live site. The menu items were genuinely absent from the
     * DOM at tagging time, the watcher noticed them arriving and asked, and
     * this line sent it away - the page was already prepared and no background
     * had appeared, so there was "nothing to do" while three new links sat
     * there uneditable.
     */
    if (prepared && !unanswered() && because === null) {
        /*
         * One thing still has to be said on the way out.
         *
         * A prepared page asks nothing, which is the point of preparing it.
         * But data-live-lock is recorded by the scan, and a page that never
         * scans is a page whose locks were recorded nowhere - so the write
         * path had nothing to refuse against and an invited editor could set
         * anything whose key they came by. React is the adapter where that is
         * routine rather than theoretical: its codemod writes the markers into
         * the source at build time, so no page of a React site has ever tagged.
         *
         * Costs nothing on the pages that matter, because the guard below is
         * the question "does this page lock anything at all", and almost none
         * of them do. Not awaited: the answer changes nothing on this page,
         * and the person should not wait on it to start editing.
         */
        reportLocks({ base, site, key, page }, doc);

        return 0;
    }

    const html = worthSending(doc);
    /*
     * Fingerprinted past what changes on every render.
     *
     * Taken of the markup as rendered, this was a new value on every single
     * load - a fresh CSRF token and a fresh Livewire snapshot are enough - so
     * nothing stored here was ever found again, and a third of a megabyte went
     * to the service on every page view to be told what it had already been
     * told. Measured on a real site: 290KB up, 235KB back, and between one and
     * two seconds before the page's own words could be applied.
     *
     * The markup still goes as it is. Only the name this is remembered under
     * is taken past the parts that could not have changed the answer.
     */
    const id = CACHE_PREFIX + fingerprint(masked(html));
    const known = cached(id);

    if (known) {
        return applyTags(doc, known);
    }

    /*
     * Asked again, because once is not an answer.
     *
     * A page that fails to tag is a page with nothing editable on it: no
     * outlines, no panel, nothing to click. The words are all still there and
     * the site is fine, so to the person it reads as the product having
     * quietly stopped working - and reloading fixes it, which is the most
     * confusing possible behaviour.
     *
     * Measured against a live site: roughly one tagging request in six came
     * back 503, reproducible from curl, so nothing about any one browser. The
     * applier beside this has retried its fetches since it was written; this
     * one never did, and it is the request that decides whether there is
     * anything to edit at all.
     *
     * The same policy as everywhere else: a dropped connection, a server
     * error, a rate limit and a gateway timeout are asked again, and a 401 or
     * a 404 is not - a wrong key does not improve by being tried three times,
     * and hammering a rejected one is how a site gets itself throttled.
     *
     * The body is built once rather than per attempt, since it is a third of a
     * megabyte of markup and rebuilding it two more times to send the same
     * bytes would be its own small cruelty.
     */
    const body = JSON.stringify({ html, page: page ?? doc.location?.pathname ?? '' });

    const { elements } = await retrying(async () => {
        const response = await fetch(`${String(base).replace(/\/$/, '')}/${site}/tag`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${key}` },
            body,
            /*
             * A limit, because the alternative is not "slow" - it is nothing,
             * for as long as the tab is open.
             *
             * Measured on a live install: this request sat pending for over
             * twenty seconds while the identical request from curl answered in
             * one. Everything downstream waits on it, so the page had no
             * editor at all - no toolbar, nothing outlined, nothing clickable.
             * It reads exactly like the product being broken, and the console
             * says nothing because nothing has failed yet.
             *
             * Generous, because this is a third of a megabyte of markup going
             * up and a full scan coming back, and cutting a slow-but-working
             * tag short would trade a rare hang for a common failure.
             */
            signal: givesUpAfter(20000),
        });

        if (!response.ok) {
            const refused = new Error(`Tagging answered ${response.status}`);
            // Carried so the retry policy can tell a server falling over from
            // a key being refused. Without it every failure looks alike and
            // either all of them are retried or none are.
            refused.status = response.status;

            throw refused;
        }

        return response.json();
    });
    remember(id, elements);

    return applyTags(doc, elements);
};
