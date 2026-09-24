<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Models\Version;
use ShipFast\LiveEdit\Support\DraftStore;
use ShipFast\LiveEdit\Support\PublishedContent;
use ShipFast\LiveEdit\Support\Snapshot;
use ShipFast\LiveEdit\Tests\Fixtures\Setting;

/**
 * A version is a state that was once live, not a log of the edits that made it.
 * That is what lets going back be one decision instead of unpicking changes.
 */
class VersioningTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config([
            'live-edit.publishing' => true,
            'live-edit.auto_keys' => true,
            'live-edit.snapshot_disk' => 'local',
        ]);
    }

    public function test_publishing_writes_a_version_and_a_pointer_to_it(): void
    {
        Setting::query()->create(['key' => 'auto:a1b2c3', 'value' => 'First words.']);
        DraftStore::put('setting', 'auto:a1b2c3', ['value' => 'Second words.']);

        DraftStore::publish();

        $this->assertSame(1, Version::query()->count());
        Storage::disk('local')->assertExists('live-edit/content/v1/en.json');
        Storage::disk('local')->assertExists('live-edit/content/current.json');

        $pointer = json_decode(Storage::disk('local')->get('live-edit/content/current.json'), true);
        $this->assertSame(1, $pointer['version']);
    }

    public function test_each_publish_is_a_new_version_and_the_old_one_stays(): void
    {
        Setting::query()->create(['key' => 'auto:a1b2c3', 'value' => 'One']);
        DraftStore::publish();
        Setting::query()->where('key', 'auto:a1b2c3')->update(['value' => 'Two']);
        DraftStore::publish();

        $this->assertSame([1, 2], Version::query()->orderBy('number')->pluck('number')->all());
        // The first snapshot is untouched by the second publish.
        $this->assertSame('One', Snapshot::read(1)['settings']['auto:a1b2c3']);
        $this->assertSame('Two', Snapshot::read(2)['settings']['auto:a1b2c3']);
    }

    public function test_restoring_puts_the_old_content_back_as_a_new_version(): void
    {
        Setting::query()->create(['key' => 'auto:a1b2c3', 'value' => 'The good copy.']);
        DraftStore::publish();
        Setting::query()->where('key', 'auto:a1b2c3')->update(['value' => 'A regrettable rewrite.']);
        DraftStore::publish();

        $changed = DraftStore::restore(1);

        $this->assertSame(1, $changed);
        $this->assertSame('The good copy.', Setting::query()->where('key', 'auto:a1b2c3')->value('value'));
        // Forward, not rewound: the restore is itself the newest version.
        $this->assertSame(3, (int) Version::query()->max('number'));
        $this->assertSame(1, Version::query()->where('number', 3)->value('restored_from'));
    }

    public function test_restoring_a_version_that_was_never_published_does_nothing(): void
    {
        $this->assertNull(DraftStore::restore(99));
    }

    public function test_a_translation_falls_back_to_the_default_in_the_snapshot(): void
    {
        // Resolved once, at publish, so no adapter has to implement fallback
        // and no missing translation can render as a blank.
        Setting::query()->create(['key' => 'auto:a1b2c3', 'value' => 'Hello']);
        Setting::query()->create(['key' => 'auto:d4e5f6', 'value' => 'Goodbye']);
        Setting::query()->create(['key' => 'fr:auto:a1b2c3', 'value' => 'Bonjour']);

        DraftStore::publish();

        $french = Snapshot::read(1, 'fr')['settings'];
        $this->assertSame('Bonjour', $french['auto:a1b2c3']);
        $this->assertSame('Goodbye', $french['auto:d4e5f6']);

        $english = Snapshot::read(1, 'en')['settings'];
        $this->assertSame('Hello', $english['auto:a1b2c3']);
        // The French copy never leaks into English.
        $this->assertArrayNotHasKey('fr:auto:a1b2c3', $english);
    }

    public function test_a_version_records_what_it_holds(): void
    {
        Setting::query()->create(['key' => 'auto:a1b2c3', 'value' => 'Hello']);
        DraftStore::put('setting', 'auto:a1b2c3', ['value' => 'Hello there']);

        DraftStore::publish();

        $version = Version::query()->first();
        $this->assertSame(1, $version->changes);
        $this->assertSame(['en', 'fr'], array_keys($version->locales));
    }

    public function test_a_page_is_served_from_the_snapshot_not_the_database(): void
    {
        // The point of publishing: the database can move without the site
        // moving with it, until someone says so.
        Setting::query()->create(['key' => 'auto:a1b2c3', 'value' => 'What was published.']);
        DraftStore::publish();

        Setting::query()->where('key', 'auto:a1b2c3')->update(['value' => 'Not published yet.']);

        $this->assertSame('What was published.', PublishedContent::settings('en')['auto:a1b2c3']);

        DraftStore::publish();
        $this->assertSame('Not published yet.', PublishedContent::settings('en')['auto:a1b2c3']);
    }

    public function test_a_site_that_never_published_is_served_from_the_database(): void
    {
        // Nothing changes for an installation that does not hold edits back.
        Setting::query()->create(['key' => 'auto:a1b2c3', 'value' => 'Straight to the page.']);

        $this->assertNull(PublishedContent::version());
        $this->assertSame('Straight to the page.', PublishedContent::settings('en')['auto:a1b2c3']);
    }

    public function test_a_site_that_has_not_run_the_migration_still_serves(): void
    {
        // An installation upgrades the package before it migrates. Every page
        // five-hundreded in that window.
        Schema::drop('live_edit_versions');
        Schema::drop('live_edit_drafts');
        Setting::query()->create(['key' => 'auto:a1b2c3', 'value' => 'Still serving.']);

        $this->assertNull(PublishedContent::version());
        $this->assertFalse(DraftStore::enabled());
        $this->assertSame('Still serving.', PublishedContent::settings('en')['auto:a1b2c3']);
    }
}
