/**
 * Makes a piece of SVG safe to put back into a page.
 *
 * Everything else applied here is text or a URL, and goes in as a text node or
 * an attribute the browser will not execute. An icon is markup, and markup is
 * where a stored value stops being data and starts being code: a script
 * element, an onload, an href pointing at somebody else's server. Published
 * content arrives over the network, so treating it as trusted markup would
 * make a content service a way to run scripts in every visitor's browser.
 *
 * So an icon is rebuilt from an allowed list rather than filtered for
 * known-bad — anything not named here is dropped, which fails towards a
 * missing shape rather than towards running whatever arrived.
 *
 * Deliberately the same lists, in the same order, as the server's
 * SvgSanitiser. The two are compared by a parity test: one of them quietly
 * allowing something the other does not is how a hole opens on one kind of
 * site and not the other.
 */

/** Elements that draw, group, or describe. Nothing that loads or executes. */
const ELEMENTS = new Set([
    'svg', 'g', 'defs', 'symbol', 'use', 'title', 'desc',
    'path', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'rect',
    'text', 'tspan', 'textpath',
    'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'pattern',
]);

/** Attributes worth keeping. Presentation, geometry, and accessibility. */
const ATTRIBUTES = new Set([
    'viewbox', 'xmlns', 'width', 'height', 'fill', 'fill-rule', 'fill-opacity',
    'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
    'stroke-dashoffset', 'stroke-opacity', 'stroke-miterlimit', 'opacity',
    'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
    'transform', 'offset', 'stop-color', 'stop-opacity', 'gradientunits',
    'gradienttransform', 'patternunits', 'clip-rule', 'clip-path', 'mask',
    'id', 'class', 'role', 'aria-label', 'aria-hidden', 'focusable',
    'preserveaspectratio', 'vector-effect', 'text-anchor', 'font-size', 'font-family',
]);

const COMMENT_NODE = 8;

/**
 * The drawing stripped to what is allowed, as an element ready to be put in
 * the page — or null when there is no usable SVG in it at all.
 */
export const cleanSvg = (svg) => {
    const source = String(svg ?? '').trim();

    if (source === '' || !/<svg/i.test(source)) {
        return null;
    }

    // Parsed as XML, which SVG is. An HTML parser lowercases attribute names,
    // and SVG is case-sensitive: viewBox would become viewbox and the drawing
    // would lose its coordinate system. A DOMParser never fetches what the
    // document points at and never runs what is in it.
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    const root = parsed.documentElement;

    if (!root || root.tagName?.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) {
        return null;
    }

    scrub(root);

    // A drawing with nothing left to draw is not worth showing.
    if (root.children.length === 0 && root.textContent.trim() === '') {
        return null;
    }

    return root;
};

/** Walk the tree, dropping anything not named in the lists above. */
const scrub = (element) => {
    for (const child of [...element.childNodes]) {
        if (child.nodeType === COMMENT_NODE) {
            // Comments can carry markup through a naive filter; text is kept
            // because <title> and <text> are legitimate.
            child.remove();

            continue;
        }

        if (child.nodeType !== 1) {
            continue;
        }

        if (!ELEMENTS.has(child.tagName.toLowerCase())) {
            child.remove();

            continue;
        }

        scrub(child);
    }

    for (const attribute of [...element.attributes]) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value;

        // A reference may point inside this drawing and nowhere else.
        const isReference = name === 'href' || name === 'xlink:href';
        let keep = isReference ? value.trim().startsWith('#') : ATTRIBUTES.has(name);

        // url() in a presentation attribute can fetch, so only a local
        // reference survives.
        if (keep && /url\(/i.test(value) && !/^url\(\s*#/i.test(value.trim())) {
            keep = false;
        }

        if (!keep) {
            element.removeAttribute(attribute.name);
        }
    }
};
