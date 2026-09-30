<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Mapper\TheTreeABrowserBuilds;

/**
 * The commonest card on a catalogue page, and the fault recorded as unfixable.
 *
 * The whole tile is a link, and inside it are a couple of paragraphs and a
 * button that is also a link. A nested `<a>` is invalid HTML, and a browser
 * does not merely tolerate it - the adoption agency algorithm splits the
 * misnested anchor and repeats it around each block it contained, turning one
 * anchor into four.
 *
 * libxml keeps them nested. So the server tagged a tree no browser would ever
 * have, keys were hashed against positions that did not exist in the page, and
 * saves came back as "Unknown setting" for keys nothing had recorded. Met on a
 * live site.
 *
 * It was written down as unfixable on the reasoning that we do not control the
 * parser. PHP 8.4 changed that. The markup is now normalised through
 * `Dom\HTMLDocument`, which follows the HTML5 rules, and handed on - the split
 * is structural, so it survives everything downstream unaltered.
 *
 * The expensive half of this change is what it must NOT do. Auto keys are a
 * hash of where an element sits, so a parser that disagreed about ordinary
 * pages would re-key every site at once and detach every word any client had
 * saved. Measured before writing it: the two parsers agree about every
 * ordinary page and disagree about exactly two things - the misnested anchor,
 * which is the point, and the `<tbody>` no author types, which is now skipped
 * so they agree about that too.
 */
class TheCardWrappedInALinkTest extends TestCase
{
    /** The markup from the report, near enough to be the same thing. */
    private const CARD = '<body><a class="card" href="/course">'
        .'<div><p>Learn to weld</p><div><a href="/enrol">Enrol now</a></div></div>'
        .'</a></body>';

    public function test_the_words_inside_the_card_are_reachable(): void
    {
        if (! TheTreeABrowserBuilds::available()) {
            $this->markTestSkipped('needs PHP 8.4 for a parser that follows the HTML5 rules');
        }

        $applied = (new MarkupScanner)->apply(self::CARD, ['text', 'image', 'link', 'icon'], true)['html'];

        // The paragraph is the thing the client could not edit.
        $this->assertMatchesRegularExpression('/<p data-edit="setting:auto:[a-f0-9]{12}"/', $applied);
    }

    public function test_the_page_is_keyed_against_the_tree_the_browser_will_have(): void
    {
        if (! TheTreeABrowserBuilds::available()) {
            $this->markTestSkipped('needs PHP 8.4');
        }

        /*
         * The whole fault in one assertion. Chrome builds four anchors from
         * this markup; libxml builds two and nests them. Keys hashed against
         * the second tree name positions the page does not have.
         */
        $applied = (new MarkupScanner)->apply(self::CARD, ['text', 'link'], true)['html'];

        $this->assertSame(4, substr_count($applied, '<a '), 'the anchors were not split the way a browser splits them');
        $this->assertStringNotContainsString('</a></div></a>', $applied, 'an anchor is still nested inside another');
    }

    public function test_an_ordinary_page_is_keyed_exactly_as_it_was(): void
    {
        /*
         * The guard that matters more than the fix. A normaliser that moved
         * keys on pages which were working would detach every word every
         * client has saved - "data loss with a release note". These keys were
         * recorded from the released version before the change and must not
         * move.
         */
        $ordinary = '<body><section><h1>A heading</h1><p>Some words here</p>'
            .'<div class="card"><h3>Card title</h3><p>Card words</p><a href="/x">Read more</a></div>'
            .'<img src="/a.jpg" alt="A picture"><ul><li>One</li><li>Two</li></ul></section></body>';

        $applied = (new MarkupScanner)->apply($ordinary, ['text', 'image', 'link', 'icon'], true)['html'];

        preg_match_all('/data-edit(?:-img|-href)?="setting:(auto:[a-f0-9]+)"/', $applied, $found);

        $this->assertSame([
            'auto:19fda16534d6',
            'auto:1179bf9a9311',
            'auto:5f3c9fbc1bda',
            'auto:700f150a0783',
            'auto:4561f28ce177',
            'auto:ecb951ac9c2e',
            'auto:e5812d3af07b',
            'auto:a1c16a9d1cc9',
        ], $found[1], 'an ordinary page re-keyed, which orphans every edit already saved against it');
    }

    public function test_a_table_keeps_its_keys_though_the_parsers_disagree_about_tbody(): void
    {
        /*
         * Every table has a <tbody> whether or not anybody typed one: a
         * browser inserts it and libxml does not. Counted, it would add a
         * segment to the path on one parser and not the other, and every table
         * on every site would re-key the day the parser changed.
         */
        $table = '<body><table><tr><td>A cell of words</td></tr></table></body>';

        $applied = (new MarkupScanner)->apply($table, ['text'], true)['html'];

        preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $applied, $found);

        $this->assertNotEmpty($found, 'the cell was never tagged');
        // Measured against the released version before this change, by
        // stashing it and running the same markup through both.
        $this->assertSame('auto:cf4d4f4d751c', $found[1], 'a table cell re-keyed');
    }

    public function test_it_gives_back_what_it_was_given_when_it_cannot_help(): void
    {
        // A normaliser that throws away a page it did not understand would be
        // worse than the fault it fixes.
        $this->assertSame('', TheTreeABrowserBuilds::from(''));
        $this->assertStringContainsString('Words', TheTreeABrowserBuilds::from('<p>Words</p>'));
    }
}
