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

/**
 * The key for a value inside a card that may or may not be a row.
 *
 * The server's answer to what `LiveEditItem` does in the browser. A card in
 * its own file cannot know it is inside a list - that is decided by whichever
 * file writes the `.map()` - and on the client the identity arrives through
 * context at render. There is no context on the server, so it arrives as a
 * prop instead, and this is what reads it.
 *
 * Three states, and the difference between the last two is the whole point:
 *
 *   undefined  the card is not in a list. The key is its own, untouched, and
 *              the card behaves exactly as it always has on its own page.
 *   a string   the card is one row of a list. The key carries the row.
 *   null       the card is a row of a list whose items have no identity of
 *              their own. There is no honest key: one key across every row
 *              means editing the first card changes all of them, so nothing
 *              is offered rather than something that would collide.
 *
 * Which is why the absent case is `undefined` and not `null`. A prop that was
 * never passed and a row that could not be identified look the same to a
 * default parameter, and they must not behave the same.
 */
export const contentKeyIn = (row, key) => {
    if (row === undefined) {
        return key;
    }

    return row === null ? null : `${key}@${row}`;
};

/**
 * What goes in a row card's `data-edit`, or undefined.
 *
 * Undefined so React omits the attribute entirely: an unkeyable row renders as
 * ordinary markup the editor offers nothing for, rather than as a control
 * whose edits would land on the wrong card.
 */
export const editMarkerIn = (row, key) => {
    const composed = contentKeyIn(row, key);

    return composed === null ? undefined : `setting:${composed}`;
};
