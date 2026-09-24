<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\Fixtures\Setting;
use ShipFast\LiveEdit\Tests\TestCase;

class ApiEndpointTest extends TestCase
{
    protected Site $site;

    protected string $publishable;

    protected string $secret;

    protected string $session;

    /**
     * The API's routes are registered at boot, so it has to be switched on
     * before the application starts rather than inside a test.
     */
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'throttle' => [
                'read' => ['burst' => ['max' => 120, 'seconds' => 60], 'sustained' => ['max' => 3000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 40, 'seconds' => 60], 'sustained' => ['max' => 600, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 10, 'seconds' => 60], 'sustained' => ['max' => 120, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 6, 'seconds' => 60], 'sustained' => ['max' => 60, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('live-edit.settings', ['heroTitle', 'ctaHref', 'videoSrc']);

        // Laravel's own CORS middleware defaults to paths ['api/*'] with
        // origins ['*'], which matches this prefix and overwrites our header
        // with a wildcard. Turned off here so these tests exercise ours —
        // and see the wide-open case covered explicitly further down.
        $app['config']->set('cors.paths', []);
        $app['config']->set('live-edit.publishing', false);
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
        [, $this->secret] = $this->site->issueToken(TokenType::Secret, 'Server');
        [, $this->session] = $this->site->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());

        Setting::query()->create(['key' => 'heroTitle', 'value' => 'Published']);
    }

    protected function url(string $path = '/content'): string
    {
        return '/'.config('live-edit.api.prefix').'/client'.$path;
    }

    protected function as(string $token, array $headers = []): array
    {
        return array_merge(['Authorization' => 'Bearer '.$token], $headers);
    }

    // --- reading -------------------------------------------------------

    public function test_a_publishable_key_reads_content(): void
    {
        $response = $this->getJson($this->url(), $this->as($this->publishable, ['Origin' => 'https://client.test']));

        $response->assertOk()
            ->assertJsonPath('settings.heroTitle', 'Published')
            ->assertHeader('Access-Control-Allow-Origin', 'https://client.test');

        $this->assertStringContainsString('Origin', $response->headers->get('Vary'));
    }

    public function test_reading_without_a_key_is_refused(): void
    {
        $this->getJson($this->url())->assertStatus(401)
            ->assertJsonPath('error.type', 'authentication_error');
    }

    public function test_a_key_in_the_query_string_does_not_work(): void
    {
        // Keys in URLs end up in access logs and Referer headers.
        $this->getJson($this->url().'?api_key='.$this->publishable)->assertStatus(401);
    }

    public function test_a_second_sites_key_cannot_read_this_site(): void
    {
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other', 'allowed_origins' => ['https://other.test']]);
        [, $theirs] = $other->issueToken(TokenType::Publishable, 'Web');

        $this->getJson($this->url(), $this->as($theirs))->assertStatus(403)
            ->assertJsonPath('error.message', 'This key does not belong to that site.');
    }

    // --- writing -------------------------------------------------------

    public function test_a_session_key_writes(): void
    {
        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'Changed'],
            $this->as($this->session, ['Origin' => 'https://client.test']))
            ->assertOk()
            ->assertJsonPath('saved', true);

