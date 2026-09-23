<?php

namespace ShipFast\LiveEdit\Tests;

use PHPUnit\Framework\TestCase;
use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * The auto-mapper's recognition engine — proves it finds the editable
 * surface of arbitrary HTML with no prior knowledge of the site.
 */
class MarkupScannerTest extends TestCase
{
    protected function scan(string $html): array
    {
        return (new MarkupScanner)->scan($html);
    }

    protected function keysOfKind(array $result, string $kind): array
    {
        return array_map(fn ($c) => $c['sample'], array_values(array_filter($result['candidates'], fn ($c) => $c['kind'] === $kind)));
    }

    public function test_auto_apply_writes_stable_keys_that_survive_text_edits(): void
    {
        $html = '<section><h1>Hello</h1><p>World</p></section>';
        $keyOf = fn ($doc) => preg_match('/<h1 data-edit="setting:(auto:[a-f0-9]{12})"/', $doc, $m) ? $m[1] : null;

        $a = (new MarkupScanner)->apply($html, ['text'], true)['html'];
        $b = (new MarkupScanner)->apply($html, ['text'], true)['html'];
        $this->assertSame($a, $b, 'same HTML yields identical auto-keys');
        $this->assertNotNull($keyOf($a));

        // The key is structural, not content-derived, so editing the text keeps it.
        $edited = '<section><h1>A completely different heading</h1><p>World</p></section>';
        $this->assertSame($keyOf($a), $keyOf((new MarkupScanner)->apply($edited, ['text'], true)['html']));
    }

