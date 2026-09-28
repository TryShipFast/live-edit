<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * Text a framework is already writing is not ours to tag.
 *
 * Found on our own pricing page, which is the best place to find it. Every
 * price was bound with Alpine's x-text so that one toggle could switch the
 * page between monthly and yearly. The scanner tagged those elements as
 * editable content, so pressing Yearly did this:
 *
 *   Alpine wrote ₦250,000.
 *   The editor wrote the published words back over it: ₦25,000.
 *
 * The toggle flipped, the state changed, the numbers did not move, and nothing
 * anywhere reported an error. From the outside the pricing page was simply
 * broken.
 *
 * Tagging one of these is wrong twice. The words are not content: they are a
 * value the framework recalculates on its next render and discards whatever we
 * stored. And the attribute is the page author saying out loud that something
 * else owns this text, which is the one thing this product must not argue
 * with. React was given an entire adapter for this reason; Alpine and Vue get
 * the same respect for the price of a list of attribute names.
 */
class TheScannerLeavesFrameworkTextAloneTest extends TestCase
{
    private function tag(string $html): string
    {
        return (new MarkupScanner)->apply($html, ['text', 'image', 'link', 'icon'], true)['html'] ?? '';
    }

    public function test_it_does_not_tag_a_price_alpine_is_writing(): void
    {
        $out = $this->tag(<<<'HTML'
            <div x-data="{ yearly: false }">
                <span x-text="yearly ? '250,000' : '25,000'">25,000</span>
            </div>
            HTML);

        $this->assertStringNotContainsString('data-edit=', $out, 'the editor would overwrite whatever Alpine wrote');
    }

    public function test_it_leaves_vue_and_angular_bindings_alone_too(): void
    {
        foreach (['v-text', 'v-html', 'ng-bind', 'data-bind'] as $attribute) {
            $out = $this->tag("<div><p {$attribute}=\"total\">£0.00</p></div>");

            $this->assertStringNotContainsString('data-edit=', $out, "{$attribute} was tagged anyway");
        }
    }

    public function test_ordinary_words_beside_a_binding_are_still_editable(): void
    {
        // The rule is about the element that carries the binding, not about
        // giving up on the whole page. A heading next to a live figure is
        // still somebody's copy.
        $out = $this->tag(<<<'HTML'
            <div x-data="{ n: 1 }">
                <h2>What it costs</h2>
                <span x-text="n"></span>
            </div>
            HTML);

        $this->assertStringContainsString('<h2 data-edit=', $out, 'a plain heading stopped being editable');
        $this->assertStringNotContainsString('<span data-edit=', $out);
    }

    public function test_a_page_already_tagged_by_hand_is_not_second_guessed(): void
    {
        /*
         * If a developer has deliberately put both on the same element, they
         * have said what they want and know their own page. Tagging is
         * idempotent and leaves existing keys alone, which this confirms
         * stays true: a client's saved work hangs off that key.
         */
        $out = $this->tag('<p data-edit="setting:hero" x-text="whatever">Hello</p>');

        $this->assertStringContainsString('data-edit="setting:hero"', $out);
    }
}
