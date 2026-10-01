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

const cap = (n) => Math.min(Math.max(Math.round(n), 1), LARGEST);

/**
 * The size a replacement has to match: the picture that is there now.
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

    if (naturalWidth >= 1 && naturalHeight >= 1) {
        return { width: cap(naturalWidth), height: cap(naturalHeight), exact: true };
    }

    const box = element.getBoundingClientRect?.();

    if (box && box.width >= 1 && box.height >= 1) {
        return { width: cap(box.width), height: cap(box.height), exact: false };
    }

    return null;
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
