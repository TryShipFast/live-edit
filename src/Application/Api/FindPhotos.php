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
 * Two libraries, because asking for a key is itself a way of not having a
 * picture. Unsplash has the better photographs and needs an application
 * registered before it will answer at all; Openverse needs nothing, and
 * covers Flickr, Wikimedia and the rest of the commons. So a site with a key
 * gets Unsplash and a site without one still gets photographs, rather than a
 * message explaining that somebody has to go and sign up for something.
 *
 * Proxied rather than called from the page, for the same reason in both cases:
 * a key printed into every site we are installed on is a key anybody can take
 * and spend, and the account it belongs to is ours.
 *
 * Credit is carried with every result and is not decoration. These are real
 * photographs by real people who let us use them on that condition, and under
 * a Creative Commons licence naming them is the condition.
 */
class FindPhotos
{
    public function available(): bool
    {
        return (bool) config('live-edit.photos.enabled') && $this->provider() !== null;
    }

    /**
     * Which library will answer.
     *
     * Openverse is the floor rather than the fallback: it is always there, so
     * "no photographs available" stops being a state this product can be in.
     */
    public function provider(): ?string
    {
        $asked = (string) config('live-edit.photos.provider', 'auto');

        if ($asked === 'unsplash') {
            return $this->unsplashKey() !== '' ? 'unsplash' : null;
        }

        if ($asked === 'openverse') {
            return 'openverse';
        }

        return $this->unsplashKey() !== '' ? 'unsplash' : 'openverse';
    }

    /**
     * @return array{photos: array<int, array<string, mixed>>, reason?: string, source?: string}
     */
    public function search(string $query, int $perPage = 12): array
    {
        $provider = $this->provider();

        if (! config('live-edit.photos.enabled') || $provider === null) {
            return ['photos' => [], 'reason' => 'not_configured'];
        }

        if (trim($query) === '') {
            return ['photos' => [], 'reason' => 'nothing_to_search_for'];
        }

        $found = $provider === 'unsplash'
            ? $this->fromUnsplash($query, $perPage)
            : $this->fromOpenverse($query, $perPage);

        /*
         * A refused Unsplash key does not have to be the client's problem.
         *
         * They cannot fix it, they did not cause it, and the alternative
         * library is right there and needs nothing. So a key that stops
         * working degrades to Openverse rather than to an empty dialog, and
         * the site owner is the one who finds out, from the logs.
         */
        if (($found['reason'] ?? null) === 'not_allowed' && (string) config('live-edit.photos.provider', 'auto') === 'auto') {
            report(new \RuntimeException('live-edit: the Unsplash key was refused; falling back to Openverse.'));

            return $this->fromOpenverse($query, $perPage);
        }

        return $found;
    }

