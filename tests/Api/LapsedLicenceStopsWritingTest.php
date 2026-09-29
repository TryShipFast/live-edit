<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenAuthenticator;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * A licence that has run out stops the writing, and nothing else.
 *
 * Every other check here asks about the credential in hand, so a sign-in
 * session minted an hour before a licence lapsed kept working: it is neither
 * revoked nor expired itself. The editor would vanish on the next page load
 * while anybody already editing carried on saving until their session ran
 * down, which is a licence that means nothing for as long as somebody keeps
 * the tab open.
 *
 * Three lines have to hold at once, and they pull apart:
 *
 *   - a lapsed licence refuses writes, whichever key is presented;
 *   - ROTATING a key must not throw somebody out mid-sentence;
 *   - READING never stops, because a customer's website is not ours to take
 *     down over billing.
 */
class LapsedLicenceStopsWritingTest extends TestCase
{
    private function site(): Site
    {
        return Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => []]);
    }

    private function deny(Site $site, string $token, Ability $needs): ?string
    {
        $result = (new TokenAuthenticator)->authenticate($token, null, $needs);

        return $result->passed() ? null : $result->denial?->value;
    }

    public function test_a_session_cannot_outlive_the_licence_it_was_minted_under(): void
    {
        $site = $this->site();
        $site->issueToken(TokenType::Publishable, 'Web', null, now()->addDay());
        [, $session] = $site->issueToken(TokenType::Session, 'Tope', [Ability::Read, Ability::Write], now()->addHours(2));

        $this->assertNull($this->deny($site, $session, Ability::Write), 'writing should work while the licence is live');

        // The year is up. The session itself is untouched and still has an
        // hour to run, which is exactly the case that used to slip through.
        $site->tokens()->whereIn('type', ['publishable', 'secret'])->update(['expires_at' => now()->subMinute()]);

        $this->assertSame('licence_lapsed', $this->deny($site, $session, Ability::Write));
    }

    public function test_reading_carries_on_after_a_licence_ends(): void
    {
        $site = $this->site();
        [, $publishable] = $site->issueToken(TokenType::Publishable, 'Web', null, now()->subDay());

        $site->issueToken(TokenType::Secret, 'Server', null, now()->subDay());

        [, $session] = $site->issueToken(TokenType::Session, 'Tope', [Ability::Read, Ability::Write], now()->addHour());

        $this->assertNull(
            $this->deny($site, $session, Ability::Read),
            'a customer\'s published words belong on their pages whatever the billing is doing'
        );
        $this->assertSame('licence_lapsed', $this->deny($site, $session, Ability::Write));

        /*
         * An expired licence key reads too, and that is the point rather than
         * an oversight. This asserted 'expired' until a static site showed
         * what refusing a read actually costs: the page is filled in the
         * browser, so the customer's published words vanished and the
         * template's original text came back.
         *
         * Writing with the same key is still refused, below.
         */
        $this->assertNull(
            $this->deny($site, $publishable, Ability::Read),
            'a lapse took a static site\'s published words off the page'
        );
        // Refused for the plainer reason: a publishable key is printed in a
        // page and has never been allowed to write anything, lapse or no lapse.
        $this->assertSame('missing_ability', $this->deny($site, $publishable, Ability::Write));
    }

    public function test_rotating_a_key_does_not_throw_an_editor_out(): void
    {
        $site = $this->site();
        [$old] = $site->issueToken(TokenType::Publishable, 'Web', null, now()->addYear());
        [, $session] = $site->issueToken(TokenType::Session, 'Tope', [Ability::Read, Ability::Write], now()->addHour());

        // Rotation: a new key is issued and the old one withdrawn. Somebody
        // halfway through a sentence should not notice.
        $site->issueToken(TokenType::Publishable, 'Web', null, now()->addYear());
        $old->revoke();

        $this->assertNull($this->deny($site, $session, Ability::Write));
    }

    public function test_a_site_that_never_had_a_licence_key_is_left_alone(): void
    {
        // Nothing configured means carry on, the same rule both packages
        // follow. Reading "never had one" as "lapsed" would stop editing on
        // every site that predates keys having an expiry at all.
        $site = $this->site();
        [, $session] = $site->issueToken(TokenType::Session, 'Tope', [Ability::Read, Ability::Write], now()->addHour());

        $this->assertNull($this->deny($site, $session, Ability::Write));
    }

    public function test_publishing_stops_too(): void
    {
        $site = $this->site();
        $site->issueToken(TokenType::Publishable, 'Web', null, now()->subMinute());
        [, $session] = $site->issueToken(TokenType::Session, 'Tope', [Ability::Read, Ability::Write, Ability::Publish], now()->addHour());

        $this->assertSame('licence_lapsed', $this->deny($site, $session, Ability::Publish));
    }
}
