<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * Settings a card's words do not show, on the published page.
 *
 * The editor saves a card's settings as one JSON object under its own key
 * (data-edit-choice); the list says which attributes the site's filter reads
 * (data-edit-choices). Published without them, a card the owner added and
 * filed under "Interior" would still carry its original's "Exterior", and the
 * filter would show it in the wrong place on the live site only.
 */
class ACardFilesItselfWhenPublishedTest extends TestCase
{
    private const LIST = '<ul data-edit-list="photos" data-edit-choices="[{&quot;attr&quot;:&quot;data-cat&quot;,&quot;from&quot;:&quot;[data-filter]&quot;},{&quot;attr&quot;:&quot;data-starts&quot;,&quot;from&quot;:&quot;option&quot;}]">'
        .'<li data-edit-item="one" data-cat="ext" data-starts="sep" data-edit-choice="setting:photos.one"><p data-edit="setting:photos.cap">Porch</p></li>'
        .'<li data-edit-item="two" data-cat="int" data-starts="jan" data-edit-choice="setting:photos.two"><p data-edit="setting:photos.cap2">Hall</p></li>'
        .'</ul>';

    public function test_the_chosen_settings_are_written_where_the_filter_reads_them(): void
    {
        $html = (new MarkupScanner)->applyOverrides(self::LIST, ['photos.one' => '{"data-cat":"int","data-starts":"sep jan"}']);

        $this->assertStringContainsString('data-cat="int" data-starts="sep jan" data-edit-choice="setting:photos.one"', $html);
        $this->assertStringContainsString('data-cat="int" data-starts="jan" data-edit-choice="setting:photos.two"', $html);
    }

    public function test_an_added_card_keeps_settings_of_its_own(): void
    {
        $html = (new MarkupScanner)->applyOverrides(self::LIST, [
            'photos' => '["one","nabc","two"]',
            'photos.one@nabc' => '{"data-cat":"int"}',
        ]);

        preg_match_all('/<li [^>]*>/', $html, $items);
        $this->assertCount(3, $items[0]);
        $this->assertStringContainsString('data-cat="ext"', $items[0][0]);
        $this->assertStringContainsString('data-cat="int"', $items[0][1]);
        $this->assertStringContainsString('setting:photos.one@nabc', $items[0][1]);
    }

    public function test_only_declared_attributes_are_written(): void
    {
        $html = (new MarkupScanner)->applyOverrides(self::LIST, ['photos.one' => '{"data-cat":"int","onclick":"alert(1)","class":"x"}']);
        $this->assertStringNotContainsString('onclick', $html);
        $this->assertStringNotContainsString('class="x"', $html);

        $bare = (new MarkupScanner)->applyOverrides(
            '<ul data-edit-list="x"><li data-edit-item="a" data-cat="ext" data-edit-choice="setting:x.a">A</li></ul>',
            ['x.a' => '{"data-cat":"int"}'],
        );
        $this->assertStringContainsString('data-cat="ext"', $bare);
    }
}
