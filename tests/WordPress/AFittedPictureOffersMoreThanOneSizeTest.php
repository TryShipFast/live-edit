<?php

namespace ShipFast\LiveEdit\Tests\WordPress;

use KastsBuild\Media;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * A replacement is fitted to the box at more than one density, and the list
 * saying so is what lets a phone download the smaller file.
 *
 * Tested away from WordPress, because the part that can be got wrong here is
 * arithmetic and a string. Making the files needs an image editor and a
 * library; writing a descriptor a browser can read does not.
 *
 * Worth testing at all because the failure is silent. A descriptor that
 * cannot be parsed invalidates the whole list, the page falls back to src,
 * and it looks exactly as it should: the right picture, at the largest size,
 * on every phone. Nothing errors, nothing looks wrong, and the saving this
 * was built for simply never happens.
 */
class AFittedPictureOffersMoreThanOneSizeTest extends TestCase
{
    private function descriptor(float $density): string
    {
        require_once __DIR__.'/../../packages/wordpress/kastsbuild/includes/Media.php';

        return Media::descriptor($density);
    }

    public function test_the_usual_densities_are_written_the_usual_way(): void
    {
        // "1.00x" is not wrong so much as not how anybody writes it, and an
        // attribute full of trailing zeroes invites somebody to tidy it later
        // without knowing whether the tidying matters.
        $this->assertSame('1x', $this->descriptor(1.0));
        $this->assertSame('2x', $this->descriptor(2.0));
    }

    public function test_a_density_between_them_keeps_its_fraction(): void
    {
        /*
         * A source too small for a full 2x still gives a real improvement, and
         * the density it gives is whatever the source allows rather than a
         * round number. Rounding it to "1x" would describe a file as smaller
         * than it is and a browser would pick the wrong one.
         */
        $this->assertSame('1.5x', $this->descriptor(1.5));
        $this->assertSame('1.33x', $this->descriptor(1.333333));
    }

    public function test_it_never_writes_a_bare_number(): void
    {
        // Without the unit the list is invalid and the browser ignores all of
        // it, which is the silent failure this file exists for.
        foreach ([1.0, 1.25, 1.5, 2.0] as $density) {
            $this->assertStringEndsWith('x', $this->descriptor($density));
            $this->assertMatchesRegularExpression('/^\d+(\.\d+)?x$/', $this->descriptor($density));
        }
    }
}
