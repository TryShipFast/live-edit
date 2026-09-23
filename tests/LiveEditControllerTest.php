<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Models\EditRevision;
use ShipFast\LiveEdit\Models\ElementStyle;
use ShipFast\LiveEdit\Tests\Fixtures\Setting;
use ShipFast\LiveEdit\Tests\Fixtures\Widget;

/**
 * Proves the packaged controller is genuinely generic: it drives a host
 * whose content models and config are nothing like the tokreamsblue app
 * (a 'Widget' collection, a different Setting model, a smaller prop set).
 */
class LiveEditControllerTest extends TestCase
{
    public function test_it_saves_a_whitelisted_setting_and_rejects_unknown_keys(): void
    {
        $this->postJson('/live-edit/setting', ['key' => 'tagline', 'value' => 'Hello'])->assertOk();
        $this->assertDatabaseHas('settings', ['key' => 'tagline', 'value' => 'Hello']);

        $this->postJson('/live-edit/setting', ['key' => 'not_declared', 'value' => 'x'])->assertUnprocessable();
    }

    public function test_it_validates_link_settings(): void
    {
        $this->postJson('/live-edit/setting', ['key' => 'ctaHref', 'value' => 'javascript:alert(1)'])->assertUnprocessable();
        $this->postJson('/live-edit/setting', ['key' => 'ctaTarget', 'value' => '_parent'])->assertUnprocessable();
        $this->postJson('/live-edit/setting', ['key' => 'ctaHref', 'value' => '/go'])->assertOk();
    }

    public function test_it_validates_media_embed_urls(): void
    {
        // An iframe/video src must be a real http(s) URL, never a script URI.
        $this->postJson('/live-edit/setting', ['key' => 'mapEmbed', 'value' => 'javascript:alert(1)'])->assertUnprocessable();
        $this->postJson('/live-edit/setting', ['key' => 'mapEmbed', 'value' => '/relative'])->assertUnprocessable();
        $this->postJson('/live-edit/setting', ['key' => 'mapEmbed', 'value' => 'https://maps.example.com/embed'])->assertOk();
        $this->assertDatabaseHas('settings', ['key' => 'mapEmbed', 'value' => 'https://maps.example.com/embed']);
    }

    public function test_it_accepts_auto_keys_only_when_the_generic_store_is_on(): void
    {
        // Off by default: a scanner auto-key is rejected like any unknown key.
        $this->postJson('/live-edit/setting', ['key' => 'auto:ab12cd34', 'value' => 'x'])->assertUnprocessable();

        // On: any auto:<hash> key persists with no per-element allowlist entry.
        config()->set('live-edit.auto_keys', true);
        $this->postJson('/live-edit/setting', ['key' => 'auto:ab12cd34', 'value' => 'Hello'])->assertOk();
        $this->assertDatabaseHas('settings', ['key' => 'auto:ab12cd34', 'value' => 'Hello']);

        // A non-auto key that isn't on the allowlist is still rejected.
        $this->postJson('/live-edit/setting', ['key' => 'made_up_key', 'value' => 'x'])->assertUnprocessable();
        // And a malformed auto key (not a hash) is rejected.
        $this->postJson('/live-edit/setting', ['key' => 'auto:DROP TABLE', 'value' => 'x'])->assertUnprocessable();
    }

    public function test_it_stores_a_translation_under_a_locale_namespaced_key(): void
    {
        // The default locale keeps the bare key; another locale namespaces it,
        // so the base value is never overwritten by a translation.
        $this->postJson('/live-edit/setting', ['key' => 'tagline', 'value' => 'Fly safe', 'locale' => 'en'])->assertOk();
        $this->postJson('/live-edit/setting', ['key' => 'tagline', 'value' => 'Volez sereins', 'locale' => 'fr'])->assertOk();

        $this->assertDatabaseHas('settings', ['key' => 'tagline', 'value' => 'Fly safe']);
        $this->assertDatabaseHas('settings', ['key' => 'fr:tagline', 'value' => 'Volez sereins']);
    }

    public function test_it_rejects_an_unknown_locale(): void
    {
        $this->postJson('/live-edit/setting', ['key' => 'tagline', 'value' => 'x', 'locale' => 'de'])->assertUnprocessable();
    }

