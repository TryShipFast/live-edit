<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * Replace a picture, open the drawer again, and see the picture you replaced.
 *
 * Reported from a real site. The client changes an image, the new one appears
 * on the page, they open the drawer to write its description - and are shown
 * the one they have just got rid of. It reads as a save that did not take, and
 * the natural response is to replace it again, and again, each time seeing the
 * old picture come back.
 *
 * `data-edit-preview` is what the drawer reads, and it is written by the
 * tagging pass from whatever source the theme shipped. Overrides are applied
 * *after* tagging, so the attribute named the theme's picture forever.
 *
 * This is the database-backed half. The browser does the same thing in
 * applyContent for a site whose content is held by the service, and both are
 * covered because a rule implemented once is a rule two arrangements can
 * disagree about.
 */
class TheDrawerShowsTheCurrentPictureTest extends TestCase
{
    private function tagThenOverride(string $html, array $overrides): string
    {
        // The order the middleware uses, which is the whole cause: tag first,
        // apply second.
        $tagged = (new MarkupScanner)->apply($html, ['text', 'image', 'link', 'icon'], true)['html'];

        return (new MarkupScanner)->applyOverrides($tagged, $overrides);
    }

    private function keyIn(string $html): string
    {
        preg_match('/data-edit-img="setting:([^"]+)"/', $html, $found);

        return $found[1] ?? '';
    }

    public function test_the_preview_follows_the_picture_that_is_now_shown(): void
    {
        $tagged = (new MarkupScanner)->apply(
            '<img src="/theme/original.jpg" alt="A thing">',
            ['text', 'image', 'link', 'icon'],
            true
        )['html'];

        $key = $this->keyIn($tagged);
        $this->assertNotSame('', $key, 'the picture was never tagged');

        $applied = (new MarkupScanner)->applyOverrides($tagged, [$key => 'https://images.example.com/new.jpg']);

        $this->assertStringContainsString('src="https://images.example.com/new.jpg"', $applied);
        $this->assertStringContainsString('data-edit-preview="https://images.example.com/new.jpg"', $applied);
        $this->assertStringNotContainsString('data-edit-preview="/theme/original.jpg"', $applied);
    }

    public function test_removing_a_picture_leaves_no_ghost_behind(): void
    {
        $tagged = (new MarkupScanner)->apply('<img src="/theme/original.jpg">', ['image'], true)['html'];
        $key = $this->keyIn($tagged);

        $applied = (new MarkupScanner)->applyOverrides($tagged, [$key => '']);

        $this->assertStringNotContainsString('data-edit-preview', $applied);
    }

    public function test_an_untouched_picture_still_shows_what_the_theme_ships(): void
    {
        // The ordinary case, and the reason the attribute exists at all: with
        // no edit stored, what the theme rendered is still the truth.
        $tagged = (new MarkupScanner)->apply('<img src="/theme/original.jpg">', ['image'], true)['html'];

        $applied = (new MarkupScanner)->applyOverrides($tagged, ['something:else' => 'x']);

        $this->assertStringContainsString('data-edit-preview="/theme/original.jpg"', $applied);
    }

    public function test_the_description_beside_it_is_unaffected(): void
    {
        // Guarding the neighbours: the same branch writes alt, title and the
        // source list, and this change sits in the middle of it.
        $tagged = (new MarkupScanner)->apply('<img src="/theme/original.jpg" alt="Old words">', ['image'], true)['html'];
        $key = $this->keyIn($tagged);

        $applied = (new MarkupScanner)->applyOverrides($tagged, [
            $key => 'https://images.example.com/new.jpg',
            $key.'Alt' => 'New words',
        ]);

        $this->assertStringContainsString('alt="New words"', $applied);
        $this->assertStringContainsString('data-edit-preview="https://images.example.com/new.jpg"', $applied);
    }
}
