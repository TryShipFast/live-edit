<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

/**
 * The tagging middleware is pushed onto the global stack, so it rewrites every
 * HTML response the application returns - and nothing told it that an admin
 * panel is not a website.
 *
 * Measured on a real Laravel site with auto_tag on and Filament installed: 110
 * data-edit attributes across the admin UI. Every label, every column heading,
 * every button offered to a client as their own content to edit, with the
 * editor toolbar floating over the host's own tooling.
 *
 * Nothing was corrupted - those strings come from the host's views, not from
 * stored content - but it is the product reaching somewhere it was never
 * invited, on the one screen a customer least wants a client poking at.
 */
class TheEditorStaysOutOfTheHostsAdminTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('live-edit.auto_tag', true);
        $app['config']->set('live-edit.auto_keys', true);
    }

    protected function setUp(): void
    {
        parent::setUp();

        // Somebody the host's own gate trusts to edit, which is what makes a
        // page get tagged at all - without it these tests pass by tagging
        // nothing anywhere, which proves nothing about the guard.
        Gate::define('live-edit', fn ($user = null) => true);

        foreach (['/', '/about', '/admin', '/admin/invoices', '/dashboard', '/horizon/jobs'] as $path) {
            Route::middleware('web')->get($path, fn () => response(
                '<html><body><main><h1>A heading</h1><p>Some words that could be edited.</p></main></body></html>'
            )->header('Content-Type', 'text/html'));
        }
    }

    public function test_it_leaves_the_admin_alone(): void
    {
        foreach (['/admin', '/admin/invoices', '/dashboard', '/horizon/jobs'] as $path) {
            $this->assertStringNotContainsString(
                'data-edit',
                $this->get($path)->getContent(),
                "{$path} was tagged, so the host's own admin was offered to a client as editable content",
            );
        }
    }

    public function test_it_still_tags_the_website(): void
    {
        // The guard has to be narrow. A site that stops being editable is a
        // worse bug than the one being fixed.
        foreach (['/', '/about'] as $path) {
            $this->assertStringContainsString('data-edit', $this->get($path)->getContent(), "{$path} stopped being editable");
        }
    }

    public function test_a_host_whose_site_lives_under_admin_can_say_so(): void
    {
        // Somebody's website genuinely does live there, and the default must
        // not be a decision they cannot reverse.
        config(['live-edit.auto_tag_except' => []]);

        $this->assertStringContainsString('data-edit', $this->get('/admin')->getContent());
    }
}
