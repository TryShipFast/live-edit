<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Site\Platform;

/**
 * Which adapters are finished enough to be sold as finished.
 *
 * React and Next.js are not, for a specific reason rather than a general
 * nervousness: the codemod tags a JSX element whose only child is a plain
 * string, which is the right rule, and it leaves anything rendered from an
 * array untouched. On the template this was measured against, that is the
 * catalogue cards, the categories, the paging, the quick links and the
 * testimonials — most of what a visitor reads.
 *
 * It lives on the platform rather than in a marketing decision so that
 * somebody choosing one is told while they are choosing. Listing React beside
 * Laravel and WordPress as an equal, and letting a customer discover the gap
 * on their own site, is the expensive way for them to find out.
 */
class WhatIsSoldAsFinishedTest extends TestCase
{
    public function test_react_and_next_are_marked_as_preview(): void
    {
        $this->assertTrue(Platform::React->isPreview());
        $this->assertTrue(Platform::NextJs->isPreview());
    }

    public function test_the_adapters_that_have_been_driven_end_to_end_are_not(): void
    {
        // Laravel, WordPress and plain HTML have had the whole journey run
        // through them on real, content-rich sites: detect, edit, save,
        // reload, navigate, publish, then look again as a visitor.
        $this->assertFalse(Platform::Laravel->isPreview());
        $this->assertFalse(Platform::WordPress->isPreview());
        $this->assertFalse(Platform::Html->isPreview());
    }

    public function test_the_description_says_what_is_missing_rather_than_hinting(): void
    {
        /*
         * "Preview" on its own tells somebody nothing they can act on. What
         * they need is the one sentence that decides whether this suits their
         * site: headings yes, lists no.
         */
        foreach ([Platform::React, Platform::NextJs] as $platform) {
            $this->assertStringContainsStringIgnoringCase(
                'lists built from data are not yet',
                $platform->describes(),
                $platform->value.' does not say what is missing'
            );
        }
    }

    public function test_a_finished_adapter_carries_no_apology(): void
    {
        // The other half: a caveat on everything is a caveat nobody reads.
        foreach ([Platform::Laravel, Platform::WordPress, Platform::Html] as $platform) {
            $this->assertStringNotContainsStringIgnoringCase('not yet', $platform->describes());
        }
    }
}
