/**
 * Measuring what a replacement has to match, and where it was cut.
 *
 * Pulled out of the editor because it is arithmetic, and arithmetic inside a
 * four-thousand-line closure is arithmetic nobody can test. The server half of
 * this is covered by eight tests that compare actual pixels; this half was
 * asserted by grepping the built bundle for a string, which is not a test and
 * was not honest to describe as one.
 */

/** The largest edge either endpoint accepts. */
const LARGEST = 4000;

/**
 * What the server multiplies a box by, mirrored from ImageFitter::DENSITY.
 *
 * Here only to compare the two measurements in the same units. A box is in CSS
 * pixels and a picture's own width is in device pixels, so neither number
 * means anything beside the other until one of them is converted.
 */
const DENSITY = 2;

const cap = (n) => Math.min(Math.max(Math.round(n), 1), LARGEST);

/**
 * The size a replacement has to match: whichever of the two asks for more.
 *
 * The box it sits in was what this measured, and the box is not the picture. A
 * theme ships a hero at 2400 wide and lays it out at 1200; fitting the
 * replacement to 1200 stores half the file the design was built on, and the
 * client sees their own photograph come out softer than the stock one it
 * replaced. On the page that is the whole product.
 *
 * So an <img> is asked what it is actually showing. naturalWidth is the file's
 * own width in device pixels, which is exactly what was replaced - and it is
 * marked exact, because a box is in CSS pixels and wants doubling for a retina
 * screen while this does not.
 *
 * Which was right about the theme that prompted it and wrong about the one
 * that found this: taking the picture at its word assumes the picture was the
 * right size, and a design is perfectly free to stretch a small file across a
 * large box. A real site shipped a 644px hero under `w-full h-auto` in a
 * column half again as wide. Measuring the picture held every client upload to
 * 644px - a 4000px photograph stored at 9KB - where measuring the box had
 * stored 1152. The feature built to stop a replacement coming out soft was
 * making it come out softer, and only on the sites that needed it most.
 *
 * So the picture is the standard only when it is already carrying its box.
 * Short on either edge and the box is the honest answer, because the box is
 * what somebody will actually see the picture filling. Taking the larger is
 * also what makes this safe to get wrong in either direction: the worst case
 * is a file bigger than it strictly needed to be, never a visibly soft one.
 *
 * A background has no picture to ask, so there the box is the answer and the
 * right one: a background covers its box, and the box is what it has to cover.
 *
 * @returns {{width: number, height: number, exact: boolean}|null}
 */
export const whatIsThereNow = (element) => {
    if (!element) {
        return null;
    }

    const naturalWidth = Number(element.naturalWidth ?? 0);
    const naturalHeight = Number(element.naturalHeight ?? 0);

    const box = element.getBoundingClientRect?.();
    const boxed = box && box.width >= 1 && box.height >= 1
        ? { width: cap(box.width), height: cap(box.height), exact: false }
        : null;

    if (naturalWidth >= 1 && naturalHeight >= 1) {
        /*
         * Both edges, not just the width. A box the picture covers across but
         * falls short down is still a box with a soft picture in it, and
         * `object-fit: cover` makes that an ordinary arrangement rather than a
         * strange one.
         */
        const coversItsBox = boxed === null
            || (naturalWidth >= box.width * DENSITY && naturalHeight >= box.height * DENSITY);

        if (coversItsBox) {
            return { width: cap(naturalWidth), height: cap(naturalHeight), exact: true };
        }

        return boxed;
    }

    return boxed;
};

/**
 * The biggest rectangle of a given shape that fits inside a picture, centred.
 *
 * Where the crop frame starts. Centred because the middle is what automatic
 * fitting would have taken, so opening the tool and pressing nothing leaves
 * the result exactly as it was.
 */
export const biggestThatFits = (shown, ratio) => {
    let width = shown.width;
    let height = width / ratio;

    if (height > shown.height) {
        height = shown.height;
        width = height * ratio;
    }

    return {
        x: (shown.width - width) / 2,
        y: (shown.height - height) / 2,
        width,
        height,
    };
};

/**
 * A frame drawn on screen, converted to the file's own pixels.
 *
 * The picture in the panel was scaled to fit it and the server has never seen
 * that panel. Get this wrong and the crop lands somewhere else entirely, which
 * is a failure nobody can see until they look at the saved picture.
 */
export const inSourcePixels = (frame, shownWidth, naturalWidth) => {
    const scale = naturalWidth / (shownWidth || 1);

    return {
        x: Math.max(0, Math.round(frame.x * scale)),
        y: Math.max(0, Math.round(frame.y * scale)),
        width: Math.max(1, Math.round(frame.width * scale)),
        height: Math.max(1, Math.round(frame.height * scale)),
    };
};

/**
 * A frame moved by a drag, kept inside the picture.
 *
 * A rectangle half off the edge is a crop with a transparent strip down one
 * side, which nobody chose on purpose.
 */
export const movedWithin = (frame, by, shown) => {
    const limit = (value, max) => Math.max(0, Math.min(value, max));

    return {
        ...frame,
        x: limit(frame.x + by.x, shown.width - frame.width),
        y: limit(frame.y + by.y, shown.height - frame.height),
    };
};
