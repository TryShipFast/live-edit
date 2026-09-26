<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Content\CarryContentAcrossRetag;
use ShipFast\LiveEdit\Domain\Content\Companions;
use ShipFast\LiveEdit\Domain\Content\KeyMap;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Support\KeyMigrator;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * A client's work follows its element when the scanner renames it.
 *
 * An auto key describes an element rather than naming it, so improving the
 * scanner — which happens, and happened the day this was written, taking the
 * proportion of edits that survive a page being rearranged from 57% to 98% —
 * can hand the same element a different key. Everything stored under the old
 * one is then orphaned. Nothing errors: the page simply goes back to the
 * theme's own words, weeks after anybody made a change.
 *
 * Improving the scanner must not be the thing that loses a customer's work.
 */
class WorkSurvivesARetagTest extends TestCase
{
    protected Site $site;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('live-edit.api.enabled', true);
        $app['config']->set('live-edit.auto_keys', true);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create([
            'slug' => 'client', 'name' => 'Client', 'allowed_origins' => ['https://client.test'],
        ]);
    }

    protected function store(): SiteStore
    {
        return new SiteStore($this->site->fresh());
    }

    protected function markup(string $html, string $page = 'index'): string
    {
        return (new MarkupScanner)
            ->apply($html, ['text', 'image', 'link', 'icon'], true, null, $page)['html'];
    }

    /** Tag a page the way the service does, and hand back key => element text. */
    protected function tag(string $html, string $page = 'index'): array
    {
        $tagged = $this->markup($html, $page);

        app(CarryContentAcrossRetag::class)($this->store(), $page, $tagged);

        preg_match_all('/data-edit="setting:(auto:[a-f0-9]+)"[^>]*>([^<]*)/', $tagged, $m, PREG_SET_ORDER);

        return collect($m)->mapWithKeys(fn ($row) => [trim($row[2]) => $row[1]])->all();
    }

    /**
     * What a PREVIOUS version of the scanner handed out for this page.
     *
     * The scenario worth testing is not the page changing — it is the scanner
     * changing, which is what actually happened the day this was written. It
     * cannot be produced by feeding different markup, because a working
     * scanner is deliberately stable against that now. So the names the old
     * scanner gave are stated directly, which is exactly what the remembered
     * map holds.
     */
    protected function pretendTheScannerUsedToSay(string $html, string $page = 'index'): array
    {
        $index = KeyMigrator::indexOf($this->markup($html, $page));

        $old = [];
        foreach ($index as $signature => $attributes) {
            foreach ($attributes as $attribute => $key) {
                $old[$signature.'|'.$attribute] = 'auto:'.substr(hash('sha256', 'old/'.$key), 0, 12);
            }
        }

        KeyMap::query()->create([
            'site_id' => $this->site->id,
            'page' => $page,
            'fingerprint' => 'from-an-older-scanner',
            'map' => $old,
        ]);

        return $old;
    }

    /** The old name for the element holding these words. */
    protected function oldKeyFor(array $old, string $words, string $attribute = 'data-edit'): string
    {
        foreach ($old as $signature => $key) {
            if (str_contains($signature, $words) && str_ends_with($signature, '|'.$attribute)) {
                return $key;
            }
        }

        $this->fail("no old key for '{$words}'");
    }

    public function test_words_a_client_saved_follow_their_element_when_the_scanner_renames_it(): void
    {
        $html = '<body><div><h1>Welcome to Acme</h1></div></body>';

        // What the scanner used to call this heading, and the words the client
        // saved against that name.
        $old = $this->pretendTheScannerUsedToSay($html);
        $wasCalled = $this->oldKeyFor($old, 'Welcome to Acme');

        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $wasCalled, 'value' => 'Welcome to Acme Aviation']);

        // The scanner is upgraded and the page is tagged again.
        $nowCalled = $this->tag($html)['Welcome to Acme'];

        $this->assertNotSame($wasCalled, $nowCalled, 'the scenario did not rename anything, so this proves nothing');

        $this->assertSame(
            'Welcome to Acme Aviation',
            SiteSetting::query()->where('site_id', $this->site->id)->where('key', $nowCalled)->value('value'),
            'the client\'s words did not follow their element',
        );

        $this->assertNull(
            SiteSetting::query()->where('site_id', $this->site->id)->where('key', $wasCalled)->value('value'),
            'the words were copied rather than moved',
        );
    }

    public function test_unpublished_work_follows_too(): void
    {
        // A draft is work somebody has done and not yet released — the most
        // painful thing to lose, because nobody else has seen it.
        $html = '<body><div><h1>Original</h1></div></body>';
        $old = $this->pretendTheScannerUsedToSay($html);
        $wasCalled = $this->oldKeyFor($old, 'Original');

        Draft::query()->create([
            'site_id' => $this->site->id, 'kind' => 'setting', 'subject' => $wasCalled, 'payload' => ['value' => 'Held back'],
        ]);

        $nowCalled = $this->tag($html)['Original'];
        $this->assertNotSame($wasCalled, $nowCalled);

        $this->assertSame(
            'Held back',
            Draft::query()->where('site_id', $this->site->id)->where('subject', $nowCalled)->value('payload')['value'] ?? null,
        );
    }

    public function test_a_description_follows_the_picture_it_describes(): void
    {
        $html = '<body><div><h1>Hero</h1><img src="/a.jpg" alt=""></div></body>';
        $old = $this->pretendTheScannerUsedToSay($html);
        $wasCalled = $this->oldKeyFor($old, '/a.jpg', 'data-edit-img');

        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $wasCalled, 'value' => '/new.jpg']);
        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $wasCalled.'Alt', 'value' => 'A beach at dawn']);

        $tagged = $this->markup($html);
        app(CarryContentAcrossRetag::class)($this->store(), 'index', $tagged);
        preg_match('/data-edit-img="setting:(auto:[a-f0-9]+)"/', $tagged, $m);
        $nowCalled = $m[1];

        $this->assertNotSame($wasCalled, $nowCalled, 'the scenario did not rename anything, so this proves nothing');

        $rows = SiteSetting::query()->where('site_id', $this->site->id);
        $this->assertSame('/new.jpg', (clone $rows)->where('key', $nowCalled)->value('value'));
        $this->assertSame('A beach at dawn', (clone $rows)->where('key', $nowCalled.'Alt')->value('value'), 'the description was left behind');
    }

    public function test_an_unchanged_page_writes_nothing(): void
    {
        // This runs on every view of a page that is tagged as it loads, so it
        // has to cost a comparison rather than a write.
        $html = '<body><div><h1>Steady</h1></div></body>';
        $this->tag($html);

        $before = KeyMap::query()->where('site_id', $this->site->id)->first();
        $stamp = $before->updated_at;

        $this->travel(2)->seconds();
        $result = app(CarryContentAcrossRetag::class)(
            $this->store(), 'index',
            (new MarkupScanner)->apply($html, ['text', 'image', 'link', 'icon'], true, null, 'index')['html'],
        );

        $this->assertFalse($result['changed']);
        $this->assertTrue($stamp->equalTo(KeyMap::query()->where('site_id', $this->site->id)->first()->updated_at));
    }

    public function test_one_sites_work_never_moves_into_another(): void
    {
        // The worst thing this code could do. Two sites built from the same
        // template hold the same keys for the same elements, so a rename that
        // forgets which site it is working on rewrites a stranger's content —
        // and the only evidence is somebody else's words appearing on a page.
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other', 'allowed_origins' => []]);

        $html = '<body><div><h1>Shared words</h1></div></body>';
        $old = $this->pretendTheScannerUsedToSay($html);
        $wasCalled = $this->oldKeyFor($old, 'Shared words');

        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $wasCalled, 'value' => 'Mine']);
        SiteSetting::query()->create(['site_id' => $other->id, 'key' => $wasCalled, 'value' => 'Theirs']);

        // Only this site is tagged, so only this site's content may move.
        $nowCalled = $this->tag($html)['Shared words'];
        $this->assertNotSame($wasCalled, $nowCalled, 'the scenario did not rename anything, so this proves nothing');

        $this->assertSame(
            'Theirs',
            SiteSetting::query()->where('site_id', $other->id)->where('key', $wasCalled)->value('value'),
            'another customer\'s content was moved',
        );
        $this->assertNull(
            SiteSetting::query()->where('site_id', $other->id)->where('key', $nowCalled)->value('value'),
            'another customer\'s content was renamed',
        );
        $this->assertSame('Mine', SiteSetting::query()->where('site_id', $this->site->id)->where('key', $nowCalled)->value('value'));
    }

    public function test_an_element_the_theme_removed_leaves_its_content_alone(): void
    {
        // Content belonging to something no longer on the page is left where
        // it is rather than guessed at. It costs a row; guessing costs trust.
        $keys = $this->tag('<body><div><h1>Kept</h1><p>Removed later</p></div></body>');
        $going = $keys['Removed later'];

        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $going, 'value' => 'Words for a gone element']);

        $this->tag('<body><div><h1>Kept</h1></div></body>');

        $this->assertSame(
            'Words for a gone element',
            SiteSetting::query()->where('site_id', $this->site->id)->where('key', $going)->value('value'),
        );
    }

    public function test_a_photographers_name_travels_with_the_photograph(): void
    {
        /*
         * The failure this was written for.
         *
         * A picture's key is a signature of what it holds, so replacing the
         * picture changes the key, and everything stored beside it has to move
         * with it. The list of what moves was written out by hand in five
         * places and had already drifted: the description and the tooltip
         * travelled, four of the five credit fields did not. The
         * photographer's name was left behind on a key nothing pointed at any
         * more, so the picture arrived with no credit and the credit sat on a
         * key belonging to a different picture. Neither half looked broken.
         */
        $html = '<body><div><img src="old.jpg" alt="A room"></div></body>';
        $old = $this->pretendTheScannerUsedToSay($html);
        $wasCalled = $this->oldKeyFor($old, 'old.jpg', 'data-edit-img');

        foreach (Companions::ALL as $suffix) {
            SiteSetting::query()->create([
                'site_id' => $this->site->id,
                'key' => $wasCalled.$suffix,
                'value' => 'kept-'.$suffix,
            ]);
        }

        $this->tag($html);

        $nowCalled = $this->tag($html, 'index');
        $held = $this->store()->published();

        preg_match('/data-edit-img="setting:(auto:[a-f0-9]+)"/', $this->markup($html), $m);
        $key = $m[1];

        foreach (Companions::ALL as $suffix) {
            $this->assertSame(
                'kept-'.$suffix,
                $held[$key.$suffix] ?? null,
                "{$suffix} was left behind when the picture it belongs to moved",
            );
        }
    }
}
