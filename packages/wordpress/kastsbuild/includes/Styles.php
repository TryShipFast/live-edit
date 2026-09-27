<?php

namespace KastsBuild;

/**
 * How the client's site looks, in the client's own database.
 *
 * The words moved first, then their history, then the pictures. This is the
 * last of it: a colour, a corner radius, a section somebody hid. Small next to
 * the words, and the same question - a client who changes the background of
 * their hero has changed their site, and that change belonged in our database
 * rather than theirs.
 *
 * Nothing was lost by finding this late. The site that prompted it held no
 * style rows at all, so this closes the door before anybody walks through it.
 *
 * Stored as one row per element with its properties as JSON, which is the
 * shape the service keeps and the shape the renderer wants. The page still
 * goes to the service to be marked up and painted, and the styling goes with
 * it, exactly as the words do - the difference being that the service keeps
 * none of it.
 */
class Styles
{
    /** Set once the styling held by the service has been brought down. */
    private const MIGRATED_OPTION = 'kastsbuild_styles_migrated';

    public static function table(): string
    {
        global $wpdb;

        return $wpdb->prefix.'kastsbuild_styles';
    }

    /** The styling a visitor sees. @return array<string, array<string, string>> */
    public static function published(): array
    {
        return self::rows('published');
    }

    /** The styling only the person editing sees. @return array<string, array<string, string>> */
    public static function drafted(): array
    {
        return self::rows('draft');
    }

    /**
     * Both sets, shaped the way the service's prepare endpoint takes them.
     *
     * Sent whole rather than merged here, because the two are kept apart all
     * the way to the renderer: a draft replaces its published counterpart
     * entirely rather than merging property by property, and merging them
     * early would quietly lose that rule.
     *
     * @return array{published: array<string, array<string, string>>, draft: array<string, array<string, string>>}
     */
    public static function forViewer(bool $editing): array
    {
        return [
            'published' => self::published(),
            'draft' => $editing ? self::drafted() : [],
        ];
    }

    /**
     * Save one element's styling, held back until somebody publishes.
     *
     * An empty set of properties is how the editor says "put this back to what
     * the theme does", so a draft of nothing is a real change and is kept as
     * one. It becomes a deletion when it is published.
     *
     * @param  array<string, string>  $props
     */
    public static function put(string $key, array $props, bool $hold): void
    {
        global $wpdb;

        Content::ensureTables();

        $wpdb->replace(self::table(), [
            'style_key' => $key,
            'status' => $hold ? 'draft' : 'published',
            'props' => wp_json_encode($props),
            'updated_at' => current_time('mysql', true),
        ]);

        if (! $hold && $props === []) {
            $wpdb->delete(self::table(), ['style_key' => $key, 'status' => 'published']);
        }
    }

    /** How many elements have styling waiting to be published. */
    public static function pending(): int
    {
        global $wpdb;

        Content::ensureTables();

        return (int) $wpdb->get_var(
            $wpdb->prepare('SELECT COUNT(*) FROM '.self::table().' WHERE status = %s', 'draft')
        );
    }

    /**
     * Release every held style.
     *
     * A draft that says "no properties" publishes as a deletion: the element
     * goes back to whatever the theme does with it, which is what somebody
     * pressing Reset asked for and cannot be expressed by a row that stays.
     *
     * @return int how many elements changed
     */
    public static function release(): int
    {
        global $wpdb;

        Content::ensureTables();

        $drafts = $wpdb->get_results(
            $wpdb->prepare('SELECT style_key, props FROM '.self::table().' WHERE status = %s', 'draft')
        );

        foreach ($drafts as $draft) {
            $props = json_decode((string) $draft->props, true);
            self::put((string) $draft->style_key, is_array($props) ? $props : [], false);
        }

        $wpdb->delete(self::table(), ['status' => 'draft']);

        return count($drafts);
    }

    /** Throw away every held style. */
    public static function discard(): int
    {
        global $wpdb;

        Content::ensureTables();

        $count = self::pending();
        $wpdb->delete(self::table(), ['status' => 'draft']);

        return $count;
    }

