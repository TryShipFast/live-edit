<?php

use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Http\Api\V1\EmbedController;
use ShipFast\LiveEdit\Http\Controllers\LiveEditController;
use ShipFast\LiveEdit\Http\Controllers\SignInController;
use ShipFast\LiveEdit\Http\Controllers\ThemeController;
use ShipFast\LiveEdit\Support\DraftStore;

Route::middleware(config('live-edit.middleware', ['web', 'auth', 'can:live-edit']))
    ->prefix('live-edit')
    ->name('live-edit.')
    ->group(function () {
        Route::post('/setting', [LiveEditController::class, 'updateSetting'])->name('setting');
        Route::post('/record', [LiveEditController::class, 'updateRecord'])->name('record');
        Route::post('/record/create', [LiveEditController::class, 'createRecord'])->name('record.create');
        Route::post('/record/move', [LiveEditController::class, 'moveRecord'])->name('record.move');
        Route::delete('/record/{type}/{id}', [LiveEditController::class, 'deleteRecord'])->name('record.delete');
        Route::post('/image', [LiveEditController::class, 'updateImage'])->name('image');
        Route::post('/upload', [LiveEditController::class, 'upload'])->name('upload');
        Route::post('/style', [LiveEditController::class, 'updateStyle'])->name('style');
        Route::post('/undo', [LiveEditController::class, 'undo'])->name('undo');
        Route::post('/publish', [LiveEditController::class, 'publish'])->name('publish');
        Route::post('/draft/discard', [LiveEditController::class, 'discardDraft'])->name('draft.discard');
    });

/*
 * The theme's own pages. A bought template links between them with plain
 * relative names ("about.html"), so serving them at exactly those paths means
 * its navigation works untouched — no link rewriting, and the same markup
 * still opens straight off disk.
 */
if (config('live-edit.theme')) {
    Route::middleware(config('live-edit.view_middleware', ['web']))->group(function () {
        Route::get('/', [ThemeController::class, 'show'])->name('live-edit.page.index');
        Route::get('/{page}.html', [ThemeController::class, 'show'])
            ->where('page', '[A-Za-z0-9_-]+')
            ->name('live-edit.page');
    });
}

/*
 * A preview link shows unpublished work to someone who has no account: a
 * colleague, or the client's own client. It is signed, so the link itself is
 * the permission, and it expires.
 */
Route::middleware(config('live-edit.view_middleware', ['web']))->group(function () {
    Route::get('/live-edit/preview', function () {
        abort_unless(DraftStore::enabled(), 404);
        session([DraftStore::PREVIEW_SESSION_KEY => true]);

        return redirect('/');
    })->middleware('signed')->name('live-edit.preview');

    Route::get('/live-edit/preview/leave', function () {
        session()->forget(DraftStore::PREVIEW_SESSION_KEY);

        return redirect('/');
    })->name('live-edit.preview.leave');
});

/*
 * The editor's own files, for a site that installed this package.
 *
 * Outside the authenticated group above and outside the content API, because
 * neither is the right gate. A browser fetching a script carries no session
 * for it, and an application that only wants the editor should not have to
 * switch on a content API it will never call to get one.
 *
 * Nothing here is content. It is the same JavaScript for every install, and
 * the address that names a build is safe to cache for a year because a new
 * build is a new address.
 */
Route::get('/live-edit/runtime.js', [EmbedController::class, 'runtime'])
    ->name('live-edit.runtime.script');

Route::get('/live-edit/assets/{version}/{file}', fn (string $version, string $file) => app(EmbedController::class)($file))
    ->where('version', '[A-Za-z0-9._-]+')
    ->where('file', '[a-z-]+\\.js')
    ->name('live-edit.assets.versioned');

/*
 * Signing in to edit.
 *
 * Outside the authenticated group, necessarily: this is how somebody becomes
 * authenticated. On the "web" middleware because it needs a session and a CSRF
 * token, and on a site that may have no other login at all.
 */
Route::middleware('web')->group(function () {
    Route::get('/live-edit/sign-in', [SignInController::class, 'show'])->name('live-edit.sign-in');
    Route::post('/live-edit/sign-in', [SignInController::class, 'store'])->name('live-edit.sign-in.store');
    Route::post('/live-edit/sign-out', [SignInController::class, 'destroy'])->name('live-edit.sign-out');
});
