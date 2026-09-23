<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Imports a third-party HTML theme so it can be served live-editable.
 *
 * The theme's own assets (CSS, JS, images, fonts) keep loading from where it
 * was published by rewriting their relative URLs to absolute. Internal page
 * links (about.html, #anchors, mailto:) are deliberately left alone — making
 * those absolute would send visitors off-site, and routing them is the host's
 * decision, not the importer's.
 */
class ImportTheme extends Command
{
    protected $signature = 'live-edit:import-theme {url : URL of the theme page to import}
                            {--name= : Folder name under resources/themes (defaults to the host/dir name)}
                            {--tag : Auto-tag the imported theme for editing}';

    protected $description = 'Download an HTML theme, point its assets at the origin, and prepare it for live editing';

    /** Extensions treated as assets (absolutised); anything else is left relative. */
    protected const ASSET_EXTENSIONS = [
        'css', 'js', 'mjs', 'json', 'map',
        'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif', 'ico', 'bmp',
        'woff', 'woff2', 'ttf', 'otf', 'eot',
        'mp4', 'webm', 'ogg', 'mp3', 'wav', 'pdf',
    ];

    public function handle(): int
    {
        $url = $this->argument('url');

        try {
            $response = Http::timeout(30)->get($url);
        } catch (\Throwable $e) {
            $this->components->error('Could not fetch the theme: '.$e->getMessage());

            return self::FAILURE;
        }

        if (! $response->successful()) {
            $this->components->error("Could not fetch the theme: HTTP {$response->status()}");

            return self::FAILURE;
        }

        $base = $this->baseFor($url);
        $html = $this->absolutiseAssets($response->body(), $base);

        $name = $this->option('name') ?: $this->nameFor($url);
        $dir = resource_path('themes/'.$name);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $path = $dir.'/index.html';
        file_put_contents($path, $html);

        $this->components->info("Imported {$url} → resources/themes/{$name}/index.html");
        $this->components->info('Assets load from '.$base.'; internal page links left as-is.');

        if ($this->option('tag')) {
            $this->call('live-edit:scan', ['path' => $path, '--apply' => true, '--auto' => true]);
        } else {
            $this->line("  Next: php artisan live-edit:scan {$path} --apply --auto");
        }

        return self::SUCCESS;
    }

    /** The directory URL a relative path resolves against. */
    protected function baseFor(string $url): string
    {
        $withoutQuery = strtok($url, '?#');

        return rtrim(substr($withoutQuery, 0, strrpos($withoutQuery, '/') + 1), '/').'/';
    }

    protected function nameFor(string $url): string
    {
        $segments = array_values(array_filter(explode('/', parse_url($url, PHP_URL_PATH) ?? '')));
        array_pop($segments); // drop the filename

        return $segments === [] ? (parse_url($url, PHP_URL_HOST) ?: 'theme') : end($segments);
    }

    /**
     * Rewrite relative ASSET urls to absolute, leaving page links untouched.
     */
    public function absolutiseAssets(string $html, string $base): string
    {
        // Drop any <base> tag: it would also rebase the live-edit endpoints,
        // sending saves to the theme's origin instead of this app.
        $html = preg_replace('/<base\b[^>]*>\s*/i', '', $html);

        $attrs = 'href|src|data-src|poster|data-background|data-bg|data-background-image';
        $html = preg_replace_callback(
            '/\b('.$attrs.')=(["\'])([^"\']+)\2/i',
            fn ($m) => $m[1].'='.$m[2].$this->resolve($m[3], $base, (bool) preg_match('/^data-|^poster$/i', $m[1])).$m[2],
            $html
        );

        return preg_replace_callback(
            '/url\((["\']?)([^"\')]+)\1\)/i',
            fn ($m) => 'url('.$m[1].$this->resolve($m[2], $base, true).$m[1].')',
            $html
        );
    }

    /**
     * @param  bool  $alwaysAsset  data-background/url() values are always assets,
     *                             even without a recognisable extension.
     */
    protected function resolve(string $url, string $base, bool $alwaysAsset = false): string
    {
        $trimmed = trim($url);

        // Already absolute, root-relative, or not a fetchable location.
        // `~` delimiter: the pattern itself matches a literal `#` fragment link.
        if (preg_match('~^(https?:)?//|^/|^#|^data:|^mailto:|^tel:|^javascript:~i', $trimmed)) {
            return $url;
        }

        if (! $alwaysAsset && ! $this->isAsset($trimmed)) {
            return $url; // an internal page link — leave it relative
        }

        return $base.ltrim($trimmed, './');
    }

    protected function isAsset(string $url): bool
    {
        $path = strtok($url, '?#');
        $extension = strtolower(pathinfo((string) $path, PATHINFO_EXTENSION));

        return in_array($extension, self::ASSET_EXTENSIONS, true);
    }
}
