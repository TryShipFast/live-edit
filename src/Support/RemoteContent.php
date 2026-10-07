<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Published content fetched over HTTP.
 *
 * The same question PublishedContent answers from a disk, answered from an
 * address instead. That is the whole of what another framework needs: a build
 * or a server renderer asks for the current version and then for its locale,
 * and renders what comes back. Nothing about the editor has to exist on their
 * side.
 *
 * The pointer is the only thing that changes in place, so it is the only thing
 * worth re-reading often. A version file never changes, so once fetched it can
 * be held for as long as anyone likes.
 */
class RemoteContent
{
    /**
     * @return array<string, string>
     */
    public static function settings(?string $locale = null): array
    {
        $snapshot = self::snapshot($locale);

        if ($snapshot !== []) {
            return $snapshot['settings'] ?? [];
        }

        /*
         * A cloud install asks the service, because it has no snapshot to read.
         *
         * Checked rather than assumed: learnkasts is configured with a cloud
         * host and site and no LIVE_EDIT_SNAPSHOT_URL, which is the ordinary
         * shape - the install instructions never mention one. Everything above
         * would therefore return nothing on exactly the installs that most
         * need an answer, and the page would go out carrying the theme's own
         * words.
         *
         * The same endpoint the browser runtime already uses, with the same
         * key, which is public by design and printed into every page it edits.
         */
        return self::fromTheService($locale)['settings'] ?? [];
    }

    /**
     * Published content, asked of the service over its own API.
     *
     * Cached for the pointer's lifetime rather than against a version, because
     * the version only arrives with the answer: a page render costs one call
     * every remote_pointer_seconds, and a publish shows up within the same.
     *
     * @return array<string, mixed>
     */
    protected static function fromTheService(?string $locale = null): array
    {
        /*
         * The licence values, which already fall back to the cloud ones - a
         * site talking to the service named both, under whichever of the
         * accepted spellings it was installed with.
         */
        // ?: rather than config()'s own default, which only answers when the
        // key is absent - and both of these exist and are frequently null.
        $host = rtrim((string) (config('live-edit.licence.host') ?: config('live-edit.cloud.host')), '/');
        $site = (string) (config('live-edit.licence.site') ?: config('live-edit.cloud.site'));
        $key = (string) config('live-edit.licence.key');

        if ($host === '' || $site === '' || $key === '') {
            return [];
        }

        $locale ??= app()->getLocale();
        $ttl = (int) config('live-edit.remote_pointer_seconds', 30);

        return Cache::remember(
            "live-edit.service.{$site}.{$locale}",
            now()->addSeconds(max($ttl, 1)),
            function () use ($host, $site, $key, $locale): array {
                try {
                    $response = Http::withToken($key)
                        ->timeout((int) config('live-edit.remote_timeout', 5))
                        ->acceptJson()
                        ->get("{$host}/api/live-edit/v1/{$site}/content", ['locale' => $locale]);
                } catch (\Throwable) {
                    // A page must not fail because we are briefly unreachable.
                    // Nothing means no overrides, which is what this did before
                    // it asked at all.
                    return [];
                }

                return $response->successful() ? (array) $response->json() : [];
            }
        );
    }

    /**
     * @return array<string, array<string, string>>
     */
    public static function styles(?string $locale = null): array
    {
        return self::snapshot($locale)['styles'] ?? [];
    }

    /** The version being served, or null if the source cannot be reached. */
    public static function version(): ?int
    {
        $pointer = self::pointer();

        return isset($pointer['version']) ? (int) $pointer['version'] : null;
    }

    /** @return array<string, mixed> */
    protected static function snapshot(?string $locale): array
    {
        $locale ??= app()->getLocale();
        $version = self::version();

        if ($version === null) {
            return [];
        }

        // A version never changes once written, so this is cached until asked
        // to forget rather than for a guessed number of seconds.
        return Cache::remember(
            "live-edit.remote.v{$version}.{$locale}",
            now()->addDay(),
            fn () => self::fetch(Snapshot::url($version, $locale)) ?? []
        );
    }

    /** @return array<string, mixed> */
    protected static function pointer(): array
    {
        $ttl = (int) config('live-edit.remote_pointer_seconds', 30);

        return Cache::remember(
            'live-edit.remote.current',
            now()->addSeconds(max($ttl, 1)),
            fn () => self::fetch(Snapshot::url()) ?? []
        );
    }

    /** @return array<string, mixed>|null */
    protected static function fetch(?string $url): ?array
    {
        if ($url === null || $url === '') {
            return null;
        }

        try {
            $response = Http::timeout((int) config('live-edit.remote_timeout', 5))->get($url);
        } catch (\Throwable) {
            // A page should not fail because the content source is briefly
            // unreachable; the caller falls back to what it already had.
            return null;
        }

        return $response->successful() ? $response->json() : null;
    }
}
