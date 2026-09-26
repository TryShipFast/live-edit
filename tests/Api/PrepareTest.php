<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * A finished page for a host that cannot run the scanner itself.
 *
 * WordPress renders HTML on a server with no build step and no way to run our
 * code, so the plugin carried a copy of the engine in its own zip. The editor
 * runtime beside it is fetched fresh on every page view, so the half of the
 * product that decides what is editable was frozen until somebody pressed
 * update in wp-admin, and the half that draws the drawer was never more than a
 * page load old. Two speeds, one product.
 *
 * The host now posts the page it rendered and gets it back ready.
 */
class PrepareTest extends TestCase
{
    protected Site $site;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $generous = ['burst' => ['max' => 600, 'seconds' => 60], 'sustained' => ['max' => 6000, 'seconds' => 3600]];

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'throttle' => array_fill_keys(['read', 'write', 'session', 'publish', 'upload', 'tag'], $generous),
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);
        $app['config']->set('live-edit.auto_keys', true);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create([
            'slug' => 'client', 'name' => 'Client', 'allowed_origins' => ['https://client.test'],
        ]);
    }

    protected function url(): string
    {
        return '/api/live-edit/v1/client/prepare';
    }

    /** A key in the page, which everybody has. */
    protected function reader(): array
    {
        [, $plain] = $this->site->issueToken(TokenType::Publishable, 'Web');

        return ['Authorization' => 'Bearer '.$plain, 'Origin' => 'https://client.test'];
    }

    /** A session, which only the customer's own server can mint. */
    protected function editor(): array
    {
        [, $plain] = $this->site->issueToken(TokenType::Session, 'Editor', [
            Ability::Read,
            Ability::Write,
        ]);

        return ['Authorization' => 'Bearer '.$plain, 'Origin' => 'https://client.test'];
    }

    public function test_a_page_comes_back_marked_up_and_carrying_the_clients_words(): void
    {
        // The whole point in one case: the host sends what its theme rendered
        // and gets back a page it can serve, with no engine of its own.
        $tagged = $this->postJson($this->url(), [
            'html' => '<body><div><h1>Theme headline</h1></div></body>',
        ], $this->reader())->assertOk()->json('html');

        $this->assertStringContainsString('data-edit="setting:auto:', $tagged, 'the page came back unmarked');

        preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);
        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $m[1], 'value' => 'Their headline']);

        $again = $this->postJson($this->url(), [
            'html' => '<body><div><h1>Theme headline</h1></div></body>',
        ], $this->reader())->assertOk();

        $this->assertStringContainsString('Their headline', $again->json('html'));
        $this->assertSame(1, $again->json('applied'));
    }

    public function test_a_visitor_never_sees_somebody_elses_unfinished_sentence(): void
    {
        // The failure this guards is specific and bad: one person is halfway
        // through typing and everybody visiting the site reads it.
        $tagged = $this->postJson($this->url(), [
            'html' => '<body><div><h1>Theme headline</h1></div></body>',
        ], $this->reader())->json('html');

        preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);
        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $m[1], 'value' => 'Published words']);
        Draft::query()->create([
            'site_id' => $this->site->id, 'kind' => 'setting', 'subject' => $m[1], 'payload' => ['value' => 'Half-typed sen'],
        ]);

        $visitor = $this->postJson($this->url(), ['html' => '<body><div><h1>Theme headline</h1></div></body>'], $this->reader());
        $this->assertStringContainsString('Published words', $visitor->json('html'));
        $this->assertStringNotContainsString('Half-typed sen', $visitor->json('html'));

        // And the editor does see it, or there would be nothing to edit.
        $editor = $this->postJson($this->url(), ['html' => '<body><div><h1>Theme headline</h1></div></body>'], $this->editor());
        $this->assertStringContainsString('Half-typed sen', $editor->json('html'));
    }

    public function test_unfinished_work_is_never_held_by_any_cache(): void
    {
        $this->postJson($this->url(), ['html' => '<body><p>Hi</p></body>'], $this->editor())
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_a_page_that_arrives_marked_keeps_the_keys_it_shipped_with(): void
    {
        // A client's saved work hangs off those keys. Re-marking a prepared
        // page would rename them and the work would be orphaned.
        $response = $this->postJson($this->url(), [
            'html' => '<body><h1 data-edit="setting:auto:shipped">Sold like this</h1></body>',
        ], $this->reader())->assertOk();

        $this->assertStringContainsString('data-edit="setting:auto:shipped"', $response->json('html'));
        $this->assertFalse($response->json('tagged'));
    }

    public function test_another_sites_key_cannot_prepare_this_sites_page(): void
    {
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other', 'allowed_origins' => ['https://other.test']]);
        [, $plain] = $other->issueToken(TokenType::Publishable, 'Web');

        $this->postJson($this->url(), ['html' => '<body><p>Hi</p></body>'], [
            'Authorization' => 'Bearer '.$plain, 'Origin' => 'https://other.test',
        ])->assertForbidden();
    }

    public function test_it_says_so_rather_than_parsing_something_enormous(): void
    {
        $this->postJson($this->url(), ['html' => str_repeat('a', 2_000_001)], $this->reader())
            ->assertStatus(422);
    }

    /**
     * A colour the client chose is a colour on the page.
     *
     * This is the case nothing covered, and it was broken the whole time.
     * Words were baked into the page here and styling was not, so on every
     * bought WordPress theme somebody could change a background, watch it
     * save, see it listed under Changes, publish it, reload, and be looking at
     * the theme's original colour. Nothing errored anywhere.
     */
    public function test_a_style_the_client_saved_comes_back_on_the_page(): void
    {
        $html = '<html><head><title>x</title></head><body><div><h1>Theme headline</h1></div></body></html>';

        $tagged = $this->postJson($this->url(), ['html' => $html], $this->reader())->json('html');
        preg_match('/data-style="(s[a-f0-9]+)"/', $tagged, $m);
        $this->assertNotEmpty($m, 'nothing on the page was marked as restylable');

        (new SiteStore($this->site))
            ->putStyle($m[1], ['background' => '#7b1e3a'], false);

        $served = $this->postJson($this->url(), ['html' => $html], $this->reader())->json('html');

        $this->assertStringContainsString('#7b1e3a', $served, 'the saved colour never reached the page');
        $this->assertStringContainsString('[data-style="'.$m[1].'"]', $served);
        // Before </head>, so it beats the theme's own stylesheet rather than
        // losing to whatever loads after it.
        $this->assertLessThan(
            stripos($served, '</head>'),
            stripos($served, 'live-edit-styles'),
            'the styling was written after the head, where the theme can still win',
        );
    }

    public function test_a_visitor_never_sees_a_colour_somebody_is_still_choosing(): void
    {
        // The same rule as words. A half-chosen colour is somebody mid-thought,
        // and the site is open to the public while they think.
        $html = '<html><head></head><body><div><h1>Theme headline</h1></div></body></html>';

        $tagged = $this->postJson($this->url(), ['html' => $html], $this->reader())->json('html');
        preg_match('/data-style="(s[a-f0-9]+)"/', $tagged, $m);

        $store = new SiteStore($this->site);
        $store->putStyle($m[1], ['background' => '#111111'], false);
        $store->putStyle($m[1], ['background' => '#7b1e3a'], true);

        $visitor = $this->postJson($this->url(), ['html' => $html], $this->reader())->json('html');
        $this->assertStringContainsString('#111111', $visitor);
        $this->assertStringNotContainsString('#7b1e3a', $visitor);

        $editor = $this->postJson($this->url(), ['html' => $html], $this->editor())->json('html');
        $this->assertStringContainsString('#7b1e3a', $editor, 'the editor could not see their own unpublished colour');
    }

    public function test_a_page_with_no_styling_is_left_exactly_as_it_was(): void
    {
        // An empty stylesheet tag on every page of every site would be our
        // litter on somebody else's website.
        $html = '<html><head></head><body><h1>Theme headline</h1></body></html>';

        $this->assertStringNotContainsString(
            'live-edit-styles',
            $this->postJson($this->url(), ['html' => $html], $this->reader())->json('html'),
        );
    }
}
