<?php

namespace ShipFast\LiveEdit\Application\Api;

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
                        ? ($payload['value'] ?? '')
                        : $this->describeStyle($payload),
                    'at' => $draft->updated_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return ['changes' => $changes, 'count' => count($changes)];
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
