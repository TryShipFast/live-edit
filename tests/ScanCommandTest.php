<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Console\Commands\ScanForEditables;
use ShipFast\LiveEdit\Tests\Fixtures\Setting;

class ScanCommandTest extends TestCase
{
    protected string $dir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dir = sys_get_temp_dir().'/live-edit-scan-'.getmypid();
        @mkdir($this->dir, 0777, true);
    }

    protected function tearDown(): void
    {
        foreach (glob($this->dir.'/*') ?: [] as $file) {
            @unlink($file);
        }
        @rmdir($this->dir);
        parent::tearDown();
    }

    public function test_it_refuses_to_apply_tags_to_a_blade_template(): void
    {
        $path = $this->dir.'/card.blade.php';
        file_put_contents($path, "<section><h1>{{ \$site->get('t') }}</h1></section>");

        $this->artisan('live-edit:scan', ['path' => $path, '--apply' => true])
            ->assertFailed();

        // The source is untouched and no tagged file was written.
        $this->assertFileDoesNotExist($this->dir.'/card.blade.tagged.php');
        $this->assertStringContainsString('$site->get', file_get_contents($path));
    }

    public function test_force_lets_you_apply_to_a_template_anyway(): void
    {
        $path = $this->dir.'/card.blade.php';
        file_put_contents($path, '<section><h1>Hello</h1></section>');

        $this->artisan('live-edit:scan', ['path' => $path, '--apply' => true, '--force' => true])
            ->assertOk();

        $this->assertFileExists($this->dir.'/card.blade.tagged.php');
    }

    public function test_it_applies_cleanly_to_plain_html(): void
    {
        $path = $this->dir.'/page.html';
        file_put_contents($path, '<section><h1>Hello</h1></section>');

        $this->artisan('live-edit:scan', ['path' => $path, '--apply' => true])
            ->assertOk();

        $tagged = file_get_contents($this->dir.'/page.tagged.html');
        $this->assertStringContainsString('data-edit="setting:', $tagged);
    }

    public function test_migrate_carries_saved_content_onto_the_new_keys(): void
    {
        $path = $this->dir.'/page.html';
        file_put_contents($path, '<div id="hero"><h1>Welcome</h1></div>');
        $this->artisan('live-edit:scan', ['path' => $path, '--apply' => true, '--auto' => true])->assertOk();

        $keyOf = function (): string {
            preg_match('/<h1 data-edit="setting:(auto:[a-f0-9]+)"/', (string) file_get_contents($this->dir.'/page.tagged.html'), $m);

            return $m[1];
        };
        $oldKey = $keyOf();

        // The client spends an afternoon writing their site.
        Setting::create(['key' => $oldKey, 'value' => 'Words the client wrote']);

        // Later a developer edits the template, moving the heading's key.
        file_put_contents($path, '<div class="promo">Offer</div><div id="hero-band"><h1>Welcome</h1></div>');
        $this->artisan('live-edit:scan', [
            'path' => $path, '--apply' => true, '--auto' => true, '--migrate' => true,
        ])->assertOk();

        $newKey = $keyOf();

        $this->assertNotSame($oldKey, $newKey, 'this edit should have moved the key');
        $this->assertDatabaseHas('settings', ['key' => $newKey, 'value' => 'Words the client wrote']);
        $this->assertDatabaseMissing('settings', ['key' => $oldKey]);
    }

    public function test_without_migrate_the_saved_content_is_left_behind(): void
    {
        $path = $this->dir.'/page.html';
        file_put_contents($path, '<div id="hero"><h1>Welcome</h1></div>');
        $this->artisan('live-edit:scan', ['path' => $path, '--apply' => true, '--auto' => true])->assertOk();
        preg_match('/<h1 data-edit="setting:(auto:[a-f0-9]+)"/', (string) file_get_contents($this->dir.'/page.tagged.html'), $m);

        Setting::create(['key' => $m[1], 'value' => 'Words the client wrote']);

        file_put_contents($path, '<div class="promo">Offer</div><div id="hero-band"><h1>Welcome</h1></div>');
        $this->artisan('live-edit:scan', ['path' => $path, '--apply' => true, '--auto' => true])->assertOk();

        // The honest default: nothing moves unless migration is asked for.
        $this->assertDatabaseHas('settings', ['key' => $m[1]]);
    }

    public function test_it_requires_a_path_or_url(): void
    {
        $this->artisan('live-edit:scan')->assertFailed();
    }

    public function test_it_merges_computed_backgrounds_and_dedupes_inline_ones(): void
    {
        $command = new ScanForEditables;
        $method = new \ReflectionMethod($command, 'mergeComputedBackgrounds');
        $method->setAccessible(true);

        // The scanner already found one inline background (from the DOM text);
        // the renderer reports it again plus two the text scan couldn't see.
        $result = [
            'candidates' => [
                ['kind' => 'text', 'tag' => 'h1', 'key' => 'title', 'sample' => 'Hi'],
                ['kind' => 'background', 'tag' => 'div', 'key' => 'bgDiv', 'sample' => 'https://x.test/inline.jpg'],
            ],
            'summary' => ['text' => 1, 'background' => 1],
        ];
        $backgrounds = [
            ['tag' => 'div', 'url' => 'https://x.test/inline.jpg', 'selector' => 'div.hero'],   // dup — skip
            ['tag' => 'section', 'url' => 'https://x.test/cta.jpg', 'selector' => 'section.cta'],
            ['tag' => 'header', 'url' => 'https://x.test/hero.jpg', 'selector' => 'header'],
        ];

        $merged = $method->invoke($command, $result, $backgrounds);

        $urls = array_column(array_filter($merged['candidates'], fn ($c) => $c['kind'] === 'background'), 'sample');
        sort($urls);
        $this->assertSame(['https://x.test/cta.jpg', 'https://x.test/hero.jpg', 'https://x.test/inline.jpg'], $urls);
        $this->assertSame(3, $merged['summary']['background']);
    }
}