    /**
     * @return array{photos: array<int, array<string, mixed>>, reason?: string, source?: string}
     */
    protected function fromUnsplash(string $query, int $perPage): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Client-ID '.$this->unsplashKey(),
                'Accept-Version' => 'v1',
            ])
                ->timeout($this->timeout())
                ->get($this->base('unsplash').'/search/photos', [
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
                // Their guidelines ask for the referral parameters on both
                // links. It is how a photographer sees that the traffic came
                // from somebody using their picture, which is most of what
                // they get out of this.
                'byUrl' => isset($photo['user']['links']['html'])
                    ? $this->referred($photo['user']['links']['html'])
                    : null,
                'credit' => isset($photo['user']['name'])
                    ? 'Photo by '.$photo['user']['name'].' on Unsplash'
                    : 'Unsplash',
                'source' => 'Unsplash',
                'sourceUrl' => $this->referred('https://unsplash.com'),
                // Named so whoever is choosing knows what the picture asks of
                // them before they choose it.
                'requires' => 'credit',
                // Handed back so the client can tell us which one was used,
                // rather than us guessing from the URL later.
                'downloadLocation' => $photo['links']['download_location'] ?? null,
            ])
            ->filter(fn (array $photo) => $photo['full'] !== null)
            ->values()
            ->all();

        return ['photos' => $photos, 'source' => 'unsplash'];
    }

    /**
     * @return array{photos: array<int, array<string, mixed>>, reason?: string, source?: string}
     */
    protected function fromOpenverse(string $query, int $perPage): array
    {
        try {
            $response = Http::timeout($this->timeout())
                ->get($this->base('openverse').'/v1/images/', [
                    'q' => $query,
                    'page_size' => max(1, min($perPage, 20)),
                    // Only what a business may actually put on its website.
                    // A picture somebody cannot legally use is worse than no
                    // picture, because they will not find out from us.
                    'license_type' => 'commercial,modification',
                    'mature' => 'false',
                    'aspect_ratio' => 'wide',
                ]);
        } catch (\Throwable) {
            return ['photos' => [], 'reason' => 'unreachable'];
        }

        if (! $response->successful()) {
            return ['photos' => [], 'reason' => 'unreachable'];
        }

        $photos = collect($response->json('results') ?? [])
            ->map(fn (array $photo) => [
                'id' => $photo['id'] ?? null,
                'thumb' => $photo['thumbnail'] ?? ($photo['url'] ?? null),
                'full' => $photo['url'] ?? null,
                'alt' => $photo['title'] ?? null,
                'by' => $photo['creator'] ?? null,
                'byUrl' => $photo['creator_url'] ?? ($photo['foreign_landing_url'] ?? null),
                'credit' => $this->commonsCredit($photo),
                'source' => ucfirst((string) ($photo['source'] ?? 'Openverse')),
                // The licence itself, which is what a reader needs to follow
                // to know what they in turn may do with it.
                'sourceUrl' => $photo['license_url'] ?? ($photo['foreign_landing_url'] ?? null),
                // Public domain asks for nothing. Everything else asks to be
                // credited where the picture appears, and somebody choosing
                // deserves to know which they are picking.
                'requires' => strtoupper((string) ($photo['license'] ?? '')) === 'CC0' ? 'nothing' : 'credit',
                // Openverse has no download endpoint to report to, and asks
                // for attribution instead, which travels with the picture.
                'downloadLocation' => null,
            ])
            ->filter(fn (array $photo) => $photo['full'] !== null && $photo['by'] !== null)
            ->values()
            ->all();

        return ['photos' => $photos, 'source' => 'openverse'];
    }

    /**
     * The sentence a Creative Commons licence asks to appear beside the work.
     *
     * Name and licence, both, because "Photo by someone" satisfies nobody:
     * under CC the licence is part of the credit, and it is the part that
     * tells the next person what they may do with it.
     *
     * @param  array<string, mixed>  $photo
     */
    protected function commonsCredit(array $photo): string
    {
        $by = $photo['creator'] ?? 'an unnamed photographer';
        $licence = strtoupper((string) ($photo['license'] ?? ''));
        $version = (string) ($photo['license_version'] ?? '');

        if ($licence === '' || $licence === 'CC0') {
            return $licence === 'CC0'
                ? "Photo by {$by} (public domain)"
                : "Photo by {$by}";
        }

        return trim("Photo by {$by} (CC {$licence} {$version})");
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
        if ($this->unsplashKey() === '' || ! str_starts_with($downloadLocation, $this->base('unsplash'))) {
            // Only addresses Unsplash gave us. Following an arbitrary one on
            // request would make this endpoint a way to have our server fetch
            // anything anybody names.
            return;
        }

        try {
            Http::withHeaders(['Authorization' => 'Client-ID '.$this->unsplashKey()])
                ->timeout(5)
                ->get($downloadLocation);
        } catch (\Throwable) {
            // Nothing to do about it and nothing to tell the client.
        }
    }

    /**
     * A link back, marked as coming from us.
     *
     * Unsplash asks for these parameters on every link in an attribution. It
     * is not tracking for its own sake: it is how a photographer can see that
     * somebody used their work, which is the whole of what they are paid in.
     */
    protected function referred(string $url): string
    {
        $app = (string) (config('live-edit.photos.unsplash.app_name') ?? 'live-edit');

        return $url.(str_contains($url, '?') ? '&' : '?').http_build_query([
            'utm_source' => $app,
            'utm_medium' => 'referral',
        ]);
    }

    protected function unsplashKey(): string
    {
        return (string) (config('live-edit.photos.unsplash.access_key') ?? config('live-edit.photos.access_key') ?? '');
    }

    protected function base(string $provider): string
    {
        $configured = config("live-edit.photos.{$provider}.endpoint")
            ?? ($provider === 'unsplash' ? config('live-edit.photos.endpoint') : null);

        return rtrim((string) $configured, '/');
    }

    protected function timeout(): int
    {
        return (int) config('live-edit.photos.timeout', 15);
    }
}
