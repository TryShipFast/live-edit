<?php

use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Http\Api\Middleware\AuthenticateApiToken;
use ShipFast\LiveEdit\Http\Api\Middleware\ThrottleApi;
use ShipFast\LiveEdit\Http\Api\V1\ContentController;
use ShipFast\LiveEdit\Http\Api\V1\MediaController;
use ShipFast\LiveEdit\Http\Api\V1\SessionController;

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
        });

        // Writing: a session key, which only the customer's own server can mint.
        Route::middleware([
            ThrottleApi::class.':write',
            AuthenticateApiToken::class.':write',
            ThrottleApi::class.':write',
        ])->post('/content', [ContentController::class, 'update'])->name('live-edit.api.content.update');

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
    });
