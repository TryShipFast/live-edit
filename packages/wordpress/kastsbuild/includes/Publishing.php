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
        // WordPress's own answer to "may this person change this site", which
        // is the only place that question can honestly be answered.
        $mayEdit = fn () => Session::viewerMayEdit();

        register_rest_route('kastsbuild/v1', '/publish', [
            'methods' => 'POST',
            'callback' => [self::class, 'publish'],
            'permission_callback' => $mayEdit,
        ]);

        /*
         * The routes that read and write the client's words.
         *
         * Claimed by this site rather than left to the content service,
         * because the words are the customer's and live in their own
         * database. The editor is told about these in the page, and sends
         * them here instead.
         */
        register_rest_route('kastsbuild/v1', '/setting', [
            'methods' => 'POST',
            'callback' => [self::class, 'setting'],
            'permission_callback' => $mayEdit,
        ]);

        register_rest_route('kastsbuild/v1', '/changes', [
            'methods' => 'GET',
            'callback' => [self::class, 'changes'],
            'permission_callback' => $mayEdit,
        ]);

        register_rest_route('kastsbuild/v1', '/changes', [
            'methods' => 'DELETE',
            'callback' => [self::class, 'discard'],
            'permission_callback' => $mayEdit,
        ]);
    }

    /**
     * Save one value, held back until somebody publishes.
     *
     * Held by default and released together, so a client can correct three
     * sentences and have all three appear at once rather than the site
     * changing under its visitors as they type.
     */
    public static function setting(\WP_REST_Request $request): \WP_REST_Response
    {
        $key = trim((string) $request->get_param('key'));

        if ($key === '') {
            return new \WP_REST_Response(['message' => 'That change did not say what it was changing.'], 422);
        }

        $value = $request->get_param('value');

        Content::put(
            $key,
            $value === null ? null : (string) $value,
            ! $request->get_param('publish'),
            (string) ($request->get_param('locale') ?? '')
        );

        return new \WP_REST_Response(['saved' => true, 'pending' => Content::pending()]);
    }

    /** What is waiting to be published. */
    public static function changes(): \WP_REST_Response
    {
        $drafts = Content::drafted();
        $published = Content::published();

        return new \WP_REST_Response(['changes' => array_map(
            fn ($key, $value) => [
                'key' => $key,
                'value' => $value,
                'was' => $published[$key] ?? null,
            ],
            array_keys($drafts),
            $drafts
        )]);
    }

    /** Throw the held changes away, leaving the published page alone. */
    public static function discard(): \WP_REST_Response
    {
        return new \WP_REST_Response(['discarded' => Content::discard()]);
    }

    /**
     * Release the held changes.
     *
     * Done here, against this site's own tables. It used to ask the content
     * service, which is where the words were; they are the customer's and
     * they are here now, so publishing never leaves the building.
     */
    public static function publish(): \WP_REST_Response
    {
        $who = wp_get_current_user();
        $published = Content::publish((string) ($who->user_email ?: $who->display_name));

        // The page cache is keyed on a content stamp that is itself cached for
        // a few seconds. Publishing is the one moment nobody should wait: the
        // editor has just told the world to look.
        delete_transient('kastsbuild_stamp');
        self::forgetContentCaches();
        Frontend::forgetCache();

        return new \WP_REST_Response(['published' => $published]);
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
