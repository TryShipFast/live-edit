<?php

namespace KastsBuild;

/**
 * Releasing held changes, decided here rather than in the browser.
 *
 * The key a page holds can write drafts and deliberately cannot publish:
 * deciding what the public sees is not something to hand to a browser, where
 * anyone who opens the source can read the credential. So the editor asks this
 * site instead, WordPress says whether this user may, and the secret key —
 * which never leaves the server — does the publishing.
 */
class Publishing
{
    public static function boot(): void
    {
        add_action('rest_api_init', [self::class, 'route']);
    }

    public static function route(): void
    {
        register_rest_route('kastsbuild/v1', '/publish', [
            'methods' => 'POST',
            'callback' => [self::class, 'publish'],
            // WordPress's own answer to "may this person publish this site",
            // which is the only place that question can honestly be answered.
            'permission_callback' => fn () => Session::viewerMayEdit(),
        ]);
    }

    public static function publish(): \WP_REST_Response
    {
        $result = Api::post('/publish', (string) Settings::get('secret_key'));

        if (! array_key_exists('published', $result)) {
            return new \WP_REST_Response([
                'message' => 'The content service did not accept that. Check the secret key in Settings → Live Edit.',
            ], 502);
        }

        // The page cache is keyed on a content stamp that is itself cached for
        // a few seconds. Publishing is the one moment nobody should wait: the
        // editor has just told the world to look.
        delete_transient('kastsbuild_stamp');
        self::forgetContentCaches();
        Frontend::forgetCache();

        return new \WP_REST_Response(['published' => (int) $result['published']]);
    }

    private static function forgetContentCaches(): void
    {
        global $wpdb;

        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
                '_transient_kastsbuild_content_%',
                '_transient_timeout_kastsbuild_content_%'
            )
        );
    }
}
