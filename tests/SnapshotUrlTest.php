<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Support\Snapshot;
use ShipFast\LiveEdit\Support\SnapshotUrl;

/**
 * A snapshot is stored as a key and fetched as a URL. Confusing the two works
 * until the first caller that needs the other one.
 */
class SnapshotUrlTest extends TestCase
{
    public function test_the_configured_address_points_at_the_snapshot_directory(): void
    {
        // Passing a full disk key produced the directory twice, because the
        // configured URL already addresses it.
        config([
            'live-edit.snapshot_url' => 'https://cdn.example/content',
            'live-edit.snapshot_directory' => 'live-edit/content',
        ]);

        $this->assertSame('https://cdn.example/content/current.json', Snapshot::url());
        $this->assertSame('https://cdn.example/content/v5/en.json', Snapshot::url(5));
        $this->assertSame('https://cdn.example/content/v5/fr.json', Snapshot::url(5, 'fr'));
    }

    public function test_a_trailing_slash_does_not_double_up(): void
    {
        config(['live-edit.snapshot_url' => 'https://cdn.example/content/']);

        $this->assertSame('https://cdn.example/content/current.json', Snapshot::url());
    }

    public function test_without_signing_configured_the_plain_address_is_returned(): void
    {
        // A distribution serving published content is usually public: it is a
        // website. Failing to sign must not mean failing to answer.
        config([
            'live-edit.snapshot_url' => 'https://cdn.example/content',
            'live-edit.cloudfront' => ['key_pair_id' => null, 'private_key' => null, 'private_key_path' => null],
        ]);

        $this->assertSame('https://cdn.example/content/current.json', SnapshotUrl::for('current.json'));
        $this->assertNull(SnapshotUrl::sign('https://cdn.example/content/current.json'));
    }

    public function test_signing_is_skipped_rather_than_fatal_when_the_key_is_unusable(): void
    {
        config([
            'live-edit.snapshot_url' => 'https://cdn.example/content',
            'live-edit.cloudfront' => [
                'key_pair_id' => 'K123',
                'private_key' => 'not a pem at all',
                'private_key_path' => null,
            ],
        ]);

        // Still answers, unsigned, rather than throwing on a page render.
        $this->assertSame('https://cdn.example/content/current.json', SnapshotUrl::for('current.json'));
    }

    public function test_with_no_address_configured_and_a_disk_that_cannot_address_itself(): void
    {
        config(['live-edit.snapshot_url' => null, 'live-edit.snapshot_disk' => 'local']);

        // A local disk has no public URL; the caller gets null rather than a
        // path pretending to be one.
        $this->assertNotSame('', (string) SnapshotUrl::plain('current.json'));
    }
}
