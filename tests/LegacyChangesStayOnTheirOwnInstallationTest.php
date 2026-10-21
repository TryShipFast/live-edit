<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Support\DraftStore;

class LegacyChangesStayOnTheirOwnInstallationTest extends TestCase
{
    public function test_the_laravel_fallback_never_lists_an_api_sites_drafts(): void
    {
        config(['live-edit.publishing' => true, 'live-edit.auto_keys' => true]);
        $customer = Site::query()->create(['slug' => 'another-customer', 'name' => 'Another Customer']);
        Draft::query()->create([
            'site_id' => $customer->id,
            'kind' => 'setting',
            'subject' => 'auto:foreign',
            'payload' => ['value' => 'Another customer content'],
        ]);

        $this->getJson('/live-edit/changes')
            ->assertOk()
            ->assertJsonPath('count', 0)
            ->assertJsonPath('changes', []);

        DraftStore::put('setting', 'auto:mine', ['value' => 'My content']);

        $this->getJson('/live-edit/changes')
            ->assertOk()
            ->assertJsonPath('count', 1)
            ->assertJsonPath('changes.0.key', 'auto:mine')
            ->assertJsonPath('changes.0.after', 'My content');

        $this->assertDatabaseHas('live_edit_drafts', ['site_id' => $customer->id, 'subject' => 'auto:foreign']);
    }
}
