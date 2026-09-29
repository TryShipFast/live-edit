<?php

namespace KastsBuild;

/**
 * The client's pictures, in their own media library.
 *
 * Stage one moved the words and stage two moved their history. This is the
 * third thing a site owner would reasonably assume was theirs and was not:
 * every picture a client uploaded through the editor went to our bucket and
 * stayed there, and the page pointed at an address on our domain. The library
 * in wp-admin - the one place they would go to look for their own photographs -
 * never heard about any of them.
 *
 * What that costs is not theoretical. The pictures are invisible to everything
 * WordPress does with pictures: the library grid, the block editor, srcset,
 * `wp db export`, any backup plugin, any CDN the host has configured. And on
 * the day the licence lapses the words survive in their database while the
 * photographs, still served from us, do not.
 *
 * So uploads go through WordPress's own upload handling and become real
 * attachments. That gives us its type checking, its uploads directory, its
 * generated sizes, and a row in the library the client can find.
 *
 * The original is kept whole. The page is pointed at a derivative fitted to the
 * box in the design, registered against the attachment so WordPress deletes it
 * along with everything else when the picture is deleted. The service's own
 * path cannot do this - it has only the one file - and this is the better
 * answer: it keeps the client's untouched photograph.
 */
class Media
{
    /** The suffix on the copy we make for the box a picture was dropped into. */
    private const FITTED = 'kastsbuild-fit';

    /** The fitted copies belonging to an attachment, so they can be removed. */
    private const FITS_META = '_kastsbuild_fits';

    /**
     * How many image pixels per CSS pixel of the box, never an upscale.
     *
     * The same number, and the same reasoning, as the service's ImageFitter:
     * the box is measured in the browser in CSS pixels and the screens that
     * matter draw two device pixels for each one. Fitted exactly, a replacement
     * looks soft beside the template's own photographs.
     */
    private const DENSITY = 2;

    /** Who uploaded it, when they have no WordPress account of their own. */
    private const EDITOR_META = '_kastsbuild_uploaded_by';

    public static function boot(): void
    {
        add_action('rest_api_init', [self::class, 'route']);

        /*
         * Take the fitted copies with the picture when it is deleted.
         *
         * Deliberately our own hook rather than an entry in the attachment's
         * sizes metadata, which is where this started. WordPress rebuilds that
         * list from the sizes a theme has registered, and ours cannot be one of
         * those - its dimensions come from a box on a page. So any plugin that
         * regenerates thumbnails would have dropped it from the metadata and
         * deleted the file, leaving the page pointing at a 404. Kept as our own
         * bookkeeping it survives that, and this hook still means an uploads
         * directory does not grow forever.
         */
        add_action('delete_attachment', [self::class, 'forget']);
    }

    /** Remove the fitted copies of a picture being deleted. */
    public static function forget(int $id): void
    {
        $fits = get_post_meta($id, self::FITS_META, true);
        $original = get_attached_file($id, true);

        if (! is_array($fits) || ! is_string($original) || $original === '') {
            return;
        }

        foreach ($fits as $name) {
            $path = dirname($original).'/'.basename((string) $name);

            if (is_file($path)) {
                wp_delete_file($path);
            }
        }
    }

    public static function route(): void
    {
        $mayEdit = fn () => Session::mayEditOrWhyNot();

        /*
         * Both shapes the editor sends: a bare file, wanting an address back
         * for a field the person is filling in, and a picture edit naming the
         * setting it belongs to.
         *
         * Permission is the live-edit session, not WordPress's `upload_files`.
         * A client editing their own site may have no WordPress account at all
         * - that is measured and deliberate - so requiring the capability here
         * would refuse exactly the person the product is for. What guards the
         * uploads directory instead is that the session is checked, and that
         * WordPress decides what a file may be.
         */
        register_rest_route('kastsbuild/v1', '/media', [
            'methods' => 'POST',
            'callback' => [self::class, 'store'],
            'permission_callback' => $mayEdit,
        ]);
    }

