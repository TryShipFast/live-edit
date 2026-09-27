<?php

namespace ShipFast\LiveEdit;

use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use ShipFast\LiveEdit\Console\Commands\ImportTheme;
use ShipFast\LiveEdit\Console\Commands\ManageApiSite;
use ShipFast\LiveEdit\Console\Commands\PruneOrphanedUploads;
use ShipFast\LiveEdit\Console\Commands\ScanForEditables;
use ShipFast\LiveEdit\Console\Commands\SendRenewalNotices;
use ShipFast\LiveEdit\Console\Commands\Versions;
use ShipFast\LiveEdit\Http\Api\Middleware\EnforceCors;
use ShipFast\LiveEdit\Http\Middleware\TagsEditableMarkup;
use ShipFast\LiveEdit\Support\EditorSession;
use ShipFast\LiveEdit\Support\Licence;

class LiveEditServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/live-edit.php', 'live-edit');
    }

    /**
     * Answer "who may edit" so a host does not have to write code to say it.
     *
     * The gate is the host's to define and a host with real roles should
     * define it — an application that knows about editors and administrators
     * can say so far better than a list in an environment file.
     *
     * But requiring it made the smallest possible install a development task:
     * composer require, add a line to a layout, and then open a service
     * provider and write a closure before anything appears. For a brochure
     * site with two people who will ever touch it, that closure only ever
     * says "is it one of us".
     *
     * Only when the host has not defined it, so nothing here overrides an
     * application that has an opinion. Closed unless addresses are named:
     * defaulting to any signed-in user would hand the editor to every
     * customer of a site with public registration, which is a security
     * failure disguised as convenience.
     */
    private function defineEditorGateUnlessHostHasOne(): void
    {
        if (Gate::has('live-edit')) {
            return;
        }

        Gate::define('live-edit', function ($user = null) {
            $accepts = (string) config('live-edit.sign_in', 'either');

            /*
             * Signed in with the control plane.
             *
             * No account on this website is involved, which is the only
             * workable answer for a site that has none to borrow.
             */
            if ($accepts !== 'host' && EditorSession::check()) {
                return true;
            }

            if ($accepts === 'service' || $user === null) {
                return false;
            }

            /*
             * Or signed in to the application itself, and listed as an editor
             * of this site.
             *
             * Being signed in is not by itself permission to rewrite the
             * marketing copy: a site with customer accounts would otherwise
             * hand the editor to every customer. The list comes from the
             * licence, where the site was registered, so somebody joining or
             * leaving is not a deploy and there are not two places to look
             * when the wrong person can get in.
             */
            $named = Licence::editors();

            return $named !== [] && in_array(mb_strtolower((string) ($user->email ?? '')), $named, true);
        });
    }

    public function boot(): void
    {
        // One line in a host's editor markup, instead of knowing what the
        // editor expects on the window object.
        Blade::directive('liveEditPublishing', fn () => '<?php echo \\ShipFast\\LiveEdit\\Support\\EditorConfig::publishingScript(); ?>');

        // The one line a Laravel application adds to become editable by a
        // content service. Renders nothing when this application is its own
        // store, so the same layout serves both ways of using the package.
        Blade::directive('liveEdit', fn () => '<?php echo \\ShipFast\\LiveEdit\\Support\\CloudInstall::script(); ?>');

        $this->loadRoutesFrom(__DIR__.'/../routes/live-edit.php');

        $this->defineEditorGateUnlessHostHasOne();

        // Said from here rather than from the config file, which has no
        // logger and runs long before one exists.
        Licence::warnAboutRetiredNames();

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

        /*
         * Finding a page's editable parts has nothing to do with the API.
         *
         * This lived inside the block above, which meant it only ever
         * registered on an install that had also switched the API on — and
         * the site least likely to do that is exactly the one this is for: a
         * Laravel app keeping its own content, which needs no API at all. It
         * went unnoticed because the first host tested had the API enabled
         * for unrelated reasons.
         *
         * Pushed rather than prepended: it rewrites a finished response, so
         * it wants to run last on the way out, after whatever else the host
         * does to its own HTML.
         */
        if (config('live-edit.auto_tag', false) && $this->app->bound(HttpKernel::class)) {
            $this->app->make(HttpKernel::class)->pushMiddleware(TagsEditableMarkup::class);
        }
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'live-edit');

        if ($this->app->runningInConsole()) {
            $this->commands([ImportTheme::class, ManageApiSite::class, PruneOrphanedUploads::class, ScanForEditables::class, SendRenewalNotices::class, Versions::class]);

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
