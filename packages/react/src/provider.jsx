import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { publishBridge } from './bridge.js';
import { createClient } from './client.js';
import { LiveEditContext } from './context.js';

/**
 * Holds the site's content as React state.
 *
 * This is the whole reason a React adapter needs more than an HTTP call. In
 * React the DOM is a projection of state, not the source of it: an edit
 * written straight into the page is undone by the next render, and lost
 * completely on a client-side navigation. Putting the value in state instead
 * means an edit re-renders like any other change — it survives re-renders,
 * survives routing, and needs no fight with the reconciler.
 *
 * Seeded from the server on first paint, so the words are in the HTML that
 * arrives. No flash of original copy, and a crawler sees the real thing.
 */
export function LiveEditProvider({
    site,
    apiBase,
    publishableKey,
    sessionKey = null,
    content: initial = {},
    locale = 'en',
    children,
}) {
    const [content, setContent] = useState(initial);
    const pending = useRef(new Map());
    const timers = useRef(new Map());

    // Whoever can write is the one holding a session key. A page with only a
    // publishable key can read and nothing else, which is what makes that key
    // safe to ship in the page at all.
    const editable = Boolean(sessionKey);

    const client = useMemo(
        () => createClient({ apiBase, site, key: sessionKey ?? publishableKey }),
        [apiBase, site, sessionKey, publishableKey]
    );

    const set = useCallback(
        (key, value) => {
            // Shown immediately and sent shortly. Waiting for the network to
            // confirm before the words change makes typing feel broken.
            setContent((current) => ({ ...current, [key]: value }));

            if (!editable) {
                return;
            }

            pending.current.set(key, value);

            // One save per key per pause, not one per keystroke. A person
            // rewording a sentence produces dozens of changes and only the
            // last one matters.
            clearTimeout(timers.current.get(key));
            timers.current.set(
                key,
                setTimeout(() => {
                    const queued = pending.current.get(key);
                    pending.current.delete(key);
                    timers.current.delete(key);
                    client.write(key, queued, locale).catch((error) => {
                        // Left visible rather than reverted: silently putting
                        // the old words back is how someone loses a paragraph
                        // without noticing.
                        console.error('[live-edit] save failed', error.message);
                    });
                }, 600)
            );
        },
        [client, editable, locale]
    );

    const refresh = useCallback(async () => {
        const payload = await client.read(locale).catch(() => null);
        if (payload?.settings) {
            setContent(payload.settings);
        }
    }, [client, locale]);

    // Only when the server did not already provide it. Fetching anyway would
    // repaint the page with content it already has.
    useEffect(() => {
        if (Object.keys(initial).length === 0) {
            refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The overlay writes through this instead of into the DOM, so an edit
    // becomes state rather than something React is about to undo.
    useEffect(() => publishBridge({ set, get: (key) => content[key], editable }), [set, content, editable]);

    const value = useMemo(() => ({ content, set, refresh, editable, locale, site }), [content, set, refresh, editable, locale, site]);

    return <LiveEditContext.Provider value={value}>{children}</LiveEditContext.Provider>;
}
