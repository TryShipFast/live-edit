<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

/**
 * Signing in to edit, on a site that may have nowhere else to sign in.
 *
 * The package used to require the host to arrange this. That assumption breaks
 * on exactly the sites this product is for: a brochure site with a users table
 * because Laravel ships one, and no login at all. Told to add one line, its
 * owner had no way to become the person that line serves.
 */
class SignInTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        /*
         * The users table Laravel ships with.
         *
         * Built here because this is the package's one requirement of a host:
         * somewhere to authenticate against. A site with no login still has
         * this table, which is what makes signing in possible on a site that
         * offers no other way to.
         */
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        config()->set('auth.providers.users.model', TestUser::class);
    }

    protected function anEditor(string $password = 'correct-horse'): TestUser
    {
        return TestUser::query()->create([
            'name' => 'Editor',
            'email' => 'editor@example.test',
            'password' => Hash::make($password),
        ]);
    }

    public function test_the_form_is_reachable_without_being_signed_in(): void
    {
        // The whole point. A guest must be able to reach it, on a site with no
        // other door.
        $this->get('/live-edit/sign-in')->assertOk()->assertSee('Sign in to edit');
    }

    public function test_it_is_kept_out_of_search_results(): void
    {
        $this->get('/live-edit/sign-in')->assertSee('noindex', false);
    }

    public function test_somebody_already_able_to_edit_is_sent_back_rather_than_asked_again(): void
    {
        Gate::define('live-edit', fn ($user) => true);
        $this->be($this->anEditor());

        $this->get('/live-edit/sign-in?from=/about')->assertRedirect('/about');
    }

    public function test_a_wrong_password_says_the_same_thing_as_a_wrong_address(): void
    {
        /*
         * Telling somebody which half was right tells them which addresses
         * hold accounts here, one guess at a time.
         */
        $this->post('/live-edit/sign-in', ['email' => 'nobody@example.test', 'password' => 'wrong'])
            ->assertSessionHasErrors(['email' => 'Those details do not match an account on this site.']);
    }

    public function test_it_will_not_be_used_to_send_somebody_elsewhere(): void
    {
        /*
         * The return address comes from the request, so it is a value a
         * stranger controls. Served from the customer's own domain, an open
         * redirect here is worth more to an attacker than most.
         */
        Gate::define('live-edit', fn ($user) => true);
        $this->be($this->anEditor());

        $this->get('/live-edit/sign-in?from=https://evil.test')->assertRedirect('/');
        $this->get('/live-edit/sign-in?from=//evil.test')->assertRedirect('/');
    }

    public function test_guessing_is_slowed_down(): void
    {
        // This form is on the public internet on every site that installs the
        // package, and it opens the door to changing what a business says.
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->post('/live-edit/sign-in', ['email' => 'a@b.test', 'password' => 'no']);
        }

        $this->post('/live-edit/sign-in', ['email' => 'a@b.test', 'password' => 'no'])
            ->assertSessionHasErrors(['email' => 'Too many attempts. Wait a minute and try again.']);
    }

    public function test_signing_out_ends_the_session(): void
    {
        Gate::define('live-edit', fn ($user) => true);
        $this->be($this->anEditor());

        $this->post('/live-edit/sign-out')->assertRedirect('/');
        $this->assertFalse(Auth::check());
    }

    public function test_the_right_details_sign_somebody_in_and_return_them_to_the_page(): void
    {
        Gate::define('live-edit', fn ($user) => true);
        $this->anEditor();

        $this->post('/live-edit/sign-in', [
            'email' => 'editor@example.test',
            'password' => 'correct-horse',
            'back' => '/about',
        ])->assertRedirect('/about');

        $this->assertTrue(Auth::check());
    }

    public function test_an_account_that_may_not_edit_is_told_so_rather_than_bounced(): void
    {
        /*
         * Somebody may hold a perfectly good account here and have no business
         * editing: a customer, a subscriber. Sending them back to a form that
         * would accept the same details again looks like the password is
         * wrong, and they will try it until they are locked out.
         */
        Gate::define('live-edit', fn ($user) => false);
        $this->anEditor();

        $this->post('/live-edit/sign-in', ['email' => 'editor@example.test', 'password' => 'correct-horse'])
            ->assertRedirect(route('live-edit.sign-in'))
            ->assertSessionHas('live-edit-status');

        $this->assertTrue(Auth::check(), 'they signed in successfully; that much is true');
    }
}

/**
 * The host's user model, as any Laravel site has one.
 */
class TestUser extends User
{
    protected $table = 'users';

    protected $guarded = [];
}
