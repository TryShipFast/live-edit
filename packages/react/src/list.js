import { useLiveEdit } from './context.js';
import { copiedWithIdentity, itemIdentity } from './identity.js';

/**
 * The rows of a list, in the order the client put them.
 *
 * Every other adapter does this by rearranging markup: the order is stored as
 * content, and the applier moves, drops and clones elements to match. That
 * cannot work here, because the rows are not markup - they are a projection of
 * an array, and anything done to the DOM is undone by the next render.
 *
 * So the array itself passes through this on its way to `.map()`. The codemod
 * writes the call:
 *
 *     {useLiveEditList("list4b49…", courses).map((course) => …)}
 *
 * A hook, called once per component rather than once per row, so the Rules of
 * Hooks are not in question - which is the whole reason the *values* inside a
 * row read through a component instead.
 *
 * With no stored order this returns the developer's array untouched, so a list
 * nobody has reordered renders exactly as it was written, and an app with no
 * provider at all still works.
 *
 * @see ADAPTERS.md, "The React repeated-content milestone"
 */
export const useLiveEditList = (listKey, items) => {
    const context = useLiveEdit();
    const stored = context?.content?.[listKey];
    const order = asOrder(stored);

    if (order === null || !Array.isArray(items)) {
        return items;
    }

    /*
     * Rows the data actually has, by identity. A row with no identity of its
     * own cannot be placed by the order and cannot be told from its
     * neighbours, so the whole list is handed back untouched rather than
     * partly rearranged - the same all-or-nothing that listIdentity() applies,
     * for the same reason.
     */
    const known = new Map();

    for (const item of items) {
        const identity = itemIdentity(item);

        if (identity === null) {
            return items;
        }

        known.set(identity, item);
    }

    const out = [];

    order.forEach((id, position) => {
        const identity = String(id);
        const found = known.get(identity);

        if (found !== undefined) {
            out.push(found);

            return;
        }

        /*
         * An id in the order with no row behind it is one the client added.
         * It copies the nearest row before it that we do have, which is the
         * rule every adapter follows and needs no protocol to carry: the
         * editor inserts a new id immediately after the row whose button was
         * pressed, so the order is the record of where it came from as well
         * as of sequence.
         *
         * Walking back rather than taking the entry immediately before,
         * because two rows added in a row leave an id with nothing behind it
         * either. Copying the wrong row is bad; copying nothing is worse.
         */
        const template = templateBefore(order, position, known) ?? items[0];
        const copy = template === undefined ? null : copiedWithIdentity(template, identity);

        if (copy !== null) {
            out.push(copy);
        }
    });

    return out;
};

/** The nearest row before this position that the data actually has. */
const templateBefore = (order, position, known) => {
    for (let back = position - 1; back >= 0; back -= 1) {
        const found = known.get(String(order[back]));

        if (found !== undefined) {
            return found;
        }
    }

    return null;
};

/**
 * The stored order, whatever shape it arrived in.
 *
 * Content is a map of strings, so the order travels as JSON - the same as on
 * every other adapter, where the applier json_decodes it. An array is
 * accepted too, because a provider handed content directly in a test or by a
 * server that already parsed it should not be a different case.
 *
 * Anything unreadable returns null, which means "no order" rather than "empty
 * order". The difference matters enormously: an empty order would render a
 * list with no rows in it, so a corrupted value would blank a client's
 * catalogue rather than leave it alone.
 */
const asOrder = (stored) => {
    if (Array.isArray(stored)) {
        return stored;
    }

    if (typeof stored !== 'string' || stored.trim() === '') {
        return null;
    }

    try {
        const parsed = JSON.parse(stored);

        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
};
