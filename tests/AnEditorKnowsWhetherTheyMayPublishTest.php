<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\PasswordSignIn;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * An editor whose grant does not include "Can publish" is told so by their session, so the editor
 * offers "Ask to publish" instead of a Publish the API refuses ("Could not publish… try again").
 * Somebody who may publish is told that too; nothing here grants or refuses anything.
 */
class AnEditorKnowsWhetherTheyMayPublishTest extends TestCase
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

    private function sessionOf(string $email, bool $mayPublish): array
    {
        $editor = Editor::query()->create(['email' => $email]);
        PasswordSignIn::set($editor, 'correct-horse');
        $this->site->editors()->syncWithoutDetaching([$editor->id => ['may_publish' => $mayPublish]]);

        $token = $this->postJson('/api/live-edit/v1/sign-in/password', [
            'site' => $this->site->slug,
            'email' => $email,
            'password' => 'correct-horse',
        ])->assertOk()->json('session.token');

        return $this->getJson("/api/live-edit/v1/{$this->site->slug}/session", ['Authorization' => "Bearer {$token}"])
            ->assertOk()
            ->json('session');
    }

    public function test_an_editor_without_can_publish_is_told_they_may_not(): void
    {
        $session = $this->sessionOf('writer@example.com', false);

        $this->assertTrue($session['valid']);
        $this->assertFalse($session['may_publish']);
    }

    public function test_an_editor_with_can_publish_is_told_they_may(): void
    {
        $session = $this->sessionOf('owner@example.com', true);

        $this->assertTrue($session['valid']);
        $this->assertTrue($session['may_publish']);
    }
}
