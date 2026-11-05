<?php

namespace ShipFast\LiveEdit\Domain\Content;

use ShipFast\LiveEdit\Application\Api\ReadPublishedContent;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Team\LockUnit;
use ShipFast\LiveEdit\Domain\Team\Person;
use ShipFast\LiveEdit\Domain\Team\SectionLocks;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Models\SiteStyle;
use ShipFast\LiveEdit\Models\Version;

/**
 * Everything one site's content can do, and nothing another site's can.
 *
 * The scope lives in the object rather than in each call, because the failure
 * this prevents is somebody forgetting to pass it. A missing "where site_id"
 * in a multi-tenant system is not a bug that shows up as an error — it shows
 * up as one customer reading another customer's words, months later, in a
 * support ticket. Holding the site in the constructor means every query built
 * here starts already narrowed.
 */
class SiteStore
{
    public function __construct(public readonly Site $site) {}

    /**
     * Published values for a locale, with untranslated ones filled in from the
     * default so no page shows a blank where a translation is missing.
     *
     * @return array<string, string>
     */
    public function published(?string $locale = null): array
    {
        $default = $this->site->writtenIn();
        $locale ??= $default;
        $known = $this->locales();

        $base = [];
        $translated = [];

        foreach ($this->settings()->pluck('value', 'key') as $key => $value) {
            [$prefix, $rest] = array_pad(explode(':', (string) $key, 2), 2, null);

            // The prefix counts as a language only if this site declares it.
            // Taking any prefix read the scanner's own "auto:1a2b" keys as a
            // language called "auto" and dropped every one of them.
            if ($rest !== null && $prefix !== $default && in_array($prefix, $known, true)) {
                if ($prefix === $locale) {
                    $translated[$rest] = (string) $value;
                }

                continue;
            }

            $base[$key] = (string) $value;
        }

        return array_merge($base, $translated);
    }

    /** @return array<string, array<string, string>> */
    public function publishedStyles(): array
    {
        return $this->styles()->pluck('props', 'key')->all();
    }

    /** @return array<string, string> */
    public function draftedSettings(): array
    {
        return $this->drafts()->where('kind', 'setting')->get()
            ->mapWithKeys(fn (Draft $d) => [$d->subject => (string) ($d->payload['value'] ?? '')])
            ->all();
    }

    /** @return array<string, array<string, string>> */
    public function draftedStyles(): array
    {
        return $this->drafts()->where('kind', 'style')->get()
            ->mapWithKeys(fn (Draft $d) => [$d->subject => (array) ($d->payload['props'] ?? [])])
            ->all();
    }

    public function pending(): int
    {
        return $this->drafts()->count();
    }

    /**
     * Whether writing this would change nothing, so nothing should be recorded.
     *
     * A drawer submits every field it holds, and most of them are the values
     * that were already there. One picture replaced wrote nine rows: the
     * picture, the description it already had, five empty credit fields, an
     * empty tooltip and an empty set of style props. The customer then read
     * "9 changes" on the publish button for one replaced picture, every row
     * went into the version history, and every row was metered as a write
     * against their month.
     *
     * Guarded here rather than in the editor because the editor is one of four
     * clients. WordPress, React and a folder of static files all reach this
     * same method, and a fix in a drawer is a fix for whoever happens to be
     * using that drawer.
     *
     * The third case is the one worth spelling out: a draft that would return
     * a value to what is already published is not a change, it is the undoing
     * of one, so the draft goes rather than being rewritten. Otherwise typing
     * a word, thinking better of it and typing the old one back leaves a
     * pending change that publishes nothing.
     */
    protected function wouldChangeNothing(string $key, string $value): bool
    {
        $published = $this->settings()->where('key', $key)->value('value');

        $draft = $this->drafts()
            ->where('kind', 'setting')
            ->where('subject', $key)
            ->first();

        if ($draft !== null) {
            if ((string) ($draft->payload['value'] ?? '') === $value) {
                return true;
            }

            if ($published !== null && (string) $published === $value) {
                $draft->delete();

                return true;
            }

            return false;
        }

        return $published !== null && (string) $published === $value;
    }

