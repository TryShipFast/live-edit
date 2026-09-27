<?php

namespace ShipFast\LiveEdit\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Turn a dead 419 on the sign-in page back into a form.
 *
 * "419 PAGE EXPIRED" is Laravel telling a developer that a CSRF token did not
 * match. It is the wrong sentence for the one page in this product that a
 * non-technical person is guaranteed to meet: a client who left the tab open
 * over lunch, or whose browser is holding a stale cookie, gets a grey number
 * on a white page and no way forward. They ring the agency, who cannot
 * reproduce it, because a reload fixes it.
 *
 * So the form comes back, with what happened said in words and their address
 * still filled in. Nothing is let through that was not let through before:
 * the request is still refused, it is simply refused somewhere a person can
 * act on.
 *
 * This has to sit BEFORE the CSRF check in the pipeline rather than after it,
 * which is why it is listed ahead of the `web` group rather than added to the
 * route. Middleware added to a route runs after the group's, by which point
 * the exception has already become a response.
 */
class RecoversAnExpiredSignIn
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (TokenMismatchException) {
            return back()
                ->withInput($request->only('email'))
                ->with(
                    'live-edit.sign-in.error',
                    'That form had been open a while, so we asked for it again. Your details are still here.'
                );
        }
    }
}
