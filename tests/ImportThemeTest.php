<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Console\Commands\ImportTheme;

class ImportThemeTest extends TestCase
{
    protected function rewrite(string $html): string
    {
        return (new ImportTheme)->absolutiseAssets($html, 'https://cdn.test/demo/');
    }

    public function test_it_absolutises_assets_but_leaves_internal_page_links_alone(): void
    {
        $html = $this->rewrite(
            '<link href="assets/css/main.css"><script src="assets/js/app.js"></script>'
            .'<img src="images/hero.jpg"><a href="about.html">About</a><a href="#top">Top</a>'
        );

        $this->assertStringContainsString('href="https://cdn.test/demo/assets/css/main.css"', $html);
        $this->assertStringContainsString('src="https://cdn.test/demo/assets/js/app.js"', $html);
        $this->assertStringContainsString('src="https://cdn.test/demo/images/hero.jpg"', $html);
        // Page links stay relative — absolutising them would send visitors off-site.
        $this->assertStringContainsString('href="about.html"', $html);
        $this->assertStringContainsString('href="#top"', $html);
    }

    public function test_it_rewrites_css_urls_and_lazy_background_attributes(): void
    {
        $html = $this->rewrite(
            '<div style="background:url(images/bg.jpg)"></div>'
            .'<div data-background="images/slide-1.jpg"></div>'
        );

        $this->assertStringContainsString('url(https://cdn.test/demo/images/bg.jpg)', $html);
        $this->assertStringContainsString('data-background="https://cdn.test/demo/images/slide-1.jpg"', $html);
    }

    public function test_it_strips_any_base_tag(): void
    {
        // A <base> would rebase the live-edit endpoints onto the theme's origin.
        $html = $this->rewrite('<head><base href="https://cdn.test/demo/"><title>x</title></head>');

        $this->assertStringNotContainsString('<base', $html);
    }

    public function test_it_leaves_already_absolute_and_root_relative_urls_untouched(): void
    {
        $html = $this->rewrite('<img src="https://other.test/a.png"><img src="/local/b.png"><a href="mailto:x@y.z">Mail</a>');

        $this->assertStringContainsString('src="https://other.test/a.png"', $html);
        $this->assertStringContainsString('src="/local/b.png"', $html);
        $this->assertStringContainsString('href="mailto:x@y.z"', $html);
    }

    public function test_it_copies_stylesheets_into_this_site_so_they_are_same_origin(): void
    {
        Http::fake([
            'cdn.test/demo/index.html' => Http::response('<link rel="stylesheet" href="assets/css/main.css">'),
            'cdn.test/demo/assets/css/main.css' => Http::response('@font-face{src:url(../fonts/fa.woff)}.fa-gem:before{content:"\\f3a5"}'),
            'cdn.test/demo/assets/fonts/fa.woff' => Http::response('WOFF-BYTES'),
        ]);

        $this->artisan('live-edit:import-theme', ['url' => 'https://cdn.test/demo/index.html', '--name' => 'mirrored'])
            ->assertSuccessful();

        $html = file_get_contents(resource_path('themes/mirrored/index.html'));
        $this->assertMatchesRegularExpression('#href="/theme-assets/mirrored/[a-f0-9]{8}-main\.css"#', $html);

        $copies = glob(public_path('theme-assets/mirrored/*-main.css'));
        $this->assertCount(1, $copies);
        $css = file_get_contents($copies[0]);
        // The font is copied too: a browser will not use a webfont from another
        // origin, so a hot-linked icon font renders as empty boxes.
        $this->assertMatchesRegularExpression('#url\(/theme-assets/mirrored/[a-f0-9]{8}-fa\.woff\)#', $css);
        $this->assertSame('WOFF-BYTES', file_get_contents(glob(public_path('theme-assets/mirrored/*-fa.woff'))[0]));
        $this->assertStringContainsString('.fa-gem:before', $css);
    }

    public function test_a_stylesheet_that_cannot_be_copied_keeps_loading_from_the_origin(): void
    {
        Http::fake([
            'cdn.test/demo/index.html' => Http::response('<link rel="stylesheet" href="assets/css/main.css">'),
            'cdn.test/demo/assets/css/main.css' => Http::response('', 404),
        ]);

        $this->artisan('live-edit:import-theme', ['url' => 'https://cdn.test/demo/index.html', '--name' => 'unreachable'])
            ->assertSuccessful();

        $this->assertStringContainsString(
            'href="https://cdn.test/demo/assets/css/main.css"',
            file_get_contents(resource_path('themes/unreachable/index.html'))
        );
    }

    public function test_it_climbs_out_of_the_directory_for_parent_relative_assets(): void
    {
        // Font Awesome's css/ sheet points at ../webfonts/, so this is the
        // difference between glyphs rendering and empty boxes.
        $html = $this->rewrite('<img src="../images/hero.jpg"><link href="../../shared/main.css">');

        $this->assertStringContainsString('src="https://cdn.test/images/hero.jpg"', $html);
        $this->assertStringContainsString('href="https://cdn.test/shared/main.css"', $html);
    }

    public function test_it_leaves_javascript_alone(): void
    {
        // URL.createObjectURL(r) became createObjecturl(https://cdn.test/r),
        // a syntax error that stopped every script after it on the page.
        $html = $this->rewrite('<script>const a = URL.createObjectURL(r); new URL(x, y);</script>');

        $this->assertStringContainsString('URL.createObjectURL(r)', $html);
        $this->assertStringContainsString('new URL(x, y)', $html);
        $this->assertStringNotContainsString('cdn.test/r', $html);
    }

    public function test_it_still_absolutises_css_urls_where_css_lives(): void
    {
        $inStyleTag = $this->rewrite('<style>.a{background:url(img/a.png)}</style>');
        $this->assertStringContainsString('url(https://cdn.test/demo/img/a.png)', $inStyleTag);

        $inAttribute = $this->rewrite('<div style="background:url(img/b.png)"></div>');
        $this->assertStringContainsString('url(https://cdn.test/demo/img/b.png)', $inAttribute);
    }
}
