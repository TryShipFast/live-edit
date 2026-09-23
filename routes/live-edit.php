<?php

use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Http\Controllers\LiveEditController;

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
