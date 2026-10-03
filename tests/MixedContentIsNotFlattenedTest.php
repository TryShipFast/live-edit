<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * "The auto-tagger flattens mixed-content elements."
 *
 * Reported twice against a live install, and named as the one remaining fault
 * that could damage a site. It is worth a test of its own precisely because it
 * is false, and because the shape it describes is one somebody will keep
 * suspecting: a heading whose middle is a coloured span, auto-tagged, with a
 * value stored against it that holds only the words outside the span.
 *
 *     Get Your Music <span>Heard<svg/></span> by the People Who Matter
 *
 * If re-injection rebuilt the element's contents from that value, the span,
 * its colour and the drawing underlining it would all be gone - and the page
 * would lose a word rather than gain one. It does not. Both appliers write
 * across the element's own runs of text and leave child elements alone, and
 * this is the server half said out loud.
 *
 * The real fault reported alongside this one was in the panel, not here: it
 * showed the heading with the word cut out and did not say where it had gone,
 * so somebody typed it back and the page said it twice. Named in 0.13.43.
 */
class MixedContentIsNotFlattenedTest extends TestCase
{
    private MarkupScanner $scanner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->scanner = new MarkupScanner;
    }

    private function tagged(string $html): string
    {
        return $this->scanner->apply($html, ['text', 'image', 'link', 'icon'], true)['html'];
    }

    private function keyOf(string $tagged, string $tag): string
    {
        preg_match('/<'.$tag.'[^>]*data-edit="setting:auto:([a-f0-9]{12})"/', $tagged, $found);

        $this->assertNotEmpty($found, "the <{$tag}> was never offered as editable");

        return 'auto:'.$found[1];
    }

    public function test_a_heading_split_by_a_span_keeps_the_span_when_its_words_are_rewritten(): void
    {
        // The hero from the install this was reported on, exactly.
        $tagged = $this->tagged(
            '<section><h1>Get Your Music <span class="text-primary">Heard'
            .'<svg height="6"><path d="M0 3"/></svg></span> by the People Who Matter</h1></section>'
        );

        $applied = $this->scanner->applyOverrides($tagged, [
            $this->keyOf($tagged, 'h1') => 'Get Your Songs  by the People Who Matter',
        ]);

        $this->assertStringContainsString('<span class="text-primary"', $applied, 'the span was destroyed');
        $this->assertStringContainsString('<svg', $applied, 'the drawing inside the span was destroyed');
        $this->assertSame(
            'Get Your Songs Heard by the People Who Matter',
            trim((string) preg_replace('/\s+/', ' ', strip_tags($applied))),
            'the words either side of the span were not rewritten around it'
        );
    }

    public function test_storing_the_words_it_opened_with_changes_nothing(): void
    {
        /*
         * The reported sequence: sign in, open the hero, press Save without
         * typing. The panel refuses to send an untouched field at all, so this
         * value should never be stored - and if it ever is, by that guard
         * failing or by a value arriving from anywhere else, it must still be
         * harmless.
         */
        $tagged = $this->tagged(
            '<section><h1>Get Your Music <span class="text-primary">Heard</span> by the People Who Matter</h1></section>'
        );

        $applied = $this->scanner->applyOverrides($tagged, [
            $this->keyOf($tagged, 'h1') => 'Get Your Music  by the People Who Matter',
        ]);

        $this->assertSame(
            'Get Your Music Heard by the People Who Matter',
            trim((string) preg_replace('/\s+/', ' ', strip_tags($applied))),
            'saving the words the panel opened with altered the heading'
        );
    }

    public function test_a_link_inside_a_sentence_survives_the_sentence_being_rewritten(): void
    {
        // The same shape, and the one where losing the child costs a
        // destination rather than a colour.
        $tagged = $this->tagged(
            '<section><p>Read our <a href="/terms">terms</a> before signing up</p></section>'
        );

        $applied = $this->scanner->applyOverrides($tagged, [
            $this->keyOf($tagged, 'p') => 'Read our  before you sign up',
        ]);

        $this->assertStringContainsString('href="/terms"', $applied, 'the link was destroyed');
        $this->assertSame(
            'Read our terms before you sign up',
            trim((string) preg_replace('/\s+/', ' ', strip_tags($applied)))
        );
    }

    public function test_the_words_inside_the_span_are_editable_in_their_own_right(): void
    {
        /*
         * The other half of the answer, and the half that was missing.
         *
         * Leaving a child alone is only correct if the child can be reached
         * some other way. It could not: a span was not named as a phrase, the
         * walk stops at the first editable thing, and so the accent word in
         * every hero written this decade was not destroyed, not duplicated,
         * simply unreachable - while the panel showed the sentence with a gap
         * where it used to be.
         *
         * "The auto-tagger flattens mixed content" was the report. Nothing was
         * flattened. Something was unreachable, which is quieter and lasts
         * longer.
         */
        $tagged = $this->tagged(
            '<section><h1>Get Your Music <span class="text-primary">Heard</span> by the People Who Matter</h1></section>'
        );

        $applied = $this->scanner->applyOverrides($tagged, [
            $this->keyOf($tagged, 'span') => 'Noticed',
        ]);

        $this->assertSame(
            'Get Your Music Noticed by the People Who Matter',
            trim((string) preg_replace('/\s+/', ' ', strip_tags($applied))),
            'the words inside the span could not be changed on their own'
        );
    }

    public function test_a_heading_and_the_accent_inside_it_are_edited_without_disturbing_each_other(): void
    {
        /*
         * The reason naming spans is safe, stated as a test rather than as an
         * argument. Two keys over one sentence is only tolerable while each
         * writes its own words: if either rewrote the whole element, the other
         * edit would be destroyed the next time the page was served.
         */
        $tagged = $this->tagged(
            '<section><h1>Get Your Music <span class="text-primary">Heard</span> by the People Who Matter</h1></section>'
        );

        $applied = $this->scanner->applyOverrides($tagged, [
            $this->keyOf($tagged, 'h1') => 'Get Your Songs  by Everyone',
            $this->keyOf($tagged, 'span') => 'Noticed',
        ]);

        $this->assertSame(
            'Get Your Songs Noticed by Everyone',
            trim((string) preg_replace('/\s+/', ' ', strip_tags($applied))),
            'editing the heading and the accent together lost one of them'
        );
    }

    public function test_the_words_of_a_link_in_a_sentence_can_be_changed_and_so_can_where_it_goes(): void
    {
        // Same hole, and here it costs a sentence its only call to action.
        $tagged = $this->tagged(
            '<section><p>Read our <a href="/terms">terms</a> before signing up</p></section>'
        );

        $this->assertStringContainsString(
            'data-edit-href',
            $tagged,
            'the destination of a link inside a sentence was not offered'
        );

        $applied = $this->scanner->applyOverrides($tagged, [
            $this->keyOf($tagged, 'a') => 'conditions',
        ]);

        $this->assertSame(
            'Read our conditions before signing up',
            trim((string) preg_replace('/\s+/', ' ', strip_tags($applied)))
        );
    }

    public function test_a_span_holding_no_words_is_not_offered(): void
    {
        /*
         * An icon wrapper, a spacer, a decorative rule. There is nothing in
         * them to edit, and offering them would put empty boxes all over a
         * page - which is the cost that kept spans out of this list and is
         * worth not paying.
         */
        $tagged = $this->tagged(
            '<section><h1>Read more <span class="icon"><svg viewBox="0 0 24 24"><path d="M13 4"/></svg></span></h1></section>'
        );

        preg_match('/<span[^>]*>/', $tagged, $span);

        $this->assertStringNotContainsString(
            'data-edit="setting:',
            $span[0] ?? '',
            'a span with no words of its own was offered as editable text'
        );
    }
}
