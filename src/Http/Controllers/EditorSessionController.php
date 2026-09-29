<?php

namespace ShipFast\LiveEdit\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
            /*
             * This door belongs to the arrangement where the site keeps its
             * own content. A site whose words live with us signs in through
             * the script we serve it, which opens its own door on any page,
             * so there is nothing here for it and never was.
             *
             * Without this check a correctly configured cloud site was told
             * it "is not registered for editing yet", which is both wrong and
             * the most alarming thing we could have said to somebody who had
             * just finished setting it up.
             */
            if (filled(config('live-edit.cloud.site')) && filled(config('live-edit.cloud.host'))) {
                abort(404);
            }

            /*
             * Nothing to sign in to - and the browser is told only that.
             *
             * This used to answer with "Add LIVE_EDIT_SITE and LIVE_EDIT_KEY
             * to its environment", on a public URL, to anybody who asked.
             * Three things wrong with it. It hands a stranger a map of how
             * this site is wired and an advertisement that it is currently
             * misconfigured. It is addressed to a developer while being shown
             * to whoever happens to be visiting, who can do nothing with it.
             * And it named two variables that have not been the current
             * spelling for some time, so the one person who COULD act on it
             * was sent to set the wrong ones.
             *
             * The detail goes where a developer will actually find it: the
             * application's own log.
             */
            Log::warning('[live-edit] Editing was requested but this installation has no licence configured. Set LIVE_EDIT_SITE_ID and LIVE_EDIT_APP_KEY, or LIVE_EDIT_CLOUD_HOST and LIVE_EDIT_CLOUD_SITE if the content is kept with the service.');

            return response('Editing is not available on this site.', 409);
        }

        $destination = $this->safeDestination($request);

        /*
         * Built from the destination we have already vetted, not from the
         * address as it arrived.
         *
         * `?to=https://evil.test` is refused for the local redirect and was
         * still passed on to the service inside the return address, where it
         * came back into this page as text. Inert - the scheme is always
         * ours, the view escapes it, and the service checks a return address
         * against the site's own origins before honouring one - so three
         * things had to hold for it to be harmless.
         *
         * Sanitise once and use the sanitised value everywhere is cheaper
         * than keeping three defences correct forever.
         */
        $returnTo = url('/live-edit/enter').'?to='.rawurlencode($destination);

        return response()->view('live-edit::enter', [
            'signInUrl' => Licence::signInUrl($returnTo),
            'destination' => $destination,
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
