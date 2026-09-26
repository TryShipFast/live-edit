<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use ShipFast\LiveEdit\Domain\Site\Provisioner;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\SiteVerification;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * That the site using a key is the site that bought it, and that a licence
 * ends.
 *
 * Both of these were assumptions rather than code until now: every key ever
 * issued had a null expiry, and a site's domain was whatever the person
 * registering it typed. These are written as attempts to get in under a
 * licence that is not yours — with a code you found on somebody's page, from
 * a domain you do not hold, after the year is up.
 */
class LicenceTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'admin_token' => 'provision-me',
            'throttle' => [
                'read' => ['burst' => ['max' => 500, 'seconds' => 60], 'sustained' => ['max' => 5000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 500, 'seconds' => 60], 'sustained' => ['max' => 5000, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'upload' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'provision' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'sign_in' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);
    }

    /** @return array{0: Site, 1: string} */
    private function licensedSite(array $attributes = []): array
    {
        $site = Site::query()->create(array_merge([
            'slug' => 'acme',
            'name' => 'Acme',
            'allowed_origins' => ['https://acme.test'],
            'domain' => 'acme.test',
            'verification_code' => 'shipfast-verify-abc123',
            'verified_at' => now(),
        ], $attributes));

        [, $plain] = $site->issueToken(TokenType::Publishable, 'Web', null, now()->addYear());

        return [$site, $plain];
    }

    private function ask(string $key, array $headers = [], array $body = []): TestResponse
    {
        $query = $body === [] ? '' : '?'.http_build_query($body);

        return $this->getJson('/api/live-edit/v1/acme/licence'.$query, array_merge([
            'Authorization' => 'Bearer '.$key,
        ], $headers));
    }

    public function test_a_current_licence_on_its_own_domain_is_valid(): void
    {
        [, $key] = $this->licensedSite();

        $this->ask($key, ['Origin' => 'https://acme.test'])
            ->assertOk()
            ->assertJsonPath('licence.valid', true)
            ->assertJsonPath('licence.verified', true)
            ->assertJsonPath('licence.domain_matches', true)
            ->assertJsonPath('licence.reason', null);
    }

    public function test_a_key_used_from_an_unlisted_origin_never_reaches_the_licence_check(): void
    {
        [, $key] = $this->licensedSite();

        // The stronger of the two answers, and the one that actually stops a
        // key lifted from a page's source: the origin policy refuses it
        // outright, so there is no licence to report on.
        $this->ask($key, ['Origin' => 'https://not-acme.test'])->assertForbidden();
    }

    public function test_an_allowed_origin_that_is_not_the_licensed_domain_is_a_mismatch(): void
    {
        // Two different questions, and this is where they come apart: the
        // origin policy is a list the customer edits, while the domain is the
        // one they PROVED. A stale or over-broad entry on the list gets past
        // the first and must still fail the second.
        [, $key] = $this->licensedSite(['allowed_origins' => ['https://acme.test', 'https://old-brand.test']]);

        $this->ask($key, ['Origin' => 'https://old-brand.test'])
            ->assertOk()
            ->assertJsonPath('licence.valid', false)
            ->assertJsonPath('licence.domain_matches', false)
            ->assertJsonPath('licence.reason', 'domain_mismatch');
    }

    public function test_a_browser_origin_beats_a_domain_the_caller_claims(): void
    {
        // A server can say what it likes in the body; a browser cannot forge
        // Origin. Where both are present the unforgeable one has to decide,
        // or the check is worth nothing.
        [, $key] = $this->licensedSite(['allowed_origins' => ['https://acme.test', 'https://old-brand.test']]);

        $this->ask($key, ['Origin' => 'https://old-brand.test'], ['domain' => 'acme.test'])
            ->assertJsonPath('licence.domain_matches', false)
            ->assertJsonPath('licence.observed_domain', 'old-brand.test');
    }

    public function test_www_is_the_same_site(): void
    {
        [, $key] = $this->licensedSite(['allowed_origins' => ['https://acme.test', 'https://www.acme.test']]);

        $this->ask($key, ['Origin' => 'https://www.acme.test'])
            ->assertJsonPath('licence.domain_matches', true);
    }

    public function test_a_licence_for_a_domain_does_not_cover_its_subdomains(): void
    {
        [, $key] = $this->licensedSite(['allowed_origins' => ['https://acme.test', 'https://staging.acme.test']]);

        // Staging, a client's white-label subdomain, anything else stood up
        // under a name the customer happens to control: separate sites, even
        // when the customer has allowed the origin.
        $this->ask($key, ['Origin' => 'https://staging.acme.test'])
            ->assertJsonPath('licence.domain_matches', false);
    }

    public function test_an_expired_licence_is_not_valid(): void
    {
        $site = Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'domain' => 'acme.test',
            'verification_code' => 'shipfast-verify-abc123',
            'verified_at' => now(),
        ]);

        [, $key] = $site->issueToken(TokenType::Publishable, 'Web', null, now()->subDay());

        // Expired keys are refused by the authenticator before they ever
        // reach the licence endpoint, which is the stronger answer: a lapsed
        // licence stops working rather than merely reporting that it has.
        $this->ask($key, ['Origin' => 'https://acme.test'])->assertUnauthorized();
    }

    public function test_an_unverified_site_is_reported_as_unverified_rather_than_matched(): void
    {
        [, $key] = $this->licensedSite(['verified_at' => null]);

        $this->ask($key, ['Origin' => 'https://acme.test'])
            ->assertJsonPath('licence.verified', false)
            ->assertJsonPath('licence.domain_matches', null)
            ->assertJsonPath('licence.reason', 'unverified');
    }

    public function test_a_suspended_site_cannot_use_its_key_at_all(): void
    {
        [, $key] = $this->licensedSite(['suspended_at' => now()]);

        // Refused by the authenticator rather than merely reported here,
        // which is the right order: suspension should stop a site working,
        // not tell it politely that it has been suspended.
        $this->ask($key, ['Origin' => 'https://acme.test'])->assertForbidden();
    }

    public function test_newly_provisioned_keys_expire_in_a_year(): void
    {
        $result = (new Provisioner)->create('fresh', 'Fresh', ['https://fresh.test'], 'fresh.test');

        foreach ($result['site']->tokens as $token) {
            $this->assertNotNull($token->expires_at, 'A key with no expiry is not a licence.');
            $this->assertEqualsWithDelta(365, now()->diffInDays($token->expires_at), 2);
        }

        $this->assertSame('fresh.test', $result['site']->domain);
        $this->assertNotNull($result['site']->verification_code);
    }

    public function test_renewing_early_adds_to_what_is_left_rather_than_resetting_it(): void
    {
        [$site] = $this->licensedSite();
        $before = $site->tokens()->first()->expires_at;

        (new Provisioner)->renew($site);

        $this->assertEqualsWithDelta(
            730,
            now()->diffInDays($site->tokens()->first()->refresh()->expires_at),
            2,
            'Renewing with a year left should leave two years, not one.'
        );
        $this->assertTrue($site->tokens()->first()->expires_at->gt($before));
    }

    public function test_renewing_after_lapsing_runs_from_today(): void
    {
        $site = Site::query()->create(['slug' => 'lapsed', 'name' => 'Lapsed']);
        $site->issueToken(TokenType::Publishable, 'Web', null, now()->subMonths(3));

        (new Provisioner)->renew($site);

        // Not backdated to nine months from now, which is what adding a year
        // to an expiry already in the past would have produced.
        $this->assertEqualsWithDelta(365, now()->diffInDays($site->tokens()->first()->expires_at), 2);
    }

    private function unverified(): Site
    {
        return Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'domain' => 'acme.test',
            'verification_code' => 'shipfast-verify-abc123',
        ]);
    }

    public function test_a_well_known_file_carrying_the_code_verifies_the_domain(): void
    {
        Http::fake([
            'acme.test/.well-known/*' => Http::response('shipfast-verify-abc123'),
        ]);

        $site = $this->unverified();
        $result = (new Provisioner)->verifyDomain($site);

        $this->assertTrue($result['verified']);
        $this->assertSame('file', $result['method']);
        $this->assertTrue($site->fresh()->isVerified());
    }

    public function test_a_meta_tag_carrying_the_code_verifies_the_domain(): void
    {
        Http::fake([
            'acme.test/.well-known/*' => Http::response('', 404),
            'acme.test' => Http::response('<html><head><meta name="shipfast-site-verification" content="shipfast-verify-abc123"></head></html>'),
        ]);

        $result = (new Provisioner)->verifyDomain($this->unverified());

        $this->assertTrue($result['verified']);
        $this->assertSame('meta', $result['method']);
    }

    public function test_the_code_merely_appearing_on_the_page_is_not_proof(): void
    {
        // The attack this closes: any site with user-generated content — a
        // forum, a comment thread, a search page that echoes its query —
        // would otherwise be verifiable by whoever can get a string onto it.
        Http::fake([
            'acme.test/.well-known/*' => Http::response('', 404),
            'acme.test' => Http::response('<html><body><p>shipfast-verify-abc123</p></body></html>'),
        ]);

        $result = (new Provisioner)->verifyDomain($this->unverified());

        $this->assertFalse($result['verified']);
        $this->assertSame('not_found', $result['reason']);
    }

    public function test_a_meta_tag_with_somebody_elses_code_does_not_verify(): void
    {
        Http::fake([
            'acme.test/.well-known/*' => Http::response('', 404),
            'acme.test' => Http::response('<html><head><meta name="shipfast-site-verification" content="shipfast-verify-someone-else"></head></html>'),
        ]);

        $this->assertFalse((new Provisioner)->verifyDomain($this->unverified())['verified']);
    }

    public function test_a_site_that_is_down_is_unreachable_rather_than_failed(): void
    {
        // Different problem, different fix. Telling somebody their proof is
        // missing when their server is simply down sends them to edit a
        // template that was already correct.
        Http::fake(fn () => throw new ConnectionException('down'));

        $result = (new Provisioner)->verifyDomain($this->unverified());

        $this->assertFalse($result['verified']);
        $this->assertSame('unreachable', $result['reason']);
    }

    public function test_every_registration_gets_a_code_nobody_can_guess(): void
    {
        $codes = collect(range(1, 20))->map(fn () => SiteVerification::newCode());

        $this->assertCount(20, $codes->unique());
        $this->assertGreaterThanOrEqual(32, strlen($codes->first()));
    }

    public function test_a_domain_is_compared_as_a_site_rather_than_as_a_spelling(): void
    {
        foreach (['https://ACME.test/pricing?x=1', 'acme.test', 'http://www.acme.test:8080', 'acme.test.'] as $spelling) {
            $this->assertSame('acme.test', SiteVerification::normaliseDomain($spelling), $spelling);
        }
    }

    public function test_a_local_development_site_may_be_verified_over_http(): void
    {
        // So the flow can be tried on shipfast.test before it is trusted in
        // production, which is the worst possible place to first find out
        // that it does not work.
        Http::fake([
            'https://dev.test/*' => Http::response('', 500),
            'https://dev.test' => Http::response('', 500),
            'http://dev.test/.well-known/*' => Http::response('shipfast-verify-abc123'),
        ]);

        $site = Site::query()->create([
            'slug' => 'dev',
            'name' => 'Dev',
            'domain' => 'dev.test',
            'verification_code' => 'shipfast-verify-abc123',
        ]);

        $this->assertTrue((new Provisioner)->verifyDomain($site)['verified']);
    }

    public function test_a_real_domain_is_never_asked_over_plain_http(): void
    {
        // The one that matters. A proof carried in clear is one the network
        // can forge, so the http fallback must stay shut for anything that
        // could be a real site — even when https is failing and http would
        // happily answer.
        Http::fake([
            'https://acme.com/*' => Http::response('', 500),
            'https://acme.com' => Http::response('', 500),
            'http://acme.com/.well-known/*' => Http::response('shipfast-verify-abc123'),
        ]);

        $site = Site::query()->create([
            'slug' => 'real',
            'name' => 'Real',
            'domain' => 'acme.com',
            'verification_code' => 'shipfast-verify-abc123',
        ]);

        $this->assertFalse((new Provisioner)->verifyDomain($site)['verified']);

        Http::assertNotSent(fn ($request) => str_starts_with($request->url(), 'http://'));
    }

    public function test_only_development_hostnames_count_as_local(): void
    {
        foreach (['shipfast.test', 'learnkasts.test', 'localhost', 'app.localhost'] as $local) {
            $this->assertTrue(SiteVerification::isLocal($local), $local);
        }

        // "attacker-test.com" ends in neither, and must not be coaxed into
        // the relaxed path by looking a bit like it does.
        foreach (['acme.com', 'attacker-test.com', 'test.com', 'nottest.example'] as $real) {
            $this->assertFalse(SiteVerification::isLocal($real), $real);
        }
    }
}
