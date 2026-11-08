/**
 * Where a card can move, worked out from where the cards are drawn (owner, 8 Nov 2026: "the move should be
 * contextual to how each section or container works"; "it's most likely default and won't work for every move").
 *
 * A move used to swap a card with the one before or after it in its list, whatever the page drew: in a grid of three
 * reviews that neighbour is beside it, so "Move down" moved it right, and nothing moved a card to the row below. Here
 * each direction is the card actually drawn that way: left and right on its row, up and down the nearest card in the
 * row above or below, in the same column. The card takes that card's place, so it lands where the button said. A list
 * drawn in another order than it is kept (reversed rows, columns filled downwards) works the same, since only where
 * cards are drawn is looked at. Where a card is not drawn (a slide off its slider), there is nowhere to point: the
 * moves are "earlier" and "later" in the list.
 */

const drawn = (rect) => Boolean(rect && rect.width > 0 && rect.height > 0);
const centre = (rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

/**
 * The card each direction leads to, by its index, or undefined: { left, right, up, down }; or
 * { earlier, later } when the card itself is not drawn.
 *
 * @param {Array<{left:number, top:number, width:number, height:number}|null>} rects  every card's box, in list order
 * @param {number} index  the card being moved
 */
export const placesToMove = (rects, index) => {
    const me = rects[index];
    if (!drawn(me)) {
        return { earlier: index > 0 ? index - 1 : undefined, later: index < rects.length - 1 ? index + 1 : undefined };
    }
    const mine = centre(me);
    const bottom = (r) => r.top + r.height;
    const others = rects.map((rect, i) => ({ rect, i })).filter(({ rect, i }) => i !== index && drawn(rect));
    const sameRow = (r) => Math.abs(centre(r).y - mine.y) < Math.min(r.height, me.height) / 2;
    const nearest = (list, by) => list.sort((a, b) => by(a) - by(b))[0]?.i;

    const row = others.filter(({ rect }) => sameRow(rect));
    const left = nearest(row.filter(({ rect }) => centre(rect).x < mine.x), ({ rect }) => mine.x - centre(rect).x);
    const right = nearest(row.filter(({ rect }) => centre(rect).x > mine.x), ({ rect }) => centre(rect).x - mine.x);

    // The row above: the cards wholly above this one; of them the lowest row, then the closest column.
    const above = others.filter(({ rect }) => bottom(rect) <= me.top + Math.min(rect.height, me.height) / 2 && !sameRow(rect));
    const below = others.filter(({ rect }) => rect.top >= bottom(me) - Math.min(rect.height, me.height) / 2 && !sameRow(rect));
    const column = ({ rect }) => Math.abs(centre(rect).x - mine.x);
    const up = nearest(above, ({ rect }) => (mine.y - centre(rect).y) * 1000 + column({ rect }));
    const down = nearest(below, ({ rect }) => (centre(rect).y - mine.y) * 1000 + column({ rect }));

    return { left, right, up, down };
};

/** The list's order with one card put in another's place (the others close up behind it). */
export const movedOrder = (ids, from, to) => {
    if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return [...ids];
    const next = [...ids];
    const [card] = next.splice(from, 1);
    next.splice(to, 0, card);

    return next;
};

/** The buttons, in reading order, with their words. */
export const MOVE_LABELS = [
    ['up', '↑ Move up'],
    ['left', '← Move left'],
    ['right', 'Move right →'],
    ['down', '↓ Move down'],
    ['earlier', '↑ Move earlier'],
    ['later', '↓ Move later'],
];
