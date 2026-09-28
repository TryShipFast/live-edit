<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\EditorSession;
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

    /**
     * The sign-in page itself, served by us.
     *
     * On the service rather than on the customer's website, and that is a
     * security decision rather than a convenience: a form on their site would
     * either post a password cross-origin or post it through their server,
     * and "we never see your customers' passwords, and they never see ours"
     * only stays true if the form lives here.
     *
     * It also means one page to keep right. A sign-in rendered by every
     * adapter is a sign-in that looks different on every adapter, and the
     * odd one out reads as a phishing page.
     */
    public function form(Request $request): View|RedirectResponse
    {
        $site = Site::query()->where('slug', (string) $request->query('site'))->first();
        $returnTo = (string) $request->query('return_to', '');

        // A site we do not know, or a destination it has not claimed, is an
        // open redirect waiting to happen — checked before anything is drawn.
        if ($site === null || ! $site->isActive() || ! $this->mayReturnTo($site, $returnTo)) {
            return redirect()->away('https://tryshipfast.com');
        }

        return view('live-edit::sign-in', [
            'site' => $site,
            'returnTo' => $returnTo,
            'email' => (string) $request->old('email', ''),
            'error' => $request->session()->get('live-edit.sign-in.error'),
            // Their own account, when they are already signed in to it.
            'continueAs' => $this->whoIsAlreadySignedIn($request, $site),
        ]);
    }

    /**
     * The editor account belonging to whoever is signed in to the console.
     *
     * This page is served by the service and nowhere else, so a session here
     * is a console session: the person who buys the plans and registers the
     * sites. Asking them for a second password, on a page they reached from
     * an application they are already signed in to, is asking them to keep a
     * credential for a person they are already proved to be.
     *
     * Matched by address rather than by ownership, and that is the narrower
     * of the two on purpose. Owning a site does not by itself mean an editor
     * account exists to sign in as, and this must not conjure one: it offers
     * a way in only where somebody has already been given one, which is the
     * same rule every other route in follows.
     */
    private function whoIsAlreadySignedIn(Request $request, Site $site): ?Editor
    {
        $user = $request->user();

        if ($user === null || ! filled($user->email ?? null)) {
            return null;
        }

        $editor = Editor::query()
            ->whereRaw('lower(email) = ?', [mb_strtolower(trim((string) $user->email))])
            ->first();

        return $editor !== null && $editor->mayEdit($site) ? $editor : null;
    }

    /**
     * Let somebody already signed in to the console straight through.
     *
     * Everything is checked again here rather than carried from the page:
     * who they are comes from the session, the site from the database, and
     * the return address from the site's own list. The form posts nothing
     * that decides anything, because a form is a thing anybody can post.
     */
    public function continueAsSelf(Request $request): RedirectResponse|Response
    {
        $validated = $request->validate([
            'site' => ['required', 'string', 'max:63'],
            'return_to' => ['required', 'url', 'max:500'],
        ]);

        $site = Site::query()->where('slug', $validated['site'])->first();

        if ($site === null || ! $site->isActive() || ! $this->mayReturnTo($site, $validated['return_to'])) {
            return redirect()->away('https://tryshipfast.com');
        }

        $editor = $this->whoIsAlreadySignedIn($request, $site);

        if ($editor === null) {
            // Signed out in another tab, or removed from the site since the
            // page was drawn. The password form is still there for them.
            return back()->with('live-edit.sign-in.error', 'Sign in again to carry on.');
        }

        return $this->handBack($validated['return_to'], EditorSession::begin($site, $editor)['token']);
    }

    /**
     * Check the password and send them home with a session.
     *
     * In the fragment, never the query: a fragment is not sent to the server,
     * stays out of access logs, and is not passed on in a Referer header when
     * the page later loads anything else.
     *
     * Handed over by a page rather than a redirect. Browsers apply the
     * `form-action` content-security directive to the whole redirect chain,
     * so a service with a sensible `form-action 'self'` silently refuses to
     * follow a 302 to a customer's domain — and refuses it with no error and
     * no message, leaving the form sitting there as though nothing happened.
     * The alternative, naming every customer domain in our own policy, is a
     * list that grows with sales and breaks when it falls behind.
     */
    public function submit(Request $request): RedirectResponse|Response
    {
        $validated = $request->validate([
            'site' => ['required', 'string', 'max:63'],
            'email' => ['required', 'email', 'max:200'],
            'password' => ['required', 'string', 'max:200'],
            'return_to' => ['required', 'url', 'max:500'],
        ]);

        $site = Site::query()->where('slug', $validated['site'])->first();

        if ($site === null || ! $site->isActive() || ! $this->mayReturnTo($site, $validated['return_to'])) {
            return redirect()->away('https://tryshipfast.com');
        }

        $result = PasswordSignIn::attempt($site, $validated['email'], $validated['password']);

        if ($result === null) {
            return back()
                ->withInput($request->only('email'))
                ->with('live-edit.sign-in.error', 'That address and password do not match an editor of this site.');
        }

        return $this->handBack($validated['return_to'], $result['token']);
    }

    /**
     * Send them home holding a session.
     *
     * In the fragment, never the query: a fragment is not sent to the server,
     * stays out of access logs, and is not passed on in a Referer header when
     * the page later loads anything else.
     */
    private function handBack(string $returnTo, string $token): Response
    {
        $separator = str_contains($returnTo, '#') ? '&' : '#';

        return response()->view('live-edit::handing-back', [
            'returnTo' => $returnTo.$separator.'kb_session='.urlencode($token),
        ])->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    /**
     * Whether a site has claimed the address we would send somebody back to.
     *
     * The same list the browser is held to elsewhere. Without it this page
     * would forward a freshly minted session to any address in a query
     * string, which is a working account takeover with no password involved.
     */
    private function mayReturnTo(Site $site, string $returnTo): bool
    {
        if (! filter_var($returnTo, FILTER_VALIDATE_URL)) {
            return false;
        }

        $parts = parse_url($returnTo);

        if (! isset($parts['scheme'], $parts['host'])) {
            return false;
        }

        $origin = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');

        return $site->originPolicy()->permits($origin);
    }
}
