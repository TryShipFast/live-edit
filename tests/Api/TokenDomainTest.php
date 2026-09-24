<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Denial;
use ShipFast\LiveEdit\Domain\Site\OriginPolicy;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenAuthenticator;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Domain\Site\TokenValue;
use ShipFast\LiveEdit\Tests\TestCase;

class TokenDomainTest extends TestCase
{
    protected function site(array $origins = ['https://client.test']): Site
    {
        return Site::query()->create([
            'slug' => 'client',
            'name' => 'Client',
            'allowed_origins' => $origins,
        ]);
    }

    protected function auth(): TokenAuthenticator
    {
        return new TokenAuthenticator;
    }

    public function test_a_minted_key_round_trips(): void
    {
        [$token, $plain] = $this->site()->issueToken(TokenType::Publishable, 'Web');

        $this->assertStringStartsWith('kbp_', $plain);
        $this->assertNotSame($plain, $token->secret_hash);
    }

    public function test_a_secret_is_never_recoverable_from_the_database(): void
    {
        // The rule that matters: a leaked database must not hand anybody a
        // working key that can change or publish a customer's content.
        $site = $this->site();

        foreach ([TokenType::Secret, TokenType::Session] as $type) {
            [$token, $plain] = $site->issueToken($type, 'Server');

            $stored = json_encode($token->fresh()->getAttributes());
            // Split into three, not on every underscore: the secret is
            // url-safe base64 and may begin with one, which yields an empty
            // needle and a test that passes or fails on the luck of the draw.
            $secret = explode('_', $plain, 3)[2];

            $this->assertStringNotContainsString($secret, $stored, $type->value.' was stored recoverably');
            $this->assertNull($token->fresh()->public_text);
        }
    }

    public function test_a_publishable_key_is_kept_readable_on_purpose(): void
    {
        // It is printed into every page of the site it belongs to, so hashing
        // it protects nothing — and made it impossible to tell a site what its
        // own key is, which meant customers pasting it by hand and editing
        // their HTML whenever one was rotated.
        [$token, $plain] = $this->site()->issueToken(TokenType::Publishable, 'Web');

        $this->assertSame($plain, $token->fresh()->public_text);
    }

    public function test_a_token_is_not_serialised_with_its_hash(): void
    {
        [$token] = $this->site()->issueToken(TokenType::Secret, 'Server');

        $this->assertArrayNotHasKey('secret_hash', $token->toArray());
        $this->assertArrayNotHasKey('public_text', $token->toArray());
    }

    public function test_a_correct_key_authenticates(): void
    {
        $site = $this->site();
        [, $plain] = $site->issueToken(TokenType::Publishable, 'Web');

        $result = $this->auth()->authenticate($plain, 'https://client.test', Ability::Read);

        $this->assertTrue($result->passed());
        $this->assertSame($site->id, $result->site->id);
    }

    public function test_a_tampered_secret_is_refused(): void
    {
        [, $plain] = $this->site()->issueToken(TokenType::Publishable, 'Web');
        [$prefix, $id, $secret] = explode('_', $plain);

        $tampered = $prefix.'_'.$id.'_'.strrev($secret);

        $this->assertSame(Denial::Mismatched, $this->auth()->authenticate($tampered)->denial);
    }

    public function test_an_unknown_key_is_refused_without_saying_so(): void
    {
        $this->site();
        $result = $this->auth()->authenticate('kbp_'.bin2hex(random_bytes(8)).'_nonsense');

        $this->assertSame(Denial::Unknown, $result->denial);
        $this->assertSame(401, $result->denial->status());
        $this->assertSame('Invalid or missing API key.', $result->denial->publicMessage());
    }

    public function test_nonsense_is_refused(): void
    {
        foreach (['', '   ', 'Bearer', 'kbp_only_two', 'xxx_abc_def', 'kbp_nothex_secret'] as $junk) {
            $this->assertFalse($this->auth()->authenticate($junk)->passed(), "accepted: {$junk}");
        }
    }

    public function test_a_revoked_key_stops_working(): void
    {
        [$token, $plain] = $this->site()->issueToken(TokenType::Publishable, 'Web');
        $token->revoke();

        $this->assertSame(Denial::Revoked, $this->auth()->authenticate($plain)->denial);
    }

