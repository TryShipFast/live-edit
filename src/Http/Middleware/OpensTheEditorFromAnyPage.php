<?php

namespace ShipFast\LiveEdit\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Support\EditorSession;
use Symfony\Component\HttpFoundation\Response;

/**
 * The same door every other adapter has: ?kb-enter=1 on any page.
 *
 * Laravel already had a sign-in route, and it already accepted a `to` for
 * where to land afterwards. What it had no way of saying was "the page I am
 * standing on". So somebody who wanted to edit a particular page had to know
 * the route existed, know it took a parameter, and type the path themselves —
 * and anybody who simply visited /live-edit/enter was sent to the site's root
 * and, on an application that redirects a signed-in user to a dashboard,
 * landed in a dashboard when they had asked to edit a website.
 *
 * WordPress answers ?kb-enter=1 and a static site's runtime does the same, so
 * there is one thing to remember across all of them. This makes Laravel the
 * third.
 *
 * Nothing happens for somebody already editing: they are on the page they
 * wanted, and a redirect would only take the marker out of the address bar at
 * the cost of a round trip.
 */
class OpensTheEditorFromAnyPage
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isMethod('GET') || ! $request->has('kb-enter') || EditorSession::check()) {
            return $next($request);
        }

        /*
         * A site whose words live with us opens its own door, in the browser.
         *
         * The script we serve that site watches for ?kb-enter=1, takes it out
         * of the address, sends the person to sign in and brings them back to
         * the page they were on. It needs the page to render for any of that
         * to happen.
         *
         * This middleware was taking the query away first and redirecting to
         * a route that belongs to the other arrangement, so the script never
         * ran and the owner of a correctly configured site could not get in
         * at all: the door they were told to use went to a page that told
         * them the site was not registered, and later to a 404.
         *
         * Whoever handles this has to be decided by where the content lives,
         * and here that means standing aside.
         */
        if (filled(config('live-edit.cloud.site')) && filled(config('live-edit.cloud.host'))) {
            return $next($request);
        }

        // Where they were, without the marker — otherwise arriving back sends
        // them straight out again, and round it goes.
        $here = $request->fullUrlWithoutQuery(['kb-enter']);
        $path = parse_url($here, PHP_URL_PATH) ?: '/';
        $query = parse_url($here, PHP_URL_QUERY);

        return redirect()->route('live-edit.enter', [
            'to' => $path.($query ? '?'.$query : ''),
        ]);
    }
}
