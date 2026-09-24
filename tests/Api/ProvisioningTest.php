<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenAuthenticator;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

class ProvisioningTest extends TestCase
{
    private const ADMIN = 'provision-me-please';

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'admin_token' => self::ADMIN,
            'throttle' => [
                'read' => ['burst' => ['max' => 120, 'seconds' => 60], 'sustained' => ['max' => 3000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 40, 'seconds' => 60], 'sustained' => ['max' => 600, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 10, 'seconds' => 60], 'sustained' => ['max' => 120, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 6, 'seconds' => 60], 'sustained' => ['max' => 60, 'seconds' => 3600]],
                'upload' => ['burst' => ['max' => 12, 'seconds' => 60], 'sustained' => ['max' => 200, 'seconds' => 3600]],
                'provision' => ['burst' => ['max' => 6, 'seconds' => 60], 'sustained' => ['max' => 50, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);
    }

    private function admin(array $extra = []): array
    {
        return array_merge(['Authorization' => 'Bearer '.self::ADMIN], $extra);
    }

    private function url(string $path = ''): string
    {
        return '/api/live-edit/v1/sites'.$path;
    }

    // --- getting started ------------------------------------------------

    public function test_a_site_is_created_with_both_keys_at_once(): void
    {
        $response = $this->postJson($this->url(), [
            'slug' => 'acme',
            'name' => 'Acme Aviation',
            'origins' => ['https://acme.test', 'https://*.acme.test'],
        ], $this->admin());

        $response->assertCreated()
            ->assertJsonPath('site.slug', 'acme')
            ->assertJsonPath('site.origins', ['https://acme.test', 'https://*.acme.test']);

        // A site with only one of them cannot be used: one reads, the other
        // vouches for editors.
        $this->assertStringStartsWith('kbp_', $response->json('keys.publishable'));
        $this->assertStringStartsWith('kbs_', $response->json('keys.secret'));

        // And they work.
        $auth = new TokenAuthenticator;
        $this->assertTrue($auth->authenticate($response->json('keys.publishable'), 'https://acme.test', Ability::Read)->passed());
        $this->assertTrue($auth->authenticate($response->json('keys.secret'), null, Ability::Mint)->passed());
    }

    public function test_keys_are_never_readable_afterwards(): void
    {
        $created = $this->postJson($this->url(), ['slug' => 'acme'], $this->admin())->assertCreated();
        $secret = $created->json('keys.secret');

        $shown = $this->getJson($this->url('/acme'), $this->admin())->assertOk();

        // Identities and states, never the key. A listing that leaked them
        // would make the whole "shown once" promise decoration.
        $this->assertStringNotContainsString(explode('_', $secret)[2], $shown->getContent());
        $this->assertCount(2, $shown->json('site.keys'));
        $this->assertArrayHasKey('id', $shown->json('site.keys.0'));
    }

    public function test_the_response_that_carries_keys_is_never_cached(): void
    {
        $response = $this->postJson($this->url(), ['slug' => 'acme'], $this->admin());

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    // --- who may do this ------------------------------------------------

    public function test_provisioning_is_refused_without_the_key(): void
    {
        $this->postJson($this->url(), ['slug' => 'acme'])->assertStatus(401);
        $this->assertSame(0, Site::query()->count());
    }

    public function test_a_sites_own_key_cannot_provision(): void
    {
        // The whole reason this sits behind a separate credential: a leak from
        // one customer's server must not be able to create sites.
        $site = Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => []]);
        [, $secret] = $site->issueToken(TokenType::Secret, 'Server');

        $this->postJson($this->url(), ['slug' => 'other'], ['Authorization' => 'Bearer '.$secret])
            ->assertStatus(401);

        $this->assertSame(1, Site::query()->count());
    }

    public function test_provisioning_is_refused_from_a_browser(): void
    {
        $this->postJson($this->url(), ['slug' => 'acme'], $this->admin(['Origin' => 'https://anywhere.test']))
            ->assertStatus(403);

        $this->assertSame(0, Site::query()->count());
    }

    public function test_the_endpoints_are_absent_when_no_token_is_configured(): void
    {
        // A single-site installation provisions from the console and should
        // expose nothing at all.
        config()->set('live-edit.api.admin_token', '');

        $this->postJson($this->url(), ['slug' => 'acme'], $this->admin())->assertStatus(404);
        $this->assertSame(0, Site::query()->count());
    }

    // --- what it refuses ------------------------------------------------

    public function test_a_duplicate_slug_is_refused(): void
    {
        $this->postJson($this->url(), ['slug' => 'acme'], $this->admin())->assertCreated();
        $this->postJson($this->url(), ['slug' => 'acme'], $this->admin())->assertStatus(422);

        $this->assertSame(1, Site::query()->count());
    }

