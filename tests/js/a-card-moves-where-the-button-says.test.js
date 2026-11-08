import { describe, expect, it } from 'vitest';
import { movedOrder, placesToMove } from '../../resources/js/moves.js';

/*
 * "the move should be contextual to how each section or container works"; "it's most likely default and won't work
 * for every move" (owner, 8 Nov 2026). Each direction is the card drawn that way, and the card lands there.
 */
const box = (left, top, width = 100, height = 100) => ({ left, top, width, height });
// A grid of three: 0 1 2 / 3 4 5
const grid = [box(0, 0), box(120, 0), box(240, 0), box(0, 120), box(120, 120), box(240, 120)];

describe('a card moves where the button says', () => {
    it('in a grid: left and right on its row, up and down in its column', () => {
        expect(placesToMove(grid, 4)).toEqual({ left: 3, right: 5, up: 1, down: undefined });
        expect(placesToMove(grid, 0)).toEqual({ left: undefined, right: 1, up: undefined, down: 3 });
        // Down from the middle of the top row lands in the middle of the row below.
        const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
        expect(movedOrder(ids, 1, placesToMove(grid, 1).down)).toEqual(['a', 'c', 'd', 'e', 'b', 'f']);
    });

    it('in a column: only up and down', () => {
        const column = [box(0, 0, 300, 80), box(0, 100, 300, 80), box(0, 200, 300, 80)];
        expect(placesToMove(column, 1)).toEqual({ left: undefined, right: undefined, up: 0, down: 2 });
    });

    it('drawn in another order than it is kept: by where it is drawn', () => {
        // A row drawn right to left: the first card is on the right.
        const reversed = [box(240, 0), box(120, 0), box(0, 0)];
        expect(placesToMove(reversed, 0)).toEqual({ left: 1, right: undefined, up: undefined, down: undefined });
        // Columns filled downwards: 0 2 / 1 3
        const downwards = [box(0, 0), box(0, 120), box(120, 0), box(120, 120)];
        expect(placesToMove(downwards, 0)).toMatchObject({ right: 2, down: 1 });
    });

    it('a card that is not drawn moves earlier or later in the list', () => {
        expect(placesToMove([box(0, 0), null, box(240, 0)], 1)).toEqual({ earlier: 0, later: 2 });
    });

    it('a short last row: down from above goes to the nearest card below', () => {
        const short = [box(0, 0), box(120, 0), box(240, 0), box(0, 120)];
        expect(placesToMove(short, 2).down).toBe(3);
    });
});
