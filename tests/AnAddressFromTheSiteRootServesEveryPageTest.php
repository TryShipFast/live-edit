<?php

namespace ShipFast\LiveEdit\Tests;

use PHPUnit\Framework\TestCase;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Support\SiteRootAddress;

/**
 * A link a host keys once for every page (a shared header's "Fees") is saved
 * from the site's root ("~/fees/") and written out for each page by the way up
 * to the root its element carries (data-edit-href-root). The browser does the
 * same in resources/js/site-address.js (tests/js/an-address-from-the-site-root.test.js).
 */
class AnAddressFromTheSiteRootServesEveryPageTest extends TestCase
{
    public function test_an_address_from_the_root_is_written_for_each_depth(): void
    {
        $this->assertSame('fees/#w1-2', SiteRootAddress::here('~/fees/#w1-2', ''));
        $this->assertSame('../fees/#w1-2', SiteRootAddress::here('~/fees/#w1-2', '../'));
        $this->assertSame('../../fees/', SiteRootAddress::here('~/fees/', '../../'));
        $this->assertSame('./', SiteRootAddress::here('~/', ''));
        $this->assertSame('../', SiteRootAddress::here('~/', '../'));
    }

    public function test_any_other_address_is_applied_as_it_was_saved(): void
    {
        foreach (['fees/', '../fees/', '/fees', 'https://example.com/', '#top', 'mailto:a@b.c', 'tel:+234'] as $saved) {
            $this->assertSame($saved, SiteRootAddress::here($saved, '../'));
        }
    }

    public function test_the_server_applies_it_where_the_element_says_where_the_root_is(): void
    {
        $page = '<header><a href="../fees/" data-edit-href="tpl:k" data-edit-href-root="../">Fees</a>'
            .'<a href="../visit/" data-edit-href="tpl:v">Visit</a></header>';

        $html = (new MarkupScanner)->applyOverrides($page, ['tpl:k' => '~/fees/#w1-2', 'tpl:v' => '../visit/#book']);

        $this->assertStringContainsString('href="../fees/#w1-2"', $html);
        $this->assertStringContainsString('href="../visit/#book"', $html);
    }
}
