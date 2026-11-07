<?php

declare(strict_types=1);

namespace ShipFast\LiveEdit\Domain\Content;

/**
 * How many changes are waiting, counted the way the owner made them.
 *
 * Every value is its own draft, so choosing a palette in Brand is seven drafts (brand.ink, brand.accent, ...) and a
 * pairing of fonts two. The Publish button read "18" for six things done (first-time owner walk, 7 Nov 2026: "Our
 * promise to people is easy of use"). A palette's colours count once, a pairing's faces once, everything else as it
 * is. The editor's publish review groups them the same way (resources/js/changes-as-made.js), so the two agree.
 */
final class ChangesAsMade
{
    public const COLOURS = ['brand.ink', 'brand.accent', 'brand.surface', 'brand.raised', 'brand.body', 'brand.muted', 'brand.line'];

    public const FONTS = ['brand.font.display', 'brand.font.body'];

    /** @param  iterable<string>  $subjects  the drafts' subjects */
    public static function count(iterable $subjects): int
    {
        $count = 0;
        $groups = [];

        foreach ($subjects as $subject) {
            $group = in_array($subject, self::COLOURS, true) ? 'colours' : (in_array($subject, self::FONTS, true) ? 'fonts' : null);

            if ($group === null) {
                $count++;
            } elseif (! isset($groups[$group])) {
                $groups[$group] = true;
                $count++;
            }
        }

        return $count;
    }
}
