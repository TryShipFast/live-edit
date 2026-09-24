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
    public static function viewerMayEdit(): bool
    {
        return is_user_logged_in() && current_user_can(Settings::capability());
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