    public function test_undo_reverts_a_translation_without_touching_the_base(): void
    {
        $this->postJson('/live-edit/setting', ['key' => 'tagline', 'value' => 'Base'])->assertOk();
        $this->postJson('/live-edit/setting', ['key' => 'tagline', 'value' => 'Traduction', 'locale' => 'fr'])->assertOk();

        $this->postJson('/live-edit/undo')->assertOk();

        // The French row is gone/emptied; the base row is untouched.
        $this->assertDatabaseHas('settings', ['key' => 'tagline', 'value' => 'Base']);
        $this->assertDatabaseMissing('settings', ['key' => 'fr:tagline', 'value' => 'Traduction']);
    }

    public function test_it_edits_a_placeholder_as_plain_text(): void
    {
        // A form placeholder is just a setting — free text, no URL rules.
        $this->postJson('/live-edit/setting', ['key' => 'quotePlaceholder', 'value' => 'Part number or tail sign'])->assertOk();
        $this->assertDatabaseHas('settings', ['key' => 'quotePlaceholder', 'value' => 'Part number or tail sign']);
    }

    public function test_it_replaces_an_auto_keyed_image_only_when_the_generic_store_is_on(): void
    {
        // An auto-tagged theme has no named image keys, so without this the
        // editor offers an image it can never save.
        $this->postJson('/live-edit/image', ['target' => 'setting:auto:be3a6ddd0725', 'url' => 'https://x.test/a.jpg'])
            ->assertStatus(422);

        config()->set('live-edit.auto_keys', true);

        $this->postJson('/live-edit/image', ['target' => 'setting:auto:be3a6ddd0725', 'url' => 'https://x.test/a.jpg'])
            ->assertOk();
        $this->assertDatabaseHas('settings', ['key' => 'auto:be3a6ddd0725', 'value' => 'https://x.test/a.jpg']);
    }

    public function test_it_fits_an_uploaded_image_to_the_box_it_replaces(): void
    {
        Storage::fake('public');

        // A tall portrait dropped into a wide banner would wreck the layout.
        $response = $this->post('/live-edit/upload', [
            'file' => UploadedFile::fake()->image('portrait.jpg', 400, 1200),
            'fitWidth' => 800,
            'fitHeight' => 300,
        ]);

        $response->assertOk();

        $stored = Storage::disk('public')->path(
            str_replace(Storage::disk('public')->url(''), '', $response->json('url'))
        );
        [$width, $height] = getimagesize($stored);

        $this->assertSame(800, $width);
        $this->assertSame(300, $height);
    }

    public function test_an_upload_without_a_box_keeps_its_own_size(): void
    {
        Storage::fake('public');

        $response = $this->post('/live-edit/upload', [
            'file' => UploadedFile::fake()->image('as-is.jpg', 640, 480),
        ]);

        $stored = Storage::disk('public')->path(
            str_replace(Storage::disk('public')->url(''), '', $response->json('url'))
        );

        $this->assertSame([640, 480], array_slice(getimagesize($stored), 0, 2));
    }

    public function test_it_stores_an_uploaded_image_and_returns_its_url(): void
    {
        Storage::fake('public');

        // URL-valued style fields (a section background) accept an upload as
        // well as a pasted link, so the editor needs a URL back.
        $response = $this->post('/live-edit/upload', [
            'file' => UploadedFile::fake()->image('bg.jpg'),
        ]);

        $response->assertOk()->assertJsonStructure(['url']);
        $this->assertStringContainsString('live-edit/', $response->json('url'));
    }

    public function test_it_rejects_a_non_image_upload(): void
    {
        Storage::fake('public');

        $this->post('/live-edit/upload', [
            'file' => UploadedFile::fake()->create('payload.php', 10),
        ])->assertStatus(302);
    }

    public function test_it_stores_and_removes_a_background_image_setting(): void
    {
        // A background reuses the image endpoint — the URL lands on the setting.
        $this->postJson('/live-edit/image', ['target' => 'setting:heroBg', 'url' => 'https://example.com/bg.jpg'])->assertOk();
        $this->assertDatabaseHas('settings', ['key' => 'heroBg', 'value' => 'https://example.com/bg.jpg']);

        $this->postJson('/live-edit/image', ['target' => 'setting:heroBg', 'remove' => '1'])->assertOk();
        $this->assertDatabaseHas('settings', ['key' => 'heroBg', 'value' => '']);
    }

