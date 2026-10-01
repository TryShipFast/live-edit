<?php

use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Http\Api\Middleware\AnswersJsonAlways;
use ShipFast\LiveEdit\Http\Api\Middleware\AuthenticateApiToken;
use ShipFast\LiveEdit\Http\Api\Middleware\AuthenticateProvisioner;
use ShipFast\LiveEdit\Http\Api\Middleware\EnforceCors;
use ShipFast\LiveEdit\Http\Api\Middleware\ThrottleApi;
use ShipFast\LiveEdit\Http\Api\V1\ContentController;
use ShipFast\LiveEdit\Http\Api\V1\EmbedController;
use ShipFast\LiveEdit\Http\Api\V1\LicenceController;
use ShipFast\LiveEdit\Http\Api\V1\PluginController;
use ShipFast\LiveEdit\Http\Api\V1\MediaController;
use ShipFast\LiveEdit\Http\Api\V1\SessionController;
use ShipFast\LiveEdit\Http\Api\V1\SignInController;
use ShipFast\LiveEdit\Http\Api\V1\SiteController;
use ShipFast\LiveEdit\Http\Middleware\RecoversAnExpiredSignIn;

/*
 * The site is named in the path rather than inferred from the key, because a
 * preflight arrives with no key to infer it from — the browser asks permission
 * before it is willing to send an Authorization header at all.
 *
 * CORS is not listed here: it is registered at the front of the global stack
 * so that it is the last thing to touch the response, which is what stops the
 * host's own CORS middleware overwriting it.
 *
 * The throttle runs before authentication, so a flood of unauthenticated
 * requests is stopped by address before it reaches a database lookup, and
 * again after, keyed by the key itself.
 */
