<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Content\EditPolicy;

/**
 * A key belonging to one row of a list is still a key this site may write.
 *
 * The scanner gives every repeated item an id and composes it onto the keys
 * inside it, so a heading in the third card is `auto:1a2b3c@i2` rather than
 * `auto:1a2b3c`. That is the whole mechanism by which three cards built from
 * the same markup hold three different sets of words.
 *
 * The policy that decides what may be written never learned about it. It
 * matched `^auto:[a-f0-9]{6,64}$`, which an item key cannot match, so every
 * edit inside every list item was refused as an unknown setting - and refused
 * with a 422, which the editor shows as a save that failed for no stated
 * reason.
 *
 * Met on learnkasts.com on 2026-09-30: replacing a picture and changing a
 * sentence both failed, three requests each, and the markup that came back
 * with the report had `data-edit-item="i0"` on it. The third time this year
 * that a key the scanner writes has been rejected by the policy that guards
 * writing it, after picture descriptions and after `Srcset`, so the tests
 * below cover the shape rather than the one key that was reported.
 */
class EditingOneRowOfAListIsAllowedTest extends TestCase
{
    private function policy(): EditPolicy
    {
        config()->set('live-edit.auto_keys', true);
        config()->set('live-edit.settings', ['tagline', 'posts.title']);

        return new EditPolicy;
    }

    public function test_a_scanned_key_inside_a_list_item_may_be_written(): void
    {
        $this->assertTrue(
            $this->policy()->permitsKey('auto:6c246fb8f7e4@i0'),
            'an edit inside a list item was refused as an unknown setting'
        );
    }

    public function test_a_row_added_by_the_editor_may_be_written_too(): void
    {
        // Ids minted when somebody duplicates a card: "n" and a base-36 stamp.
        $this->assertTrue($this->policy()->permitsKey('auto:6c246fb8f7e4@nm2x8p1q'));
    }

    public function test_a_declared_key_carries_its_item_the_same_way(): void
    {
        // Declared keys are the shape a developer writes by hand, and an
        // allowlist naturally holds the base rather than one entry per row.
        $this->assertTrue($this->policy()->permitsKey('posts.title@101'));
        $this->assertTrue($this->policy()->permitsKey('posts.title@my-first-post'));
    }

    public function test_a_picture_description_inside_a_row_may_be_written(): void
    {
        // The suffix lands after the item, because the editor composes the
        // companion onto whatever key the element already carries. Both
        // orders are accepted rather than relying on that never changing.
        $this->assertTrue($this->policy()->permitsKey('auto:6c246fb8f7e4@i0Alt'));
        $this->assertTrue($this->policy()->permitsKey('auto:6c246fb8f7e4Alt@i0'));
    }

    public function test_an_undeclared_key_is_still_refused_however_it_is_dressed(): void
    {
        // The item suffix must not become a way past the allowlist.
        $policy = $this->policy();

        $this->assertFalse($policy->permitsKey('not_declared@i0'));
        $this->assertFalse($policy->permitsKey('auto:notahash@i0'));
        $this->assertFalse($policy->permitsKey('@i0'));
    }

    public function test_the_allowlist_still_means_something_when_auto_keys_are_off(): void
    {
        config()->set('live-edit.auto_keys', false);
        config()->set('live-edit.settings', ['posts.title']);

        $policy = new EditPolicy;

        $this->assertTrue($policy->permitsKey('posts.title@101'));
        $this->assertFalse($policy->permitsKey('auto:6c246fb8f7e4@i0'));
    }

    public function test_a_link_inside_a_row_is_still_checked_for_where_it_points(): void
    {
        /*
         * The rule that matters most here. Accepting the item suffix must not
         * accidentally stop a key reading as a link: "…Href@i0" does not end
         * in "Href", and a value check that looked at the whole key would let
         * "javascript:" through on every row of every list. That is not a
         * tidiness rule, it is the one that stops an edit becoming script in
         * a visitor's browser.
         */
        $this->expectExceptionMessage('Links must start with');

        $this->policy()->assert('auto:6c246fb8f7e4Href@i0', 'javascript:alert(1)');
    }
}
