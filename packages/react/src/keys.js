import { itemIdentity } from './identity.js';

/**
 * The content key for one field of one item in a list.
 *
 * `courses.title@101`. The `@` suffix is the shared protocol's, not this
 * adapter's invention: it is the same convention a copied list item's
 * hand-written keys take on every other adapter, and it means the same thing
 * in both places - this key, but for that item. The base is everything before
 * the `@`, so the field a key belongs to stays readable.
 *
 * Null when the item has no identity of its own, which is the honest answer
 * and not a failure. See identity.js for why an identity is never invented
 * from a position or from the content about to be edited.
 */
export const contentKeyFor = (list, field, item) => {
    const identity = itemIdentity(item);

    return identity === null ? null : `${list}.${field}@${identity}`;
};

/**
 * What goes in the element's `data-edit` attribute, or undefined.
 *
 * Undefined rather than empty, deliberately: React omits an attribute whose
 * value is undefined, so an item with no identity renders as ordinary markup
 * with no editing marker on it. The editor then offers nothing for that row
 * rather than offering a control whose edits it could not keep - and
 * `listIdentity()` is what says out loud why the list is like that.
 *
 * The `setting:` prefix is what the overlay already looks for. Composing the
 * whole key here rather than letting the overlay assemble one from an
 * ancestor is what keeps this adapter's lists working with an unchanged
 * editor: the overlay goes on knowing only about DOM nodes and keys.
 */
export const editMarkerFor = (list, field, item) => {
    const key = contentKeyFor(list, field, item);

    return key === null ? undefined : `setting:${key}`;
};
