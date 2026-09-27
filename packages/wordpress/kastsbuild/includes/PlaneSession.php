<?php

namespace KastsBuild;

/**
 * Signing in with the service instead of with WordPress.
 *
 * WordPress already knows who is signed in, and for most sites that is the
 * right answer: the people who write the words are the people who log in to
 * the admin. This is for the sites where it is not.
 *
 * An agency looking after thirty client sites does not want thirty WordPress
 * accounts, and a client who only ever changes a sentence should not need
 * admin access to a CMS to do it. Giving somebody a WordPress account so they
 * can edit a paragraph hands them the media library, the plugin screen and
 * everybody else's drafts along with it.
 *
 * So this is the same arrangement the Laravel package has: the person proves
 * who they are where the site was registered, and this plugin asks the service
 * whether that is true rather than deciding for itself. WordPress remains the
 * default and nothing here changes a site that has not asked for it.
 */
class PlaneSession
{
    /** Names the cookie that identifies a browser holding a session. */
    private const COOKIE = 'kb_editor';

    /**
     * The longest a verified editor is remembered here.
     *
     * A ceiling, not the answer. The service says when its own session dies
     * and that is always sooner; this only stops a browser holding a cookie
     * for ever if that answer is ever missing.
     */
    private const HOURS = 12;

    public static function boot(): void
    {
        add_action('rest_api_init', [self::class, 'routes']);
        add_action('init', [self::class, 'handleEntry']);
    }

    /** Whether this browser is carrying a session the service vouched for. */
    public static function current(): ?array
    {
        $id = isset($_COOKIE[self::COOKIE]) ? sanitize_key((string) $_COOKIE[self::COOKIE]) : '';

        if ($id === '') {
            return null;
        }

        $editor = get_transient('kastsbuild_editor_'.$id);

        if (! is_array($editor)) {
            return null;
        }

        /*
         * A session that has outlived the token it stands for is not a
         * session.
         *
         * Without this the two clocks disagree: the service's session lasts
         * two hours and this cookie lasted twelve, so for ten of them the
         * site believed somebody was signed in, showed them the editor, and
         * handed their browser a dead token. Every save then failed with a
         * refusal none of it explained.
         */
        $expires = (int) ($editor['expires'] ?? 0);

        if ($expires > 0 && $expires <= time()) {
            delete_transient('kastsbuild_editor_'.$id);

            return null;
        }

        return $editor;
    }

