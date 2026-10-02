<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * The one line a customer pastes asks for the whole runtime, not the next file.
 *
 * The staircase this replaces, measured against a real site at 100ms of
 * latency: the install script arrived, and only then was embed.js asked for;
 * that arrived, and only then were the modules named; they arrived one after
 * another - 16.9s, 17.4s, 17.4s, 18.8s - with every address known from the
 * first moment. The customer's words for it were "it loads slowly before the
 * widget loads", which is an accurate description of a serial chain.
 *
 * These are hints. Nothing here changes what order anything runs in, and a
 * browser that ignores them behaves exactly as it did before - which is why
 * the thing worth testing is what is named, and what deliberately is not.
 */
class TheRuntimeIsAskedForAtOnceTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('live-edit.api.enabled', true);
        $app['config']->set('live-edit.api.prefix', 'api/live-edit/v1');
        $app['config']->set('cors.paths', []);
    }

    private function installScript(): string
    {
        $site = Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'allowed_origins' => ['https://acme.test'],
        ]);

        return (string) $this->get("/s/{$site->slug}.js")->getContent();
    }

    public function test_it_names_every_module_a_visitor_will_need(): void
    {
        $body = $this->installScript();

        foreach (['autotag.js', 'content.js', 'support.js', 'session.js'] as $file) {
            $this->assertStringContainsString($file, $body, "{$file} is not asked for until something imports it");
        }
    }

    public function test_it_does_not_make_a_visitor_fetch_the_editor(): void
    {
        /*
         * The arrangement the whole runtime is shaped around: what every
         * visitor downloads is the boot script and the content applier, and no
         * editor. This file cannot know whether the person arriving may edit,
         * so hinting the editor here would hand it to everybody - which is the
         * cost this is supposed to be reducing.
         */
        $body = $this->installScript();

        $this->assertStringNotContainsString('live-edit.js', $body);
        $this->assertStringNotContainsString('chrome.js', $body);
    }

    public function test_the_hints_carry_the_same_mode_as_the_imports_that_follow(): void
    {
        /*
         * The failure this guards is a hint that makes the page slower. The
         * runtime is served from this service rather than the customer's own
         * domain, and a preload whose mode does not match the request that
         * follows is not shared with it: the file is fetched twice.
         */
        $body = $this->installScript();

        $this->assertStringContainsString('modulepreload', $body);
        $this->assertStringContainsString('crossOrigin', $body);
    }

    public function test_the_hints_point_at_the_version_that_is_being_served(): void
    {
        /*
         * A hint at last release's address is a file fetched for nothing and
         * the real one fetched anyway. The modules live under the same
         * versioned directory the script tag is stamped with, so the two have
         * to agree.
         */
        $body = $this->installScript();

        preg_match('/embed\.js\?v=([^"\']+)/', $body, $stamped);

        $this->assertNotEmpty($stamped, 'the install script no longer stamps a version');
        $this->assertStringContainsString('/assets/'.$stamped[1].'/autotag.js', $body);
    }

    public function test_a_suspended_site_is_not_handed_a_runtime_to_fetch(): void
    {
        // Nothing to hint where there is nothing to run, and a suspended site
        // has to stop editing without breaking the page.
        $site = Site::query()->create([
            'slug' => 'lapsed',
            'name' => 'Lapsed',
            'allowed_origins' => ['https://lapsed.test'],
            'suspended_at' => now(),
        ]);

        $body = (string) $this->get("/s/{$site->slug}.js")->getContent();

        $this->assertStringNotContainsString('modulepreload', $body);
    }
}
