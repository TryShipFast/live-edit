<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * A call to action with an arrow after it.
 *
 * "Explore LearnKasts for educators →" is on every marketing page ever
 * written, and the arrow made the words uneditable: the icon got its own key
 * and could be swapped, while the sentence beside it could not be touched.
 *
 * Met on a live site on 2026-09-30, and the second time this exact shape has
 * bitten. The comment on INLINE_TAGS already described it happening with
 * <code> - a paragraph carrying one inline element fell through both rules
 * and went silent, "no warning, no mark on the page, just a client asking why
 * that one sentence cannot be changed".
 */
class AnIconBesideWordsDoesNotSilenceThemTest extends TestCase
{
    private function tagged(string $html): string
    {
        return (new MarkupScanner)->apply($html, ['text', 'image', 'link', 'icon'], true)['html'];
    }

    public function test_words_followed_by_an_icon_are_editable(): void
    {
        $applied = $this->tagged(
            '<span class="cta">Explore LearnKasts for educators'
            .'<svg viewBox="0 0 24 24"><path d="M13.5 4.5 21 12"/></svg></span>'
        );

        $this->assertMatchesRegularExpression(
            '/<span class="cta" data-edit="setting:auto:[a-f0-9]{12}"/',
            $applied,
            'the words next to the icon were not offered as editable'
        );
    }

    public function test_the_icon_is_still_editable_in_its_own_right(): void
    {
        // Both, not one or the other. The icon was always reachable; the point
        // is that the words are now too.
        $applied = $this->tagged('<span>Read more<svg viewBox="0 0 24 24"><path d="M1 1"/></svg></span>');

        $this->assertStringContainsString('data-edit-svg="setting:auto:', $applied);
        $this->assertStringContainsString('data-edit="setting:auto:', $applied);
    }

    public function test_an_inline_picture_does_not_silence_a_sentence_either(): void
    {
        $applied = $this->tagged('<p>Backed by <img src="/flag.png" alt="the flag"> and others</p>');

        $this->assertMatchesRegularExpression('/<p data-edit="setting:auto:[a-f0-9]{12}"/', $applied);
    }

    public function test_a_wrapper_whose_words_all_live_in_a_child_is_still_left_alone(): void
    {
        /*
         * The rule this must not break. <li><a>Activate</a></li> has no words
         * of its own, and tagging both let an edit to the wrapper append a
         * stray phrase beside the button.
         */
        $applied = $this->tagged('<li><a href="/go">Activate</a></li>');

        $this->assertStringNotContainsString('<li data-edit=', $applied);
        $this->assertStringContainsString('<a href="/go" data-edit="setting:auto:', $applied);
    }

    public function test_an_icon_only_element_is_not_offered_as_text(): void
    {
        // No words of its own means nothing to edit, icon or not.
        $applied = $this->tagged('<span class="icon-only"><svg viewBox="0 0 24 24"><path d="M1 1"/></svg></span>');

        $this->assertStringNotContainsString('<span class="icon-only" data-edit="setting:', $applied);
    }

    public function test_a_link_keeps_both_its_words_and_its_icon(): void
    {
        /*
         * The regression the first attempt caused, caught by a test that
         * already existed.
         *
         * Letting an icon sit beside words made "Learn more →" a text leaf,
         * and the anchor branch stopped descending into text leaves - so the
         * sentence became editable and the arrow silently lost the key it had
         * always had. Both or neither: a client can see both and cannot be
         * told why one answers and the other does not.
         */
        $applied = $this->tagged('<a href="/x">Learn more <svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></a>');

        $this->assertMatchesRegularExpression('/<svg[^>]*data-edit-svg="setting:auto:[a-f0-9]{12}"/', $applied);
        $this->assertStringContainsString('data-edit="setting:auto:', $applied);
        $this->assertStringContainsString('data-edit-href="auto:', $applied);
    }
}
