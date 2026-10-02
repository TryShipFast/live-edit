<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Models\SiteStyle;

/**
 * Writing what is already there is not a change.
 *
 * A drawer submits every field it holds, and most of them hold the value that
 * was already on the page. One picture replaced wrote nine rows: the picture,
 * the description it already had, five empty credit fields, an empty tooltip,
 * and an empty set of style props. The customer read "9 changes" on the
 * publish button for one replaced picture - and said so, which is how this was
 * found.
 *
 * Three costs, not one. The count is wrong where somebody is deciding whether
 * to publish; the version history fills with rows that changed nothing, so the
 * one that did is buried; and every row is metered as a write against the
 * site's month, so a customer pays nine times for replacing a picture once.
 *
 * Guarded in the store rather than in the editor because the editor is one of
 * four clients. WordPress, React and a folder of static files reach this same
 * method.
 */
class OneChangeCountsAsOneTest extends TestCase
{
    private Site $site;

    private SiteStore $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create(['slug' => 'client', 'name' => 'Client']);
        $this->store = new SiteStore($this->site);
    }

    private function published(string $key, string $value): void
    {
        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $key, 'value' => $value]);
    }

    public function test_writing_the_value_that_is_already_published_records_nothing(): void
    {
        $this->published('auto:hero', 'A photograph');

        $this->store->put('auto:hero', 'A photograph', true);

        $this->assertSame(0, $this->store->pending(), 'an unchanged field was recorded as a change');
    }

    public function test_a_real_change_is_still_recorded(): void
    {
        // The guard must not be so clever that it stops the product working.
        $this->published('auto:hero', 'A photograph');

        $this->store->put('auto:hero', 'A different photograph', true);

        $this->assertSame(1, $this->store->pending());
    }

    public function test_a_first_value_is_a_change_even_though_nothing_was_stored(): void
    {
        // Nothing published here, so this is the first thing ever said about
        // this key. It is a change, and the page will look different for it.
        $this->store->put('auto:hero', 'A photograph', true);

        $this->assertSame(1, $this->store->pending());
    }

    public function test_writing_a_draft_twice_is_still_one_change(): void
    {
        // Two saves of the same panel, which is an ordinary thing to do.
        $this->store->put('auto:hero', 'A photograph', true);
        $this->store->put('auto:hero', 'A photograph', true);

        $this->assertSame(1, $this->store->pending());
    }

    public function test_putting_a_value_back_removes_the_change_rather_than_recording_another(): void
    {
        /*
         * Typing a word, thinking better of it, and typing the old one back.
         * That has to leave nothing pending - otherwise the publish button
         * offers to publish a change that changes nothing, and somebody has
         * to decide whether to trust it.
         */
        $this->published('auto:hero', 'A photograph');

        $this->store->put('auto:hero', 'Something else', true);
        $this->assertSame(1, $this->store->pending());

        $this->store->put('auto:hero', 'A photograph', true);

        $this->assertSame(0, $this->store->pending(), 'undoing a change left it pending');
    }

    public function test_an_empty_style_is_not_stored_where_there_was_no_style(): void
    {
        // What every saved picture wrote: `{"props":[]}` against the element's
        // style key, because the drawer collects its style fields whether or
        // not the panel has any.
        $this->store->putStyle('s-hero', [], true);

        $this->assertSame(0, $this->store->pending());
    }

    public function test_an_empty_style_still_clears_one_that_is_stored(): void
    {
        /*
         * The other half, and the reason this is not simply "ignore empty".
         * An empty set is how "put it back to the theme's own" is said, so
         * where a style exists the write has to go through.
         */
        SiteStyle::query()->create([
            'site_id' => $this->site->id,
            'key' => 's-hero',
            'props' => ['background' => '#ff0000'],
        ]);

        $this->store->putStyle('s-hero', [], true);

        $this->assertSame(1, $this->store->pending());
    }

    public function test_one_replaced_picture_is_one_change(): void
    {
        /*
         * The reported fault, as far as the store can answer it: a replaced
         * picture on a site whose markup already supplied the description,
         * plus the empty style row every saved picture wrote.
         *
         * The empty credit fields are not here on purpose. Writing an empty
         * value where nothing is stored is a real intention from this side -
         * it is how a description that came from the markup gets cleared - so
         * the store must record it, and the panel is the only thing that knows
         * those five were never typed. That half is covered in
         * tests/js/only-what-changed.test.js.
         */
        $this->published('auto:hero', 'https://cdn.test/old.jpg');
        $this->published('auto:heroAlt', 'A dashboard on a laptop');

        $this->store->put('auto:hero', 'https://cdn.test/new.jpg', true);
        $this->store->put('auto:heroAlt', 'A dashboard on a laptop', true);
        $this->store->putStyle('s-hero', [], true);

        $this->assertSame(1, $this->store->pending(), 'a replaced picture is still more than one change');
    }

    public function test_clearing_a_description_the_markup_supplied_is_a_change(): void
    {
        /*
         * Why the store cannot simply ignore empty writes. Nothing is stored
         * for this key because the words came from the page itself; emptying
         * it is somebody saying "no description", and the page will differ.
         */
        $this->store->put('auto:heroAlt', '', true);

        $this->assertSame(1, $this->store->pending());
    }
}
