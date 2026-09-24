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
 * Two customers on one installation.
 *
 * These are the tests that decide whether this can be sold to a second
 * customer. A missing scope does not throw: it returns somebody else's words,
 * successfully, and nobody notices until it is in a support ticket. So each of
 * these sets up two sites and asks whether either can reach the other.
 */
class TenancyTest extends TestCase
{
    private Site $acme;

    private Site $rival;

    private string $acmeSession;

    private string $acmeSecret;

    private string $rivalSession;

    private string $rivalPublishable;

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
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('live-edit.settings', ['heroTitle']);
        $app['config']->set('live-edit.publishing', false);
        $app['config']->set('cors.paths', []);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->acme = Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => ['https://acme.test']]);
        $this->rival = Site::query()->create(['slug' => 'rival', 'name' => 'Rival', 'allowed_origins' => ['https://rival.test']]);

        [, $this->acmeSession] = $this->acme->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());
        [, $this->acmeSecret] = $this->acme->issueToken(TokenType::Secret, 'Server');
        [, $this->rivalSession] = $this->rival->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());
        [, $this->rivalPublishable] = $this->rival->issueToken(TokenType::Publishable, 'Web');

        SiteSetting::query()->create(['site_id' => $this->acme->id, 'key' => 'heroTitle', 'value' => 'Acme flies aircraft']);
        SiteSetting::query()->create(['site_id' => $this->rival->id, 'key' => 'heroTitle', 'value' => 'Rival flies better']);
    }

    private function url(string $site, string $path = '/content'): string
    {
        return "/api/live-edit/v1/{$site}{$path}";
    }

    private function as(string $token, string $origin): array
    {
        return ['Authorization' => 'Bearer '.$token, 'Origin' => $origin];
    }

    public function test_each_site_reads_only_its_own_words(): void
    {
        $this->getJson($this->url('acme'), $this->as($this->acmeSession, 'https://acme.test'))
            ->assertOk()->assertJsonPath('settings.heroTitle', 'Acme flies aircraft');

        $this->getJson($this->url('rival'), $this->as($this->rivalPublishable, 'https://rival.test'))
            ->assertOk()->assertJsonPath('settings.heroTitle', 'Rival flies better');
    }

    public function test_a_write_touches_one_site_only(): void
    {
        $this->postJson($this->url('acme'), ['key' => 'heroTitle', 'value' => 'Acme, rewritten'],
            $this->as($this->acmeSession, 'https://acme.test'))->assertOk();

        $this->assertSame('Acme, rewritten', $this->valueOf($this->acme, 'heroTitle'));
        $this->assertSame('Rival flies better', $this->valueOf($this->rival, 'heroTitle'),
            'one customer just rewrote another customer content');
    }

    public function test_the_same_key_on_two_sites_is_two_different_things(): void
    {
        // Auto keys come from content signatures, so two sites running the
        // same bought theme generate identical keys. Without a scope they
        // would be the same row.
        $this->postJson($this->url('acme'), ['key' => 'heroTitle', 'value' => 'Acme version'],
            $this->as($this->acmeSession, 'https://acme.test'))->assertOk();
        $this->postJson($this->url('rival'), ['key' => 'heroTitle', 'value' => 'Rival version'],
            $this->as($this->rivalSession, 'https://rival.test'))->assertOk();

        $this->assertSame('Acme version', $this->valueOf($this->acme, 'heroTitle'));
        $this->assertSame('Rival version', $this->valueOf($this->rival, 'heroTitle'));
        $this->assertSame(2, SiteSetting::query()->where('key', 'heroTitle')->count());
    }

    public function test_a_key_cannot_read_another_sites_content_even_by_asking_for_it(): void
    {
        $this->getJson($this->url('rival'), $this->as($this->acmeSession, 'https://acme.test'))
            ->assertStatus(403)
            ->assertJsonPath('error.message', 'This key does not belong to that site.');
    }

    public function test_drafts_are_held_per_site(): void
    {
        config()->set('live-edit.publishing', true);

        $this->postJson($this->url('acme'), ['key' => 'heroTitle', 'value' => 'Acme draft'],
            $this->as($this->acmeSession, 'https://acme.test'))->assertOk();

        // Acme's editor sees their own held work and nothing of Rival's.
        $this->getJson($this->url('acme'), $this->as($this->acmeSession, 'https://acme.test'))
            ->assertJsonPath('settings.heroTitle', 'Acme draft')
            ->assertJsonPath('pending', 1);

        $this->getJson($this->url('rival'), $this->as($this->rivalSession, 'https://rival.test'))
            ->assertJsonPath('settings.heroTitle', 'Rival flies better')
            ->assertJsonPath('pending', 0);

        $this->assertSame(1, Draft::query()->where('site_id', $this->acme->id)->count());
        $this->assertSame(0, Draft::query()->where('site_id', $this->rival->id)->count());
    }

    public function test_publishing_one_site_does_not_release_another(): void
    {
        config()->set('live-edit.publishing', true);

        foreach ([[$this->acme, $this->acmeSession, 'https://acme.test', 'Acme held'],
            [$this->rival, $this->rivalSession, 'https://rival.test', 'Rival held']] as [$site, $token, $origin, $value]) {
            $this->postJson($this->url($site->slug), ['key' => 'heroTitle', 'value' => $value],
                $this->as($token, $origin))->assertOk();
        }

        $this->postJson($this->url('acme', '/publish'), [], ['Authorization' => 'Bearer '.$this->acmeSecret])
            ->assertOk()->assertJsonPath('published', 1);

        $this->assertSame('Acme held', $this->valueOf($this->acme, 'heroTitle'));
        $this->assertSame('Rival flies better', $this->valueOf($this->rival, 'heroTitle'),
            "another customer's unfinished work was published for them");

        $this->assertSame(1, Draft::query()->where('site_id', $this->rival->id)->count(), 'their draft should still be held');
    }

    public function test_version_numbers_count_per_site(): void
    {
        // Two sites both have a v1. A shared sequence would leak how much
        // other customers publish, and make a rollback ambiguous.
        $acme = new SiteStore($this->acme);
        $rival = new SiteStore($this->rival);

        $this->assertSame(1, $acme->publish()['version']);
        $this->assertSame(1, $rival->publish()['version']);
        $this->assertSame(2, $acme->publish()['version']);

        $this->assertSame(2, $acme->version());
        $this->assertSame(1, $rival->version());
    }

    public function test_sites_keep_their_files_apart(): void
    {
        $acme = new SiteStore($this->acme);
        $rival = new SiteStore($this->rival);

        $this->assertNotSame($acme->snapshotDirectory(), $rival->snapshotDirectory());
        $this->assertNotSame($acme->mediaDirectory(), $rival->mediaDirectory());
        $this->assertStringContainsString('/acme', $acme->snapshotDirectory());
        $this->assertStringContainsString('/rival', $rival->mediaDirectory());
    }

    public function test_deleting_a_site_takes_its_content_with_it(): void
    {
        config()->set('live-edit.publishing', true);
        $this->postJson($this->url('acme'), ['key' => 'heroTitle', 'value' => 'Acme draft'],
            $this->as($this->acmeSession, 'https://acme.test'))->assertOk();

        $this->acme->delete();

        // Nothing of theirs left behind, and nothing of anyone else's taken.
        $this->assertSame(0, SiteSetting::query()->where('site_id', $this->acme->id)->count());
        $this->assertSame(0, Draft::query()->where('site_id', $this->acme->id)->count());
        $this->assertSame('Rival flies better', $this->valueOf($this->rival, 'heroTitle'));
    }

    private function valueOf(Site $site, string $key): ?string
    {
        return SiteSetting::query()->where('site_id', $site->id)->where('key', $key)->value('value');
    }
}
