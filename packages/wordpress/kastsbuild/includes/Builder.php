<?php

namespace KastsBuild;

/**
 * Telling the page builder what the client changed.
 *
 * A builder does not render from the markup; it renders from its own store. So
 * a page built with Elementor has two answers to "what does this heading say":
 * ours, and the one in _elementor_data. Ours wins on every page view — until
 * somebody opens the page in Elementor and presses Update, at which point the
 * builder regenerates from its copy and the client's words are gone. Weeks
 * later, by somebody who was not editing text at all and will never connect
 * the two.
 *
 * That cannot be solved from inside the page, and it does not have to be: the
 * builder's store is right here, in post meta, and it is ordinary JSON. When a
 * client changes a heading we change it there too, so the two answers agree
 * and it no longer matters which one is asked.
 *
 * Deliberately narrow. It replaces a string in a field that already exists, on
 * a widget type it recognises, and refuses everything else rather than
 * guessing — this is somebody's page structure, and the failure mode of
 * guessing is a page that will not open in the builder at all.
 */
class Builder
{
    /**
     * Which field holds the words, per widget.
     *
     * Only the ones whose text is plainly the widget's whole purpose. An
     * icon-box has two pieces of text and a form has a dozen; those need
     * knowing which one was edited, which the page cannot currently say.
     */
    private const FIELDS = [
        'heading' => 'title',
        'text-editor' => 'editor',
        'button' => 'text',
    ];

    public static function boot(): void
    {
        add_action('rest_api_init', [self::class, 'routes']);
    }

    public static function routes(): void
    {
        register_rest_route('kastsbuild/v1', '/builder', [
            'methods' => 'POST',
            'permission_callback' => fn () => current_user_can(Settings::capability()),
            'callback' => [self::class, 'sync'],
        ]);
    }

    /** @return \WP_REST_Response|\WP_Error */
    public static function sync(\WP_REST_Request $request)
    {
        $url = (string) $request->get_param('page');
        $elementId = (string) $request->get_param('element');
        $value = $request->get_param('value');

        if ($elementId === '' || ! is_string($value)) {
            return new \WP_Error('kastsbuild_bad_request', 'An element and a value are required.', ['status' => 400]);
        }

        $postId = self::pageAt($url);

        if ($postId === 0) {
            return new \WP_Error('kastsbuild_no_page', 'That address does not belong to a page here.', ['status' => 404]);
        }

        $stored = get_post_meta($postId, '_elementor_data', true);
        $tree = is_string($stored) ? json_decode($stored, true) : $stored;

        if (! is_array($tree)) {
            // Not a page the builder owns. Nothing to reconcile, and saying so
            // is better than pretending we did something.
            return new \WP_REST_Response(['synced' => false, 'reason' => 'not_built_here'], 200);
        }

        $changed = false;
        $tree = self::replaceIn($tree, $elementId, $value, $changed);

        if (! $changed) {
            return new \WP_REST_Response(['synced' => false, 'reason' => 'not_found_or_unsupported'], 200);
        }

        // wp_slash because update_post_meta unslashes, and this JSON is full of
        // quotes and backslashes that would be eaten one layer at a time until
        // the page no longer opens.
        update_post_meta($postId, '_elementor_data', wp_slash(wp_json_encode($tree)));

        // The builder keeps a generated stylesheet per page keyed on a version
        // it bumps itself. Left alone, a page whose text we changed can be
        // served from a cache built before the change.
        if (class_exists('\Elementor\Plugin')) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
        }

        return new \WP_REST_Response(['synced' => true, 'page' => $postId, 'element' => $elementId], 200);
    }

    /**
     * Which page lives at this address.
     *
     * url_to_postid answers 0 for the site's own root, because the front page
     * is a setting rather than a permalink — and get_queried_object_id is 0 in
     * a REST request, which has no query to have an object from. Between them
     * that meant the home page, the likeliest page anybody edits and usually
     * the one a template puts its hero on, was the one address this could not
     * resolve.
     */
    private static function pageAt(string $url): int
    {
        $path = trim((string) (parse_url($url, PHP_URL_PATH) ?: '/'), '/');

        if ($path === '') {
            return (int) get_option('page_on_front');
        }

        $id = url_to_postid($url);

        if ($id === 0) {
            // A path on its own, when the caller sent one rather than a whole
            // address.
            $id = url_to_postid(home_url($path));
        }

        return (int) $id;
    }

    /**
     * Walk the builder's tree and replace the words on one widget.
     *
     * By id, because that is what the rendered markup carries — the element a
     * client clicked sits inside a wrapper with data-id, and that id is the
     * same one used here.
     *
     * @param  array<int, array<string, mixed>>  $nodes
     * @return array<int, array<string, mixed>>
     */
    private static function replaceIn(array $nodes, string $elementId, string $value, bool &$changed): array
    {
        foreach ($nodes as $index => $node) {
            if (! is_array($node)) {
                continue;
            }

            if (($node['id'] ?? null) === $elementId && ($node['elType'] ?? '') === 'widget') {
                $field = self::FIELDS[$node['widgetType'] ?? ''] ?? null;

                // The field has to be there already. Adding one would be
                // inventing structure for a widget we do not really understand.
                if ($field !== null && isset($node['settings'][$field]) && is_string($node['settings'][$field])) {
                    $nodes[$index]['settings'][$field] = $value;
                    $changed = true;
                }

                continue;
            }

            if (isset($node['elements']) && is_array($node['elements'])) {
                $nodes[$index]['elements'] = self::replaceIn($node['elements'], $elementId, $value, $changed);
            }
        }

        return $nodes;
    }
}
