<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Site\Platform;

/**
 * Which adapters are finished enough to be sold as finished: every one
 * (owner, 2 Nov 2026: "Every adapter is ready").
 *
 * React and Next.js were sold as a preview while anything rendered from an
 * array was not editable. That closed on 2026-09-30 (LIMITATIONS.md: rows in
 * client components are edited, added, removed and reordered; rows in server
 * components are edited), so the picker no longer warns about them, and no
 * description says a list is missing.
 */
class WhatIsSoldAsFinishedTest extends TestCase
{
    public function test_every_adapter_is_sold_as_finished(): void
    {
        foreach (Platform::cases() as $platform) {
            $this->assertFalse($platform->isPreview(), $platform->value.' is marked as a preview');
        }
    }

    public function test_a_finished_adapter_carries_no_apology(): void
    {
        // A caveat nobody needs is a caveat that talks somebody out of a stack that works.
        foreach (Platform::cases() as $platform) {
            $this->assertStringNotContainsStringIgnoringCase('not yet', $platform->describes());
        }
    }
}
