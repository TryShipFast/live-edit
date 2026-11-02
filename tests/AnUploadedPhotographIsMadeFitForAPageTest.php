<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Support\ImageFitter;

/**
 * Owner, 2 Nov 2026: "the images are 5MB each and there's no backend image resize happening". Only a picture replacing
 * one on the page was fitted; a logo, a background, a share image or a product's photo was stored as the camera made it.
 * Every stored picture is now upright, at most 2400px on its longest side, and saved at web quality.
 */
class AnUploadedPhotographIsMadeFitForAPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! extension_loaded('gd')) {
            $this->markTestSkipped('needs GD');
        }
    }

    /** A camera-sized photograph: noise, so it weighs what a real one does. */
    private function photograph(int $width, int $height, int $orientation = 1): string
    {
        $image = imagecreatetruecolor($width, $height);
        for ($i = 0; $i < 60000; $i++) {
            imagesetpixel($image, random_int(0, $width - 1), random_int(0, $height - 1), random_int(0, 0xFFFFFF));
        }
        // Wider at the top than the bottom would show, so which way up it is can be told: a red top band.
        imagefilledrectangle($image, 0, 0, $width - 1, (int) ($height / 10), 0xFF0000);
        ob_start();
        imagejpeg($image, null, 95);
        $jpeg = (string) ob_get_clean();
        imagedestroy($image);

        if ($orientation !== 1) {
            // An EXIF block saying which way up the camera held it, as a phone writes one (TIFF big-endian, one tag).
            $tiff = "MM\x00\x2A\x00\x00\x00\x08"."\x00\x01"."\x01\x12\x00\x03\x00\x00\x00\x01".pack('n', $orientation)."\x00\x00"."\x00\x00\x00\x00";
            $app1 = "Exif\x00\x00".$tiff;
            $jpeg = substr($jpeg, 0, 2)."\xFF\xE1".pack('n', strlen($app1) + 2).$app1.substr($jpeg, 2);
        }

        $path = tempnam(sys_get_temp_dir(), 'photo').'.jpg';
        file_put_contents($path, $jpeg);

        return $path;
    }

    public function test_a_camera_photograph_comes_down_to_what_a_page_shows(): void
    {
        $path = $this->photograph(4000, 3000);
        $before = filesize($path);

        $this->assertTrue(ImageFitter::shrink($path));
        clearstatcache();

        $this->assertSame([2400, 1800], array_slice((array) getimagesize($path), 0, 2));
        $this->assertLessThan($before / 2, filesize($path));
        unlink($path);
    }

    public function test_a_small_light_picture_is_left_as_it_is(): void
    {
        $image = imagecreatetruecolor(300, 200);
        $path = tempnam(sys_get_temp_dir(), 'small').'.png';
        imagepng($image, $path);
        $before = md5_file($path);

        $this->assertFalse(ImageFitter::shrink($path));
        $this->assertSame($before, md5_file($path));
        unlink($path);
    }

    public function test_a_phone_photograph_held_sideways_comes_out_upright(): void
    {
        if (! function_exists('exif_read_data')) {
            $this->markTestSkipped('needs exif');
        }
        // Stored 3000 wide by 2000 tall, red band along the top; the camera says turn it 90 degrees clockwise.
        $path = $this->photograph(3000, 2000, 6);

        ImageFitter::shrink($path);
        clearstatcache();

        [$width, $height] = (array) getimagesize($path);
        // Upright, and scaled to 2400 on its longest side.
        $this->assertSame([1600, 2400], [$width, $height]);
        // Turned clockwise, the red top band is now down the right-hand side.
        $image = imagecreatefromjpeg($path);
        $red = function (int $x) use ($image, $height): int {
            $n = 0;
            for ($y = 100; $y < $height - 100; $y += 100) {
                $c = imagecolorat($image, $x, $y);
                $n += (($c >> 16) & 0xFF) > 200 && (($c >> 8) & 0xFF) < 80 ? 1 : 0;
            }

            return $n;
        };
        $this->assertGreaterThan(20, $red($width - 10), 'the red band is down the right');
        $this->assertLessThan(5, $red(10), 'and not down the left');
        unlink($path);
    }

    public function test_every_upload_is_made_fit_whether_or_not_a_box_was_measured(): void
    {
        Storage::fake('public');
        config(['live-edit.disk' => 'public']);
        $path = $this->photograph(4000, 3000);
        $file = new UploadedFile($path, 'logo.jpg', 'image/jpeg', null, true);

        $stored = (new ImageStore)->store($file);

        $this->assertSame([2400, 1800], array_slice((array) getimagesizefromstring(Storage::disk('public')->get($stored)), 0, 2));
    }

    public function test_a_logo_is_made_the_weight_of_a_logo(): void
    {
        if (! function_exists('imagewebp')) {
            $this->markTestSkipped('needs WebP in GD');
        }
        // Senior Jay's logo as uploaded: 1268x752, 706KB, shown at 220x80 (Lighthouse, 2 Nov 2026).
        $path = tempnam(sys_get_temp_dir(), 'logo').'.png';
        copy(__DIR__.'/Fixtures/a-heavy-logo.png', $path);

        $kept = ImageFitter::forLogo($path);
        clearstatcache();

        $this->assertStringEndsWith('.webp', $kept);
        $this->assertSame([600, 356], array_slice((array) getimagesize($kept), 0, 2));
        $this->assertLessThan(60 * 1024, filesize($kept));
        @unlink($kept);
        @unlink($path);
    }
}
