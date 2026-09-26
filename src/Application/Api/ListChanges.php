<?php

namespace ShipFast\LiveEdit\Application\Api;

use ShipFast\LiveEdit\Domain\Content\Companions;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\Draft;

/**
 * Everything somebody has changed and not yet published.
 *
 * The editor could already say how many there were and nothing else, which is
 * the least useful half of the answer: "3 unpublished changes" invites exactly
 * one question — which three — and had no way to answer it. Somebody who
 * cannot see what they changed cannot tell a save that worked from a save that
 * went to the wrong element, and their only remedy is to publish and look.
 *
 * Each row carries what the page said before and what it will say after, so
 * the list is readable without opening anything.
 */
class ListChanges
{
    /**
     * @return array{changes: array<int, array<string, mixed>>, count: int}
     */
    public function __invoke(Site $site): array
    {
        $store = new SiteStore($site);
        $published = $store->published();

        $changes = Draft::query()
            ->where('site_id', $site->id)
            ->orderByDesc('updated_at')
            ->get()
            /*
             * One picture edit is one change, not seven.
             *
             * Replacing a photograph writes the address, the description, the
             * tooltip and four fields of credit, each its own setting so that
             * a theme can read them by name. Listed separately they bury
             * everything else somebody actually did, and "Text: Photo by
             * Jefferson Santos on Unsplash" is not a change anybody made on
             * purpose or would know how to revert.
             */
            ->reject(fn (Draft $draft) => $draft->kind === 'setting' && $this->belongsToAPicture($site, $draft->subject))
            ->map(function (Draft $draft) use ($published) {
                $payload = (array) $draft->payload;

                return [
                    'key' => $draft->subject,
                    'kind' => $draft->kind,
                    // The published value, or null when this element has never
                    // been changed — in which case what it says now is the
                    // theme's own words, which only the page knows.
                    'before' => $draft->kind === 'setting' ? ($published[$draft->subject] ?? null) : null,
                    'after' => $draft->kind === 'setting'
                        ? $this->readably($payload['value'] ?? '', $published[$draft->subject] ?? null)
                        : $this->describeStyle($payload),
                    'at' => $draft->updated_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return ['changes' => $changes, 'count' => count($changes)];
    }

    /**
     * A saved value, said the way a person would say it.
     *
     * A list of things is stored as one setting holding the ORDER OF ITS ITEM
     * IDS, because that is what survives being published and reverted as a
     * single change. Printed straight into the Changes tab it read
     * ["nmuiimroh","i1","i2"] — and describing it as "3 items: nmuiimroh, i1,
     * i2" is no better, because those are names the editor made up for its own
     * use and nobody has ever seen them.
     *
     * What somebody wants to know about a list is what happened to it. So it
     * is compared with what is published and reported as the difference.
     */
    protected function readably(mixed $value, mixed $before = null): string
    {
        $items = $this->asList($value);

        if ($items === null) {
            return (string) $value;
        }

        $had = $this->asList($before);
        $now = count($items);

        if ($had === null) {
            return $now === 1 ? 'A list of 1 item' : "A list of {$now} items";
        }

        $was = count($had);

        if ($now > $was) {
            return $this->many($now - $was, 'item').' added, leaving '.$this->many($now, 'item');
        }

        if ($now < $was) {
            return $this->many($was - $now, 'item').' removed, leaving '.$this->many($now, 'item');
        }

        return $items === $had ? 'The list is unchanged' : 'The order changed';
    }

    protected function many(int $count, string $noun): string
    {
        return $count.' '.($count === 1 ? $noun : $noun.'s');
    }

    /**
     * @return array<int, mixed>|null
     */
    protected function asList(mixed $value): ?array
    {
        if (! is_string($value) || ! str_starts_with(trim($value), '[')) {
            return null;
        }

        $items = json_decode($value, true);

        return is_array($items) ? $items : null;
    }

    /**
     * Whether this key is one of a picture's companions rather than an edit
     * of its own.
     *
     * The suffixes are the ones the media endpoint writes. Matched only when
     * a key without the suffix also exists as a draft or a published setting,
     * so a page whose own content key genuinely ends in "Title" is not
     * quietly dropped from somebody's list of changes.
     */
    protected function belongsToAPicture(Site $site, string $subject): bool
    {
        foreach (Companions::ALL as $suffix) {
            if (! str_ends_with($subject, $suffix)) {
                continue;
            }

            $picture = substr($subject, 0, -strlen($suffix));

            if ($picture === '') {
                continue;
            }

            $isPicture = Draft::query()
                ->where('site_id', $site->id)
                ->where('kind', 'setting')
                ->where('subject', $picture)
                ->exists();

            if ($isPicture) {
                return true;
            }
        }

        return false;
    }

    /**
     * A style change, said in words.
     *
     * Nobody reading a list of their own edits wants to be shown
     * {"background":"#0B0C0F"}. The names are the ones the panel uses, so what
     * the list calls a thing is what the control called it.
     *
     * @param  array<string, mixed>  $payload
     */
    protected function describeStyle(array $payload): string
    {
        $props = (array) ($payload['props'] ?? []);

        if ($props === []) {
            return 'Styling cleared';
        }

        $names = [
            'background' => 'Background colour',
            'backgroundImage' => 'Background picture',
            'textColor' => 'Text colour',
            'fontSize' => 'Text size',
            'paddingY' => 'Space above and below',
            'paddingX' => 'Space left and right',
            'radius' => 'Corner rounding',
            'hidden' => 'Hidden',
        ];

        return collect($props)
            ->keys()
            ->map(fn ($prop) => $names[$prop] ?? $prop)
            ->join(', ', ' and ');
    }
}
