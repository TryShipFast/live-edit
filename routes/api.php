<?php

use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Http\Api\Middleware\AuthenticateApiToken;
use ShipFast\LiveEdit\Http\Api\Middleware\AuthenticateProvisioner;
use ShipFast\LiveEdit\Http\Api\Middleware\EnforceCors;
use ShipFast\LiveEdit\Http\Api\Middleware\ThrottleApi;
use ShipFast\LiveEdit\Http\Api\V1\ContentController;
use ShipFast\LiveEdit\Http\Api\V1\EmbedController;
use ShipFast\LiveEdit\Http\Api\V1\MediaController;
use ShipFast\LiveEdit\Http\Api\V1\SessionController;
use ShipFast\LiveEdit\Http\Api\V1\SignInController;
use ShipFast\LiveEdit\Http\Api\V1\SiteController;

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
    ->group(function () {
        Route::options('/{any?}', fn () => response()->noContent())->where('any', '.*');

        // Reading published content: a publishable key is enough, and that key
        // is safe in a page because everything it can see is already public.
        Route::middleware([
            ThrottleApi::class.':read',
            AuthenticateApiToken::class.':read',
            ThrottleApi::class.':read',
        ])->group(function () {
            Route::get('/content', [ContentController::class, 'show'])->name('live-edit.api.content');
            Route::get('/content/version', [ContentController::class, 'version'])->name('live-edit.api.version');
            // Where the published files are, so a CDN or a build can fetch
            // them without going through this application again.
            Route::get('/versions', [ContentController::class, 'versions'])->name('live-edit.api.versions');
            // A page asking which of its own elements are editable. Costs a
            // full parse, so it is counted and throttled on its own.
            Route::post('/tag', [ContentController::class, 'tag'])->name('live-edit.api.tag');
        });

        // Writing: a session key, which only the customer's own server can mint.
        Route::middleware([
            ThrottleApi::class.':write',
            AuthenticateApiToken::class.':write',
            ThrottleApi::class.':write',
        ])->post('/content', [ContentController::class, 'update'])->name('live-edit.api.content.update');

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
Route::get('/live-edit/assets/{version}/{file}', fn (string $version, string $file) => app(EmbedController::class)($file))
    ->where('version', '[A-Za-z0-9._-]+')
    ->where('file', '[a-z-]+\.js')
    ->name('live-edit.assets.versioned');

Route::get('/live-edit/assets/{file}', EmbedController::class)
    ->where('file', '[a-z-]+\.js')
    ->name('live-edit.assets');

Route::get('/live-edit/embed.js', fn () => app(EmbedController::class)('embed.js'))
    ->name('live-edit.embed');

/*
 * A site's own install: one URL, nothing to fill in.
 *
 * Which also means a rotated key or a moved snapshot reaches a site nobody is
 * going to redeploy.
 */
Route::get('/s/{site:slug}.js', [EmbedController::class, 'site'])
    ->middleware([SubstituteBindings::class])
    ->name('live-edit.site-embed');
