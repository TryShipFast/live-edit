<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Support\EditorSession;

/**
 * Signing in to edit a site you do not have an account on.
 *
 * This is the whole point of the arrangement: the words live in the
 * customer's own database, and the question of who may change them is
 * answered where the site was registered. Asking somebody to hold an account
 * on their own website in order to fix a typo on it is the thing every
 * earlier version of this ended up demanding.
 *
 * So what is defended here is that this site never sees a password, believes
 * nothing a caller tells it about themselves, and lets a stranger no further
 * than a visitor.
 */
class EditorSignsInWithUsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        config()->set('live-edit.licence', [
            'host' => 'https://live.shipfast.test',
            'site' => 'acme',
            'key' => 'kbp_test',
            'ttl' => 86400,
        ]);
        config()->set('live-edit.editors', '');
    }

    private function serviceSays(array $session, int $status = 200): void
    {
        Http::fake(['*/session*' => Http::response(['session' => $session], $status)]);
    }

    private function aGoodSession(array $overrides = []): array
    {
        return array_merge([
            'valid' => true,
            'site' => 'acme',
            'expires_at' => now()->addHour()->toIso8601String(),
            'editor' => ['name' => 'Tope', 'email' => 'tope@acme.test', 'greeting' => 'Tope'],
        ], $overrides);
    }

    public function test_a_verified_session_is_somebody_who_may_edit(): void
    {
        $this->serviceSays($this->aGoodSession());

        $editor = EditorSession::start('kbe_good');

        $this->assertNotNull($editor);
        $this->assertSame('Tope', $editor['greeting']);
        $this->assertTrue(EditorSession::check());

        // And the gate opens with no user signed in to this website at all,
        // which is the arrangement in one line.
        $this->assertTrue(Gate::allows('live-edit'));
    }

    public function test_a_session_for_another_site_is_refused(): void
    {
        // The token is real and the service says so. It is simply not for us,
        // and this site is the only party that knows which site it is.
        $this->serviceSays($this->aGoodSession(['site' => 'somebody-else']));

        $this->assertNull(EditorSession::start('kbe_other_site'));
        $this->assertFalse(Gate::allows('live-edit'));
    }

    public function test_a_session_the_service_rejects_is_refused(): void
    {
        $this->serviceSays(['valid' => false]);

        $this->assertNull(EditorSession::start('kbe_expired'));
        $this->assertFalse(EditorSession::check());
    }

    public function test_a_service_that_cannot_be_reached_does_not_let_anybody_in(): void
    {
        Http::fake(fn () => throw new ConnectionException('down'));

        // The opposite of the licence rule, and deliberately so. An outage
        // must not cost a signed-in customer their editor, but it must never
        // hand the editor to somebody we could not identify.
        $this->assertNull(EditorSession::start('kbe_anything'));
    }

    public function test_a_session_stops_working_when_it_expires(): void
    {
        $this->serviceSays($this->aGoodSession(['expires_at' => now()->addSeconds(2)->toIso8601String()]));

        EditorSession::start('kbe_short');
        $this->assertTrue(EditorSession::check());

        $this->travel(5)->seconds();

        // Checked here rather than only at the service, so it lapses on time
        // instead of on the next request that happens to ask.
        $this->assertFalse(EditorSession::check());
        $this->assertFalse(Gate::allows('live-edit'));
    }

    public function test_the_site_takes_a_token_from_the_toolbar_and_checks_it(): void
    {
        $this->serviceSays($this->aGoodSession());

        $this->postJson('/live-edit/session', ['token' => 'kbe_good'])
            ->assertOk()
            ->assertJsonPath('editor.greeting', 'Tope');
    }

    public function test_a_made_up_token_gets_nowhere(): void
    {
        $this->serviceSays(['valid' => false]);

        $this->postJson('/live-edit/session', ['token' => 'kbe_invented'])
            ->assertStatus(422);

        $this->assertFalse(Gate::allows('live-edit'));
    }

    public function test_signing_out_ends_it(): void
    {
        $this->serviceSays($this->aGoodSession());
        EditorSession::start('kbe_good');

        $this->deleteJson('/live-edit/session')->assertOk();

        $this->assertFalse(EditorSession::check());
    }

    public function test_this_site_never_learns_a_password(): void
    {
        $this->serviceSays($this->aGoodSession());
        EditorSession::start('kbe_good');

        // Nothing resembling a credential is kept here. The site holds a
        // greeting and an address so it can say who is editing, and that is
        // the entire record.
        $kept = session('live-edit.editor');

        $this->assertIsArray($kept);
        $this->assertSame(['name', 'email', 'greeting', 'expires_at'], array_keys($kept));
    }

    public function test_a_password_is_never_confirmed_by_how_long_the_answer_takes(): void
    {
        // Unknown address and wrong password have to be one answer. Two
        // answers — even two timings — turn this into a way to ask which of a
        // customer's staff are real.
        $hash = Hash::make('the-right-one');

        $this->assertFalse(Hash::check('wrong', $hash));
        $this->assertTrue(Hash::check('the-right-one', $hash));
    }

    public function test_the_session_is_not_left_in_the_address_bar(): void
    {
        $this->serviceSays($this->aGoodSession());
        EditorSession::start('kbe_good');

        /*
         * Already signed in, arriving with a session still in the fragment.
         *
         * A browser carries a fragment across a redirect when the new address
         * has none, so this path handed somebody their page with a working
         * session on screen. The fragment exists precisely so the token never
         * reaches a server or a log, and leaving it visible at the end of the
         * journey gives all of that back to the first shared link.
         */
        $this->get('/live-edit/enter?to=/about')
            ->assertRedirect('/about#');
    }

    public function test_somewhere_else_is_not_a_destination(): void
    {
        $this->serviceSays($this->aGoodSession());
        EditorSession::start('kbe_good');

        // An absolute address here would let a link decide where a freshly
        // signed-in editor lands, which is somebody else's page wearing this
        // site's session.
        $this->get('/live-edit/enter?to=https://somewhere-else.test/steal')
            ->assertRedirect('/#');
    }
}