Route::prefix(config('live-edit.api.prefix', 'api/live-edit/v1').'/{site}')
    /*
     * Never a redirect, whatever the caller asked for.
     *
     * A failed validation redirects unless the request said it wanted JSON,
     * and on a browser API the fetch then follows that redirect to a page with
     * no CORS headers - so the client is told its origin is not allowed when
     * the real answer was a field it got wrong. Reported from a live site
     * exactly that way, and the origin was allowed all along.
     */
    ->middleware([AnswersJsonAlways::class])
    ->group(function () {
        Route::options('/{any?}', fn () => response()->noContent())->where('any', '.*');

        // Reading published content: a publishable key is enough, and that key
        // is safe in a page because everything it can see is already public.
        Route::middleware([
            ThrottleApi::class.':read',
            AuthenticateApiToken::class.':read',
            ThrottleApi::class.':read',
        ])->group(function () {
            /*
             * Is this licence good, and is it mine.
             *
             * A read key, because a self-hosting install (Laravel, WordPress)
             * has one and needs nothing more to ask: the answer contains no
             * content, only the terms the site is already entitled to know.
             */
            Route::get('/licence', [LicenceController::class, 'show'])->name('live-edit.api.licence');

            /*
             * Where a WordPress install finds out it is out of date.
             *
             * A read key, like the licence beside it: the answer is a version
             * number and an address, and the site asking already has both a
             * key and the plugin. What the key buys is knowing who is asking,
             * so an install that has been cut off stops being served.
             *
             * Checked by WordPress on its own schedule rather than by a
             * person, which is the entire point - before this there was no
             * check at all, and a fix could be released, believed shipped, and
             * sit unseen on every WordPress site we have.
             */
            /*
             * Which translations have fallen behind their English.
             *
             * A read key: the answer is about this site's own content and the
             * caller already holds it. In the read group because asking
             * changes nothing - nothing is retranslated, and nothing is
             * overwritten, here or anywhere.
             */
            Route::get('/translations', [ContentController::class, 'translations'])->name('live-edit.api.translations');
            Route::get('/plugin', [PluginController::class, 'show'])->name('live-edit.api.plugin');
            Route::get('/plugin/download', [PluginController::class, 'download'])->name('live-edit.api.plugin.download');

            /*
             * Whether the caller's editor session is still good.
             *
             * In the read group because a session token carries read, and
             * because asking changes nothing. It is how a site that keeps its
             * own content finds out whether the person on the page may edit
             * it, without that person needing an account on their own site.
             */
            Route::get('/session', [SessionController::class, 'show'])->name('live-edit.api.session.show');
            Route::get('/content', [ContentController::class, 'show'])->name('live-edit.api.content');
            Route::get('/content/version', [ContentController::class, 'version'])->name('live-edit.api.version');
            // Where the published files are, so a CDN or a build can fetch
            // them without going through this application again.
            Route::get('/versions', [ContentController::class, 'versions'])->name('live-edit.api.versions');
            /*
             * Everybody whose photograph is on the published site.
             *
             * A read key, because this is what the site shows the public on
             * its credits page, and the key that renders the page is the one
             * printed in it. Deliberately not called "credits" — that name is
             * already taken by what the site has left to spend, and one of
             * the two is about money.
             */
            Route::get('/attributions', [ContentController::class, 'attributions'])->name('live-edit.api.attributions');
            // A page asking which of its own elements are editable. Costs a
            // full parse, so it is counted and throttled on its own.
            Route::post('/tag', [ContentController::class, 'tag'])->name('live-edit.api.tag');
            // The same parse, but the host wants the finished page rather than
            // a list of positions — a server that renders HTML and has no way
            // to run the scanner itself. Costs a parse for the same reason, so
            // it is metered and throttled alongside tagging.
            Route::post('/prepare', [ContentController::class, 'prepare'])->name('live-edit.api.prepare');
        });

        // Writing: a session key, which only the customer's own server can mint.
        Route::middleware([
            ThrottleApi::class.':write',
            AuthenticateApiToken::class.':write',
            ThrottleApi::class.':write',
        ])->group(function () {
            Route::post('/content', [ContentController::class, 'update'])->name('live-edit.api.content.update');

            // What somebody has changed and not yet published, and putting one
            // of them back. A write key rather than a read one: this is one
            // person's unfinished work, and the publishable key is printed in
            // every page of the site.
            Route::get('/changes', [ContentController::class, 'changes'])->name('live-edit.api.changes');
            Route::delete('/changes', [ContentController::class, 'revert'])->name('live-edit.api.changes.revert');

            // What the site has left to spend, and spending some of it on a
            // rewrite. A write key: this costs money.
            Route::get('/credits', [ContentController::class, 'credits'])->name('live-edit.api.credits');
            Route::post('/assist', [ContentController::class, 'assist'])->name('live-edit.api.assist');

            // Free photographs, and saying which one was used so its
            // photographer is credited. Proxied because the key would
            // otherwise be printed into every site we are installed on.
            Route::get('/photos', [ContentController::class, 'photos'])->name('live-edit.api.photos');
            Route::post('/photos/used', [ContentController::class, 'photoUsed'])->name('live-edit.api.photos.used');

            // Making one, when no photograph will do.
            Route::post('/imagine', [ContentController::class, 'imagine'])->name('live-edit.api.imagine');
        });

        // How a section looks. The same key and the same cost as a word: the
        // reading half of this was always here, so only the write was missing
        // and a static site could be edited in every way but this one.
        Route::middleware([
            ThrottleApi::class.':write',
            AuthenticateApiToken::class.':write',
            ThrottleApi::class.':write',
        ])->post('/styles', [ContentController::class, 'style'])->name('live-edit.api.styles.update');

        // Uploading is counted separately and far more tightly than a text
        // save: it costs bandwidth, storage and CPU rather than a row.
        Route::middleware([
            ThrottleApi::class.':upload',
            AuthenticateApiToken::class.':write',
            ThrottleApi::class.':upload',
        ])->post('/media', [MediaController::class, 'store'])->name('live-edit.api.media');

        // Minting a session and publishing are both secret-key acts: decisions
        // about who may edit, and about what the public sees.
        Route::middleware([
            ThrottleApi::class.':session',
            AuthenticateApiToken::class.':mint',
            ThrottleApi::class.':session',
        ])->post('/sessions', [SessionController::class, 'store'])->name('live-edit.api.sessions');

        Route::middleware([
            ThrottleApi::class.':publish',
            AuthenticateApiToken::class.':publish',
            ThrottleApi::class.':publish',
        ])->post('/publish', [ContentController::class, 'publish'])->name('live-edit.api.publish');

        // Rolling back is the same kind of decision as publishing, so it asks
        // for the same kind of key.
        Route::middleware([
            ThrottleApi::class.':publish',
            AuthenticateApiToken::class.':publish',
            ThrottleApi::class.':publish',
        ])->post('/restore', [ContentController::class, 'restore'])->name('live-edit.api.restore');

        // Taking their content away with them. An owner's decision, so it asks
        // for an owner's key.
        Route::middleware([
            ThrottleApi::class.':tag',
            AuthenticateApiToken::class.':publish',
            ThrottleApi::class.':tag',
        ])->post('/export', [ContentController::class, 'export'])->name('live-edit.api.export');
    });

