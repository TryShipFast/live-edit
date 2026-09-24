<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Gate;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\ElementStyle;
use ShipFast\LiveEdit\Support\DraftStore;
use ShipFast\LiveEdit\Support\StyleCss;
use ShipFast\LiveEdit\Tests\Fixtures\Setting;

/**
 * What a visitor sees is the whole point: a client learning the editor on their
 * own site should not be publishing half-finished sentences as they type.
 */
class PublishingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['live-edit.publishing' => true, 'live-edit.auto_keys' => true]);
    }

    public function test_an_edit_is_held_back_rather_than_going_live(): void
    {
        $this->postJson('/live-edit/setting', ['key' => 'auto:a1b2c3d4', 'value' => 'Half a sen'])
            ->assertOk();

        $this->assertSame('Half a sen', DraftStore::settings()['auto:a1b2c3d4']);
        $this->assertDatabaseMissing('settings', ['key' => 'auto:a1b2c3d4']);
    }

    public function test_publishing_puts_the_held_changes_live_and_empties_the_drafts(): void
    {
        $this->postJson('/live-edit/setting', ['key' => 'auto:a1b2c3d4', 'value' => 'Finished sentence.']);

        $this->postJson('/live-edit/publish')
            ->assertOk()
            ->assertJson(['ok' => true, 'published' => 1]);

        $this->assertDatabaseHas('settings', ['key' => 'auto:a1b2c3d4', 'value' => 'Finished sentence.']);
        $this->assertSame(0, Draft::query()->count());
    }

    public function test_discarding_leaves_the_published_site_as_it_was(): void
    {
        Setting::query()->create(['key' => 'auto:a1b2c3d4', 'value' => 'The published words.']);
        $this->postJson('/live-edit/setting', ['key' => 'auto:a1b2c3d4', 'value' => 'A change of mind']);

        $this->postJson('/live-edit/draft/discard')->assertOk()->assertJson(['discarded' => 1]);

        $this->assertDatabaseHas('settings', ['key' => 'auto:a1b2c3d4', 'value' => 'The published words.']);
        $this->assertSame([], DraftStore::settings());
    }

    public function test_a_visitor_never_sees_unpublished_work(): void
    {
        DraftStore::put('setting', 'auto:a1b2c3d4', ['value' => 'Not ready']);

        // No gate, no preview: this is a passer-by.
        Gate::define('live-edit', fn () => false);
        $this->assertFalse(DraftStore::visibleToViewer());
    }

    public function test_whoever_is_editing_sees_their_own_unpublished_work(): void
    {
        // The parameter has to be nullable: a gate callback is skipped
        // entirely for a guest unless it says it accepts one, and this test is
        // about the decision rather than about signing in.
        Gate::define('live-edit', fn (?object $user = null) => true);

        $this->assertTrue(DraftStore::visibleToViewer());
    }

    public function test_a_preview_link_shows_unpublished_work_without_an_account(): void
    {
        Gate::define('live-edit', fn () => false);
        $this->assertFalse(DraftStore::visibleToViewer());

        session([DraftStore::PREVIEW_SESSION_KEY => true]);
        $this->assertTrue(DraftStore::visibleToViewer());
    }

    public function test_with_publishing_off_an_edit_goes_straight_live(): void
    {
        config(['live-edit.publishing' => false]);

        $this->postJson('/live-edit/setting', ['key' => 'auto:a1b2c3d4', 'value' => 'Live at once'])
            ->assertOk();

        $this->assertDatabaseHas('settings', ['key' => 'auto:a1b2c3d4', 'value' => 'Live at once']);
        $this->assertSame(0, Draft::query()->count());
    }

    public function test_a_held_style_replaces_its_published_one_only_for_those_who_may_see_it(): void
    {
        ElementStyle::query()->create(['key' => 's1', 'props' => ['background' => '#ffffff']]);
        DraftStore::put('style', 's1', ['props' => ['background' => '#000000']]);

        Gate::define('live-edit', fn () => false);
        $this->assertStringContainsString('#ffffff', StyleCss::render());
        $this->assertStringContainsString('#000000', StyleCss::render(DraftStore::styles()));
    }
}