    public static function routes(): void
    {
        register_rest_route('kastsbuild/v1', '/session', [
            'methods' => 'POST',
            'callback' => [self::class, 'store'],
            // Open on purpose: the whole point is that the person has no
            // account here. The token is the claim and it is worth nothing
            // until the service vouches for it.
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('kastsbuild/v1', '/session', [
            'methods' => 'DELETE',
            'callback' => [self::class, 'destroy'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Take a token from the toolbar, ask the service about it, remember it.
     */
    public static function store(\WP_REST_Request $request)
    {
        $token = trim((string) $request->get_param('token'));

        if ($token === '' || ! Settings::configured()) {
            return new \WP_REST_Response(['error' => 'That sign-in is not valid for this site.'], 422);
        }

        $session = Api::get('/session', $token)['session'] ?? null;

        if (! is_array($session) || ($session['valid'] ?? false) !== true) {
            return new \WP_REST_Response(['error' => 'That sign-in is not valid for this site.'], 422);
        }

        /*
         * The token has to have been minted for THIS site.
         *
         * Without it a session from any site the service hosts would open the
         * editor here. The token is valid, after all, just not for us, and
         * this plugin is the only party that knows which site it is.
         */
        if (! hash_equals((string) Settings::get('site'), (string) ($session['site'] ?? ''))) {
            return new \WP_REST_Response(['error' => 'That sign-in belongs to another site.'], 422);
        }

        $editor = (array) ($session['editor'] ?? []);
        $id = wp_generate_password(32, false, false);

        // The service's own expiry, so this side never outlives it. Capped,
        // in case a future service answer omits one.
        $ceiling = time() + self::HOURS * HOUR_IN_SECONDS;
        $expires = strtotime((string) ($session['expires_at'] ?? '')) ?: $ceiling;
        $expires = min($expires, $ceiling);

        set_transient('kastsbuild_editor_'.$id, [
            'name' => $editor['name'] ?? null,
            'email' => $editor['email'] ?? null,
            'greeting' => (string) ($editor['greeting'] ?? 'there'),
            // Kept so a write uses the credential the service can revoke,
            // rather than a second one minted from the secret key.
            'token' => $token,
            'expires' => $expires,
        ], max(60, $expires - time()));

        setcookie(self::COOKIE, $id, [
            'expires' => $expires,
            'path' => '/',
            'secure' => is_ssl(),
            // The editor's own script sets nothing and reads nothing here, so
            // there is no reason for a page to be able to.
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        return new \WP_REST_Response(['editor' => ['greeting' => $editor['greeting'] ?? null]], 200);
    }

    public static function destroy()
    {
        $id = isset($_COOKIE[self::COOKIE]) ? sanitize_key((string) $_COOKIE[self::COOKIE]) : '';

        if ($id !== '') {
            delete_transient('kastsbuild_editor_'.$id);
        }

        setcookie(self::COOKIE, '', ['expires' => time() - 3600, 'path' => '/']);

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /**
     * The door somebody walks through to start editing.
     *
     * Arriving with nothing sends them to the service. Arriving back from it,
     * the session is in the URL fragment, which a browser never sends to a
     * server: that is why it is there, so the token stays out of access logs
     * and Referer headers. Only a page can read it, so this prints the
     * smallest page that can.
     */
    public static function handleEntry(): void
    {
        if (! isset($_GET['kb-enter']) || ! Settings::configured()) {
            return;
        }

        $home = home_url('/');
        $signIn = rtrim(self::planeHost(), '/').'/live-edit/sign-in?'.http_build_query([
            'site' => Settings::get('site'),
            'return_to' => add_query_arg('kb-enter', '1', $home),
        ]);

        if (self::current() !== null) {
            // The empty fragment is not a typo: a browser carries a fragment
            // across a redirect when the new address has none, which would
            // leave the session on screen at the end of the journey.
            wp_redirect($home.'#');
            exit;
        }

        status_header(200);
        nocache_headers();
        header('Content-Type: text/html; charset=utf-8');

        echo self::doorway($signIn, $home);
        exit;
    }

    private static function planeHost(): string
    {
        return (string) preg_replace('#/api/live-edit/v\d+$#', '', rtrim((string) Settings::get('api_base'), '/'));
    }

    private static function doorway(string $signIn, string $home): string
    {
        $signInJson = wp_json_encode($signIn);
        $homeJson = wp_json_encode($home);
        $rest = wp_json_encode(rest_url('kastsbuild/v1/session'));

        return <<<HTML
        <!doctype html><html lang="en"><head><meta charset="utf-8">
        <meta name="robots" content="noindex, nofollow"><title>Signing in…</title>
        <style>body{margin:0;height:100vh;display:grid;place-items:center;background:#F4F5F7;color:#9A9DA5;
        font:400 14px/1.5 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif}
        .m{width:38px;height:38px;border-radius:11px;background:#0B0C0F;display:grid;place-items:center;margin:0 auto 16px}
        a{color:#45484F}</style></head><body><div style="text-align:center">
        <div class="m"><svg width="19" height="19" viewBox="0 0 32 32">
        <rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#fff" stroke-width="2.5"/>
        <path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#1B6EF3" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
        </svg></div><p id="say">Signing you in…</p>
        <noscript><a href="{$signIn}">Continue to sign in</a></noscript></div>
        <script>(function(){
          var signIn = {$signInJson}, home = {$homeJson}, rest = {$rest};
          var m = window.location.hash.match(/(?:^#|&)kb_session=([^&]+)/);
          if (!m) { window.location.replace(signIn); return; }
          var token = decodeURIComponent(m[1]);
          history.replaceState(null, '', window.location.pathname + window.location.search);
          if (window.location.hash) { window.location.hash = ''; }
          fetch(rest, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify({ token: token }) })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
            .then(function () { window.location.replace(new URL(home, window.location.origin).href); })
            .catch(function () {
              document.getElementById('say').textContent = 'That sign-in could not be completed.';
              document.getElementById('say').insertAdjacentHTML('afterend', '<p><a href="' + signIn + '">Try again</a></p>');
            });
        })();</script></body></html>
        HTML;
    }
}
