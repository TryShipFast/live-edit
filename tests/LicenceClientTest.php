<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Support\CloudInstall;
use ShipFast\LiveEdit\Support\Licence;

/**
 * What this installation does about its own licence.
 *
 * The rules being defended here are as much about NOT breaking a site as
 * about enforcement, and the two pull in opposite directions. An install that
 * never configured a key must carry on exactly as before; an install whose
 * licence has plainly expired must stop; and an install that cannot reach us
 * must keep working, because an outage at our end taking a paying customer's
 * editor away is a worse failure than the piracy this prevents — and it
 * happens at the moment we are least able to answer the phone.
 */
class LicenceClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Licence::forget();

        // Somebody who may edit, so the only thing deciding is the licence.
        // Nullable, because these run with no signed-in user and Laravel
        // refuses an ability to a guest unless the callback says otherwise.
        Gate::define('live-edit', fn (?object $user = null) => true);
        config()->set('app.url', 'https://acme.test');
    }

    private function licensed(array $overrides = []): void
    {
        config()->set('live-edit.licence', array_merge([
            'host' => 'https://live.shipfast.test',
            'site' => 'acme',
            'key' => 'kbp_test',
            'ttl' => 86400,
        ], $overrides));
    }

    private function serviceSays(array $licence, int $status = 200): void
    {
        Http::fake(['*/licence*' => Http::response(['licence' => $licence], $status)]);
    }

    public function test_an_install_with_no_licence_configured_does_not_edit(): void
    {
        /*
         * This used to assert the opposite, and the opposite was the product
         * given away: an install naming no site and holding no key was
         * treated as licensed, so the way past every check was to have
         * nothing to check.
         *
         * It is not an outage and must not be confused with one. A site that
         * cannot reach us keeps working, which is the case below.
         */
        config()->set('live-edit.licence', ['host' => null, 'site' => null, 'key' => null]);
        Http::fake();

        $this->assertFalse(Licence::permits());
        $this->assertTrue(Licence::unregistered());

        // And still nothing is asked of the service. An install that never
        // opted in should not be making requests to us on every page view.
        Http::assertNothingSent();
    }

    public function test_a_current_licence_permits_editing(): void
    {
        $this->licensed();
        $this->serviceSays(['valid' => true, 'reason' => null, 'days_remaining' => 300]);

        $this->assertTrue(Licence::permits());
    }

    public function test_an_expired_licence_stops_the_editor(): void
    {
        $this->licensed();
        $this->serviceSays(['valid' => false, 'reason' => 'expired']);

        $this->assertFalse(Licence::permits());
        $this->assertSame('expired', Licence::reason());
    }

    public function test_a_rejected_key_is_an_answer_rather_than_an_outage(): void
    {
        $this->licensed();
        Http::fake(['*/licence*' => Http::response(['error' => 'nope'], 401)]);

        // 401 is the service saying plainly that this key is not good, which
        // is different from not being able to ask.
        $this->assertFalse(Licence::permits());
        $this->assertSame('rejected', Licence::reason());
    }

    public function test_an_unreachable_service_does_not_take_the_editor_away(): void
    {
        $this->licensed();
        Http::fake(fn () => throw new ConnectionException('down'));

        $this->assertTrue(Licence::permits(), 'our outage must not break a customer');
    }

    public function test_a_server_error_is_treated_as_an_outage_too(): void
    {
        $this->licensed();
        Http::fake(['*/licence*' => Http::response('', 500)]);

        $this->assertTrue(Licence::permits());
    }

    public function test_an_outage_coasts_on_the_last_good_answer(): void
    {
        $this->licensed();
        $this->serviceSays(['valid' => true, 'reason' => null]);
        $this->assertTrue(Licence::permits());

        // The day passes and the service is now down. The customer should
        // not notice.
        Licence::forget();
        Http::fake(fn () => throw new ConnectionException('down'));

        $this->assertTrue(Licence::permits());
    }

    public function test_the_answer_is_cached_rather_than_asked_per_page(): void
    {
        $this->licensed();
        $this->serviceSays(['valid' => true, 'reason' => null]);

        for ($i = 0; $i < 5; $i++) {
            Licence::permits();
        }

        Http::assertSentCount(1);
    }

    public function test_the_editor_is_not_served_to_a_lapsed_install(): void
    {
        $this->licensed();
        $this->serviceSays(['valid' => false, 'reason' => 'expired']);

        // The visible half of it: no toolbar, and nothing in the page saying
        // this site is editable.
        $this->assertSame('', CloudInstall::script());
    }

    public function test_the_editor_is_served_to_a_licensed_install(): void
    {
        $this->licensed();
        $this->serviceSays(['valid' => true, 'reason' => null]);

        $this->assertStringContainsString('live-edit/runtime.js', CloudInstall::script());
    }

    public function test_saving_is_refused_while_unlicensed(): void
    {
        $this->licensed();
        $this->serviceSays(['valid' => false, 'reason' => 'expired']);
        config()->set('live-edit.middleware', ['web']);
        config()->set('live-edit.settings', ['heroTitle']);

        // The other half. Hiding the toolbar without this would be a lock on
        // the door of an open room: the routes stay reachable to anybody
        // already signed in here.
        $this->postJson('/live-edit/setting', ['key' => 'heroTitle', 'value' => 'nope'])
            ->assertStatus(402)
            ->assertJsonPath('error.reason', 'expired');
    }

    public function test_the_site_itself_is_never_the_thing_that_breaks(): void
    {
        $this->licensed();
        $this->serviceSays(['valid' => false, 'reason' => 'expired']);
        config()->set('live-edit.middleware', ['web']);

        // The promise the licence makes in writing: lose the editor, keep the
        // website. A page of the host application is not behind the check —
        // only the routes that SAVE are.
        Route::middleware('web')
            ->get('/a-page-of-the-website', fn () => 'the website');

        $this->assertFalse(Licence::permits());
        $this->get('/a-page-of-the-website')->assertStatus(200)->assertSee('the website');
    }
}
