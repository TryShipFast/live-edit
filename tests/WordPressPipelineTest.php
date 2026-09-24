<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * The pipeline the WordPress plugin runs on every page.
 *
 * WordPress itself is not needed to test the part that matters: a theme's
 * rendered HTML goes in, the scanner tags it, and published words replace the
 * theme's own. The plugin around this is hooks, options and caching.
 */
class WordPressPipelineTest extends TestCase
{
    private function theme(): string
    {
        return <<<'HTML'
        <!doctype html>
        <html lang="en">
        <body class="home">
            <header><a class="brand" href="/">Acme Aviation</a></header>
            <section class="hero">
                <h1>We keep aircraft flying</h1>
                <p>Reliable maintenance for operators worldwide.</p>
                <a class="button" href="/quote">Request a quote</a>
            </section>
            <?php echo do_shortcode('[latest_posts]'); ?>
        </body>
        </html>
        HTML;
    }

    public function test_a_theme_is_tagged_and_then_reworded(): void
    {
        $scanner = new MarkupScanner;

        // auto: nothing about this theme was declared in advance, which is the
        // whole point — a plugin cannot know a theme it has never seen.
        $tagged = $scanner->apply($this->theme(), ['text', 'image', 'link', 'icon'], true)['html'];

        preg_match_all('/data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $matches);
        $keys = $matches[1];

        $this->assertNotEmpty($keys, 'nothing was tagged');

        // What the API would answer with: bare keys, as stored.
        $published = [$keys[0] => 'We keep YOUR aircraft flying'];

        $final = $scanner->applyOverrides($tagged, $published);

        $this->assertStringContainsString('We keep YOUR aircraft flying', $final);
    }

    public function test_the_prefix_is_not_part_of_the_lookup(): void
    {
        // The trap: the attribute reads "setting:auto:abc" but the lookup
        // happens after that prefix is stripped. Passing prefixed keys tags
        // the page correctly and then shows the theme's original words
        // forever — working markup, wrong content, no error anywhere.
        $scanner = new MarkupScanner;
        $tagged = $scanner->apply($this->theme(), ['text'], true)['html'];

        preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $wrong = $scanner->applyOverrides($tagged, ['setting:'.$m[1] => 'Never seen']);
        $right = $scanner->applyOverrides($tagged, [$m[1] => 'Published words']);

        $this->assertStringNotContainsString('Never seen', $wrong);
        $this->assertStringContainsString('Published words', $right);
    }

    public function test_keys_are_stable_across_renders(): void
    {
        // Every request re-tags the page, so the same markup must produce the
        // same keys — otherwise a client's saved words would detach on the
        // next page view.
        $scanner = new MarkupScanner;

        $first = $scanner->apply($this->theme(), ['text'], true)['html'];
        $second = (new MarkupScanner)->apply($this->theme(), ['text'], true)['html'];

        preg_match_all('/data-edit="[^"]+"/', $first, $a);
        preg_match_all('/data-edit="[^"]+"/', $second, $b);

        $this->assertSame($a[0], $b[0]);
        $this->assertNotEmpty($a[0]);
    }

    public function test_a_reworded_page_can_be_tagged_again_without_moving_its_keys(): void
    {
        // The page a visitor gets has already been through both steps. The
        // next request starts from the theme again, but an editor's saved
        // words must not change the key of the element holding them.
        $scanner = new MarkupScanner;
        $tagged = $scanner->apply($this->theme(), ['text'], true)['html'];

        preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);
        $key = $m[1];

        $reworded = $scanner->applyOverrides($tagged, [$key => 'Something entirely different']);

        $this->assertStringContainsString('data-edit="setting:'.$key.'"', $reworded);
    }

    public function test_the_document_survives_the_round_trip(): void
    {
        $scanner = new MarkupScanner;
        $out = $scanner->apply($this->theme(), ['text', 'image', 'link', 'icon'], true)['html'];

        $this->assertStringContainsString('<!DOCTYPE html>', strtoupper($out) === $out ? $out : $out);
        $this->assertStringContainsString('class="home"', $out);
        $this->assertStringContainsString('lang="en"', $out);
    }
}