    /**
     * Write a value, held back as a draft when the site publishes deliberately.
     *
     * The draft remembers who wrote it and which part of the site it belongs
     * to (team editing): Publish then puts live only the publisher's own work,
     * and History can say "Ada changed the headline in Hero".
     */
    public function put(string $key, string $value, bool $hold, ?Person $by = null, ?string $unit = null, ?string $unitLabel = null, ?string $what = null): void
    {
        if ($this->wouldChangeNothing($key, $value)) {
            return;
        }

        // What visitors are served (and the pending count) is about to change.
        ReadPublishedContent::forget($this->site);

        if ($hold) {
            Draft::query()->updateOrCreate(
                ['site_id' => $this->site->id, 'kind' => 'setting', 'subject' => $key],
                ['payload' => array_filter(['value' => $value, 'what' => $what], fn ($v) => $v !== null)] + $this->attribution($by, $unit, $unitLabel)
            );

            return;
        }

        SiteSetting::query()->updateOrCreate(
            ['site_id' => $this->site->id, 'key' => $key],
            ['value' => $value, 'translated_from' => $this->whatThisTranslates($key)]
        );
    }

    /**
     * The fingerprint of the canonical words a translation is being made from.
     *
     * Null for a canonical write, which is most of them. Recorded here because
     * this is the only moment anybody knows: afterwards there is a French row
     * and an English row and no way to tell whether one was written from the
     * other or from the sentence that used to be there.
     *
     * Read at the moment of writing rather than derived later, and compared
     * rather than counted - see Translations for why a version number gets
     * "edit the English and undo it" wrong forever.
     */
    protected function whatThisTranslates(string $key): ?string
    {
        $known = Translations::declaredLocales($this->site);
        $locale = Translations::localeOf($key, $known);
        $default = $this->site->writtenIn();

        if ($locale === null || $locale === $default) {
            return null;
        }

        $canonical = $this->settings()
            ->where('key', Translations::canonicalKeyOf($key, $known))
            ->value('value');

        // No canonical stored means the words are still the template's own.
        // There is nothing here to have gone out of step with, so nothing to
        // record, and the status reads as current until somebody edits them.
        return $canonical === null ? null : Translations::fingerprint((string) $canonical);
    }

    /**
     * Write how an element looks, held back as a draft when the site publishes
     * deliberately.
     *
     * An empty set removes the style rather than storing nothing: "no
     * background" has to be expressible, and a row of empty props would keep
     * overriding the theme with nothing.
     *
     * @param  array<string, string>  $props
     */
    public function putStyle(string $key, array $props, bool $hold, ?Person $by = null, ?string $unit = null, ?string $unitLabel = null, ?string $what = null): void
    {
        /*
         * Nothing to clear and nothing to set is not a change.
         *
         * Every picture saved wrote `{"props":[]}` against the element's style
         * key, because the drawer collects its style fields whether or not the
         * panel has any. An empty set still has to be writable where a style
         * is stored - that is how "put it back to the theme's own" is said -
         * so this only stands aside when there is no style here to remove.
         */
        if ($props === []
            && $this->styles()->where('key', $key)->doesntExist()
            && $this->drafts()->where('kind', 'style')->where('subject', $key)->doesntExist()) {
            return;
        }

        ReadPublishedContent::forget($this->site);

        if ($hold) {
            Draft::query()->updateOrCreate(
                ['site_id' => $this->site->id, 'kind' => 'style', 'subject' => $key],
                ['payload' => array_filter(['props' => $props, 'what' => $what], fn ($v) => $v !== null)] + $this->attribution($by, $unit, $unitLabel)
            );

            return;
        }

        if ($props === []) {
            $this->styles()->where('key', $key)->delete();

            return;
        }

        SiteStyle::query()->updateOrCreate(
            ['site_id' => $this->site->id, 'key' => $key],
            ['props' => $props]
        );
    }

