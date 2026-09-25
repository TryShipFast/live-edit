<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Content\StylePolicy;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * How a section looks, changed from a site that is not this application.
 *
 * The reading half was always here: styles are in the content the API answers
 * with, they are held as drafts, published, and written into the snapshot
 * files. Only the write was missing — so a style set on a Laravel page reached
 * a static site perfectly well, and somebody editing that static site could
 * not set one. The editor said "not available over the content API yet",
 * which is how it was found.
 */
class StyleTest extends TestCase
{
    protected Site $site;

    protected string $session;

    protected string $publishable;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'throttle' => [
                'read' => ['burst' => ['max' => 120, 'seconds' => 60], 'sustained' => ['max' => 3000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 60, 'seconds' => 60], 'sustained' => ['max' => 600, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 10, 'seconds' => 60], 'sustained' => ['max' => 120, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 6, 'seconds' => 60], 'sustained' => ['max' => 60, 'seconds' => 3600]],
                'upload' => ['burst' => ['max' => 3, 'seconds' => 60], 'sustained' => ['max' => 10, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);
        $app['config']->set('live-edit.style_props', [
            'background' => 'color',
            'backgroundImage' => 'url',
            'paddingY' => 'px',
            'hidden' => 'toggle',
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create([
            'slug' => 'client',
            'name' => 'Client',
            'allowed_origins' => ['https://client.test'],
        ]);

        [, $this->session] = $this->site->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());
        [, $this->publishable] = $this->site->issueToken(TokenType::Publishable, 'Web');
    }

    protected function url(): string
    {
        return '/api/live-edit/v1/client/styles';
    }

    protected function as(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token, 'Origin' => 'https://client.test', 'Accept' => 'application/json'];
    }

    /** @return array<string, array<string, string>> */
    protected function styles(): array
    {
        $store = new SiteStore($this->site->fresh());

        return array_merge($store->publishedStyles(), $store->draftedStyles());
    }

    public function test_a_section_can_be_restyled_from_a_static_site(): void
    {
        $this->postJson($this->url(), [
            'key' => 'hero',
            'props' => ['background' => '#0A1F44', 'paddingY' => '80'],
        ], $this->as($this->session))->assertOk();

        $this->assertSame(['background' => '#0A1F44', 'paddingY' => '80'], $this->styles()['hero'] ?? null);
    }

    public function test_the_style_reaches_the_content_everyone_reads(): void
    {
        // Writing somewhere the reader never looks is the fault this whole
        // path keeps having, so the check is the answer the page gets.
        $this->postJson($this->url(), ['key' => 'hero', 'props' => ['background' => '#0A1F44']], $this->as($this->session))->assertOk();

        $this->getJson('/api/live-edit/v1/client/content', $this->as($this->session))
            ->assertOk()
            ->assertJsonPath('styles.hero.background', '#0A1F44');
    }

    public function test_a_style_can_be_taken_off_again(): void
    {
        $this->postJson($this->url(), ['key' => 'hero', 'props' => ['background' => '#0A1F44']], $this->as($this->session))->assertOk();
        $this->postJson($this->url(), ['key' => 'hero', 'props' => ['background' => '']], $this->as($this->session))->assertOk();

        // "No background" has to be expressible, or the only way back from a
        // colour somebody regrets is a developer. Whether that is an empty
        // set held as a draft or the row being gone depends on whether the
        // site publishes deliberately; what matters is that nothing applies.
        $this->assertSame([], $this->styles()['hero'] ?? []);
    }

    public function test_a_background_cannot_carry_a_stylesheet(): void
    {
        // This value is rendered into CSS url(). A quote or a bracket closes
        // it and what follows is a stylesheet on every visitor's page.
        $attempts = [
            '/pic.jpg") ; background: url("https://attacker.test/x',
            "/pic.jpg') ; } body { display: none } .x {",
            'javascript:alert(1)',
            'data:text/html;base64,PHNjcmlwdD4=',
            '/pic.jpg\\\\',
        ];

        foreach ($attempts as $attempt) {
            $this->postJson($this->url(), ['key' => 'hero', 'props' => ['backgroundImage' => $attempt]], $this->as($this->session))
                ->assertStatus(422);
        }

        $this->assertArrayNotHasKey('hero', $this->styles());
    }

    public function test_a_colour_has_to_be_a_colour(): void
    {
        foreach (['red; }', 'url(https://attacker.test)', '#12345678901', 'rgb(0,0,0)'] as $attempt) {
            $this->postJson($this->url(), ['key' => 'hero', 'props' => ['background' => $attempt]], $this->as($this->session))
                ->assertStatus(422);
        }
    }

    public function test_a_size_is_a_number_within_reach(): void
    {
        $this->postJson($this->url(), ['key' => 'hero', 'props' => ['paddingY' => '99999']], $this->as($this->session))->assertStatus(422);
        $this->postJson($this->url(), ['key' => 'hero', 'props' => ['paddingY' => '-10']], $this->as($this->session))->assertStatus(422);
        $this->postJson($this->url(), ['key' => 'hero', 'props' => ['paddingY' => '12px']], $this->as($this->session))->assertStatus(422);
    }

    public function test_a_prop_the_site_does_not_declare_is_ignored(): void
    {
        // The panel shows what an element allows, and one element allowing
        // fewer props than another is not something to report to the person
        // using it.
        $this->postJson($this->url(), [
            'key' => 'hero',
            'props' => ['background' => '#0A1F44', 'somethingElse' => 'anything'],
        ], $this->as($this->session))->assertOk();

        $this->assertSame(['background' => '#0A1F44'], $this->styles()['hero'] ?? null);
    }

    public function test_a_read_only_key_cannot_restyle_anything(): void
    {
        $this->postJson($this->url(), ['key' => 'hero', 'props' => ['background' => '#0A1F44']], $this->as($this->publishable))
            ->assertStatus(403);

        $this->assertArrayNotHasKey('hero', $this->styles());
    }

    public function test_another_sites_key_cannot_restyle_this_one(): void
    {
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other', 'allowed_origins' => ['https://other.test']]);
        [, $theirs] = $other->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());

        $this->postJson($this->url(), ['key' => 'hero', 'props' => ['background' => '#0A1F44']], [
            'Authorization' => 'Bearer '.$theirs,
            'Origin' => 'https://other.test',
            'Accept' => 'application/json',
        ])->assertStatus(403);

        $this->assertArrayNotHasKey('hero', $this->styles());
    }

    public function test_the_two_ways_in_refuse_the_same_values(): void
    {
        // The editor's own controller and this endpoint used to carry their
        // own copies of these rules. One of them quietly relaxing is a hole
        // that would not look like one, so both ask the same object.
        $policy = app(StylePolicy::class);

        foreach ([
            ['url', '/pic.jpg") ; background: url("https://attacker.test/x', false],
            ['url', 'https://cdn.example.com/pic.jpg', true],
            ['url', '/images/pic.jpg', true],
            ['color', '#0A1F44', true],
            ['color', 'red', false],
            ['px', '80', true],
            ['px', '401', false],
            ['toggle', '1', true],
            ['toggle', '0', false],
        ] as [$type, $value, $allowed]) {
            $this->assertSame($allowed, $policy->permits($type, $value), "{$type}: {$value}");
        }
    }
}
