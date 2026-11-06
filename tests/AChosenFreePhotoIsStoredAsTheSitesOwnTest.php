<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Application\Api\FindPhotos;
use ShipFast\LiveEdit\Application\Api\StoreMedia;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * Owner, 2 Nov 2026: "the images are 5MB each". A free photo chosen in the editor was saved as the photo service's
 * address; from Openverse that is the original file. A photo a search offered is now fetched, made fit and stored as
 * the site's own; an address no search offered is never fetched.
 */
class AChosenFreePhotoIsStoredAsTheSitesOwnTest extends TestCase
{
    public function test_an_offered_photo_is_stored_made_fit_and_nothing_else_is_fetched(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('needs GD');
        }
        Storage::fake('public');
        config(['live-edit.disk' => 'public']);
        $site = Site::query()->create(['slug' => 'client', 'name' => 'Client', 'allowed_origins' => ['https://client.test']]);

        $image = imagecreatetruecolor(5000, 2500);
        for ($i = 0; $i < 80000; $i++) {
            imagesetpixel($image, random_int(0, 4999), random_int(0, 2499), random_int(0, 0xFFFFFF));
        }
        ob_start();
        imagejpeg($image, null, 95);
        $original = (string) ob_get_clean();
        Http::fake(['*' => Http::response($original, 200, ['Content-Type' => 'image/jpeg'])]);

        $this->assertNull(app(StoreMedia::class)->fromAddress($site, 'http://169.254.169.254/latest/meta-data.jpg'));
        Http::assertNothingSent();

        $offered = 'https://live.staticflickr.com/65535/123_abc_o.jpg';
        Cache::put('live-edit:photo-offered:'.sha1($offered), true, now()->addHour());
        $this->assertTrue(FindPhotos::offered($offered));

        $stored = app(StoreMedia::class)->fromAddress($site, $offered);

        $this->assertNotNull($stored);
        $this->assertSame([2400, 1200], array_slice((array) getimagesizefromstring(Storage::disk('public')->get($stored['path'])), 0, 2));
        $this->assertLessThan(strlen($original) / 3, Storage::disk('public')->size($stored['path']));
    }
}
