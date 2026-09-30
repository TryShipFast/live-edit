import * as React from 'react';
import { createClient } from './client.js';

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

const settings = () => {
    const env = typeof process === 'undefined' ? {} : (process.env ?? {});

    const site = configured?.site ?? env.LIVE_EDIT_SITE ?? null;
    const apiBase = configured?.apiBase ?? env.LIVE_EDIT_API_BASE ?? null;
    const key = configured?.key ?? configured?.publishableKey ?? env.LIVE_EDIT_KEY ?? null;

    return site && apiBase && key ? { site, apiBase, key } : null;
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

        const payload = await client.read(options.locale ?? configured?.locale ?? null);

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
export const LiveEditText = async ({ contentKey, fallback = '', locale = null }) => {
    const words = await liveEditWords(locale);

    return words(contentKey, fallback);
};

export { itemIdentity, listIdentity } from './identity.js';
export { contentKeyFor, editMarkerFor } from './keys.js';
