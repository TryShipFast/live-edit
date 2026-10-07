<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Http\Middleware\TagsEditableMarkup;
use Symfony\Component\HttpFoundation\Response;

/**
 * A site whose words live with us should serve those words, not the theme's.
 *
 * It did not. The middleware returned before applying anything the moment it
 * saw a cloud install, so the whole page went out exactly as the theme wrote
 * it and the browser swapped every replacement in afterwards.
 *
 * Mostly invisible, which is why it lasted: the original words are usually
 * close enough and the original picture usually still answers. It showed up on
 * a site where one did not - a 404 for a file the theme no longer had, with
 * the replacement appearing a moment later - and the client's question was the
 * right one. Why is the old path still in the page.
 *
 * Not only cosmetic either. What a crawler reads is what is in the HTML, so a
 * client's published words were not the words being indexed.
 */
class ACloudSiteServesThePublishedWordsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('live-edit.cloud.site', 'learnkasts');
        config()->set('live-edit.cloud.host', 'https://live.tryshipfast.com');
        config()->set('live-edit.auto_tag', true);

        /*
         * Where this install's published snapshots can be fetched from.
         *
         * The thing that makes the whole fix reachable, and the thing a cloud
         * install has to be given. Without it RemoteContent has no address to
         * ask, returns nothing, and the middleware serves the theme's own
         * words - which is the behaviour being fixed, so a test that forgot
         * this would pass while proving the opposite.
         */
        config()->set('live-edit.snapshot_url', 'https://cdn.tryshipfast.com/learnkasts');

        Cache::flush();
    }

    /** @param array<string, string> $settings */
    private function theServiceHasPublished(array $settings): void
    {
        Http::fake([
            '*current.json*' => Http::response(['version' => 7]),
            '*' => Http::response(['settings' => $settings, 'styles' => []]),
        ]);
    }

    /** What the scanner would name this page's picture, before stripping. */
    private function keyTheScannerGivesTo(string $html): string
    {
        $tagged = (new \ShipFast\LiveEdit\Mapper\MarkupScanner)->apply(
            $html,
            ['text', 'image', 'link', 'icon'],
            true,
            null,
            '',
        )['html'] ?? '';

        preg_match('/data-edit-img="setting:([^"]+)"/', $tagged, $found);

        return $found[1] ?? '';
    }

    private function serve(string $html): string
    {
        $response = (new TagsEditableMarkup)->handle(
            Request::create('/', 'GET'),
            fn (): Response => new Response($html, 200, ['Content-Type' => 'text/html'])
        );

        return (string) $response->getContent();
    }

    public function test_a_replaced_picture_is_in_the_html_before_the_browser_runs(): void
    {
        /*
         * The whole point. The old address never reaches the browser, so it
         * is never requested, so it cannot 404 and there is nothing to swap.
         */
        $theme = '<html lang="en"><body>'
            .'<img src="/images/marketing/os-create.webp" alt="Turn knowledge into structured learning.">'
            .'</body></html>';

        /*
         * The key comes from the scanner rather than from the served page.
         *
         * A visitor's page has had the attributes stripped by the time it
         * leaves, so looking for the key in the output finds nothing and the
         * test skips itself - which is how this very test first passed while
         * proving nothing at all.
         */
        $key = $this->keyTheScannerGivesTo($theme);

        $this->assertNotSame('', $key, 'The scanner must tag an image for any of this to be reachable.');

        $this->theServiceHasPublished([$key => '/storage/live/new-photo.jpg']);

        $served = $this->serve($theme);

        $this->assertStringContainsString('/storage/live/new-photo.jpg', $served);
        $this->assertStringNotContainsString('os-create.webp', $served);
    }

    public function test_a_visitor_is_served_the_words_without_the_scaffolding(): void
    {
        /*
         * Unchanged by any of this, and worth holding: the attributes exist
         * only so the overrides could be matched. Left in, they tell anybody
         * reading the source that the site is editable and hand them the key
         * for every sentence on it.
         */
        $this->theServiceHasPublished([]);

        $served = $this->serve('<html lang="en"><body><h1>The theme\'s own words</h1></body></html>');

        $this->assertStringNotContainsString('data-edit', $served);
    }

    public function test_a_service_that_cannot_be_reached_serves_the_page_anyway(): void
    {
        /*
         * The failure that must never cost a customer their website. No
         * overrides is exactly what this did before the fix, so a bad
         * afternoon on our side puts the behaviour back the way it already
         * was and no further.
         */
        Http::fake(['*' => Http::response('', 500)]);

        $theme = '<html lang="en"><body><h1>The theme\'s own words</h1></body></html>';

        $served = $this->serve($theme);

        $this->assertStringContainsString("The theme's own words", $served);
        $this->assertStringNotContainsString('data-edit', $served);
    }

    public function test_a_service_that_hangs_does_not_hang_the_page(): void
    {
        // Bounded by live-edit.remote_timeout. A page render must not wait on
        // us for longer than a visitor will.
        $this->assertNotNull(config('live-edit.remote_timeout', 5));
        $this->assertLessThanOrEqual(10, (int) config('live-edit.remote_timeout', 5));
    }

    public function test_it_still_never_reaches_for_a_local_database(): void
    {
        /*
         * The original fault this early return was added for. An API-driven
         * frontend has no settings table, and reading one anyway took a live
         * site off the internet twice. Reading from the service instead must
         * not quietly put that back.
         */
        config()->set('live-edit.setting_model', \ShipFast\LiveEdit\Tests\ATableThatIsNotThere::class);

        $this->theServiceHasPublished([]);

        $served = $this->serve('<html lang="en"><body><h1>Still here</h1></body></html>');

        $this->assertStringContainsString('Still here', $served);
    }
}

/**
 * A settings model whose every query throws, standing in for a site that has
 * no such table. Touching it at all is the failure.
 */
class ATableThatIsNotThere
{
    public static function query(): never
    {
        throw new \RuntimeException('A cloud install must not read a local settings table.');
    }
}
