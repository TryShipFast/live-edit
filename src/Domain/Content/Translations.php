<?php

namespace ShipFast\LiveEdit\Domain\Content;

use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\SiteSetting;

/**
 * Which translations still say what the English says.
 *
 * A key is not seven independent pieces of content. It is one canonical value
 * with translations hanging off it, and the moment the canonical changes every
 * translation of it becomes a claim about words that are no longer there.
 *
 * Before this, editing the English on a site with six languages left six pages
 * silently saying the old thing. The save worked, the editor reported success,
 * and nothing anywhere knew the French was now a translation of a sentence
 * that had been replaced. That is worse than a visible failure: the site looks
 * finished and is wrong in five languages nobody on the team reads.
 *
 * Nothing here overwrites a translation, and that is deliberate rather than a
 * limitation. Replacing "Learn from the best educators" with "Learn from
 * Africa's leading educators" is a change of meaning, and machine-translating
 * over somebody's reviewed French without telling them is a worse failure than
 * leaving it stale and saying so. This marks; a person decides.
 *
 * ## Why a fingerprint rather than a version number
 *
 * The obvious design records which numbered version of the canonical each
 * translation was made from - French translated from version 41, English now
 * at 42, so French is stale. It works, and it is wrong in one ordinary case:
 * somebody edits the English, looks at it, and undoes it. The counter has
 * moved to 43 and every translation is marked stale forever, though not one
 * word of what they were translated from has changed.
 *
 * A fingerprint of the canonical value itself has no such state. Undo restores
 * the words, the fingerprint matches again, and the translations quietly
 * become current - which is the truth. Status is *derived* rather than stored,
 * so a canonical write updates nothing else, there is no cascade to get wrong,
 * and no row can disagree with another about what is stale.
 */
class Translations
{
    /**
     * What a translation was translated from.
     *
     * Short on purpose. This is only ever compared with another fingerprint of
     * the same kind, so the width buys nothing, and it sits in a column beside
     * every translated row on a site.
     */
    public static function fingerprint(string $canonical): string
    {
        return substr(hash('sha256', $canonical), 0, 16);
    }

    /** The locale a stored key belongs to, or null when it is the canonical. */
    public static function localeOf(string $key, array $known): ?string
    {
        [$prefix, $rest] = array_pad(explode(':', $key, 2), 2, null);

        // Only a prefix the site actually declares counts. Taking any prefix
        // read the scanner's own "auto:1a2b" keys as a language called "auto",
        // which is a fault this codebase has already had once.
        return $rest !== null && in_array($prefix, $known, true) ? $prefix : null;
    }

    /** The canonical key a stored key belongs to. */
    public static function canonicalKeyOf(string $key, array $known): string
    {
        $locale = self::localeOf($key, $known);

        return $locale === null ? $key : substr($key, strlen($locale) + 1);
    }

    /**
     * Every translated key on a site, and whether it still matches its source.
     *
     * One query. A site with six languages and a few hundred keys is a few
     * thousand rows, and asking per key would be a few thousand queries on a
     * screen somebody opens to see a summary.
     *
     * @return array<int, array{key: string, locale: string, current: bool, translated: string}>
     */
    public static function statusFor(Site $site): array
    {
        $known = self::declaredLocales();
        $default = (string) config('live-edit.default_locale', 'en');

        $rows = SiteSetting::query()->where('site_id', $site->id)->get(['key', 'value', 'translated_from']);

        $canonical = [];
        $translated = [];

        foreach ($rows as $row) {
            $locale = self::localeOf((string) $row->key, $known);

            if ($locale === null || $locale === $default) {
                $canonical[(string) $row->key] = (string) $row->value;

                continue;
            }

            $translated[] = $row;
        }

        $status = [];

        foreach ($translated as $row) {
            $key = self::canonicalKeyOf((string) $row->key, $known);
            $source = $canonical[$key] ?? null;

            $status[] = [
                'key' => $key,
                'locale' => (string) self::localeOf((string) $row->key, $known),
                'translated' => (string) $row->value,
                /*
                 * A translation of a key whose canonical has never been stored
                 * counts as current. It is not evidence of staleness: the
                 * canonical words live in the template until somebody edits
                 * them, so there is nothing here that it could have gone out
                 * of step with. Calling it stale would put every translation
                 * on an untouched site under review on the day the feature
                 * shipped, which is how a warning gets ignored.
                 */
                'current' => $source === null
                    || $row->translated_from === null
                    || $row->translated_from === self::fingerprint($source),
            ];
        }

        return $status;
    }

    /**
     * What to tell somebody who has just changed the English.
     *
     * @return array<string, int> locale => how many of its translations are now stale
     */
    public static function needingReview(Site $site): array
    {
        $counts = [];

        foreach (self::statusFor($site) as $row) {
            if (! $row['current']) {
                $counts[$row['locale']] = ($counts[$row['locale']] ?? 0) + 1;
            }
        }

        arsort($counts);

        return $counts;
    }

    /** @return array<int, string> */
    public static function declaredLocales(): array
    {
        return array_keys((array) config('live-edit.locales', []));
    }
}
