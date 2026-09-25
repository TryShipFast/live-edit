<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Http\Api\V1\EmbedController;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * The files a customer pastes one line to get.
 */
class EmbedTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('live-edit.api.enabled', true);
        $app['config']->set('live-edit.api.prefix', 'api/live-edit/v1');
        $app['config']->set('cors.paths', []);
    }

    public function test_the_one_line_a_customer_pastes_serves_javascript(): void
    {
        $response = $this->get('/live-edit/embed.js');

        $response->assertOk();
        $this->assertStringContainsString('javascript', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('data-site', $response->streamedContent() ?: $response->getContent());
    }

    public function test_a_browser_on_another_origin_may_run_it(): void
    {
        // A module fetched from another origin will not run without this, and
        // the failure reads as an ordinary script error.
        $this->get('/live-edit/assets/content.js')
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', '*');
    }

    public function test_the_editor_files_are_all_reachable(): void
    {
        foreach (['content.js', 'session.js', 'live-edit.js', 'chrome.js', 'support.js'] as $file) {
            $this->get('/live-edit/assets/'.$file)->assertOk();
        }
    }

    public function test_only_the_listed_files_are_served(): void
    {
        // This endpoint turns a URL into a file path, and anything doing that
        // without a list is one traversal away from serving whatever it can
        // read.
        foreach (['secrets.js', 'app.js', 'config.js'] as $file) {
            $this->get('/live-edit/assets/'.$file)->assertNotFound();
        }
    }

    public function test_a_path_cannot_be_walked_out_of(): void
    {
        foreach (['..%2F..%2Fconfig%2Flive-edit.php', '....//content.js', 'a/../../../.env'] as $attempt) {
            $response = $this->get('/live-edit/assets/'.$attempt);

            $this->assertNotSame(200, $response->status(), "served: {$attempt}");
        }
    }

    public function test_a_fix_reaches_customers_by_changing_address(): void
    {
        // The whole caching scheme rests on this. The files are served as
        // immutable for a year, so the only thing that can deliver a fix is a
        // different address — and the address has to change by itself. While
        // the version was a constant somebody bumped by hand, forgetting it
        // pinned every customer to the old build for a year, silently: their
        // browser holds the files and never asks again. Editing the runtime
        // has to be enough.
        $directory = sys_get_temp_dir().'/'.uniqid('le-assets-', true);
        mkdir($directory);
        $path = $directory.'/boot.js';
        file_put_contents($path, 'before');

        $before = EmbedController::fingerprintOf([$path]);

        file_put_contents($path, 'after');
        $after = EmbedController::fingerprintOf([$path]);

        file_put_contents($path, 'before');
        $again = EmbedController::fingerprintOf([$path]);

        unlink($path);
        rmdir($directory);

        $this->assertNotSame($before, $after, 'a changed runtime kept its old address');
        // And the same bytes keep the same address, or every deploy would
        // throw away a cache that was doing its job.
        $this->assertSame($before, $again);
    }

    public function test_the_served_version_is_the_runtime_that_is_served(): void
    {
        // The two tests around this one would both still pass if the version
        // went back to being a hand-bumped constant, because they compare the
        // scheme against itself. This is the one that does not: the address
        // customers are given has to be derived from the bytes of the files
        // this endpoint will actually hand them.
        $directory = __DIR__.'/../../resources/js';
        $paths = array_map(
            fn ($name) => $directory.'/'.$name,
            ['boot.js', 'content.js', 'session.js', 'autotag.js', 'live-edit.js', 'chrome.js', 'support.js']
        );

        foreach ($paths as $path) {
            $this->assertFileExists($path, 'the runtime this test fingerprints has moved');
        }

        $this->assertStringContainsString(
            EmbedController::fingerprintOf($paths),
            EmbedController::assetVersion(),
            'the version customers are given does not follow the runtime they are given'
        );
    }

    public function test_the_runtime_moves_as_one_set(): void
    {
        // boot.js hands its own version to the siblings it loads, so a change
        // to any one of them has to move all of them. A half-updated runtime —
        // new editor, old session handling — is worse than a stale one, and
        // that is precisely what shipped here: an editor that had been taught
        // to read its own drafts, loaded next to a cached session file that
        // had never heard of it.
        $directory = sys_get_temp_dir().'/'.uniqid('le-assets-', true);
        mkdir($directory);
        $paths = [$directory.'/boot.js', $directory.'/session.js'];
        file_put_contents($paths[0], 'boot');
        file_put_contents($paths[1], 'session');

        $before = EmbedController::fingerprintOf($paths);

        file_put_contents($paths[1], 'session, changed');
        $after = EmbedController::fingerprintOf($paths);

        array_map(unlink(...), $paths);
        rmdir($directory);

        $this->assertNotSame($before, $after, 'changing one file left the set at its old address');
    }

    public function test_an_address_that_names_this_build_is_kept_and_one_that_does_not_is_checked(): void
    {
        $stamped = $this->get('/live-edit/assets/content.js?v='.EmbedController::assetVersion());
        $this->assertStringContainsString('immutable', $stamped->headers->get('Cache-Control'));

        // A customer who pasted the bare script tag has no version on it, and
        // neither do the files it loads. Holding those for a year would pin
        // them to whatever they first downloaded.
        $bare = $this->get('/live-edit/assets/content.js');
        $this->assertStringNotContainsString('immutable', $bare->headers->get('Cache-Control'));

        // A version from a previous release is not this build either.
        $stale = $this->get('/live-edit/assets/content.js?v=0.1.0-abcdef123456');
        $this->assertStringNotContainsString('immutable', $stale->headers->get('Cache-Control'));
    }

    public function test_the_install_line_asks_for_the_build_that_is_actually_served(): void
    {
        Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => []]);

        $body = $this->get('/s/acme.js')->assertOk()->getContent();

        $this->assertMatchesRegularExpression('/embed\.js\?v=([^"\\\\]+)/', $body);
        preg_match('/embed\.js\?v=([^"\\\\]+)/', $body, $matches);

        // The stamp a site hands out has to be the one the assets recognise,
        // or every page view pays for a revalidation nobody asked for.
        $this->assertSame(EmbedController::assetVersion(), $matches[1]);
        $this->assertStringContainsString(
            'immutable',
            $this->get('/live-edit/assets/session.js?v='.$matches[1])->headers->get('Cache-Control')
        );
    }
}
