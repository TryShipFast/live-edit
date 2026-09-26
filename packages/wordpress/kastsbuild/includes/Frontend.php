<?php

namespace KastsBuild;

/**
 * Handing the theme's page to the service and serving back what it returns.
 *
 * The tagging rules are the product, so this plugin does not own a copy of
 * them. It used to: the engine travelled inside the zip, which meant every
 * WordPress site was running whichever scanner it happened to have installed,
 * while the editor runtime beside it was fetched fresh on every page view. One
 * product at two speeds, and the slow half was the one deciding what a client
 * could edit. Now the page goes out and comes back ready, and improving the
 * scanner reaches every site at once, WordPress included.
 *
 * Parsing a whole document is not free and now costs a round trip as well, so
 * the finished page is cached against the published version. A publish moves
 * the version and every cached page falls away on its own — no purging, and
 * nothing to get wrong.
 */
class Frontend
{
    private const CACHE_PREFIX = 'kastsbuild_page_';

    public static function boot(): void
    {
        add_action('template_redirect', [self::class, 'start'], 1);
        add_action('wp_enqueue_scripts', [self::class, 'assets']);
    }

    public static function start(): void
    {
        if (! Settings::configured() || is_admin() || self::isFeed()) {
            return;
        }

        ob_start([self::class, 'render']);
    }

    /** Runs over the finished document, just before it is sent. */
    public static function render(string $html): string
    {
        if (stripos($html, '<html') === false) {
            // Not a page: a fragment, a redirect, an AJAX response. Left alone.
            return $html;
        }

        $editing = Session::viewerMayEdit();

        if (! $editing) {
            $cached = get_transient(self::cacheKey());

            if (is_string($cached) && $cached !== '') {
                return $cached;
            }
        }

        // The service prepares the page: it marks up what is editable and
        // puts the client's words in, in one answer.
        //
        // This plugin used to do both itself, from a copy of the engine inside
        // its own zip. The editor runtime beside it is fetched from the
        // service on every page view, so the half of the product that draws
        // the drawer was never more than a page load old while the half that
        // decides what is editable was frozen until somebody pressed update in
        // wp-admin. A scanner fix would reach a WordPress site weeks after
        // every other kind of site already had it — if the customer ever
        // updated at all.
        $prepared = Api::prepare($html, self::pagePath(), $editing);

        if ($prepared === null) {
            /*
             * The last page we were given for this address, however old.
             *
             * Falling back to the theme's own markup was the obvious thing and
             * the wrong one: it replaces every word the client has ever
             * written with the words the template shipped with. A visitor sees
             * a different website; the client sees their work gone. Serving
             * what we were told last time is wrong only by however much has
             * changed since, which on a site somebody edits occasionally is
             * usually nothing at all.
             *
             * Kept under an address-only key, deliberately outside the one
             * that carries the content stamp: that key is meant to fall away
             * the moment anything is published, and this copy exists precisely
             * for the times we cannot ask what the current stamp is.
             */
            $lastGood = get_transient(self::lastGoodKey());

            if (is_string($lastGood) && $lastGood !== '') {
                return $editing ? self::markBodyForEditing($lastGood) : $lastGood;
            }

            // Nothing to fall back to. The page is the point and the editor is
            // not, so the visitor gets the website.
            return $html;
        }

        $tagged = $prepared;

        if ($editing) {
            $tagged = self::markBodyForEditing($tagged);
        } else {
            set_transient(self::cacheKey(), $tagged, HOUR_IN_SECONDS * 6);
            // The copy of last resort, kept far longer than the ordinary page
            // cache, because its whole job is to still be there on the day the
            // service is not.
            set_transient(self::lastGoodKey(), $tagged, WEEK_IN_SECONDS);
        }

        return $tagged;
    }

    /** The last page the service gave us for this address, whatever its age. */
    private static function lastGoodKey(): string
    {
        return self::CACHE_PREFIX.'last_'.md5((string) ($_SERVER['REQUEST_URI'] ?? '/'));
    }

    /** Which page this is, so keys scoped to a page stay on it. */
    private static function pagePath(): string
    {
        $path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);

