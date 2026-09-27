<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\SignInToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenAuthenticator;
use ShipFast\LiveEdit\Http\Middleware\RecoversAnExpiredSignIn;
use ShipFast\LiveEdit\Mail\SignInLink;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Letting a site's own people in.
 *
 * This is the softest surface here: no key is presented, and the whole point
 * is that whoever is asking has none. So these are written as attempts to
 * misuse it — to be told whether an address exists, to be sent somewhere else,
 * to use a link twice, to edit a site that is not yours.
 */
class SignInTest extends TestCase
{
    private const ADMIN = 'provision-me';

    private Site $site;

    private Editor $editor;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'sign_in_ttl' => 15,
            'admin_token' => self::ADMIN,
            'throttle' => [
                'read' => ['burst' => ['max' => 500, 'seconds' => 60], 'sustained' => ['max' => 5000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 500, 'seconds' => 60], 'sustained' => ['max' => 5000, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'upload' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'provision' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'sign_in' => ['burst' => ['max' => 4, 'seconds' => 60], 'sustained' => ['max' => 30, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('live-edit.settings', ['heroTitle']);
        $app['config']->set('cors.paths', []);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $this->site = Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'allowed_origins' => ['https://acme.test'],
        ]);

        $this->editor = Editor::query()->create([
            'email' => 'amaka@acme.test',
            'name' => 'Amaka',
        ]);

        $this->site->editors()->attach($this->editor->id, ['may_publish' => true]);
    }

    private function ask(array $overrides = []): TestResponse
    {
        return $this->postJson('/api/live-edit/v1/sign-in', array_merge([
            'site' => 'acme',
            'email' => 'amaka@acme.test',
            'return_to' => 'https://acme.test/about',
        ], $overrides));
    }

    private function linkFor(Editor $editor): ?string
    {
        // The plain token is only ever in the email, so the test reads it the
        // way the recipient does.
        $found = null;

        Mail::assertSent(SignInLink::class, function (SignInLink $mail) use (&$found, $editor) {
            if (! $mail->hasTo($editor->email)) {
                return false;
            }

            preg_match('#/live-edit/sign-in/([a-f0-9]{64})#', $mail->link, $m);
            $found = $m[1] ?? null;

            return true;
        });

        return $found;
    }

    public function test_an_editor_is_sent_a_link_and_it_signs_them_in(): void
    {
        $this->ask()->assertOk();

        $token = $this->linkFor($this->editor);
        $this->assertNotNull($token);

        $response = $this->get('/live-edit/sign-in/'.$token);
        $response->assertRedirect();

        // In the fragment, never the query: a fragment is not sent to a
        // server, never reaches an access log, and is not passed on in a
        // Referer header.
        $location = $response->headers->get('Location');
        $this->assertStringStartsWith('https://acme.test/about#kb_session=', $location);

        $key = urldecode(explode('#kb_session=', $location)[1]);
        $this->assertTrue((new TokenAuthenticator)->authenticate($key, 'https://acme.test', Ability::Write)->passed());
    }

    public function test_a_session_we_issued_may_publish(): void
    {
        // Publishing is kept from a browser when a customer's own server
        // vouched for the holder, because we cannot see past that. Here the
        // sign-in was ours, so we know who this is.
        $this->ask()->assertOk();
        $location = $this->get('/live-edit/sign-in/'.$this->linkFor($this->editor))->headers->get('Location');
        $key = urldecode(explode('#kb_session=', $location)[1]);

        $this->assertTrue((new TokenAuthenticator)->authenticate($key, 'https://acme.test', Ability::Publish)->passed());
    }

    public function test_an_editor_without_that_permission_may_not_publish(): void
    {
        // On the grant now, not on the person: the same editor may publish
        // on one site and not on another.
        $this->site->editors()->updateExistingPivot($this->editor->id, ['may_publish' => false]);

        $this->ask()->assertOk();
        $location = $this->get('/live-edit/sign-in/'.$this->linkFor($this->editor))->headers->get('Location');
        $key = urldecode(explode('#kb_session=', $location)[1]);

        $auth = new TokenAuthenticator;
        $this->assertTrue($auth->authenticate($key, 'https://acme.test', Ability::Write)->passed());
        $this->assertFalse($auth->authenticate($key, 'https://acme.test', Ability::Publish)->passed());
    }

    public function test_the_answer_is_the_same_for_an_address_that_cannot_edit(): void
    {
        // Otherwise this becomes a way to ask which of a customer's staff are
        // real.
        $known = $this->ask();
        $unknown = $this->ask(['email' => 'nobody@acme.test']);
        $noSite = $this->ask(['site' => 'does-not-exist']);

        $this->assertSame($known->status(), $unknown->status());
        $this->assertSame($known->json('message'), $unknown->json('message'));
        $this->assertSame($known->json('message'), $noSite->json('message'));

        Mail::assertSentCount(1);
    }

    public function test_a_link_cannot_send_somebody_to_another_site(): void
    {
        // An open redirect that arrives by email, from us, looking entirely
        // legitimate. Checked where the link is made, never where it is
        // clicked.
        $this->ask(['return_to' => 'https://attacker.test/collect'])->assertOk();

        Mail::assertNothingSent();
        $this->assertSame(0, SignInToken::query()->count());
    }

    public function test_a_link_works_once(): void
    {
        $this->ask()->assertOk();
        $token = $this->linkFor($this->editor);

        $this->get('/live-edit/sign-in/'.$token)->assertRedirect();

        // Forwarded to somebody else, or replayed out of a mailbox later.
        $this->get('/live-edit/sign-in/'.$token)->assertStatus(410);
    }

    public function test_an_expired_link_is_refused(): void
    {
        $this->ask()->assertOk();
        $token = $this->linkFor($this->editor);

        SignInToken::query()->update(['expires_at' => now()->subMinute()]);

        $this->get('/live-edit/sign-in/'.$token)->assertStatus(410);
    }

    public function test_asking_again_kills_the_previous_link(): void
    {
        $this->ask()->assertOk();
        $first = $this->linkFor($this->editor);

        Mail::fake();
        $this->ask()->assertOk();

        $this->get('/live-edit/sign-in/'.$first)->assertStatus(410);
    }

    public function test_a_made_up_link_is_refused(): void
    {
        $this->get('/live-edit/sign-in/'.str_repeat('a', 64))->assertStatus(410);
    }

    public function test_the_link_is_stored_only_as_a_hash(): void
    {
        $this->ask()->assertOk();
        $token = $this->linkFor($this->editor);

        $this->assertSame(0, SignInToken::query()->where('token_hash', $token)->count());
        $this->assertSame(1, SignInToken::query()->where('token_hash', hash('sha256', $token))->count());
    }

    public function test_a_suspended_site_lets_nobody_in(): void
    {
        $this->ask()->assertOk();
        $token = $this->linkFor($this->editor);

        $this->site->forceFill(['suspended_at' => now()])->save();

        $this->get('/live-edit/sign-in/'.$token)->assertStatus(410);
    }

    public function test_an_editor_of_one_site_is_not_an_editor_of_another(): void
    {
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other', 'allowed_origins' => ['https://other.test']]);

        $this->postJson('/api/live-edit/v1/sign-in', [
            'site' => 'other',
            'email' => 'amaka@acme.test',
            'return_to' => 'https://other.test/',
        ])->assertOk();

        Mail::assertNothingSent();
    }

    public function test_asking_for_links_is_throttled(): void
    {
        for ($i = 0; $i < 4; $i++) {
            $this->ask()->assertOk();
        }

        $this->ask()->assertStatus(429);
    }

    public function test_a_form_left_open_too_long_comes_back_rather_than_dying(): void
    {
        // "419 PAGE EXPIRED" is a sentence for a developer, on the one page
        // in this product a non-technical client is guaranteed to meet. A
        // grey number on a white page gives them nothing to do except ring
        // somebody who cannot reproduce it, because a reload fixes it.
        //
        // Driven through the middleware itself: the test harness turns CSRF
        // off, so posting a wrong token here would prove nothing at all.
        $this->get('/live-edit/sign-in?site=acme&return_to='.urlencode('https://acme.test/about'));

        $request = Request::create('/live-edit/sign-in', 'POST', ['email' => 'amaka@acme.test']);
        $request->setLaravelSession(session()->driver());

        $response = (new RecoversAnExpiredSignIn)->handle(
            $request,
            fn () => throw new TokenMismatchException('CSRF token mismatch.')
        );

        $this->assertSame(302, $response->getStatusCode());
        $this->assertNotNull(session('live-edit.sign-in.error'));

        // Their address survives, so coming back means typing a password
        // rather than starting again.
        $this->assertSame('amaka@acme.test', session()->getOldInput('email'));
    }

    public function test_the_recovery_runs_before_the_check_it_recovers_from(): void
    {
        // Ordering is the whole trick and it is invisible. Middleware added
        // to a route runs AFTER the web group's, by which point the mismatch
        // has already become a 419 response and there is nothing left to
        // catch. Listed ahead of "web", it wraps it.
        $route = collect(Route::getRoutes()->getRoutes())
            ->first(fn ($r) => $r->uri() === 'live-edit/sign-in' && in_array('POST', $r->methods(), true));

        // The `web` group is still a name at this point and is expanded by
        // the router at dispatch, so what can be checked here is that ours is
        // listed ahead of it. That is the thing a future edit would break.
        $middleware = $route->gatherMiddleware();
        $ours = array_search(RecoversAnExpiredSignIn::class, $middleware, true);
        $web = array_search('web', $middleware, true);

        $this->assertNotFalse($ours, 'the recovery is not on the route at all');
        $this->assertNotFalse($web, 'the sign-in form is no longer in the web group, so it has no CSRF check');
        $this->assertLessThan($web, $ours, 'the recovery must wrap the web group, not follow it');
    }

    public function test_editors_are_managed_through_provisioning(): void
    {
        $this->postJson('/api/live-edit/v1/sites/acme/editors',
            ['email' => 'Ben@Acme.test', 'name' => 'Ben', 'may_publish' => false],
            ['Authorization' => 'Bearer '.self::ADMIN])
            ->assertCreated()
            ->assertJsonPath('editor.email', 'ben@acme.test')
            ->assertJsonPath('editor.may_publish', false);

        $this->getJson('/api/live-edit/v1/sites/acme/editors', ['Authorization' => 'Bearer '.self::ADMIN])
            ->assertOk()
            ->assertJsonCount(2, 'editors');

        $this->deleteJson('/api/live-edit/v1/sites/acme/editors/'.$this->editor->id,
            [], ['Authorization' => 'Bearer '.self::ADMIN])->assertOk();

        $this->assertSame(1, $this->site->editors()->count());

        // Removed from THIS site, not deleted: they may edit others, and an
        // agency taking somebody off one client's site must not destroy the
        // account they use for the rest.
        $this->assertNotNull(Editor::query()->find($this->editor->id));
    }

    public function test_a_session_slides_while_somebody_is_working(): void
    {
        // Being thrown out mid-sentence, with a dead key still in storage and
        // no way back, is a worse outcome than a key that lives while in use.
        $this->ask()->assertOk();
        $location = $this->get('/live-edit/sign-in/'.$this->linkFor($this->editor))->headers->get('Location');
        $key = urldecode(explode('#kb_session=', $location)[1]);

        $token = ApiToken::query()->where('type', 'session')->latest('id')->firstOrFail();

        // This site's sessions last half an hour, so five minutes left is
        // well past halfway and the next use should extend it.
        $token->forceFill(['expires_at' => now()->addMinutes(5)])->save();

        // Through HTTP, because that is where renewal happens and where an
        // editor's saves actually arrive.
        $this->getJson('/api/live-edit/v1/acme/content', [
            'Authorization' => 'Bearer '.$key,
            'Origin' => 'https://acme.test',
        ])->assertOk();

        $this->assertTrue(
            $token->fresh()->expires_at->greaterThan(now()->addMinutes(20)),
            'an editor who is working was not kept signed in'
        );
    }

    public function test_a_session_still_dies_eventually(): void
    {
        // However long it slides, a key taken out of a page must not be kept
        // alive forever by using it.
        config()->set('live-edit.api.session_max_life', 3600);

        $this->ask()->assertOk();
        $this->get('/live-edit/sign-in/'.$this->linkFor($this->editor));

        $token = ApiToken::query()->where('type', 'session')->latest('id')->firstOrFail();
        $token->forceFill(['created_at' => now()->subHours(5), 'expires_at' => now()->addMinute()])->save();
        $ends = $token->expires_at;

        $token->renewIfActive();

        // Long past its ceiling, so using it buys nothing: it still dies in a
        // minute, as it was always going to.
        $this->assertEquals($ends->timestamp, $token->fresh()->expires_at->timestamp);
    }

    public function test_editors_cannot_be_managed_without_the_provisioning_key(): void
    {
        $this->postJson('/api/live-edit/v1/sites/acme/editors', ['email' => 'x@acme.test'])->assertStatus(401);
    }
}
