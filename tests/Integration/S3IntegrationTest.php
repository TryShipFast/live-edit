<?php

namespace ShipFast\LiveEdit\Tests\Integration;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Group;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Support\Snapshot;
use ShipFast\LiveEdit\Tests\Fixtures\Setting;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * The parts that only a real bucket can answer.
 *
 * Every other test here uses Storage::fake, which is a local directory wearing
 * an S3 name. That is right for logic and useless for everything that makes S3
 * different: whether object metadata survives a PUT, whether a key with a
 * prefix round-trips, whether the URL a page is given actually resolves,
 * whether credentials and region are what the config claims.
 *
 * Skipped unless a bucket is named, so an ordinary run is unaffected:
 *
 *   KB_S3_BUCKET=your-bucket KB_S3_REGION=eu-west-1 vendor/bin/phpunit --group aws
 *
 * Credentials come from the usual AWS chain — environment, shared file, or
 * instance role — so nothing secret is written into this repository or passed
 * on a command line where it would land in shell history.
 */
#[Group('aws')]
class S3IntegrationTest extends TestCase
{
    private array $written = [];

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $bucket = env('KB_S3_BUCKET');

        if ($bucket === null) {
            return;
        }

        $app['config']->set('filesystems.disks.kb_s3', [
            'driver' => 's3',
            // Left empty on purpose: the SDK then uses the standard credential
            // chain rather than having secrets pass through config.
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('KB_S3_REGION', env('AWS_DEFAULT_REGION', 'us-east-1')),
            'bucket' => $bucket,
            'url' => env('KB_S3_URL'),
            'throw' => true,
        ]);

        $prefix = 'kastsbuild-integration/'.substr(sha1((string) getmypid()), 0, 8);