    /** Put one held style back, leaving the others alone. */
    public static function revert(string $key): int
    {
        global $wpdb;

        Content::ensureTables();

        return (int) $wpdb->delete(self::table(), ['style_key' => $key, 'status' => 'draft']);
    }

    /**
     * Replace the published styling outright, for a restore.
     *
     * Replaced rather than merged, for the same reason the words are: an
     * element styled today that was not styled in the version being restored
     * would keep today's colour, and the result would be a page that never
     * existed at any point in time.
     *
     * @param  array<string, array<string, string>>  $styles
     */
    public static function replace(array $styles): void
    {
        global $wpdb;

        Content::ensureTables();

        $wpdb->delete(self::table(), ['status' => 'published']);

        foreach ($styles as $key => $props) {
            if (is_array($props) && $props !== []) {
                self::put((string) $key, $props, false);
            }
        }
    }

    /**
     * Held styling, described for the Changes tab.
     *
     * "Hero: background, corner rounding" rather than a key nobody recognises.
     * The service says it the same way, so the panel does not have to know
     * which kind of site it is looking at.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function changes(): array
    {
        $out = [];

        foreach (self::drafted() as $key => $props) {
            $out[] = [
                'key' => $key,
                'kind' => 'style',
                'before' => null,
                'after' => self::describe($props),
            ];
        }

        return $out;
    }

    /**
     * Bring down whatever styling the service is still holding, once.
     *
     * Without this, upgrading loses the site's appearance. From this version
     * the page tells the service "here is my styling, all of it", and a site
     * whose colours are in the service's table would be saying "I have none" -
     * so a client who had restyled their hero would reload onto the theme's
     * original the moment their plugin updated.
     *
     * Published styling only. Anything held unpublished there was stranded the
     * day publishing moved to this site: it could be saved and seen while
     * editing and could never go live, which is the bug this stage closes. It
     * is not carried over, and that is worth knowing rather than hiding - the
     * client will have to set it again, and this time it will publish.
     *
     * The service's copy is left where it is rather than deleted. A migration
     * that goes wrong should be survivable.
     */
    public static function migrateFromService(): void
    {
        if (get_option(self::MIGRATED_OPTION)) {
            return;
        }

        Content::ensureTables();

        foreach (Api::styles() as $key => $props) {
            // Never over the top of something set here. If both hold a key,
            // this site's own answer is the newer one.
            if (is_array($props) && $props !== [] && ! self::has((string) $key)) {
                self::put((string) $key, array_map(static fn ($v) => (string) $v, $props), false);
            }
        }

        update_option(self::MIGRATED_OPTION, gmdate('c'), false);
    }

    private static function has(string $key): bool
    {
        global $wpdb;

        return (int) $wpdb->get_var($wpdb->prepare(
            'SELECT COUNT(*) FROM '.self::table().' WHERE style_key = %s AND status = %s',
            $key,
            'published'
        )) > 0;
    }

    /** @param  array<string, string>  $props */
    private static function describe(array $props): string
    {
        $names = [
            'background' => 'background',
            'backgroundImage' => 'background image',
            'textColor' => 'text colour',
            'fontSize' => 'text size',
            'radius' => 'corner rounding',
            'paddingX' => 'side spacing',
            'paddingY' => 'top and bottom spacing',
            'hidden' => 'hidden',
        ];

        $said = [];

        foreach ($props as $prop => $value) {
            if ($value !== '' && $value !== null) {
                $said[] = $names[$prop] ?? $prop;
            }
        }

        return $said === [] ? 'back to the theme’s own styling' : implode(', ', $said);
    }

    /** @return array<string, array<string, string>> */
    private static function rows(string $status): array
    {
        global $wpdb;

        Content::ensureTables();

        $rows = $wpdb->get_results($wpdb->prepare(
            'SELECT style_key, props FROM '.self::table().' WHERE status = %s',
            $status
        ));

        $out = [];

        foreach ($rows as $row) {
            $props = json_decode((string) $row->props, true);
            $out[(string) $row->style_key] = is_array($props) ? $props : [];
        }

        return $out;
    }
}
