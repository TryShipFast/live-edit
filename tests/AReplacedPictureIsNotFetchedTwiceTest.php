<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * A picture somebody replaced should not be fetched at all.
 *
 * Reported as "it loads the old image first, then the replacement", with a 404
 * in the console for a file the theme no longer had. The cross-fade added
 * earlier hides the flash, which is worth having and is not an answer: the
 * browser still asks for the original, still pays for it, and still logs the
 * 404 when it has gone.
 *
 * `clearTheSourcesAround` already deals with what a browser consults to decide
 * which file to show - srcset, sizes, a <source> in a <picture>. None of that
 * helps against a `<link rel=preload as=image>`, which is requested while the
 * document is still being parsed and so outranks all of them by happening
 * first.
 *
 * Common rather than exotic: preloading the hero is the standard advice for a
 * good LCP score, so a theme worth buying has one, and the hero is the first
 * picture a client replaces.
 */
class AReplacedPictureIsNotFetchedTwiceTest extends TestCase
{
    private function tagged(string $body, string $head = ''): string
    {
        return (new MarkupScanner)->apply(
            "<html><head>{$head}</head><body>{$body}</body></html>",
            ['text', 'image'],
            true,
        )['html'];
    }

    /** @param array<string, string> $overrides */
    private function published(string $html, array $overrides): string
    {
        return (new MarkupScanner)->applyOverrides($html, $overrides);
    }

    private function keyOf(string $html): string
    {
        preg_match('/data-edit-img="setting:([^"]+)"/', $html, $found);

        return $found[1] ?? '';
    }

    public function test_a_preload_for_the_replaced_picture_is_taken_away(): void
    {
        $tagged = $this->tagged(
            '<img src="/images/marketing/os-create.webp" alt="">',
            '<link rel="preload" as="image" href="/images/marketing/os-create.webp">',
        );

        $html = $this->published($tagged, [$this->keyOf($tagged) => '/storage/live/new-photo.jpg']);

        $this->assertStringNotContainsString('os-create.webp', $html);
        $this->assertStringContainsString('/storage/live/new-photo.jpg', $html);
    }

    public function test_a_preload_for_anything_else_is_left_alone(): void
    {
        /*
         * A theme's own preloads are one of the things it was bought for.
         * Only the picture that was replaced loses its hint.
         */
        $tagged = $this->tagged(
            '<img src="/images/hero.jpg" alt="">',
            '<link rel="preload" as="font" href="/fonts/inter.woff2" crossorigin>'
            .'<link rel="preload" as="image" href="/images/logo.svg">',
        );

        $html = $this->published($tagged, [$this->keyOf($tagged) => '/storage/live/new.jpg']);

        $this->assertStringContainsString('/fonts/inter.woff2', $html);
        $this->assertStringContainsString('/images/logo.svg', $html);
    }

    public function test_a_responsive_preload_naming_the_old_file_goes_too(): void
    {
        // imagesrcset is how a responsive preload is written, and it can name
        // the old file even when href does not.
        $tagged = $this->tagged(
            '<img src="/images/hero.jpg" alt="">',
            '<link rel="preload" as="image" href="/images/fallback.jpg" '
            .'imagesrcset="/images/hero.jpg 1x, /images/hero@2x.jpg 2x">',
        );

        $html = $this->published($tagged, [$this->keyOf($tagged) => '/storage/live/new.jpg']);

        $this->assertStringNotContainsString('imagesrcset', $html);
    }

    public function test_a_prefetch_counts_as_well(): void
    {
        // Both start a request for the file. Only preconnect, which names a
        // host rather than a file, is harmless.
        $tagged = $this->tagged(
            '<img src="/images/hero.jpg" alt="">',
            '<link rel="prefetch" href="/images/hero.jpg">',
        );

        $html = $this->published($tagged, [$this->keyOf($tagged) => '/storage/live/new.jpg']);

        $this->assertStringNotContainsString('prefetch', $html);
    }

    public function test_a_preconnect_is_never_touched(): void
    {
        // It names a host, not a file, and removing it would cost the page the
        // handshake it was saving.
        $tagged = $this->tagged(
            '<img src="/images/hero.jpg" alt="">',
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        );

        $html = $this->published($tagged, [$this->keyOf($tagged) => '/storage/live/new.jpg']);

        $this->assertStringContainsString('preconnect', $html);
    }

    public function test_a_page_where_nothing_was_replaced_keeps_every_hint(): void
    {
        /*
         * The positive control. Overrides that touch no picture must leave the
         * head exactly as the theme wrote it, or this would be stripping
         * preloads from every page on the site.
         */
        $tagged = $this->tagged(
            '<img src="/images/hero.jpg" alt=""><p data-edit>Words</p>',
            '<link rel="preload" as="image" href="/images/hero.jpg">',
        );

        $html = $this->published($tagged, ['setting:nothing-to-do-with-pictures' => 'x']);

        $this->assertStringContainsString('rel="preload"', $html);
        $this->assertStringContainsString('/images/hero.jpg', $html);
    }
}
