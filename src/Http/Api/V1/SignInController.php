<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
}
