<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Route;

/**
 * Starting to edit the page you are standing on.
 *
 * Laravel had a sign-in route that accepted a destination, and no way for
 * anybody to say "here". So somebody wanting to edit a particular page had to
 * know the route existed, know it took a parameter, and type the path in —
 * and anybody who simply opened /live-edit/enter was sent to the site's root,
 * which on an application that redirects a signed-in user to a dashboard
 * meant landing in a dashboard when they had asked to edit a website.
 *
 * Measured on a real Laravel application, which is exactly what it did.
 *
 * WordPress answers ?kb-enter=1 and a static site's runtime does the same.
 * This makes the third adapter answer it too, so there is one thing to
 * remember rather than three.
 */
class TheDoorOnALaravelSiteTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('web')->get('/pricing', fn () => 'the pricing page');
        Route::middleware('web')->get('/', fn () => 'the home page');
    }

    public function test_it_sends_somebody_to_sign_in_and_remembers_the_page_they_were_on(): void
    {
        $this->get('/pricing?kb-enter=1')
            ->assertRedirect(route('live-edit.enter', ['to' => '/pricing']));
    }

    public function test_the_marker_is_dropped_from_the_page_it_returns_to(): void
    {
        // Otherwise arriving back sends them straight out again, and round it
        // goes.
        $this->get('/pricing?kb-enter=1')
            ->assertRedirect(route('live-edit.enter', ['to' => '/pricing']));
    }

    public function test_the_rest_of_the_query_survives_because_it_may_be_the_page(): void
    {
        $this->get('/pricing?plan=annual&kb-enter=1')
            ->assertRedirect(route('live-edit.enter', ['to' => '/pricing?plan=annual']));
    }

    public function test_an_ordinary_visit_is_left_completely_alone(): void
    {
        $this->get('/pricing')->assertOk()->assertSee('the pricing page');
        $this->get('/pricing?utm_source=x')->assertOk()->assertSee('the pricing page');
    }

    public function test_somebody_already_editing_is_left_on_the_page_they_asked_for(): void
    {
        // They are already where they wanted to be. Sending them round the
        // sign-in loop again would cost a round trip and gain nothing.
        $this->withSession(['live-edit.editor' => [
            'name' => 'Tope',
            'email' => 'tope@agency.test',
            'greeting' => 'Tope',
            'expires_at' => now()->addHour()->toIso8601String(),
        ]]);

        $this->get('/pricing?kb-enter=1')
            ->assertOk()
            ->assertSee('the pricing page');
    }

    public function test_a_form_post_carrying_that_name_is_not_hijacked(): void
    {
        // The marker is a thing somebody types into an address bar. A POST
        // that happens to carry the same name is the host's own business.
        Route::middleware('web')->post('/subscribe', fn () => 'subscribed');

        $this->post('/subscribe', ['kb-enter' => '1'])
            ->assertOk()
            ->assertSee('subscribed');
    }
}
