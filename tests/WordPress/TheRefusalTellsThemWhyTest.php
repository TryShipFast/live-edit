<?php

namespace ShipFast\LiveEdit\Tests\WordPress;

use KastsBuild\Licence;
use ReflectionMethod;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * What a WordPress install tells a customer when a licence has lapsed.
 *
 * Every one of these was found by watching a real lapse happen on a real
 * install in a browser, and every one of them is the same mistake in a
 * different place: two refusals that arrive identically and have opposite
 * fixes were being given the same sentence.
 *
 * A lapsed licence wants paying, and the key in the plugin's settings is
 * perfectly good. A withdrawn key wants replacing, and the billing is
 * perfectly good. Told "This key is no longer accepted", the first customer
 * goes hunting through their dashboard for a key that was never the problem,
 * finds the one they already have, pastes it again, and writes to support.
 *
 * Tested away from WordPress, because what is being checked is a lookup table
 * and a bit of arithmetic on a JSON body, neither of which needs a database.
 */
class TheRefusalTellsThemWhyTest extends TestCase
{
    private function messageFor(string $reason): string
    {
        /*
         * The plugin calls WordPress's __(), which is not defined here. In
         * this suite that name already belongs to Laravel's translator, which
         * returns the string unchanged when it has no translation for it, so
         * the sentences arrive intact and the test needs no WordPress.
         */
        require_once __DIR__.'/../../packages/wordpress/kastsbuild/includes/Licence.php';

        return Licence::messageFrom($reason);
    }

    public function test_a_lapse_and_a_withdrawn_key_do_not_read_the_same(): void
    {
        $this->assertNotSame(
            $this->messageFor('expired'),
            $this->messageFor('rejected'),
            'the customer cannot tell which of two opposite problems they have'
        );
    }

    public function test_a_lapse_says_renew_and_says_the_website_is_fine(): void
    {
        $said = $this->messageFor('expired');

        // Both halves matter. "Renew" is the instruction; "your website is
        // unaffected" is the answer to the question they have not asked yet
        // and are most afraid of.
        $this->assertStringContainsStringIgnoringCase('renew', $said);
        $this->assertStringContainsStringIgnoringCase('website is unaffected', $said);
    }

    public function test_a_withdrawn_key_is_the_only_one_that_mentions_the_dashboard(): void
    {
        $this->assertStringContainsStringIgnoringCase('dashboard', $this->messageFor('rejected'));
        $this->assertStringNotContainsStringIgnoringCase('dashboard', $this->messageFor('expired'));
    }

    public function test_the_reason_is_read_from_the_body_not_the_status_code(): void
    {
        /*
         * A 401 covers both. The service names which one in error.reason, and
         * reading only the status code is what produced the wrong sentence.
         */
        require_once __DIR__.'/../../packages/wordpress/kastsbuild/includes/Licence.php';

        $read = new ReflectionMethod(Licence::class, 'reasonFromRefusal');
        $read->setAccessible(true);

        $this->assertSame('expired', $read->invoke(null, ['error' => ['reason' => 'expired']]));
        $this->assertSame('expired', $read->invoke(null, ['error' => ['reason' => 'licence_lapsed']]));
        $this->assertSame('suspended', $read->invoke(null, ['error' => ['reason' => 'site_suspended']]));
        $this->assertSame('rejected', $read->invoke(null, ['error' => ['reason' => 'revoked']]));
    }

    public function test_a_service_that_names_no_reason_still_works(): void
    {
        // A customer's plugin is not upgraded on the day the service is, and
        // an install talking to an older service must keep working rather
        // than start saying nothing.
        require_once __DIR__.'/../../packages/wordpress/kastsbuild/includes/Licence.php';

        $read = new ReflectionMethod(Licence::class, 'reasonFromRefusal');
        $read->setAccessible(true);

        $this->assertSame('rejected', $read->invoke(null, []));
        $this->assertSame('rejected', $read->invoke(null, ['error' => ['message' => 'Nope.']]));
    }
}