/*
 * Provisioning: creating sites and minting their keys.
 *
 * Not site-scoped, and behind a different credential — a site's own keys reach
 * that site's content, while these bring sites into existence. Sharing one
 * credential between those would mean a leak from any customer's server could
 * provision against everybody.
 *
 * Absent entirely unless a provisioning token is configured, so a single-site
 * installation that provisions from the console exposes nothing.
 */
Route::middleware([
    ThrottleApi::class.':provision',
    AuthenticateProvisioner::class,
    // These routes name a site in the path, and resolving that from the slug
    // is not automatic outside the framework's own middleware groups: without
    // it the controller is handed a blank model and writes rows with no owner.
    SubstituteBindings::class,
])
    ->prefix(config('live-edit.api.prefix', 'api/live-edit/v1'))
    ->group(function () {
        Route::post('/sites', [SiteController::class, 'store'])->name('live-edit.api.sites.store');
        Route::get('/sites/{site:slug}', [SiteController::class, 'show'])->name('live-edit.api.sites.show');
        Route::patch('/sites/{site:slug}', [SiteController::class, 'update'])->name('live-edit.api.sites.update');
        Route::get('/sites/{site:slug}/usage', [SiteController::class, 'usage'])->name('live-edit.api.sites.usage');
        Route::get('/sites/{site:slug}/editors', [SiteController::class, 'editors'])->name('live-edit.api.sites.editors');
        Route::post('/sites/{site:slug}/editors', [SiteController::class, 'addEditor'])->name('live-edit.api.sites.editors.add');
        Route::delete('/sites/{site:slug}/editors/{editorId}', [SiteController::class, 'removeEditor'])->name('live-edit.api.sites.editors.remove');
        Route::post('/sites/{site:slug}/keys', [SiteController::class, 'issueKey'])->name('live-edit.api.sites.keys');
        Route::delete('/sites/{site:slug}/keys/{keyId}', [SiteController::class, 'revokeKey'])->name('live-edit.api.sites.keys.revoke');
    });

/*
 * Signing in, for sites with nowhere else to do it.
 *
 * No API key is presented here, because the point is that the person at the
 * keyboard has none. What stands guard is that a link only goes to an address
 * already listed as an editor of that site, and only returns to an origin that
 * site already allows — both decided when the link is made, never when it is
 * clicked.
 *
 * Throttled hard: asking for links is the one thing here that sends email.
 */