    public function test_an_expired_key_stops_working(): void
    {
        [, $plain] = $this->site()->issueToken(TokenType::Session, 'Edit', null, now()->subMinute());

        $this->assertSame(Denial::Expired, $this->auth()->authenticate($plain)->denial);
    }

    public function test_a_suspended_site_refuses_its_own_keys(): void
    {
        $site = $this->site();
        [, $plain] = $site->issueToken(TokenType::Publishable, 'Web');
        $site->forceFill(['suspended_at' => now()])->save();

        $this->assertSame(Denial::SiteSuspended, $this->auth()->authenticate($plain)->denial);
    }

    public function test_a_secret_key_presented_from_a_browser_is_refused(): void
    {
        [, $plain] = $this->site()->issueToken(TokenType::Secret, 'Server');

        // Server to server: fine.
        $this->assertTrue($this->auth()->authenticate($plain)->passed());

        // The same key with an Origin means it is sitting in a page.
        $this->assertSame(
            Denial::SecretInBrowser,
            $this->auth()->authenticate($plain, 'https://client.test')->denial
        );
    }

    public function test_a_key_used_from_an_unlisted_origin_is_refused(): void
    {
        [, $plain] = $this->site()->issueToken(TokenType::Publishable, 'Web');

        $this->assertSame(
            Denial::OriginNotAllowed,
            $this->auth()->authenticate($plain, 'https://attacker.test')->denial
        );
    }

    public function test_a_publishable_key_cannot_write(): void
    {
        [, $plain] = $this->site()->issueToken(TokenType::Publishable, 'Web');

        $result = $this->auth()->authenticate($plain, 'https://client.test', Ability::Write);

        $this->assertSame(Denial::MissingAbility, $result->denial);
        $this->assertSame(403, $result->denial->status());
    }

    public function test_origins_match_by_value_not_by_spelling(): void
    {
        $policy = new OriginPolicy(['https://Client.test/', 'https://*.client.test']);

        $this->assertTrue($policy->permits('https://client.test'));
        $this->assertTrue($policy->permits('https://app.client.test'));
        $this->assertFalse($policy->permits('http://client.test'), 'scheme must matter');
        $this->assertFalse($policy->permits('https://client.test.attacker.io'));
        $this->assertFalse($policy->permits('https://deep.app.client.test'), 'one label, not any depth');
        $this->assertNull($policy->headerFor('https://attacker.test'));
        $this->assertSame('https://client.test', $policy->headerFor('https://client.test'));
    }

    public function test_a_request_with_no_origin_is_left_to_the_key(): void
    {
        $policy = new OriginPolicy(['https://client.test']);

        $this->assertTrue($policy->permits(null), 'not a browser; CORS has nothing to say');
        $this->assertNull($policy->headerFor(null), 'and nothing to echo back');
    }

    public function test_a_secret_containing_an_underscore_still_parses(): void
    {
        // The secret is url-safe base64, so roughly one key in a handful has an
        // underscore in it. Parsing must not depend on which bytes were drawn.
        $site = $this->site();
        [$token, $plain] = $site->issueToken(TokenType::Publishable, 'Web');

        $underscored = 'aa_bb_cc-dd';
        $token->forceFill(['secret_hash' => hash('sha256', $underscored)])->save();

        $rebuilt = 'kbp_'.$token->public_id.'_'.$underscored;

        $this->assertTrue($this->auth()->authenticate($rebuilt, 'https://client.test')->passed());
    }

    public function test_secrets_are_compared_in_constant_time(): void
    {
        // Every other guard here is proved by behaviour: remove it and a test
        // goes red. This one cannot be — a timing attack produces the right
        // answer, just sooner for a wrong first character than a wrong last
        // one, and no assertion about a return value can see that. So the
        // invariant is pinned where it lives, to stop a future tidy-up turning
        // it back into ===.
        $source = file_get_contents(__DIR__.'/../../src/Domain/Site/TokenValue.php');

        $this->assertStringContainsString('hash_equals(', $source);
        $this->assertDoesNotMatchRegularExpression(
            '/\$storedHash\s*===|===\s*\$this->hash\(\)/',
            $source,
            'secrets must not be compared with ==='
        );
    }

    public function test_a_key_hint_identifies_without_revealing(): void
    {
        $value = TokenValue::generate(TokenType::Secret);

        $this->assertStringContainsString($value->id, $value->hint());
        $secret = explode('_', $value->plain())[2];
        $this->assertStringNotContainsString($secret, $value->hint());
    }
}
