<?php

namespace ShipFast\LiveEdit\Http\Api\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * An API that never answers with a redirect.
 *
 * Laravel redirects on a failed validation unless the caller said it wanted
 * JSON. On a browser API that is the worst possible answer: the fetch follows
 * the redirect to a page with no CORS headers on it, and what the client sees
 * is
 *
 *   Access to fetch ... has been blocked by CORS policy:
 *   No 'Access-Control-Allow-Origin' header is present
 *
 * which says nothing about the field that was actually wrong, and sends
 * whoever reads it into an origin allowlist that was never the problem. Found
 * exactly that way: a CORS error reported from a live site, and the origin
 * turned out to be allowed all along.
 *
 * Our own runtime does send `Accept: application/json`, so this was never
 * reachable from the editor. Every other caller is somebody else's code - a
 * plugin, a React app, a curl in a terminal - and "remember this header or the
 * errors become unreadable" is not a contract worth having.
 *
 * Set whatever was asked for, including HTML. This endpoint has no HTML to
 * give: every route under it answers with JSON on its best day, so a caller
 * asking for a page is asking for something that does not exist - and handing
 * them an HTML error page instead is the fault this exists to remove. An API
 * that answers one way on success and another on failure is an API whose
 * failures nobody can read.
 */
class AnswersJsonAlways
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
