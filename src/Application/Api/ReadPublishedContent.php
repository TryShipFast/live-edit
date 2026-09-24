<?php

namespace ShipFast\LiveEdit\Application\Api;

use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Support\DraftStore;
use ShipFast\LiveEdit\Support\PublishedContent;
use ShipFast\LiveEdit\Support\Snapshot;

/**
 * The published content of a site, in the shape anything can render.
 *
 * Note what this deliberately does not do: consult drafts. Unpublished work
 * belongs to the editor and to whoever holds a preview link, and this endpoint
 * answers the open internet. An API that quietly included drafts would put a
 * half-typed sentence on a customer's live site the moment they cached it.
 */
class ReadPublishedContent
{
    /**
     * @return array{version: int|null, locale: string, settings: array<string, string>, styles: array<string, mixed>}
     */
    public function __invoke(Site $site, ?string $locale = null): array
    {
        $locale ??= (string) config('live-edit.default_locale', 'en');

        // Which store is "live" depends on whether the site holds changes
        // back. With publishing on, the snapshot is live and a save is a draft
        // that nobody sees until it is released. With publishing off there is
        // no held state — a save IS live — so reading the last snapshot would
        // report success and then serve the old words, which is the silent
        // failure this endpoint exists to avoid.
        if (! DraftStore::enabled()) {
            $composed = Snapshot::compose($locale);

            return [
                'version' => PublishedContent::version(),
                'locale' => $locale,
                'settings' => $composed['settings'] ?? [],
                'styles' => $composed['styles'] ?? [],
            ];
        }

        return [
            'version' => PublishedContent::version(),
            'locale' => $locale,
            'settings' => PublishedContent::settings($locale),
            'styles' => PublishedContent::styles($locale),
        ];
    }

    /**
     * A tag for this exact content.
     *
     * With publishing on, the version is enough: a version never changes once
     * written, so two responses with the same number are the same bytes, and
     * nothing has to be hashed to know it.
     *
     * With publishing off there is no version to move — a save goes straight
     * to live content — so the tag is taken from the content itself. Reusing
     * the version there would hand every cache a tag that never changes while
     * the words underneath it do, and the site would appear frozen.
     *
     * @param  array<string, mixed>  $payload
     */
    public function etag(Site $site, array $payload): string
    {
        $locale = (string) ($payload['locale'] ?? 'en');

        if (DraftStore::enabled()) {
            return '"'.$site->slug.'-v'.((int) ($payload['version'] ?? 0)).'-'.$locale.'"';
        }

        return '"'.$site->slug.'-'.$locale.'-'.self::fingerprint($payload).'"';
    }

    /**
     * A short token that changes whenever the content does.
     *
     * Consumers cache whole rendered pages, and a version number is not enough
     * to tell them when to stop: a site with publishing off changes its words
     * without ever moving a version, so anything keyed on the version alone
     * serves yesterday's page until its timer runs out. This moves on every
     * change, in either mode.
     *
     * @param  array<string, mixed>  $payload
     */
    public static function fingerprint(array $payload): string
    {
        return substr(hash('xxh128', json_encode([
            $payload['settings'] ?? [],
            $payload['styles'] ?? [],
        ])), 0, 16);
    }
}
