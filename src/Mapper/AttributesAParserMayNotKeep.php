<?php

namespace ShipFast\LiveEdit\Mapper;

/**
 * Attribute names a parser is entitled to throw away, carried across intact.
 *
 * Alpine's shorthand for an event listener is `@click`, and Vue's is the same.
 * HTML5 allows it: an attribute name may hold almost anything that is not
 * whitespace, a slash, an equals sign or a closing angle bracket. libxml's
 * parser predates that rule and has never been bound by it.
 *
 * Reported from a live site as "Alpine Expression Error: Unexpected token
 * '}'". What was served was
 *
 *     <button id="..." null="" :="" :aria-expanded="...">
 *
 * where the source had said
 *
 *     @click="group = (group === 'product' ? null : 'product')"
 *
 * The name was refused, the parser resynchronised somewhere inside the value,
 * and two of the expression's own words - `null` and `:` - came out the far
 * side as attributes of their own. The listener was gone, so the site's mobile
 * menu did not open, and the console said only that some expression somewhere
 * would not parse.
 *
 * It does not reproduce on libxml 2.15, which keeps the name. That is the
 * reason this exists rather than a reason not to: a package installed on
 * servers we do not choose cannot leave whether it destroys a customer's
 * JavaScript to which libxml the distribution happened to ship. Protection
 * costs one pass of a regex and settles the question everywhere.
 *
 * The rename is unconditional in both directions, which is what makes it safe
 * to be imprecise. A false positive - the characters " @foo =" inside a script
 * or a paragraph of prose - is renamed on the way in and renamed back on the
 * way out, so the document is returned byte for byte either way. The only
 * thing that cannot survive is markup that already contains the marker below,
 * which is why the marker is not a word anybody would write.
 */
final class AttributesAParserMayNotKeep
{
    /**
     * Stands in for the `@` while the document is in a parser's hands.
     *
     * A valid attribute name, so no parser has an opinion about it, and
     * specific enough that finding one in a customer's markup would mean they
     * had copied it from here.
     */
    private const MARKER = 'x-live-edit-event-';

    /**
     * Rewrite `@click` as something every parser will keep.
     *
     * Matched on the name alone - whitespace, the `@`, a name, and an equals
     * sign ahead of it - rather than by finding tags first. A regex that tries
     * to find the end of a tag has to decide what `>` means inside an
     * attribute value, and an Alpine expression is exactly where a bare `>`
     * turns up: `@click="count > 1 && go()"`. Getting that wrong would corrupt
     * the markup in the course of protecting it.
     */
    public static function protect(string $html): string
    {
        if (! str_contains($html, '@')) {
            return $html;
        }

        return preg_replace(
            '/(\s)@([A-Za-z][A-Za-z0-9_.:-]*)(?=\s*=)/',
            '$1'.self::MARKER.'$2',
            $html
        ) ?? $html;
    }

    /** Put every `@` back, whether a parser would have minded it or not. */
    public static function restore(string $html): string
    {
        return str_replace(self::MARKER, '@', $html);
    }
}
