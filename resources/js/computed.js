/**
 * Parts of a page its own script works out, which the editor explains instead of opening.
 *
 * A template says so with data-kit-computed (LIVE-EDIT-STRUCTURE.md, "Counts are computed"). A shop's bag
 * count is recognised even unsaid: the number of things in the shopper's bag and the words beside it
 * (data-bag-count, data-bag-count-word, data-bag-sr, data-bag-words) are written by the shop from the bag on
 * every load. Opened as words, an owner typed over a number the visitor's own bag replaces, and until it did,
 * a visitor saw whatever was typed.
 */
export const COMPUTED = '[data-kit-computed], [data-bag-count], [data-bag-count-word], [data-bag-sr], [data-bag-words]';

/** The computed part this node sits in, or null. */
export const computedOf = (node) => node?.closest?.(COMPUTED) ?? null;

/** What kind of worked-out part it is, which names what the editor says about it. */
export const computedKind = (element) => {
    const said = element?.getAttribute?.('data-kit-computed');
    if (said) return said;
    if (element?.matches?.('[data-bag-count], [data-bag-count-word], [data-bag-sr], [data-bag-words]')) return 'bag-count';
    return 'count';
};
