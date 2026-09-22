<?php

namespace ShipFast\LiveEdit;

use Illuminate\Support\ServiceProvider;
use ShipFast\LiveEdit\Console\Commands\PruneOrphanedUploads;
use ShipFast\LiveEdit\Console\Commands\ScanForEditables;

class LiveEditServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/live-edit.php', 'live-edit');
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes/live-edit.php');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'live-edit');

        if ($this->app->runningInConsole()) {
            $this->commands([PruneOrphanedUploads::class, ScanForEditables::class]);

            $this->publishes([
                __DIR__.'/../config/live-edit.php' => config_path('live-edit.php'),
            ], 'live-edit-config');

            $this->publishes([
                __DIR__.'/../resources/views' => resource_path('views/vendor/live-edit'),
            ], 'live-edit-views');

            $this->publishes([
                __DIR__.'/../resources/js/live-edit.js' => resource_path('js/live-edit.js'),
            ], 'live-edit-js');
        }
    }
}
