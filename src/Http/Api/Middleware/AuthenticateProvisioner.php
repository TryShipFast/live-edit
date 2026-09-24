<?php

namespace ShipFast\LiveEdit\Http\Api\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the endpoints that create sites and mint keys.
 *
 * A different credential from everything else here, because this is a
 * different kind of power: a site's own keys reach that site's content, while
 * this one can bring any site into existence and issue keys for it. Sharing a
 * credential between those would mean a leak from one customer's server could
 * provision against everybody.
 *
 * Off unless a token is configured, so an installation that provisions by
 * console — which is every single-site installation — exposes nothing.
 */
class AuthenticateProvisioner
{
    public function handle(Request $request, Closure $next): Response
    {
        $configured = (string) config('live-edit.api.admin_token', '');

        if ($configured === '') {
            // Not "forbidden": as far as anyone outside is concerned these
            // endpoints do not exist on this installation.
            return response()->json(['error' => ['type' => 'not_found', 'message' => 'Not found.']], 404);
        }

        // An Origin header means a browser sent this, and a provisioning
        // credential in a browser is already lost.
        if ($request->headers->get('Origin')) {
            return response()->json([
                'error' => ['type' => 'authentication_error', 'message' => 'Provisioning is server to server only.'],
            ], 403);
        }

        $header = (string) $request->headers->get('Authorization', '');
        $presented = str_starts_with($header, 'Bearer ') ? substr($header, 7) : '';

        // Constant time, and hashed first so the comparison does not depend on
        // the lengths either.
        if (! hash_equals(hash('sha256', $configured), hash('sha256', $presented))) {
            return response()->json([
                'error' => ['type' => 'authentication_error', 'message' => 'Invalid or missing provisioning key.'],
            ], 401, ['WWW-Authenticate' => 'Bearer realm="live-edit-provisioning"']);
        }

        return $next($request);
    }
}
