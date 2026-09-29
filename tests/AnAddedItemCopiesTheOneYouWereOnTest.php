<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * A new list item starts as a copy of the one it was added from.
 *
 * It used to copy the first item, always. On a nine-card grid, pressing
 * "+ Add another" beside the second card produced a copy of the first, so two
 * cards said the same thing, far apart, which is exactly how it survives until
 * a visitor notices.
 *
 * Decided once here rather than per adapter: Laravel, WordPress, plain HTML
 * and whatever React grows all go through this, and a rule settled during the
 * React work would be a rule settled twice.
 *
 * No protocol was needed for it. The editor inserts the new id immediately
 * after the item whose button was pressed, so the order already says where a
 * new item came from.
 */
class AnAddedItemCopiesTheOneYouWereOnTest extends TestCase
{
    private function list(string ...$ids): string
    {
        $items = '';
        foreach ($ids as $id) {
            $items .= sprintf(
                '<li data-edit-item="%s"><h2 data-edit="setting:%s.title">%s</h2></li>',
                $id, $id, ucfirst($id).' words'
            );
        }

        return '<ul data-edit-list="courses">'.$items.'</ul>';
    }

    /** @param array<int, string> $order */
    private function render(string $html, array $order): string
    {
        return (new MarkupScanner)->applyOverrides($html, [
            'courses' => json_encode($order),
        ]);
    }

    public function test_it_copies_the_item_it_was_added_from(): void
    {
        // Pressed "+" on the second of three.
        $out = $this->render(
            $this->list('one', 'two', 'three'),
            ['one', 'two', 'new1', 'three']
        );

        $this->assertStringContainsString('Two words', $out);
        // The new one carries the second card's words, not the first's.
        $this->assertSame(2, substr_count($out, 'Two words'), 'the new item did not copy the one it was added from');
        $this->assertSame(1, substr_count($out, 'One words'));
    }

    public function test_adding_from_the_last_item_copies_the_last(): void
    {
        $out = $this->render(
            $this->list('one', 'two', 'three'),
            ['one', 'two', 'three', 'new1']
        );

        $this->assertSame(2, substr_count($out, 'Three words'));
    }

    public function test_two_added_in_a_row_both_find_a_real_item(): void
    {
        /*
         * The second new id has an unknown item immediately before it, so a
         * naive "take the previous entry" would copy nothing. It walks back to
         * the nearest real one instead: copying the wrong thing is bad,
         * copying nothing is worse.
         */
        $out = $this->render(
            $this->list('one', 'two'),
            ['one', 'two', 'new1', 'new2']
        );

        $this->assertSame(3, substr_count($out, 'Two words'));
    }

    public function test_an_item_added_at_the_very_top_still_gets_a_template(): void
    {
        // Nothing before it to copy, so the first item is the only sensible
        // source and the design still arrives intact.
        $out = $this->render(
            $this->list('one', 'two'),
            ['new1', 'one', 'two']
        );

        $this->assertSame(2, substr_count($out, 'One words'));
        $this->assertStringContainsString('data-edit-item="new1"', $out);
    }

    public function test_the_copy_gets_its_own_keys(): void
    {
        /*
         * The part that must not regress whatever the copying rule is: the
         * new item needs its own keys, or editing it would rewrite the card it
         * was copied from.
         *
         * Auto keys, because those are the ones rekeying rewrites and the
         * ones every model-less site uses — kb-tag, the WordPress plugin and
         * the cloud product all tag this way. A hand-authored semantic key is
         * left alone deliberately, which has a consequence recorded in
         * LIMITATIONS.md.
         */
        $html = '<ul data-edit-list="courses">'
            .'<li data-edit-item="one"><h2 data-edit="setting:auto:aaa">One words</h2></li>'
            .'<li data-edit-item="two"><h2 data-edit="setting:auto:bbb">Two words</h2></li>'
            .'</ul>';

        $out = $this->render($html, ['one', 'two', 'new1']);

        $this->assertStringContainsString('data-edit-item="new1"', $out);

        // Three items, three different keys: the copy cannot write over the
        // card it came from.
        preg_match_all('/setting:auto:([a-f0-9]+)/', $out, $found);
        $this->assertCount(3, $found[1]);
        $this->assertCount(3, array_unique($found[1]), 'the copy shares a key with the item it came from');
    }

    public function test_an_untouched_list_is_left_alone(): void
    {
        $html = $this->list('one', 'two');

        $this->assertStringContainsString('One words', $this->render($html, ['one', 'two']));
        $this->assertSame(1, substr_count($this->render($html, ['one', 'two']), 'Two words'));
    }
}
