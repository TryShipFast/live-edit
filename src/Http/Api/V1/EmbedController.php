<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\LiveEdit;
use Symfony\Component\HttpFoundation\Response;

/**
 * Serves the editor's own files, so a customer never copies one.
 *
 * Four files copied by hand into a site is a version nobody can update,
 * multiplied by every customer — and the first release after that is a support
 * request from all of them at once. Served from here, a customer pastes one
 * line and stops thinking about it.
 */
class EmbedController
{
    /**
     * The release these files belong to, for people rather than for browsers.
     */
    public const VERSION = '0.2.0';

    /** Computed once per process; the files cannot change under a running one. */
    private static ?string $fingerprint = null;

    /**
     * The files that may be asked for.
     *
     * An allow-list rather than a path: this endpoint takes a name from the
     * URL, and anything that turns a URL into a file path without a list is
     * one traversal away from serving whatever it can read.
     */
    private const FILES = [
        'embed.js' => 'boot.js',
        'content.js' => 'content.js',
        'session.js' => 'session.js',
        'autotag.js' => 'autotag.js',
        'live-edit.js' => 'live-edit.js',
        'chrome.js' => 'chrome.js',
        'support.js' => 'support.js',
        'fitting.js' => 'fitting.js',
        'svg.js' => 'svg.js',
        'verify.js' => 'verify.js',
        // The built bundle, resolved to resources/dist rather than to a
        // sibling of the modules.
        'bundle.js' => 'bundle.js',
    ];

    /**
     * The address every asset is served under.
     *
     * Stamped onto every asset URL so a new version is a new address, which is
     * what lets the files be cached for a year and still arrive the moment
     * they change.
     *
     * The version used to be the constant above, which made correct caching a
     * promise somebody had to keep by hand on every release — and the failure
     * is silent and total: the files say "immutable, one year", so a browser
     * that already holds them never asks again. Editing the runtime without
     * bumping the constant leaves every customer running the old build until
     * next year, with nothing anywhere to say so. It is not a thing to
     * remember, so it is derived: the version is the bytes.
     */
    public static function assetVersion(): string
    {
        return self::VERSION.'-'.(self::$fingerprint ??= self::fingerprint());
    }

    /**
     * A short digest of everything this endpoint will serve.
     *
     * Of all of them together rather than one per file: boot.js passes its own
     * version to the siblings it loads, so the set has to move as a set. A
     * half-updated runtime — new editor, old session — is the failure this is
     * here to prevent, and it is worse than a stale one.
     */
    public static function fingerprintOf(array $paths): string
    {
        $hash = hash_init('sha256');

        foreach ($paths as $path) {
            // The name is hashed too, so files swapping content is a change.
            hash_update($hash, basename($path));
            is_file($path) ? hash_update_file($hash, $path) : hash_update($hash, "\0");
        }

        return substr(hash_final($hash), 0, 12);
    }

    /**
     * Over everything in the runtime directory, not over the served list.
     *
     * The two are nearly the same and the difference is the trap: a module
     * that exists but is not yet listed still changes how the editor behaves,
     * and a version that ignored it would hand browsers a stale build under a
     * name that claimed to be current. Reading the directory means adding a
     * file is enough.
     */
    private static function fingerprint(): string
    {
        $files = glob(self::path('*.js')) ?: [];
        sort($files);

        return self::fingerprintOf($files);
    }

    private static function path(string $name): string
    {
        if ($name === 'bundle.js') {
            return __DIR__.'/../../../../resources/dist/live-edit.js';
        }

        return __DIR__.'/../../../../resources/js/'.$name;
    }

    /**
     * Whether the built bundle is newer than everything it was built from.
     *
     * Not "does it exist". A bundle that exists and is out of date is worse
     * than none: it is served with the same confidence and is wrong in a way
     * nothing on the page reveals.
     */
    private static function bundleIsCurrent(): bool
    {
        $bundle = self::path('bundle.js');

        if (! is_file($bundle)) {
            return false;
        }

        $built = filemtime($bundle);

        foreach (glob(__DIR__.'/../../../../resources/js/*.js') ?: [] as $source) {
            if (filemtime($source) > $built) {
                return false;
            }
        }

        return true;
    }

