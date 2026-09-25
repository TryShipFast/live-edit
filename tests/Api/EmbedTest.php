<?php

namespace ShipFast\LiveEdit\Tests\Api;

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
        // Cached hard, because a new version is a new URL. Caching the same
        // address for a shorter time would mean paying for the request on
        // every page view and still waiting out whatever the browser held.
        $cache = $this->get('/live-edit/assets/content.js')->headers->get('Cache-Control');

        $this->assertStringContainsString('immutable', $cache);
    }
}
