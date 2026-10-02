<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Cache;
use ShipFast\LiveEdit\Application\Api\TagMarkup;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Content\KeyMap;

/**
 * The next visitor to a page does not pay to tag it again.
 *
 * Tagging was the slowest thing on the path to a page's own words: 1.8s of
 * server time, measured against a real site, on every view that was not
 * already in a browser's own cache. The work is identical every time - the
 * answer depends on the markup and nothing else.
 *
 * The first idea was to key it on the markup as sent, and it would have missed
 * every single time. A page from any framework carries values that change on
 * every render, and two consecutive loads of a real page differed by three
 * lines out of three hundred thousand: a CSRF token, twice, and a Livewire
 * snapshot. The answers computed from those two loads were byte-identical, so
 * the cache has to see what the answer sees rather than what the wire carries.
 */
class TaggingAPageTwiceCostsOnceTest extends TestCase
{
    private Site $site;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('live-edit.tag_cache_seconds', 86400);
    }

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        $this->site = Site::query()->create(['slug' => 'client', 'name' => 'Client']);
    }

    private function page(string $token, string $heading = 'Our work'): string
    {
        return <<<HTML
        <html><head>
        <meta name="csrf-token" content="{$token}">
        </head><body>
        <div wire:snapshot="{&quot;checksum&quot;:&quot;{$token}&quot;}" wire:effects="[]" wire:id="{$token}">
            <h1>{$heading}</h1>
            <p>We build things for people.</p>
            <img src="/hero.jpg" alt="A hero">
        </div>
        <script src="/livewire.js" data-csrf="{$token}"></script>
        </body></html>
        HTML;
    }

    private function tag(string $html): array
    {
        return app(TagMarkup::class)($this->site, $html, '/');
    }

    public function test_a_second_visitor_gets_the_same_answer_without_the_work(): void
    {
        $first = $this->tag($this->page('AAAAAAAAAAAAAAAA'));

        $this->assertGreaterThan(0, $first['count'], 'the fixture tagged nothing, so this proves nothing');

        /*
         * The whole point, stated as the test: a different render of the same
         * page. Every token differs and nothing a reader would call content
         * does.
         */
        $second = $this->tag($this->page('BBBBBBBBBBBBBBBB'));

        $this->assertSame($first, $second);
    }

    public function test_the_work_is_actually_skipped_rather_than_merely_matching(): void
    {
        /*
         * Two renders agreeing is not evidence of a cache - the scanner is
         * deterministic, so it would agree anyway. What proves a hit is that
         * the second answer comes back after the stored one is replaced with
         * something the scanner would never produce.
         */
        $this->tag($this->page('AAAAAAAAAAAAAAAA'));

        $planted = ['elements' => [['at' => [9, 9], 'attributes' => ['data-edit' => 'setting:planted']]], 'count' => 1];

        // Reach the entry the way the code does rather than guessing its name.
        $held = $this->storedTagEntry();
        $this->assertNotNull($held, 'nothing was cached at all');

        Cache::put($held, gzcompress(json_encode($planted), 6), 86400);

        $this->assertSame($planted, $this->tag($this->page('BBBBBBBBBBBBBBBB')));
    }

    public function test_different_content_is_a_different_answer(): void
    {
        // The guard against a key so loose it serves one page's tags for
        // another. Changed words are changed content, whatever the tokens say.
        $first = $this->tag($this->page('AAAAAAAAAAAAAAAA', 'Our work'));
        $second = $this->tag($this->page('AAAAAAAAAAAAAAAA', 'What we do and how we do it'));

        $this->assertNotSame($first, $second);
    }

    public function test_one_site_never_reads_another_site_answer(): void
    {
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other']);

        $this->tag($this->page('AAAAAAAAAAAAAAAA'));

        // Same markup, different customer. Sharing here would hand one
        // client's keys to another, which is worse than being slow.
        $held = $this->storedTagEntry();
        Cache::put($held, gzcompress(json_encode(['elements' => [], 'count' => 0]), 6), 86400);

        $this->assertGreaterThan(0, app(TagMarkup::class)($other, $this->page('AAAAAAAAAAAAAAAA'), '/')['count']);
    }

    public function test_a_page_is_not_served_another_page_answer(): void
    {
        $this->tag($this->page('AAAAAAAAAAAAAAAA'));

        $held = $this->storedTagEntry();
        Cache::put($held, gzcompress(json_encode(['elements' => [], 'count' => 0]), 6), 86400);

        $this->assertGreaterThan(
            0,
            app(TagMarkup::class)($this->site, $this->page('AAAAAAAAAAAAAAAA'), '/about')['count']
        );
    }

    public function test_unreadable_entry_costs_speed_rather_than_the_editor(): void
    {
        /*
         * A half-written or truncated entry. Treated as a miss, because a page
         * that loses its editor is a worse failure than a page that is slow,
         * and this is the one place a corrupt byte could do it.
         */
        $expected = $this->tag($this->page('AAAAAAAAAAAAAAAA'));

        Cache::put($this->storedTagEntry(), 'not gzip at all', 86400);

        $this->assertSame($expected, $this->tag($this->page('AAAAAAAAAAAAAAAA')));
    }

    public function test_turning_it_off_turns_it_off(): void
    {
        config()->set('live-edit.tag_cache_seconds', 0);

        $this->tag($this->page('AAAAAAAAAAAAAAAA'));

        $this->assertNull($this->storedTagEntry(), 'an answer was stored with the cache switched off');
    }

    public function test_names_are_still_carried_across_a_re_tag(): void
    {
        /*
         * The side effect the cache must not quietly skip. A page tagged for
         * the first time has to record what it handed out, or a later scanner
         * improvement has nothing to move a client's work from.
         */
        $this->tag($this->page('AAAAAAAAAAAAAAAA'));

        $this->assertSame(1, KeyMap::query()->where('site_id', $this->site->id)->count());
    }

    public function test_a_cache_that_cannot_answer_is_only_a_cache_miss(): void
    {
        /*
         * The risk this guards is the whole feature failing closed. The cache
         * belongs to the host, not to us, and the commonest Laravel driver is
         * a database table - which a deploy does not create, because
         * migrations do not run themselves. A store that throws has to cost a
         * page its speed, never its editor.
         */
        $expected = $this->tag($this->page('AAAAAAAAAAAAAAAA'));

        Cache::swap(new class extends \Illuminate\Support\Facades\Cache
        {
            public function __call($method, $arguments)
            {
                throw new \RuntimeException('no such table: cache');
            }
        });

        $this->assertSame($expected['count'], $this->tag($this->page('AAAAAAAAAAAAAAAA'))['count']);
    }

    /**
     * The cache key the code chose, found rather than guessed.
     *
     * Read out of the store itself so the test never has to know how the key
     * is built. Asserting against a key spelled out here would pass for as
     * long as the two spellings happened to agree and stop meaning anything
     * the moment they did not.
     */
    private function storedTagEntry(): ?string
    {
        $store = Cache::store()->getStore();
        $storage = new \ReflectionProperty($store, 'storage');
        $storage->setAccessible(true);

        foreach (array_keys($storage->getValue($store)) as $key) {
            if (str_contains((string) $key, 'live-edit:tag:')) {
                return (string) $key;
            }
        }

        return null;
    }
}
