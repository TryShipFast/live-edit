<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Support\Facades\Mail;
use Illuminate\Testing\TestResponse;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\SignInToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenAuthenticator;
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
            'site_id' => $this->site->id,
            'email' => 'amaka@acme.test',
            'name' => 'Amaka',
        ]);
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
        $this->editor->forceFill(['may_publish' => false])->save();

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

        $this->assertSame(1, Editor::query()->where('site_id', $this->site->id)->count());
    }

    public function test_editors_cannot_be_managed_without_the_provisioning_key(): void
    {
        $this->postJson('/api/live-edit/v1/sites/acme/editors', ['email' => 'x@acme.test'])->assertStatus(401);
    }
}
