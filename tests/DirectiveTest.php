<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Auth\GenericUser;
use Illuminate\Support\Facades\Gate;
use ShipFast\LiveEdit\Support\CloudInstall;

/**
 * What @liveEdit puts on the page, and for whom.
 *
 * The directive is the whole integration for a Laravel host: one line in the
 * head. So what it emits, and to whom, is the contract.
 */
class DirectiveTest extends TestCase
{
    public function test_somebody_who_may_edit_is_served_the_editor(): void
    {
        Gate::define('live-edit', fn ($user) => true);
        $this->be(new GenericUser(['id' => 1]));

        $this->assertStringContainsString('live-edit/runtime.js', CloudInstall::script());
    }

    public function test_a_signed_out_visitor_is_served_nothing(): void
    {
        /*
         * Laravel does not evaluate a gate for somebody who is not signed in,
         * so this is false without the gate being consulted at all. That is
         * the right answer and worth pinning: the commonest reader of any page
         * is a stranger, and they get no editor.
         */
        Gate::define('live-edit', fn ($user) => true);

        $this->assertSame('', CloudInstall::script());
    }

    public function test_a_visitor_is_served_nothing(): void
    {
        /*
         * Not merely "the editor does not open for them". Nothing is sent at
         * all: no request they did not ask for, and no line in the source
         * telling a stranger the site is editable and where the editor lives.
         */
        Gate::define('live-edit', fn ($user) => false);
        $this->be(new GenericUser(['id' => 1]));

        $this->assertSame('', CloudInstall::script());
    }

    public function test_a_cloud_site_is_served_its_own_install_regardless(): void
    {
        // The hosted path carries a key and mints its own session, so it
        // decides for itself who may edit. This gate is not its gate.
        config()->set('live-edit.cloud.site', 'acme');
        config()->set('live-edit.cloud.host', 'https://cms.test');
        Gate::define('live-edit', fn ($user) => false);

        $this->assertStringContainsString('/s/acme.js', CloudInstall::script());
    }
}