    public function test_it_creates_updates_reorders_and_deletes_collection_records(): void
    {
        $first = $this->widget(['title' => 'First']);
        $second = $this->widget(['title' => 'Second']);

        $created = $this->postJson('/live-edit/record/create', ['type' => 'widget'])->assertOk()->json('id');
        $this->assertDatabaseHas('widgets', ['id' => $created, 'title' => 'New widget']);

        $this->postJson('/live-edit/record', [
            'type' => 'widget',
            'id' => $created,
            'fields' => ['title' => 'Renamed', 'icon' => 'heart'],
        ])->assertOk();
        $this->assertDatabaseHas('widgets', ['id' => $created, 'title' => 'Renamed', 'icon' => 'heart']);

        $this->postJson('/live-edit/record/move', ['type' => 'widget', 'id' => $second->id, 'direction' => 'up'])
            ->assertOk()->assertJson(['moved' => true]);
        $this->assertSame($second->id, Widget::query()->orderBy('sort')->first()->id);

        $this->deleteJson("/live-edit/record/widget/{$created}")->assertOk();
        $this->assertDatabaseMissing('widgets', ['id' => $created]);
    }

    public function test_it_rejects_invalid_icons_for_this_hosts_icon_set(): void
    {
        $widget = $this->widget();

        $this->postJson('/live-edit/record', ['type' => 'widget', 'id' => $widget->id, 'fields' => ['icon' => 'rocket']])
            ->assertUnprocessable();
        $this->postJson('/live-edit/record', ['type' => 'widget', 'id' => $widget->id, 'fields' => ['icon' => 'bolt']])
            ->assertOk();
    }

    public function test_it_replaces_a_setting_image_by_url(): void
    {
        $this->postJson('/live-edit/image', ['target' => 'setting:banner', 'url' => 'https://example.com/b.jpg'])->assertOk();
        $this->assertDatabaseHas('settings', ['key' => 'banner', 'value' => 'https://example.com/b.jpg']);

        $this->postJson('/live-edit/image', ['target' => 'setting:unknown', 'url' => 'https://example.com/x.jpg'])->assertStatus(422);
    }

    public function test_it_stores_and_clears_styles_for_this_hosts_prop_set(): void
    {
        $this->postJson('/live-edit/style', ['key' => 'hero', 'props' => ['background' => '#123456', 'paddingY' => '40']])->assertOk();
        $this->assertDatabaseHas('element_styles', ['key' => 'hero']);

        // a prop this host did not declare is ignored, not stored
        $this->postJson('/live-edit/style', ['key' => 'hero', 'props' => ['fontSize' => '40']])->assertOk();
        $this->assertDatabaseMissing('element_styles', ['key' => 'hero']);
    }

    public function test_undo_reverts_the_last_change(): void
    {
        Setting::query()->create(['key' => 'tagline', 'value' => 'Original']);

        $this->postJson('/live-edit/setting', ['key' => 'tagline', 'value' => 'Changed'])->assertOk();
        $this->postJson('/live-edit/undo')->assertOk()->assertJson(['undone' => true]);

        $this->assertSame('Original', Setting::query()->where('key', 'tagline')->value('value'));
    }

    public function test_undo_recreates_a_deleted_record(): void
    {
        $widget = $this->widget(['title' => 'Keep me']);

        $this->deleteJson("/live-edit/record/widget/{$widget->id}")->assertOk();
        $this->assertDatabaseMissing('widgets', ['title' => 'Keep me']);

        $this->postJson('/live-edit/undo')->assertOk();
        $this->assertDatabaseHas('widgets', ['id' => $widget->id, 'title' => 'Keep me']);
    }

    public function test_element_style_and_edit_revision_tables_come_from_the_package(): void
    {
        $this->postJson('/live-edit/style', ['key' => 'x', 'props' => ['hidden' => '1']])->assertOk();

        $this->assertSame(1, ElementStyle::query()->count());
        $this->assertGreaterThan(0, EditRevision::query()->count());
    }
}
