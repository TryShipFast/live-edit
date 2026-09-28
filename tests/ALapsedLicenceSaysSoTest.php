<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Support\Licence;

/**
 * "Renew" and "paste a new key" are opposite instructions.
 *
 * Both refusals arrive as a 401, and for a while this read only the status
 * code, so both produced the same sentence: that the key was no longer
 * accepted and a current one should be copied out of the dashboard. For
 * somebody whose plan had simply run out that is a wild goose chase after a
 * key that was never the problem, ending in a support conversation that starts
 * "I pasted the key again and it still does not work".
 *
 * The service names which refusal it is. This reads it.
 */
class ALapsedLicenceSaysSoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    private function serviceRefuses(string $reason): void
    {
        Http::fake(['*' => Http::response([
            'error' => ['type' => 'authentication_error', 'reason' => $reason, 'message' => 'Nope.'],
        ], 401)]);
    }

    public function test_an_expired_licence_is_reported_as_expired(): void
    {
        $this->serviceRefuses('expired');

        $this->assertFalse(Licence::permits());
        $this->assertSame('expired', Licence::reason());
    }

    public function test_a_lapsed_licence_is_reported_as_expired_too(): void
    {
        // Two names for it in the service: the key carries a date that has
        // passed, and the site has no live licence at all. The customer's fix
        // is the same either way, so the customer hears one thing.
        $this->serviceRefuses('licence_lapsed');

        $this->assertSame('expired', Licence::reason());
    }

    public function test_a_revoked_key_is_still_reported_as_rejected(): void
    {
        $this->serviceRefuses('revoked');

        $this->assertSame('rejected', Licence::reason());
    }

    public function test_a_suspended_site_says_suspended(): void
    {
        $this->serviceRefuses('site_suspended');

        $this->assertSame('suspended', Licence::reason());
    }

    public function test_a_service_that_names_no_reason_still_works(): void
    {
        /*
         * A customer's install is not upgraded on the day the service is, so
         * this has to keep working against a version that sends no reason at
         * all. Falling back to the blunt answer is what it did before.
         */
        Http::fake(['*' => Http::response(['error' => ['message' => 'Nope.']], 401)]);

        $this->assertSame('rejected', Licence::reason());
    }

    public function test_an_outage_is_not_a_refusal(): void
    {
        // The distinction this whole class is about, one level up: a service
        // that cannot be reached has said nothing, and nobody should lose
        // their editor because our server had a bad afternoon.
        Http::fake(['*' => Http::response('', 500)]);

        $this->assertTrue(Licence::permits(), 'an outage switched a paying customer off');
    }
}
