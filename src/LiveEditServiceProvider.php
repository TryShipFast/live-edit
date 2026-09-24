<?php

namespace ShipFast\LiveEdit;

use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use ShipFast\LiveEdit\Console\Commands\ImportTheme;
use ShipFast\LiveEdit\Console\Commands\ManageApiSite;
use ShipFast\LiveEdit\Console\Commands\PruneOrphanedUploads;
use ShipFast\LiveEdit\Console\Commands\ScanForEditables;
use ShipFast\LiveEdit\Console\Commands\Versions;
use ShipFast\LiveEdit\Http\Api\Middleware\EnforceCors;

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

        // The API is off unless asked for: an install that does not need it
        // should not have it reachable.
        if (config('live-edit.api.enabled', false)) {
            $this->loadRoutesFrom(__DIR__.'/../routes/api.php');

            // Prepended, so it is the outermost middleware and therefore the
            // last to touch the response. Laravel's own CORS middleware
            // matches "api/*" on a default install and would otherwise
            // overwrite these headers with ones no browser will accept.
            if ($this->app->bound(HttpKernel::class)) {
                $this->app->make(HttpKernel::class)->prependMiddleware(EnforceCors::class);
            }
        }
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'live-edit');

        if ($this->app->runningInConsole()) {
            $this->commands([ImportTheme::class, ManageApiSite::class, PruneOrphanedUploads::class, ScanForEditables::class, Versions::class]);

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
