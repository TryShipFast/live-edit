<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Denial;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenAuthenticator;
use ShipFast\LiveEdit\Domain\Site\TokenType;

/**
 * A lapsed licence costs the editor and never the website.
 *
 * True of Laravel and WordPress from the start, because they hold their own
 * content and render it themselves. It was false of plain HTML, which is the
 * adapter where we hold the content, and false in the worst possible way:
 * a static page is tagged and filled in the browser, so when the read was
 * refused the page fell back to the HTML on disk and a visitor read the
 * TEMPLATE'S original words. Every sentence the customer had published was
 * gone from their live site, with nothing on the page saying why.
 *
 * The rule that allows reads through a lapse was already written and already
 * correct. It simply never ran: the key-expiry check above it denied
 * everything first, and billing pauses editing by dating exactly those keys.
 * So this was not a missing decision, it was a decision made and then
 * unreachable, which is the kind that survives review.
 */
class ALapseNeverTakesPublishedWordsOffAPageTest extends TestCase
{
    private function siteWithKey(array $token = []): array
    {
        $site = Site::query()->create([
            'name' => 'Theirs', 'slug' => 'theirs-'.bin2hex(random_bytes(3)),
            'domain' => 'theirs.test', 'allowed_origins' => ['https://theirs.test'],
        ]);

        [$model, $plain] = $site->issueToken(
            $token['type'] ?? TokenType::Publishable,
            'Licence key',
            [Ability::Read, Ability::Write],
            $token['expires_at'] ?? null,
        );

        if ($token['revoked'] ?? false) {
            $model->forceFill(['revoked_at' => now()])->save();
        }

        if (array_key_exists('expires_at', $token)) {
            $model->forceFill(['expires_at' => $token['expires_at']])->save();
        }

        return [$site, $plain];
    }

    private function attempt(string $key, Ability $needs, ?string $origin = 'https://theirs.test')
    {
        return app(TokenAuthenticator::class)->authenticate($key, $origin, $needs);
    }

    public function test_a_visitor_still_reads_the_published_words_after_a_lapse(): void
    {
        // The whole point. Their website goes on saying what they published.
        [, $key] = $this->siteWithKey(['expires_at' => now()->subDay()]);

        $this->assertTrue($this->attempt($key, Ability::Read)->passed());
    }

    public function test_but_nothing_new_can_be_saved(): void
    {
        [, $key] = $this->siteWithKey(['expires_at' => now()->subDay()]);

        $result = $this->attempt($key, Ability::Write);

        $this->assertFalse($result->passed());
        $this->assertSame(Denial::LicenceLapsed, $result->denial);
    }

    public function test_a_revoked_key_still_reads_nothing(): void
    {
        /*
         * Revoking is what you do to a key that has leaked, and it has to stop
         * being useful for anything. Only expiry gets the read exemption,
         * which is why billing dates keys rather than revoking them.
         */
        [, $key] = $this->siteWithKey(['revoked' => true]);

        $result = $this->attempt($key, Ability::Read);

        $this->assertFalse($result->passed());
        $this->assertSame(Denial::Revoked, $result->denial);
    }

    public function test_an_expired_session_is_still_refused(): void
    {
        // A person's credential with a lifetime of its own. Whether the site
        // is paid for has nothing to do with it.
        [, $key] = $this->siteWithKey([
            'type' => TokenType::Session,
            'expires_at' => now()->subHour(),
        ]);

        $result = $this->attempt($key, Ability::Read);

        $this->assertFalse($result->passed());
        $this->assertSame(Denial::Expired, $result->denial);
    }

    public function test_a_live_licence_is_untouched_by_any_of_this(): void
    {
        [, $key] = $this->siteWithKey();

        $this->assertTrue($this->attempt($key, Ability::Read)->passed());
        $this->assertTrue($this->attempt($key, Ability::Write)->passed());
    }

    public function test_a_suspended_site_is_still_refused_outright(): void
    {
        // Suspension is ours, by hand, for abuse. It is not what unpaid means
        // and it does not get the same grace.
        [$site, $key] = $this->siteWithKey(['expires_at' => now()->subDay()]);
        $site->forceFill(['suspended_at' => now()])->save();

        $this->assertFalse($this->attempt($key, Ability::Read)->passed());
    }
}