    /**
     * Put held changes live and record the state as a version.
     *
     * Team editing: only the publisher's own changes go live (see ownedBy),
     * then their section locks are released. A teammate's unfinished section
     * stays a draft, still locked, until that teammate publishes. With one
     * person, or the website's own key, everything is theirs and this is the
     * publish it always was.
     *
     * @return array{published: int, version: int, left: int}
     */
    public function publish(?Person $by = null): array
    {
        $by ??= Person::theWebsite();
        $all = $this->drafts()->get();
        $drafts = $this->ownedBy($by, $all);
        $publishedValues = $this->settings()->whereIn('key', $drafts->where('kind', 'setting')->pluck('subject'))->pluck('value', 'key')->all();
        $publishedStyles = $this->styles()->whereIn('key', $drafts->where('kind', 'style')->pluck('subject'))->pluck('props', 'key')->all();
        $summary = [];

        foreach ($drafts as $draft) {
            $summary[] = $this->summaryOf($draft, $by,
                $draft->kind === 'setting' ? ($publishedValues[$draft->subject] ?? null) : ($publishedStyles[$draft->subject] ?? null));

            match ($draft->kind) {
                'setting' => SiteSetting::query()->updateOrCreate(
                    ['site_id' => $this->site->id, 'key' => $draft->subject],
                    ['value' => (string) ($draft->payload['value'] ?? '')]
                ),
                'style' => filled($draft->payload['props'] ?? [])
                    ? SiteStyle::query()->updateOrCreate(
                        ['site_id' => $this->site->id, 'key' => $draft->subject],
                        ['props' => $draft->payload['props']]
                    )
                    : $this->styles()->where('key', $draft->subject)->delete(),
                default => null,
            };
        }

        $count = $drafts->count();
        $this->drafts()->whereIn('id', $drafts->pluck('id'))->delete();

        $version = $this->recordVersion($count, null, $by, $summary);
        ReadPublishedContent::forget($this->site);

        // Written after the drafts are applied, so the file holds what is now
        // live rather than what was about to be.
        (new SiteSnapshot($this))->write($version->number);

        $locks = new SectionLocks($this->site);
        $locks->release($by);
        $locks->moved();

        return ['published' => $count, 'version' => $version->number, 'left' => $all->count() - $count];
    }

    /**
     * The drafts that are this person's to publish or throw away.
     *
     * Theirs: anything they wrote, anything in a section they hold, and
     * anything nobody is named against (written before team editing, or by
     * the website's own key). Never anything in a section somebody else holds
     * right now, and never what a teammate wrote, even if their lock lapsed:
     * that waits for its author, or for somebody to continue from it.
     *
     * The website itself (no person) owns everything, as before.
     *
     * @param  \Illuminate\Support\Collection<int, Draft>  $drafts
     * @return \Illuminate\Support\Collection<int, Draft>
     */
    public function ownedBy(Person $by, $drafts)
    {
        if (! $by->isSomeone()) {
            return $drafts->values();
        }

        $live = (new SectionLocks($this->site))->liveLocks();

        return $drafts->filter(function (Draft $draft) use ($by, $live) {
            $holder = $draft->unit !== null ? ($live[$draft->unit]['holder'] ?? null) : null;

            if ($holder !== null) {
                return $holder === $by->id;
            }

            return $draft->author === null || $draft->author === $by->id;
        })->values();
    }

    /**
     * Take back what one published version changed, leaving everything else.
     *
     * "Undo Ada's changes" rather than "go back to version 4": a restore puts
     * the whole site back as it was, which also takes away what Tunde
     * published since. This puts back only the keys that version changed, and
     * leaves alone any key somebody changed again in a later version, so one
     * person's rollback never undoes another person's work.
     *
     * @return array{undone: int, kept: array<int, array{what: string, by: string}>, version: int}|null
     */
    public function undoVersion(int $number, ?Person $by = null): ?array
    {
        $by ??= Person::theWebsite();
        $target = $this->versions()->where('number', $number)->first();

        if ($target === null) {
            return null;
        }

        $later = $this->versions()->where('number', '>', $number)->get();
        $touchedLater = [];

        foreach ($later as $version) {
            foreach ((array) $version->summary as $entry) {
                $touchedLater[($entry['kind'] ?? 'setting').':'.($entry['key'] ?? '')] = $entry['author_name'] ?? $version->published_by;
            }
        }

        $undone = 0;
        $kept = [];
        $summary = [];

        foreach ((array) $target->summary as $entry) {
            $kind = $entry['kind'] ?? 'setting';
            $key = (string) ($entry['key'] ?? '');

            if ($key === '' || isset($touchedLater[$kind.':'.$key])) {
                if ($key !== '') {
                    $kept[] = ['what' => (string) ($entry['what'] ?? 'a change'), 'by' => (string) $touchedLater[$kind.':'.$key]];
                }

                continue;
            }

            $before = $entry['before'] ?? null;
            $now = $kind === 'setting'
                ? $this->settings()->where('key', $key)->value('value')
                : $this->styles()->where('key', $key)->value('props');

            if ($kind === 'setting') {
                $before === null
                    ? $this->settings()->where('key', $key)->delete()
                    : SiteSetting::query()->updateOrCreate(['site_id' => $this->site->id, 'key' => $key], ['value' => (string) $before]);
            } else {
                filled($before)
                    ? SiteStyle::query()->updateOrCreate(['site_id' => $this->site->id, 'key' => $key], ['props' => (array) $before])
                    : $this->styles()->where('key', $key)->delete();
            }

            $summary[] = array_merge($entry, [
                'author' => $by->id,
                'author_name' => $by->name,
                'before' => $now,
                'after' => $before,
                'undid' => true,
            ]);
            $undone++;
        }

        $version = $this->recordVersion($undone, null, $by, $summary, $number);
        ReadPublishedContent::forget($this->site);
        (new SiteSnapshot($this))->write($version->number);

        return ['undone' => $undone, 'kept' => $kept, 'version' => $version->number];
    }

