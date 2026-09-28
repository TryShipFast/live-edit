<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Site\LocalAddress;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\SiteVerification;

/**
 * One licence covers one website.
 *
 * The list of addresses the editor may be used from is the obvious way around
 * that: add a second business's domain and run the editor on two sites for the
 * price of one. A verified site was always safe, because a browser Origin
 * cannot be forged and the licensed domain is checked against it.
 *
 * An unverified site was not. It cannot be held to a domain nobody has proved,
 * so the check said nothing at all and every address in the list was allowed.
 * Register a site, never verify it, and the whole pricing model is optional.
 * Nobody found this by reading the code; it turned up when somebody asked what
 * stopped it.
 *
 * The rule now has to hold two things at once, which is why it is worth
 * testing carefully: it must make that impossible, and it must not stop
 * somebody installing the plugin on their own machine before they have proved
 * anything, because that is every customer's first hour.
 */
class OneLicenceIsForOneWebsiteTest extends TestCase
{
    /** The decision the licence endpoint makes, in one place. */
    private function verdict(Site $site, string $origin): ?bool
    {
        $observed = SiteVerification::normaliseDomain($origin);

        return match (true) {
            $observed === '' => null,
            $site->isVerified() => $site->ownsDomain($observed),
            LocalAddress::is($observed) => null,
            SiteVerification::covers((string) $site->domain, $observed) => null,
            default => false,
        };
    }

    private function site(bool $verified): Site
    {
        return new Site([
            'domain' => 'acme.com',
            'verified_at' => $verified ? now() : null,
            'allowed_origins' => ['https://acme.com', 'https://otherclient.com', 'http://shipfast.test'],
        ]);
    }

    public function test_a_verified_site_refuses_another_business(): void
    {
        $this->assertFalse($this->verdict($this->site(true), 'https://otherclient.com'));
    }

    public function test_an_unverified_site_refuses_another_business_too(): void
    {
        // The hole. Listing it was enough, because nothing looked.
        $this->assertFalse(
            $this->verdict($this->site(false), 'https://otherclient.com'),
            'a second live site rode along on one licence'
        );
    }

    public function test_its_own_domain_works_either_way(): void
    {
        $this->assertTrue($this->verdict($this->site(true), 'https://acme.com'));
        $this->assertNull($this->verdict($this->site(false), 'https://acme.com'));
    }

    public function test_a_herd_address_is_allowed_before_verification(): void
    {
        /*
         * Every customer's first hour: the plugin installed on their own
         * machine, nothing proved yet. Laravel Herd serves those at .test
         * rather than localhost, which is why loopback on its own is not
         * enough of a rule.
         */
        $this->assertNull($this->verdict($this->site(false), 'http://shipfast.test'));
    }

    public function test_the_addresses_a_person_develops_on(): void
    {
        foreach ([
            'http://localhost:8000',
            'http://127.0.0.1:8900',
            'http://acme.test',
            'https://acme.localhost',
            'http://acme.local:3000',
            'http://192.168.0.0.invalid',
        ] as $origin) {
            $this->assertTrue(LocalAddress::is($origin), "{$origin} should count as local");
        }
    }

    public function test_a_real_website_is_never_local(): void
    {
        // The half that keeps the rule worth having. Note the near misses:
        // a domain can end in "test" or contain "localhost" without being one.
        foreach ([
            'https://acme.com',
            'https://otherclient.com',
            'https://greatest.com',
            'https://localhost.com',
            'https://my.test.com',
            'https://127.0.0.1.evil.com',
        ] as $origin) {
            $this->assertFalse(LocalAddress::is($origin), "{$origin} must not count as local");
        }
    }

    public function test_a_server_with_no_origin_still_says_nothing(): void
    {
        /*
         * A plugin asking on its own behalf sends no Origin and claims
         * nothing. Reading that silence as a mismatch switched the editor off
         * on correctly licensed sites once already.
         */
        $this->assertNull($this->verdict($this->site(false), ''));
        $this->assertNull($this->verdict($this->site(true), ''));
    }
}
