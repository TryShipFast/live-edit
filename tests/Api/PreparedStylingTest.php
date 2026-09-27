<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Application\Api\PrepareMarkup;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Styling that arrives with the page, from a host that owns it.
 *
 * WordPress keeps its client's words, their history and their pictures. Their
 * styling was the last thing still living here, so it now travels with the
 * page the same way the words do and we store none of it.
 *
 * The part worth testing hard is the boundary. The renderer writes values
 * straight into a `<style>` tag, which has always been safe because every
 * value it saw had been through the style policy on the way into our own
 * tables. Styling that arrives with the page has not been through anything.
 * A host is not the attacker here - it is passing on what a client typed into
 * a box, which is the same untrusted path as our own write endpoint, arriving
 * by a door that had no check on it.
 */
class PreparedStylingTest extends TestCase
{
    protected Site $site;

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create(['name' => 'Guitarist', 'slug' => 'guitarist']);
    }

    protected function prepare(string $html, ?array $styles, bool $editing = false): string
    {
        return app(PrepareMarkup::class)($this->site, $html, '/', $editing, [], $styles)['html'];
    }

    private const PAGE = '<html><head><title>x</title></head><body><p data-edit="a">Hello</p></body></html>';

    public function test_styling_sent_with_the_page_is_painted_into_it(): void
    {
        $html = $this->prepare(self::PAGE, ['published' => ['hero' => ['background' => '#112233']]]);

        $this->assertStringContainsString('[data-style="hero"]', $html);
        $this->assertStringContainsString('#112233', $html);
    }

    public function test_a_value_that_tries_to_close_the_style_tag_is_dropped(): void
    {
        // The whole reason this test file exists.
        $html = $this->prepare(self::PAGE, [
            'published' => ['hero' => ['background' => '#fff</style><script>alert(1)</script>']],
        ]);

        $this->assertStringNotContainsString('<script>', $html);
        $this->assertStringNotContainsString('</style><', $html);
    }

    public function test_one_bad_value_does_not_cost_the_others_on_the_same_element(): void
    {
        // Dropping the whole element would mean a single malformed colour
        // silently unstyling a section somebody spent an afternoon on.
        $html = $this->prepare(self::PAGE, [
            'published' => ['hero' => ['background' => 'not a colour at all }', 'paddingY' => '24']],
        ]);

        $this->assertStringContainsString('padding-top:24px', $html);
        $this->assertStringNotContainsString('not a colour', $html);
    }

    public function test_a_page_still_renders_when_every_saved_value_is_rubbish(): void
    {
        // Somebody visiting a site should not meet an error because one stored
        // colour is malformed. They should get the page, without it.
        $html = $this->prepare(self::PAGE, ['published' => ['hero' => ['background' => '}{<>']]]);

        $this->assertStringContainsString('Hello', $html);
    }

    public function test_held_styling_is_shown_to_the_editor_and_to_nobody_else(): void
    {
        $styles = [
            'published' => ['hero' => ['background' => '#111111']],
            'draft' => ['hero' => ['background' => '#222222']],
        ];

        $this->assertStringContainsString('#222222', $this->prepare(self::PAGE, $styles, true));

        $visitor = $this->prepare(self::PAGE, $styles);
        $this->assertStringContainsString('#111111', $visitor);
        $this->assertStringNotContainsString('#222222', $visitor);
    }

    public function test_a_host_that_sends_no_styling_still_has_its_own_looked_up(): void
    {
        // Sites with no data layer of their own keep their styling here, and
        // that path must not change.
        (new SiteStore($this->site))->putStyle('hero', ['background' => '#abcdef'], false);

        $this->assertStringContainsString('#abcdef', $this->prepare(self::PAGE, null));
    }

    public function test_sending_no_styling_at_all_means_the_site_has_none(): void
    {
        // Present and empty is a real answer - a site nobody has restyled -
        // and must not fall back to reading our tables.
        (new SiteStore($this->site))->putStyle('hero', ['background' => '#abcdef'], false);

        $this->assertStringNotContainsString('#abcdef', $this->prepare(self::PAGE, ['published' => []]));
    }
}
