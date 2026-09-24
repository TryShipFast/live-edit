import { useEffect } from 'react';
import { useLiveEdit } from './context.js';

/**
 * The value for a key, or the words that were already in the component.
 *
 * The fallback is the original literal, which matters more than it looks. It
 * means a component still renders its own copy with no provider, no network
 * and no content at all — so adding this to an app cannot leave a page blank,
 * and removing it later leaves working code behind.
 */
export const useContent = (key, fallback = '') => {
    const context = useLiveEdit();
    const register = context?.register;

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
