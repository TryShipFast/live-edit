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

    public function test_a_bold_phrase_inside_a_sentence_can_be_edited_on_its_own(): void
    {
        /*
         * It was the one part of a sentence a client could not touch. The
         * paragraph was editable and its emphasis was not, so "we design for
         * the STREET IT STANDS ON" could be reworded everywhere except the
         * three words the designer had chosen to emphasise.
         *
         * Only safe since the applier stopped flattening a sentence into its
         * first run of text. Before that, tagging both the paragraph and the
         * phrase inside it meant an edit to either could destroy the other.
         */
        $html = '<p>We design for the <strong>street it stands on</strong>, not a photograph.</p>';

        $applied = (new MarkupScanner)->apply($html, ['text'], true)['html'];

        $this->assertMatchesRegularExpression('/<strong data-edit="setting:auto:[a-f0-9]{12}"/', $applied);
        $this->assertMatchesRegularExpression('/<p data-edit="setting:auto:[a-f0-9]{12}"/', $applied);
    }

    public function test_the_paragraph_and_the_phrase_inside_it_keep_separate_keys(): void
    {
        // Two targets, two histories. Sharing a key would make an edit to one
        // silently rewrite the other.
        $html = '<p>We design for the <strong>street it stands on</strong>, not a photograph.</p>';

        $applied = (new MarkupScanner)->apply($html, ['text'], true)['html'];

        preg_match_all('/data-edit="setting:(auto:[a-f0-9]{12})"/', $applied, $found);

        $this->assertCount(2, $found[1]);
        $this->assertCount(2, array_unique($found[1]));
    }

    public function test_an_edit_either_side_of_a_phrase_leaves_the_phrase_where_it_was(): void
    {
        /*
         * The browser's applier and this one have to give the same answer:
         * this runs for a host that renders server-side, content.js runs for
         * everybody else, and the same edit reading differently live and in an
         * export is worse than either being wrong.
         *
         * Changing a word on each side of the bold phrase is not one
         * contiguous change, so it used to collapse the sentence into a single
         * run and leave the phrase trailing it. The words touching the phrase
         * were never edited, and they are what says where it still belongs.
         */
        $scanner = new MarkupScanner;
        $html = '<p>We design for the <strong>street it stands on</strong>, not a photograph.</p>';
        $tagged = $scanner->apply($html, ['text'], true)['html'];

        preg_match('/<p data-edit="setting:(auto:[a-f0-9]{12})"/', $tagged, $m);

        $applied = $scanner->applyOverrides($tagged, [$m[1] => 'We build for the , not a postcard.']);

        $this->assertStringContainsString('We build for the <strong', $applied);
        $this->assertStringContainsString('</strong>, not a postcard.', $applied);
    }

    public function test_it_splits_on_characters_so_an_accented_sentence_is_not_cut_in_half(): void
    {
        // Offsets counted in bytes would fall inside a letter here, which in
        // Yoruba or French is most sentences rather than an edge case.
        $scanner = new MarkupScanner;
        $html = '<p>Nous créons pour la <strong>rue</strong>, pas pour une école.</p>';
        $tagged = $scanner->apply($html, ['text'], true)['html'];

        preg_match('/<p data-edit="setting:(auto:[a-f0-9]{12})"/', $tagged, $m);

        $applied = $scanner->applyOverrides($tagged, [$m[1] => 'Nous bâtissons pour la , pas pour une carte.']);

        $this->assertStringContainsString('Nous bâtissons pour la <strong', $applied);
        $this->assertStringContainsString('</strong>, pas pour une carte.', $applied);
    }

    public function test_a_decoration_with_no_words_of_its_own_is_not_offered_as_text(): void
    {
        // The pulsing dot beside a badge. Offering it as editable text put an
        // empty change in somebody's publish list for a thing they never
        // touched and could not see.
        $html = '<div class="badge"><span class="dot"></span> Next cohort starts in May</div>';

        $applied = (new MarkupScanner)->apply($html, ['text'], true)['html'];

        $this->assertStringNotContainsString('<span class="dot" data-edit', $applied);
        $this->assertMatchesRegularExpression('/<div class="badge" data-edit="setting:auto:[a-f0-9]{12}"/', $applied);
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

    public function test_a_distinctive_class_anchors_a_key_just_as_an_id_does(): void
    {
        // Modern pages have almost no ids and almost no sectioning elements —
        // they are divs all the way down — but they are generous with classes,
        // and a class string appearing once on a page identifies its element
        // as well as an id would.
        //
        // Measured on real sites before this existed: inserting one element at
        // the top of the document moved 84% of the keys on a page built with a
        // WordPress builder, and 96% on Tailwind's own site. Every edit saved
        // against them would have come loose.
        $before = '<div class="hero"><h1>Welcome</h1></div>';
        $after = '<div class="promo"><p>New band</p></div><div class="hero"><h1>Welcome</h1></div>';

        $this->assertSame($this->autoKeyOfHeading($before), $this->autoKeyOfHeading($after));
    }

    public function test_an_element_with_nothing_above_it_is_named_by_what_it_holds(): void
    {
        // A class on forty cards says nothing about which card this is, so it
        // cannot stand in for a name. What is left is the element's own words —
        // and naming it by those survives the page being rearranged, where
        // naming it by position did not.
        //
        // Safe to key on because a tagged document always holds the THEME's
        // text: content is applied when the page is served and never written
        // back, so a client can replace every word and the name does not move.
        $before = '<div class="card"><h1>Welcome</h1></div><div class="card"><p>x</p></div>';
        $after = '<div class="promo"><p>New band</p></div>'.$before;

        $this->assertSame($this->autoKeyOfHeading($before), $this->autoKeyOfHeading($after));
    }

    public function test_two_elements_that_are_alike_in_every_way_still_get_their_own_keys(): void
    {
        // Naming an element by its words raises an obvious question: what about
        // two elements with the same words and nothing to tell them apart?
        // They are numbered, so they keep separate content. Getting this wrong
        // would be worse than a moved key — editing one would rewrite the other.
        $html = '<div><h1>Welcome</h1></div><div><h1>Welcome</h1></div>';
        $tagged = (new MarkupScanner)->apply($html, ['text'], true)['html'];

        preg_match_all('/data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $matches);

        $this->assertCount(2, $matches[1]);
        $this->assertNotSame($matches[1][0], $matches[1][1], 'two identical headings share one key');
    }

    public function test_two_lists_do_not_share_keys_for_their_first_items(): void
    {
        // Every list numbers its items from i0, so without the list in the key
        // the first menu entry and the first footer link are the same element
        // as far as the store is concerned, and editing one rewrites the other.
        $html = (new MarkupScanner)->apply(
            '<ul class="menu"><li>Home</li><li>About</li></ul>'
            .'<ul class="social"><li>Twitter</li><li>Facebook</li></ul>',
            ['text'],
            true
        )['html'];

        preg_match_all('/<li[^>]*data-edit="setting:(auto:[a-f0-9]+)"/', $html, $m);

        $this->assertCount(4, $m[1]);
        $this->assertSame($m[1], array_unique($m[1]), 'every list item needs its own key');
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

    public function test_a_wrapper_whose_text_lives_in_a_child_is_not_tagged_itself(): void
    {
        // <li><a>Activate</a></li> has no words of its own. Tagging it too let
        // an edit land beside the button instead of changing its label.
        $html = (new MarkupScanner)->apply('<ul class="actions"><li><a class="button">Activate</a></li><li><a class="button">Learn More</a></li></ul>', ['text', 'link'], true)['html'];

        $this->assertStringNotContainsString('<li data-edit=', $html);
        $this->assertMatchesRegularExpression('/<a [^>]*data-edit="setting:auto:/', $html);
    }

    public function test_replacing_text_keeps_a_nested_link_in_place(): void
    {
        $tagged = (new MarkupScanner)->apply('<p>Crafted by <a href="/x">Someone</a>.</p>', ['text', 'link'], true)['html'];
        preg_match('/<p data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => 'Our own words']);

        // The new sentence sits before the link, not jammed after it.
        $this->assertMatchesRegularExpression('/Our own words\s*<a /', $rendered);
        $this->assertStringContainsString('>Someone</a>', $rendered);
    }

    public function test_it_tags_a_theme_icon_so_it_can_be_swapped(): void
    {
        // An icon is a class on an empty span, so nothing else would offer it.
        $html = (new MarkupScanner)->apply('<span class="icon fa-gem major"></span>', ['text'], true)['html'];

        $this->assertMatchesRegularExpression('/data-edit-icon="setting:auto:[a-f0-9]{12}"/', $html);
        $this->assertStringContainsString('data-edit-icon-current="fa-gem"', $html);
    }

    public function test_apply_overrides_swaps_the_icon_class_and_leaves_the_rest(): void
    {
        $tagged = (new MarkupScanner)->apply('<span class="icon fa-gem major"></span>', ['text'], true)['html'];
        preg_match('/data-edit-icon="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => 'fa-compass']);

        $this->assertStringContainsString('fa-compass', $rendered);
        $this->assertStringNotContainsString('fa-gem', $rendered);
        // The theme's own styling classes stay put.
        $this->assertStringContainsString('icon', $rendered);
        $this->assertStringContainsString('major', $rendered);
    }

    public function test_an_icon_choice_cannot_smuggle_anything_into_the_class(): void
    {
        $tagged = (new MarkupScanner)->apply('<span class="icon fa-gem"></span>', ['text'], true)['html'];
        preg_match('/data-edit-icon="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => 'fa-x" onload="alert(1)']);

        // What matters is that nothing escapes the class attribute: the value
        // is flattened to a class name, so no new attribute can be created.
        $this->assertStringNotContainsString('onload=', $rendered);
        $this->assertStringNotContainsString('alert(1)', $rendered);
        $this->assertMatchesRegularExpression('/class="[A-Za-z0-9 _-]*"/', $rendered);
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

    public function test_a_variant_choice_replaces_the_classes_but_keeps_the_theme_styling(): void
    {
        // Several names mean the editor moved the icon to another of the
        // theme's variants, which needs that variant's classes to render.
        $tagged = (new MarkupScanner)->apply('<span class="icon fa-gem major"></span>', ['text'], true)['html'];
        preg_match('/data-edit-icon="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => 'icon solid major fa-rocket']);

        $this->assertStringContainsString('class="icon solid major fa-rocket"', $rendered);
        $this->assertStringContainsString('data-edit-icon-current="fa-rocket"', $rendered);
    }

    public function test_a_variant_choice_cannot_smuggle_anything_into_the_class(): void
    {
        $tagged = (new MarkupScanner)->apply('<span class="icon fa-gem"></span>', ['text'], true)['html'];
        preg_match('/data-edit-icon="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => 'icon fa-x" onload="alert(1)']);

        $this->assertStringNotContainsString('onload=', $rendered);
        $this->assertStringNotContainsString('alert(1)', $rendered);
        $this->assertMatchesRegularExpression('/class="[A-Za-z0-9 _-]*"/', $rendered);
    }

    public function test_a_repeated_region_keys_the_same_element_alike_on_pages_that_differ(): void
    {
        // The homepage footer carries an extra block above the copyright. By
        // position those are two different elements; they are not.
        $home = '<footer><div>Follow us</div><div><p>&copy; Transfar</p></div></footer>';
        $inner = '<footer><div><p>&copy; Transfar</p></div></footer>';

        $scanner = new MarkupScanner;
        $homeKey = $this->keyOfText($scanner->apply($home, ['text'], true, null, '')['html'], 'Transfar');
        $innerKey = $this->keyOfText($scanner->apply($inner, ['text'], true, null, 'about')['html'], 'Transfar');

        $this->assertNotNull($homeKey);
        $this->assertSame($homeKey, $innerKey, 'A footer line should be the same line on every page.');
    }

    public function test_a_repeated_menu_keys_the_same_however_the_markup_around_it_shifts(): void
    {
        $home = '<nav><div class="promo">New</div><ul><li><a href="a.html">About</a></li><li><a href="b.html">Blog</a></li></ul></nav>';
        $inner = '<nav><ul><li><a href="a.html">About</a></li><li><a href="b.html">Blog</a></li></ul></nav>';

        $scanner = new MarkupScanner;
        $homeHtml = $scanner->apply($home, ['text'], true, null, '')['html'];
        $innerHtml = $scanner->apply($inner, ['text'], true, null, 'about')['html'];

        preg_match('/data-edit-list="(auto:[a-f0-9]+)"/', $homeHtml, $a);
        preg_match('/data-edit-list="(auto:[a-f0-9]+)"/', $innerHtml, $b);
        $this->assertNotEmpty($a);
        $this->assertSame($a[1], $b[1], 'The menu is the same menu on every page.');
    }

    public function test_page_content_outside_a_repeated_region_stays_the_page_own(): void
    {
        // Same words, same layout, different pages: these must not share.
        $markup = '<section><h1>Welcome</h1></section>';

        $scanner = new MarkupScanner;
        $one = $this->firstTextKey($scanner->apply($markup, ['text'], true, null, 'about')['html']);
        $two = $this->firstTextKey($scanner->apply($markup, ['text'], true, null, 'contact')['html']);

        $this->assertNotNull($one);
        $this->assertNotSame($one, $two);
    }

    protected function firstTextKey(string $html): ?string
    {
        return preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $html, $m) ? $m[1] : null;
    }

    /** The key on the element holding this text. */
    protected function keyOfText(string $html, string $needle): ?string
    {
        $pattern = '/data-edit="setting:(auto:[a-f0-9]+)"[^>]*>[^<]*'.preg_quote($needle, '/').'/';

        return preg_match($pattern, $html, $m) ? $m[1] : null;
    }

    public function test_a_counter_offers_the_number_it_shows_not_its_placeholder(): void
    {
        // The markup says "00"; the figure on the page is 3670, rendered from
        // the attribute by the theme's own script.
        $html = (new MarkupScanner)->apply('<span class="odometer" data-count="3670">00</span>', ['text'], true)['html'];

        $this->assertStringContainsString('data-edit-value="3670"', $html);
        $this->assertStringContainsString('data-edit-attr="data-count"', $html);
    }

    public function test_editing_a_counter_writes_where_its_script_reads(): void
    {
        // Text alone is overwritten the moment the script runs.
        $tagged = (new MarkupScanner)->apply('<span class="odometer" data-count="3670">00</span>', ['text'], true)['html'];
        preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => '4200']);

        $this->assertStringContainsString('data-count="4200"', $rendered);
        $this->assertStringContainsString('data-edit-value="4200"', $rendered);
        $this->assertStringNotContainsString('data-count="3670"', $rendered);
    }

    public function test_every_counter_on_a_page_is_editable(): void
    {
        // Two of Transfar's four went untagged, because a placeholder like "00"
        // can fail the checks that decide what counts as editable text.
        $html = (new MarkupScanner)->apply(
            '<div><span class="odometer" data-count="6823">00</span><span class="odometer" data-count="3670">00</span>'
            .'<span class="odometer" data-count="690">00</span><span class="odometer" data-count="200">00</span></div>',
            ['text'],
            true
        )['html'];

        $this->assertSame(4, substr_count($html, 'data-edit-attr="data-count"'));
        $this->assertSame(4, preg_match_all('/data-edit="setting:auto:[a-f0-9]+"/', $html));
    }

    public function test_a_counter_inside_a_wrapper_is_still_reachable(): void
    {
        // "3670" with a "+" beside it: the wrapper owns the suffix, but the
        // number is its own thing and must not be swallowed by it.
        $html = (new MarkupScanner)->apply('<h3><span class="odometer" data-count="690">00</span>+</h3>', ['text'], true)['html'];

        $this->assertStringContainsString('data-edit-attr="data-count"', $html);
        $this->assertStringContainsString('data-edit-value="690"', $html);
    }

    public function test_a_link_whose_words_live_in_a_child_gets_no_text_box(): void
    {
        // Spectral's social links: <a><span class="label">Instagram</span></a>.
        // The anchor has no words of its own, so a text box on it is a blank.
        $html = (new MarkupScanner)->apply('<a href="#" class="icon brands"><span class="label">Instagram</span></a>', ['text', 'link'], true)['html'];

        $this->assertStringContainsString('data-edit-href=', $html);
        $this->assertDoesNotMatchRegularExpression('/<a[^>]*data-edit="setting:/', $html);
        // The word itself is still reachable, on the element that holds it.
        $this->assertMatchesRegularExpression('/<span[^>]*data-edit="setting:/', $html);
    }

    public function test_a_link_with_its_own_words_still_gets_a_text_box(): void
    {
        $html = (new MarkupScanner)->apply('<a href="/about">About us</a>', ['text', 'link'], true)['html'];

        $this->assertMatchesRegularExpression('/<a[^>]*data-edit="setting:/', $html);
        $this->assertStringContainsString('data-edit-href=', $html);
    }

    public function test_a_data_attribute_that_is_not_a_number_is_left_alone(): void
    {
        // Themes keep all sorts of things in data attributes.
        $html = (new MarkupScanner)->apply('<div data-count="open" data-number="#target">Panel</div>', ['text'], true)['html'];

        $this->assertStringNotContainsString('data-edit-attr', $html);
    }

    public function test_an_inline_drawing_is_tagged_for_editing(): void
    {
        // The scanner always found these and had nowhere to put them, so a
        // button with an icon offered its words and not its picture.
        $html = (new MarkupScanner)->apply('<a href="/x">Learn more <svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></a>', ['text', 'link', 'icon'], true)['html'];

        $this->assertMatchesRegularExpression('/<svg[^>]*data-edit-svg="setting:auto:[a-f0-9]{12}"/', $html);
    }

    public function test_a_stored_drawing_replaces_the_one_in_the_markup(): void
    {
        $tagged = (new MarkupScanner)->apply('<svg class="size-4" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>', ['text', 'icon'], true)['html'];
        preg_match('/data-edit-svg="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [
            $m[1] => '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7"/></svg>',
        ]);

        $this->assertStringContainsString('<circle', $rendered);
        $this->assertStringNotContainsString('M5 12h14', $rendered);
        // The theme sized it; that survives the swap.
        $this->assertStringContainsString('class="size-4"', $rendered);
    }

    public function test_a_stored_drawing_cannot_carry_anything_executable(): void
    {
        $tagged = (new MarkupScanner)->apply('<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>', ['text', 'icon'], true)['html'];
        preg_match('/data-edit-svg="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [
            $m[1] => '<svg onload="alert(1)"><script>alert(2)</script><path d="M0 0" onclick="x()"/></svg>',
        ]);

        $this->assertStringNotContainsString('onload', $rendered);
        $this->assertStringNotContainsString('onclick', $rendered);
        $this->assertStringNotContainsString('alert', $rendered);
        $this->assertStringNotContainsString('<script', $rendered);
    }

    public function test_an_unusable_drawing_leaves_the_original_alone(): void
    {
        $tagged = (new MarkupScanner)->apply('<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>', ['text', 'icon'], true)['html'];
        preg_match('/data-edit-svg="setting:(auto:[a-f0-9]+)"/', $tagged, $m);

        $rendered = (new MarkupScanner)->applyOverrides($tagged, [$m[1] => '<div>not a drawing</div>']);

        $this->assertStringContainsString('M5 12h14', $rendered);
    }

    /**
     * A sentence does not stop being editable because one word is marked up.
     *
     * Measured on a real WordPress install: a page of ordinary prose came back
     * 52% reachable, and every missing run was a paragraph holding a <code>,
     * an <abbr> or a <del>. The paragraph was not a text leaf because of the
     * child, and the child was not a text tag, so the words fell through both
     * rules and nothing on the page said why that sentence could not be
     * changed. Any bought template with a link or a bolded word inside a
     * paragraph — which is most of them — meets the same edge.
     */
    public function test_a_paragraph_stays_editable_when_a_word_inside_it_is_marked_up(): void
    {
        foreach (['code', 'abbr', 'del', 'ins', 'kbd', 'var', 'samp', 'cite', 'q', 'time', 's'] as $inline) {
            $html = (new MarkupScanner)->apply(
                "<div><p>This sentence is following a <{$inline}>marked</{$inline}> word.</p></div>",
                ['text'],
                true,
            )['html'];

            $this->assertNotNull(
                $this->keyOfText($html, 'This sentence'),
                "a paragraph holding a <{$inline}> was left uneditable",
            );
        }
    }

    public function test_the_marked_up_word_is_editable_and_keeps_its_tag(): void
    {
        /*
         * This used to assert the opposite, and its reason was sound at the
         * time: tagging both the paragraph and the word inside it would let an
         * edit to either destroy the other, because the applier flattened a
         * sentence into its first run of text.
         *
         * That is fixed — each now writes into its own words and leaves the
         * rest alone — so the reason is gone and the cost of the old behaviour
         * is left: the marked-up word was the one part of a sentence a client
         * could not touch, with nothing to say why.
         *
         * What has not changed is that the tag survives. A client rewording
         * the phrase must not cost the theme its styling.
         */
        $html = (new MarkupScanner)->apply('<div><p>Use <code>wp-config.php</code> here.</p></div>', ['text'], true)['html'];

        $this->assertSame(2, substr_count($html, 'data-edit="setting:'), 'the paragraph and the word should each be editable');
        $this->assertMatchesRegularExpression('/<code[^>]*>wp-config\.php<\/code>/', $html, 'the marked-up word lost its tag');
    }

    public function test_the_hosts_own_furniture_is_never_offered_for_editing(): void
    {
        // A signed-in WordPress page carries an admin toolbar. It is not the
        // client's site and not theirs to change — and a client who restyles
        // the WordPress toolbar by accident has been handed a mess with no
        // obvious way back.
        $html = (new MarkupScanner)->apply(
            '<body><div id="wpadminbar"><ul><li><a href="/wp-admin">Howdy, kbadmin</a></li></ul></div>'
            .'<main><h1>The site itself</h1></main></body>',
            ['text', 'link'],
            true,
        )['html'];

        $doc = new \DOMDocument;
        libxml_use_internal_errors(true);
        $doc->loadHTML($html);
        libxml_clear_errors();
        $bar = (new \DOMXPath($doc))->query('//*[@id="wpadminbar"]//*[@data-edit or @data-edit-href or @data-style]');

        $this->assertSame(0, $bar->length, 'the host\'s toolbar was offered for editing');
        $this->assertNotNull($this->keyOfText($html, 'The site itself'), 'the site itself must still be editable');
    }

    public function test_styling_stops_at_the_furniture_too(): void
    {
        // Content and styling are two passes and the styling one walks the
        // document flat, so refusing the chrome element alone left everything
        // under it styleable. On a real page that was ninety-four pieces of
        // the WordPress toolbar.
        $html = (new MarkupScanner)->apply(
            '<body><div id="wpadminbar"><ul><li><span>Howdy</span></li></ul></div></body>',
            ['text'],
            true,
        )['html'];

        $this->assertSame(0, substr_count($html, 'data-style='), 'the toolbar was left styleable');
    }

    public function test_a_host_can_mark_its_own_furniture_without_us_knowing_its_name(): void
    {
        $html = (new MarkupScanner)->apply(
            '<body><div data-no-edit><p>Somebody else\'s bar</p></div><p>Ours</p></body>',
            ['text'],
            true,
        )['html'];

        $this->assertNull($this->keyOfText($html, "Somebody else's bar"));
        $this->assertNotNull($this->keyOfText($html, 'Ours'));
    }

    public function test_a_link_the_template_left_blank_is_the_one_that_most_needs_filling(): void
    {
        // A bought template ships its social row as <a href=""> with the
        // brand's icon inside, waiting for the buyer's own address. Putting
        // their Facebook page in is the first thing a new customer sits down
        // to do, and it was the one thing the editor would not let them do:
        // an empty href was read as "not a link". All they could reach was the
        // screen-reader label, which is invisible.
        // Both spellings a builder uses for "no address yet": an empty href,
        // and — the one actually found on the page — no href at all, with
        // target="_blank" the only thing left saying it is a link.
        foreach ([
            '<a href="" class="elementor-social-icon"><span class="elementor-screen-only">Facebook</span></a>',
            '<a target="_blank" class="elementor-social-icon"><span class="elementor-screen-only">Facebook</span></a>',
        ] as $anchor) {
            $html = (new MarkupScanner)->apply("<div>{$anchor}</div>", ['text', 'link'], true)['html'];

            $this->assertStringContainsString('data-edit-href="auto:', $html, "a blank social link was left uneditable: {$anchor}");
        }
    }

    public function test_an_anchor_that_is_really_a_control_is_not_offered_a_web_address(): void
    {
        // No href attribute at all is a tab or an accordion that a script
        // drives. Offering a destination for one is an invitation to break it,
        // so the attribute's presence is the test, not its value.
        $html = (new MarkupScanner)->apply('<div><a class="tab-toggle">Details</a></div>', ['text', 'link'], true)['html'];

        $this->assertStringNotContainsString('data-edit-href', $html);
        $this->assertNotNull($this->keyOfText($html, 'Details'), 'its words should still be editable');
    }

    public function test_a_page_already_scanned_once_is_still_asked_about_its_pictures(): void
    {
        // The case that made every earlier background fix worthless on the
        // sites they were written for. A WordPress page is prepared on the
        // server, so it comes back with a style key on every element. Only
        // then can the browser see a background that lives in a stylesheet,
        // write it down, and ask again — and this pass skipped any element
        // that already had a style key, so it never looked. The picture was
        // written down and never given a key, on the exact page builders the
        // feature exists for.
        $prepared = (new MarkupScanner)->apply('<div class="hero"></div>', ['text', 'image'], true)['html'];

        $this->assertStringContainsString('data-style="s', $prepared, 'the first pass did not key anything, so this proves nothing');
        $this->assertStringNotContainsString('data-edit-bg', $prepared);

        // The browser resolves the stylesheet and writes down what it found.
        $withPicture = str_replace('<div ', '<div data-kb-bg="/hero.jpg" ', $prepared);

        $again = (new MarkupScanner)->apply($withPicture, ['text', 'image'], true)['html'];

        $this->assertStringContainsString('data-edit-bg="setting:auto:', $again, 'a picture found on the second look was never offered');
        $this->assertStringContainsString('data-edit-preview="/hero.jpg"', $again);
    }

    public function test_a_second_look_never_renames_what_the_first_one_keyed(): void
    {
        // The reason that skip was there. A client's styling hangs off these
        // keys, so asking again must add without disturbing.
        $first = (new MarkupScanner)->apply('<div class="hero"><p>Words</p></div>', ['text', 'image'], true)['html'];
        preg_match_all('/data-style="(s[a-f0-9]+)"/', $first, $before);

        $again = (new MarkupScanner)->apply($first, ['text', 'image'], true)['html'];
        preg_match_all('/data-style="(s[a-f0-9]+)"/', $again, $after);

        $this->assertNotEmpty($before[1]);
        $this->assertSame($before[1], $after[1], 'a second look renamed keys the first one gave');
    }

    public function test_a_background_the_browser_resolved_is_offered_like_any_other(): void
    {
        // A page builder writes its backgrounds into a generated stylesheet,
        // so the hero — the biggest picture on the page and the first thing
        // anybody would change — is nowhere in the markup. The runtime asks
        // the browser what actually won the cascade and writes the answer
        // here; this class does not learn to match selectors.
        $html = (new MarkupScanner)->apply(
            '<div class="elementor-element" data-kb-bg="http://site.test/uploads/hero-section-min.jpg"></div>',
            ['text', 'image'],
            true,
        )['html'];

        $this->assertStringContainsString('data-edit-bg="setting:auto:', $html);
        $this->assertStringContainsString('data-edit-preview="http://site.test/uploads/hero-section-min.jpg"', $html);
    }

    public function test_the_markup_still_wins_where_it_has_an_answer(): void
    {
        // A theme's own lazy-loading attribute is what that theme will act on
        // when it loads the picture, so it stays authoritative over anything
        // the browser computed afterwards.
        $html = (new MarkupScanner)->apply(
            '<div data-bg="/theme-says.jpg" data-kb-bg="/browser-says.jpg"></div>',
            ['text', 'image'],
            true,
        )['html'];

        $this->assertStringContainsString('data-edit-preview="/theme-says.jpg"', $html);
    }

    public function test_preformatted_text_and_an_address_are_editable(): void
    {
        // Both hold words a client would want to change — a code sample, a
        // shop's address in the footer — and neither was reachable. The <pre>
        // alone was the single largest run of uneditable text on the page.
        foreach (['pre' => 'two roads diverged', 'address' => 'Cupertino, CA 95014'] as $tag => $words) {
            $html = (new MarkupScanner)->apply("<div><{$tag}>{$words}</{$tag}></div>", ['text'], true)['html'];

            $this->assertNotNull($this->keyOfText($html, $words), "<{$tag}> was left uneditable");
        }
    }
}
