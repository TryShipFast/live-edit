import * as React from 'react';
import { createClient } from './client.js';
import { contentKeyIn } from './keys.js';

/**
 * Reading content on the server, for components that never reach a browser.
 *
 * Why this exists, measured rather than guessed. Run the codemod over a real
 * Next App Router application and it reports seven server-rendered files and
 * one client file, which is the ordinary shape of App Router rather than a
 * quirk of that app. A server file gets its `data-edit` marker and nothing
 * else: no hook, no import, no call. `useContent` is a hook and a server
 * component cannot call one.
 *
 * So the marker named a key that nothing on the server ever looked up. The
 * tooling said "edits land on refresh", and on a Laravel or WordPress site
 * that is true, because middleware there rewrites the finished HTML on the way
 * out. A standalone Next application has no such middleware and no equivalent
 * hook to hang one on, so the edit was saved and never came back. Most of a
 * typical page was marked as editable and none of it was.
 *
 * This is the missing half. A server component awaits its words and renders
 * them, the same way it awaits anything else, and the marker resolves.
 *
 * Separate entry point on purpose - `@shipfasts/live-edit-react/server`. It
 * holds the API key, and an import that cannot appear in a client bundle
 * cannot leak one into a client bundle.
 */

/** Configuration set in code, which beats the environment when present. */
let configured = null;

/**
 * Point the server reader at a site.
 *
 * Optional. Most applications set the environment variables instead and never
 * call this. It is here for the ones that keep their configuration somewhere
 * of their own, and for tests, which have no environment worth speaking of.
 */
export const configureLiveEdit = (options) => {
    configured = options ? { ...options } : null;
};

let warnedAboutTheBrowser = false;

const settings = () => {
    /*
     * Imported into a client bundle by mistake.
     *
     * Harmless, and that is the problem. A bundler does not put LIVE_EDIT_KEY
     * into browser code - Next only exposes NEXT_PUBLIC_ names - so the key
     * does not leak; the module simply finds nothing configured and every
     * component renders its fallback. Which looks exactly like content that
     * has not been written yet, and sends somebody to check their content
     * service, their key and their network tab before the import.
     *
     * Said once, out loud, so the five minutes go on the real cause.
     */
    const inTheBrowser = typeof window !== 'undefined';

    if (inTheBrowser && !warnedAboutTheBrowser) {
        warnedAboutTheBrowser = true;
        console.warn(
            '[live-edit] /server was imported into code running in the browser, where it can read no '
            + 'configuration and every component will render its own words. Use the main entry point '
            + "and useContent in anything marked 'use client'.",
        );
    }

    const env = typeof process === 'undefined' ? {} : (process.env ?? {});

    /*
     * Every spelling the rest of the product uses.
     *
     * This read only LIVE_EDIT_SITE, LIVE_EDIT_API_BASE and LIVE_EDIT_KEY,
     * while the documented three values a site is given are LIVE_EDIT_HOST,
     * LIVE_EDIT_SITE_ID and LIVE_EDIT_APP_KEY. A developer who followed the
     * install instructions set three variables this file then ignored, and got
     * a page that rendered its template's words with nothing said about why.
     * Two packages reading different names for one value is a trap we laid
     * ourselves.
     */
    const first = (...names) => names.map((name) => env[name]).find((value) => value) ?? null;

    const site = configured?.site ?? first('LIVE_EDIT_SITE_ID', 'LIVE_EDIT_SITE', 'LIVE_EDIT_CLOUD_SITE');
    const key = configured?.key ?? configured?.publishableKey
        ?? first('LIVE_EDIT_APP_KEY', 'LIVE_EDIT_KEY', 'LIVE_EDIT_LICENCE_KEY');

    // A host is the documented value; an api base is this package's own older
    // one. Either is accepted, and a bare host gets the path appended rather
    // than the developer being told to work it out.
    const host = first('LIVE_EDIT_HOST', 'LIVE_EDIT_CLOUD_HOST');
    const apiBase = configured?.apiBase
        ?? env.LIVE_EDIT_API_BASE
        ?? (host ? `${String(host).replace(/\/$/, '')}/api/live-edit/v1` : null);

    if (site && apiBase && key) {
        return { site, apiBase, key };
    }

    /*
     * Only on a server. In the browser this module can read no configuration
     * by definition, so naming the missing variables would be a second and
     * wrong diagnosis, sending somebody to check an environment that is set
     * correctly. The import is the fault and there is one thing to say about
     * it, which was said above.
     */
    if (! inTheBrowser) {
        sayWhatIsMissing({ site, apiBase, key });
    }

    return null;
};

