<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Support\Snapshot;
use ShipFast\LiveEdit\Tests\Fixtures\Setting;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * What happens under load, and what a cache is told.
 */
class ApiTrafficTest extends TestCase
{
    protected Site $site;

    protected string $publishable;

    protected string $session;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'throttle' => [
                // Deliberately tiny, so the limit is reached in a test rather
                // than by hammering it a hundred times.
                'read' => ['burst' => ['max' => 3, 'seconds' => 60], 'sustained' => ['max' => 5, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 2, 'seconds' => 60], 'sustained' => ['max' => 4, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 2, 'seconds' => 60], 'sustained' => ['max' => 4, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 2, 'seconds' => 60], 'sustained' => ['max' => 4, 'seconds' => 3600]],
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

        $this->site = Site::query()->create([
            'slug' => 'client',
            'name' => 'Client',
            'allowed_origins' => ['https://client.test'],
        ]);

        [, $this->publishable] = $this->site->issueToken(TokenType::Publishable, 'Web');
        [, $this->session] = $this->site->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());

        Setting::query()->create(['key' => 'heroTitle', 'value' => 'Published']);
    }

    protected function url(string $path = '/content'): string
    {
        return '/api/live-edit/v1/client'.$path;
    }

    protected function as(string $token, array $headers = []): array
    {
        return array_merge(['Authorization' => 'Bearer '.$token], $headers);
    }

    public function test_a_flood_of_reads_is_refused_with_a_retry_after(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->getJson($this->url(), $this->as($this->publishable))->assertOk();
        }

        $refused = $this->getJson($this->url(), $this->as($this->publishable));

        $refused->assertStatus(429)->assertJsonPath('error.type', 'rate_limit_error');
        $this->assertNotNull($refused->headers->get('Retry-After'));
        $this->assertSame('0', $refused->headers->get('RateLimit-Remaining'));
    }

    public function test_every_response_says_how_much_is_left(): void
    {
        $response = $this->getJson($this->url(), $this->as($this->publishable));

        $response->assertOk();
        $this->assertSame('3', $response->headers->get('RateLimit-Limit'));
        $this->assertNotNull($response->headers->get('RateLimit-Remaining'));
    }

    public function test_writes_are_limited_separately_from_reads(): void
    {
        // Reading to the read limit must not spend the write allowance.
        for ($i = 0; $i < 3; $i++) {
            $this->getJson($this->url(), $this->as($this->publishable))->assertOk();
        }

        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'One'],
            $this->as($this->session, ['Origin' => 'https://client.test']))->assertOk();
    }

    public function test_one_sites_flood_does_not_exhaust_another(): void
    {
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other', 'allowed_origins' => []]);
        [, $theirs] = $other->issueToken(TokenType::Publishable, 'Web');

        for ($i = 0; $i < 4; $i++) {
            $this->getJson($this->url(), $this->as($this->publishable));
        }

        $this->getJson('/api/live-edit/v1/other/content', $this->as($theirs))->assertOk();
    }

    public function test_unauthenticated_floods_are_counted_by_address(): void
    {
        // The limit has to bite before authentication, or an attacker with no
        // key at all still costs a database lookup per request.
        for ($i = 0; $i < 3; $i++) {
            $this->getJson($this->url())->assertStatus(401);
        }

        $this->getJson($this->url())->assertStatus(429);
    }

    public function test_a_client_that_already_has_this_version_is_told_so(): void
    {
        $first = $this->getJson($this->url(), $this->as($this->publishable))->assertOk();
        $etag = $first->headers->get('ETag');

        $this->assertNotNull($etag);

        $second = $this->getJson($this->url(), $this->as($this->publishable, ['If-None-Match' => $etag]));

        $second->assertStatus(304);
        $this->assertSame('', $second->getContent(), 'a 304 must carry no body');
    }

    public function test_a_weakened_etag_from_a_proxy_is_still_recognised(): void
    {
        $etag = $this->getJson($this->url(), $this->as($this->publishable))->headers->get('ETag');

        $this->getJson($this->url(), $this->as($this->publishable, ['If-None-Match' => 'W/'.$etag]))
            ->assertStatus(304);
    }

    public function test_a_changed_word_changes_the_tag(): void
    {
        // What a cache actually needs to know: the content is not what it was.
        // With publishing off a save is live immediately, so the tag has to
        // follow the content rather than a version that never moves.
        $before = $this->getJson($this->url(), $this->as($this->publishable))->headers->get('ETag');

        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'Something else'],
            $this->as($this->session, ['Origin' => 'https://client.test']))->assertOk();

        $after = $this->getJson($this->url(), $this->as($this->publishable))->headers->get('ETag');

        $this->assertNotSame($before, $after, 'a cache would keep serving the old words');
    }

    public function test_a_held_change_does_not_move_the_tag_until_it_is_published(): void
    {
        // With publishing on the opposite has to hold: a draft is nobody
        // else's business, so caches must not be told anything changed.
        config()->set('live-edit.publishing', true);

        $before = $this->getJson($this->url(), $this->as($this->publishable))->headers->get('ETag');

        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'Still drafting'],
            $this->as($this->session, ['Origin' => 'https://client.test']))->assertOk();

        $this->assertSame(
            $before,
            $this->getJson($this->url(), $this->as($this->publishable))->headers->get('ETag'),
            'an unpublished draft must not invalidate anybody cache'
        );

        Snapshot::publish();

        $this->assertNotSame(
            $before,
            $this->getJson($this->url(), $this->as($this->publishable))->headers->get('ETag'),
            'publishing must invalidate it'
        );
    }

    public function test_content_is_cacheable_with_a_stale_window(): void
    {
        $response = $this->getJson($this->url(), $this->as($this->publishable))->assertOk();

        $cacheControl = $response->headers->get('Cache-Control');

        $this->assertStringContainsString('s-maxage=30', $cacheControl);
        $this->assertStringContainsString('stale-while-revalidate=86400', $cacheControl);
    }

    public function test_a_credential_is_never_cacheable(): void
    {
        [, $secret] = $this->site->issueToken(TokenType::Secret, 'Server');

        $response = $this->postJson($this->url('/sessions'), [], $this->as($secret))->assertOk();

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }
}
