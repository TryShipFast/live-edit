<?php

namespace ShipFast\LiveEdit\Domain\Content;

use ShipFast\LiveEdit\Domain\Site\Site;
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

    /** Write a value, held back as a draft when the site publishes deliberately. */
    public function put(string $key, string $value, bool $hold): void
    {
        if ($hold) {
            Draft::query()->updateOrCreate(
                ['site_id' => $this->site->id, 'kind' => 'setting', 'subject' => $key],
                ['payload' => ['value' => $value]]
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
    public function putStyle(string $key, array $props, bool $hold): void
    {
        if ($hold) {
            Draft::query()->updateOrCreate(
                ['site_id' => $this->site->id, 'kind' => 'style', 'subject' => $key],
                ['payload' => ['props' => $props]]
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
     * @return array{published: int, version: int}
     */
    public function publish(): array
    {
        $drafts = $this->drafts()->get();

        foreach ($drafts as $draft) {
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
        $this->drafts()->delete();

        $version = $this->recordVersion($count);

        // Written after the drafts are applied, so the file holds what is now
        // live rather than what was about to be.
        (new SiteSnapshot($this))->write($version->number);

        return ['published' => $count, 'version' => $version->number];
    }

    /**
     * Put an earlier version back.
     *
     * Applied forward rather than by rewinding: the restore becomes the newest
     * version, so history stays append-only and going back from a bad rollback
     * is the same operation again.
     */
    public function restore(int $number): ?int
    {
        $snapshot = (new SiteSnapshot($this))->read($number);

        if ($snapshot === null) {
            return null;
        }

        $changed = 0;

        foreach (($snapshot['settings'] ?? []) as $key => $value) {
            $existing = $this->settings()->where('key', $key)->value('value');

            if ((string) $existing === (string) $value) {
                continue;
            }

            SiteSetting::query()->updateOrCreate(
                ['site_id' => $this->site->id, 'key' => $key],
                ['value' => (string) $value]
            );
            $changed++;
        }

        foreach (($snapshot['styles'] ?? []) as $key => $props) {
            SiteStyle::query()->updateOrCreate(
                ['site_id' => $this->site->id, 'key' => $key],
                ['props' => $props]
            );
        }

        // Pending work is not what was asked for: restoring is a decision
        // about what is live, and leaving drafts on top would undo it at once.
        $this->drafts()->delete();

        $version = $this->recordVersion($changed, $number);
        (new SiteSnapshot($this))->write($version->number);

        return $changed;
    }

    public function discard(): int
    {
        $count = $this->pending();
        $this->drafts()->delete();

        return $count;
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

    private function recordVersion(int $changes, ?int $restoredFrom = null): Version
    {
        $number = (int) $this->versions()->max('number') + 1;

        return Version::query()->create([
            'site_id' => $this->site->id,
            'number' => $number,
            'locales' => [(string) config('live-edit.default_locale', 'en') => $this->settings()->count()],
            'changes' => $changes,
            'restored_from' => $restoredFrom,
        ]);
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
