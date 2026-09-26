<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Application\Api\ListAttributions;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Everybody whose photograph is on the site.
 *
 * Unsplash's terms, and every Creative Commons licence except CC0, ask for the
 * photographer to be named where the work is shown. A bought template has
 * nowhere to put that: it was designed before the picture existed, and putting
 * a caption under somebody's hero is us redesigning a page we were asked to
 * make editable. A credits page discharges the obligation and costs the design
 * nothing, and this is what it is rendered from.
 */
class AttributionsTest extends TestCase
{
    protected Site $site;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $generous = ['burst' => ['max' => 600, 'seconds' => 60], 'sustained' => ['max' => 6000, 'seconds' => 3600]];

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'throttle' => array_fill_keys(['read', 'write', 'session', 'publish', 'upload', 'tag'], $generous),
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create([
            'slug' => 'client', 'name' => 'Client', 'allowed_origins' => [],
        ]);
    }

    protected function publish(string $key, string $value): void
    {
        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => $key, 'value' => $value]);
    }

    protected function picture(string $key, string $by, string $source = 'Unsplash'): void
    {
        $this->publish($key, 'https://img.test/'.$key.'.jpg');
        $this->publish($key.'Credit', "Photo by {$by} on {$source}");
        $this->publish($key.'CreditBy', $by);
        $this->publish($key.'CreditUrl', 'https://unsplash.test/@'.strtolower($by));
        $this->publish($key.'CreditSource', $source);
    }

    protected function listed(): array
    {
        return app(ListAttributions::class)($this->site->fresh())['attributions'];
    }

    public function test_it_names_the_photographer_and_where_the_picture_came_from(): void
    {
        $this->picture('auto:hero', 'Jefferson');

        $this->assertSame([[
            'credit' => 'Photo by Jefferson on Unsplash',
            'by' => 'Jefferson',
            'byUrl' => 'https://unsplash.test/@jefferson',
            'source' => 'Unsplash',
            'sourceUrl' => null,
        ]], $this->listed());
    }

    public function test_one_photographer_is_thanked_once(): void
    {
        // A client who uses four photographs by the same person is not asked
        // to thank them four times, and a page that does reads as generated
        // rather than written.
        $this->picture('auto:one', 'Jefferson');
        $this->picture('auto:two', 'Jefferson');
        $this->picture('auto:three', 'Adaeze');

        $this->assertCount(2, $this->listed());
    }

    public function test_a_picture_nobody_can_see_yet_credits_nobody(): void
    {
        // An unpublished picture is not on the public site. Naming its
        // photographer there would credit them for something nobody can see,
        // and would say what the client is still working on.
        Draft::query()->create([
            'site_id' => $this->site->id, 'kind' => 'setting', 'subject' => 'auto:hero',
            'payload' => ['value' => 'https://img.test/secret.jpg'],
        ]);
        Draft::query()->create([
            'site_id' => $this->site->id, 'kind' => 'setting', 'subject' => 'auto:heroCredit',
            'payload' => ['value' => 'Photo by Someone on Unsplash'],
        ]);

        $this->assertSame([], $this->listed());
    }

    public function test_a_credit_left_behind_by_a_removed_picture_is_not_listed(): void
    {
        // Thanking somebody for a photograph that is no longer on the site is
        // a statement about the site that is not true.
        $this->publish('auto:goneCredit', 'Photo by Nobody on Unsplash');
        $this->publish('auto:goneCreditBy', 'Nobody');

        $this->assertSame([], $this->listed());
    }

    public function test_an_uploaded_or_generated_picture_credits_nobody(): void
    {
        // Of the three ways to get a picture only one owes anybody anything.
        // A file the client uploaded is their own; a generated one has no
        // photographer and no licence.
        $this->publish('auto:theirs', 'https://img.test/theirs.jpg');
        $this->publish('auto:made', 'https://img.test/made.png');
        $this->publish('auto:madeCreditSource', 'Generated');

        $this->assertSame([], $this->listed());
    }

    public function test_the_list_is_readable_over_the_api_with_the_key_a_page_holds(): void
    {
        // The credits page is public and is rendered with the publishable
        // key, which is the one printed into the site.
        $this->picture('auto:hero', 'Jefferson');

        [, $plain] = $this->site->issueToken(TokenType::Publishable, 'Web');

        $this->getJson('/api/live-edit/v1/client/attributions', [
            'Authorization' => 'Bearer '.$plain,
            'Accept' => 'application/json',
        ])->assertOk()->assertJsonPath('attributions.0.by', 'Jefferson');
    }
}
