<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenAuthenticator;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

class ManageApiSiteTest extends TestCase
{
    public function test_a_site_and_a_working_key_can_be_created_from_the_console(): void
    {
        $this->artisan('live-edit:site create client --origins=https://client.test')
            ->assertSuccessful();

        $site = Site::query()->where('slug', 'client')->firstOrFail();
        $this->assertSame(['https://client.test'], $site->allowed_origins);

        $this->artisan('live-edit:site key client --type=secret')->assertSuccessful();

        // The key printed is the only copy; what is stored is a hash of it.
        $token = $site->tokens()->firstOrFail();
        $this->assertSame(64, strlen($token->secret_hash));
    }

    public function test_a_site_with_no_origins_says_no_browser_can_call_it(): void
    {
        $this->artisan('live-edit:site create bare')
            ->expectsOutputToContain('No origins listed yet')
            ->assertSuccessful();
    }

    public function test_a_revoked_key_stops_authenticating(): void
    {
        $site = Site::query()->create(['slug' => 'client', 'name' => 'Client', 'allowed_origins' => []]);
        [$token, $plain] = $site->issueToken(TokenType::Publishable, 'Web');

        $this->assertTrue((new TokenAuthenticator)->authenticate($plain)->passed());

        $this->artisan('live-edit:site revoke '.$token->public_id)->assertSuccessful();

        $this->assertFalse((new TokenAuthenticator)->authenticate($plain)->passed());
    }

    public function test_sessions_cannot_be_minted_from_the_console(): void
    {
        Site::query()->create(['slug' => 'client', 'name' => 'Client', 'allowed_origins' => []]);

        $this->artisan('live-edit:site key client --type=session')->assertFailed();
    }
}
