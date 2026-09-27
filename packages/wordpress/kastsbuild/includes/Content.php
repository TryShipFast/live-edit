<?php

namespace KastsBuild;

/**
 * The client's words, in their own WordPress database.
 *
 * The architecture always said Laravel and WordPress keep their own data and
 * ask the service only whether the licence is good. Laravel did. WordPress did
 * not: every edit went to the service and lived there, and counting the rows
 * was the only way to find out — twelve of them, for a site whose owner had
 * been told their content was theirs.
 *
 * So it lives here now. Tables rather than a JSON blob in wp_options, because
 * a customer's content should be inspectable, queryable and exportable with
 * ordinary WordPress tools: `wp db export` should contain their words, not an
 * opaque string. It is also what makes "restore a previous version" a purely
 * local operation — content to snapshot to content, never leaving the site.
 *
 * What still goes to the service is everything that is a service rather than
 * content: the licence, sign-in, the AI, stock photos. And the page is still
 * sent there to be marked up and have these words applied, because the engine
 * that decides what is editable has to stay current and a copy in this zip
 * would go stale. The difference is that the service now holds none of it.
 */
class Content
{
    /** Bumped when the tables change, so an upgrade knows to run dbDelta. */
    private const SCHEMA = 1;

    private const SCHEMA_OPTION = 'kastsbuild_schema';

    /** Set once the words held by the service have been brought down. */
    private const MIGRATED_OPTION = 'kastsbuild_content_migrated';

    public static function contentTable(): string
    {
        global $wpdb;

        return $wpdb->prefix.'kastsbuild_content';
    }

    public static function versionsTable(): string
    {
        global $wpdb;

        return $wpdb->prefix.'kastsbuild_versions';
    }

    /**
     * Create or update the tables.
     *
     * Called on activation and on every load where the recorded schema is
     * behind, because a plugin updated by copying files over the old ones
     * never fires its activation hook — and a missing table would lose a
     * client's next edit rather than failing loudly.
     */
    public static function ensureTables(): void
    {
        if ((int) get_option(self::SCHEMA_OPTION) === self::SCHEMA) {
            return;
        }

        global $wpdb;

        require_once ABSPATH.'wp-admin/includes/upgrade.php';

        $collate = $wpdb->get_charset_collate();
        $content = self::contentTable();
        $versions = self::versionsTable();

        dbDelta("CREATE TABLE {$content} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            content_key varchar(191) NOT NULL,
            locale varchar(12) NOT NULL DEFAULT '',
            status varchar(12) NOT NULL DEFAULT 'published',
            value longtext NULL,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY one_value_per_key (content_key, locale, status),
            KEY by_status (status)
        ) {$collate};");

        dbDelta("CREATE TABLE {$versions} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            author varchar(191) NOT NULL DEFAULT '',
            note varchar(191) NOT NULL DEFAULT '',
            payload longtext NULL,
            PRIMARY KEY (id),
            KEY by_date (created_at)
        ) {$collate};");

        update_option(self::SCHEMA_OPTION, self::SCHEMA, false);
    }

    /**
     * The words a visitor sees.
     *
     * @return array<string, string>
     */
    public static function published(string $locale = ''): array
    {
        return self::rows('published', $locale);
    }

    /**
     * The words only the person editing sees, laid over the published ones.
     *
     * @return array<string, string>
     */
    public static function drafted(string $locale = ''): array
    {
        return self::rows('draft', $locale);
    }

    /**
     * What to show somebody, which depends on whether they are editing.
     *
     * The same rule and the same order the service uses, because a second
     * answer to this question is how a half-typed sentence reaches a visitor.
     *
     * @return array<string, string>
     */
    public static function forViewer(bool $editing, string $locale = ''): array
    {
        $published = self::published($locale);

        return $editing ? array_merge($published, self::drafted($locale)) : $published;
    }

    /** Save a value, held back as a draft or published straight away. */
    public static function put(string $key, ?string $value, bool $hold, string $locale = ''): void
    {
        global $wpdb;

        self::ensureTables();

        $wpdb->replace(self::contentTable(), [
            'content_key' => $key,
            'locale' => $locale,
            'status' => $hold ? 'draft' : 'published',
            'value' => $value,
            'updated_at' => current_time('mysql', true),
        ]);

        self::forget();
    }

