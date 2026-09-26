<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

/**
 * The person editing, according to the service rather than to this site.
 *
 * Asking somebody to hold an account on their own website in order to change
 * a sentence on it makes no sense, and it is the reason every earlier attempt
 * at this ended up requiring a User model, a role, and a gate closure before
 * anything appeared on screen. Signing in belongs where the site was
 * registered and where its editors are listed: with us.
 *
 * So this site never learns a password and never stores one. It receives a
 * session token that the service minted, asks the service whether that token
 * is currently good and who is holding it, and remembers the answer for as
 * long as the token lives. The content stays here; only the question of who
 * is allowed to change it goes elsewhere.
 */
final class EditorSession
{
    private const KEY = 'live-edit.editor';

    /**
     * Verify a token with the service and remember the person behind it.
     *
     * @return array{name: ?string, email: ?string, greeting: string}|null
     */
    public static function start(string $token): ?array
    {
        $token = trim($token);

        if ($token === '' || ! Licence::configured()) {
            return null;
        }

        try {
            $response = Http::timeout(8)
                ->withToken($token)
                ->acceptJson()
                ->get(Licence::endpoint('session'));
        } catch (\Throwable $e) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $session = (array) $response->json('session', []);

        if (($session['valid'] ?? false) !== true) {
            return null;
        }

        /*
         * The token must have been minted for THIS site.
         *
         * Without this, a session from any site the service hosts would open
         * the editor here — the token is valid, after all, just not for us.
         * The service scopes tokens to a site; this is the other half of that
         * promise, checked by the only party who knows which site this is.
         */
        if (! hash_equals(Licence::site(), (string) ($session['site'] ?? ''))) {
            return null;
        }

        $editor = (array) ($session['editor'] ?? []);

        $remembered = [
            'name' => $editor['name'] ?? null,
            'email' => $editor['email'] ?? null,
            'greeting' => (string) ($editor['greeting'] ?? 'there'),
            // Kept so the session here cannot outlive the one it stands for.
            'expires_at' => $session['expires_at'] ?? null,
        ];

        Session::put(self::KEY, $remembered);

        return $remembered;
    }

    /**
     * Who is editing, or nobody.
     *
     * @return array{name: ?string, email: ?string, greeting: string}|null
     */
    public static function current(): ?array
    {
        $editor = Session::get(self::KEY);

        if (! is_array($editor)) {
            return null;
        }

        // A session that has outlived its token is not a session. Checked here
        // rather than only at the service, so a lapsed one stops working
        // without waiting for the next request that happens to ask.
        $expiresAt = $editor['expires_at'] ?? null;

        // Carbon rather than time(), so this moves with the application's
        // clock — including when a test travels forward, which is the only
        // way expiry gets exercised at all.
        if (is_string($expiresAt) && rescue(fn () => now()->greaterThan($expiresAt), false, false)) {
            self::forget();

            return null;
        }

        return $editor;
    }

    public static function check(): bool
    {
        return self::current() !== null;
    }

    public static function forget(): void
    {
        Session::forget(self::KEY);
    }
}
