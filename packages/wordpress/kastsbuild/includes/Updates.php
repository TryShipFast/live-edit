<?php

namespace KastsBuild;

/**
 * Telling WordPress that a newer plugin exists.
 *
 * Without this there was no route by which a fix reached a customer. WordPress
 * offers an update only when something claims one is available, and nothing
 * did: a site that installed this in August would still be running August's
 * copy today, and next year. Every release in between reached a WordPress
 * customer only if they happened to return to the console, download the zip
 * again and upload it by hand, having never been told there was a reason to.
 *
 * Which is the worst state a fix can be in - released, believed shipped, and
 * sitting on a shelf. The bug that refused every edit inside a list would have
 * been in exactly that state on every WordPress site we have.
 *
 * Hooks into the machinery WordPress already has rather than inventing an
 * updater: the site's own update screen, its own scheduled check, its own
 * "update now" button, and its own automatic updates if the owner has them on.
 */
class Updates
{
    /** How long an answer is kept, so this asks on WordPress's schedule and not on every screen. */
    private const HOURS = 6;

    public static function boot(): void
    {
        add_filter('pre_set_site_transient_update_plugins', [self::class, 'offer']);
        add_filter('plugins_api', [self::class, 'details'], 10, 3);
        add_filter('http_request_args', [self::class, 'carryTheKey'], 10, 2);
        add_action('kastsbuild_forget_the_update_check', [self::class, 'forget']);
    }

    /** This plugin's file, as WordPress names it: "kastsbuild/kastsbuild.php". */
    private static function file(): string
    {
        return basename(dirname(__DIR__)).'/'.basename(dirname(__DIR__)).'.php';
    }

    private static function installed(): string
    {
        if (! function_exists('get_plugin_data')) {
            require_once ABSPATH.'wp-admin/includes/plugin.php';
        }

        $data = get_plugin_data(dirname(__DIR__).'/'.basename(dirname(__DIR__)).'.php', false, false);

        return (string) ($data['Version'] ?? '0.0.0');
    }

    /**
     * What the service says the newest plugin is.
     *
     * Cached, and cached on failure too. A site whose key has lapsed, or which
     * cannot reach us at all, must not ask again on every single admin screen
     * load - the update check runs inside page rendering, and a slow or dead
     * endpoint asked repeatedly is a slow dashboard, which is a fault the
     * owner will blame on the plugin and be right to.
     */
    private static function latest(): ?array
    {
        $held = get_transient('kastsbuild_update');

        if (is_array($held)) {
            return $held['version'] ?? null ? $held : null;
        }

        $answer = Api::probe('/plugin', (string) Settings::get('publishable_key'));
        $said = is_array($answer['data'] ?? null) ? $answer['data'] : [];

        // Only a 200 counts. A 401 from a lapsed key and a 404 from a service
        // being redeployed both come back with a body of some shape, and
        // treating either as "no newer version" is right while treating it as
        // an answer worth caching for six hours is not.
        $found = ($answer['status'] ?? null) === 200 && isset($said['version'])
            ? $said
            : ['version' => null];

        set_transient('kastsbuild_update', $found, self::HOURS * HOUR_IN_SECONDS);

        return $found['version'] ? $found : null;
    }

    /**
     * Put the update in front of the site owner.
     *
     * The transient is what the plugins screen reads. Adding to it is the
     * whole of "there is an update", and removing ourselves when there is not
     * matters just as much: a stale entry shows an update that installing
     * cannot clear, and the row never stops asking.
     */
    public static function offer($transient)
    {
        if (! is_object($transient)) {
            return $transient;
        }

        $file = self::file();
        $latest = self::latest();

        if ($latest === null) {
            unset($transient->response[$file]);

            return $transient;
        }

        $new = (string) $latest['version'];
        $now = self::installed();

        if (version_compare($new, $now, '<=')) {
            // Said out loud rather than left absent, because WordPress shows
            // "you have the latest" from this list and a plugin missing from
            // both lists simply looks unchecked.
            $transient->no_update[$file] = self::describe($new, $latest);

            unset($transient->response[$file]);

            return $transient;
        }

        $transient->response[$file] = self::describe($new, $latest);

        return $transient;
    }

    private static function describe(string $version, array $latest): object
    {
        return (object) [
            'slug' => basename(dirname(__DIR__)),
            'plugin' => self::file(),
            'new_version' => $version,
            'url' => 'https://tryshipfast.com',
            'package' => (string) ($latest['download_url'] ?? ''),
            'requires_php' => (string) ($latest['requires_php'] ?? ''),
            'icons' => [],
        ];
    }

    /**
     * The "View details" panel, so pressing it does not show an error.
     *
     * WordPress asks wordpress.org about any plugin whose details are wanted,
     * and this plugin is not there - so without answering here, the link on
     * the update row opens a failure. A small thing that makes the update look
     * broken at the moment somebody is deciding whether to trust it.
     */
    public static function details($result, $action, $args)
    {
        if ($action !== 'plugin_information' || ($args->slug ?? '') !== basename(dirname(__DIR__))) {
            return $result;
        }

        $latest = self::latest();

        if ($latest === null) {
            return $result;
        }

        return (object) [
            'name' => 'ShipFast Live Edit',
            'slug' => $args->slug,
            'version' => (string) $latest['version'],
            'author' => '<a href="https://tryshipfast.com">ShipFast</a>',
            'homepage' => 'https://tryshipfast.com',
            'requires_php' => (string) ($latest['requires_php'] ?? ''),
            'download_link' => (string) ($latest['download_url'] ?? ''),
            'sections' => [
                'description' => 'Edit the words and pictures on this site in place, without a dashboard.',
            ],
        ];
    }

    /**
     * Send the key when WordPress fetches the update itself.
     *
     * The download is behind a key, and the request for it is made by
     * WordPress rather than by our code - so there is no other moment to
     * attach one. In a header, never in the address: an update URL is written
     * into logs on both sides and kept in the site's own update history, and a
     * key in a query string would be sitting in all of them.
     */
    public static function carryTheKey($args, $url)
    {
        $download = (string) (self::latest()['download_url'] ?? '');

        if ($download === '' || strpos((string) $url, $download) !== 0) {
            return $args;
        }

        $args['headers'] = array_merge(
            is_array($args['headers'] ?? null) ? $args['headers'] : [],
            ['Authorization' => 'Bearer '.Settings::get('publishable_key')]
        );

        return $args;
    }

    /** Forget what we were told, so the next check asks again. */
    public static function forget(): void
    {
        delete_transient('kastsbuild_update');
    }
}
