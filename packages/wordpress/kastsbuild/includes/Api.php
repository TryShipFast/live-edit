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

        $response = wp_remote_request(self::base().$path, $args);

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) >= 400) {
            // A page must not fail because the content service is briefly
            // unreachable: the theme's own words are still in the markup, so
            // the visitor sees the site rather than an error.
            return [];
        }

        $decoded = json_decode((string) wp_remote_retrieve_body($response), true);

        return is_array($decoded) ? $decoded : [];
    }
}
