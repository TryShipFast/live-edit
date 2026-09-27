<?php

namespace ShipFast\LiveEdit\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Support\Licence;
use Symfony\Component\HttpFoundation\Response;

/**
 * Refuse to save when this installation is not licensed to edit.
 *
 * Hiding the editor is not enough on its own. The drawer is the ordinary way
 * in, but the routes behind it are plain HTTP and stay reachable to anybody
 * already signed in as an editor here — so a lapsed licence that only removed
 * the toolbar would be a lock on the door of an open room.
 *
 * Reads are left alone deliberately: the website still has to render for its
 * visitors, and it renders from this application's own database. Losing the
 * licence costs the editor, never the site.
 */
class RequiresLicence
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Licence::permits()) {
            return $next($request);
        }

        $reason = Licence::reason();

        /*
         * Each refusal says what happened and what to do about it.
         *
         * They arrive at the same moment and mean entirely different things:
         * one wants paying, one wants a key pasting, one wants a conversation
         * with us. "Not licensed to edit" is true of all three and useful for
         * none of them, and it is the message somebody screenshots and sends
         * to support.
         */
        $message = match ($reason) {
            'expired' => 'This licence has expired. Renew it to carry on editing. Your website is unaffected.',
            'rejected' => 'This key is no longer accepted. It was probably replaced or revoked: copy the current one from your dashboard into this site\'s environment.',
            'domain_mismatch' => 'This licence is registered to a different domain, so editing is refused here.',
            'suspended' => 'This site is suspended. Your website is unaffected.',
            'unverified' => 'This site has not proved it owns its domain yet. Finish that in your dashboard.',
            default => 'This installation is not licensed to edit.',
        };

        // 402 rather than 403: this is not "you may not", it is "this needs
        // paying for", and the editor can tell the two apart when it decides
        // what to put on screen.
        return $request->expectsJson()
            ? response()->json(['error' => ['type' => 'licence', 'reason' => $reason, 'message' => $message]], 402)
            : response($message, 402);
    }
}
