<?php

namespace ShipFast\LiveEdit;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use ShipFast\LiveEdit\Console\Commands\ImportTheme;
use ShipFast\LiveEdit\Console\Commands\PruneOrphanedUploads;
use ShipFast\LiveEdit\Console\Commands\ScanForEditables;
use ShipFast\LiveEdit\Console\Commands\Versions;

class LiveEditServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/live-edit.php', 'live-edit');
    }

    public function boot(): void
    {
        // One line in a host's editor markup, instead of knowing what the
        // editor expects on the window object.
        Blade::directive('liveEditPublishing', fn () => '<?php echo \\ShipFast\\LiveEdit\\Support\\EditorConfig::publishingScript(); ?>');

        $this->loadRoutesFrom(__DIR__.'/../routes/live-edit.php');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'live-edit');

        if ($this->app->runningInConsole()) {
            $this->commands([ImportTheme::class, PruneOrphanedUploads::class, ScanForEditables::class, Versions::class]);

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
