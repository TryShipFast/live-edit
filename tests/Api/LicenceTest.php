<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\Platform;
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

    public function test_a_server_that_names_no_domain_has_not_named_the_wrong_one(): void
    {
        /*
         * The case that switched the editor off on correctly licensed sites.
         *
         * A browser sends an Origin. A server asking on its own behalf — the
         * WordPress plugin, a Laravel install checking on a schedule — sends
         * nothing, and "nothing" was being read as "not your domain", so
         * every such install was told its licence belonged to somebody else.
         * It went unseen only because the check could not reach us from a
         * local install at all and fell open instead.
         */
        [, $key] = $this->licensedSite();

        // No Origin, no claimed domain. Exactly what wp_remote_get sends.
        $this->ask($key)
            ->assertOk()
            ->assertJsonPath('licence.valid', true)
            ->assertJsonPath('licence.domain_matches', null)
            ->assertJsonPath('licence.observed_domain', null)
            ->assertJsonPath('licence.reason', null);
    }

    public function test_a_server_naming_somebody_elses_domain_is_still_a_mismatch(): void
    {
        // Saying nothing is unknown; saying the wrong thing is still wrong.
        // A claim can be made up, which is why this is a tripwire rather than
        // a lock, but a tripwire that ignores what it is told is not one.
        [, $key] = $this->licensedSite();

        $this->ask($key, [], ['domain' => 'somebody-else.com'])
            ->assertJsonPath('licence.valid', false)
            ->assertJsonPath('licence.domain_matches', false)
            ->assertJsonPath('licence.reason', 'domain_mismatch');
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

        $site->forceFill(['allowed_origins' => ['https://acme.test']])->save();

        [, $key] = $site->issueToken(TokenType::Publishable, 'Web', null, now()->subDay());

        /*
         * This used to expect a 401, on the reasoning that refusing outright
         * is the stronger answer: a lapsed licence should stop working rather
         * than merely report that it has.
         *
         * That was the wrong trade, and the cost only showed up on a static
         * site. Refusing the key outright refuses READS as well, and a static
         * page is filled in the browser, so a lapse took every word the
         * customer had published off their live website and put the template's
         * original text back. Stronger enforcement, and the one thing this
         * product promises never to do.
         *
         * So the key authenticates and the endpoint answers honestly: not
         * valid, and here is why. The install can then say "renew" instead of
         * "this key is no longer accepted", which is the difference between
         * somebody paying us and somebody hunting for a key.
         */
        $response = $this->ask($key, ['Origin' => 'https://acme.test'])->assertOk();

        $response->assertJsonPath('licence.valid', false)
            ->assertJsonPath('licence.reason', 'expired');
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

    public function test_a_page_served_where_the_file_should_be_is_not_a_file(): void
    {
        /*
         * Found on a real static site. A plain `php -S` answers an unknown
         * path with the home page, so the well-known request came back with
         * the whole document — which contained the code, because the meta tag
         * was installed — and verification reported method "file" for a file
         * that did not exist.
         *
         * Harmless there, because the code was on their own page. Not
         * harmless in general: it is the same hole the home page check was
         * hardened against, where anybody who can get a string onto a site
         * can prove they own it.
         */
        Http::fake([
            'acme.test/.well-known/*' => Http::response(
                '<html><head><meta name="shipfast-site-verification" content="shipfast-verify-abc123"></head></html>'
            ),
            'acme.test' => Http::response('', 404),
        ]);

        $result = (new Provisioner)->verifyDomain($this->unverified());

        $this->assertFalse($result['verified']);
        $this->assertNull($result['method']);
    }

    public function test_a_file_may_end_with_a_newline_the_way_every_editor_writes_it(): void
    {
        Http::fake(['acme.test/.well-known/*' => Http::response("shipfast-verify-abc123\n")]);

        $this->assertSame('file', (new Provisioner)->verifyDomain($this->unverified())['method']);
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

    public function test_a_site_remembers_what_it_is_built_with(): void
    {
        $result = (new Provisioner)->create('built', 'Built', [], 'built.com', 'nextjs');

        $this->assertSame('nextjs', $result['site']->platform);
    }

    public function test_a_platform_nobody_offers_is_recorded_as_nothing_rather_than_guessed(): void
    {
        // Nothing is a real answer: the console then asks. A site quietly
        // recorded as WordPress would be handed a plugin it cannot use.
        foreach (['drupal', '', 'WORDPRESS'] as $submitted) {
            $expected = $submitted === 'WORDPRESS' ? 'wordpress' : null;

            $this->assertSame($expected, Platform::clean($submitted), $submitted);
        }
    }

    public function test_registering_a_development_site_keeps_the_port_it_was_given(): void
    {
        // Registration used to store the name alone, so a site registered at
        // 127.0.0.1:8110 was recorded as 127.0.0.1 and every check went to
        // port 443 of a host that answers on 8110. Verification could never
        // succeed, and the message said the site was unreachable rather than
        // that we had thrown the address away ourselves.
        $result = (new Provisioner)->create('ported', 'Ported', [], 'http://127.0.0.1:8110');

        $this->assertSame('127.0.0.1:8110', $result['site']->domain);

        // And the identity is still the name: a request arriving from
        // 127.0.0.1 is this site, which is how a licence check sees it once
        // the domain has been proved.
        $this->assertTrue(SiteVerification::covers((string) $result['site']->domain, '127.0.0.1'));
    }

    public function test_a_site_served_on_a_port_is_asked_on_that_port(): void
    {
        // A development install almost always sits on one, and the identity
        // the licence is for has no port in it, so the port was being dropped
        // on the way out as well: every check knocked on 443 of a host that
        // answers on 8088 and came back "we could not reach you".
        Http::fake([
            'http://dev.test:8088/.well-known/*' => Http::response('shipfast-verify-abc123'),
            '*' => Http::response('', 500),
        ]);

        $site = Site::query()->create([
            'slug' => 'ported',
            'name' => 'Ported',
            'domain' => 'dev.test:8088',
            'verification_code' => 'shipfast-verify-abc123',
        ]);

        $this->assertTrue((new Provisioner)->verifyDomain($site)['verified']);

        // And the port is still nowhere near the identity: a request arriving
        // from dev.test is the same site, which is how the licence check sees
        // it, since a host header carries no port.
        $this->assertTrue(SiteVerification::covers('dev.test:8088', 'dev.test'));
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

    public function test_a_key_cannot_be_used_for_a_site_it_was_not_issued_to(): void
    {
        // The mapping is the whole licence. A key that worked against any
        // site would make "this key belongs to acme.com" a note rather than
        // a rule, and one leaked key would unlock every customer.
        [, $key] = $this->licensedSite();

        Site::query()->create([
            'slug' => 'someone-else',
            'name' => 'Someone else',
            'allowed_origins' => ['https://acme.test'],
            'domain' => 'acme.test',
            'verification_code' => 'shipfast-verify-abc123',
            'verified_at' => now(),
        ]);

        // Forbidden rather than unauthorised: the key is real and was
        // recognised, it simply does not belong to this site.
        $this->getJson('/api/live-edit/v1/someone-else/licence', [
            'Authorization' => 'Bearer '.$key,
            'Origin' => 'https://acme.test',
        ])->assertForbidden();
    }

    public function test_an_expired_session_is_not_somebody_who_may_edit(): void
    {
        $site = Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => ['https://acme.test']]);
        $editor = Editor::query()->create(['site_id' => $site->id, 'email' => 'tope@acme.test', 'name' => 'Tope']);

        [, $live] = $site->issueToken(TokenType::Session, 'Tope', null, now()->addHour(), $editor->id);
        [, $stale] = $site->issueToken(TokenType::Session, 'Tope', null, now()->subMinute(), $editor->id);

        // A site that keeps its own content asks this before showing anybody
        // an editor, so an expired session has to read as "not you".
        $this->getJson('/api/live-edit/v1/acme/session', [
            'Authorization' => 'Bearer '.$live, 'Origin' => 'https://acme.test',
        ])->assertOk()->assertJsonPath('session.valid', true);

        $this->getJson('/api/live-edit/v1/acme/session', [
            'Authorization' => 'Bearer '.$stale, 'Origin' => 'https://acme.test',
        ])->assertUnauthorized();
    }

    public function test_a_session_says_who_is_editing_so_a_site_can_greet_them(): void
    {
        $site = Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => ['https://acme.test']]);
        $editor = Editor::query()->create(['site_id' => $site->id, 'email' => 'tope@acme.test', 'name' => 'Tope']);
        [, $token] = $site->issueToken(TokenType::Session, 'Tope', null, now()->addHour(), $editor->id);

        $this->getJson('/api/live-edit/v1/acme/session', [
            'Authorization' => 'Bearer '.$token, 'Origin' => 'https://acme.test',
        ])
            ->assertOk()
            ->assertJsonPath('session.editor.name', 'Tope')
            ->assertJsonPath('session.editor.email', 'tope@acme.test')
            ->assertJsonPath('session.editor.greeting', 'Tope');
    }

    public function test_somebody_with_no_name_recorded_is_still_greeted(): void
    {
        $site = Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => ['https://acme.test']]);
        $editor = Editor::query()->create(['site_id' => $site->id, 'email' => 'tope@acme.test']);
        [, $token] = $site->issueToken(TokenType::Session, 'tope@acme.test', null, now()->addHour(), $editor->id);

        // "Welcome tope" beats "Welcome " and beats printing their whole
        // address back at them.
        $this->getJson('/api/live-edit/v1/acme/session', [
            'Authorization' => 'Bearer '.$token, 'Origin' => 'https://acme.test',
        ])->assertOk()->assertJsonPath('session.editor.greeting', 'tope');
    }
}
