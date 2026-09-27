<?php

namespace ShipFast\LiveEdit\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Support\EditorSession;
use ShipFast\LiveEdit\Support\Licence;

/**
 * Where the toolbar hands this site a session it was given.
 *
 * The person signed in with us, so this site never sees a password and never
 * stores one. What arrives is a token the service minted, which this site
 * checks with the service before believing anything about it.
 *
 * Open, in the sense that no key or account is presented — the token IS the
 * claim, and it is worth nothing until the service vouches for it.
 */
class EditorSessionController
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:500'],
        ]);

        $editor = EditorSession::start($validated['token']);

        if ($editor === null) {
            return response()->json([
                'error' => ['type' => 'sign_in_failed', 'message' => 'That sign-in is not valid for this site.'],
            ], 422);
        }

        // A new session for a new person: anything the previous one left
        // behind should not be inherited along with the cookie.
        $request->session()->regenerate();

        return response()->json(['editor' => [
            'name' => $editor['name'],
            'greeting' => $editor['greeting'],
        ]]);
    }

    public function destroy(Request $request): JsonResponse
    {
        EditorSession::forget();
        $request->session()->regenerate();

        return response()->json(['ok' => true]);
    }

    /**
     * The door an owner walks through to start editing.
     *
     * Two jobs in one address, because the round trip has to come back
     * somewhere and sending it to a second URL would mean two things for a
     * customer to know about.
     *
     * Arriving with nothing: off to the service to sign in.
     * Arriving back from it: a token is in the fragment, which the server
     * cannot see — so the page hands it to the route above and goes home.
     */
    public function enter(Request $request)
    {
        if (EditorSession::check()) {
            /*
             * The trailing hash is not a typo.
             *
             * A browser carries the fragment across a redirect when the new
             * address has none of its own, so somebody who was already signed
             * in and arrived here with a session in the fragment was sent on
             * to their page with it still in the address bar. An empty
             * fragment is a fragment, and replaces it.
             *
             * The fragment exists so a session never reaches a server or a
             * log; leaving it on screen at the end of the journey gives all
             * of that back to the first shared link or screenshot.
             */
            return redirect($this->safeDestination($request).'#');
        }

        if (! Licence::configured()) {
            // Nothing to sign in to. Said plainly, because the alternative is
            // a redirect to a service this site has never been told about.
            return response(
                'This site is not registered for editing yet. Add LIVE_EDIT_SITE and LIVE_EDIT_KEY to its environment.',
                409
            );
        }

        return response()->view('live-edit::enter', [
            'signInUrl' => Licence::signInUrl($request->fullUrl()),
            'destination' => $this->safeDestination($request),
        ])->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    /**
     * Where to go after signing in, when the caller asked for somewhere.
     *
     * Only a path on this site. An absolute URL here would let a link decide
     * where a freshly signed-in editor lands, which is somebody else's page
     * wearing this site's session.
     */
    private function safeDestination(Request $request): string
    {
        $to = (string) $request->query('to', '/');

        return str_starts_with($to, '/') && ! str_starts_with($to, '//') ? $to : '/';
    }
}