        return is_string($path) ? substr($path, 0, 200) : '/';
    }

    /**
     * Whether this page is one Elementor renders from its own store.
     *
     * Asked of the page rather than of the site: a site can be built with a
     * builder and still have pages that are not, and offering to reconcile a
     * store that does not exist would be a request per save for nothing.
     */
    private static function builtByElementor(): bool
    {
        $id = (int) get_queried_object_id();

        return $id > 0 && get_post_meta($id, '_elementor_data', true) !== '';
    }

    /** The attribute the editor looks for before it will start. */
    private static function markBodyForEditing(string $html): string
    {
        if (preg_match('/<body[^>]*\sdata-admin/i', $html)) {
            return $html;
        }

        return preg_replace('/<body(\s|>)/i', '<body data-admin$1', $html, 1) ?? $html;
    }

    public static function assets(): void
    {
        if (! Settings::configured() || ! Session::viewerMayEdit()) {
            return;
        }

        $session = Session::forCurrentUser();

        if ($session === null) {
            return;
        }

        $runtime = self::runtimeUrl();

        if ($runtime === null) {
            return;
        }

        // A module, because the editor is one — it imports its own chrome and
        // helpers — and modules are deferred, so this cannot block the page
        // the visitor came for.
        //
        // Loaded from the service rather than from this plugin. It used to be
        // three files copied into assets/ by hand, which is a version nobody
        // can update: they fell eight kilobytes and several fixes behind
        // without anyone noticing, so a WordPress site was running a broken
        // image editor and a save that never checked itself while every other
        // kind of site had both. A copy is the bug.
        wp_enqueue_script('kastsbuild-editor', $runtime, [], null, true);

        // The tag has to say so. wp_script_add_data('type', 'module') does not
        // do it: the script is emitted as an ordinary one, the browser reaches
        // the first import, and the whole editor dies with "Cannot use import
        // statement outside a module" — in the console, where nobody editing
        // their own website is looking.
        add_filter('script_loader_tag', [self::class, 'asModule'], 10, 3);

        wp_add_inline_script('kastsbuild-editor', sprintf(
            'window.liveEditApi = %s; window.liveEditPublishing = %s;',
            wp_json_encode([
                'base' => rtrim((string) Settings::get('api_base'), '/'),
                'site' => Settings::get('site'),
                // The short-lived one. The secret never leaves the server.
                'token' => $session,
                // Publishing is asked of this site, not of the content API:
                // the key a page holds cannot publish, and should not be able
                // to.
                'publishUrl' => rest_url('kastsbuild/v1/publish'),
                'publishHeaders' => ['X-WP-Nonce' => wp_create_nonce('wp_rest')],
                // Where to tell the page builder what changed, so its own copy
                // of the words stops disagreeing with the client's. Only sent
                // when there is a builder here to tell.
                'builderUrl' => self::builtByElementor() ? rest_url('kastsbuild/v1/builder') : null,
            ]),
            wp_json_encode([
                // Without this the editor has no Publish button at all, and
                // someone could save drafts indefinitely with no way to
                // release them — which is what happened before this existed.
                'pending' => Api::pending(),
                // WordPress has no signed preview link to offer, and a control
                // that does nothing is worse than one that is absent.
                'previewUrl' => null,
            ])
        ), 'before');
    }

    /**
     * Where the editor lives. One address, never asked about.
     *
     * This used to fetch a manifest to learn which build was current and keep
     * the answer for an hour. Both halves were wrong. The hour meant a fix
     * took up to an hour to reach a site, and — worse for anybody working on
     * it — the same edit looked unchanged in the browser long after it had
     * shipped, which sends you looking for a bug that is not there. And the
     * asking happened while a visitor's page was being assembled, so the site
     * waited on our service to render a page that did not need it.
     *
     * The service now resolves the current build itself, at an address that
     * never changes, and revalidates cheaply. Nothing to ask, nothing to
     * remember, nothing to go stale.
     */
    private static function runtimeUrl(): ?string
    {
        $base = rtrim((string) Settings::get('api_base'), '/');

        if ($base === '') {
            return null;
        }

        // The runtime is served from the host, beside the API rather than
        // inside it.
        return preg_replace('#/api/live-edit/v\\d+$#', '', $base).'/live-edit/runtime.js';
    }

    /**
     * Marks our own script as a module, and leaves every other one alone.
     *
     * The attribute is added to the existing tag rather than a new one being
     * built in its place. WordPress hands this filter everything it has
     * assembled for the handle — including the inline script registered
     * "before" it — so returning a fresh tag silently discards the
     * configuration the editor needs, and it starts up with nowhere to save
     * to. Nothing errors; it simply never works.
     */
    public static function asModule(string $tag, string $handle, string $src): string
    {
        if ($handle !== 'kastsbuild-editor' || str_contains($tag, 'type="module"')) {
            return $tag;
        }

        // Only the tag carrying a src: the inline ones around it are not ours
        // to change, and are not modules.
        return preg_replace('#<script(\s[^>]*\bsrc=)#', '<script type="module"$1', $tag, 1) ?? $tag;
    }

    public static function forgetCache(): void
    {
        global $wpdb;

        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
                '_transient_'.self::CACHE_PREFIX.'%',
                '_transient_timeout_'.self::CACHE_PREFIX.'%'
            )
        );
    }

    private static function cacheKey(): string
    {
        // The content stamp is part of the key, so any change invalidates
        // every cached page at once without anything having to go and delete
        // them — and without waiting for a timer that knows nothing about
        // whether the words moved.
        $url = (string) ($_SERVER['REQUEST_URI'] ?? '/');

        return self::CACHE_PREFIX.md5(Api::stamp().'|'.$url);
    }

    private static function isFeed(): bool
    {
        return is_feed() || is_robots() || (function_exists('is_favicon') && is_favicon());
    }
}
