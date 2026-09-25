<?php

namespace ShipFast\LiveEdit\Domain\Content;

use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Models\SiteStyle;
use ShipFast\LiveEdit\Support\KeyMigrator;

/**
 * A client's work follows its element when the scanner renames it.
 *
 * An auto key describes an element rather than naming it, so improving the
 * scanner can hand the same element a different key — and everything stored
 * under the old one is orphaned. Nothing errors. The page goes back to the
 * theme's own words, weeks after anybody made a change, and the client
 * concludes the product lost their work. Causing that by improving the scanner
 * would be the worst possible way to lose a customer, and the scanner will
 * keep improving.
 *
 * A site tagged as it loads has no previous file to diff, so it remembers what
 * it handed out last time. An element is recognisable across a re-tag by what
 * the THEME put in it — content is applied when a page is served and never
 * written back, so a client can replace every word of an element and its
 * signature is unchanged.
 *
 * Runs only when the names actually move, which is almost never: the ordinary
 * page view costs a hash and a comparison.
 */
class CarryContentAcrossRetag
{
    /**
     * @return array{moved: int, changed: bool}
     */
    public function __invoke(SiteStore $store, string $page, string $taggedHtml): array
    {
        $index = $this->flatten(KeyMigrator::indexOf($taggedHtml));

        if ($index === []) {
            return ['moved' => 0, 'changed' => false];
        }

        $fingerprint = hash('sha256', json_encode($index));
        $remembered = KeyMap::query()
            ->where('site_id', $store->site->id)
            ->where('page', $page)
            ->first();

        if ($remembered && $remembered->fingerprint === $fingerprint) {
            return ['moved' => 0, 'changed' => false];
        }

        $moved = $remembered ? $this->carry($store, (array) $remembered->map, $index) : 0;

        KeyMap::query()->updateOrCreate(
            ['site_id' => $store->site->id, 'page' => $page],
            ['fingerprint' => $fingerprint, 'map' => $index],
        );

        return ['moved' => $moved, 'changed' => true];
    }

    /**
     * One key per element per marker, flattened so a signature that carries
     * both words and a link keeps them apart.
     *
     * @param  array<string, array<string, string>>  $index
     * @return array<string, string>
     */
    protected function flatten(array $index): array
    {
        $flat = [];

        foreach ($index as $signature => $attributes) {
            foreach ($attributes as $attribute => $key) {
                $flat[$signature.'|'.$attribute] = $key;
            }
        }

        return $flat;
    }

    /**
     * Move stored content from the old name to the new one, for every element
     * still recognisable in both.
     *
     * @param  array<string, string>  $was
     * @param  array<string, string>  $now
     */
    protected function carry(SiteStore $store, array $was, array $now): int
    {
        $moves = [];

        foreach ($was as $signature => $oldKey) {
            $newKey = $now[$signature] ?? null;

            if ($newKey !== null && $newKey !== $oldKey) {
                $moves[$oldKey] = $newKey;
            }
        }

        if ($moves === []) {
            return 0;
        }

        $moved = 0;

        // Two passes through a parking name, because a key being moved onto
        // may still be in use by another row until that row has moved. One
        // pass would have them overwrite each other.
        foreach ([true, false] as $parking) {
            foreach ($moves as $old => $new) {
                [$from, $to] = $parking ? [$old, '~moving~'.$new] : ['~moving~'.$new, $new];

                $moved += $this->rename($store, $from, $to);
            }
        }

        return $moved;
    }

    /** Everything stored against one key: its value, its drafts, its style. */
    protected function rename(SiteStore $store, string $from, string $to): int
    {
        $site = $store->site->id;
        $moved = 0;

        $moved += SiteSetting::query()->where('site_id', $site)->where('key', $from)->update(['key' => $to]);

        // A picture carries its description beside it, under its own name with
        // a suffix, and each locale keeps its own copy of everything.
        foreach (['Alt', 'Title', 'Credit', 'Href'] as $suffix) {
            SiteSetting::query()->where('site_id', $site)->where('key', $from.$suffix)->update(['key' => $to.$suffix]);
            Draft::query()->where('site_id', $site)->where('kind', 'setting')->where('subject', $from.$suffix)->update(['subject' => $to.$suffix]);
        }

        foreach (SiteSetting::query()->where('site_id', $site)->where('key', 'like', '%:'.$from)->get() as $row) {
            $row->update(['key' => str_replace(':'.$from, ':'.$to, $row->key)]);
            $moved++;
        }

        $moved += Draft::query()->where('site_id', $site)->where('kind', 'setting')->where('subject', $from)->update(['subject' => $to]);
        $moved += SiteStyle::query()->where('site_id', $site)->where('key', $from)->update(['key' => $to]);
        $moved += Draft::query()->where('site_id', $site)->where('kind', 'style')->where('subject', $from)->update(['subject' => $to]);

        return $moved;
    }
}
