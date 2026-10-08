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
        if (! self::mayAskAnybody()) {
            return [];
        }

        /*
         * A cloud install asks the service first, and takes its answer.
         *
         * Checked rather than assumed: learnkasts is configured with a cloud
         * host and site and no LIVE_EDIT_SNAPSHOT_URL, which is the ordinary
         * shape - the install instructions never mention one. So the service
         * has to be asked at all, over the endpoint the browser runtime
         * already uses, with the same key, which is public by design and
         * printed into every page it edits.
         *
         * But asking it SECOND was the bug, and a worse one than not asking.
         * A snapshot is a copy of a publish, and Snapshot::url() falls back to
         * the configured disk's own address when no snapshot url is set - so
         * an install that published locally once, years of edits ago, still
         * has a reachable file. That file answered, it was non-empty, and it
         * won. Measured on learnkasts: the service had twenty-nine overrides
         * and the site served one, under a key the service has never heard of.
         * Every published change since was invisible, and nothing failed.
         *
         * The authority is whoever the words live with. A copy must never
         * outrank the thing it was a copy of.
         */
        if (WhereTheWordsLive::withTheService()) {
            $answer = self::fromTheService($locale);

            if ($answer !== []) {
                /*
                 * Reached the service, so its answer is the answer - empty
                 * included. A site that has published nothing has no
                 * overrides, and falling through to a stale snapshot here
                 * would put the old content back on exactly the sites that
                 * had just cleared it.
                 */
                return $answer['settings'] ?? [];
            }

            // Unreachable. Fall through rather than serve nothing, so a site
            // that does keep a snapshot still has its words.
        }

        $snapshot = self::snapshot($locale);

        if ($snapshot !== []) {
            return $snapshot['settings'] ?? [];
        }

        return self::fromTheService($locale)['settings'] ?? [];
    }

    /**
     * Whether a page render may go looking for content off this machine.
     *
     * Covers both addresses this class knows, which is the point: the snapshot
     * pointer is fetched before the service is asked, and gating only the
     * second one left a consumer's wildcard Http::fake still answering the
     * first. Measured, after fixing the obvious half and finding a request
     * still recorded.
     *
     * Unset means on, except while the host application is running its own
     * tests. Decided here rather than in the config file so it survives a
     * cached config and does not depend on how the host spells its test
     * environment.
     */
    protected static function mayAskAnybody(): bool
    {
        $asked = config('live-edit.remote_content');

        return $asked === null ? ! app()->runningUnitTests() : (bool) $asked;
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

                if (! $response->successful()) {
                    return [];
                }

                $body = $response->json();

                return self::looksLikeOurs($body) ? (array) $body : [];
            }
        );
    }

    /**
     * Whether a payload is one of ours, rather than merely a 200.
     *
     * Belt to the config switch's braces, and worth having on its own terms:
     * a client's published words are not "whatever JSON answered this
     * address". A host application's wildcard Http::fake, a captive portal, a
     * proxy's error page rendered as JSON - all of them answer successfully
     * and none of them is a client's content. Rewriting somebody's live page
     * with a stranger's payload is the one outcome here worse than serving the
     * theme's own words.
     *
     * Deliberately shallow: the shape our endpoint has always returned, and
     * nothing about what is inside. A stricter check would be a second place
     * to keep in step with the API.
     */
    protected static function looksLikeOurs(mixed $body): bool
    {
        return is_array($body)
            && array_key_exists('settings', $body)
            && is_array($body['settings']);
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