    public function test_a_bad_slug_is_refused(): void
    {
        foreach (['a', 'has space', '-leading', 'with/slash', '', 'aå'] as $slug) {
            $this->postJson($this->url(), ['slug' => $slug], $this->admin())->assertStatus(422);
        }

        $this->assertSame(0, Site::query()->count());
    }

    public function test_a_slug_is_normalised_rather_than_rejected_for_its_case(): void
    {
        // "Acme" plainly means the site "acme". Refusing it would be pedantry,
        // and two callers spelling it differently must not create two sites.
        $this->postJson($this->url(), ['slug' => '  Acme  '], $this->admin())
            ->assertCreated()
            ->assertJsonPath('site.slug', 'acme');

        $this->postJson($this->url(), ['slug' => 'acme'], $this->admin())->assertStatus(422);

        $this->assertSame(1, Site::query()->count());
    }

    public function test_something_that_is_not_an_origin_is_refused(): void
    {
        // Worse than none: it matches nothing, and the symptom is a CORS error
        // on the customer's own site that looks like a bug in their page.
        $response = $this->postJson($this->url(), [
            'slug' => 'acme',
            'origins' => ['acme.test'],
        ], $this->admin());

        $response->assertStatus(422);
        $this->assertStringContainsString('is not an origin', $response->json('error.message'));
        $this->assertSame(0, Site::query()->count());
    }

    // --- running a site -------------------------------------------------

    public function test_origins_can_be_changed_later(): void
    {
        $this->postJson($this->url(), ['slug' => 'acme', 'origins' => ['https://old.test']], $this->admin());

        $this->patchJson($this->url('/acme'), ['origins' => ['https://new.test']], $this->admin())
            ->assertOk()
            ->assertJsonPath('site.origins', ['https://new.test']);
    }

    public function test_a_site_can_be_suspended_and_restored(): void
    {
        $created = $this->postJson($this->url(), ['slug' => 'acme', 'origins' => ['https://acme.test']], $this->admin());
        $key = $created->json('keys.publishable');
        $auth = new TokenAuthenticator;

        $this->patchJson($this->url('/acme'), ['suspended' => true], $this->admin())
            ->assertOk()->assertJsonPath('site.suspended', true);

        // Every key stops at once, without anything being destroyed.
        $this->assertFalse($auth->authenticate($key, 'https://acme.test')->passed());

        $this->patchJson($this->url('/acme'), ['suspended' => false], $this->admin())->assertOk();

        $this->assertTrue($auth->authenticate($key, 'https://acme.test')->passed());
    }

    public function test_a_key_can_be_rotated_without_a_gap(): void
    {
        $created = $this->postJson($this->url(), ['slug' => 'acme', 'origins' => ['https://acme.test']], $this->admin());
        $old = $created->json('keys.publishable');

        $issued = $this->postJson($this->url('/acme/keys'), ['type' => 'publishable', 'label' => 'Rotated'], $this->admin())
            ->assertCreated();

        $new = $issued->json('key');
        $auth = new TokenAuthenticator;

        // Both work, so a running site is never without a key mid-deploy.
        $this->assertTrue($auth->authenticate($old, 'https://acme.test')->passed());
        $this->assertTrue($auth->authenticate($new, 'https://acme.test')->passed());

        $oldId = explode('_', $old)[1];
        $this->deleteJson($this->url('/acme/keys/'.$oldId), [], $this->admin())->assertOk();

        $this->assertFalse($auth->authenticate($old, 'https://acme.test')->passed());
        $this->assertTrue($auth->authenticate($new, 'https://acme.test')->passed());
    }

    public function test_a_session_key_cannot_be_provisioned(): void
    {
        // Sessions are minted by a site's own server, after it has decided
        // someone may edit. Provisioning one would skip that judgement.
        $this->postJson($this->url(), ['slug' => 'acme'], $this->admin());

        $this->postJson($this->url('/acme/keys'), ['type' => 'session'], $this->admin())->assertStatus(422);
    }

    public function test_one_sites_key_cannot_be_revoked_through_another(): void
    {
        $this->postJson($this->url(), ['slug' => 'acme'], $this->admin());
        $other = $this->postJson($this->url(), ['slug' => 'other'], $this->admin());

        $theirKeyId = explode('_', $other->json('keys.publishable'))[1];

        $this->deleteJson($this->url('/acme/keys/'.$theirKeyId), [], $this->admin())->assertStatus(404);

        $this->assertNull(ApiToken::query()->where('public_id', $theirKeyId)->value('revoked_at'));
    }

    public function test_provisioning_is_throttled(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->postJson($this->url(), ['slug' => 'site-'.$i], $this->admin())->assertCreated();
        }

        $this->postJson($this->url(), ['slug' => 'site-last'], $this->admin())->assertStatus(429);
    }
}