    public static function store(\WP_REST_Request $request): \WP_REST_Response
    {
        $files = $request->get_file_params();
        $target = trim((string) $request->get_param('target'));
        $box = self::box($request);

        $uploaded = null;

        if (isset($files['file']) && ($files['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            $uploaded = self::keep($files['file'], $box[0], $box[1]);

            if (is_wp_error($uploaded)) {
                return self::refuse($uploaded->get_error_message());
            }
        }

        // No target: the caller wants an address for a field it is holding, and
        // will save it itself.
        if ($target === '') {
            return $uploaded === null
                ? self::refuse('Choose a file to upload.')
                : new \WP_REST_Response($uploaded);
        }

        $key = self::settingKey($target);

        if ($key === null) {
            return self::refuse('Editing that from the editor is not supported on WordPress.');
        }

        $url = trim((string) $request->get_param('url'));
        $removing = filter_var($request->get_param('remove'), FILTER_VALIDATE_BOOLEAN);

        $value = match (true) {
            $removing => '',
            $uploaded !== null => $uploaded['url'],
            $url !== '' => self::addressOrNothing($url),
            default => null,
        };

        if ($value === null && ! self::sent($request, 'alt') && ! self::sent($request, 'imgTitle')) {
            return self::refuse('Choose a file from your computer, paste an image URL, or edit the text attributes.');
        }

        if ($value === false) {
            return self::refuse('That does not look like an image address.');
        }

        if ($value !== null) {
            Content::put($key, $value, true);

            /*
             * The new picture's own source list, or none at all. Never the
             * previous picture's.
             *
             * This has to be written on every change of picture rather than
             * only when there is a list, because a source list outranks src:
             * one left behind from the picture before would keep showing the
             * photograph that was just replaced, on every screen it covers.
             * That exact fault is recorded in LIMITATIONS.md as the appliers
             * failing to clear the theme's, and leaving a stale one here
             * would be the same fault reintroduced from the other end.
             *
             * A pasted address and a removal both land here with nothing,
             * which is correct: we did not make those files and know no sizes
             * for them.
             */
            Content::put($key.'Srcset', (string) ($uploaded['srcset'] ?? ''), true);
        }

        // Beside the picture, under the names the page already reads them by,
        // so a theme needs no arrangement with this. The same suffixes the
        // service writes, because the page asking for them is the same page.
        $beside = [
            'alt' => 'Alt',
            'imgTitle' => 'Title',
            'credit' => 'Credit',
            'creditBy' => 'CreditBy',
            'creditUrl' => 'CreditUrl',
            'creditSource' => 'CreditSource',
            'creditSourceUrl' => 'CreditSourceUrl',
        ];

        foreach ($beside as $field => $suffix) {
            if (self::sent($request, $field)) {
                Content::put($key.$suffix, (string) $request->get_param($field), true);
            }
        }

        /*
         * A new picture with no credit clears the old one.
         *
         * The previous photographer's name under somebody else's photograph is
         * worse than no name at all: no name is a gap, and the wrong name is a
         * false statement about who took it, made on the client's behalf.
         */
        if ($value !== null && ! self::sent($request, 'credit')) {
            foreach (['Credit', 'CreditBy', 'CreditUrl', 'CreditSource', 'CreditSourceUrl'] as $suffix) {
                Content::put($key.$suffix, '', true);
            }
        }

        return new \WP_REST_Response([
            'saved' => true,
            'key' => $key,
            'url' => $value,
            'pending' => Content::pending(),
        ]);
    }

    /**
     * Put an uploaded file into the library and answer with the address the
     * page should use.
     *
     * @param  array<string, mixed>  $file
     * @return array{url: string, id: int}|\WP_Error
     */
    private static function keep(array $file, ?int $fitWidth, ?int $fitHeight)
    {
        require_once ABSPATH.'wp-admin/includes/file.php';
        require_once ABSPATH.'wp-admin/includes/image.php';

        // test_form off because this arrives as a REST request with a nonce
        // already checked, not as a wp-admin form post with its own hidden
        // fields. Everything else - the type check, the uploads directory, the
        // unique filename - is WordPress's and stays WordPress's.
        $landed = wp_handle_upload($file, ['test_form' => false]);

        if (! is_array($landed) || isset($landed['error'])) {
            return new \WP_Error('kastsbuild_upload', (string) ($landed['error'] ?? 'That file could not be saved.'));
        }

        $id = wp_insert_attachment([
            'post_mime_type' => $landed['type'],
            'post_title' => sanitize_text_field(pathinfo((string) $landed['file'], PATHINFO_FILENAME)),
            'post_content' => '',
            'post_status' => 'inherit',
        ], $landed['file']);

        if (is_wp_error($id) || $id === 0) {
            return new \WP_Error('kastsbuild_upload', 'That file was saved but could not be added to the library.');
        }

        wp_update_attachment_metadata($id, wp_generate_attachment_metadata($id, $landed['file']));

        // Provenance for a picture whose uploader has no WordPress user row to
        // be the author of it. Without this the library shows an owner of
        // "(none)" and nobody can tell where the file came from.
        $who = self::uploader();

        if ($who !== '') {
            update_post_meta($id, self::EDITOR_META, $who);
        }

        $fitted = $fitWidth && $fitHeight
            ? self::fit($id, (string) $landed['file'], $fitWidth, $fitHeight)
            : null;

        return [
            'url' => $fitted['url'] ?? (string) $landed['url'],
            'srcset' => $fitted['srcset'] ?? '',
            'id' => (int) $id,
        ];
    }

    /**
     * Make a copy shaped to the box in the design, and register it.
     *
     * A client replacing a photograph in a bought template rarely has one the
     * right shape, and dropped in as-is a tall portrait where a wide banner was
     * stretches the section and the design they paid for is gone. So it is
     * scaled to cover the box and cropped from the middle: same space exactly,
     * proportions kept, and only the edges lost.
     *
     * Recorded against the attachment, so deleting the picture in wp-admin
     * takes this with it - see forget(). A stray file nothing knows about is
     * how an uploads directory grows forever.
     */
    private static function fit(int $id, string $file, int $width, int $height): ?array
    {
        $probe = wp_get_image_editor($file);

        if (is_wp_error($probe)) {
            // Not a type WordPress can process - an SVG, most likely. The
            // original is correct and already in the library; it simply cannot
            // be cropped.
            return null;
        }

        $size = $probe->get_size();
        $sourceWidth = (int) ($size['width'] ?? 0);
        $sourceHeight = (int) ($size['height'] ?? 0);

        if ($sourceWidth < 1 || $sourceHeight < 1) {
            return null;
        }

        $density = max(1.0, min(
            (float) self::DENSITY,
            $sourceWidth / max($width, 1),
            $sourceHeight / max($height, 1)
        ));

        $topWidth = (int) round($width * $density);
        $topHeight = (int) round($height * $density);

        // Already the right shape and no bigger than we would make it: the
        // original is the best answer and a second identical file is waste.
        if ($sourceWidth === $topWidth && $sourceHeight === $topHeight) {
            return null;
        }

        /*
         * One file per density the box can actually use.
         *
         * The box is a known size in CSS pixels, which is what makes this
         * simple: "1x" and "2x" describe it exactly and need no `sizes`
         * attribute to go with them. Width descriptors would, and `sizes`
         * is a description of the page's layout, which is the theme's
         * business and not something that can be worked out from one box.
         *
         * The smaller one is only worth making when it is genuinely smaller.
         * A source too small to give two densities gives one file and no
         * source list, which is the honest answer rather than the same file
         * offered twice.
         */
        $targets = [['w' => $width, 'h' => $height, 'x' => 1.0]];

        if ($topWidth > $width) {
            $targets[] = ['w' => $topWidth, 'h' => $topHeight, 'x' => $density];
        }

        $base = wp_get_attachment_url($id);

        if (! is_string($base) || $base === '') {
            return null;
        }

        // Built from the original's own address so it needs no size registered
        // anywhere: same directory, different filename.
        $directory = trailingslashit(dirname($base));

        $fits = get_post_meta($id, self::FITS_META, true);
        $fits = is_array($fits) ? $fits : [];

        $made = [];

        foreach ($targets as $target) {
            // A fresh editor per size: resize works on the image it holds, so
            // reusing one would shrink the small copy out of the large one.
            $editor = wp_get_image_editor($file);

            if (is_wp_error($editor) || is_wp_error($editor->resize($target['w'], $target['h'], true))) {
                continue;
            }

            $saved = $editor->save($editor->generate_filename(self::FITTED.'-'.$target['w']));

            if (is_wp_error($saved) || ! is_array($saved) || ($saved['file'] ?? '') === '') {
                continue;
            }

            $fits[] = $saved['file'];
            $made[] = ['url' => $directory.$saved['file'], 'x' => $target['x']];
        }

        if ($made === []) {
            return null;
        }

        update_post_meta($id, self::FITS_META, array_values(array_unique($fits)));

        $largest = $made[count($made) - 1];

        /*
         * src is the largest, which is what this always returned. A browser
         * that does not read a source list therefore behaves exactly as it did
         * before this existed, and one that does picks the smaller file on a
         * screen that cannot show the difference.
         */
        return [
            'url' => $largest['url'],
            'srcset' => count($made) > 1
                ? implode(', ', array_map(
                    static fn (array $m): string => $m['url'].' '.self::descriptor($m['x']),
                    $made
                ))
                : '',
        ];
    }

    /**
     * "1x", "2x", "1.5x": trailing zeroes are noise in an attribute.
     *
     * Public because it is the one piece of this worth testing without a
     * WordPress to run in, and because getting it wrong fails silently. A
     * descriptor a browser cannot parse invalidates the whole list, and the
     * page then falls back to src and looks exactly as it did - correct
     * picture, largest file, on every phone. Nothing errors and nothing looks
     * wrong; the saving simply never happens.
     */
    public static function descriptor(float $density): string
    {
        return rtrim(rtrim(number_format($density, 2, '.', ''), '0'), '.').'x';
    }

    /**
     * Who to record as having uploaded this.
     *
     * A WordPress user if there is one, and otherwise the person holding the
     * editor session - who is exactly the case this has to cover, since a
     * client editing their own site may have no WordPress account at all.
     */
    private static function uploader(): string
    {
        $user = wp_get_current_user();

        if ($user->exists() && $user->user_email !== '') {
            return sanitize_email((string) $user->user_email);
        }

        $editor = PlaneSession::current();

        return $editor === null ? '' : sanitize_email((string) ($editor['email'] ?? ''));
    }

    /**
     * The box the picture is being dropped into, as the browser measured it.
     *
     * @return array{0: ?int, 1: ?int}
     */
    private static function box(\WP_REST_Request $request): array
    {
        $width = (int) $request->get_param('fitWidth');
        $height = (int) $request->get_param('fitHeight');

        return [
            $width >= 1 && $width <= 4000 ? $width : null,
            $height >= 1 && $height <= 4000 ? $height : null,
        ];
    }

    /**
     * The setting a target names.
     *
     * Settings only, the same as the service. A target like "post:12" is a row
     * in a host's own database; this route deliberately does not reach into
     * WordPress's posts on the strength of an editor session.
     */
    private static function settingKey(string $target): ?string
    {
        $parts = explode(':', $target, 2);

        if (count($parts) !== 2 || $parts[0] !== 'setting' || trim($parts[1]) === '') {
            return null;
        }

        return trim($parts[1]);
    }

    /**
     * An http(s) address, or false when it is something else.
     *
     * Checked because this value becomes a src the browser will fetch. A
     * javascript: or data: URL pasted into the picture field is a script the
     * page runs, offered by whoever has an editor session rather than by the
     * person who owns the site.
     *
     * @return string|false
     */
    private static function addressOrNothing(string $url)
    {
        $clean = esc_url_raw($url, ['http', 'https']);

        return $clean === '' ? false : $clean;
    }

    /**
     * Whether a field was sent at all, which is not the same as having a value.
     *
     * Clearing the alt text is an edit. Not mentioning it is not.
     */
    private static function sent(\WP_REST_Request $request, string $field): bool
    {
        return $request->has_param($field);
    }

    private static function refuse(string $message): \WP_REST_Response
    {
        return new \WP_REST_Response([
            'error' => ['type' => 'invalid_request_error', 'message' => $message],
            'message' => $message,
        ], 422);
    }
}
