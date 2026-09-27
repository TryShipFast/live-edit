<?php

namespace KastsBuild;

/**
 * Deciding who may edit, and getting them a key that can write.
 *
 * WordPress already knows who is signed in and what they are allowed to do, so
 * that judgement stays here rather than being exported to a service that has
 * never met these users. The secret key does the vouching; what reaches the
 * browser is short-lived and write-scoped, so a key scraped out of a page
 * stops working on its own and cannot renew itself.
 */
class Session
{
    /**
     * Whether whoever is looking may edit, by either route this site allows.
     *
     * WordPress first, because on most sites that is the answer and it costs
     * nothing to ask. The service second, for somebody with no account here
     * at all: an agency looking after thirty client sites does not want
     * thirty WordPress logins, and a client who changes one sentence should
     * not be handed the media library and everybody else's drafts to do it.
     */
    public static function viewerMayEdit(): bool
    {
        // Who they are is a separate question from whether this site is
        // licensed at all, and the licence one is cheaper and decides more.
        if (! Licence::permits()) {
            return false;
        }

        $accepts = Settings::signIn();

        if ($accepts !== 'service' && is_user_logged_in() && current_user_can(Settings::capability())) {
            return true;
        }

        return $accepts !== 'wp' && PlaneSession::current() !== null;
    }

    /**
     * A session key for the signed-in user, minted once and reused until it is
     * nearly spent.
     *
     * Without the caching every page view would mint another, which is both a
     * request the visitor waits for and a pile of live credentials for one
     * person.
     */
    public static function forCurrentUser(): ?string
    {
        if (! self::viewerMayEdit()) {
            return null;
        }

        /*
         * Somebody signed in with the service already holds a session key.
         *
         * Minting another from the secret key would work and would be wrong:
         * it would give a person two live credentials, and the one the
         * service knows about is the one it can revoke.
         */
        $fromService = PlaneSession::current();

        if (is_array($fromService) && ($fromService['token'] ?? '') !== '') {
            return $fromService['token'];
        }

        $user = wp_get_current_user();
        $key = 'kastsbuild_session_'.$user->ID;
        $cached = get_transient($key);

        if (is_array($cached) && ($cached['token'] ?? '') !== '') {
            return $cached['token'];
        }

        $response = Api::post('/sessions', (string) Settings::get('secret_key'), [
            'label' => $user->display_name ?: $user->user_login,
        ]);

        $token = $response['token'] ?? null;

        if (! is_string($token) || $token === '') {
            return null;
        }

        $expires = strtotime((string) ($response['expires_at'] ?? '')) ?: time() + 1800;

        // Dropped a little before it actually expires, so nobody is handed a
        // key that dies between the page rendering and them pressing save.
        $ttl = max(60, $expires - time() - 120);

        set_transient($key, ['token' => $token], $ttl);

        return $token;
    }

    public static function forget(int $userId): void
    {
        delete_transient('kastsbuild_session_'.$userId);
    }
}
