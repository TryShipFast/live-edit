<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Application\Api\ListChanges;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * What the Changes tab says a change was.
 *
 * Somebody opens this to answer one question: did the thing I just did
 * actually save. An answer they cannot read is the same as no answer, and to
 * a novice it is worse — it reads as the editor being broken.
 *
 * A list is the awkward one. It is stored as the order of its item ids, so
 * printed plainly it said ["nmuiimroh","i1","i2"] — names the editor invented
 * for its own use that nobody has ever seen. Saying "3 items: nmuiimroh, i1,
 * i2" is no better. What somebody wants to know is what happened to the list.
 */
class ChangesReadablyTest extends TestCase
{
    protected Site $site;

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create(['slug' => 'client', 'name' => 'Client', 'allowed_origins' => []]);
    }

    protected function draft(string $subject, string $value): void
    {
        Draft::query()->create([
            'site_id' => $this->site->id,
            'kind' => 'setting',
            'subject' => $subject,
            'payload' => ['value' => $value],
        ]);
    }

    protected function published(string $key, string $value): void
    {
        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $key, 'value' => $value]);
    }

    protected function after(): string
    {
        return app(ListChanges::class)($this->site->fresh())['changes'][0]['after'];
    }

    public function test_an_added_item_says_so_rather_than_listing_ids(): void
    {
        $this->published('auto:menu', json_encode(['i1', 'i2']));
        $this->draft('auto:menu', json_encode(['i1', 'i2', 'nmuiimroh']));

        $this->assertSame('1 item added, leaving 3 items', $this->after());
    }

    public function test_a_removed_item_says_so(): void
    {
        $this->published('auto:menu', json_encode(['i1', 'i2', 'i3']));
        $this->draft('auto:menu', json_encode(['i1', 'i3']));

        $this->assertSame('1 item removed, leaving 2 items', $this->after());
    }

    public function test_reordering_is_named_as_reordering(): void
    {
        $this->published('auto:menu', json_encode(['i1', 'i2', 'i3']));
        $this->draft('auto:menu', json_encode(['i3', 'i1', 'i2']));

        $this->assertSame('The order changed', $this->after());
    }

    public function test_a_list_with_nothing_published_before_it_is_counted(): void
    {
        $this->draft('auto:menu', json_encode(['i1', 'i2']));

        $this->assertSame('A list of 2 items', $this->after());
    }

    public function test_ordinary_words_are_left_exactly_as_they_are(): void
    {
        // Including words that merely begin with a bracket, which are words
        // somebody typed and not a list.
        $this->draft('auto:heading', '[Draft] Our new opening hours');

        $this->assertSame('[Draft] Our new opening hours', $this->after());
    }
}