    /**
     * Put an earlier version back.
     *
     * Applied forward rather than by rewinding: the restore becomes the newest
     * version, so history stays append-only and going back from a bad rollback
     * is the same operation again.
     */
    public function restore(int $number, ?Person $by = null): ?int
    {
        $by ??= Person::theWebsite();

        $snapshots = new SiteSnapshot($this);
        $defaultLocale = $this->site->writtenIn();
        $snapshot = $snapshots->read($number, $defaultLocale);

        if ($snapshot === null) {
            return null;
        }

        /*
         * A restore is the complete state of a site at that version, not a
         * patch containing only the values that happened to survive until
         * then. Replaying the keys in an older snapshot left anything added
         * later behind: a hidden section, a new list order, or a customer's
         * later replacement image. The page was reported as restored while
         * still carrying the newer structural edit.
         *
         * Snapshots are written per locale with the default values filled in.
         * Rebuild the stored representation from those resolved pages: the
         * default file is canonical, and a locale-specific row is needed only
         * where that locale differs from the default. This preserves reviewed
         * translations while letting the snapshot remain the exact answer.
         */
        $desiredSettings = (array) ($snapshot['settings'] ?? []);
        foreach (array_keys($this->site->languages()) as $locale) {
            if ($locale === $defaultLocale) {
                continue;
            }

            $localized = $snapshots->read($number, $locale);
            foreach ((array) ($localized['settings'] ?? $desiredSettings) as $key => $value) {
                if (! array_key_exists($key, $desiredSettings)
                    || (string) $desiredSettings[$key] !== (string) $value) {
                    $desiredSettings[$locale.':'.$key] = (string) $value;
                }
            }
        }

        $changed = 0;

        $existingSettings = $this->settings()->get()->keyBy('key');
        foreach ($existingSettings as $key => $setting) {
            if (! array_key_exists($key, $desiredSettings)) {
                $setting->delete();
                $changed++;

                continue;
            }

            if ((string) $setting->value === (string) $desiredSettings[$key]) {
                unset($desiredSettings[$key]);

                continue;
            }

            $setting->value = (string) $desiredSettings[$key];
            $setting->save();
            unset($desiredSettings[$key]);
            $changed++;
        }

        foreach ($desiredSettings as $key => $value) {
            SiteSetting::query()->create([
                'site_id' => $this->site->id,
                'key' => $key,
                'value' => (string) $value,
            ]);
            $changed++;
        }

        $desiredStyles = (array) ($snapshot['styles'] ?? []);
        $existingStyles = $this->styles()->get()->keyBy('key');
        foreach ($existingStyles as $key => $style) {
            if (! array_key_exists($key, $desiredStyles)) {
                $style->delete();
                $changed++;

                continue;
            }

            if ((array) $style->props === (array) $desiredStyles[$key]) {
                unset($desiredStyles[$key]);

                continue;
            }

            $style->props = (array) $desiredStyles[$key];
            $style->save();
            unset($desiredStyles[$key]);
            $changed++;
        }

        foreach ($desiredStyles as $key => $props) {
            SiteStyle::query()->create([
                'site_id' => $this->site->id,
                'key' => $key,
                'props' => (array) $props,
            ]);
            $changed++;
        }

        // Pending work is not what was asked for: restoring is a decision
        // about what is live, and leaving drafts on top would undo it at once.
        // Only the restorer's own, though: a teammate's unpublished section is
        // theirs, and restoring is not a way to throw it away.
        $this->drafts()->whereIn('id', $this->ownedBy($by, $this->drafts()->get())->pluck('id'))->delete();

        $version = $this->recordVersion($changed, $number, $by);
        ReadPublishedContent::forget($this->site);
        (new SiteSnapshot($this))->write($version->number);

        return $changed;
    }

