<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Content\PageAllowance;
use ShipFast\LiveEdit\Domain\Content\SitePage;

/**
 * A plan can cover fewer pages than the site has.
 *
 * Free edits one page: enough to put the editor on your own homepage and watch
 * it work, which is the demonstration that sells this, and not enough to run a
 * website on. Everything above it is unlimited.
 *
 * The engine counts and has never heard of a plan. It is handed a number,
 * written onto the site by whoever sells the thing, and the whole vocabulary
 * that crosses that line is {"pages": 1}. A package that knew our price list
 * would have to be redeployed to every customer's server the day we changed
 * it.
 */
class OnePageOnTheFreePlanTest extends TestCase
{
    private function free(string $scope = 'site-1'): PageAllowance
    {
        return new PageAllowance($scope, ['pages' => 1]);
    }

    public function test_the_first_page_somebody_edits_is_theirs(): void
    {
        $this->assertTrue($this->free()->permits('/'));
    }

    public function test_the_same_page_keeps_working_for_ever(): void
    {
        // The entire promise of the free tier. Checked before the count, so
        // that returning to your one page is never mistaken for asking for
        // another.
        $allowance = $this->free();
        $allowance->permits('/about');

        $this->assertTrue($this->free()->permits('/about'));
        $this->assertTrue($this->free()->permits('/about'));
    }

    public function test_a_second_page_is_refused(): void
    {
        $this->free()->permits('/');

        $this->assertFalse($this->free()->permits('/pricing'));
    }

    public function test_a_refusal_does_not_quietly_claim_the_page(): void
    {
        /*
         * Otherwise the refusal spends the allowance it just refused: somebody
         * wanders onto a second page, is told no, goes back to the first, and
         * finds that one refused too because the second is now the claimed
         * one.
         */
        $this->free()->permits('/');
        $this->free()->permits('/pricing');

        $this->assertSame([''], $this->free()->claimed());
        $this->assertTrue($this->free()->permits('/'), 'their own page stopped working');
    }

    public function test_the_page_they_started_on_wins_rather_than_the_home_page(): void
    {
        // Plenty of businesses have something other than "/" as the page that
        // matters: a menu, a booking page, one long sales page reached from an
        // advert.
        $this->free()->permits('/menu');

        $this->assertFalse($this->free()->permits('/'));
        $this->assertTrue($this->free()->permits('/menu'));
    }

    public function test_a_trailing_slash_is_not_a_second_page(): void
    {
        // Three spellings of one page, and on an allowance of one a trailing
        // slash would otherwise cost somebody their free tier.
        $this->free()->permits('/about');

        $this->assertTrue($this->free()->permits('/about/'));
        $this->assertTrue($this->free()->permits('about'));
        $this->assertSame(1, SitePage::query()->count());
    }

    public function test_the_home_page_has_one_spelling(): void
    {
        $this->free()->permits('/');
        $this->free()->permits('');

        $this->assertSame(1, SitePage::query()->count());
    }

    public function test_a_query_string_page_is_its_own_page(): void
    {
        /*
         * A WordPress site with pretty permalinks switched off calls every
         * page "/", and the identity is in the query string. The adapter that
         * knows this appends it; stripping it here merged a whole site into
         * one page, which as a bug reads as "the free plan is unlimited" and
         * as "editing About rewrote the home page".
         */
        $this->free()->permits('/?id=2');

        $this->assertFalse($this->free()->permits('/?id=7'));
        $this->assertTrue($this->free()->permits('/?id=2'));
    }

    public function test_no_limit_means_no_limit(): void
    {
        $any = new PageAllowance('site-1', []);

        foreach (['/', '/about', '/pricing', '/blog/one', '/blog/two'] as $page) {
            $this->assertTrue($any->permits($page));
        }
    }

    public function test_a_service_that_says_nothing_leaves_them_editing(): void
    {
        /*
         * An unreachable service, an older service that does not send this,
         * and a customer on an unlimited plan all arrive here looking
         * identical. All three have to leave somebody editing: the opposite
         * default means our bad afternoon becomes their locked website.
         */
        $silent = new PageAllowance('site-1', ['pages' => null]);

        $this->assertNull($silent->limit());
        $this->assertTrue($silent->permits('/anything'));
    }

    public function test_a_bigger_allowance_allows_exactly_that_many(): void
    {
        $three = fn () => new PageAllowance('site-2', ['pages' => 3]);

        $this->assertTrue($three()->permits('/'));
        $this->assertTrue($three()->permits('/about'));
        $this->assertTrue($three()->permits('/pricing'));
        $this->assertFalse($three()->permits('/contact'));
    }

    public function test_two_sites_do_not_share_an_allowance(): void
    {
        $this->free('site-1')->permits('/');

        $this->assertTrue($this->free('site-2')->permits('/'), 'one site spent another site\'s allowance');
    }

    public function test_the_refusal_says_what_happened_without_naming_a_plan(): void
    {
        /*
         * The words for the upgrade belong to whoever sells it. Hardcoding
         * "upgrade to Basic" here would be wrong on every customer's server at
         * once the first time a tier was renamed.
         */
        $this->free()->permits('/');
        $refusal = $this->free()->refusal();

        $this->assertSame('page_limit', $refusal['reason']);
        $this->assertSame(1, $refusal['allowed']);
        $this->assertSame([''], $refusal['editing']);

        $this->assertStringNotContainsStringIgnoringCase('basic', $refusal['message']);
        $this->assertStringNotContainsStringIgnoringCase('upgrade', $refusal['message']);

        // And it answers the question they have not asked yet.
        $this->assertStringContainsStringIgnoringCase('live and unchanged', $refusal['message']);
    }
}
