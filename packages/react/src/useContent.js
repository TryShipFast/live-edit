import { useEffect } from 'react';
import { useLiveEdit } from './context.js';
import { useItemIdentity } from './item.js';

/**
 * The value for a key, or the words that were already in the component.
 *
 * The fallback is the original literal, which matters more than it looks. It
 * means a component still renders its own copy with no provider, no network
 * and no content at all — so adding this to an app cannot leave a page blank,
 * and removing it later leaves working code behind.
 */
export const useContent = (rawKey, fallback = '') => {
    const context = useLiveEdit();
    const register = context?.register;

    /*
     * The row this is being rendered inside, if any.
     *
     * A component in a list is the same component written once and shown many
     * times, so one key would be one value shared by every row. Composing the
     * row's identity onto the key makes each one its own - and out in the
     * open, where there is no row, the key is untouched and this behaves
     * exactly as it always has.
     *
     * The `@` suffix is the shared protocol's, the same one a copied item's
     * hand-written keys take on every other adapter.
     */
    const item = useItemIdentity();
    const key = item === null || item === undefined ? rawKey : `${rawKey}@${item}`;

    // Says "this key is on screen and driven by React". The editor asks,
    // because an element inside a server component carries the same marker but
    // no hook, and there the page has to be fetched again instead.
    useEffect(() => register?.(key), [register, key]);

    if (!context) {
        return fallback;
    }

    const value = context.content[key];

    // An empty string is a real edit — somebody cleared the field — but an
    // absent key is not, and treating them the same would make a cleared
    // heading spring back to its original words.
    return value === undefined || value === null ? fallback : value;
};
