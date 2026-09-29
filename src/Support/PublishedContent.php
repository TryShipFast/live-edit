<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Schema;
use ShipFast\LiveEdit\Models\ElementStyle;
use ShipFast\LiveEdit\Models\Version;
use Throwable;

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
        return self::orNothing(fn (): array => Snapshot::compose($locale)['settings'] ?? []);
    }

    /**
     * Read from the database, or decide there is nothing stored.
     *
     * **Installing this package must not be able to break a site.** That is
     * the whole of the reasoning, and it was learned the hard way: an
     * API-driven Laravel frontend installed the engine, its default
     * connection pointed at a SQLite file that had never existed on that
     * server, and the first request for `live_edit_settings` five-hundreded
     * every page on a live site. The application itself needed no database at
     * all; this package was the only thing that did.
     *
     * A site with no usable database has nothing stored, which is a perfectly
     * ordinary state and is exactly what a fresh install is. So it renders
     * the words already in its own templates, as it did before anybody
     * installed anything.
     *
     * `Schema::hasTable()` is not enough on its own and was what this had.
     * It answers the missing-table case and throws on the missing-connection
     * one, which is the case that took the site down.
     *
     * Reported rather than swallowed. Content that quietly stops appearing is
     * its own kind of outage, and for a site that genuinely does keep its
     * words here this is a fault to be told about - it simply must not be
     * told by taking the site off the internet.
     *
     * @template T
     * @param  callable(): T  $read
     * @return T|array{}
     */
    protected static function orNothing(callable $read): array
    {
        try {
            return $read();
        } catch (Throwable $e) {
            report($e);

            return [];
        }
    }

    /**
     * Published element styles.
     *
     * @return array<string, array<string, string>>
     */
    public static function styles(?string $locale = null): array
    {
        $snapshot = self::current($locale ?? app()->getLocale());

        return $snapshot['styles'] ?? self::orNothing(
            fn (): array => ElementStyle::query()->pluck('props', 'key')->all()
        );
    }

    /** The version being served, or null when nothing has been published. */
    public static function version(): ?int
    {
        // An installation upgrades the package before it runs the migration,
        // and for the time in between this asks for a table that is not there
        // yet. Every page five-hundreds if that is allowed to throw, so a
        // missing table means the same as nothing published.
        try {
            // On the model's OWN connection, not the application's default.
            // The two are the same until somebody sets a connection for this
            // package, and then checking the default would ask the wrong
            // database whether our table is there.
            $version = new Version;

            if (! Schema::connection($version->getConnectionName())->hasTable($version->getTable())) {
                return null;
            }

            $number = (int) Version::query()->max('number');
        } catch (Throwable $e) {
            // hasTable() needs a working connection to answer, so it throws
            // rather than returning false when there is no database at all.
            // That is the case that took a live site down.
            report($e);

            return null;
        }

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
