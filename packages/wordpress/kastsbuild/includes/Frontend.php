<?php

namespace KastsBuild;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * Tagging the rendered page and putting published words into it.
 *
 * The theme's markup is buffered and run through the same scanner every other
 * adapter uses, rather than a WordPress-shaped reimplementation. That is worth
 * insisting on: the tagging rules are the product, and a second copy of them
 * would drift, quietly, in a way nobody would notice until a client's edits
 * landed on the wrong element.
 *
 * Parsing a whole document is not free, so the finished page is cached against
 * the published version. A publish moves the version and every cached page
 * falls away on its own — no purging, and nothing to get wrong.
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

        $scanner = new MarkupScanner;

        // auto: true — keys are derived from the content itself, so nothing
        // has to be declared for a theme this plugin has never seen.
        $result = $scanner->apply($html, ['text', 'image', 'link', 'icon'], true);
        $tagged = is_array($result) ? ($result['html'] ?? $html) : $html;

        $content = Api::content($editing);

        if ($content !== []) {
            // Bare keys. The attribute is written as "setting:auto:abc" but
            // the lookup happens after that prefix is stripped, and adding it
            // here would mean nothing ever matched — the page would tag
            // correctly and then show the theme's original words forever.
            $tagged = $scanner->applyOverrides($tagged, $content);
        }

        if ($editing) {
            $tagged = self::untagAdminBar($tagged);
            $tagged = self::markBodyForEditing($tagged);
        } else {
            set_transient(self::cacheKey(), $tagged, HOUR_IN_SECONDS * 6);
        }

        return $tagged;
    }

    /**
     * WordPress's own toolbar is not this site's content.
     *
     * It is only in the page for signed-in users, which is exactly who is
     * editing — so left alone it is the majority of what the editor offers.
     * Someone would be invited to reword "Howdy", change it, and find nothing
     * had happened to their website, because no visitor ever sees that markup.
     *
     * Only done while editing: a visitor's page has no toolbar in it, so there
     * is nothing to strip and no reason to parse the document again.
     */
    private static function untagAdminBar(string $html): string
    {
        if (stripos($html, 'id="wpadminbar"') === false) {
            return $html;
        }

        $doc = new \DOMDocument;
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $xpath = new \DOMXPath($doc);
        $nodes = $xpath->query('//*[@id="wpadminbar"]//*[@*[starts-with(name(), "data-edit")]] | //*[@id="wpadminbar"]');

        foreach ($nodes as $node) {
            if (! $node instanceof \DOMElement) {
                continue;
            }

            foreach (iterator_to_array($node->attributes) as $attribute) {
                if (str_starts_with($attribute->name, 'data-edit')) {
                    $node->removeAttribute($attribute->name);
                }
            }
        }

        $out = $doc->saveHTML();

        return is_string($out) ? $out : $html;
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
     * Where the current editor lives, asked of the service and remembered for
     * an hour.
     *
     * The address carries the version, so the browser may keep the files for
     * a year and still get a fix the moment one ships — that is the whole
     * point of asking rather than guessing. An hour is short enough that a
     * release reaches editors the same morning and long enough that this is
     * not a request per page view.
     *
     * Returns null when the service cannot be reached, and the editor simply
     * does not appear. There is nothing useful it could do anyway: the content
     * it edits lives there too.
     */
    private static function runtimeUrl(): ?string
    {
        $cached = get_transient('kastsbuild_runtime_url');

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $base = rtrim((string) Settings::get('api_base'), '/');

        if ($base === '') {
            return null;
        }

        // The runtime is served from the host, beside the API rather than
        // inside it.
        $host = preg_replace('#/api/live-edit/v\d+$#', '', $base);

        $response = wp_remote_get($host.'/live-edit/runtime.json', ['timeout' => 5]);

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return null;
        }

        $body = json_decode((string) wp_remote_retrieve_body($response), true);
        $assets = is_array($body) ? ($body['assets'] ?? null) : null;

        if (! is_string($assets) || $assets === '') {
            return null;
        }

        $url = $assets.'/live-edit.js';
        set_transient('kastsbuild_runtime_url', $url, HOUR_IN_SECONDS);

        return $url;
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
