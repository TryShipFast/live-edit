<?php

/*
 * The real content API, booted on its own for the browser journeys.
 *
 * tests/e2e/team-editing.spec.js drives two and three browsers as different
 * team members against the fake host (fake-host-server.js), which hands every
 * content call to this: the engine's own controllers, SectionLocks and
 * SiteStore, on a SQLite file, with the file cache, so locks, drafts and
 * versions are the engine's and not a copy of them.
 *
 *   LIVE_EDIT_TEAM_DIR   where the database, cache and clock live (required)
 *   LIVE_EDIT_AUTOLOAD   a different autoloader (this machine runs PHP 8.3, and
 *                        vendor/autoload.php refuses anything below 8.4)
 *
 * The clock: a file "now" in that directory holding a number of seconds to
 * add to the real time, so a journey can step forward thirty minutes.
 */

use Illuminate\Support\Carbon;
use ShipFast\LiveEdit\Domain\Content\EditPolicy;
use ShipFast\LiveEdit\LiveEditServiceProvider;

$root = dirname(__DIR__, 3);
require getenv('LIVE_EDIT_AUTOLOAD') ?: $root.'/vendor/autoload.php';

$dir = rtrim((string) getenv('LIVE_EDIT_TEAM_DIR'), '/');
if ($dir === '') {
    fwrite(STDERR, "LIVE_EDIT_TEAM_DIR is not set\n");
    exit(1);
}

$shift = is_file($dir.'/now') ? (int) trim((string) file_get_contents($dir.'/now')) : 0;
if ($shift !== 0) {
    Carbon::setTestNow(Carbon::now()->addSeconds($shift));
}

/** The host decides which keys exist; the fake host's are tpl:, structure:, form: and collection: keys. */
class TeamJourneyPolicy extends EditPolicy
{
    public function permitsKey(string $key): bool
    {
        return (bool) preg_match('/^(tpl:|structure:|form:|collection:)/', $key) || parent::permitsKey($key);
    }
}

class TeamJourneyApp extends Orchestra\Testbench\Foundation\Application
{
    public static string $dir = '';

    protected function getPackageProviders($app)
    {
        return [LiveEditServiceProvider::class];
    }

    protected function defineEnvironment($app)
    {
        $config = $app['config'];
        $config->set('app.key', 'base64:'.base64_encode(str_repeat('k', 32)));
        $config->set('app.debug', true);
        $config->set('database.default', 'journey');
        $config->set('database.connections.journey', ['driver' => 'sqlite', 'database' => self::$dir.'/team.sqlite', 'prefix' => '', 'busy_timeout' => 5000, 'journal_mode' => 'wal']);
        $config->set('cache.default', 'file');
        $config->set('cache.stores.file', ['driver' => 'file', 'path' => self::$dir.'/cache', 'lock_path' => self::$dir.'/cache']);
        $config->set('live-edit.publishing', true);
        $config->set('live-edit.licence', ['host' => null, 'site' => null, 'key' => null]);
        $config->set('live-edit.snapshot_disk', 'local');
        $config->set('filesystems.disks.local', ['driver' => 'local', 'root' => self::$dir.'/storage']);
        $config->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 86400,
            'session_max_life' => 86400 * 2,
            'throttle' => [
                'read' => ['burst' => ['max' => 100000, 'seconds' => 60], 'sustained' => ['max' => 1000000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 100000, 'seconds' => 60], 'sustained' => ['max' => 1000000, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 1000, 'seconds' => 60], 'sustained' => ['max' => 10000, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 1000, 'seconds' => 60], 'sustained' => ['max' => 10000, 'seconds' => 3600]],
                'tag' => ['burst' => ['max' => 1000, 'seconds' => 60], 'sustained' => ['max' => 10000, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app->bind(EditPolicy::class, TeamJourneyPolicy::class);
    }
}

TeamJourneyApp::$dir = $dir;
@mkdir($dir.'/cache', 0777, true);
@mkdir($dir.'/storage', 0777, true);

return (new TeamJourneyApp(null))->createApplication();
