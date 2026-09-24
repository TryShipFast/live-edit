<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Gate;
use ShipFast\LiveEdit\Support\DraftStore;
use ShipFast\LiveEdit\Support\EditorConfig;

class EditorConfigTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('live-edit.publishing', true);
    }

    public function test_a_visitor_is_shown_the_published_value_not_the_draft(): void
    {
        Gate::define('live-edit', fn ($user = null) => false);
        DraftStore::put('setting', 'heroTitle', ['value' => 'Half typed']);

        $this->assertSame(
            ['heroTitle' => 'Published'],
            EditorConfig::withDrafts(['heroTitle' => 'Published'])
        );
    }

    public function test_an_editor_is_shown_their_own_unpublished_work(): void
    {
        Gate::define('live-edit', fn ($user = null) => true);
        DraftStore::put('setting', 'heroTitle', ['value' => 'Half typed']);

        $this->assertSame(
            ['heroTitle' => 'Half typed'],
            EditorConfig::withDrafts(['heroTitle' => 'Published'])
        );
    }

    public function test_a_preview_link_holder_sees_drafts_without_being_able_to_edit(): void
    {
        Gate::define('live-edit', fn ($user = null) => false);
        session([DraftStore::PREVIEW_SESSION_KEY => true]);
        DraftStore::put('setting', 'heroTitle', ['value' => 'For review']);

        $this->assertSame(['heroTitle' => 'For review'], EditorConfig::withDrafts(['heroTitle' => 'Published']));
    }

    public function test_publishing_off_leaves_content_exactly_as_it_was(): void
    {
        config()->set('live-edit.publishing', false);
        Gate::define('live-edit', fn ($user = null) => true);
        DraftStore::put('setting', 'heroTitle', ['value' => 'Half typed']);

        $this->assertSame(['heroTitle' => 'Published'], EditorConfig::withDrafts(['heroTitle' => 'Published']));
    }

    public function test_the_editor_is_told_how_many_changes_are_waiting(): void
    {
        Gate::define('live-edit', fn ($user = null) => true);
        DraftStore::put('setting', 'a', ['value' => '1']);
        DraftStore::put('setting', 'b', ['value' => '2']);

        $script = EditorConfig::publishingScript();

        $this->assertStringContainsString('"pending":2', $script);
        $this->assertStringContainsString('previewUrl', $script);
    }

    public function test_a_visitor_is_told_nothing_about_publishing(): void
    {
        Gate::define('live-edit', fn ($user = null) => false);

        $this->assertSame('', EditorConfig::publishingScript());
    }
}
