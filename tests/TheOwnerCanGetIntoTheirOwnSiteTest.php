<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Hash;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * Somebody already signed in to the console should not need a second password.
 *
 * The sign-in page is served by the service and nowhere else, so a session on
 * it is a console session: the person who buys the plans and registers the
 * sites. Sending them from an application they are signed in to, to a form
 * asking who they are, is asking them to keep a credential for a person they
 * are already proved to be.
 *
 * The narrow rule matters as much as the convenience. Being signed in offers a
 * way in only where an editor account already exists and has been granted this
 * site. It never conjures one, because then owning a site would be a way into
 * it that no editors list ever mentioned.
 */
class TheOwnerCanGetIntoTheirOwnSiteTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        // The sign-in page only exists where the API is on, which is the
        // service and nowhere else.
        $app['config']->set('live-edit.api', array_merge(
            (array) $app['config']->get('live-edit.api', []),
            [
                'enabled' => true,
                'prefix' => 'api/live-edit/v1',
                'session_ttl' => 1800,
                'sign_in_ttl' => 15,
                'throttle' => [
                    'sign_in' => ['burst' => ['max' => 200, 'seconds' => 60], 'sustained' => ['max' => 2000, 'seconds' => 3600]],
                ],
            ]
        ));
        $app['config']->set('cors.paths', []);
    }

    private function site(string $slug = 'acme'): Site
    {
        return Site::query()->create([
            'name' => 'Acme', 'slug' => $slug, 'domain' => 'acme.test',
            'allowed_origins' => ['https://acme.test'],
        ]);
    }

    private function editorOf(Site $site, string $email = 'owner@acme.test'): Editor
    {
        $editor = Editor::query()->create(['email' => $email, 'name' => 'Ada']);
        $site->editors()->attach($editor->id, ['may_publish' => true]);

        return $editor;
    }

    /**
     * Somebody with an email address, standing in for the console's own user.
     *
     * The package cannot name that class: it lives in the application, and
     * the only thing this feature asks of it is an email. That is the whole
     * coupling, and it is deliberately this small.
     */
    private function signedIn(string $email): ConsoleUser
    {
        return (new ConsoleUser)->forceFill(['id' => 1, 'email' => $email, 'name' => 'Ada']);
    }

    private function page(Site $site, string $returnTo = 'https://acme.test/')
    {
        return $this->get(route('live-edit.sign-in.form', ['site' => $site->slug, 'return_to' => $returnTo]));
    }

    public function test_an_editor_who_is_signed_in_is_offered_their_own_account(): void
    {
        $site = $this->site();
        $this->editorOf($site);

        $this->actingAs($this->signedIn('owner@acme.test'))
            ->page($site)
            ->assertOk()
            ->assertSee('Continue as Ada')
            // The other way in stays, because the person at the keyboard is
            // not always the person whose console this is.
            ->assertSee('sign in as somebody else');
    }

    public function test_a_signed_out_visitor_gets_only_the_password_form(): void
    {
        $site = $this->site();
        $this->editorOf($site);

        $this->page($site)->assertOk()->assertDontSee('Continue as');
    }

    public function test_being_signed_in_does_not_by_itself_make_somebody_an_editor(): void
    {
        /*
         * The narrow half. A console account with no editor record has not
         * been given this site, and this page must not be the one place that
         * decides otherwise.
         */
        $site = $this->site();
        $this->editorOf($site);

        $this->actingAs($this->signedIn('astranger@example.test'))
            ->page($site)
            ->assertOk()
            ->assertDontSee('Continue as');
    }

    public function test_an_editor_of_another_site_is_not_offered_this_one(): void
    {
        // One account spans every site somebody works on, so being a real
        // editor and being an editor of the site in front of you are two
        // different questions.
        $theirs = $this->site('theirs');
        $this->editorOf($theirs, 'ada@agency.test');

        $someoneElses = $this->site('someone-elses');

        $this->actingAs($this->signedIn('ada@agency.test'))
            ->page($someoneElses)
            ->assertOk()
            ->assertDontSee('Continue as');
    }

    public function test_continuing_hands_back_a_session(): void
    {
        $site = $this->site();
        $this->editorOf($site);

        $this->actingAs($this->signedIn('owner@acme.test'))
            ->post(route('live-edit.sign-in.continue'), [
                'site' => $site->slug,
                'return_to' => 'https://acme.test/',
            ])
            ->assertOk()
            ->assertSee('kb_session=', false);
    }

    public function test_a_stranger_cannot_post_their_way_in(): void
    {
        /*
         * The button is hidden for them, and a hidden button has never been a
         * control. Everything is checked again on the way through: who they
         * are from the session, never from the form.
         */
        $site = $this->site();
        $this->editorOf($site);

        $this->actingAs($this->signedIn('astranger@example.test'))
            ->post(route('live-edit.sign-in.continue'), [
                'site' => $site->slug,
                'return_to' => 'https://acme.test/',
            ])
            ->assertRedirect()
            ->assertSessionHas('live-edit.sign-in.error');
    }

    public function test_a_signed_out_visitor_cannot_post_their_way_in(): void
    {
        $site = $this->site();
        $this->editorOf($site);

        $this->post(route('live-edit.sign-in.continue'), [
            'site' => $site->slug,
            'return_to' => 'https://acme.test/',
        ])->assertRedirect();
    }

    public function test_it_will_not_hand_a_session_to_an_address_the_site_never_claimed(): void
    {
        /*
         * The same check the password form is held to. Without it this would
         * forward a freshly minted session to any address in a form field,
         * which is an account takeover with no password in it at all.
         */
        $site = $this->site();
        $this->editorOf($site);

        $this->actingAs($this->signedIn('owner@acme.test'))
            ->post(route('live-edit.sign-in.continue'), [
                'site' => $site->slug,
                'return_to' => 'https://somewhere-else.test/',
            ])
            ->assertRedirect('https://tryshipfast.com');
    }

    public function test_a_password_still_works(): void
    {
        // The whole point is one more way in, not one instead.
        $site = $this->site();
        $editor = $this->editorOf($site);
        $editor->forceFill(['password' => Hash::make('harbour-lantern-copper-42')])->save();

        $this->post(route('live-edit.sign-in.submit'), [
            'site' => $site->slug,
            'email' => 'owner@acme.test',
            'password' => 'harbour-lantern-copper-42',
            'return_to' => 'https://acme.test/',
        ])->assertOk()->assertSee('kb_session=', false);
    }
}

/** Stands in for whatever User the host application has. */
class ConsoleUser extends User
{
    protected $table = 'users';

    protected $guarded = [];
}
