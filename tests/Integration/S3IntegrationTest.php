<?php

namespace ShipFast\LiveEdit\Tests\Integration;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Group;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
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
