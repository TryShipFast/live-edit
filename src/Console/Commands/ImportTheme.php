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
                            {--tag : Auto-tag the imported theme for editing}
                            {--pages=40 : Most pages to follow from the theme\'s own links}
                            {--single : Import only the page given, not the rest of the theme}';

    protected $description = 'Download an HTML theme, point its assets at the origin, and prepare it for live editing';

    /** Extensions treated as assets (absolutised); anything else is left relative. */
    /** How far to follow a chain of @imports before giving up. */
    protected const MAX_IMPORT_DEPTH = 4;

    /** Stylesheet URL => local filename, so a shared import is fetched once. */
    protected array $copied = [];

    protected const ASSET_EXTENSIONS = [
        'css', 'js', 'mjs', 'json', 'map',
        'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif', 'ico', 'bmp',
        'woff', 'woff2', 'ttf', 'otf', 'eot',
        'mp4', 'webm', 'ogg', 'mp3', 'wav', 'pdf',
    ];

    public function handle(): int
    {
        $url = $this->argument('url');
        $base = $this->baseFor($url);
        $name = $this->option('name') ?: $this->nameFor($url);

        $dir = resource_path('themes/'.$name);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // A bought template is a set of pages that link to each other, so the
        // theme's own navigation says which ones belong to it. Importing only
        // the page named would leave every link in that navigation broken.
        $limit = $this->option('single') ? 1 : max(1, (int) $this->option('pages'));
        $queue = [$url];
        $seen = [];
        $imported = [];

        while ($queue !== [] && count($imported) < $limit) {
            $next = array_shift($queue);
            if (isset($seen[$next])) {
                continue;
            }
            $seen[$next] = true;

            $body = $this->fetchPage($next);
            if ($body === null) {
                continue;
            }

            $html = $this->mirrorStylesheets($this->absolutiseAssets($body, $base), $name);
            $slug = $imported === [] ? 'index' : $this->slugFor($next);
            file_put_contents($dir.'/'.$slug.'.html', $html);
            $imported[$slug] = $next;

            if (! $this->option('single')) {
                foreach ($this->pageLinksIn($body, $base) as $link) {
                    if (! isset($seen[$link])) {
                        $queue[] = $link;
                    }
                }
            }
        }

        if ($imported === []) {
            $this->components->error('Could not fetch the theme.');

            return self::FAILURE;
        }

        $path = $dir.'/index.html';

        $this->components->info('Imported '.count($imported).' page(s) → resources/themes/'.$name.'/');
        $this->line('  '.implode(', ', array_map(fn (string $slug) => $slug.'.html', array_keys($imported))));
        $this->components->info('Assets load from '.$base.'; internal page links left as-is.');
        $this->components->info('Stylesheets are copied into public/theme-assets/'.$name.'.');
        if (count($imported) >= $limit && $queue !== []) {
            $this->components->warn('Stopped at '.$limit.' pages; raise --pages to take the rest.');
        }

        if ($this->option('tag')) {
            $this->call('live-edit:scan', ['path' => $dir, '--apply' => true, '--auto' => true]);
        } else {
            $this->line("  Next: php artisan live-edit:scan {$path} --apply --auto");
        }

        return self::SUCCESS;
    }

    /**
     * Copy the theme's stylesheets into this site and point the page at them.
     *
     * A real customer unzips a bought template into their own site, so its CSS
     * is served from their own domain. Leaving the stylesheets on the vendor's
     * server is a demo shortcut that breaks things the browser only permits
     * same-origin: reading the theme's icon set for the picker is one, and the
     * vendor could change or withdraw the file at any time.
     *
     * Only the stylesheet itself is copied. The fonts and images it references
     * are rewritten to absolute URLs so they still resolve from the origin.
     */
    protected function mirrorStylesheets(string $html, string $name): string
    {
        $dir = public_path('theme-assets/'.$name);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return preg_replace_callback('/<link\b[^>]*>/i', function (array $match) use ($dir, $name) {
            $tag = $match[0];
            if (! preg_match('/rel=(["\'])\s*stylesheet\s*\1/i', $tag)) {
                return $tag;
            }
            if (! preg_match('/href=(["\'])(https?:\/\/[^"\']+)\1/i', $tag, $href)) {
                return $tag;
            }

            $local = $this->fetchStylesheet($href[2], $dir, $name);

            return $local === null ? $tag : str_replace($href[0], 'href="/theme-assets/'.$name.'/'.$local.'"', $tag);
        }, $html);
    }

    /**
     * Download one stylesheet, returning the filename written, or null.
     *
     * Stylesheets it @imports are copied too. Themes routinely keep their icon
     * font in a separate file pulled in this way, and an imported sheet left on
     * the vendor's server is just as unreadable as a linked one.
     */
    protected function fetchStylesheet(string $url, string $dir, string $name, int $depth = 0): ?string
    {
        if (isset($this->copied[$url])) {
            return $this->copied[$url];
        }

        try {
            $response = Http::timeout(30)->get($url);
        } catch (\Throwable) {
            return null;
        }

        if (! $response->successful()) {
            $this->components->warn('Could not copy '.$url.'; it will keep loading from the origin.');

            return null;
        }

        $base = $this->baseFor($url);

        // Imports are followed first; each becomes a root-relative path, which
        // the url() pass below then knows to leave alone.
        $css = preg_replace_callback(
            '/@import\s+(?:url\(\s*(["\']?)([^"\')]+)\1\s*\)|(["\'])([^"\']+)\3)/i',
            function (array $m) use ($base, $dir, $name, $depth) {
                $target = $this->resolve(trim($m[2] !== '' ? $m[2] : $m[4]), $base, true);
                $local = $depth < self::MAX_IMPORT_DEPTH ? $this->fetchStylesheet($target, $dir, $name, $depth + 1) : null;

                return '@import url("'.($local === null ? $target : '/theme-assets/'.$name.'/'.$local).'")';
            },
            $response->body()
        );

        // Whatever the sheet points at is copied too. Fonts are the reason:
        // a browser refuses to use a webfont from another origin unless that
        // origin opts in, and a theme vendor's server does not, so a hot-linked
        // icon font renders as empty boxes no matter what else is correct.
        $css = preg_replace_callback(
            '/\burl\((["\']?)([^"\')]+)\1\)/i',
            function (array $m) use ($base, $dir, $name) {
                $target = trim($m[2]);
                if ($target === '' || str_starts_with($target, 'data:')) {
                    return $m[0];
                }
                $absolute = $this->resolve($target, $base, true);
                $local = $this->fetchAsset($absolute, $dir);

                return 'url('.$m[1].($local === null ? $absolute : '/theme-assets/'.$name.'/'.$local).$m[1].')';
            },
            $css
        );

        // Two sheets can share a basename, so the address decides the filename.
        $file = substr(md5($url), 0, 8).'-'.$this->fileNameFor($url);
        file_put_contents($dir.'/'.$file, $css);
        $this->copied[$url] = $file;

        return $file;
    }

    /**
     * Copy one file a stylesheet references, returning its local filename.
     *
     * Returns null when it cannot be had, leaving the original address in place
     * so the sheet is never left pointing at nothing.
     */
    protected function fetchAsset(string $url, string $dir): ?string
    {
        if (isset($this->copied[$url])) {
            return $this->copied[$url];
        }

        if (! preg_match('~^https?://~i', $url)) {
            return null;
        }

        try {
            $response = Http::timeout(30)->get($url);
        } catch (\Throwable) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $name = preg_replace('/[^A-Za-z0-9._-]/', '', basename((string) strtok($url, '?#'))) ?: 'asset';
        $file = substr(md5($url), 0, 8).'-'.$name;
        file_put_contents($dir.'/'.$file, $response->body());
        $this->copied[$url] = $file;

        return $file;
    }

    /** A safe local filename for a stylesheet URL, always ending in .css. */
    protected function fileNameFor(string $url): string
    {
        $name = basename((string) strtok($url, '?#'));
        $name = preg_replace('/[^A-Za-z0-9._-]/', '', $name) ?: 'style';

        return str_ends_with(strtolower($name), '.css') ? $name : $name.'.css';
    }

    /** Fetch one page, or null if it cannot be had. */
    protected function fetchPage(string $url): ?string
    {
        try {
            $response = Http::timeout(30)->get($url);
        } catch (\Throwable $e) {
            $this->components->warn('Skipped '.$url.': '.$e->getMessage());

            return null;
        }

        if (! $response->successful()) {
            $this->components->warn('Skipped '.$url.': HTTP '.$response->status());

            return null;
        }

        return $response->body();
    }

    /**
     * The theme's own pages linked from this one.
     *
     * Only siblings of the page imported: a theme keeps its pages together, and
     * anything outside that directory belongs to the vendor's site rather than
     * to the template.
     */
    protected function pageLinksIn(string $html, string $base): array
    {
        preg_match_all('/<a\b[^>]*\bhref=(["\'])([^"\']+)\1/i', $html, $matches);

        $links = [];
        foreach ($matches[2] as $href) {
            $href = trim($href);
            if ($href === '' || str_starts_with($href, '#') || preg_match('~^[a-z]+:~i', $href)) {
                continue;
            }
            $path = strtok($href, '?#');
            if (! preg_match('/^[A-Za-z0-9._-]+\.html?$/i', (string) $path)) {
                continue;
            }
            $links[$base.$path] = true;
        }

        return array_keys($links);
    }

    /** A filename for an imported page, taken from its own address. */
    protected function slugFor(string $url): string
    {
        $name = pathinfo((string) strtok($url, '?#'), PATHINFO_FILENAME);

        return preg_replace('/[^A-Za-z0-9_-]/', '', $name) ?: 'page';
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

        return $this->join($base, $trimmed);
    }

    /**
     * Join a relative URL onto a base directory, honouring "../".
     *
     * Icon fonts are the reason this has to be right: Font Awesome's stylesheet
     * sits in css/ and points at ../webfonts/, so treating "../" as noise sends
     * every glyph to a 404 and the theme renders empty boxes.
     */
    protected function join(string $base, string $relative): string
    {
        $root = preg_match('~^(https?://[^/]+)~i', $base, $match) ? $match[1] : '';
        $path = substr($base, strlen($root));

        while (str_starts_with($relative, '../')) {
            $relative = substr($relative, 3);
            $parent = rtrim($path, '/');
            $cut = strrpos($parent, '/');
            if ($cut === false) {
                // Already at the site root; there is nowhere further to climb.
                break;
            }
            $path = substr($parent, 0, $cut + 1);
        }

        return $root.$path.ltrim($relative, './');
    }

    protected function isAsset(string $url): bool
    {
        $path = strtok($url, '?#');
        $extension = strtolower(pathinfo((string) $path, PATHINFO_EXTENSION));

        return in_array($extension, self::ASSET_EXTENSIONS, true);
    }
}