Route::middleware([EnforceCors::class])
    ->prefix(config('live-edit.api.prefix', 'api/live-edit/v1'))
    ->group(function () {
        Route::middleware([ThrottleApi::class.':sign_in'])
            ->post('/sign-in', [SignInController::class, 'request'])
            ->name('live-edit.api.sign-in');

        /*
         * The same door, with a password instead of a link.
         *
         * Under the same throttle, which matters more here: a link is only
         * ever sent to an address that already edits the site, while a
         * password can be guessed at. The limit is the guard.
         */
        Route::middleware([ThrottleApi::class.':sign_in'])
            ->post('/sign-in/password', [SignInController::class, 'password'])
            ->name('live-edit.api.sign-in.password');
    });

/*
 * The sign-in page, served by the service.
 *
 * Under `web` because it is a page with a form and needs a session and a CSRF
 * token — everything else in this file is an API and has neither.
 */
Route::middleware([RecoversAnExpiredSignIn::class, 'web', ThrottleApi::class.':sign_in'])->group(function () {
    Route::get('/live-edit/sign-in', [SignInController::class, 'form'])
        ->name('live-edit.sign-in.form');

    Route::post('/live-edit/sign-in', [SignInController::class, 'submit'])
        ->name('live-edit.sign-in.submit');

    // For somebody already signed in to the console. Nothing it posts
    // decides anything: who they are comes from the session.
    Route::post('/live-edit/sign-in/continue', [SignInController::class, 'continueAsSelf'])
        ->name('live-edit.sign-in.continue');
});

Route::get('/live-edit/sign-in/{token}', [SignInController::class, 'redeem'])
    ->middleware([ThrottleApi::class.':sign_in'])
    ->name('live-edit.sign-in.redeem');

/*
 * The editor's own files.
 *
 * Open and cacheable: this is a static asset, and the customer pasting one
 * line into their site is the whole point of it being here rather than in
 * their repository.
 */
/*
 * The version lives in the PATH, not in a query string.
 *
 * A module's static imports resolve against its own URL and do not inherit its
 * query, so "live-edit.js?v=2" fetching "./support.js" asked for an unversioned
 * address. Only the files boot.js loaded by name were versioned at all, and the
 * rest could come from cache — a new editor running beside an old helper, which
 * is the one failure worse than a stale build. A directory in the path is
 * inherited for free.
 */
Route::get('/live-edit/assets/{file}', EmbedController::class)
    ->where('file', '[a-z-]+\.js')
    ->name('live-edit.assets');

Route::get('/live-edit/embed.js', fn () => app(EmbedController::class)('embed.js'))
    ->name('live-edit.embed');

/*
 * Which build of the editor is current.
 *
 * A host that loads the editor itself — a WordPress plugin, anything that
 * renders its own content and wants only the overlay — needs the versioned
 * address, and the version is the bytes of the runtime rather than a number
 * anybody publishes. Asking is how such a host stops carrying its own copy,
 * and a copy is what goes stale: the plugin's was eight kilobytes and several
 * fixes behind before this existed.
 */
/*
 * runtime.js and the versioned asset directory are registered in
 * routes/live-edit.php instead, which every install loads. A browser fetching
 * a script has no session, and an application that only wants the editor
 * should not have to switch on a content API to be served one.
 */

Route::get('/live-edit/runtime.json', fn () => response()->json([
    'version' => EmbedController::assetVersion(),
    'assets' => url('live-edit/assets/'.EmbedController::assetVersion()),
])->withHeaders([
    'Access-Control-Allow-Origin' => '*',
    // Short: this is how a fix reaches a host that caches the answer.
    'Cache-Control' => 'public, max-age=300',
]))->name('live-edit.runtime');

/*
 * A site's own install: one URL, nothing to fill in.
 *
 * Which also means a rotated key or a moved snapshot reaches a site nobody is
 * going to redeploy.
 */
Route::get('/s/{site:slug}.js', [EmbedController::class, 'site'])
    ->middleware([SubstituteBindings::class])
    ->name('live-edit.site-embed');
