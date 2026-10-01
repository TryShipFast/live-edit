<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Support\ImageFitter;

/**
 * A replacement is fitted to the picture it replaced, not to the box.
 *
 * The thing this product is actually for: a client drops in their own
 * photograph and the design holds, as though the picture had been made for the
 * spot. Get the target wrong and the client's own photograph comes out softer
 * than the stock one it replaced, on their own website, which is the one place
 * nobody will forgive it.
 *
 * The box was what the editor measured, and a box is not a picture. A theme
 * ships a hero at 2400 wide and lays it out at 1200: fitting to 1200 stores
 * half the file the design was built on.
 *
 * Which is also why the two cannot be measured the same way. A box is in CSS
 * pixels and wants doubling for a retina screen; an image's own width is
 * already device pixels and does not. Doubling it stores a file twice the size
 * of the one it replaced, which is the same fault pointing the other way.
 */
class AReplacementMatchesWhatItReplacedTest extends TestCase
{
    private function imageOf(int $width, int $height): string
    {
        $path = tempnam(sys_get_temp_dir(), 'fit').'.jpg';
        $image = imagecreatetruecolor($width, $height);
        imagejpeg($image, $path, 90);
        imagedestroy($image);

        return $path;
    }

    protected function setUp(): void
    {
        parent::setUp();

        if (! extension_loaded('gd')) {
            $this->markTestSkipped('fitting needs GD');
        }
    }

    public function test_a_box_is_doubled_because_it_is_measured_in_css_pixels(): void
    {
        $path = $this->imageOf(3000, 2000);

        ImageFitter::fit($path, 600, 400);

        // 600 CSS pixels is 1200 device pixels on every screen that matters.
        $this->assertSame([1200, 800], array_slice((array) getimagesize($path), 0, 2));

        unlink($path);
    }

    public function test_the_picture_it_replaced_is_taken_at_its_word(): void
    {
        /*
         * The fix. naturalWidth is already device pixels, so doubling it would
         * store 2400 where the design had 1200 - a file twice the weight of
         * the one it replaced, for no visible gain, on every page view.
         */
        $path = $this->imageOf(3000, 2000);

        ImageFitter::fit($path, 1200, 800, true);

        $this->assertSame([1200, 800], array_slice((array) getimagesize($path), 0, 2));

        unlink($path);
    }

    public function test_a_smaller_original_is_never_blown_up(): void
    {
        // Upscaling turns a small photograph into a large blurry one, which is
        // worse than a small sharp one in a big box.
        $path = $this->imageOf(400, 300);

        ImageFitter::fit($path, 800, 600);

        $this->assertSame([800, 600], array_slice((array) getimagesize($path), 0, 2));

        unlink($path);
    }

    public function test_the_shape_of_the_spot_is_what_decides_the_crop(): void
    {
        // A wide photograph into a square spot is cropped to the square rather
        // than squashed into it, because a squashed face is noticed and a
        // cropped background is not.
        $path = $this->imageOf(3000, 1000);

        ImageFitter::fit($path, 800, 800, true);

        $this->assertSame([800, 800], array_slice((array) getimagesize($path), 0, 2));

        unlink($path);
    }
}
