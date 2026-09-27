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

        /*
         * How a section looks, kept here with everything else that is the
         * client's. It used to go to the service - the only part of their site
         * that still did - so a client changing a background colour wrote that
         * row into our database rather than their own.
         */
        register_rest_route('kastsbuild/v1', '/style', [
            'methods' => 'POST',
            'callback' => [self::class, 'style'],
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

        register_rest_route('kastsbuild/v1', '/versions', [
            'methods' => 'GET',
            'callback' => [self::class, 'versions'],
            'permission_callback' => $mayEdit,
        ]);

        /*
         * Putting an earlier version back.
         *
         * Answered here because the snapshots are here. Restoring through the
         * service would quietly rebuild the dependency that moving the words
         * into this site removed, and would restore from a copy that stopped
         * being updated the day this site took ownership.
         */
        register_rest_route('kastsbuild/v1', '/versions/(?P<id>\\d+)/restore', [
            'methods' => 'POST',
            'callback' => [self::class, 'restore'],
            'permission_callback' => $mayEdit,
        ]);
    }

    /** What this site has published, newest first. */
    public static function versions(): \WP_REST_Response
    {
        return new \WP_REST_Response([
            'current' => Content::versions(1)[0]['number'] ?? null,
            'versions' => Content::versions(),
        ]);
    }

    /** Put an earlier version back, keeping the current one to return to. */
    public static function restore(\WP_REST_Request $request): \WP_REST_Response
    {
        $who = wp_get_current_user();
        $restored = Content::restore(
            (int) $request['id'],
            (string) ($who->user_email ?: $who->display_name)
        );

        if ($restored === null) {
            return new \WP_REST_Response(['message' => 'There is no version with that number on this site.'], 404);
        }

        delete_transient('kastsbuild_stamp');
        self::forgetContentCaches();
        Frontend::forgetCache();

        return new \WP_REST_Response(['restored' => $restored]);
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

    /**
     * Save how one element looks, held back until somebody publishes.
     *
     * The properties are written as they arrive and checked on the way out
     * rather than here: the service puts every one of them through its style
     * policy before rendering any of it into a page. Keeping a second copy of
     * that policy in this plugin is exactly the staleness the prepare endpoint
     * exists to end, and a security rule is the worst thing to have two
     * versions of - the one in a zip is always the old one.
     *
     * What is checked here is structure: a name that is a name, a value short
     * enough to be one. That costs nothing and keeps obvious rubbish out of
     * the client's own table.
     */
    public static function style(\WP_REST_Request $request): \WP_REST_Response
    {
        $key = trim((string) $request->get_param('key'));

        if ($key === '' || ! preg_match('/^[A-Za-z0-9._-]{1,120}$/', $key)) {
            return new \WP_REST_Response(['message' => 'That change did not say what it was changing.'], 422);
        }

        $props = $request->get_param('props');
        $clean = [];

        foreach (is_array($props) ? $props : [] as $prop => $value) {
            if (is_string($prop) && preg_match('/^[A-Za-z]{1,40}$/', $prop)
                && (is_string($value) || is_numeric($value) || $value === null)
                && strlen((string) $value) <= 2000) {
                $clean[$prop] = (string) $value;
            }
        }

        // An empty set is how the editor says "put this back to the theme's
        // own styling", so it is saved as a draft rather than ignored - and
        // becomes a deletion when it is published.
        Styles::put($key, array_filter($clean, static fn ($value) => $value !== ''), true);

        return new \WP_REST_Response([
            'saved' => true,
            'key' => $key,
            'held' => true,
            'props' => $clean,
            'pending' => Content::pending(),
        ]);
    }

    /**
     * What is waiting to be published.
     *
     * Shaped the way the editor reads it - `before` and `after`, not `was` and
     * `value`. It was answering in names of its own, so the Changes tab could
     * name the element somebody had changed and could not show a word of what
     * they had changed it to. A list you cannot read is no safer than no list.
     */
    public static function changes(): \WP_REST_Response
    {
        return new \WP_REST_Response(Content::changes());
    }

    /**
     * Put a change back, or throw them all away.
     *
     * One route doing two jobs, told apart by whether a key came with the
     * request - which is the editor's own arrangement, and worth matching
     * exactly rather than reinterpreting: reading a revert as "discard
     * everything" is how somebody loses work they did not ask to lose.
     */
    public static function discard(\WP_REST_Request $request): \WP_REST_Response
    {
        $key = trim((string) $request->get_param('key'));

        if ($key !== '') {
            $reverted = ($request->get_param('kind') === 'style')
                ? Styles::revert($key)
                : Content::revert($key, (string) ($request->get_param('locale') ?? ''));

            return new \WP_REST_Response(['reverted' => $reverted > 0, 'pending' => Content::pending()]);
        }

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
