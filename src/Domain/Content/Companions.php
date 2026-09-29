<?php

namespace ShipFast\LiveEdit\Domain\Content;

/**
 * The things stored beside a picture rather than instead of it.
 *
 * A picture is one setting holding an address. Everything else it needs — what
 * it says to a screen reader, what it says on hover, who took it and under
 * what terms — is stored under the same key with a suffix, so a theme can read
 * each by name and nothing has to be declared anywhere.
 *
 * This list existed in five places, written out by hand each time, and they
 * had already drifted: one carried Alt, Title, Credit and Href across a
 * re-tag; another allowed only Alt and Title to be written at all; a third
 * knew about Credit but not the four fields beside it. The failure that found
 * it is the one this design is supposed to prevent — a photographer's name
 * left behind on the old key when the picture it belonged to moved to a new
 * one, so the credit and the photograph came apart and neither was wrong
 * enough to notice.
 *
 * One list. Anything that handles a picture's companions reads it from here,
 * and adding a companion is one edit rather than five and a bug.
 */
final class Companions
{
    /**
     * Every suffix, longest first.
     *
     * The order matters wherever a key is matched by its ending: "Credit" is
     * a suffix of nothing, but a naive pass over this list would match
     * "CreditBy" as "…By" of a picture called "…Credit" if the short ones came
     * first. Longest first makes the match unambiguous.
     *
     * @var list<string>
     */
    public const ALL = [
        'CreditSourceUrl',
        'CreditSource',
        'CreditUrl',
        'CreditBy',
        'Credit',
        // The densities a fitted replacement was made at. Added to the
        // appliers and to the WordPress media route on 2026-09-29 and NOT
        // added here, which meant the policy refused the very key the save
        // was writing: a client replaced a picture and was told "Unknown
        // setting" for a companion this package had just invented.
        'Srcset',
        'Title',
        'Href',
        'Alt',
    ];

    /**
     * Just the attribution ones.
     *
     * Kept separate because they move together: a picture replaced by one
     * that needs no credit must lose all of these at once. A photographer's
     * name under somebody else's photograph is not a stale field, it is a
     * false statement about who took it.
     *
     * @var list<string>
     */
    public const CREDIT = [
        'Credit',
        'CreditBy',
        'CreditUrl',
        'CreditSource',
        'CreditSourceUrl',
    ];

    /**
     * The key a companion belongs to, or null when it is not one.
     */
    public static function pictureFor(string $key): ?string
    {
        foreach (self::ALL as $suffix) {
            if (! str_ends_with($key, $suffix)) {
                continue;
            }

            $picture = substr($key, 0, -strlen($suffix));

            if ($picture !== '') {
                return $picture;
            }
        }

        return null;
    }
}
