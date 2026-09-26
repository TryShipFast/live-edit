<?php

namespace ShipFast\LiveEdit\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

/**
 * Signing in to edit, on a site that may have nowhere else to sign in.
 *
 * The package used to require the host to arrange this: its own login page,
 * its own modal, its own route. That assumption is wrong often enough to
 * matter. A brochure site built from a template has a users table, because
 * Laravel ships one, and frequently has no login at all — no Breeze, no
 * Filament, no admin panel. Told to "add one line", the owner of such a site
 * found there was no way to become the person that line serves.
 *
 * So the form belongs here. Identity does not: this authenticates against the
 * HOST's users, with the host's guard and the host's password hashes. The
 * package never stores a credential, never issues one, and has no user of its
 * own to manage, reset or recover. It borrows the site's front door and then
 * asks the site's own gate whether this person may edit.
 */
class SignInController
{
    public function show(Request $request): View|RedirectResponse
    {
        // Already able to edit: the form would be a dead end asking somebody
        // to prove something they have proved.
        if (Gate::allows('live-edit')) {
            return redirect($this->backTo($request));
        }

        return view('live-edit::sign-in', [
            'back' => $request->query('from', '/'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        /*
         * Slowed by address and by the address being tried.
         *
         * This form is on the public internet on every site that installs the
         * package, and it is the door to changing what a business says about
         * itself. Five attempts a minute is generous for a person and useless
         * for a script.
         */
        $throttle = 'live-edit-sign-in:'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttle, 5)) {
            throw ValidationException::withMessages([
                'email' => 'Too many attempts. Wait a minute and try again.',
            ]);
        }

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::hit($throttle, 60);

            // One message for a wrong address and a wrong password alike.
            // Telling somebody which half was right tells them which
            // addresses exist here.
            throw ValidationException::withMessages([
                'email' => 'Those details do not match an account on this site.',
            ]);
        }

        RateLimiter::clear($throttle);
        $request->session()->regenerate();

        /*
         * Signed in, but perhaps not an editor.
         *
         * Somebody may hold a perfectly good account on this site and have no
         * business editing it — a customer, a subscriber. They are left signed
         * in, because that is a true thing that just happened, and told
         * plainly rather than bounced back to a login form that would accept
         * the same details again and appear to fail.
         */
        if (! Gate::allows('live-edit')) {
            return redirect()
                ->route('live-edit.sign-in')
                ->with('live-edit-status', 'You are signed in, but this account cannot edit the site.');
        }

        return redirect($this->backTo($request));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * The page they were on, never somewhere else.
     *
     * Taken from the request, so it is a value a visitor controls: an open
     * redirect otherwise, and one that would be served from the customer's own
     * domain, which is exactly what makes those worth exploiting.
     */
    private function backTo(Request $request): string
    {
        $back = (string) $request->input('back', $request->query('from', '/'));

        return str_starts_with($back, '/') && ! str_starts_with($back, '//') ? $back : '/';
    }
}
