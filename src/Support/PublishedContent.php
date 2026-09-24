<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Schema;
use ShipFast\LiveEdit\Models\ElementStyle;
use ShipFast\LiveEdit\Models\Version;

/**
 * What a visitor should be shown.
 *
 * The published state is read from the last snapshot rather than from the
 * database. That is not an optimisation for its own sake: it makes the read
 * path a file, which is the same shape a build, a server renderer or another
 * framework will use. Whatever serves a page ends up asking the same question
 * of the same artefact, so there is one answer to keep correct instead of one
 * per adapter.
 *
 * A site that has never published has no snapshot, so the database answers
 * instead and nothing changes for it.
 */
class PublishedContent
{
    /**
     * Published settings for a locale, already resolved against the default.
     *
     * @return array<string, string>
     */
    public static function settings(?string $locale = null): array
    {
        $locale ??= app()->getLocale();
        $snapshot = self::current($locale);

        if ($snapshot !== null) {
            return $snapshot['settings'] ?? [];
        }

        // Nothing published yet: compose the same shape from the database, so
        // the caller cannot tell which source answered.
        return Snapshot::compose($locale)['settings'] ?? [];
    }

    /**
     * Published element styles.
     *
     * @return array<string, array<string, string>>
     */
    public static function styles(?string $locale = null): array
    {
        $snapshot = self::current($locale ?? app()->getLocale());

        return $snapshot['styles'] ?? ElementStyle::query()->pluck('props', 'key')->all();
    }

    /** The version being served, or null when nothing has been published. */
    public static function version(): ?int
    {
        // An installation upgrades the package before it runs the migration,
        // and for the time in between this asks for a table that is not there
        // yet. Every page five-hundreds if that is allowed to throw, so a
        // missing table means the same as nothing published.
        if (! Schema::hasTable((new Version)->getTable())) {
            return null;
        }

        $number = (int) Version::query()->max('number');

        return $number > 0 ? $number : null;
    }

    /** @return array<string, mixed>|null */
    protected static function current(string $locale): ?array
    {
        $number = self::version();
        if ($number === null) {
            return null;
        }

        // A locale with no file of its own falls back to the default's, which
        // already carries every untranslated value.
        return Snapshot::read($number, $locale) ?? Snapshot::read($number);
    }
}
