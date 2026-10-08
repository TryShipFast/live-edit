<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Support\RemoteContent;

/**
 * What another framework does: ask an address for the current version, then for
 * its locale. Nothing about the editor exists on that side.
 */
class RemoteContentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['live-edit.snapshot_url' => 'https://cdn.test/content']);

        /*
         * This is the suite that wants the real behaviour, so it says so.
         * Reading content off this machine is off by default while a host
         * application runs its tests - a wildcard Http::fake in somebody
         * else's suite would otherwise be taken for their client's published
         * words.
         */
        config(['live-edit.remote_content' => true]);
    }

    public function test_it_reads_the_pointer_then_the_version(): void
    {
        Http::fake([
            'cdn.test/content/current.json' => Http::response(['version' => 7, 'locales' => ['en']]),
            'cdn.test/content/v7/en.json' => Http::response(['settings' => ['auto:a1' => 'Published words.'], 'styles' => []]),
        ]);

        $this->assertSame(7, RemoteContent::version());
        $this->assertSame('Published words.', RemoteContent::settings('en')['auto:a1']);
    }

    public function test_a_version_is_fetched_once_and_then_remembered(): void
    {
        Http::fake([
            'cdn.test/content/current.json' => Http::response(['version' => 7]),
            'cdn.test/content/v7/en.json' => Http::response(['settings' => ['auto:a1' => 'Once.']]),
        ]);

        RemoteContent::settings('en');
        RemoteContent::settings('en');

        // A version file never changes, so asking twice is asking once.
        Http::assertSentCount(2);
    }

    public function test_a_locale_is_fetched_separately(): void
    {
        Http::fake([
            'cdn.test/content/current.json' => Http::response(['version' => 3]),
            'cdn.test/content/v3/en.json' => Http::response(['settings' => ['auto:a1' => 'Hello']]),
            'cdn.test/content/v3/fr.json' => Http::response(['settings' => ['auto:a1' => 'Bonjour']]),
        ]);

        $this->assertSame('Hello', RemoteContent::settings('en')['auto:a1']);
        $this->assertSame('Bonjour', RemoteContent::settings('fr')['auto:a1']);
    }

    public function test_an_unreachable_source_does_not_throw(): void
    {
        // A page should not fail because the content source is briefly away.
        Http::fake(fn () => throw new \RuntimeException('network is down'));

        $this->assertNull(RemoteContent::version());
        $this->assertSame([], RemoteContent::settings('en'));
    }

    public function test_a_source_that_answers_badly_is_treated_as_absent(): void
    {
        Http::fake(['cdn.test/content/current.json' => Http::response('nope', 500)]);

        $this->assertNull(RemoteContent::version());
    }
}
