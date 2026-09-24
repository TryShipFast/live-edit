<?php

namespace ShipFast\LiveEdit\Support;

use DOMAttr;
use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Makes a piece of SVG safe to put back into a page.
 *
 * Everything else the editor stores is text or a URL, and is escaped or pattern
 * matched on the way out. An icon is markup, and markup is where a stored value
 * stops being data and starts being code: a script element, an onload, an
 * xlink:href pointing at someone else's server. So an icon is rebuilt from an
 * allowed list rather than filtered for known-bad — anything not named here is
 * dropped, which fails towards a missing shape rather than towards running
 * whatever arrived.
 */
class SvgSanitiser
{
    /** Elements that draw, group, or describe. Nothing that loads or executes. */
    protected const ELEMENTS = [
        'svg', 'g', 'defs', 'symbol', 'use', 'title', 'desc',
        'path', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'rect',
        'text', 'tspan', 'textpath',
        'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'pattern',
        // matched lowercase; the document keeps its own spelling
    ];

    /** Attributes worth keeping. Presentation, geometry, and accessibility. */
    protected const ATTRIBUTES = [
        'viewbox', 'xmlns', 'width', 'height', 'fill', 'fill-rule', 'fill-opacity',
        'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
        'stroke-dashoffset', 'stroke-opacity', 'stroke-miterlimit', 'opacity',
        'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
        'transform', 'offset', 'stop-color', 'stop-opacity', 'gradientunits',
        'gradienttransform', 'patternunits', 'clip-rule', 'clip-path', 'mask',
        'id', 'class', 'role', 'aria-label', 'aria-hidden', 'focusable',
        'preserveaspectratio', 'vector-effect', 'text-anchor', 'font-size', 'font-family',
    ];

    /**
     * Return the SVG stripped to what is allowed, or '' if there is no usable
     * SVG in it at all.
     */
    public static function clean(string $svg): string
    {
        $svg = trim($svg);
        if ($svg === '' || stripos($svg, '<svg') === false) {
            return '';
        }

        $doc = new DOMDocument;
        libxml_use_internal_errors(true);
        // Parsed as XML, which SVG is. The HTML parser lowercases attribute
        // names, and SVG is case-sensitive: viewBox became viewbox and every
        // drawing lost its coordinate system. LIBXML_NONET refuses to fetch
        // anything the document points at while parsing.
        $parsed = $doc->loadXML($svg, LIBXML_NONET | LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $root = $parsed ? $doc->documentElement : null;
        if (! $root instanceof DOMElement || strtolower($root->tagName) !== 'svg') {
            return '';
        }

        self::scrub($root);

        // A drawing with no drawing left in it is not worth storing.
        if ($root->getElementsByTagName('*')->length === 0 && trim($root->textContent) === '') {
            return '';
        }

        return (string) $doc->saveHTML($root);
    }

    /** Walk the tree, dropping anything not named in the lists above. */
    protected static function scrub(DOMElement $element): void
    {
        foreach (iterator_to_array($element->childNodes) as $child) {
            if ($child instanceof DOMElement) {
                if (! in_array(strtolower($child->tagName), self::ELEMENTS, true)) {
                    $element->removeChild($child);

                    continue;
                }
                self::scrub($child);

                continue;
            }

            // Comments can carry markup through a naive filter; text is kept
            // because <title> and <text> are legitimate.
            if (! ($child instanceof DOMNode) || $child->nodeType === XML_COMMENT_NODE) {
                $element->removeChild($child);
            }
        }

        foreach (iterator_to_array($element->attributes ?? []) as $attribute) {
            if (! $attribute instanceof DOMAttr) {
                continue;
            }

            $name = strtolower($attribute->name);
            $value = $attribute->value;

            // A reference may point inside this drawing and nowhere else.
            $isReference = in_array($name, ['href', 'xlink:href'], true);
            $keep = $isReference
                ? str_starts_with(trim($value), '#')
                : in_array($name, self::ATTRIBUTES, true);

            // url() in a presentation attribute can fetch, so only a local
            // reference survives.
            if ($keep && stripos($value, 'url(') !== false && ! preg_match('/^url\(\s*#/i', trim($value))) {
                $keep = false;
            }

            if (! $keep) {
                $element->removeAttribute($attribute->name);
            }
        }
    }
}
