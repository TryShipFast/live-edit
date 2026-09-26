<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Domain\Site\PasswordSignIn;
use ShipFast\LiveEdit\Domain\Site\SignIn;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * Sign-in for sites that have nowhere else to do it.
 *
 * Open, in the sense that no API key is presented: the whole point is that the
 * person at the keyboard has none. What stands guard instead is that a link
 * only ever goes to an address already listed as an editor of that site, and
 * only ever returns to an origin that site already allows.
 */
class SignInController
{
    public function request(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site' => ['required', 'string', 'max:63'],
            'email' => ['required', 'email', 'max:200'],
            'return_to' => ['required', 'url', 'max:500'],
        ]);

        $site = Site::query()->where('slug', $validated['site'])->first();

        if ($site !== null) {
            SignIn::request($site, $validated['email'], $validated['return_to']);
        }

        // The same answer whether or not that address edits that site, and
        // whether or not the site exists. Anything else turns this into a way
        // to ask which of a customer's staff are real.
        return response()->json([
            'message' => 'If that address can edit this site, a link is on its way.',
        ])->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    public function redeem(string $token): RedirectResponse|JsonResponse
    {
        $result = SignIn::redeem($token);

        if ($result === null) {
            return response()->json([
                'error' => [
                    'type' => 'sign_in_failed',
                    'message' => 'That link has been used or has expired. Ask for another.',
                ],
            ], 410);
        }

        // In the fragment, never the query. A fragment is not sent to the
        // server, does not reach access logs, and is not passed on in a
        // Referer header when the page later loads anything else.
        $separator = str_contains($result['return_to'], '#') ? '&' : '#';

        return redirect()->away(
            $result['return_to'].$separator.'kb_session='.urlencode($result['token'])
        )->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    /**
     * Sign in with an address and a password, and get a session back.
     *
     * The session is returned rather than redirected to, because the caller is
     * the editor's own toolbar sitting on the customer's page: it has the
     * answer already and can hand it to that site's server itself, without a
     * round trip through an email client.
     *
     * One error for every kind of failure. "No such editor" and "wrong
     * password" as separate answers turn this into a way to ask which of a
     * customer's staff are real, which is exactly what the emailed-link flow
     * next door refuses to do.
     */
    public function password(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site' => ['required', 'string', 'max:63'],
            'email' => ['required', 'email', 'max:200'],
            'password' => ['required', 'string', 'max:200'],
        ]);

        $site = Site::query()->where('slug', $validated['site'])->first();

        $result = $site !== null && $site->isActive()
            ? PasswordSignIn::attempt($site, $validated['email'], $validated['password'])
            : null;

        if ($result === null) {
            return response()->json([
                'error' => [
                    'type' => 'sign_in_failed',
                    'message' => 'That address and password do not match an editor of this site.',
                ],
            ], 422)->withHeaders(['Cache-Control' => 'no-store, private']);
        }

        return response()->json([
            'session' => [
                'token' => $result['token'],
                'expires_at' => $result['expires_at'],
                'editor' => [
                    'name' => $result['editor']->name ?: null,
                    'email' => $result['editor']->email,
                    // What to put on screen, decided here so every adapter
                    // greets people the same way.
                    'greeting' => $result['editor']->name
                        ?: explode('@', $result['editor']->email)[0],
                ],
            ],
        ])->withHeaders(['Cache-Control' => 'no-store, private']);
    }
}