        $app['config']->set('live-edit.disk', 'kb_s3');
        $app['config']->set('live-edit.directory', $prefix.'/media');
        $app['config']->set('live-edit.snapshot_disk', 'kb_s3');
        $app['config']->set('live-edit.snapshot_directory', $prefix.'/content');
        $app['config']->set('live-edit.media_url', env('LIVE_EDIT_MEDIA_URL', ''));
    }

    protected function setUp(): void
    {
        parent::setUp();

        if (env('KB_S3_BUCKET') === null) {
            $this->markTestSkipped('Set KB_S3_BUCKET to run this against a real bucket.');
        }
    }

    protected function tearDown(): void
    {
        // Leaving objects behind in somebody's bucket is not acceptable, even
        // small ones, and especially not under a name that looks like ours.
        foreach ($this->written as $path) {
            rescue(fn () => Storage::disk('kb_s3')->delete($path), null, false);
        }

        $directory = dirname((string) config('live-edit.directory'));
        rescue(fn () => Storage::disk('kb_s3')->deleteDirectory($directory), null, false);

        parent::tearDown();
    }

    public function test_an_image_reaches_the_bucket_with_the_headers_a_cdn_needs(): void
    {
        $path = (new ImageStore)->store(UploadedFile::fake()->image('hero.jpg', 1200, 800), 400, 400);
        $this->written[] = $path;

        $disk = Storage::disk('kb_s3');

        $this->assertTrue($disk->exists($path), 'the object is not in the bucket');

        // The whole point of the bucket: served by a CDN without passing
        // through the application again, so what was not said at upload time
        // cannot be said later. Asked of S3 itself, because a filesystem
        // abstraction has no opinion about cache headers.
        $head = $disk->getClient()->headObject([
            'Bucket' => config('filesystems.disks.kb_s3.bucket'),
            'Key' => $path,
        ]);

        $this->assertSame('public, max-age=31536000, immutable', $head['CacheControl'] ?? null,
            'a CDN would re-fetch this picture for every visitor');
        $this->assertStringStartsWith('image/', (string) ($head['ContentType'] ?? ''));

        $this->assertSame([400, 400], array_slice(getimagesizefromstring($disk->get($path)), 0, 2),
            'the image reached the bucket unfitted');
    }

    public function test_an_svg_is_stored_as_an_svg(): void
    {
        $path = (new ImageStore)->store(
            UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/><script>alert(1)</script></svg>')
        );
        $this->written[] = $path;

        $stored = Storage::disk('kb_s3')->get($path);

        $this->assertStringNotContainsString('<script', $stored);
        $this->assertStringContainsString('viewBox', $stored, 'case-sensitive attributes must survive the round trip');
        $this->assertSame('image/svg+xml', Storage::disk('kb_s3')->mimeType($path));
    }

    public function test_a_published_snapshot_round_trips_through_the_bucket(): void
    {
        Setting::query()->create(['key' => 'heroTitle', 'value' => 'Published to S3']);

        $version = Snapshot::publish();

        $pointer = config('live-edit.snapshot_directory').'/current.json';
        $file = config('live-edit.snapshot_directory')."/v{$version->number}/en.json";
        $this->written[] = $pointer;
        $this->written[] = $file;

        $disk = Storage::disk('kb_s3');

        $this->assertTrue($disk->exists($pointer), 'no pointer was written');
        $this->assertTrue($disk->exists($file), 'no version file was written');

        $this->assertSame($version->number, json_decode($disk->get($pointer), true)['version']);
        $this->assertSame('Published to S3', json_decode($disk->get($file), true)['settings']['heroTitle']);
    }

    public function test_two_sites_publish_into_their_own_directories_on_a_real_bucket(): void
    {
        // The whole promise: a customer's distribution points at their own
        // directory and can reach nothing else. Worth proving against a real
        // bucket, where a prefixed key is a key and not a path.
        $acme = Site::query()->create(['slug' => 'acme-'.substr(sha1((string) getmypid()), 0, 6), 'name' => 'Acme', 'allowed_origins' => []]);
        $rival = Site::query()->create(['slug' => 'rival-'.substr(sha1((string) getmypid()), 0, 6), 'name' => 'Rival', 'allowed_origins' => []]);

        SiteSetting::query()->create(['site_id' => $acme->id, 'key' => 'heroTitle', 'value' => 'Acme words']);
        SiteSetting::query()->create(['site_id' => $rival->id, 'key' => 'heroTitle', 'value' => 'Rival words']);

        $acmeStore = new SiteStore($acme);
        $rivalStore = new SiteStore($rival);

        $acmeStore->publish();
        $rivalStore->publish();

        $disk = Storage::disk('kb_s3');

        foreach ([$acmeStore, $rivalStore] as $store) {
            $this->written[] = $store->snapshotDirectory().'/current.json';
            $this->written[] = $store->snapshotDirectory().'/v1/en.json';
        }

        $this->assertTrue($disk->exists($acmeStore->snapshotDirectory().'/v1/en.json'));
        $this->assertStringContainsString('Acme words', $disk->get($acmeStore->snapshotDirectory().'/v1/en.json'));
        $this->assertStringNotContainsString('Acme words', $disk->get($rivalStore->snapshotDirectory().'/v1/en.json'));

        // And the pointer a consumer actually fetches first.
        $pointer = json_decode($disk->get($acmeStore->snapshotDirectory().'/current.json'), true);
        $this->assertSame(1, $pointer['version']);
    }

    public function test_published_files_tell_a_cdn_how_long_to_keep_them(): void
    {
        // Asked of S3 itself. A filesystem abstraction has no opinion about
        // cache headers, and these cannot be added after the fact: the file is
        // served from an edge and never passes through here again.
        $site = Site::query()->create(['slug' => 'cache-'.substr(sha1((string) getmypid()), 0, 6), 'name' => 'C', 'allowed_origins' => []]);
        SiteSetting::query()->create(['site_id' => $site->id, 'key' => 'heroTitle', 'value' => 'Words']);

        $store = new SiteStore($site);
        $store->publish();

        $this->written[] = $store->snapshotDirectory().'/current.json';
        $this->written[] = $store->snapshotDirectory().'/v1/en.json';

        $client = Storage::disk('kb_s3')->getClient();
        $bucket = config('filesystems.disks.kb_s3.bucket');

        $version = $client->headObject(['Bucket' => $bucket, 'Key' => $store->snapshotDirectory().'/v1/en.json']);
        $pointer = $client->headObject(['Bucket' => $bucket, 'Key' => $store->snapshotDirectory().'/current.json']);

        $this->assertSame('public, max-age=31536000, immutable', $version['CacheControl'] ?? null,
            'a version never changes and should be cached forever');
        $this->assertStringContainsString('max-age=30', (string) ($pointer['CacheControl'] ?? ''),
            'the pointer is the one thing that moves');
        $this->assertSame('application/json', $version['ContentType'] ?? null);
    }

    public function test_the_stored_value_is_a_key_and_the_url_is_separate(): void
    {
        // The boundary that goes wrong quietly: a URL stored where a key
        // belongs works until the first caller that needs a key.
        $store = new ImageStore;
        $path = $store->store(UploadedFile::fake()->image('boundary.jpg'));
        $this->written[] = $path;

        $this->assertStringNotContainsString('https://', $path);
        $this->assertStringContainsString('://', $store->url($path));
        $this->assertTrue(Storage::disk('kb_s3')->exists($path));
    }
}
