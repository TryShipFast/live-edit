<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Application\Api\FindPhotos;
use ShipFast\LiveEdit\Application\Api\ImagineAPicture;
use ShipFast\LiveEdit\Domain\Credits\Credits;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Finding a picture, and making one.
 *
 * The commonest thing a client cannot do is produce a good photograph. They
 * have the words; they do not have a photographer. So the picker's job is to
 * make the free, real, properly credited option the easy one, and the
 * generated option the last one.
 */
class PicturesTest extends TestCase
{
    protected Site $site;

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create(['slug' => 'client', 'name' => 'Client', 'allowed_origins' => []]);
    }

    protected function withUnsplash(): void
    {
        config()->set('live-edit.photos', [
            'enabled' => true,
            'provider' => 'unsplash',
            'unsplash' => ['endpoint' => 'https://api.unsplash.test', 'access_key' => 'test-key-not-real'],
            'openverse' => ['endpoint' => 'https://api.openverse.test'],
            'endpoint' => 'https://api.unsplash.test',
            'access_key' => 'test-key-not-real',
            'timeout' => 5,
        ]);
    }

    protected function withImageModel(): void
    {
        config()->set('live-edit.ai', [
            'enabled' => true,
            'endpoint' => 'https://api.openai.test/v1/chat/completions',
            'model' => 'test-model',
            'api_key' => 'test-key-not-real',
            'timeout' => 5,
            'image_endpoint' => 'https://api.openai.test/v1/images/generations',
            'image_model' => 'test-image-model',
            'image_timeout' => 10,
        ]);
    }

    protected function unsplashResult(): array
    {
        return ['results' => [[
            'id' => 'abc123',
            'alt_description' => 'a waiting room with morning light',
            'urls' => ['small' => 'https://images.unsplash.test/small.jpg', 'regular' => 'https://images.unsplash.test/regular.jpg'],
            'user' => ['name' => 'Naksha Banwao', 'links' => ['html' => 'https://unsplash.test/@naksha']],
            'links' => ['download_location' => 'https://api.unsplash.test/photos/abc123/download'],
        ]]];
    }

    public function test_a_photo_comes_back_with_the_name_of_whoever_took_it(): void
    {
        // Not decoration. These are real photographs by real people who let us
        // use them on that condition.
        $this->withUnsplash();
        Http::fake(['*' => Http::response($this->unsplashResult(), 200)]);

        $found = app(FindPhotos::class)->search('clinic waiting room');

        $this->assertCount(1, $found['photos']);
        $this->assertSame('Naksha Banwao', $found['photos'][0]['by']);
        // With the referral parameters Unsplash asks for on attribution
        // links: it is how a photographer sees that somebody used their work,
        // which is most of what they get out of this.
        $this->assertStringStartsWith('https://unsplash.test/@naksha?', $found['photos'][0]['byUrl']);
        $this->assertStringContainsString('utm_medium=referral', $found['photos'][0]['byUrl']);
    }

    public function test_it_asks_for_landscape_pictures(): void
    {
        // A hero is wide and a card is square; both look wrong filled with a
        // portrait, and most stock searches return mostly portraits.
        $this->withUnsplash();
        Http::fake(['*' => Http::response($this->unsplashResult(), 200)]);

        app(FindPhotos::class)->search('clinic');

        Http::assertSent(fn ($request) => $request['orientation'] === 'landscape');
    }

    public function test_the_key_never_leaves_the_server(): void
    {
        // It is sent to Unsplash and to nobody else. Printed into a page it
        // would be taken and spent, and Unsplash would stop the account it
        // belongs to, which is ours.
        $this->withUnsplash();
        Http::fake(['*' => Http::response($this->unsplashResult(), 200)]);

        $found = app(FindPhotos::class)->search('clinic');

        $this->assertStringNotContainsString('test-key-not-real', json_encode($found));
        Http::assertSent(fn ($request) => str_contains($request->header('Authorization')[0] ?? '', 'test-key-not-real'));
    }

    public function test_using_a_photo_is_reported_so_its_photographer_is_credited(): void
    {
        $this->withUnsplash();
        Http::fake(['*' => Http::response([], 200)]);

        app(FindPhotos::class)->reportUse('https://api.unsplash.test/photos/abc123/download');

        Http::assertSent(fn ($request) => str_contains((string) $request->url(), '/photos/abc123/download'));
    }

    public function test_it_will_not_be_talked_into_fetching_any_address_at_all(): void
    {
        // Otherwise this endpoint is a way to have our server make a request
        // to anywhere a caller names, from inside our network.
        $this->withUnsplash();
        Http::fake();

        app(FindPhotos::class)->reportUse('https://someone-elses-host.test/internal/admin');

        Http::assertNothingSent();
    }

    public function test_a_refused_key_is_not_reported_as_a_bad_connection(): void
    {
        // Different problems, different answers. "Try again in a moment"
        // about a key that will never work sends somebody back to press the
        // same button for the rest of the afternoon.
        $this->withUnsplash();
        Http::fake(['*' => Http::response(['errors' => ['OAuth error: The access token is invalid']], 401)]);

        $this->assertSame('not_allowed', app(FindPhotos::class)->search('clinic')['reason']);
    }

    public function test_a_search_with_no_provider_says_so_rather_than_returning_nothing(): void
    {
        // Empty results and "not switched on" look identical to a client and
        // mean completely different things.
        config()->set('live-edit.photos', ['enabled' => false]);

        $this->assertSame('not_configured', app(FindPhotos::class)->search('clinic')['reason']);
    }

    public function test_making_a_picture_costs_five_credits_and_returns_a_choice(): void
    {
        $this->withImageModel();
        Http::fake(['*' => Http::response(['data' => [
            ['url' => 'https://img.test/1.png'], ['url' => 'https://img.test/2.png'],
            ['url' => 'https://img.test/3.png'], ['url' => 'https://img.test/4.png'],
        ]], 200)]);

        app(Credits::class)->grant($this->site, 10);

        $made = app(ImagineAPicture::class)($this->site, 'a clinic waiting room in Lagos');

        $this->assertCount(4, $made['images'], 'one picture is a verdict; four is a choice');
        $this->assertSame(5, $made['balance']);
    }

    public function test_a_picture_that_arrives_as_bytes_is_stored_and_answered_as_an_address(): void
    {
        /*
         * The model this is pointed at, gpt-image-1, returns base64 and never
         * a url. What came back was a two megabyte data: URI per picture, and
         * it looked like it worked: the picker showed it and clicking it
         * repainted the page. Save then refused it, because a data: URI is
         * not an http address and two megabytes is not a two thousand
         * character field. Five credits for a picture nobody could keep.
         *
         * Measured against the real provider, not reasoned about. Every test
         * here passed throughout, because every one of them stubbed a
         * response carrying a url.
         */
        $this->withImageModel();
        $disk = config('live-edit.disk', 'public');
        Storage::fake($disk);

        $png = base64_encode(
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', true)
        );

        Http::fake(['*' => Http::response(['data' => [['b64_json' => $png]]], 200)]);

        app(Credits::class)->grant($this->site, 10);

        $made = app(ImagineAPicture::class)($this->site, 'a film camera on a desk', 1);

        $this->assertCount(1, $made['images']);
        $this->assertStringStartsNotWith('data:', $made['images'][0], 'a data: URI cannot be saved by any of the endpoints that receive it');
        $this->assertNotEmpty(Storage::disk($disk)->allFiles(), 'the picture the client paid for was not kept anywhere');
    }

    public function test_bytes_that_cannot_be_decoded_are_refunded_rather_than_offered(): void
    {
        // Answering with a broken address would charge five credits for a
        // picture the page cannot load, which is worse than admitting it.
        $this->withImageModel();
        Storage::fake(config('live-edit.disk', 'public'));
        Http::fake(['*' => Http::response(['data' => [['b64_json' => 'not base64 at all !!!']]], 200)]);

        app(Credits::class)->grant($this->site, 10);

        $made = app(ImagineAPicture::class)($this->site, 'a film camera on a desk', 1);

        $this->assertSame([], $made['images']);
        $this->assertSame('no_suggestion', $made['reason']);
        $this->assertSame(10, $made['balance'], 'nothing usable arrived, so nothing should have been charged');
    }

    public function test_a_provider_that_does_send_an_address_is_left_alone(): void
    {
        $this->withImageModel();
        $disk = config('live-edit.disk', 'public');
        Storage::fake($disk);
        Http::fake(['*' => Http::response(['data' => [['url' => 'https://img.test/1.png']]], 200)]);

        app(Credits::class)->grant($this->site, 10);

        $made = app(ImagineAPicture::class)($this->site, 'a film camera on a desk', 1);

        $this->assertSame(['https://img.test/1.png'], $made['images']);
        $this->assertSame([], Storage::disk($disk)->allFiles(), 'nothing to store when the provider is already serving it');
    }

    public function test_it_asks_for_a_photograph_with_no_lettering_in_it(): void
    {
        // A hero with invented words baked into the pixels cannot be edited,
        // translated or corrected, and is the most obvious way a page looks
        // generated.
        $this->withImageModel();
        Http::fake(['*' => Http::response(['data' => [['url' => 'https://img.test/1.png']]], 200)]);
        app(Credits::class)->grant($this->site, 10);

        app(ImagineAPicture::class)($this->site, 'a clinic waiting room');

        Http::assertSent(fn ($request) => str_contains($request['prompt'], 'No text')
            && str_contains($request['prompt'], 'Photographic'));
    }

    public function test_a_picture_that_never_arrived_is_not_charged_for(): void
    {
        $this->withImageModel();
        Http::fake(['*' => Http::response(['data' => []], 200)]);
        app(Credits::class)->grant($this->site, 10);

        $made = app(ImagineAPicture::class)($this->site, 'a clinic waiting room');

        $this->assertSame('no_suggestion', $made['reason']);
        $this->assertSame(10, app(Credits::class)->balance($this->site), 'a generation that produced nothing was charged for');
    }

    public function test_an_unaffordable_picture_never_reaches_the_model(): void
    {
        // Five credits is the most expensive thing here, so this is the one
        // worth being sure about.
        $this->withImageModel();
        Http::fake();
        app(Credits::class)->grant($this->site, 4);

        $made = app(ImagineAPicture::class)($this->site, 'a clinic waiting room');

        $this->assertSame('not_enough_credits', $made['reason']);
        Http::assertNothingSent();
    }

    protected function withNoKeyAtAll(): void
    {
        config()->set('live-edit.photos', [
            'enabled' => true,
            'provider' => 'auto',
            'unsplash' => ['endpoint' => 'https://api.unsplash.test', 'access_key' => null],
            'openverse' => ['endpoint' => 'https://api.openverse.test'],
            'timeout' => 5,
        ]);
    }

    protected function openverseResult(): array
    {
        return ['results' => [[
            'id' => 'ov-1',
            'title' => 'a waiting room with morning light',
            'url' => 'https://live.static.test/big.jpg',
            'thumbnail' => 'https://live.static.test/thumb.jpg',
            'creator' => 'chocolatedazzles',
            'creator_url' => 'https://flickr.test/chocolatedazzles',
            'license' => 'by',
            'license_version' => '2.0',
        ]]];
    }

    public function test_a_site_with_no_key_still_gets_photographs(): void
    {
        // Asking somebody to register an application with a photo library
        // before they may put a picture on their own website is a way of them
        // not having a picture. Most will simply leave the grey rectangle.
        $this->withNoKeyAtAll();
        Http::fake(['*' => Http::response($this->openverseResult(), 200)]);

        $found = app(FindPhotos::class)->search('clinic waiting room');

        $this->assertSame('openverse', $found['source']);
        $this->assertCount(1, $found['photos']);
        $this->assertTrue(app(FindPhotos::class)->available(), 'photographs were reported unavailable with no key');
    }

    public function test_a_commons_photo_carries_its_licence_as_well_as_its_photographer(): void
    {
        // Under Creative Commons the licence IS part of the credit, and it is
        // the part that tells the next person what they may do with it.
        $this->withNoKeyAtAll();
        Http::fake(['*' => Http::response($this->openverseResult(), 200)]);

        $credit = app(FindPhotos::class)->search('clinic')['photos'][0]['credit'];

        $this->assertStringContainsString('chocolatedazzles', $credit);
        $this->assertStringContainsString('CC BY 2.0', $credit);
    }

    public function test_it_only_asks_for_pictures_a_business_may_actually_use(): void
    {
        // A picture somebody cannot legally put on their website is worse
        // than no picture, because they will not find out from us.
        $this->withNoKeyAtAll();
        Http::fake(['*' => Http::response($this->openverseResult(), 200)]);

        app(FindPhotos::class)->search('clinic');

        Http::assertSent(fn ($request) => str_contains((string) $request['license_type'], 'commercial'));
    }

    public function test_a_key_that_stops_working_is_not_the_clients_problem(): void
    {
        // They cannot fix it and they did not cause it, and the other library
        // is right there and needs nothing.
        config()->set('live-edit.photos', [
            'enabled' => true,
            'provider' => 'auto',
            'unsplash' => ['endpoint' => 'https://api.unsplash.test', 'access_key' => 'revoked'],
            'openverse' => ['endpoint' => 'https://api.openverse.test'],
            'timeout' => 5,
        ]);

        Http::fake([
            'api.unsplash.test/*' => Http::response(['errors' => ['OAuth error']], 401),
            'api.openverse.test/*' => Http::response($this->openverseResult(), 200),
        ]);

        $found = app(FindPhotos::class)->search('clinic');

        $this->assertSame('openverse', $found['source'], 'a refused key emptied the dialog instead of falling back');
        $this->assertCount(1, $found['photos']);
    }

    public function test_a_key_is_preferred_when_there_is_one(): void
    {
        // Unsplash has the better photographs; Openverse is the floor, not
        // the choice.
        $this->withUnsplash();
        config()->set('live-edit.photos.provider', 'auto');
        Http::fake(['*' => Http::response($this->unsplashResult(), 200)]);

        $this->assertSame('unsplash', app(FindPhotos::class)->search('clinic')['source']);
    }
}
