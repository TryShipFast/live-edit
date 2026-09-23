<?php

use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Http\Controllers\LiveEditController;
use ShipFast\LiveEdit\Http\Controllers\ThemeController;

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