        $this->assertSame('Changed', Setting::query()->where('key', 'heroTitle')->value('value'));
    }

    public function test_a_publishable_key_cannot_write(): void
    {
        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'Hacked'],
            $this->as($this->publishable, ['Origin' => 'https://client.test']))
            ->assertStatus(403);

        $this->assertSame('Published', Setting::query()->where('key', 'heroTitle')->value('value'));
    }

    public function test_a_write_from_an_unlisted_origin_is_refused(): void
    {
        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'Hacked'],
            $this->as($this->session, ['Origin' => 'https://attacker.test']))
            ->assertStatus(403);

        $this->assertSame('Published', Setting::query()->where('key', 'heroTitle')->value('value'));
    }

    public function test_an_undeclared_key_cannot_be_written(): void
    {
        $this->postJson($this->url(), ['key' => 'somethingElse', 'value' => 'x'],
            $this->as($this->session, ['Origin' => 'https://client.test']))
            ->assertStatus(422)
            ->assertJsonPath('error.type', 'invalid_request_error');
    }

    public function test_a_javascript_uri_cannot_be_written_through_the_api(): void
    {
        foreach ([['ctaHref', 'javascript:alert(1)'], ['videoSrc', 'data:text/html,<script>alert(1)</script>']] as [$key, $payload]) {
            $this->postJson($this->url(), ['key' => $key, 'value' => $payload],
                $this->as($this->session, ['Origin' => 'https://client.test']))
                ->assertStatus(422);

            $this->assertNull(Setting::query()->where('key', $key)->value('value'), "{$key} was written");
        }
    }

    // --- sessions ------------------------------------------------------

    public function test_a_secret_key_mints_a_session(): void
    {
        $response = $this->postJson($this->url('/sessions'), ['label' => 'Amaka'], $this->as($this->secret));

        $response->assertOk()->assertJsonStructure(['token', 'expires_at', 'site']);
        $this->assertStringStartsWith('kbe_', $response->json('token'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_a_session_key_cannot_mint_another_session(): void
    {
        // Otherwise a scraped session renews itself forever and the expiry is
        // decoration.
        $this->postJson($this->url('/sessions'), [], $this->as($this->session, ['Origin' => 'https://client.test']))
            ->assertStatus(403);
    }

    public function test_a_secret_key_used_from_a_browser_is_refused(): void
    {
        $this->postJson($this->url('/sessions'), [], $this->as($this->secret, ['Origin' => 'https://client.test']))
            ->assertStatus(403)
            ->assertJsonPath('error.message', 'A secret key must not be used from a browser.');
    }

    // --- publishing ----------------------------------------------------

    public function test_only_a_secret_key_may_publish(): void
    {
        $this->postJson($this->url('/publish'), [], $this->as($this->session, ['Origin' => 'https://client.test']))
            ->assertStatus(403);

        $this->postJson($this->url('/publish'), [], $this->as($this->secret))->assertOk();
    }

    // --- preflight -----------------------------------------------------

    public function test_a_preflight_is_answered_without_credentials(): void
    {
        $response = $this->call('OPTIONS', $this->url(), [], [], [], [
            'HTTP_ORIGIN' => 'https://client.test',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        $response->assertNoContent(204);
        $this->assertSame('https://client.test', $response->headers->get('Access-Control-Allow-Origin'));
        $this->assertStringContainsString('Authorization', $response->headers->get('Access-Control-Allow-Headers'));
    }

    public function test_a_host_with_wide_open_cors_still_cannot_be_used_by_another_origin(): void
    {
        // Laravel ships cors.paths = ['api/*'] and allowed_origins = ['*'],
        // which matches this prefix on a default install. That header is not
        // what protects anything — the key check is — and this proves it: with
        // the host's CORS as permissive as it gets, a page on another origin
        // still cannot read or write.
        config()->set('cors.paths', ['api/*']);
        config()->set('cors.allowed_origins', ['*']);

        $this->getJson($this->url(), $this->as($this->publishable, ['Origin' => 'https://attacker.test']))
            ->assertStatus(403);

        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'Hacked'],
            $this->as($this->session, ['Origin' => 'https://attacker.test']))
            ->assertStatus(403);

        $this->assertSame('Published', Setting::query()->where('key', 'heroTitle')->value('value'));
    }

    public function test_a_preflight_from_an_unlisted_origin_is_not_blessed(): void
    {
        $response = $this->call('OPTIONS', $this->url(), [], [], [], [
            'HTTP_ORIGIN' => 'https://attacker.test',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        // The browser refuses the call when the header is absent.
        $this->assertNull($response->headers->get('Access-Control-Allow-Origin'));
    }
}
