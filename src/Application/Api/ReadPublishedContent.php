<?php

namespace ShipFast\LiveEdit\Application\Api;

use ShipFast\LiveEdit\Domain\Content\SiteSnapshot;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Support\DraftStore;

/**
 * The content of one site, in the shape anything can render.
 *
 * Every value read here belongs to the site that asked. That is not a detail:
 * a missing scope in a multi-tenant system does not fail, it succeeds with
 * somebody else's words.
 *
 * Drafts are included only for a caller that can write — which is the editor.
 * A publishable key is in the page for every visitor, so it sees published
 * content alone; including drafts there would put a half-typed sentence on a
 * live site the moment anything cached it. Leaving them out for the editor was
 * worse and less obvious: they save, the published words come back, and it
 * looks exactly like a save that failed.
 */
class ReadPublishedContent
{
    /**
     * @return array{version: int|null, locale: string, pending: int, settings: array<string, string>, styles: array<string, mixed>}
     */
    public function __invoke(Site $site, ?string $locale = null, bool $includeDrafts = false): array
    {
        $locale ??= (string) config('live-edit.default_locale', 'en');
        $store = new SiteStore($site);

        // The published state is read from the last snapshot rather than from
        // the database. Not an optimisation for its own sake: it makes the
        // read path a file, which is the same shape a CDN, a build or another
        // framework uses — one answer to keep correct instead of one per
        // consumer. A site that has never published has no file, so the
        // database answers and nothing changes for it.
        $snapshot = (new SiteSnapshot($store))->current($locale);

        $settings = $snapshot['settings'] ?? $store->published($locale);
        $styles = $snapshot['styles'] ?? $store->publishedStyles();

        // With publishing off there is no held state, so nothing to merge and
        // nothing waiting.
        $holding = DraftStore::enabled();

        if ($holding && $includeDrafts) {
            $settings = array_merge($settings, $store->draftedSettings());
            $styles = array_merge($styles, $store->draftedStyles());
        }

        return [
            'version' => $store->version(),
            'locale' => $locale,
            // So an editor can be offered a way to release held work rather
            // than left to wonder where it went.
            'pending' => $holding ? $store->pending() : 0,
            'settings' => $settings,
            'styles' => $styles,
            // What the site will actually accept, for the panel that offers
            // it. A page rendered by this application is handed the list in
            // its layout; a static site has no layout to be handed anything
            // in, so its panel drew a control for every prop the markup named
            // and the server dropped the ones it did not recognise. Only for
            // somebody editing: a visitor has no panel.
            'styleProps' => $includeDrafts ? (array) config('live-edit.style_props') : null,
        ];
    }

    /**
     * A tag for this exact content.
     *
     * The site is part of it, so two sites can never be handed each other's
     * cached response by anything sitting in front of this.
     *
     * @param  array<string, mixed>  $payload
     */
    public function etag(Site $site, array $payload): string
    {
        $locale = (string) ($payload['locale'] ?? 'en');

        return '"'.$site->slug.'-'.$locale.'-'.self::fingerprint($payload).'"';
    }

    /**
     * A short token that changes whenever the content does.
     *
     * Consumers cache whole rendered pages, and a version number is not enough
     * to tell them when to stop: a site with publishing off changes its words
     * without ever moving a version, so anything keyed on the version alone
     * serves yesterday's page until its timer runs out.
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
