<?php

namespace ShipFast\LiveEdit\Tests\WordPress;

use KastsBuild\Licence;
use ReflectionMethod;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * A plugin that names no site does not edit.
 *
 * This used to be the one case that edited freely: the way past every check
 * was to have nothing to check, so anybody could install the plugin and have
 * the whole product for nothing.
 *
 * The Laravel side was closed when the decision was made. The WordPress side
 * was missed, and stayed open, which is the trouble with one decision living
 * in two adapters that are written months apart. It cost nothing only because
 * no customer runs WordPress yet.
 *
 * Silence would be the other mistake. Somebody who has just installed this is
 * somebody trying to buy from us, and an editor that never appears reads as a
 * broken plugin rather than an unfinished setup.
 */
class AnUnregisteredPluginDoesNotEditTest extends TestCase
{
    private function loadPlugin(): void
    {
        $plugin = __DIR__.'/../../packages/wordpress/kastsbuild/includes/';

        // Settings too: the register link is built from a constant on it, and
        // Licence cannot be loaded usefully without it.
        require_once $plugin.'Settings.php';
        require_once $plugin.'Licence.php';
    }

    public function test_an_unregistered_install_is_told_to_register(): void
    {
        $this->loadPlugin();

        $said = Licence::messageFrom('unregistered');

        // The instruction, and where to carry it out.
        $this->assertStringContainsStringIgnoringCase('not registered', $said);
        $this->assertStringContainsStringIgnoringCase('dashboard', $said);

        // Not the words for a key that has stopped working. Somebody who has
        // never had a key cannot replace one.
        $this->assertStringNotContainsStringIgnoringCase('no longer accepted', $said);
    }

    public function test_it_does_not_read_as_a_site_that_broke(): void
    {
        /*
         * An unfinished setup and a lapsed licence are different events with
         * different fixes, and the plugin had one sentence for both.
         */
        $this->loadPlugin();

        $this->assertNotSame(
            Licence::messageFrom('unregistered'),
            Licence::messageFrom('expired')
        );
        $this->assertNotSame(
            Licence::messageFrom('unregistered'),
            Licence::messageFrom('rejected')
        );
    }

    public function test_the_register_link_points_at_the_console(): void
    {
        // Not reconstructed from the API address. The plugin used to work
        // addresses out by stripping paths off each other, which was right
        // until the day the API moved.
        $this->loadPlugin();

        $this->assertSame('https://live.tryshipfast.com/sites', Licence::registerUrl());
    }

    public function test_a_default_message_is_still_there_for_anything_unnamed(): void
    {
        // A reason from a newer service that this plugin has never heard of
        // must not produce an empty sentence.
        $this->loadPlugin();

        $this->assertNotSame('', trim(Licence::messageFrom('something-invented-later')));
    }

    public function test_both_halves_of_unregistered_count(): void
    {
        /*
         * No site and no key are the same moment from the customer's side:
         * the plugin is installed and the settings page is not filled in. A
         * site with no key cannot ask us anything, so treating that as "key
         * rejected" would tell somebody to replace a key they never had.
         *
         * Checked on the source rather than by running WordPress, because
         * what matters is that both conditions are in the rule at all.
         */
        $source = file_get_contents(
            __DIR__.'/../../packages/wordpress/kastsbuild/includes/Licence.php'
        );

        $rule = new ReflectionMethod(Licence::class, 'unregistered');

        $this->assertTrue($rule->isStatic());
        $this->assertStringContainsString("Settings::get('publishable_key') === ''", $source);
        $this->assertStringContainsString('! Settings::configured()', $source);
    }
}
