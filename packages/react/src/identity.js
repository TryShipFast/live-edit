/**
 * Which item in a list an edit belongs to.
 *
 * This is the first of the three problems the repeated-content milestone names,
 * and the one that decides whether the other two are worth building. Content is
 * stored against an item's identity, so an identity that moves takes somebody's
 * edits with it - silently, and onto the wrong card.
 *
 * **Not the React key.** It is the obvious candidate and it is wrong. React
 * only requires a key to be unique among siblings for one render; it is
 * routinely the array index, is often absent, and is never promised to be the
 * same value after a refetch. Keying content on one means a list that reorders
 * hands card three's words to card one, and nothing errors.
 *
 * So identity comes from the item's own data, and when the data has none this
 * says so rather than inventing one. A list the customer is told cannot be
 * edited is a smaller failure than a list that edits the wrong row.
 *
 * @see ADAPTERS.md, "The React repeated-content milestone"
 */

/**
 * The fields worth trusting, in the order they are worth trusting.
 *
 * All of them mean "this is the row" in some API somebody actually ships.
 * `slug` is last of the real ones because it is stable in practice and
 * editable in principle: a CMS that lets somebody rewrite a slug would move
 * the identity, where a primary key cannot be rewritten by anybody.
 */
const STABLE_FIELDS = ['id', 'uuid', 'uid', '_id', 'ref', 'sku', 'slug'];

/**
 * A usable identity out of one value, or null when there is none.
 *
 * Deliberately narrow about what counts. A number or a non-empty string is an
 * identity; an object, an array or a boolean is somebody's field that happens
 * to share a name with one, and treating it as an identity would produce
 * "[object Object]" for every row in the list - one identity, shared, which is
 * the exact failure this file exists to prevent.
 */
const usable = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }

    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();

    return trimmed === '' ? null : trimmed;
};

/**
 * The identity of one item, or null when its data carries none.
 *
 * A primitive item - a list of plain strings - returns null on purpose, even
 * though the string itself is unique often enough to be tempting. The value is
 * the very thing a client is about to edit, so using it as the identity means
 * the first edit changes the identity and the edit is immediately orphaned
 * from the row that caused it. An identity derived from content is not an
 * identity.
 *
 * @param {unknown} item one entry of the mapped array
 * @returns {string|null}
 */
export const itemIdentity = (item) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        return null;
    }

    for (const field of STABLE_FIELDS) {
        const found = usable(item[field]);

        if (found !== null) {
            return found;
        }
    }

    return null;
};

/**
 * Whether a whole list can carry edits, and why not when it cannot.
 *
 * Asked of the array rather than of each item because the answer has to be one
 * thing: a list where three rows in ten have ids is not two thirds editable,
 * it is a list whose identities are about to collide as soon as the data
 * changes. Every row or none.
 *
 * Duplicates are checked for the same reason and are the more likely fault in
 * real data - a join that repeats a row, or an `id` field that is really a
 * type. Two rows sharing an identity means one client edit appearing in both,
 * which reads as the editor being broken rather than the data being unusual.
 *
 * @param {Array<unknown>} items
 * @returns {{editable: boolean, reason: string|null, identities: Array<string>}}
 */
export const listIdentity = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        // Nothing to key, which is not a fault. An empty list is editable in
        // the sense that matters: there is nothing here to get wrong.
        return { editable: true, reason: null, identities: [] };
    }

    const identities = items.map((item) => itemIdentity(item));
    const missing = identities.filter((identity) => identity === null).length;

    if (missing > 0) {
        return {
            editable: false,
            reason: missing === items.length
                ? 'no item in this list has an id, so an edit cannot be kept against one'
                : `${missing} of ${items.length} items have no id, so their edits could not be kept apart`,
            identities: [],
        };
    }

    const unique = new Set(identities);

    if (unique.size !== identities.length) {
        return {
            editable: false,
            reason: 'two or more items share an id, so an edit to one would appear in both',
            identities: [],
        };
    }

    return { editable: true, reason: null, identities };
};
