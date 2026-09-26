<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Support\Facades\Http;
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
        $this->assertSame('https://unsplash.test/@naksha', $found['photos'][0]['byUrl']);
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
}