    public function test_apply_overrides_injects_stored_values_and_leaves_siblings_alone(): void
    {
        $tagged = (new MarkupScanner)->apply('<section><h1>Hello</h1><p>World</p></section>', ['text'], true)['html'];
        preg_match('/<h1 data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => 'Bonjour']);

        $this->assertStringContainsString('>Bonjour</h1>', $rendered);
        $this->assertStringContainsString('>World</p>', $rendered);
    }

    public function test_auto_apply_makes_every_element_styleable(): void
    {
        $html = (new MarkupScanner)->apply('<section><div class="card"><h1>Hi</h1></div></section>', ['text'], true)['html'];

        // The band, the container div, and the heading are all styleable.
        $this->assertMatchesRegularExpression('/<section[^>]*data-style="s[a-f0-9]{12}"/', $html);
        $this->assertMatchesRegularExpression('/<div[^>]*data-style="s[a-f0-9]{12}"/', $html);
        $this->assertMatchesRegularExpression('/<h1[^>]*data-style="s[a-f0-9]{12}"/', $html);
        // No chips — clicking the element in edit mode opens the editor.
        $this->assertStringNotContainsString('data-le-chip', $html);
        $this->assertStringContainsString('data-style-props="background,backgroundImage,textColor,fontSize,paddingY,paddingX,radius,hidden"', $html);
    }

    public function test_auto_apply_makes_a_links_text_and_href_editable(): void
    {
        $html = (new MarkupScanner)->apply('<nav><a href="/go">Get a quote</a></nav>', ['text', 'link'], true)['html'];

        // The anchor carries both a text key and a distinct href key.
        $this->assertMatchesRegularExpression('/<a [^>]*data-edit="setting:auto:[a-f0-9]{12}"/', $html);
        $this->assertMatchesRegularExpression('/data-edit-href="auto:[a-f0-9]{12}"/', $html);
    }

    public function test_apply_overrides_updates_a_link_href(): void
    {
        $tagged = (new MarkupScanner)->apply('<nav><a href="/go">Quote</a></nav>', ['text', 'link'], true)['html'];
        preg_match('/data-edit-href="(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => 'https://example.com/new']);

        $this->assertStringContainsString('href="https://example.com/new"', $rendered);
    }

    protected function faqList(): string
    {
        return '<div class="faqs">'
            .'<div class="faq"><h3>One</h3></div>'
            .'<div class="faq"><h3>Two</h3></div>'
            .'<div class="faq"><h3>Three</h3></div>'
            .'</div>';
    }

    protected function autoKeyOfHeading(string $html): ?string
    {
        $tagged = (new MarkupScanner)->apply($html, ['text'], true)['html'];
        preg_match('/<h1 data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        return $m[1] ?? null;
    }

    public function test_keys_survive_an_unrelated_change_elsewhere_in_the_page(): void
    {
        // The risk this guards against: a developer edits one part of the
        // template and silently orphans the client's saved content everywhere
        // below it. Anchoring to the nearest id keeps the blast radius local.
        $before = '<div id="hero"><h1>Welcome</h1></div>';
        $after = '<div class="promo"><p>New band</p></div><div id="hero"><h1>Welcome</h1></div>';

        $this->assertNotNull($this->autoKeyOfHeading($before));
        $this->assertSame($this->autoKeyOfHeading($before), $this->autoKeyOfHeading($after));
    }

    public function test_a_key_with_no_id_to_anchor_to_still_depends_on_position(): void
    {
        // The honest boundary of the above: with no landmark id anywhere above
        // it, an element is still identified by position.
        $before = '<div class="hero"><h1>Welcome</h1></div>';
        $after = '<div class="promo"><p>New band</p></div><div class="hero"><h1>Welcome</h1></div>';

        $this->assertNotSame($this->autoKeyOfHeading($before), $this->autoKeyOfHeading($after));
    }

    public function test_auto_apply_gives_list_items_stable_ids(): void
    {
        $html = (new MarkupScanner)->apply($this->faqList(), ['text'], true)['html'];

        $this->assertMatchesRegularExpression('/data-edit-list="auto:[a-f0-9]{12}"/', $html);
        $this->assertStringContainsString('data-edit-item="i0"', $html);
        $this->assertStringContainsString('data-edit-item="i2"', $html);
    }

    public function test_removing_a_list_item_leaves_the_other_items_keys_untouched(): void
    {
        // The point of item-relative keys: delete the second FAQ and the third
        // one keeps the key its saved answer is stored against.
        $tagged = (new MarkupScanner)->apply($this->faqList(), ['text'], true)['html'];
        preg_match('/data-edit-list="(auto:[a-f0-9]+)"/', $tagged, $list);

        $keyOfThird = function (string $html) {
            preg_match('/data-edit-item="i2"[^>]*>\s*<h3 data-edit="setting:(auto:[a-f0-9]+)"/', $html, $m);

            return $m[1] ?? null;
        };

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$list[1] => json_encode(['i0', 'i2'])]);

        $this->assertNotNull($keyOfThird($tagged));
        $this->assertSame($keyOfThird($tagged), $keyOfThird($rendered));
    }

    public function test_apply_overrides_removes_a_list_item(): void
    {
        $tagged = (new MarkupScanner)->apply($this->faqList(), ['text'], true)['html'];
        preg_match('/data-edit-list="(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => json_encode(['i0', 'i2'])]);

        $this->assertStringContainsString('One', $rendered);
        $this->assertStringContainsString('Three', $rendered);
        $this->assertStringNotContainsString('Two', $rendered);
    }

    public function test_apply_overrides_adds_a_list_item_with_its_own_keys(): void
    {
        $tagged = (new MarkupScanner)->apply($this->faqList(), ['text'], true)['html'];
        preg_match('/data-edit-list="(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => json_encode(['i0', 'i1', 'i2', 'n7'])]);

        $this->assertSame(4, substr_count($rendered, 'data-edit-item='));
        $this->assertStringContainsString('data-edit-item="n7"', $rendered);
        // The copy must not share the original's content key.
        preg_match('/data-edit-item="i0"[^>]*>\s*<h3 data-edit="setting:(auto:[a-f0-9]+)"/', $rendered, $first);
        preg_match('/data-edit-item="n7"[^>]*>\s*<h3 data-edit="setting:(auto:[a-f0-9]+)"/', $rendered, $copy);
        $this->assertNotSame($first[1], $copy[1]);
    }

    public function test_it_recognises_headings_and_paragraphs_as_text(): void
    {
        $result = $this->scan('<section><h1>Welcome home</h1><p>We build things for people.</p></section>');

        $texts = $this->keysOfKind($result, 'text');
        $this->assertContains('Welcome home', $texts);
        $this->assertContains('We build things for people.', $texts);
        $this->assertSame(2, $result['summary']['text']);
    }

    public function test_it_recognises_images_and_links(): void
    {
        $result = $this->scan('<div><img src="/hero.jpg" alt="A hero"><a href="/contact">Contact us</a></div>');

        $this->assertSame(1, $result['summary']['image'] ?? 0);
        $this->assertSame('/hero.jpg', $this->keysOfKind($result, 'image')[0]);
        $this->assertSame(1, $result['summary']['link'] ?? 0);
        $this->assertSame('/contact', $this->keysOfKind($result, 'link')[0]);
    }

    public function test_a_repeated_card_grid_is_one_collection_not_many_texts(): void
    {
        $html = '<div class="grid">'
            .'<article class="card"><h3>One</h3><p>First</p></article>'
            .'<article class="card"><h3>Two</h3><p>Second</p></article>'
            .'<article class="card"><h3>Three</h3><p>Third</p></article>'
            .'</div>';

        $result = $this->scan($html);

        $this->assertSame(1, $result['summary']['collection'] ?? 0, 'The grid should be a single collection');
        // the item's structure is grouped into the collection's fields,
        // not emitted as loose page-level settings
        $this->assertArrayNotHasKey('text', $result['summary']);
        $collection = array_values(array_filter($result['candidates'], fn ($c) => $c['kind'] === 'collection'))[0];
        $this->assertSame(['title', 'text'], $collection['fields']);
    }

    public function test_a_collection_of_richer_cards_derives_all_its_fields(): void
    {
        $html = '<div class="grid">'
            .'<div class="card"><svg></svg><h3>Fast</h3><p>Quick</p><img src="/a.jpg"><a href="/x">More</a></div>'
            .'<div class="card"><svg></svg><h3>Safe</h3><p>Secure</p><img src="/b.jpg"><a href="/y">More</a></div>'
            .'</div>';
        $result = $this->scan($html);
        $collection = array_values(array_filter($result['candidates'], fn ($c) => $c['kind'] === 'collection'))[0];

        $this->assertSame(['icon', 'title', 'text', 'image', 'link'], $collection['fields']);
    }

    public function test_a_bare_link_list_is_a_collection(): void
    {
        $html = '<nav><a href="/a">A</a><a href="/b">B</a><a href="/c">C</a></nav>';
        $result = $this->scan($html);

        $this->assertSame(1, $result['summary']['collection'] ?? 0);
    }

    public function test_landmarks_and_mixed_wrappers_are_not_collections(): void
    {
        // a <main> holding two differently-classed sections is page structure,
        // not a repeatable list
        $html = '<main><section class="hero"><h1>Hi</h1></section><section class="about"><h2>About</h2></section></main>';
        $result = $this->scan($html);

        $this->assertArrayNotHasKey('collection', $result['summary']);
        $this->assertSame(2, $result['summary']['text']);
    }

    public function test_it_ignores_scripts_styles_and_svg(): void
    {
        $html = '<div><script>alert(1)</script><style>.a{}</style><svg><path/></svg><p>Real text</p></div>';
        $result = $this->scan($html);

        $this->assertSame(1, $result['summary']['text']);
        $this->assertArrayNotHasKey('collection', $result['summary']);
    }

    public function test_it_recovers_a_realistic_landing_page_surface(): void
    {
        $html = <<<'HTML'
        <body>
            <header><a href="/"><img src="/logo.png" alt="Logo"></a>
                <nav><a href="/about">About</a><a href="/pricing">Pricing</a></nav>
            </header>
            <main>
                <section class="hero">
                    <span class="eyebrow">New</span>
                    <h1>Ship faster</h1>
                    <p>The platform for building sites.</p>
                    <a href="/start">Get started</a>
                    <img src="/hero.jpg" alt="Product">
                </section>
                <section class="features">
                    <div class="grid">
                        <div class="feature"><h3>Fast</h3><p>Very fast.</p></div>
                        <div class="feature"><h3>Safe</h3><p>Very safe.</p></div>
                        <div class="feature"><h3>Simple</h3><p>Very simple.</p></div>
                    </div>
                </section>
            </main>
        </body>
        HTML;

        $result = $this->scan($html);
        $texts = $this->keysOfKind($result, 'text');

        // every distinct copy block is recognised
        foreach (['New', 'Ship faster', 'The platform for building sites.'] as $copy) {
            $this->assertContains($copy, $texts, "Missed editable text: {$copy}");
        }
        // both images, the CTA + nav links, and the feature grid as a collection
        $this->assertSame(2, $result['summary']['image']);
        $this->assertGreaterThanOrEqual(1, $result['summary']['collection']);
        $this->assertContains('/start', $this->keysOfKind($result, 'link'));
    }

    public function test_apply_writes_tags_onto_recognised_elements(): void
    {
        $html = '<section><h1>Ship faster</h1><p>Do more.</p><img src="/a.jpg" alt="Art"><a href="/go">Go</a></section>';
        $result = (new MarkupScanner)->apply($html);

        $this->assertStringContainsString('data-edit="setting:shipFaster"', $result['html']);
        $this->assertStringContainsString('data-edit-img="setting:', $result['html']);
        $this->assertStringContainsString('data-edit-href="', $result['html']);
        $this->assertSame(4, $result['applied']);
    }

    public function test_apply_leaves_collections_for_manual_wiring(): void
    {
        $html = '<div class="grid"><div class="card"><h3>A</h3></div><div class="card"><h3>B</h3></div></div>';
        $result = (new MarkupScanner)->apply($html);

        // the collection container is not auto-tagged (needs a model + ids)
        $this->assertStringNotContainsString('record:', $result['html']);
        $this->assertArrayHasKey('collection', $result['skipped']);
    }

    public function test_apply_is_idempotent(): void
    {
        $html = '<p>Hello</p>';
        $once = (new MarkupScanner)->apply($html)['html'];
        $twice = (new MarkupScanner)->apply($once)['html'];

        $this->assertSame($once, $twice);
        $this->assertSame(1, substr_count($twice, 'data-edit='));
    }

    public function test_apply_preserves_a_full_document_shell(): void
    {
        $html = '<!doctype html><html><head><title>T</title></head><body><h1>Hi</h1></body></html>';
        $result = (new MarkupScanner)->apply($html);

        $this->assertStringContainsString('<title>T</title>', $result['html']);
        $this->assertStringContainsString('data-edit="setting:hi"', $result['html']);
    }

    public function test_it_recognises_inline_svg_icons(): void
    {
        $result = $this->scan('<button aria-label="Menu"><svg><path d="M0 0"/></svg></button>');
        $this->assertSame(1, $result['summary']['icon'] ?? 0);
    }

    public function test_it_recognises_media_embeds(): void
    {
        $result = $this->scan('<div><video src="/v.mp4"></video><iframe src="https://maps"></iframe></div>');
        $this->assertSame(2, $result['summary']['media'] ?? 0);
        $this->assertContains('/v.mp4', array_map(fn ($c) => $c['sample'], array_filter($result['candidates'], fn ($c) => $c['kind'] === 'media')));
    }

    public function test_it_recognises_a_css_background_image(): void
    {
        $result = $this->scan('<section style="background-image:url(/hero.jpg)"><h1>Hi</h1></section>');
        $this->assertSame(1, $result['summary']['background'] ?? 0);
        // it still recurses in — the heading inside is found too
        $this->assertSame(1, $result['summary']['text'] ?? 0);
        $bg = array_values(array_filter($result['candidates'], fn ($c) => $c['kind'] === 'background'))[0];
        $this->assertSame('/hero.jpg', $bg['sample']);
    }

    public function test_it_recognises_form_placeholders(): void
    {
        $result = $this->scan('<form><input placeholder="Your email"><textarea placeholder="Message"></textarea></form>');
        $this->assertSame(2, $result['summary']['placeholder'] ?? 0);
    }

    public function test_it_recognises_table_and_definition_text(): void
    {
        $result = $this->scan('<table><tr><th>Plan</th><td>Free</td></tr></table><dl><dt>Term</dt><dd>Meaning</dd></dl>');
        $texts = $this->keysOfKind($result, 'text');
        foreach (['Plan', 'Free', 'Term', 'Meaning'] as $t) {
            $this->assertContains($t, $texts, "Missed: {$t}");
        }
    }
}
