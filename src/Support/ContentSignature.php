<?php

namespace ShipFast\LiveEdit\Support;

use DOMElement;
use DOMNode;

/**
 * Identifies an element by what the theme put in it.
 *
 * Where an element sits is not always a reliable name for it. The same footer
 * copied onto every page of a template picks up small differences — one page
 * carries an extra widget above it — and a position-based name then calls the
 * same line two different things. What the theme wrote in it does not drift
 * that way.
 *
 * This works because a tagged file always holds the ORIGINAL theme text: edits
 * are applied when the page is served, never written back. So a signature taken
 * at tagging time stays the same however much the client rewrites.
 */
class ContentSignature
{
    /** Attributes that identify an element better than its words do. */
    protected const IDENTIFYING = ['src', 'href', 'data-background'];

    /** Tag, own words, and address: what the theme put here. */
    public static function of(DOMElement $node): string
    {
        $parts = [strtolower($node->tagName), self::ownText($node)];

        foreach (self::IDENTIFYING as $attribute) {
            if ($node->hasAttribute($attribute)) {
                $parts[] = $attribute.'='.$node->getAttribute($attribute);
            }
        }

        return implode('|', $parts);
    }

    /**
     * A signature for a container, taken from everything inside it.
     *
     * A list has no words of its own, so its own signature would be "ul|" for
     * every list in the document. What distinguishes one is what it holds.
     */
    public static function ofSubtree(DOMElement $node, int $limit = 160): string
    {
        $text = trim((string) preg_replace('/\s+/', ' ', $node->textContent));

        return strtolower($node->tagName).'|'.mb_substr($text, 0, $limit);
    }

    /** An element's own words, ignoring anything its children contribute. */
    protected static function ownText(DOMElement $node): string
    {
        $own = '';

        foreach ($node->childNodes as $child) {
            if ($child->nodeType === XML_TEXT_NODE) {
                $own .= $child->nodeValue;
            }
        }

        return trim((string) preg_replace('/\s+/', ' ', $own));
    }

    /** True when this node contributes text of its own. */
    public static function hasOwnText(DOMNode $node): bool
    {
        return $node instanceof DOMElement && self::ownText($node) !== '';
    }
}
