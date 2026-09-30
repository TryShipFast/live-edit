<?php

namespace ShipFast\LiveEdit\Tests;

/**
 * A developer sets what they were given, and nothing else.
 *
 * The values a customer receives when they register a site are the site id and
 * the key. Those are what goes in an environment. Everything else is this
 * product's job, and anything that has to be discovered in a config file
 * before the editor works is a defect in that job rather than a line missing
 * from somebody's .env.
 *
 * Two switches sit over one idea: finding the editable parts of a page, and
 * being willing to store what comes back from them. Their fallbacks disagreed
 * - true and false - so an install setting neither, which is every install,
 * got tagging without the store. Every paragraph derives a key, the drawer
 * opens on any of them, and every save is refused with "Unknown setting". The
 * file's own comment calls that a state with no honest use, and then the code
 * produced it by default.
 *
 * Read from the shipped file rather than from the loaded config, because the
 * question is what a fresh install resolves to and the test app has already
 * been handed a merged one.
 */
class AutoKeysFollowAutoTaggingTest extends TestCase
{
    /** @var array<string, string|false> */
    private array $restore = [];

    protected function tearDown(): void
    {
        foreach ($this->restore as $name => $was) {
            if ($was === false) {
                putenv($name);
                unset($_ENV[$name], $_SERVER[$name]);

                continue;
            }

            putenv("{$name}={$was}");
            $_ENV[$name] = $was;
        }

        $this->restore = [];

        parent::tearDown();
    }

    /** The shipped file, evaluated as an install with this environment sees it. */
    private function resolved(array $environment = []): array
    {
        foreach (['LIVE_EDIT_AUTO_TAG', 'LIVE_EDIT_AUTO_KEYS'] as $name) {
            // Cleared as well as set, so a variable that happens to be on the
            // machine running the tests cannot make this pass or fail.
            $this->restore[$name] = getenv($name);
            putenv($name);
            unset($_ENV[$name], $_SERVER[$name]);
        }

        foreach ($environment as $name => $value) {
            putenv("{$name}={$value}");
            $_ENV[$name] = $value;
        }

        return require __DIR__.'/../config/live-edit.php';
    }

    public function test_a_site_that_sets_nothing_can_store_what_it_tags(): void
    {
        $config = $this->resolved();

        $this->assertTrue($config['auto_tag'], 'pages would not be tagged at all');
        $this->assertSame(
            $config['auto_tag'],
            $config['auto_keys'],
            'a page derives a key for every paragraph and every save is refused with "Unknown setting"'
        );
    }

    public function test_turning_tagging_off_takes_the_store_with_it(): void
    {
        // The pairing runs both ways. A store willing to keep keys nothing on
        // the page asks for is the same disagreement, pointing the other way.
        $config = $this->resolved(['LIVE_EDIT_AUTO_TAG' => 'false']);

        $this->assertFalse($config['auto_tag']);
        $this->assertFalse($config['auto_keys']);
    }

    public function test_they_can_still_be_parted_on_purpose(): void
    {
        /*
         * A theme tagged ahead of time by `live-edit:scan --apply --auto`
         * needs the store without the per-request tagging. That is a real
         * arrangement, and saying so explicitly still works.
         */
        $config = $this->resolved([
            'LIVE_EDIT_AUTO_TAG' => 'false',
            'LIVE_EDIT_AUTO_KEYS' => 'true',
        ]);

        $this->assertFalse($config['auto_tag']);
        $this->assertTrue($config['auto_keys']);
    }
}