    /**
     * A site's own one-line install.
     *
     *   <script src="https://cms.example.com/s/acme.js" defer></script>
     *
     * Nothing for a customer to fill in, so nothing for them to get wrong —
     * and, more usefully, nothing of theirs to edit when a key is rotated or a
     * snapshot moves. Their page asks us where things are every time, which
     * means the answer can change without anyone touching their HTML.
     */
    public function site(Site $site): Response
    {
        if (! $site->isActive()) {
            // A suspended site should stop editing without breaking the page.
            return $this->script('/* live-edit: this site is not active */');
        }

        $key = ApiToken::query()
            ->where('site_id', $site->id)
            ->where('type', TokenType::Publishable->value)
            ->whereNull('revoked_at')
            ->latest('id')
            ->first();

        $config = [
            'site' => $site->slug,
            // The newest publishable key, so rotating one takes effect on the
            // next page view rather than on the customer's next deploy.
            'key' => $key?->public_text,
            'api' => url(config('live-edit.api.prefix', 'api/live-edit/v1')),
            /*
             * Which engine is answering this page.
             *
             * Carried in the embed rather than fetched, because it costs
             * nothing here and a request of its own would be weight for a
             * string. It is in the page so that somebody reporting a fault can
             * read it back to us: not knowing it has cost this project a day
             * twice in one week, once chasing fixes that had shipped and not
             * deployed, and once reading a local directory as evidence about a
             * server. No secret - the runtime it serves is public.
             */
            'engine' => LiveEdit::VERSION,
            'snapshot' => rtrim((string) config('live-edit.snapshot_url', ''), '/') !== ''
                ? rtrim((string) config('live-edit.snapshot_url', ''), '/').'/sites/'.$site->slug
                : null,
        ];

        return $this->script(sprintf(
            "(function(){var s=document.createElement('script');s.src=%s;%s s.defer=true;document.head.appendChild(s);})();",
            json_encode(url('live-edit/embed.js').'?v='.self::assetVersion()),
            implode(' ', array_map(
                fn ($k, $v) => sprintf('s.dataset[%s]=%s;', json_encode($k), json_encode((string) $v)),
                array_keys(array_filter($config, fn ($v) => $v !== null && $v !== '')),
                array_values(array_filter($config, fn ($v) => $v !== null && $v !== ''))
            ))
        ));
    }

    private function script(string $body): Response
    {
        return response($body, 200, [
            'Content-Type' => 'text/javascript; charset=utf-8',
            'Access-Control-Allow-Origin' => '*',
            // Short, because this is how a rotated key and a moved snapshot
            // reach a site nobody is going to redeploy.
            'Cache-Control' => 'public, max-age=300',
        ]);
    }

    /**
     * One address that always means "the editor, as it is now".
     *
     * A host that renders its own pages needs to name a script, and the script
     * it wants is whichever build is current. Asking which one — fetching a
     * manifest, then remembering the answer — turns every deploy into a wait:
     * the WordPress plugin held that answer for an hour, so a fix took up to
     * an hour to reach a site, and the same edit looked unchanged in the
     * browser long after it was live. Worse, the asking happened while a
     * visitor's page was being built, so a slow answer slowed the site down.
     *
     * So nothing is asked and nothing is remembered. This address never
     * changes and its contents do: two lines that import the current build.
     * It revalidates on every page view, which costs a 304 and a few bytes,
     * while the build it points at is stamped and kept for a year. Fresh
     * where freshness matters, cached where it is expensive.
     */
    public function runtime(): Response
    {
        $version = self::assetVersion();

        /*
         * The bundle when it is current, the modules when it is not.
         *
         * Shipped as source, the editor is nine files and three hundred
         * kilobytes, and a browser fetches each import in turn. Bundled and
         * minified it is one file and a third of the size.
         *
         * Which one is served is decided by comparing timestamps rather than
         * by a flag, because the failure a flag invites is the one that costs
         * hours: a bundle built before the last edit, served confidently,
         * while the source on disk says something else. Anybody editing the
         * runtime gets the modules until they rebuild, and gets them without
         * being told to do anything.
         */
        $target = url('live-edit/assets/'.$version.'/'.(self::bundleIsCurrent() ? 'bundle.js' : 'live-edit.js'));

        // The version IS the bytes of the runtime, so it is exactly the right
        // entity tag: a browser holding the current build is told so without
        // anything being sent.
        $etag = '"'.$version.'"';

        if (trim((string) request()->header('If-None-Match'), 'W/') === $etag) {
            return response('', 304)->withHeaders($this->runtimeHeaders($etag));
        }

        return response(
            "// live-edit {$version}\nimport ".json_encode($target, JSON_UNESCAPED_SLASHES).";\n",
            200,
        )->withHeaders($this->runtimeHeaders($etag));
    }

    /**
     * @return array<string, string>
     */
    private function runtimeHeaders(string $etag): array
    {
        return [
            'Content-Type' => 'application/javascript; charset=utf-8',
            // no-cache is "ask me every time", not "do not store". The answer
            // is almost always 304, so this is cheap and always current.
            'Cache-Control' => 'no-cache, must-revalidate',
            'ETag' => $etag,
            'Access-Control-Allow-Origin' => '*',
        ];
    }

    public function __invoke(string $file): Response
    {
        $name = self::FILES[$file] ?? null;

        if ($name === null) {
            return response('Not found', 404);
        }

        $path = self::path($name);

        if (! is_file($path)) {
            return response('Not found', 404);
        }

        // Only an address that names this exact build may be kept forever.
        //
        // The one-line install stamps the version, so that is the ordinary
        // case. A customer who pasted the bare embed.js by hand has no stamp
        // on it, and neither do the siblings it loads; caching those for a
        // year would pin them to whatever they first downloaded, which is the
        // fault this whole scheme exists to avoid. An unstamped address is not
        // a version, so it is not treated as one.
        // A version in the path is what the siblings inherit; the query form
        // is kept working for anything already deployed with it.
        $stamped = request()->route('version') === self::assetVersion()
            || (string) request()->query('v') === self::assetVersion();

        return response()->file($path, [
            'Content-Type' => 'text/javascript; charset=utf-8',
            // A browser fetching a module from another origin will not run it
            // without this, and the failure reads as an ordinary script error.
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => $stamped
                ? 'public, max-age=31536000, immutable'
                : 'public, max-age=300, must-revalidate',
        ]);
    }
}
