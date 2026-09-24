<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Application\Api\ExportMarkup;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Leaving with your content.
 *
 * The published words live on this service rather than on the customer's
 * server, which makes "what happens if you disappear?" the first serious
 * question anybody asks. These cases are the answer.
 */
class ExportTest extends TestCase
{
    private Site $site;

    /** Routes are registered at boot, so the API has to be on before it. */
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'throttle' => [
                'read' => ['burst' => ['max' => 200, 'seconds' => 60], 'sustained' => ['max' => 2000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 200, 'seconds' => 60], 'sustained' => ['max' => 2000, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 200, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 200, 'seconds' => 3600]],
                'upload' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 200, 'seconds' => 3600]],
                'provision' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 200, 'seconds' => 3600]],
                'tag' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 200, 'seconds' => 3600]],
                'sign_in' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 200, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);
    }

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('live-edit.settings', ['heroTitle']);

        $this->site = Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => []]);
    }

    private function theirPage(): string
    {
        return '<!doctype html><html><body>'
            .'<h1>Words from the template</h1>'
            .'<script src="https://cms.test/s/acme.js" defer></script>'
            .'</body></html>';
    }

    public function test_their_published_words_are_baked_into_their_own_markup(): void
    {
        $tagged = (new MarkupScanner)
            ->apply($this->theirPage(), ['text'], true)['html'];

        preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);
        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $m[1], 'value' => 'Words they wrote']);

        $result = (new ExportMarkup)($this->site, $tagged);

        $this->assertStringContainsString('Words they wrote', $result['html']);
        $this->assertStringNotContainsString('Words from the template', $result['html']);
    }

    public function test_a_page_that_was_never_tagged_can_still_be_exported(): void
    {
        // They may never have had markers in their files at all — the page
        // asked for them at runtime.
        $result = (new ExportMarkup)($this->site, $this->theirPage());

        $this->assertStringContainsString('Words from the template', $result['html']);
    }

    public function test_every_trace_of_the_editor_is_taken_out(): void
    {
        $tagged = (new MarkupScanner)
            ->apply($this->theirPage(), ['text', 'image', 'link', 'icon'], true)['html'];

        $html = (new ExportMarkup)($this->site, $tagged)['html'];

        // Their file should not carry markers for a service they have left.
        $this->assertStringNotContainsString('data-edit', $html);
        $this->assertStringNotContainsString('data-style', $html);
        // Nor a script pointing at a host that may no longer answer.
        $this->assertStringNotContainsString('cms.test', $html);
        $this->assertStringNotContainsString('<script', $html);
    }

    public function test_the_page_itself_survives(): void
    {
        $html = (new ExportMarkup)($this->site, $this->theirPage())['html'];

        $this->assertStringContainsString('<html', $html);
        $this->assertStringContainsString('<h1', $html);
        $this->assertStringContainsString('</body>', $html);
    }

    public function test_one_site_cannot_export_anothers_words(): void
    {
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other', 'allowed_origins' => []]);

        $tagged = (new MarkupScanner)
            ->apply($this->theirPage(), ['text'], true)['html'];
        preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        SiteSetting::query()->create(['site_id' => $other->id, 'key' => $m[1], 'value' => 'Not yours']);

        $html = (new ExportMarkup)($this->site, $tagged)['html'];

        $this->assertStringNotContainsString('Not yours', $html);
    }

    public function test_exporting_needs_an_owner_key(): void
    {
        [, $session] = $this->site->issueToken(TokenType::Session, 'Edit', null, now()->addHour());

        // An editor may write words; taking the whole site away is the
        // owner's decision.
        $this->postJson('/api/live-edit/v1/acme/export', ['html' => '<html></html>'],
            ['Authorization' => 'Bearer '.$session])->assertStatus(403);
    }
}
