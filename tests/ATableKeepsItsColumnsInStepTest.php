<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * A table the owner shapes: its rows are a list, and every row (the header
 * row too) is a list of its columns under one key, so one saved order of
 * columns changes every row.
 *
 * Lists inside lists are applied first, so a row added copies a row that
 * already has the added columns; and a copied cell's key is its base and the
 * set of added ids it belongs to, so a cell in an added column of an added
 * row has one key whichever was added first, the same key the browser gives
 * it (tests/js/a-table-keeps-its-columns-in-step.test.js).
 */
class ATableKeepsItsColumnsInStepTest extends TestCase
{
    private const TABLE = '<table><thead><tr data-edit-list="cols"><th data-edit-item="c1" data-edit="setting:h1">Plan</th><th data-edit-item="c2" data-edit="setting:h2">Price</th></tr></thead>'
        .'<tbody data-edit-list="rows"><tr data-edit-item="r1" data-edit-list="cols"><th data-edit-item="c1" data-edit="setting:a1">Starter</th><td data-edit-item="c2" data-edit="setting:a2">0</td></tr>'
        .'<tr data-edit-item="r2" data-edit-list="cols"><th data-edit-item="c1" data-edit="setting:b1">Team</th><td data-edit-item="c2" data-edit="setting:b2">24</td></tr></tbody></table>';

    /** @param array<string, string> $overrides */
    private function keys(array $overrides): array
    {
        $html = (new MarkupScanner)->applyOverrides(self::TABLE, $overrides);
        preg_match_all('/data-edit="setting:([^"]+)"[^>]*>([^<]*)/', $html, $found);

        return array_combine($found[1], $found[2]);
    }

    public function test_a_column_added_reaches_every_row_and_the_header(): void
    {
        $this->assertSame(
            ['h1', 'h2', 'h2@nc', 'a1', 'a2', 'a2@nc', 'b1', 'b2', 'b2@nc'],
            array_keys($this->keys(['cols' => '["c1","c2","nc"]'])),
        );
    }

    public function test_a_row_added_has_the_added_columns_with_keys_of_its_own(): void
    {
        $keys = $this->keys(['cols' => '["c1","c2","nc","nd"]', 'rows' => '["r1","r2","nr"]', 'b2@nc@nr' => 'Typed here']);

        $this->assertSame('Typed here', $keys['b2@nc@nr']);
        $this->assertSame(['b1@nr', 'b2@nr', 'b2@nc@nr', 'b2@nd@nr'], array_slice(array_keys($keys), -4));
        $this->assertCount(count(array_unique(array_keys($keys))), $keys);
    }

    public function test_a_column_that_names_what_it_copies_keeps_its_keys_when_moved(): void
    {
        $this->assertSame('Typed', $this->keys(['cols' => '["c1","nk_c2","c2"]', 'h2@nk_c2' => 'Typed'])['h2@nk_c2']);
        $this->assertArrayNotHasKey('h1@nk_c2', $this->keys(['cols' => '["c1","nk_c2","c2"]']));
    }

    public function test_a_copy_of_a_copy_still_names_only_itself(): void
    {
        $html = (new MarkupScanner)->applyOverrides(
            '<ul data-edit-list="cards"><li data-edit-item="one"><h2 data-edit="setting:card.title">One</h2></li></ul>',
            ['cards' => '["one","n1","n2"]'],
        );

        $this->assertStringContainsString('setting:card.title@n1"', $html);
        $this->assertStringContainsString('setting:card.title@n2"', $html);
        $this->assertStringNotContainsString('@n1@n2', $html);
    }
}
