import { describe, expect, it } from 'vitest';
import { biggestThatFits, inSourcePixels, movedWithin, whatIsThereNow } from '../../resources/js/fitting.js';

/**
 * The browser half of fitting a replacement to the spot it goes in.
 *
 * The server half has eight tests that compare actual pixels. This half had
 * none: it was checked by grepping the built bundle for a string, which proves
 * the code shipped and nothing about whether it is right. Asked directly
 * whether it had been tested, the answer was no, and these are what that
 * question was worth.
 *
 * Everything here is arithmetic, which is why it could be pulled out of the
 * editor at all - and the failures it guards against are all silent. A wrong
 * measurement stores a soft picture; a wrong conversion crops somewhere else
 * entirely. Neither throws, and neither is visible until somebody looks at the
 * saved file.
 */

const animg = ({ naturalWidth = 0, naturalHeight = 0, box = null }) => ({
    naturalWidth,
    naturalHeight,
    getBoundingClientRect: () => box,
});

describe('what the replacement has to match', () => {
    it('takes the picture that is there, not the box it sits in', () => {
        /*
         * The fault this was built for. A theme ships a hero at 2400 and lays
         * it out at 1200: measuring the box stores half the file the design
         * was built on, and the client's own photograph comes out softer than
         * the stock one it replaced.
         */
        const measured = whatIsThereNow(animg({
            naturalWidth: 2400,
            naturalHeight: 1600,
            box: { width: 1200, height: 800 },
        }));

        expect(measured).toEqual({ width: 2400, height: 1600, exact: true });
    });

    it('does not hold a replacement to a picture smaller than its own box', () => {
        /*
         * The fault the fix above introduced, found on a real site. A 644px
         * hero is stretched across a column by `w-full h-auto`: taking the
         * picture at its word stored every client upload at 644, where
         * measuring the box stored 1152. A design is free to stretch a small
         * file, so the picture being there is not evidence it was right.
         */
        const measured = whatIsThereNow(animg({
            naturalWidth: 644,
            naturalHeight: 852,
            box: { width: 576, height: 762 },
        }));

        expect(measured).toEqual({ width: 576, height: 762, exact: false });
    });

    it('still takes the picture when it is already carrying its box', () => {
        // The case the measurement was changed for in the first place, which
        // the line above must not cost: 2400 across a 1200 box is exactly the
        // two device pixels per CSS pixel the box would have asked for.
        const measured = whatIsThereNow(animg({
            naturalWidth: 2400,
            naturalHeight: 1600,
            box: { width: 1200, height: 800 },
        }));

        expect(measured).toEqual({ width: 2400, height: 1600, exact: true });
    });

    it('counts both edges, not just the width', () => {
        // Wide enough and short is still a soft picture, and `object-fit:
        // cover` makes it an ordinary arrangement rather than a strange one.
        const measured = whatIsThereNow(animg({
            naturalWidth: 4000,
            naturalHeight: 500,
            box: { width: 1000, height: 1000 },
        }));

        expect(measured).toEqual({ width: 1000, height: 1000, exact: false });
    });

    it('marks it exact, because an image width is already device pixels', () => {
        // The server doubles a box for a retina screen and must not double
        // this. Getting it backwards stores a file twice the weight of the one
        // it replaced, for no visible gain, on every page view.
        expect(whatIsThereNow(animg({ naturalWidth: 800, naturalHeight: 600 })).exact).toBe(true);
    });

    it('falls back to the box for something with no picture to ask', () => {
        // A background. Not a lesser answer: a background covers its box, so
        // the box is exactly what it has to cover.
        const measured = whatIsThereNow(animg({ box: { width: 640, height: 360 } }));

        expect(measured).toEqual({ width: 640, height: 360, exact: false });
    });

    it('caps at what the endpoints will accept', () => {
        // A theme with a 6000px hero is not a mistake anybody made, and a save
        // refused by validation after the upload is a worse answer than a
        // slightly smaller picture.
        expect(whatIsThereNow(animg({ naturalWidth: 9000, naturalHeight: 9000 })).width).toBe(4000);
    });

    it('measures nothing rather than guessing at an element with no size', () => {
        // An element that is not laid out yet. Sending zeroes would ask the
        // server to fit a picture into nothing.
        expect(whatIsThereNow(animg({ box: { width: 0, height: 0 } }))).toBeNull();
        expect(whatIsThereNow(null)).toBeNull();
    });
});

describe('the crop frame', () => {
    it('starts as the biggest rectangle of the spot shape, centred', () => {
        /*
         * Centred because the middle is what automatic fitting would have
         * taken: opening the tool and pressing nothing has to leave the result
         * exactly as it was.
         */
        const frame = biggestThatFits({ width: 1000, height: 1000 }, 2);

        expect(frame).toEqual({ x: 0, y: 250, width: 1000, height: 500 });
    });

    it('fits the other way when the picture is the narrow one', () => {
        const frame = biggestThatFits({ width: 400, height: 1000 }, 0.5);

        expect(frame).toEqual({ x: 0, y: 100, width: 400, height: 800 });
    });

    it('converts to the file own pixels, because the panel scaled the picture', () => {
        /*
         * The conversion that decides whether the crop lands where somebody
         * drew it. The picture on screen is 500 wide and the file is 2000, so
         * every number quadruples - and a failure here is invisible until
         * somebody opens the saved picture.
         */
        const cut = inSourcePixels({ x: 50, y: 25, width: 200, height: 100 }, 500, 2000);

        expect(cut).toEqual({ x: 200, y: 100, width: 800, height: 400 });
    });

    it('never converts to nothing, however small the frame', () => {
        // A zero width would be read as "no crop" at the far end and silently
        // put the middle back, which is not what somebody who dragged a tiny
        // rectangle asked for.
        const cut = inSourcePixels({ x: 0, y: 0, width: 0.2, height: 0.2 }, 500, 500);

        expect(cut.width).toBeGreaterThanOrEqual(1);
        expect(cut.height).toBeGreaterThanOrEqual(1);
    });

    it('cannot be dragged off the edge of the picture', () => {
        // A rectangle half off the edge is a crop with a transparent strip
        // down one side, which nobody chose on purpose.
        const shown = { width: 1000, height: 600 };
        const frame = { x: 400, y: 100, width: 400, height: 200 };

        expect(movedWithin(frame, { x: 9999, y: 9999 }, shown)).toMatchObject({ x: 600, y: 400 });
        expect(movedWithin(frame, { x: -9999, y: -9999 }, shown)).toMatchObject({ x: 0, y: 0 });
    });

    it('moves by exactly the drag when it is nowhere near an edge', () => {
        const moved = movedWithin({ x: 100, y: 100, width: 200, height: 200 }, { x: 30, y: -40 }, { width: 1000, height: 1000 });

        expect(moved).toMatchObject({ x: 130, y: 60 });
    });
});
