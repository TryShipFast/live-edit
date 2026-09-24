<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Models\ElementStyle;
use ShipFast\LiveEdit\Models\Version;

/**
 * Writes what was published as a file that never changes again.
 *
 * A site's content is read far more often than it is written, and reading it
 * through the application makes every page load depend on the application being
 * up and quick. A snapshot is a plain file: a build, a server renderer or a CDN
 * can take it without asking anything, and if this application is down the last
 * publish keeps serving.
 *
 * It also makes history cheap. Each publish is a new file, so going back is
 * repointing rather than unpicking, and two versions can simply be compared.
 *
 * The disk is configurable, so this is local today and S3 behind a CDN later
 * with nothing here changing.
 */
class Snapshot
{
    /**
     * Compose and store the current published content as the next version.
     */
    public static function publish(int $changes = 0, ?int $restoredFrom = null): Version
    {
        $number = (int) Version::query()->max('number') + 1;
        $locales = [];

        foreach (self::locales() as $locale) {
            $values = self::compose($locale);
            self::write(self::path($number, $locale), $values);
            $locales[$locale] = count($values['settings'] ?? []);
        }

        $version = Version::query()->create([
            'number' => $number,
            'locales' => $locales,
            'changes' => $changes,
            'restored_from' => $restoredFrom,
            'published_by' => optional(auth()->user())->getAuthIdentifier(),
        ]);

        // The pointer is the only thing that changes in place, so a cache in
        // front of the snapshots only ever has one object to invalidate.
        self::write(self::directory().'/current.json', [
            'version' => $number,
            'locales' => array_keys($locales),
            'published_at' => $version->created_at?->toIso8601String(),
        ]);

        return $version;
    }

    /**
     * The content of one locale, with anything untranslated already filled in
     * from the default.
     *
     * Resolved here rather than by whoever reads it: every adapter would
     * otherwise reimplement the fallback, slightly differently, and a missing
     * translation would show as a blank on somebody's live page.
     *
     * @return array{settings: array<string, string>, styles: array<string, mixed>}
     */
    public static function compose(string $locale): array
    {
        $default = config('live-edit.default_locale', 'en');
        $model = config('live-edit.setting_model');
        $rows = $model::query()->pluck('value', 'key');

        $base = [];
        $translated = [];

        $known = self::locales();

        foreach ($rows as $key => $value) {
            // "fr:heroTitle" belongs to French; anything unprefixed is the
            // default locale's, which is also everyone else's fallback.
            //
            // The prefix has to be a locale the site actually declares. Taking
            // any prefix read "auto:1a2b3c" — the scanner's own keys — as a
            // language called "auto" and dropped every one of them.
            [$prefix, $rest] = array_pad(explode(':', (string) $key, 2), 2, null);
            if ($rest !== null && $prefix !== $default && in_array($prefix, $known, true)) {
                if ($prefix === $locale) {
                    $translated[$rest] = (string) $value;
                }

                continue;
            }

            $base[$key] = (string) $value;
        }

        return [
            'settings' => array_merge($base, $translated),
            'styles' => ElementStyle::query()->pluck('props', 'key')->all(),
        ];
    }

    /** Read a stored version back, for previewing or restoring it. */
    public static function read(int $number, ?string $locale = null): ?array
    {
        $locale ??= config('live-edit.default_locale', 'en');
        $path = self::path($number, $locale);

        if (! self::disk()->exists($path)) {
            return null;
        }

        return json_decode((string) self::disk()->get($path), true);
    }

    /**
     * Where a published file can be fetched from.
     *
     * A consumer that is not this application — a build, a server renderer,
     * another framework — needs an address rather than a disk. Set
     * snapshot_url to a CDN in front of the bucket and nothing else changes.
     */
    /**
     * Where a published file can be fetched from.
     *
     * The path is the key; this is the only place it becomes an address, and
     * the address is never written back into storage.
     */
    public static function url(?int $number = null, ?string $locale = null): ?string
    {
        $relative = $number === null
            ? 'current.json'
            : 'v'.$number.'/'.($locale ?? config('live-edit.default_locale', 'en')).'.json';

        return SnapshotUrl::for($relative);
    }

    /** @return array<int, string> */
    protected static function locales(): array
    {
        $configured = array_keys(config('live-edit.locales', []));
        $default = config('live-edit.default_locale', 'en');

        return $configured === [] ? [$default] : $configured;
    }

    protected static function path(int $number, string $locale): string
    {
        return self::directory()."/v{$number}/{$locale}.json";
    }

    protected static function directory(): string
    {
        return trim(config('live-edit.snapshot_directory', 'live-edit/content'), '/');
    }

    protected static function disk()
    {
        return Storage::disk(config('live-edit.snapshot_disk', config('live-edit.disk', 'local')));
    }

    protected static function write(string $path, array $payload): void
    {
        self::disk()->put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }
}
