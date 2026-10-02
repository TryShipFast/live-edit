<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\PasswordSignIn;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * Refused the same way for every reason, and still worth reading.
 *
 * Two properties that pull against each other, and both matter.
 *
 * The refusal must not vary. Told apart, it becomes a way to ask which of an
 * agency's staff are real and which other agencies somebody works for: try one
 * address against a stranger's domain and read the difference between "no such
 * person" and "wrong password".
 *
 * And it must be actionable, which it was not. Somebody finishing an install
 * is usually the site's owner, the likeliest cause is a grant nobody made, and
 * the old wording sent them to check the one thing that was fine - their
 * password. Reported from a real install with everything right except a row in
 * a table: it cost an afternoon, and ended in guessing at passwords, which is
 * the worst thing a login message can talk somebody into.
 *
 * So: identical words, and the words name what to go and look at.
 */
class OneRefusalForEveryReasonTest extends TestCase
{
    private Site $site;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api.enabled', true);
        $app['config']->set('live-edit.api.prefix', 'api/live-edit/v1');
        $app['config']->set('cors.paths', []);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create(['slug' => 'acme', 'name' => 'Acme']);
    }

    private function refusalFor(string $email, string $password): string
    {
        $response = $this->postJson('/api/live-edit/v1/sign-in/password', [
            'site' => $this->site->slug,
            'email' => $email,
            'password' => $password,
        ]);

        $response->assertStatus(422);

        return (string) $response->json('error.message');
    }

    public function test_the_three_reasons_are_refused_in_identical_words(): void
    {
        /*
         * An address nobody has ever heard of; an editor who is real but
         * edits somewhere else; and the right person with the wrong password.
         * Three different facts, one answer.
         */
        $elsewhere = Site::query()->create(['slug' => 'other', 'name' => 'Other']);
        $stranger = Editor::query()->create(['email' => 'stranger@example.com']);
        PasswordSignIn::set($stranger, 'correct-horse');
        $elsewhere->editors()->syncWithoutDetaching([$stranger->id => ['may_publish' => true]]);

        $ours = Editor::query()->create(['email' => 'ours@example.com']);
        PasswordSignIn::set($ours, 'correct-horse');
        $this->site->editors()->syncWithoutDetaching([$ours->id => ['may_publish' => true]]);

        $unknown = $this->refusalFor('nobody@example.com', 'whatever');
        $notHere = $this->refusalFor('stranger@example.com', 'correct-horse');
        $wrongPassword = $this->refusalFor('ours@example.com', 'not-the-password');

        $this->assertSame($unknown, $notHere, 'an editor of another site is distinguishable from a stranger');
        $this->assertSame($notHere, $wrongPassword, 'a wrong password is distinguishable from a missing grant');
    }

    public function test_an_editor_with_no_password_is_refused_the_same_way_too(): void
    {
        /*
         * The case that prompted all of this. Granting an editor issues no
         * password on purpose, so this is the state every site registered from
         * the command line starts in - and it looked exactly like a wrong
         * password to the person trying to finish an install.
         */
        $granted = Editor::query()->create(['email' => 'granted@example.com']);
        $this->site->editors()->syncWithoutDetaching([$granted->id => ['may_publish' => true]]);

        $this->assertSame(
            $this->refusalFor('nobody@example.com', 'whatever'),
            $this->refusalFor('granted@example.com', 'anything')
        );
    }

    public function test_the_refusal_names_what_to_go_and_look_at(): void
    {
        $said = $this->refusalFor('nobody@example.com', 'whatever');

        // The distinction nobody expects, and the reason an afternoon went:
        // the console password does not open this door.
        $this->assertStringContainsString('account on the console', $said);
        $this->assertStringContainsString('editor of a site', $said);
        $this->assertStringContainsString('editing password', $said);
    }

    public function test_it_says_which_site_is_refusing(): void
    {
        /*
         * Safe to name: the caller put the site in the URL, so this tells
         * them nothing they did not bring with them. Useful because somebody
         * with several sites open does not otherwise know which tab refused.
         */
        $this->assertStringContainsString('Acme', $this->refusalFor('nobody@example.com', 'whatever'));
    }

    public function test_the_right_password_still_signs_somebody_in(): void
    {
        // The guard against a refusal so thorough it refuses everybody.
        $editor = Editor::query()->create(['email' => 'real@example.com']);
        PasswordSignIn::set($editor, 'correct-horse');
        $this->site->editors()->syncWithoutDetaching([$editor->id => ['may_publish' => true]]);

        $this->postJson('/api/live-edit/v1/sign-in/password', [
            'site' => $this->site->slug,
            'email' => 'real@example.com',
            'password' => 'correct-horse',
        ])->assertOk()->assertJsonStructure(['session' => ['token']]);
    }
}
