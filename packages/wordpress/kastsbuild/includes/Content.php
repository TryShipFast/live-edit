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
    private const SCHEMA = 2;

    private const SCHEMA_OPTION = 'kastsbuild_schema';

    /** Set once the words held by the service have been brought down. */
    private const MIGRATED_OPTION = 'kastsbuild_content_migrated';

    /**
     * The settings that belong to a picture rather than standing on their own.
     *
     * Written beside it under the names a theme already reads them by, which
     * means they are ordinary rows here and have to be recognised as a group
     * when a picture is reverted or listed as a change.
     */
    private const COMPANIONS = ['Alt', 'Title', 'Credit', 'CreditBy', 'CreditUrl', 'CreditSource', 'CreditSourceUrl'];

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

        dbDelta('CREATE TABLE '.Styles::table().' (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            style_key varchar(191) NOT NULL,
            status varchar(12) NOT NULL DEFAULT \'published\',
            props longtext NULL,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY one_set_per_key (style_key, status),
            KEY by_status (status)
        ) '.$collate.';');

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
        return self::inThisLanguage('published', $locale);
    }

    /**
     * The words only the person editing sees, laid over the published ones.
     *
     * @return array<string, string>
     */
    public static function drafted(string $locale = ''): array
    {
        return self::inThisLanguage('draft', $locale);
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

    /**
     * How many changes are waiting to be published.
     *
     * Words and styling together, because the number on the Publish button
     * answers "how much of my work is not live yet" and a changed colour is
     * part of that work.
     */
    public static function pending(): int
    {
        global $wpdb;

        self::ensureTables();

        $words = (int) $wpdb->get_var(
            $wpdb->prepare('SELECT COUNT(*) FROM '.self::contentTable().' WHERE status = %s', 'draft')
        );

        return $words + Styles::pending();
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

        // Styling counts as something to publish. Checking only the words here
        // meant somebody who had changed nothing but a colour pressed Publish
        // and was told nothing had happened - correctly, as far as this
        // function could see, and wrongly as far as they could.
        $styled = Styles::pending();

        if ($drafts === [] && $styled === 0) {
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

        $styled = Styles::release();

        self::forget();

        return count($drafts) + $styled;
    }

    /**
     * Put one held change back, leaving every other one alone.
     *
     * The editor's Revert button sends the key it is reverting to the same
     * route that discards everything, distinguished only by whether a key came
     * with it. Answering both with "discard everything" meant somebody who had
     * corrected three sentences and changed their mind about one lost all
     * three - silently, and reported to them as having reverted one.
     *
     * The draft is deleted rather than overwritten with the published value.
     * Writing the old value back would leave a draft saying "make this what it
     * already is", which publishes as a change and lists as one.
     *
     * @return int how many rows that turned out to be
     */
    public static function revert(string $key, string $locale = ''): int
    {
        global $wpdb;

        self::ensureTables();

        // A picture is one change made of several settings - the address, the
        // description, the tooltip, four fields of credit - so reverting it has
        // to take them together. Left behind, they would publish later as
        // changes nobody remembers making: a photographer's name under a
        // photograph that went back to being somebody else's.
        $keys = [$key];

        foreach (self::COMPANIONS as $suffix) {
            $keys[] = $key.$suffix;
        }

        $marks = implode(', ', array_fill(0, count($keys), '%s'));

        return (int) $wpdb->query($wpdb->prepare(
            'DELETE FROM '.self::contentTable()." WHERE status = 'draft' AND locale = %s AND content_key IN ({$marks})",
            $locale,
            ...$keys
        ));
    }

    /** Throw away every held change, leaving the published page alone. */
    public static function discard(): int
    {
        global $wpdb;

        self::ensureTables();

        $count = self::pending();
        $wpdb->delete(self::contentTable(), ['status' => 'draft']);
        Styles::discard();

        self::forget();

        return $count;
    }

    /**
     * Everything held back, in the shape the editor's Changes tab reads.
     *
     * The same shape the service answers with, because the panel showing it is
     * the same panel on every adapter and should not have to know which kind
     * of site it is looking at.
     *
     * @return array{changes: array<int, array<string, mixed>>, count: int}
     */
    public static function changes(): array
    {
        $drafts = self::drafted();
        $published = self::published();
        $changes = [];

        foreach ($drafts as $key => $value) {
            // One picture edit is one change, not seven. Listed separately the
            // credit fields bury everything else somebody actually did, and
            // "Photo by Caio Silva on Unsplash" is not a change anybody made
            // on purpose or would know how to revert.
            if (self::belongsToAPicture($key, $drafts)) {
                continue;
            }

            $changes[] = [
                'key' => $key,
                'kind' => 'setting',
                // Null where the element has never been changed: what it says
                // now is the theme's own words, which only the page knows.
                'before' => $published[$key] ?? null,
                'after' => $value,
            ];
        }

        // Styling is work somebody did and has not published, so it belongs
        // in the same list. Listed after the words because a changed sentence
        // is the thing people check first.
        $changes = array_merge($changes, Styles::changes());

        return ['changes' => $changes, 'count' => count($changes)];
    }

    /**
     * Whether this key is a picture's companion rather than a change of its
     * own, judged by whether the picture it would belong to is also changing.
     *
     * Without that second half, a client who edits only the alt text of a
     * picture sees nothing at all in the list - the one row describing what
     * they did, hidden as a companion of a change that is not happening.
     */
    private static function belongsToAPicture(string $key, array $drafts): bool
    {
        foreach (self::COMPANIONS as $suffix) {
            if (str_ends_with($key, $suffix) && isset($drafts[substr($key, 0, -strlen($suffix))])) {
                return true;
            }
        }

        return false;
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
            // Words and styling together. A version that restored the
            // sentences and left last month's colours behind would be a page
            // that never existed, and "restore" would mean something the
            // person pressing it did not ask for.
            'payload' => wp_json_encode([
                'content' => self::rows('published', null),
                'styles' => Styles::published(),
            ]),
        ]);

        return (int) $wpdb->insert_id;
    }

    /**
     * The snapshots this site holds, newest first.
     *
     * Shaped the way the editor's History tab expects, because that panel is
     * the same one every adapter shows and it should not have to know which
     * kind of site it is looking at.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function versions(int $limit = 50): array
    {
        global $wpdb;

        self::ensureTables();

        $rows = $wpdb->get_results($wpdb->prepare(
            'SELECT id, created_at, author, note, payload FROM '.self::versionsTable().' ORDER BY id DESC LIMIT %d',
            $limit
        ));

        return array_map(static function ($row) {
            $payload = json_decode((string) $row->payload, true);
            $payload = is_array($payload) ? $payload : [];

            // A snapshot holds words and styling under their own keys, and an
            // older one is a flat map of words. Counting the top level would
            // report every recent version as holding two changes.
            $held = array_key_exists('content', $payload)
                ? count((array) $payload['content']) + count((array) ($payload['styles'] ?? []))
                : count($payload);

            return [
                'number' => (int) $row->id,
                'changes' => $held,
                'restored_from' => $row->note !== '' && str_starts_with((string) $row->note, 'restored:')
                    ? (int) substr((string) $row->note, 9)
                    : null,
                'published_at' => gmdate('c', strtotime((string) $row->created_at.' UTC')),
                'author' => (string) $row->author,
            ];
        }, $rows);
    }

    /**
     * Put an earlier snapshot back.
     *
     * The state being replaced is kept first, so a restore is itself
     * undoable. Somebody reaching for history is usually already having a bad
     * day, and "that was the wrong version" should not be the end of the
     * road.
     *
     * Entirely local: content to snapshot to content. Routing this through
     * the service would quietly rebuild the dependency that moving the words
     * here removed.
     */
    public static function restore(int $id, string $author = ''): ?int
    {
        global $wpdb;

        self::ensureTables();

        $payload = $wpdb->get_var($wpdb->prepare(
            'SELECT payload FROM '.self::versionsTable().' WHERE id = %d',
            $id
        ));

        if ($payload === null) {
            return null;
        }

        $saved = json_decode((string) $payload, true);

        if (! is_array($saved)) {
            return null;
        }

        /*
         * Snapshots taken before styling was kept here are a flat map of
         * words, with no 'content' key. Read as though they had one, they
         * would restore a page with nothing on it.
         */
        $words = array_key_exists('content', $saved) ? (array) $saved['content'] : $saved;
        $styles = array_key_exists('styles', $saved) ? (array) $saved['styles'] : null;

        self::snapshot($author, 'restored:'.$id);

        // Everything published is replaced, not merged: a key the old version
        // never had is a key that did not exist then, and leaving it behind
        // would produce a page that never existed at any point in time.
        $wpdb->delete(self::contentTable(), ['status' => 'published']);

        foreach ($words as $key => $value) {
            self::put((string) $key, $value === null ? null : (string) $value, false);
        }

        // Only where the snapshot has something to say about styling. An old
        // one does not, and clearing what the site looks like on the strength
        // of a version that never recorded it would be a change nobody made.
        if ($styles !== null) {
            Styles::replace($styles);
        }

        self::forget();

        return count($words);
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
    /**
     * One language's words, with the site's own underneath them.
     *
     * A key is one canonical value with translations hanging off it, not one
     * independent piece of content per language. So a page asked for in French
     * is the site's words with French laid over them, and a sentence nobody
     * has translated yet renders in the language it was written in.
     *
     * Asking the table for locale = 'fr' alone was the obvious thing and the
     * wrong one: it returns only what has been translated, so every other
     * element on the page falls back past the client's edits entirely and
     * shows the words the theme shipped with. A half-translated site would
     * have served half of somebody else's copy.
     *
     * A row that exists and is empty wins, because somebody cleared it on
     * purpose. Falling back is what a missing row means, and that is the same
     * rule the service composes by - two implementations of one idea, which is
     * worth saying out loud given how this week has gone.
     */
    private static function inThisLanguage(string $status, string $locale): array
    {
        $canonical = self::rows($status, '');

        if ($locale === '') {
            return $canonical;
        }

        return self::overlaid($canonical, self::rows($status, $locale));
    }

    /**
     * One language's words over the site's own.
     *
     * A missing row falls back and an empty one does not: absence is "nobody
     * has translated this yet", an empty string is "somebody cleared it". The
     * same rule the service composes by, kept the same on purpose.
     *
     * @param  array<string, string>  $canonical
     * @param  array<string, string>  $translated
     * @return array<string, string>
     */
    public static function overlaid(array $canonical, array $translated): array
    {
        return array_merge($canonical, $translated);
    }

    /**
     * The spellings of a WordPress locale this table might hold, best first.
     *
     * WordPress says "fr_FR"; a site's languages are usually listed as "fr".
     * Both are tried because a customer may have been given either, and
     * guessing only one means a correctly stored translation is never found -
     * which is a silent failure, since the page renders perfectly in the wrong
     * language.
     *
     * @return array<int, string>
     */
    public static function spellingsOf(string $wp): array
    {
        $wp = trim($wp);

        if ($wp === '') {
            return [];
        }

        return array_values(array_unique(array_filter([
            strtolower(str_replace('_', '-', $wp)),
            strtolower((string) strtok($wp, '_-')),
        ])));
    }

    /**
     * Which language this request is being rendered in, as this table spells
     * it, or '' for the site's own.
     *
     * Read from WordPress rather than from a setting of ours. Whatever decides
     * language on that site - core, Polylang, WPML, a theme - has already
     * decided by the time this runs, and asking anything else would make the
     * words disagree with the page around them.
     *
     * A language is only used when this table actually holds rows for it, and
     * that rule is what makes this safe to turn on for every existing site.
     * A monolingual install stores everything under '' and has no row in any
     * other language, so it never takes this path and nothing about it
     * changes. Nothing here can empty a page, which is the failure that would
     * matter.
     */
    public static function localeForThisRequest(): string
    {
        static $found = null;

        if ($found !== null) {
            return $found;
        }

        $wp = function_exists('determine_locale')
            ? (string) determine_locale()
            : (function_exists('get_locale') ? (string) get_locale() : '');

        foreach (self::spellingsOf($wp) as $code) {
            if (self::holdsAnythingIn($code)) {
                return $found = $code;
            }
        }

        return $found = '';
    }

    /** Whether a single row exists in this language. */
    private static function holdsAnythingIn(string $locale): bool
    {
        global $wpdb;

        self::ensureTables();

        return (bool) $wpdb->get_var($wpdb->prepare(
            'SELECT 1 FROM '.self::contentTable().' WHERE locale = %s LIMIT 1',
            $locale
        ));
    }

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
