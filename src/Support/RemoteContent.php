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
        return self::snapshot($locale)['settings'] ?? [];
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
