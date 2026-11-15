<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Application\Api\LookUpAVideo;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * A video from YouTube or Vimeo (owner's brief, 15 Nov 2026): a link pasted in the add window or the video's panel is
 * read here, its title from the service's oEmbed and its cover stored as the site's own picture, so a published page
 * never loads a picture from YouTube or Vimeo before play is pressed. Anything that is not one of those videos is
 * refused with one sentence. No real network: every service is faked.
 */
class AVideoIsReadFromItsLinkTest extends TestCase
{
    private Site $site;

    private string $session;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        // The API is off unless asked for (LiveEditServiceProvider), as in every other API test.
        $generous = ['burst' => ['max' => 600, 'seconds' => 60], 'sustained' => ['max' => 6000, 'seconds' => 3600]];
        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'throttle' => array_fill_keys(['read', 'write', 'session', 'publish', 'upload', 'tag'], $generous),
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        config(['live-edit.disk' => 'public']);
        $this->site = Site::query()->create(['slug' => 'client', 'name' => 'Client', 'allowed_origins' => ['https://client.test']]);
        [, $this->session] = $this->site->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());
    }

    private function picture(int $width = 1280, int $height = 720): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefilledrectangle($image, 0, 0, $width, $height, imagecolorallocate($image, 200, 40, 40));
        ob_start();
        imagejpeg($image, null, 90);

        return (string) ob_get_clean();
    }

    private function look(string $link)
    {
        return $this->getJson('/'.config('live-edit.api.prefix', 'api/live-edit/v1').'/client/video?url='.urlencode($link), ['Authorization' => 'Bearer '.$this->session]);
    }

    public function test_the_links_people_paste_are_read_one_way_and_anything_else_is_refused(): void
    {
        foreach (['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=4s', 'https://youtu.be/dQw4w9WgXcQ', 'youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/shorts/dQw4w9WgXcQ'] as $link) {
            $this->assertSame('https://www.youtube.com/watch?v=dQw4w9WgXcQ', LookUpAVideo::videoOf($link)['link'] ?? null, $link);
        }
        $this->assertSame('https://vimeo.com/76979871', LookUpAVideo::videoOf('https://vimeo.com/channels/staffpicks/76979871')['link'] ?? null);
        $this->assertSame('https://vimeo.com/76979871/abcdef1234', LookUpAVideo::videoOf('https://player.vimeo.com/video/76979871?h=abcdef1234')['link'] ?? null);

        foreach (['', 'hello', 'https://example.com/watch?v=dQw4w9WgXcQ', 'javascript:alert(1)', 'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'https://vimeo.com/about'] as $link) {
            $this->assertNull(LookUpAVideo::videoOf($link), $link);
        }

        Http::fake();
        $this->look('https://www.dailymotion.com/video/x7')
            ->assertStatus(422)
            ->assertJsonPath('error.message', 'Paste a link to a YouTube or Vimeo video.');
        Http::assertNothingSent();
    }

    public function test_a_youtube_video_is_named_by_its_title_and_its_cover_is_stored_as_the_sites_own(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('needs GD');
        }

        Http::fake([
            'www.youtube.com/oembed*' => Http::response(['title' => 'Our  story,  in   two minutes', 'thumbnail_url' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg']),
            'i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' => Http::response($this->picture(), 200, ['Content-Type' => 'image/jpeg']),
            '*' => Http::response('', 404),
        ]);

        $video = $this->look('https://youtu.be/dQw4w9WgXcQ')->assertOk()->json('video');

        $this->assertSame('youtube', $video['provider']);
        $this->assertSame('https://www.youtube.com/watch?v=dQw4w9WgXcQ', $video['link']);
        $this->assertSame('Our story, in two minutes', $video['title']);
        // ours, not YouTube's
        $this->assertNotNull($video['cover']);
        $this->assertStringNotContainsString('ytimg', $video['cover']);
        $stored = Storage::disk('public')->allFiles();
        $this->assertCount(1, $stored);
        $this->assertSame([1280, 720], array_slice((array) getimagesizefromstring(Storage::disk('public')->get($stored[0])), 0, 2));
        Http::assertSent(fn ($request) => str_starts_with((string) $request->url(), 'https://www.youtube.com/oembed?'));
    }

    public function test_a_vimeo_cover_comes_from_its_oembed(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('needs GD');
        }

        Http::fake([
            'vimeo.com/api/oembed.json*' => Http::response(['title' => 'The Mountain', 'thumbnail_url' => 'https://i.vimeocdn.com/video/452001751-640.jpg']),
            'i.vimeocdn.com/*' => Http::response($this->picture(640, 360), 200, ['Content-Type' => 'image/jpeg']),
        ]);

        $video = $this->look('https://vimeo.com/76979871')->assertOk()->json('video');
        $this->assertSame('The Mountain', $video['title']);
        $this->assertNotNull($video['cover']);
    }

    public function test_a_service_not_answering_still_gives_a_video_named_by_its_provider(): void
    {
        Http::fake(['*' => Http::response('', 500)]);
        $video = $this->look('https://vimeo.com/123456')->assertOk()->json('video');
        $this->assertSame('Vimeo video', $video['title']);
        $this->assertNull($video['cover']);
    }

    public function test_a_picture_the_service_did_not_name_is_never_fetched(): void
    {
        Http::fake([
            'www.youtube.com/oembed*' => Http::response(['title' => 'A', 'thumbnail_url' => 'http://169.254.169.254/latest/meta-data.jpg']),
            '*' => Http::response('', 404),
        ]);

        $this->look('https://youtu.be/dQw4w9WgXcQ')->assertOk();
        Http::assertNotSent(fn ($request) => str_contains((string) $request->url(), '169.254'));
    }

    public function test_a_laravel_website_keeping_its_own_content_is_read_without_a_cover_to_store(): void
    {
        Http::fake(['www.youtube.com/oembed*' => Http::response(['title' => 'Hello'])]);

        $video = app(LookUpAVideo::class)(null, 'https://youtu.be/dQw4w9WgXcQ');
        $this->assertSame('Hello', $video['title']);
        $this->assertNull($video['cover']);
        Http::assertSentCount(1);
    }
}
