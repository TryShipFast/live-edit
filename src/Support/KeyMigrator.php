<?php

namespace ShipFast\LiveEdit\Support;

use DOMDocument;
use DOMElement;
use DOMXPath;

/**
 * Carries a client's saved content across a re-tag.
 *
 * Auto keys describe where an element sits, so re-tagging a template after the
 * scanner improves, or after a developer edits the source, can hand the same
 * element a different key. Everything stored against the old key is then
 * orphaned: the page silently reverts to the theme's own words and the client's
 * work looks lost.
 *
 * The tagged file always holds the ORIGINAL theme text, because edits are
 * applied when the page is served rather than written back into the file. That
 * makes an element recognisable across a re-tag by what the theme put in it,
 * even when the client has since replaced every word of it.
 */
class KeyMigrator
{
    /** Attributes that carry a key we may need to move. */
    protected const KEY_ATTRIBUTES = [
        'data-edit', 'data-edit-img', 'data-edit-bg', 'data-edit-href', 'data-edit-list', 'data-style',
    ];

    /**
     * Old key => new key, for every element found in both versions.
     *
     * @return array<string, string>
     */
    public static function between(string $oldHtml, string $newHtml): array
    {
        $old = self::index($oldHtml);
        $new = self::index($newHtml);

        $map = [];
        foreach ($old as $signature => $attributes) {
            foreach ($attributes as $attribute => $oldKey) {
                $newKey = $new[$signature][$attribute] ?? null;
                if ($newKey !== null && $newKey !== $oldKey) {
                    $map[$oldKey] = $newKey;
                }
            }
        }

        return $map;
    }

    /**
     * Signature => [attribute => key] for every tagged element.
     *
     * @return array<string, array<string, string>>
     */
    protected static function index(string $html): array
    {
        $doc = new DOMDocument;
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $xpath = new DOMXPath($doc);
        $query = implode(' | ', array_map(fn (string $a) => "//*[@{$a}]", self::KEY_ATTRIBUTES));

        $index = [];
        $seen = [];

        foreach ($xpath->query($query) as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }

            $signature = self::signature($node);
            // The same words can appear more than once (two "Learn more"
            // buttons), so each repeat is numbered in document order.
            $occurrence = $seen[$signature] = ($seen[$signature] ?? -1) + 1;
            $signature .= '#'.$occurrence;

            foreach (self::KEY_ATTRIBUTES as $attribute) {
                $key = self::keyFrom($node->getAttribute($attribute));
                if ($key !== null) {
                    $index[$signature][$attribute] = $key;
                }
            }
        }

        return $index;
    }

    /**
     * The key as the store holds it. Markup writes "setting:auto:abc" while a
     * row's key is "auto:abc", so renaming the attribute value verbatim would
     * match nothing. Model-backed records are skipped: their ids are database
     * ids and a re-tag never moves them.
     */
    protected static function keyFrom(string $value): ?string
    {
        if ($value === '' || str_starts_with($value, 'record:')) {
            return null;
        }

        return str_starts_with($value, 'setting:') ? substr($value, strlen('setting:')) : $value;
    }

    /** What the theme put in this element, which a re-tag does not change. */
    protected static function signature(DOMElement $node): string
    {
        return ContentSignature::of($node);
    }
}
