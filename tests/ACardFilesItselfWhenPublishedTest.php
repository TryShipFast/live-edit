<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * A card's category that its words do not show, on the published page.
 *
 * The editor saves the owner's choice under the card's own key
 * (data-edit-choice); the list says which attribute the site's filter reads
 * (data-edit-choice-attr). Published without it, a card the owner added and
 * filed under "Interior" would still carry its original's "Exterior", and the
 * filter would show it in the wrong place on the live site only.
 */
class ACardFilesItselfWhenPublishedTest extends TestCase
{
    private const LIST = '<ul data-edit-list="photos" data-edit-choice-attr="data-cat">'
        .'<li data-edit-item="one" data-cat="ext" data-edit-choice="setting:photos.cat"><p data-edit="setting:photos.cap">Porch</p></li>'
        .'<li data-edit-item="two" data-cat="int" data-edit-choice="setting:photos.cat2"><p data-edit="setting:photos.cap2">Hall</p></li>'
        .'</ul>';

    public function test_the_chosen_category_is_written_where_the_filter_reads_it(): void
    {
        $html = (new MarkupScanner)->applyOverrides(self::LIST, ['photos.cat' => 'int']);

        $this->assertStringContainsString('data-cat="int" data-edit-choice="setting:photos.cat"', $html);
        $this->assertStringContainsString('data-cat="int" data-edit-choice="setting:photos.cat2"', $html);
    }

    public function test_an_added_card_keeps_a_choice_of_its_own(): void
    {
        $html = (new MarkupScanner)->applyOverrides(self::LIST, [
            'photos' => '["one","nabc","two"]',
            'photos.cat@nabc' => 'int',
        ]);

        preg_match_all('/<li [^>]*>/', $html, $items);
        $this->assertCount(3, $items[0]);
        $this->assertStringContainsString('data-cat="ext"', $items[0][0]);
        $this->assertStringContainsString('data-cat="int"', $items[0][1]);
        $this->assertStringContainsString('setting:photos.cat@nabc', $items[0][1]);
    }

    public function test_nothing_is_written_without_a_declared_attribute(): void
    {
        $html = (new MarkupScanner)->applyOverrides(
            '<ul data-edit-list="x"><li data-edit-item="a" data-cat="ext" data-edit-choice="setting:x.cat">A</li></ul>',
            ['x.cat' => 'int'],
        );

        $this->assertStringContainsString('data-cat="ext"', $html);
    }
}