/** So an unconfigured install is named once, not once per render. */
let saidWhatWasMissing = false;

/**
 * Not being set up is a thing worth saying out loud.
 *
 * This returned null in silence, and silence is the worst behaviour available
 * here. `readContent` then resolves to an empty object, every component falls
 * back to the words written in it, and the page looks deliberate. The overlay
 * applies published content after hydration, so the person who owns the site
 * sees their own copy and has no reason to suspect anything. Only the server
 * HTML is wrong, which is to say only crawlers and first paint are wrong, and
 * they are the audience marketing copy exists for.
 *
 * The same fault in the PHP package took four releases and about thirty
 * messages to find, for exactly this reason. One console line would have ended
 * it on the first afternoon.
 */
const sayWhatIsMissing = ({ site, apiBase, key }) => {
    if (saidWhatWasMissing) {
        return;
    }

    saidWhatWasMissing = true;

    const missing = [
        site ? null : 'LIVE_EDIT_SITE_ID',
        apiBase ? null : 'LIVE_EDIT_HOST',
        key ? null : 'LIVE_EDIT_APP_KEY',
    ].filter(Boolean);

    console.warn(
        `[live-edit] not configured (${missing.join(', ')}), so published content cannot be read while `
        + 'rendering. Visitors and crawlers are being served the words written in your components. '
        + 'The key is the publishable one already printed into every page this site serves.',
    );
};

/**
 * Content is baked at build time and nothing ever invalidates it.
 *
 * Measured on a real Next 16 install, and the measurement is worth keeping
 * because the fault is invisible from either end. The marketing pages build as
 * static, so this call runs once at build and its answer is baked into the
 * HTML. Publish an edit afterwards and:
 *
 *   publish -> rebuild with a warm .next -> still the old words
 *   publish -> rm -rf .next && rebuild   -> the new ones
 *
 * An incremental build does not pick content up, because content is not a
 * source file and nothing marks the prerender stale. Under a host that caches
 * .next between deploys - which is the default for the Next plugin on Netlify,
 * and the install this was found on - a published edit may never reach the
 * server HTML at all.
 *
 * Visitors are mostly spared: the overlay applies published content after
 * hydration, so a person sees current copy with a repaint. Crawlers and first
 * paint do not get that, and they are the audience marketing copy is written
 * for.
 *
 * So this is said outright rather than inherited - the framework's default is
 * not stable across its own major versions anyway, cached in 14 and not in 15.
 *
 * A minute, by default. In the App Router a route's revalidation is the lowest
 * of its fetches', so naming it here gives every page that reads content
 * incremental regeneration without a line being added to any of them. Static
 * rendering is kept, the server HTML is at most a minute behind, and the
 * person who pressed Publish still sees their edit immediately because the
 * overlay does not wait for it.
 *
 * `revalidate: false` or `cache: 'no-store'` for a site that would rather pay
 * per-request rendering and have the HTML exact. That reintroduces a fetch on
 * the request path, which is why the call underneath this one has a timeout:
 * a content service is a third party to somebody's website and must never be
 * able to hold their page open.
 */
const EVERY_MINUTE = 60;

const howOftenToAsk = ({ revalidate, cache = null } = {}) => {
    if (cache) {
        return { cache };
    }

    // Asked for outright: never store it, render per request.
    if (revalidate === false) {
        return { cache: 'no-store' };
    }

    // `next` is ignored by any runtime that is not Next, which is the point:
    // this package does not depend on the framework it is most used with.
    return { next: { revalidate: revalidate ?? EVERY_MINUTE } };
};

/**
 * Fetch a site's content. Resolves to a plain object of key to value.
 *
 * Never rejects, and that is the important part rather than a convenience.
 * The content service is a third party to somebody's website: if it is slow,
 * down, misconfigured or simply not set up yet, the page must still render the
 * words that are already written in the component. An editing tool that can
 * take a customer's site off the internet is worse than no editing tool, and
 * this project has already learned that lesson the expensive way on a live
 * site. Failures are reported to the console and then dropped.
 */
