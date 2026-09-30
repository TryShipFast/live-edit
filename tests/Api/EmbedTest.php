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

    public function test_the_page_says_which_engine_is_answering_it(): void
    {
        /*
         * Not decoration. Twice in one week an hour or more went on a fault
         * that turned out to be a fix which had shipped and not been deployed,
         * and neither time could anybody looking at the page tell which
         * version they had. A customer who can read this back turns "it still
         * does not work" into a question with an answer.
         *
         * No secret: the runtime it names is served publicly to every visitor.
         */
        $site = \ShipFast\LiveEdit\Domain\Site\Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'allowed_origins' => ['https://acme.test'],
        ]);

        $body = $this->get("/s/{$site->slug}.js")->getContent();

        $this->assertStringContainsString('engine', $body);
        $this->assertStringContainsString(\ShipFast\LiveEdit\LiveEdit::VERSION, $body);
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

    public function test_every_file_the_runtime_asks_for_can_be_served(): void
    {
        // The allow-list is a second place to remember, and forgetting it does
        // not fail quietly in one module: a browser refuses the whole graph,
        // so a missing sibling takes the editor and the content applier down
        // with it and the page just shows its original words. Adding an import
        // has to be enough.
        $directory = __DIR__.'/../../resources/js';
        $missing = [];

        foreach (glob($directory.'/*.js') as $file) {
            preg_match_all('#\bfrom\s+[\'"]\./([A-Za-z0-9_.-]+\.js)[\'"]#', (string) file_get_contents($file), $matches);

            foreach ($matches[1] as $imported) {
                if ($this->get('/live-edit/assets/'.$imported)->baseResponse->getStatusCode() !== 200) {
                    $missing[] = basename($file).' imports '.$imported;
                }
            }
        }

        $this->assertSame([], $missing, 'the runtime imports files this endpoint will not serve');
    }

    public function test_a_host_can_ask_which_build_of_the_editor_is_current(): void
    {
        // A host that renders its own content and wants only the overlay — the
        // WordPress plugin — needs the versioned address, and the version is
        // the bytes of the runtime rather than a number anybody publishes.
        // Asking is how such a host stops carrying its own copy.
        $answer = $this->getJson('/live-edit/runtime.json')->assertOk();

        $this->assertSame(EmbedController::assetVersion(), $answer->json('version'));

        // And the address it gives out has to actually serve the editor.
        $path = parse_url((string) $answer->json('assets'), PHP_URL_PATH);
        $this->get($path.'/live-edit.js')->assertOk();
    }

    public function test_no_adapter_carries_its_own_copy_of_the_runtime(): void
    {
        // A copy is the bug. The WordPress plugin shipped three files copied
        // from here by hand, and they fell eight kilobytes and several fixes
        // behind without anyone noticing — a WordPress site was running a
        // broken image editor and a save that never checked itself, while
        // every other kind of site had both fixed.
        //
        // Most faults in this codebase have been two implementations of one
        // thing disagreeing. This is the cheapest of them to prevent.
        $runtime = array_map(
            fn (string $path) => basename($path),
            glob(__DIR__.'/../../resources/js/*.js') ?: []
        );

        $copies = [];

        foreach (glob(__DIR__.'/../../packages/*/*/**/*.js') ?: [] as $file) {
            if (str_contains($file, '/node_modules/') || str_contains($file, '/vendor/')) {
                continue;
            }

            if (in_array(basename($file), $runtime, true)) {
                $copies[] = str_replace(__DIR__.'/../../', '', $file);
            }
        }

        $this->assertSame([], $copies, 'an adapter is carrying its own copy of the runtime');
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
        $paths = glob(__DIR__.'/../../resources/js/*.js') ?: [];
        sort($paths);

        $this->assertNotSame([], $paths, 'the runtime this test fingerprints has moved');

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

    public function test_a_module_and_the_ones_it_imports_come_from_one_build(): void
    {
        // A module's static imports resolve against its own URL and do not
        // inherit its query string. While the version was carried as "?v=",
        // only the files boot.js named were versioned — "./support.js" was
        // fetched from an unversioned address and could come from cache,
        // giving a new editor beside a helper that predated it. That is the
        // one failure worse than a stale build, and it is what shipped.
        $version = EmbedController::assetVersion();

        $response = $this->get('/live-edit/assets/'.$version.'/live-edit.js');
        $response->assertOk();
        $this->assertStringContainsString('immutable', $response->headers->get('Cache-Control'));

        // What the browser resolves "./support.js" to from there.
        $sibling = $this->get('/live-edit/assets/'.$version.'/support.js');
        $sibling->assertOk();
        $this->assertStringContainsString('immutable', $sibling->headers->get('Cache-Control'));

        // And the install line points at that directory, so the whole graph
        // lands inside one build.
        Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => []]);
        $this->assertStringContainsString('?v='.$version, $this->get('/s/acme.js')->getContent());
    }

    public function test_an_address_that_names_this_build_is_kept_and_one_that_does_not_is_checked(): void
    {
        $stamped = $this->get('/live-edit/assets/'.EmbedController::assetVersion().'/content.js');
        $this->assertStringContainsString('immutable', $stamped->headers->get('Cache-Control'));

        // A customer who pasted the bare script tag has no version on it, and
        // neither do the files it loads. Holding those for a year would pin
        // them to whatever they first downloaded.
        $bare = $this->get('/live-edit/assets/content.js');
        $this->assertStringNotContainsString('immutable', $bare->headers->get('Cache-Control'));

        // A version from a previous release is not this build either.
        $stale = $this->get('/live-edit/assets/0.1.0-abcdef123456/content.js');
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

    /**
     * A change to the editor reaches a site on the next page view.
     *
     * A host that renders its own pages has to name a script. It used to ask
     * which build was current and remember the answer for an hour, so a fix
     * took up to an hour to arrive and the same edit looked unchanged in the
     * browser long after it had shipped. This address never changes, resolves
     * the current build on every request, and revalidates.
     */
    public function test_the_runtime_address_always_points_at_the_current_build(): void
    {
        $response = $this->get('/live-edit/runtime.js')->assertOk();

        $this->assertStringContainsString('application/javascript', (string) $response->headers->get('Content-Type'));

        // The stamped directory is what matters, not which file inside it:
        // a current build is served as one minified bundle and a runtime
        // somebody is midway through editing is served as modules.
        $this->assertStringContainsString(
            'live-edit/assets/'.EmbedController::assetVersion().'/',
            $response->getContent(),
        );
        $this->assertMatchesRegularExpression('#/(bundle|live-edit)\.js#', $response->getContent());
    }

    public function test_a_bundle_older_than_its_sources_is_not_served(): void
    {
        /*
         * The failure a build step invites: a bundle that exists, is served
         * with total confidence, and is wrong in a way nothing on the page
         * reveals. Touching any source must be enough to fall back to the
         * modules, without anybody being told to rebuild.
         */
        $source = __DIR__.'/../../resources/js/chrome.js';
        $was = filemtime($source);

        try {
            touch($source, time() + 60);
            $this->assertStringContainsString('/live-edit.js', $this->get('/live-edit/runtime.js')->getContent());
        } finally {
            touch($source, $was);
        }
    }

    public function test_the_runtime_address_is_never_kept_without_asking(): void
    {
        // The whole point. Anything that lets a browser or a plugin hold this
        // answer brings back the hour-long wait it replaced.
        $cacheControl = (string) $this->get('/live-edit/runtime.js')->headers->get('Cache-Control');

        $this->assertStringContainsString('no-cache', $cacheControl);
        $this->assertStringNotContainsString('immutable', $cacheControl);
        $this->assertStringNotContainsString('max-age=3', $cacheControl, 'this is cached for a period again');
    }

    public function test_a_browser_already_holding_the_current_build_is_sent_nothing(): void
    {
        // Revalidating on every page view is only affordable because the
        // answer is almost always "you have it".
        $etag = $this->get('/live-edit/runtime.js')->headers->get('ETag');

        $this->withHeaders(['If-None-Match' => $etag])
            ->get('/live-edit/runtime.js')
            ->assertStatus(304);
    }

    public function test_the_wordpress_plugin_asks_nothing_and_remembers_nothing(): void
    {
        // The plugin is where the hour lived. Both halves have to stay gone:
        // the manifest fetch blocked a visitor's page on our service, and the
        // transient is what made a shipped fix invisible.
        $plugin = file_get_contents(__DIR__.'/../../packages/wordpress/kastsbuild/includes/Frontend.php');

        $this->assertStringNotContainsString('runtime.json', $plugin, 'the plugin asks which build is current again');
        $this->assertStringNotContainsString('kastsbuild_runtime_url', $plugin, 'the plugin remembers the answer again');
        $this->assertStringContainsString('/live-edit/runtime.js', $plugin);
    }
}
