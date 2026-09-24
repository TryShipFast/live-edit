<?php

namespace ShipFast\LiveEdit\Domain\Content;

use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Support\SnapshotUrl;

/**
 * One site's published content, written as files that never change again.
 *
 * This is what makes the promise true. A customer's pages are read far more
 * often than they are written, and reading them through this application makes
 * every visitor's page depend on this application being up and quick. A
 * snapshot is a plain file: a CDN, a build or a server renderer can take it
 * without asking anything, and if this service is down the last publish keeps
 * serving.
 *
 * It is also what makes the pricing honest — a customer served from an edge
 * costs almost nothing to keep running.
 *
 * Each site writes under its own directory, so one customer's distribution can
 * be pointed at their content and reach nothing else.
 */
class SiteSnapshot
{
    public function __construct(private readonly SiteStore $store) {}

    /**
     * Write the current published state as version $number.
     *
     * A version file is never rewritten. That is what lets a consumer cache it
     * forever and lets a rollback be a change of pointer rather than an
     * unpicking of edits.
     *
     * @return array<string, int> locales written, and how many values in each
     */
    public function write(int $number): array
    {
        $locales = [];

        foreach ($this->locales() as $locale) {
            $payload = [
                'settings' => $this->store->published($locale),
                'styles' => $this->store->publishedStyles(),
            ];

            // A version never changes once written, so it may be held for as
            // long as anyone likes.
            $this->put($this->path($number, $locale), $payload, 'public, max-age=31536000, immutable');
            $locales[$locale] = count($payload['settings']);
        }

        // The pointer is the only thing that changes in place, so a cache in
        // front of these has exactly one object to invalidate.
        // The pointer is the one thing that moves, so it is the one thing
        // that must not be held for long — this interval is how soon a publish
        // reaches the world.
        $seconds = (int) config('live-edit.api.cache.pointer_seconds', 30);

        $this->put($this->store->snapshotDirectory().'/current.json', [
            'version' => $number,
            'locales' => array_keys($locales),
            'published_at' => now()->toIso8601String(),
        ], "public, max-age={$seconds}, s-maxage={$seconds}");

        return $locales;
    }

    /**
     * Read a stored version back.
     *
     * @return array<string, mixed>|null
     */
    public function read(int $number, ?string $locale = null): ?array
    {
        $locale ??= (string) config('live-edit.default_locale', 'en');
        $path = $this->path($number, $locale);
        $disk = $this->disk();

        if (! $disk->exists($path)) {
            // A locale with no file of its own falls back to the default's,
            // which already carries every untranslated value.
            $path = $this->path($number, (string) config('live-edit.default_locale', 'en'));

            if (! $disk->exists($path)) {
                return null;
            }
        }

        $decoded = json_decode((string) $disk->get($path), true);

        return is_array($decoded) ? $decoded : null;
    }

    /** The published content a visitor should be served, or null if never published. */
    public function current(?string $locale = null): ?array
    {
        $number = $this->store->version();

        return $number === null ? null : $this->read($number, $locale);
    }

    /**
     * Where a consumer fetches this site's files.
     *
     * The path handed over is relative to the configured content directory,
     * never a disk key — passing a full key to something already addressing
     * that directory produced the directory twice, which is the first thing
     * to check if a consumer starts seeing 404s.
     */
    public function url(?int $number = null, ?string $locale = null): ?string
    {
        $relative = 'sites/'.$this->store->site->slug.'/'.($number === null
            ? 'current.json'
            : 'v'.$number.'/'.($locale ?? config('live-edit.default_locale', 'en')).'.json');

        return SnapshotUrl::for($relative);
    }

    /**
     * Write an empty pointer, so a site that has never published still answers.
     *
     * Without it the first thing a customer sees in their console is a 404
     * from us. It falls back and the page is fine — but a 404 on day one is
     * the sort of thing that makes somebody doubt the rest of it, and they are
     * right to.
     */
    public function initialise(): void
    {
        $pointer = $this->store->snapshotDirectory().'/current.json';

        if ($this->disk()->exists($pointer)) {
            return;
        }

        $seconds = (int) config('live-edit.api.cache.pointer_seconds', 30);

        $this->put($pointer, [
            'version' => 0,
            'locales' => [],
            'published_at' => null,
        ], "public, max-age={$seconds}, s-maxage={$seconds}");
    }

    /** Remove every file this site has published. */
    public function forget(): void
    {
        rescue(fn () => $this->disk()->deleteDirectory($this->store->snapshotDirectory()), null, false);
    }

    private function path(int $number, string $locale): string
    {
        return $this->store->snapshotDirectory()."/v{$number}/{$locale}.json";
    }

    /** @return array<int, string> */
    private function locales(): array
    {
        $configured = array_keys(config('live-edit.locales', []));

        return $configured === [] ? [(string) config('live-edit.default_locale', 'en')] : $configured;
    }

    /**
     * A published file is served straight from a CDN and never passes through
     * this application again, so anything not said as it is written cannot be
     * said afterwards — including how long it may be cached.
     */
    private function put(string $path, array $payload, string $cacheControl): void
    {
        $this->disk()->put(
            $path,
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ['ContentType' => 'application/json', 'CacheControl' => $cacheControl]
        );
    }

    private function disk()
    {
        return Storage::disk(config('live-edit.snapshot_disk', config('live-edit.disk', 'local')));
    }
}
