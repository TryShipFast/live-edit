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

    public function test_a_chosen_rectangle_is_kept_instead_of_the_middle(): void
    {
        /*
         * The one thing automatic fitting gets wrong, and the only reason to
         * build a crop tool at all: the middle is right most of the time and
         * cuts the subject the rest of it.
         *
         * Proved by the pixels. A picture with a red stripe down the left and
         * black everywhere else, cropped to the left: what comes out is red.
         * Without the rectangle the middle is taken and it is black.
         */
        $path = $this->stripedOnTheLeft(1200, 600);

        ImageFitter::fit($path, 200, 200, true, ['x' => 0, 'y' => 0, 'width' => 300, 'height' => 300]);

        $this->assertSame([200, 200], array_slice((array) getimagesize($path), 0, 2));
        $this->assertSame('ff0000', $this->colourAt($path, 100, 100), 'the chosen part was not what was kept');

        unlink($path);
    }

    public function test_without_a_rectangle_the_middle_is_still_taken(): void
    {
        // The default has to stay the default: a client who never opens the
        // crop tool gets exactly what they got before.
        $path = $this->stripedOnTheLeft(1200, 600);

        ImageFitter::fit($path, 200, 200, true);

        $this->assertSame('000000', $this->colourAt($path, 100, 100));

        unlink($path);
    }

    public function test_a_rectangle_past_the_edge_is_nudged_back_inside(): void
    {
        /*
         * Clamped rather than refused. The numbers are measured in a browser
         * from an image scaled to fit a panel, so a rectangle ending a pixel
         * past the edge is rounding - and refusing a crop at save time, after
         * somebody has carefully framed it, is the worse answer.
         */
        $path = $this->stripedOnTheLeft(400, 400);

        $this->assertTrue(
            ImageFitter::fit($path, 100, 100, true, ['x' => 350, 'y' => 350, 'width' => 400, 'height' => 400])
        );
        $this->assertSame([100, 100], array_slice((array) getimagesize($path), 0, 2));

        unlink($path);
    }

    public function test_a_nonsense_rectangle_puts_the_middle_back(): void
    {
        // Zero width is not a crop anybody drew. Falling back beats failing.
        $path = $this->stripedOnTheLeft(1200, 600);

        ImageFitter::fit($path, 200, 200, true, ['x' => 0, 'y' => 0, 'width' => 0, 'height' => 0]);

        $this->assertSame('000000', $this->colourAt($path, 100, 100));

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

    /** Red down the left third, black elsewhere, so a crop can be seen. */
    private function stripedOnTheLeft(int $width, int $height): string
    {
        $path = tempnam(sys_get_temp_dir(), 'crop').'.png';
        $image = imagecreatetruecolor($width, $height);
        imagefill($image, 0, 0, imagecolorallocate($image, 0, 0, 0));
        imagefilledrectangle($image, 0, 0, (int) ($width / 3), $height, imagecolorallocate($image, 255, 0, 0));
        imagepng($image, $path);
        imagedestroy($image);

        return $path;
    }

    private function colourAt(string $path, int $x, int $y): string
    {
        $image = imagecreatefrompng($path);
        $at = imagecolorat($image, $x, $y);
        imagedestroy($image);

        return sprintf('%02x%02x%02x', ($at >> 16) & 0xFF, ($at >> 8) & 0xFF, $at & 0xFF);
    }
}
