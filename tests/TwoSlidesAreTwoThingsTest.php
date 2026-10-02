<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * Five testimonials sharing one key.
 *
 * A slider renders the testimonial it is showing and keeps the rest in a
 * variable, so the markup holds exactly one of them and the others are put
 * into that same node when somebody presses Next. Every testimonial is
 * therefore offered the same position, and a name taken from position gives
 * all five of them the same key.
 *
 * Measured on a real page before this was fixed: slide one and slide two both
 * came back as setting:auto:86ee3457c4e9. Editing the second would not have
 * sat beside the first - it would have replaced it, and then appeared under
 * whichever slide happened to be on screen. "I cannot edit this" is a
 * complaint; "it edited a different one and said nothing" is a bug somebody
 * finds months later with no idea what did it.
 *
 * The scanner cannot see any of this from the markup, because at render time
 * the other four do not exist. The runtime can - it watches keyed content
 * leave a parent and different content arrive in its place - and marks what
 * arrived with data-kb-swaps. This is the scanner keeping its side of that.
 */
class TwoSlidesAreTwoThingsTest extends TestCase
{
    private function tagged(string $html): string
    {
        return (new MarkupScanner)->apply($html, ['text', 'image', 'link'], true)['html'];
    }

    private function keysIn(string $html): array
    {
        preg_match_all('/data-edit="setting:auto:([a-f0-9]{12})"/', $html, $found);

        return $found[1];
    }

    private function slide(string $quote, string $name): string
    {
        return '<section><div class="stage" data-kb-swaps="1">'
            .'<p class="quote">'.$quote.'</p>'
            .'<p class="name">'.$name.'</p>'
            .'</div></section>';
    }

    public function test_two_testimonials_in_one_position_are_not_one_testimonial(): void
    {
        // The reported shape, both halves of it as the runtime would send them.
        $first = $this->keysIn($this->tagged(
            $this->slide('NewBanger got my single onto 12 playlists in a week', 'Ada')
        ));
        $second = $this->keysIn($this->tagged(
            $this->slide('I have tried other promotion services and got nothing', 'Bola')
        ));

        $this->assertCount(2, $first, 'the first slide was not tagged');
        $this->assertCount(2, $second, 'the second slide was not tagged');
        $this->assertSame(
            [],
            array_intersect($first, $second),
            'two different testimonials were given the same key, so editing one overwrites the other'
        );
    }

    public function test_a_slide_keeps_its_key_when_its_words_are_edited(): void
    {
        /*
         * The whole arrangement rests on this. A tagged document always holds
         * the THEME's words - content is applied when the page is served and
         * never written back - so naming a slide by what it holds is safe in
         * a way it would not be if edits came back round.
         *
         * What must not happen is the key moving because the page around the
         * slide moved, which is the thing position-based naming does.
         */
        $alone = $this->keysIn($this->tagged(
            $this->slide('NewBanger got my single onto 12 playlists in a week', 'Ada')
        ));

        $withMoreAbove = $this->keysIn($this->tagged(
            '<header><h1>Curators</h1></header><div class="banner">Now hiring</div>'
            .$this->slide('NewBanger got my single onto 12 playlists in a week', 'Ada')
        ));

        $this->assertSame(
            $alone,
            array_values(array_intersect($withMoreAbove, $alone)),
            'adding a banner above the slider moved the slide keys'
        );
    }

    public function test_a_picture_that_swaps_is_named_by_the_picture(): void
    {
        // An avatar has no words to be named by, so two of them would collapse
        // onto one key and the second face would overwrite the first.
        $tag = fn (string $src) => (new MarkupScanner)->apply(
            '<section><div data-kb-swaps="1"><img src="'.$src.'" alt="Portrait"></div></section>',
            ['text', 'image', 'link'],
            true
        )['html'];

        preg_match('/data-edit-img="setting:auto:([a-f0-9]{12})"/', $tag('/ada.jpg'), $ada);
        preg_match('/data-edit-img="setting:auto:([a-f0-9]{12})"/', $tag('/bola.jpg'), $bola);

        $this->assertNotEmpty($ada, 'the first avatar was not tagged');
        $this->assertNotEmpty($bola, 'the second avatar was not tagged');
        $this->assertNotSame($ada[1], $bola[1], 'two avatars were given one key');
    }

    public function test_ordinary_content_is_still_named_by_where_it_sits(): void
    {
        /*
         * Naming by content is the more expensive answer and the one that
         * moves when a developer edits the theme. It is right where position
         * is a lie and wrong everywhere else, so nothing without the mark
         * should change.
         */
        $plain = '<section><div class="stage"><p class="quote">Same words either way</p></div></section>';
        $marked = '<section><div class="stage" data-kb-swaps="1"><p class="quote">Same words either way</p></div></section>';

        $this->assertNotSame(
            $this->keysIn($this->tagged($plain)),
            $this->keysIn($this->tagged($marked)),
            'the mark made no difference, so swapped content is still keyed by position'
        );
    }
}
