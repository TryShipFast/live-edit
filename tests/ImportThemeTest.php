<?php

namespace ShipFast\LiveEdit\Tests;

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
}
