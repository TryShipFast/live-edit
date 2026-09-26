<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Support\Facades\Http;

/**
 * Free photographs, for somebody who does not have one.
 *
 * The commonest thing a client cannot do is produce a good picture. They have
 * the words; they do not have a photographer. This is the difference between
 * a site that looks finished and one that has a grey rectangle where the hero
 * should be, and it costs them nothing.
 *
 * Proxied rather than called from the page. The key would otherwise be printed
 * into every site we are installed on, where anybody could take it and spend
 * somebody else's quota — and Unsplash would rightly stop the account it
 * belonged to, which is ours.
 *
 * Credit is carried with every result and is not decoration. These are real
 * photographs by real people who let us use them on that condition.
 */
class FindPhotos
{
    public function available(): bool
    {
        return (bool) config('live-edit.photos.enabled') && filled(config('live-edit.photos.access_key'));
    }

    /**
     * @return array{photos: array<int, array<string, mixed>>, reason?: string}
     */
    public function search(string $query, int $perPage = 12): array
    {
        if (! $this->available()) {
            return ['photos' => [], 'reason' => 'not_configured'];
        }

        if (trim($query) === '') {
            return ['photos' => [], 'reason' => 'nothing_to_search_for'];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Client-ID '.config('live-edit.photos.access_key'),
                'Accept-Version' => 'v1',
            ])
                ->timeout((int) config('live-edit.photos.timeout', 15))
                ->get(rtrim((string) config('live-edit.photos.endpoint'), '/').'/search/photos', [
                    'query' => $query,
                    'per_page' => max(1, min($perPage, 30)),
                    'content_filter' => 'high',
                    // A hero is wide and a card is square; both look wrong
                    // filled with a portrait, and most stock searches return
                    // mostly portraits.
                    'orientation' => 'landscape',
                ]);
        } catch (\Throwable) {
            return ['photos' => [], 'reason' => 'unreachable'];
        }

        // A refused key and an unreachable service are different problems with
        // different answers, and saying "try again in a moment" about a key
        // that will never work sends somebody back to press the same button
        // for the rest of the afternoon.
        if ($response->status() === 401 || $response->status() === 403) {
            return ['photos' => [], 'reason' => 'not_allowed'];
        }

        if (! $response->successful()) {
            return ['photos' => [], 'reason' => 'unreachable'];
        }

        $photos = collect($response->json('results') ?? [])
            ->map(fn (array $photo) => [
                'id' => $photo['id'] ?? null,
                'thumb' => $photo['urls']['small'] ?? null,
                // Big enough for a full-width hero without being the original,
                // which can be forty megabytes.
                'full' => $photo['urls']['regular'] ?? ($photo['urls']['full'] ?? null),
                'alt' => $photo['alt_description'] ?? null,
                'by' => $photo['user']['name'] ?? null,
                'byUrl' => $photo['user']['links']['html'] ?? null,
                // Handed back so the client can tell us which one was used,
                // rather than us guessing from the URL later.
                'downloadLocation' => $photo['links']['download_location'] ?? null,
            ])
            ->filter(fn (array $photo) => $photo['full'] !== null)
            ->values()
            ->all();

        return ['photos' => $photos];
    }

    /**
     * Tell Unsplash a photo was used.
     *
     * Required by their terms, and the mechanism by which a photographer is
     * credited with a download. Best effort and never blocking: a client who
     * has chosen a picture should not wait on our bookkeeping, and should not
     * be stopped by it failing.
     */
    public function reportUse(string $downloadLocation): void
    {
        if (! $this->available() || ! str_starts_with($downloadLocation, (string) config('live-edit.photos.endpoint'))) {
            // Only addresses Unsplash gave us. Following an arbitrary one on
            // request would make this endpoint a way to have our server fetch
            // anything anybody names.
            return;
        }

        try {
            Http::withHeaders(['Authorization' => 'Client-ID '.config('live-edit.photos.access_key')])
                ->timeout(5)
                ->get($downloadLocation);
        } catch (\Throwable) {
            // Nothing to do about it and nothing to tell the client.
        }
    }
}
