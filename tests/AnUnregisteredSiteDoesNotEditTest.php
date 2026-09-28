<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Support\Licence;

/**
 * Installing the package is not the same as buying it.
 *
 * The licence check used to begin by permitting anything it could not
 * identify: an install naming no site and holding no key was treated as
 * licensed. That made every other protection here decorative, because the way
 * past a licence check was to have no licence, and it is the whole product
 * given away by one `if` at the top of one function.
 *
 * Refusing silently would be worse than the hole. Somebody who has installed
 * this, wired it into their layout and seen nothing happen concludes it is
 * broken and writes that in a review. They are not stealing from us; they are
 * most of the way through buying from us. So they are told, once, what is
 * missing and where to fix it.
 *
 * The distinction that matters most here is between "never registered" and
 * "cannot reach the service right now". The second keeps working, for two
 * weeks, because a customer whose editor stops during our outage is a
 * customer we have taken money from and failed. That is LicenceClientTest.
 */
class AnUnregisteredSiteDoesNotEditTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.auto_tag', true);
        $app['config']->set('live-edit.licence', ['host' => null, 'site' => null, 'key' => null]);
    }

    protected function setUp(): void
    {
        parent::setUp();

        // Whoever installed it. The host's own gate already trusts this
        // person to edit; what they do not have is a licence.
        Gate::define('live-edit', fn ($user = null) => true);

        Route::middleware('web')->get('/shop', fn () => <<<'HTML'
            <!doctype html><html><head><title>A shop</title></head>
            <body><main><h1>Handmade in Lagos</h1></main></body></html>
            HTML);
    }

    public function test_an_unregistered_install_is_not_permitted_to_edit(): void
    {
        $this->assertFalse(Licence::permits(), 'installing the package was enough to edit');
        $this->assertTrue(Licence::unregistered());
    }

    public function test_the_page_carries_no_editor_at_all(): void
    {
        $page = $this->get('/shop')->assertOk();

        // None of the three things that make a page editable.
        $page->assertDontSee('data-admin', false);
        $page->assertDontSee('data-edit=', false);
        $page->assertDontSee('live-edit/runtime.js', false);
    }

    public function test_whoever_installed_it_is_told_how_to_fix_it(): void
    {
        $this->get('/shop')
            ->assertSee('not registered', false)
            ->assertSee('Register this site', false)
            ->assertSee(Licence::registerUrl(), false);
    }

    public function test_the_invitation_is_not_shown_to_visitors(): void
    {
        /*
         * A strip saying which product a site runs, shown to everybody, is an
         * advertisement on somebody else's website and a hint to anybody
         * looking for a way in. Only the person the host already trusts to
         * edit sees it.
         */
        Gate::define('live-edit', fn ($user = null) => false);

        $this->get('/shop')
            ->assertOk()
            ->assertDontSee('Register this site', false)
            ->assertDontSee('live-edit-register', false);
    }

    public function test_the_words_on_the_page_are_left_alone(): void
    {
        // Their website is theirs. An unpaid licence stops the editor; it
        // does not touch what the page says.
        $this->get('/shop')->assertSee('Handmade in Lagos', false);
    }

    public function test_registering_it_turns_the_editor_back_on(): void
    {
        config()->set('live-edit.licence', [
            'host' => 'https://live.shipfast.test',
            'site' => 'acme',
            'key' => 'kbp_test_licence_key',
            'ttl' => 86400,
        ]);

        $this->assertTrue(Licence::permits());

        $this->get('/shop')->assertDontSee('Register this site', false);
    }
}
