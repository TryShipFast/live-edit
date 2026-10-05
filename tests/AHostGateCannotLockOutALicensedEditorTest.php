<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Support\MayEdit;

/**
 * A host defines the gate, thinking about their own users, and silently
 * revokes the sign-in route we sold them.
 *
 * The package defines live-edit only when the host has not, which is right: an
 * application that knows about editors and administrators answers this better
 * than a config list. But a host writing that closure writes the obvious one -
 * "is this a signed-in user of mine, and are they on the list" - and somebody
 * who signed in with Live Edit is not. The control plane mints its own session
 * and leaves auth()->user() null, so the closure returns false and every
 * licensed editor is refused.
 *
 * It fails in the worst shape there is. The developer who wrote the gate is
 * usually signed in to their own admin while testing, so the editor appears
 * for them and nobody else: working locally, dead in production, nothing
 * logged. Found exactly that way on a site where the editor worked on .test
 * and not on the live domain.
 */
class AHostGateCannotLockOutALicensedEditorTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('live-edit.auto_tag', true);
        $app['config']->set('live-edit.auto_keys', true);
    }

    protected function setUp(): void
    {
        parent::setUp();

        // The gate a host actually writes: their users, nobody else's.
        Gate::define('live-edit', fn ($user = null) => $user !== null);

        Route::middleware('web')->get('/', fn () => response(
            '<html><body><main><h1>A heading</h1><p>Words somebody could edit.</p></main></body></html>'
        )->header('Content-Type', 'text/html'));
    }

    public function test_a_control_plane_session_edits_even_though_the_host_gate_refuses(): void
    {
        $this->assertFalse(Gate::allows('live-edit'), 'the host gate was expected to refuse, so this proves nothing');

        $this->withAnEditorSession();

        $this->assertTrue(MayEdit::check(), 'a licensed editor was locked out by the host application\'s own gate');
    }

    public function test_the_host_gate_still_answers_for_the_hosts_own_people(): void
    {
        // Narrowing this must not stop a host deciding about their own users.
        $this->assertFalse(MayEdit::check());

        Gate::define('live-edit', fn ($user = null) => true);

        $this->assertTrue(MayEdit::check());
    }

    public function test_a_host_who_wants_only_their_own_people_can_still_say_so(): void
    {
        /*
         * sign_in "host" turns the control plane off as a sign-in route, and
         * then the gate is the only answer. The default must not be a
         * decision somebody cannot reverse.
         */
        config(['live-edit.sign_in' => 'host']);

        $this->withAnEditorSession();

        $this->assertFalse(MayEdit::check());
    }

    public function test_nobody_at_all_still_means_nobody(): void
    {
        // The failure that would matter most: a fix for lockout that lets
        // every visitor edit.
        $this->assertFalse(MayEdit::check());
        $this->assertStringNotContainsString('data-edit', $this->get('/')->getContent());
    }

    /**
     * Exactly what a completed control-plane sign in leaves in the session,
     * written the same way EditorSession writes it.
     */
    private function withAnEditorSession(): void
    {
        session()->put('live-edit.editor', [
            'name' => 'Temitope Olotin',
            'email' => 'editor@example.test',
            'greeting' => 'Temitope',
            'expires_at' => now()->addHour()->toIso8601String(),
        ]);
    }
}
