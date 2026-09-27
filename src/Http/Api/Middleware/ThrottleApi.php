<?php

namespace ShipFast\LiveEdit\Http\Api\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Http\Api\ApiContext;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps one caller from becoming everybody's problem.
 *
 * Two windows rather than one, because a single limit cannot do both jobs. An
 * editor types in bursts — a dozen saves while rewording a sentence — so a
 * limit low enough to stop a runaway script would interrupt ordinary work. A
 * limit high enough for that burst, applied per minute, permits a very large
 * number of requests per hour. So: a short window sized for human bursts, and a
 * long one sized for what a real site actually consumes in an hour. A caller
 * has to pass both.
 *
 * Keyed by the key where there is one, and by address where there is not.
 * Keying only by address would let one office share a limit, and would be
 * useless behind a CDN where every request appears to come from one place.
 */
class ThrottleApi
{
    public function __construct(private readonly RateLimiter $limiter) {}

    public function handle(Request $request, Closure $next, string $bucket = 'read'): Response
    {
        $limits = config("live-edit.api.throttle.{$bucket}", config('live-edit.api.throttle.read'));
        $identity = $this->identity($request);

        foreach (['burst', 'sustained'] as $window) {
            $max = (int) ($limits[$window]['max'] ?? 0);
            $seconds = (int) ($limits[$window]['seconds'] ?? 60);

            if ($max <= 0) {
                continue;
            }

            $key = "live-edit.api.{$bucket}.{$window}.{$identity}";

            if ($this->limiter->tooManyAttempts($key, $max)) {
                return $this->refuse($key, $max);
            }

            $this->limiter->hit($key, $seconds);
        }

        return $this->withHeaders($next($request), $bucket, $identity, $limits);
    }

    /**
     * Who is being counted.
     *
     * The key's public id, which is public by design — putting a secret in a
     * cache key would write credentials into a shared store, and cache keys end
     * up in logs and dashboards.
     */
    private function identity(Request $request): string
    {
        // Always scoped to the site being called. Before authentication the
        // only thing to count by is the address, and an address is shared —
        // an office, a CDN edge, a mobile network. Counting those globally
        // means a flood aimed at one customer locks out every other customer
        // reached from the same address, which turns one site's attacker into
        // everybody's outage.
        $site = $request->route('site');
        $scope = is_string($site) && $site !== '' ? $site : 'unscoped';

        if (ApiContext::has($request)) {
            return $scope.'|token:'.ApiContext::token($request)->public_id;
        }

        return $scope.'|ip:'.sha1((string) $request->ip());
    }

    private function refuse(string $key, int $max): Response
    {
        $retryAfter = $this->limiter->availableIn($key);

        $headers = [
            'Retry-After' => (string) $retryAfter,
            'RateLimit-Limit' => (string) $max,
            'RateLimit-Remaining' => '0',
            'RateLimit-Reset' => (string) $retryAfter,
        ];

        /*
         * A page with a form has to fail like a page.
         *
         * This guards an API and a sign-in form alike, and answered both with
         * JSON. So somebody locked out of signing in was shown a raw object
         * where their form had been, which reads as the site being broken
         * rather than as them having tried too often. The API keeps the JSON;
         * a browser asking for HTML gets something it can read.
         */
        if (! request()->expectsJson() && request()->acceptsHtml()) {
            return response()->view('live-edit::too-many', [
                'retryAfter' => $retryAfter,
                'minutes' => (int) ceil($retryAfter / 60),
            ], 429, $headers);
        }

        return response()->json([
            'error' => [
                'type' => 'rate_limit_error',
                'message' => 'Too many requests. Slow down and try again shortly.',
                'retry_after' => $retryAfter,
            ],
        ], 429, [
            ...$headers,
        ]);
    }

    /** @param array<string, mixed> $limits */
    private function withHeaders(Response $response, string $bucket, string $identity, array $limits): Response
    {
        $max = (int) ($limits['burst']['max'] ?? 0);

        if ($max <= 0) {
            return $response;
        }

        $key = "live-edit.api.{$bucket}.burst.{$identity}";

        // Told on every response, not only on refusal: a client that can see
        // it coming can slow down, which is the point.
        $response->headers->set('RateLimit-Limit', (string) $max);
        $response->headers->set('RateLimit-Remaining', (string) max(0, $this->limiter->remaining($key, $max)));
        $response->headers->set('RateLimit-Reset', (string) $this->limiter->availableIn($key));

        return $response;
    }
}
