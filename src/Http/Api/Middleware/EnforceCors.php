<?php

namespace ShipFast\LiveEdit\Http\Api\Middleware;

use Closure;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Domain\Site\Site;
use Symfony\Component\HttpFoundation\Response;

/**
 * Answers the browser's question "may this page call you?".
 *
 * This has to run before authentication, because a preflight carries no
 * credentials: the browser asks permission before it is willing to send the
 * Authorization header at all. That is also why the site is named in the path
 * rather than inferred from the key — at preflight time there is no key to
 * infer it from.
 *
 * It is registered at the very front of the global stack, which makes it the
 * LAST thing to touch the response. That is deliberate. Laravel ships
 * config/cors.php matching "api/*", so on a default install its own CORS
 * middleware runs outside route middleware and overwrites these headers —
 * including Access-Control-Allow-Headers, which it sets to empty. A browser
 * reading that refuses to send Authorization, so the API would work from curl
 * and fail from every real page. Having the last word is the only fix that
 * does not depend on a customer editing their config correctly.
 */
class EnforceCors
{
    public function handle(Request $request, Closure $next): Response
    {
        // Global middleware sees every request; this one has opinions about
        // the API's paths only.
        if (! $this->isApiRequest($request)) {
            return $next($request);
        }

        $origin = $request->headers->get('Origin');
        $site = $this->siteFor($request);
        $allowed = $site?->originPolicy()->headerFor($origin);

        if ($request->getMethod() === 'OPTIONS') {
            // A preflight is answered and goes no further: there is nothing to
            // authenticate and nothing to do.
            return $this->decorate(response()->noContent(204), $allowed, true);
        }

        return $this->decorate($next($request), $allowed, false);
    }

    private function decorate(Response $response, ?string $allowed, bool $preflight): Response
    {
        // Set on every response, allowed or not. A cache that ignores this will
        // happily hand one origin's response to another, and the header is the
        // only thing telling it not to.
        $response->headers->set('Vary', trim($response->headers->get('Vary', '').', Origin', ', '));

        if ($allowed === null) {
            return $response;
        }

        $response->headers->set('Access-Control-Allow-Origin', $allowed);

        if ($preflight) {
            // DELETE and PATCH are here because the API answers them —
            // reverting a change, removing an editor, revoking a key. Listing
            // only GET and POST did not make those routes safe, it made them
            // unreachable from any site that is not this one: the browser asks
            // first, is told the method is not allowed, and never sends it.
            // Revert then failed on every WordPress and static site with
            // "failed to fetch", which reads as the network being down.
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-None-Match, Idempotency-Key');
            $response->headers->set('Access-Control-Max-Age', '600');
        }

        // What a caller may read back. Without this the browser hides the
        // throttle and version headers from the very script that needs them.
        $response->headers->set(
            'Access-Control-Expose-Headers',
            'ETag, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After, X-Live-Edit-Version'
        );

        return $response;
    }

    private function isApiRequest(Request $request): bool
    {
        $prefix = trim((string) config('live-edit.api.prefix', 'api/live-edit/v1'), '/');

        return $prefix !== '' && str_starts_with(trim($request->path(), '/'), $prefix);
    }

    /**
     * Running this early means the router has not matched yet, so the site is
     * read from the path rather than from a route parameter.
     */
    private function siteFor(Request $request): ?Site
    {
        $prefix = trim((string) config('live-edit.api.prefix', 'api/live-edit/v1'), '/');
        $rest = trim(substr(trim($request->path(), '/'), strlen($prefix)), '/');
        $slug = explode('/', $rest)[0] ?? '';

        return $slug !== '' ? Site::query()->where('slug', $slug)->first() : null;
    }
}
