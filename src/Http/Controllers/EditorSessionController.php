<?php

namespace ShipFast\LiveEdit\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Support\EditorSession;

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
}
