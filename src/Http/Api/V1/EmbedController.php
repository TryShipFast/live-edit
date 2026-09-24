<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
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
        'live-edit.js' => 'live-edit.js',
        'chrome.js' => 'chrome.js',
        'support.js' => 'support.js',
    ];

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
            'snapshot' => rtrim((string) config('live-edit.snapshot_url', ''), '/') !== ''
                ? rtrim((string) config('live-edit.snapshot_url', ''), '/').'/sites/'.$site->slug
                : null,
        ];

        return $this->script(sprintf(
            "(function(){var s=document.createElement('script');s.src=%s;%s s.defer=true;document.head.appendChild(s);})();",
            json_encode(url('live-edit/embed.js')),
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

    public function __invoke(string $file): Response
    {
        $name = self::FILES[$file] ?? null;

        if ($name === null) {
            return response('Not found', 404);
        }

        $path = __DIR__.'/../../../../resources/js/'.$name;

        if (! is_file($path)) {
            return response('Not found', 404);
        }

        return response()->file($path, [
            'Content-Type' => 'text/javascript; charset=utf-8',
            // A browser fetching a module from another origin will not run it
            // without this, and the failure reads as an ordinary script error.
            'Access-Control-Allow-Origin' => '*',
            // Held for an hour rather than forever: this is the one thing a
            // customer cannot re-deploy themselves, so a fix has to be able to
            // reach them without anybody being asked to do anything.
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