    /** How many changes are waiting to be published. */
    public static function pending(): int
    {
        global $wpdb;

        self::ensureTables();

        return (int) $wpdb->get_var(
            $wpdb->prepare('SELECT COUNT(*) FROM '.self::contentTable().' WHERE status = %s', 'draft')
        );
    }

    /**
     * Release every held change, keeping a snapshot of what was there before.
     *
     * The snapshot is taken first and of the published state, which is what
     * "restore the previous version" has to mean: the thing you go back to is
     * the page as it was before this publish, not as it was after it.
     */
    public static function publish(string $author = ''): int
    {
        global $wpdb;

        self::ensureTables();

        $drafts = $wpdb->get_results(
            $wpdb->prepare('SELECT content_key, locale, value FROM '.self::contentTable().' WHERE status = %s', 'draft')
        );

        if ($drafts === []) {
            return 0;
        }

        self::snapshot($author);

        foreach ($drafts as $draft) {
            $wpdb->replace(self::contentTable(), [
                'content_key' => $draft->content_key,
                'locale' => $draft->locale,
                'status' => 'published',
                'value' => $draft->value,
                'updated_at' => current_time('mysql', true),
            ]);
        }

        $wpdb->delete(self::contentTable(), ['status' => 'draft']);

        self::forget();

        return count($drafts);
    }

    /** Throw away every held change, leaving the published page alone. */
    public static function discard(): int
    {
        global $wpdb;

        self::ensureTables();

        $count = self::pending();
        $wpdb->delete(self::contentTable(), ['status' => 'draft']);

        self::forget();

        return $count;
    }

    /** Keep what is published now, so it can be returned to. */
    public static function snapshot(string $author = '', string $note = ''): int
    {
        global $wpdb;

        self::ensureTables();

        $wpdb->insert(self::versionsTable(), [
            'created_at' => current_time('mysql', true),
            'author' => $author,
            'note' => $note,
            'payload' => wp_json_encode(self::rows('published', null)),
        ]);

        return (int) $wpdb->insert_id;
    }

    /**
     * Bring down whatever the service is still holding, once.
     *
     * A site that has been edited before this existed has its words there and
     * not here, and would otherwise appear to lose all of them the moment it
     * was upgraded. The service's copy is left where it is rather than
     * deleted: a migration that goes wrong should be survivable, and the copy
     * is frozen from this point because nothing writes to it again.
     */
    public static function migrateFromService(): void
    {
        if (get_option(self::MIGRATED_OPTION)) {
            return;
        }

        self::ensureTables();

        $theirs = Api::content(true);

        foreach ($theirs as $key => $value) {
            // Never over the top of something written here. If both hold a
            // key, this site's own answer is the newer one.
            if (self::valueOf((string) $key) === null) {
                self::put((string) $key, (string) $value, false);
            }
        }

        update_option(self::MIGRATED_OPTION, gmdate('c'), false);
    }

    private static function valueOf(string $key, string $locale = ''): ?string
    {
        global $wpdb;

        $found = $wpdb->get_var($wpdb->prepare(
            'SELECT value FROM '.self::contentTable().' WHERE content_key = %s AND locale = %s AND status = %s',
            $key,
            $locale,
            'published'
        ));

        return $found === null ? null : (string) $found;
    }

    /**
     * @return array<string, string>
     */
    private static function rows(string $status, ?string $locale = ''): array
    {
        global $wpdb;

        self::ensureTables();

        $sql = 'SELECT content_key, value FROM '.self::contentTable().' WHERE status = %s';
        $args = [$status];

        if ($locale !== null) {
            $sql .= ' AND locale = %s';
            $args[] = $locale;
        }

        $rows = $wpdb->get_results($wpdb->prepare($sql, ...$args));
        $out = [];

        foreach ($rows as $row) {
            $out[(string) $row->content_key] = (string) $row->value;
        }

        return $out;
    }

    /**
     * Drop the caches that were built from these words.
     *
     * Publishing is the one moment nobody should wait: the person has just
     * told the world to look.
     */
    private static function forget(): void
    {
        delete_transient('kastsbuild_stamp');
        Frontend::forgetCache();
    }
}
