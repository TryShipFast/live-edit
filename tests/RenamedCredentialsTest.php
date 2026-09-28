<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Log;
use ShipFast\LiveEdit\Support\Licence;

/**
 * Renaming the three values a customer is given, without breaking anybody.
 *
 * The public key was called LIVE_EDIT_KEY, which reads like a secret and is
 * not one: it is printed into the source of every page it edits. A name that
 * implies otherwise is how somebody ends up treating the wrong credential
 * carelessly, or the right one as though it were dangerous.
 *
 * The rename is only worth doing if it costs nothing to the sites already
 * running, so what is defended here is that every older spelling still works
 * and that the new one wins where both are present.
 */
class RenamedCredentialsTest extends TestCase
{
    private function withLicence(array $values): void
    {
        config()->set('live-edit.licence', array_merge([
            'host' => 'https://live.shipfast.test',
            'site' => null,
            'key' => null,
            'secret' => null,
            'ttl' => 86400,
            'deprecated_env' => [],
        ], $values));
    }

    public function test_the_new_names_are_what_the_package_reads(): void
    {
        $this->withLicence(['site' => 'acme', 'key' => 'kbp_new']);

        $this->assertTrue(Licence::configured());
        $this->assertSame('acme', Licence::site());
    }

    public function test_an_install_on_the_old_names_keeps_working(): void
    {
        // The resolution happens in the config file, so what is checked here
        // is the promise it makes: whatever name supplied the value, the
        // package sees a configured licence and carries on.
        $this->withLicence([
            'site' => 'acme',
            'key' => 'kbp_old',
            'deprecated_env' => ['LIVE_EDIT_KEY', 'LIVE_EDIT_SITE'],
        ]);

        $this->assertTrue(Licence::configured());
        $this->assertSame('https://live.shipfast.test/api/live-edit/v1/acme/licence', Licence::endpoint('licence'));
    }

    public function test_a_retired_name_is_mentioned_once_and_then_left_alone(): void
    {
        $this->withLicence([
            'site' => 'acme',
            'key' => 'kbp_old',
            'deprecated_env' => ['LIVE_EDIT_KEY'],
        ]);

        Log::spy();

        Licence::warnAboutRetiredNames();
        Licence::warnAboutRetiredNames();
        Licence::warnAboutRetiredNames();

        // Once a day, not once a request. A line in every request's log is
        // not read, it is filtered.
        Log::shouldHaveReceived('notice')->once();
    }

    public function test_nothing_is_said_to_an_install_already_on_the_new_names(): void
    {
        $this->withLicence(['site' => 'acme', 'key' => 'kbp_new', 'deprecated_env' => []]);

        Log::spy();

        Licence::warnAboutRetiredNames();

        Log::shouldNotHaveReceived('notice');
    }

    public function test_an_unconfigured_install_is_still_unconfigured(): void
    {
        // The rename must not accidentally make a site look licensed. An
        // install with none of these set is unregistered, and unregistered
        // does not edit.
        $this->withLicence(['site' => null, 'key' => null]);

        $this->assertFalse(Licence::configured());
        $this->assertFalse(Licence::permits());
    }
}
