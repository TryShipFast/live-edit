<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\AttributesAParserMayNotKeep;
use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * A page's own JavaScript still works after we have been through it.
 *
 * Reported from a live site: "Alpine Expression Error: Unexpected token '}'",
 * and a mobile menu that would not open. What was being served was
 *
 *     <button id="..." null="" :="" :aria-expanded="...">
 *
 * where the template had said
 *
 *     @click="group = (group === 'product' ? null : 'product')"
 *
 * The name `@click` was refused by the parser, which resynchronised somewhere
 * inside the value, and two of the expression's own words came out the far
 * side as attributes of their own. The listener was gone.
 *
 * It does not reproduce on libxml 2.15, which keeps the name - so the tests
 * below are written to fail on a machine where the parser is fine, by checking
 * the protection itself rather than only its effect. A test that asserted
 * nothing more than "@click is still there" would pass here without any of the
 * code it is meant to be guarding.
 *
 * This is also the clearest example of why a page is parsed as little as
 * possible. Every one of these attributes belongs to the customer, we have no
 * business touching any of them, and the only safe handling is to hand them
 * back exactly as they arrived.
 */
class AnAlpineListenerSurvivesBeingScannedTest extends TestCase
{
    private const DRAWER = '<button type="button" id="lk-drawer-product-toggle"'
        ." @click=\"group = (group === 'product' ? null : 'product')\""
        ." :aria-expanded=\"group === 'product' ? 'true' : 'false'\""
        .'>Product</button>';

    public function test_the_name_a_parser_may_refuse_never_reaches_the_parser(): void
    {
        /*
         * The assertion that does not depend on which libxml this machine has.
         * Whatever the parser would have done with `@click`, it is not given
         * the chance.
         */
        $protected = AttributesAParserMayNotKeep::protect(self::DRAWER);

        $this->assertStringNotContainsString('@click=', $protected);
        $this->assertStringContainsString('x-live-edit-event-click=', $protected);
    }

    public function test_putting_it_back_is_the_exact_inverse_of_taking_it_off(): void
    {
        // Byte for byte, because this runs over every page of every site and
        // a transformation that is nearly reversible is a corruption.
        $this->assertSame(
            self::DRAWER,
            AttributesAParserMayNotKeep::restore(AttributesAParserMayNotKeep::protect(self::DRAWER))
        );
    }

    public function test_the_expression_itself_is_left_alone(): void
    {
        /*
         * Only the name is rewritten. The value is a customer's JavaScript and
         * a single character changed in it is a bug we caused.
         */
        $protected = AttributesAParserMayNotKeep::protect(self::DRAWER);

        $this->assertStringContainsString("\"group = (group === 'product' ? null : 'product')\"", $protected);
    }

    public function test_a_greater_than_inside_an_expression_is_not_mistaken_for_the_end_of_the_tag(): void
    {
        /*
         * The reason the rename matches on the attribute name rather than by
         * finding tags first. An Alpine expression is exactly where a bare `>`
         * turns up, and a regex that tried to find the end of the tag would
         * stop in the middle of the customer's code.
         */
        $markup = '<button @click="count > 1 && go()" @keydown.enter="go()">Go</button>';

        $protected = AttributesAParserMayNotKeep::protect($markup);

        $this->assertStringNotContainsString('@click=', $protected);
        $this->assertStringNotContainsString('@keydown.enter=', $protected);
        $this->assertSame($markup, AttributesAParserMayNotKeep::restore($protected));
    }

    public function test_an_at_sign_that_is_not_an_attribute_round_trips_anyway(): void
    {
        /*
         * The rename is deliberately imprecise, and this is what makes that
         * safe: an `@` in prose, in a stylesheet or in a script is renamed on
         * the way in and renamed back on the way out, so the document is
         * returned unchanged whether the guess was right or wrong.
         */
        $markup = '<style>@media (min-width: 40rem) { .a { color: red } }</style>'
            .'<p>Write to hello @example = the address, or see @media = the rule.</p>';

        $this->assertSame($markup, AttributesAParserMayNotKeep::restore(AttributesAParserMayNotKeep::protect($markup)));
    }

    public function test_a_scanned_page_keeps_every_listener_it_arrived_with(): void
    {
        $theme = '<html lang="en"><body>'.self::DRAWER.'</body></html>';

        $tagged = (new MarkupScanner)->apply($theme, ['text', 'image'], true)['html'];

        $this->assertStringContainsString("@click=\"group = (group === 'product' ? null : 'product')\"", $tagged);

        // The exact shape the live site was serving. Named rather than implied,
        // because this is the thing somebody will search for when it happens
        // again.
        $this->assertStringNotContainsString('null=""', $tagged);
        $this->assertStringNotContainsString(':=""', $tagged);

        // And the marker is an implementation detail that must never be served.
        $this->assertStringNotContainsString('x-live-edit-event-', $tagged);
    }

    public function test_applying_a_client_s_words_keeps_them_too(): void
    {
        /*
         * The path that actually runs on a visitor's page. Tagging happens
         * once; overrides are applied on every request, so a fault here is
         * served to everybody.
         */
        $theme = '<html lang="en"><body>'
            .'<img src="/hero.jpg" alt="A hero">'
            .self::DRAWER
            .'</body></html>';

        $tagged = (new MarkupScanner)->apply($theme, ['text', 'image'], true)['html'];

        preg_match('/data-edit-img="setting:([^"]+)"/', $tagged, $found);

        $this->assertNotEmpty($found, 'The picture has to be keyed for this test to exercise anything.');

        $served = (new MarkupScanner)->applyOverrides($tagged, [$found[1] => '/storage/live/theirs.jpg']);

        $this->assertStringContainsString('/storage/live/theirs.jpg', $served);
        $this->assertStringContainsString('@click=', $served);
        $this->assertStringNotContainsString('x-live-edit-event-', $served);
    }
}
