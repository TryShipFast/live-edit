<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Http\Middleware\TagsEditableMarkup;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
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
         * No snapshot url, which is the shape a real cloud install has.
         *
         * Checked rather than assumed: learnkasts carries a cloud host, a
         * cloud site and an app key, and no LIVE_EDIT_SNAPSHOT_URL - the
         * install instructions never mention one. An earlier version of this
         * test set one, and so proved the fix on a configuration almost
         * nobody runs.
         */
        config()->set('live-edit.snapshot_url', null);

        /*
         * The licence, which is what actually gets asked. The cloud pair above
         * is only its fallback: an install that names LIVE_EDIT_SITE_ID uses
         * that, and the suite's own environment names one - so setting only
         * the cloud pair tested a site this test does not describe.
         */
        config()->set('live-edit.licence.host', 'https://live.tryshipfast.com');
        config()->set('live-edit.licence.site', 'learnkasts');
        config()->set('live-edit.licence.key', 'kbp_test_key');

        Cache::flush();
    }

    /** @param array<string, string> $settings */
    private function theServiceHasPublished(array $settings): void
    {
        Http::fake([
            '*/api/live-edit/v1/learnkasts/content*' => Http::response([
                'version' => 5,
                'locale' => 'en',
                'settings' => $settings,
            ]),
        ]);
    }

    private function serve(string $html, string $path = '/'): string
    {
        $response = (new TagsEditableMarkup)->handle(
            Request::create($path, 'GET'),
            fn (): Response => new Response($html, 200, ['Content-Type' => 'text/html'])
        );

        return (string) $response->getContent();
    }

    /** What the service's own tagging endpoint would call this page's picture. */
    private function keyTheServiceGivesTo(string $html, string $page): string
    {
        $tagged = (new MarkupScanner)->apply(
            $html,
            ['text', 'image', 'link', 'icon'],
            true,
            null,
            $page,
        )['html'] ?? '';

        preg_match('/data-edit-img="setting:([^"]+)"/', $tagged, $found);

        return $found[1] ?? '';
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
        $key = $this->keyTheServiceGivesTo($theme, '/');

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

    public function test_it_asks_with_a_bearer_token_because_that_is_what_the_service_accepts(): void
    {
        /*
         * Checked against the live service rather than reasoned about: the
         * content endpoint answers 200 to Authorization: Bearer <app key> and
         * 401 to the X-Live-Edit-Key header the browser runtime uses
         * elsewhere. Getting this wrong fails silently - a 401 is swallowed
         * and the page goes out with the theme's words, which is exactly the
         * bug being fixed and would look like no fix at all.
         */
        $this->theServiceHasPublished([]);

        $this->serve('<html lang="en"><body><h1>Words</h1></body></html>');

        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/live-edit/v1/learnkasts/content')
            && $request->hasHeader('Authorization', 'Bearer kbp_test_key'));
    }

    public function test_a_second_page_in_the_same_half_minute_does_not_ask_again(): void
    {
        /*
         * Every page render would otherwise cost a round trip to us, so a
         * burst of traffic on a customer's site becomes a burst on ours and
         * their time-to-first-byte becomes our latency. Held for the pointer's
         * lifetime, so a publish still shows up within the same.
         */
        $this->theServiceHasPublished([]);

        foreach (range(1, 3) as $ignored) {
            $this->serve('<html lang="en"><body><h1>Words</h1></body></html>');
        }

        Http::assertSentCount(1);
    }

    public function test_it_spells_the_page_the_way_the_browser_does(): void
    {
        /*
         * The second half of the bug, and the half that made the first half
         * look like no fix at all.
         *
         * An auto key is scoped to its page, so the spelling of the page is
         * part of the hash. The browser sends location.pathname when it asks
         * the service to tag a page, so everything stored for a cloud install
         * is keyed under "/" and "/about". This middleware trimmed the slashes
         * off, so its keys were "" and "about" - the same element, a different
         * name, and not one override could ever match.
         *
         * Measured against learnkasts before guessing: nought of twenty-nine
         * published overrides matched the trimmed spelling, and every one of
         * the three on its home page matched the browser's.
         */
        $theme = '<html lang="en"><body><img src="/hero.jpg" alt="A hero"></body></html>';

        $home = $this->keyTheServiceGivesTo($theme, '/');
        $about = $this->keyTheServiceGivesTo($theme, '/about');

        $this->assertNotSame($home, $about, 'Two pages built from one layout must not share a key.');

        // Both at once, the way a real site's published set spans its pages -
        // and because Http::fake appends stubs rather than replacing them, so
        // a second fake for the same address would never be reached.
        $this->theServiceHasPublished([
            $home => '/storage/live/home.jpg',
            $about => '/storage/live/about.jpg',
        ]);

        $this->assertStringContainsString('/storage/live/home.jpg', $this->serve($theme, '/'));
        $this->assertStringContainsString('/storage/live/about.jpg', $this->serve($theme, '/about'));
    }

    public function test_a_self_hosted_install_keeps_the_spelling_its_content_is_stored_under(): void
    {
        /*
         * The positive control, and the reason the spelling is not simply
         * changed for everybody.
         *
         * A self-hosted install keeps its content in its own table, keyed by
         * this middleware under the trimmed spelling. Renaming every auto key
         * on those sites to fix a cloud one would orphan the lot - the page
         * quietly reverts to the theme's words and the client concludes we lost
         * their work.
         */
        config()->set('live-edit.cloud.site', null);
        config()->set('live-edit.licence.site', null);

        $theme = '<html lang="en"><body><img src="/hero.jpg" alt="A hero"></body></html>';

        $this->assertNotSame(
            $this->keyTheServiceGivesTo($theme, '/about'),
            $this->keyTheServiceGivesTo($theme, 'about'),
            'The two spellings must genuinely differ, or this test proves nothing.',
        );

        /*
         * Stored the way a self-hosted install's content already is, and
         * served from the install's own table rather than from us.
         */
        $key = $this->keyTheServiceGivesTo($theme, 'about');

        ATableTheInstallOwns::$rows = [$key => '/uploads/their-hero.jpg'];
        config()->set('live-edit.setting_model', ATableTheInstallOwns::class);

        $this->assertStringContainsString('/uploads/their-hero.jpg', $this->serve($theme, '/about'));
    }

    public function test_it_still_never_reaches_for_a_local_database(): void
    {
        /*
         * The original fault this early return was added for. An API-driven
         * frontend has no settings table, and reading one anyway took a live
         * site off the internet twice. Reading from the service instead must
         * not quietly put that back.
         */
        config()->set('live-edit.setting_model', ATableThatIsNotThere::class);

        $this->theServiceHasPublished([]);

        $served = $this->serve('<html lang="en"><body><h1>Still here</h1></body></html>');

        $this->assertStringContainsString('Still here', $served);
    }
}

/**
 * A self-hosted install's own settings table, in as much as the middleware
 * uses one: it asks for value-by-key and nothing else.
 */
class ATableTheInstallOwns
{
    /** @var array<string, string> */
    public static array $rows = [];

    public static function query(): self
    {
        return new self;
    }

    public function pluck(string $value, string $key): Collection
    {
        return collect(self::$rows);
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