export const readContent = async (options = {}) => {
    const where = options.site && options.apiBase ? options : settings();

    if (!where) {
        return {};
    }

    try {
        const client = createClient({
            apiBase: where.apiBase,
            site: where.site,
            key: where.key ?? where.publishableKey,
        });

        const payload = await client.read(
            options.locale ?? configured?.locale ?? null,
            howOftenToAsk(options)
        );

        // `settings` is the same field the provider reads, and reading the
        // same one is the point: the server and the browser must agree about
        // what a page says, or the first paint contradicts the HTML. A 304
        // resolves to null, which is content unchanged rather than content
        // gone.
        const content = payload?.settings;

        return content && typeof content === 'object' && !Array.isArray(content) ? content : {};
    } catch (error) {
        console.error('[live-edit] could not read content, rendering the words in the template', error);

        return {};
    }
};

/*
 * One fetch per request, shared by every component in the tree.
 *
 * A server component deep in a page cannot be handed the content as a prop
 * without threading it through every component in between, which is precisely
 * the prop drilling this adapter avoids elsewhere. React's `cache` is the
 * idiomatic answer: each component asks independently, and one request's worth
 * of asking makes one call.
 *
 * `cache` memoises within one render and nowhere else. Measured on React
 * 19.3: called three times outside a render it ran three times, which is not a
 * fault to work around but the guarantee itself. Content held past the render
 * that fetched it would be one visitor's page served to the next, and a
 * content tool that shows the wrong customer's words is worse than a slow one.
 *
 * `cache` arrived in React 18.3. Older versions fall back to a memo that lives
 * for a moment, long enough to collapse a single render and far too short to
 * cross a request.
 */
const perRequest = (fetcher) => {
    if (typeof React.cache === 'function') {
        return React.cache(fetcher);
    }

    const held = new Map();

    return (locale) => {
        const at = held.get(locale);

        if (at && Date.now() - at.at < 1000) {
            return at.promise;
        }

        const promise = fetcher(locale);
        held.set(locale, { promise, at: Date.now() });

        return promise;
    };
};

const contentFor = perRequest((locale) => readContent({ locale }));

/**
 * The words for this request, as a lookup.
 *
 *     const words = await liveEditWords();
 *     <h1 data-edit="setting:auto:1a2b3c">{words('auto:1a2b3c', 'Original words')}</h1>
 *
 * The fallback is the copy already in the component, and it carries the same
 * guarantee it carries on the client: with no configuration, no network and no
 * content, the component renders its own words. Adding this to an application
 * cannot leave a page blank, and taking it out again leaves working code.
 *
 * For a row of a list, compose the key first with `contentKeyFor`, which is a
 * plain function and works here as well as it does in the browser.
 */
export const liveEditWords = async (locale = null) => {
    const content = await contentFor(locale);

    return (key, fallback = '') => {
        const value = content[key];

        // An empty string is a real edit, somebody cleared the field. An
        // absent key is not, and treating the two alike would make a cleared
        // heading spring back to the words it started with.
        return value === undefined || value === null ? fallback : value;
    };
};

/**
 * One editable value, as a server component.
 *
 * The same props and the same promise as the client component of this name,
 * from the other entry point: it renders no element of its own, it returns the
 * string, and with nothing configured it returns the fallback. A designer's
 * markup is untouched either way.
 *
 * A component rather than an inline `await` because of where these land. The
 * codemod rewrites text wherever it finds it, and plenty of it is inside a
 * `.map()` callback. Awaiting there would make the callback async and hand
 * React a promise for every row; making the component around it async instead
 * means finding which enclosing function is the component and which is a
 * callback, and being wrong about that breaks the page. An async component as
 * a child needs neither: it awaits its own words wherever it is rendered, in a
 * loop or out in the open, and the function it sits in never changes.
 */
export const LiveEditText = async ({ contentKey, fallback = '', locale = null, row }) => {
    /*
     * `row` is how a card in its own file learns which row it is. Passing it
     * is what the `LiveEditItem` wrapper does in the browser, where the
     * identity travels in context; here there is no context, so the file
     * holding the `.map()` passes it in and this composes it onto the key.
     *
     * Undefined means no list, null means a list whose rows cannot be told
     * apart - and the second returns the component's own words rather than a
     * key every row would share.
     */
    const composed = contentKeyIn(row, contentKey);

    if (composed === null) {
        return fallback;
    }

    const words = await liveEditWords(locale);

    return words(composed, fallback);
};

export { itemIdentity, listIdentity } from './identity.js';
export { contentKeyFor, editMarkerFor, contentKeyIn, editMarkerIn } from './keys.js';