    /** Throw away this person's held changes (everything, for the website itself), and let go of their sections. */
    public function discard(?Person $by = null): int
    {
        $by ??= Person::theWebsite();
        $mine = $this->ownedBy($by, $this->drafts()->get());
        $this->drafts()->whereIn('id', $mine->pluck('id'))->delete();
        ReadPublishedContent::forget($this->site);

        $locks = new SectionLocks($this->site);
        $locks->release($by);
        $locks->moved();

        return $mine->count();
    }

    /** The newest version number, or null if this site has never published. */
    public function version(): ?int
    {
        $number = (int) $this->versions()->max('number');

        return $number > 0 ? $number : null;
    }

    /**
     * Where this site's published files live.
     *
     * Under its own slug, so one site's snapshot can never be served as
     * another's — and so a CDN can be pointed at a single site's directory.
     */
    public function snapshotDirectory(): string
    {
        return trim((string) config('live-edit.snapshot_directory', 'live-edit/content'), '/')
            .'/sites/'.$this->site->slug;
    }

    /** Where this site's uploads live. */
    public function mediaDirectory(): string
    {
        return trim((string) config('live-edit.directory', 'live-edit'), '/').'/sites/'.$this->site->slug;
    }

    private function recordVersion(int $changes, ?int $restoredFrom = null, ?Person $by = null, ?array $summary = null, ?int $undoes = null): Version
    {
        $number = (int) $this->versions()->max('number') + 1;

        return Version::query()->create([
            'site_id' => $this->site->id,
            'number' => $number,
            'locales' => [(string) config('live-edit.default_locale', 'en') => $this->settings()->count()],
            'changes' => $changes,
            'restored_from' => $restoredFrom,
            'published_by' => $by?->isSomeone() ? $by->name : null,
            'published_by_id' => $by?->id,
            'summary' => $summary,
            'undoes' => $undoes,
        ]);
    }

    /** Who a draft is written by and where it belongs, keeping what an earlier save already said. */
    private function attribution(?Person $by, ?string $unit, ?string $unitLabel): array
    {
        if ($by === null || ! $by->isSomeone()) {
            return [];
        }

        return array_filter([
            'author' => $by->id,
            'author_name' => $by->name,
            'unit' => $unit,
            'unit_label' => $unit !== null ? ($unitLabel ?: LockUnit::fallbackLabel($unit)) : null,
        ], fn ($v) => $v !== null);
    }

    /** One line of a version's record: who changed what, where, and what it was before. */
    private function summaryOf(Draft $draft, Person $by, mixed $before): array
    {
        $payload = (array) $draft->payload;

        return [
            'key' => $draft->subject,
            'kind' => $draft->kind,
            'unit' => $draft->unit,
            'label' => $draft->unit_label ?: ($draft->unit ? LockUnit::fallbackLabel($draft->unit) : null),
            'author' => $draft->author ?? $by->id,
            'author_name' => $draft->author_name ?? ($by->isSomeone() ? $by->name : null),
            'what' => $payload['what'] ?? null,
            'before' => $before,
            'after' => $draft->kind === 'setting' ? (string) ($payload['value'] ?? '') : (array) ($payload['props'] ?? []),
        ];
    }

    /** @return array<int, string> */
    private function locales(): array
    {
        // The site's own, falling back to the installation's config. See
        // Site::languages() for why one list per installation is right for a
        // self-hosted site and wrong for the service.
        return array_keys($this->site->languages());
    }

    private function settings()
    {
        return SiteSetting::query()->where('site_id', $this->site->id);
    }

    private function styles()
    {
        return SiteStyle::query()->where('site_id', $this->site->id);
    }

    private function drafts()
    {
        return Draft::query()->where('site_id', $this->site->id);
    }

    private function versions()
    {
        return Version::query()->where('site_id', $this->site->id);
    }
}
