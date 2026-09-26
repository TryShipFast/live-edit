<?php

namespace KastsBuild;

/**
 * Talking to the content API.
 *
 * Uses WordPress's own HTTP layer rather than curl or Guzzle, so a site behind
 * a proxy, or one that has filtered outbound requests, behaves the way its
 * owner already configured it to.
 */
class Api
{
    public static function base(): string
    {
        return rtrim((string) Settings::get('api_base'), '/').'/'.Settings::get('site');
    }

    /**
     * Published content, cached until the version moves.
     *
     * @return array<string, string>
     */
    public static function content(bool $fresh = false): array
    {
        $key = 'kastsbuild_content_'.self::stamp();

        // Someone who has just saved must not be shown what everyone else is
        // being shown. Visitors can wait a few seconds for a change to reach
        // them; the person who made it cannot, because a page that does not
        // move after pressing save reads as a save that failed — and the next
        // thing they do is type it again.
        if (! $fresh) {
            $cached = get_transient($key);

            if (is_array($cached)) {
                return $cached;
            }
        }

        // An editor reads with their own session key, because only a
        // write-capable key is shown unpublished work. Reading with the
        // publishable key would hand the person who just saved the same page
        // every visitor gets — their words replaced by the published ones,
        // with nothing to say why.
        $key = $fresh ? (Session::forCurrentUser() ?? Settings::get('publishable_key')) : Settings::get('publishable_key');

        $body = self::get('/content', $key);
        $settings = is_array($body['settings'] ?? null) ? $body['settings'] : [];

        // Held for a long time because the key itself moves whenever the
        // content does; it is the stamp that is asked about often.
        set_transient($key, $settings, DAY_IN_SECONDS);

        return $settings;
    }

    /**
     * What the live content currently is, as a short token.
     *
     * Not the version number. A site with publishing turned off changes its
     * words without ever moving a version, so a cache keyed on the version
     * alone keeps serving yesterday's page until its own timer runs out —
     * which is the whole day for content, and six hours for a page. This moves
     * on every change, in either mode.
     *
     * Asked often, so it is cached for a few seconds: that interval is how
     * long an edit takes to appear for visitors.
     */
    public static function stamp(): string
    {
        $cached = get_transient('kastsbuild_stamp');

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $body = self::get('/content/version', Settings::get('publishable_key'));
        $stamp = (string) ($body['version'] ?? '0').'-'.(string) ($body['fingerprint'] ?? '');

        set_transient('kastsbuild_stamp', $stamp, 30);

        return $stamp;
    }

    /**
     * How many changes are waiting.
     *
     * Asked with the editor's own key, because the count of unpublished work
     * is only answered to someone allowed to see it.
     */
    public static function pending(): int
    {
        $key = Session::forCurrentUser();

        if ($key === null) {
            return 0;
        }

        return (int) (self::get('/content/version', $key)['pending'] ?? 0);
    }

    /**
     * Everybody whose photograph is on the published site.
     *
     * Asked with the publishable key, because this is what the credits page
     * shows the public, and cached: it changes only when somebody publishes a
     * new picture, and a credits page is read far more often than it changes.
     *
     * An empty list on failure. A credits page that cannot reach us should
     * say nothing rather than break the site it lives on.
     *
     * @return array<int, array<string, string|null>>
     */
    public static function attributions(): array
    {
        $cached = get_transient('kastsbuild_attributions');

        if (is_array($cached)) {
            return $cached;
        }

        $key = Settings::get('publishable_key');

        if (! is_string($key) || $key === '') {
            return [];
        }

        $found = self::get('/attributions', $key)['attributions'] ?? [];
        $found = is_array($found) ? $found : [];

        set_transient('kastsbuild_attributions', $found, 5 * MINUTE_IN_SECONDS);

        return $found;
    }

    /**
     * The page this theme just rendered, handed back ready to be edited.
     *
     * Marked up and carrying the client's words, in one answer. This plugin
     * used to do both halves itself out of a copy of the engine inside its own
     * zip, which meant a scanner improvement reached a WordPress site only
     * when somebody pressed update in wp-admin — while the editor runtime
     * beside it was refreshed on every page view. One product moving at two
     * speeds, with the slow half being the one that decides what is editable.
     *
     * An editor asks with their own session key, because only a write-capable
     * key is given unpublished work back. Asking with the publishable key
     * would hand the person who just saved the same page every visitor gets,
     * with nothing to say why.
     *
     * Returns null rather than a page when the service cannot be reached, so
     * the caller can serve the theme's own markup. Losing the editor for one
     * page view is a small thing; losing the website is not.
     */
    public static function prepare(string $html, string $page, bool $editing): ?string
    {
        $key = $editing
            ? (Session::forCurrentUser() ?? Settings::get('publishable_key'))
            : Settings::get('publishable_key');

        $body = self::post('/prepare', $key, ['html' => $html, 'page' => $page]);
        $prepared = $body['html'] ?? null;

        return is_string($prepared) && $prepared !== '' ? $prepared : null;
    }

    /** @return array<string, mixed> */
    public static function get(string $path, string $key): array
    {
        return self::request('GET', $path, $key);
    }

    /** @return array<string, mixed> */
    public static function post(string $path, string $key, array $body = []): array
    {
        return self::request('POST', $path, $key, $body);
    }

    /** @return array<string, mixed> */
    private static function request(string $method, string $path, string $key, array $body = []): array
    {
        if ($key === '' || Settings::get('site') === '') {
            return [];
        }

        $args = [
            'method' => $method,
            'timeout' => 5,
            'headers' => [
                'Authorization' => 'Bearer '.$key,
                'Accept' => 'application/json',
            ],
        ];

        if ($body !== []) {
            $args['headers']['Content-Type'] = 'application/json';
            $args['body'] = wp_json_encode($body);
        }

        // Asked again, because one dropped connection shows the theme's own
        // words for that page view — and to anybody reading it that is
        // indistinguishable from their work having been lost.
        //
        // Only what is worth asking again about: a 401 or 403 is a wrong key
        // and a 404 a wrong address, and neither improves by being repeated.
        // A dropped connection, a server error, a rate limit or a gateway
        // timeout all pass. Short waits, because a visitor is waiting on this
        // render — two retries cost at most half a second.
        foreach ([0, 200, 300] as $waitMs) {
            if ($waitMs > 0) {
                usleep($waitMs * 1000);
            }

            $response = wp_remote_request(self::base().$path, $args);

            if (is_wp_error($response)) {
                continue;
            }

            $code = wp_remote_retrieve_response_code($response);

            if ($code < 400) {
                $decoded = json_decode((string) wp_remote_retrieve_body($response), true);

                return is_array($decoded) ? $decoded : [];
            }

            if (! in_array($code, [408, 425, 429], true) && $code < 500) {
                // A wrong key or a wrong address. Asking again would only
                // hammer a service that has already given its answer.
                break;
            }
        }

        // A page must not fail because the content service is unreachable: the
        // theme's own words are still in the markup, so the visitor sees the
        // site rather than an error.
        return [];
    }
}
