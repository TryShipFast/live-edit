<?php

namespace ShipFast\LiveEdit\Http\Api\Middleware;

use Closure;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\AuthenticationResult;
use ShipFast\LiveEdit\Domain\Site\Denial;
use ShipFast\LiveEdit\Domain\Site\TokenAuthenticator;
use ShipFast\LiveEdit\Http\Api\ApiContext;
use Symfony\Component\HttpFoundation\Response;

/**
 * Establishes who is calling, before anything else looks at the request.
 *
 * The decision itself belongs to the domain; this is the part that knows about
 * headers. It puts the resolved site on the request so nothing downstream has
 * to authenticate a second time, or — worse — take a site id from the body,
 * which would let any valid key act on any site.
 */
class AuthenticateApiToken
{
    public function __construct(private readonly TokenAuthenticator $authenticator) {}

    public function handle(Request $request, Closure $next, ?string $ability = null): Response
    {
        $result = $this->authenticator->authenticate(
            $this->presentedKey($request),
            $request->headers->get('Origin'),
            $ability !== null ? Ability::from($ability) : null,
        );

        // A key is valid for ITS site and no other. Without this, every
        // customer's key would work against every customer's content, which is
        // the one failure in a multi-tenant API that cannot be walked back.
        if ($result->passed() && ! $this->belongsToRoutedSite($request, $result)) {
            $result = AuthenticationResult::denied(Denial::SiteMismatch);
        }

        if (! $result->passed()) {
            $denial = $result->denial;

            return response()->json([
                'error' => [
                    'type' => 'authentication_error',
                    // The machine-readable half of the same sentence, so an
                    // install can act on which refusal this is rather than
                    // guessing from the status code. A 401 covers both "your
                    // licence ran out" and "this key was revoked", and those
                    // have opposite fixes: one wants paying, the other wants a
                    // new key pasted in. Told apart only by this.
                    //
                    // Nothing is given away. Whoever reads this is already
                    // holding the key and already being handed the message.
                    'reason' => $denial->value,
                    'message' => $denial->publicMessage(),
                ],
            ], $denial->status(), [
                // Tells an honest client how to fix it; tells a guesser nothing
                // it did not already know.
                'WWW-Authenticate' => 'Bearer realm="live-edit"',
            ]);
        }

        ApiContext::set($request, $result->token, $result->site);
        $result->token->touchUsage();
        // Somebody who is working should not be thrown out for working.
        $result->token->renewIfActive();

        return $next($request);
    }

    private function belongsToRoutedSite(Request $request, AuthenticationResult $result): bool
    {
        $routed = $request->route('site');

        if (! is_string($routed) || $routed === '') {
            return true; // Not a site-scoped route.
        }

        return $result->site->slug === $routed;
    }

    /**
     * Authorization only.
     *
     * A key in a query string ends up in access logs, browser history, and
     * every Referer header the page sends — all places nobody thinks to clean.
     */
    private function presentedKey(Request $request): ?string
    {
        $header = (string) $request->headers->get('Authorization', '');

        return str_starts_with($header, 'Bearer ') ? substr($header, 7) : null;
    }
}
