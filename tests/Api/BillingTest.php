<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Meter;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * What a site used, and what it is allowed.
 *
 * An invoice is only as good as the counting behind it, so these check the
 * arithmetic rather than the plumbing: that the right acts are counted, that
 * one customer's use is never added to another's, and that a limit nobody set
 * can never be the reason somebody cannot save their own words.
 */
class BillingTest extends TestCase
{
    private const ADMIN = 'provision-me';

    private Site $site;

    private string $session;

    private string $secret;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'admin_token' => self::ADMIN,
            'throttle' => [
                'read' => ['burst' => ['max' => 500, 'seconds' => 60], 'sustained' => ['max' => 5000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 500, 'seconds' => 60], 'sustained' => ['max' => 5000, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'upload' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
                'provision' => ['burst' => ['max' => 50, 'seconds' => 60], 'sustained' => ['max' => 500, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('live-edit.settings', ['heroTitle']);
        $app['config']->set('live-edit.publishing', false);
        $app['config']->set('live-edit.disk', 's3');
        $app['config']->set('cors.paths', []);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('s3');

        $this->site = Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => ['https://acme.test']]);
        [, $this->session] = $this->site->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());
        [, $this->secret] = $this->site->issueToken(TokenType::Secret, 'Server');
    }

    private function url(string $path = '/content'): string
    {
        return '/api/live-edit/v1/acme'.$path;
    }

    private function editor(): array
    {
        return ['Authorization' => 'Bearer '.$this->session, 'Origin' => 'https://acme.test'];
    }

    private function save(string $value): void
    {
        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => $value], $this->editor())->assertOk();
    }

    public function test_saves_are_counted(): void
    {
        $this->save('one');
        $this->save('two');

        $this->assertSame(2, Meter::current($this->site)['writes']);
    }

    public function test_reads_are_not_counted(): void
    {
        // They are cached and served from a CDN. Charging for them would bill
        // a customer for the work done to avoid work, and punish the sites
        // that behave best.
        for ($i = 0; $i < 5; $i++) {
            $this->getJson($this->url(), $this->editor())->assertOk();
        }

        $this->assertSame(0, Meter::current($this->site)['writes']);
    }

    public function test_publishing_and_uploading_are_counted_separately(): void
    {
        $this->postJson($this->url('/publish'), [], ['Authorization' => 'Bearer '.$this->secret])->assertOk();
        $this->post($this->url('/media'), ['file' => UploadedFile::fake()->image('a.jpg')], $this->editor())->assertOk();

        $usage = Meter::current($this->site);

        $this->assertSame(1, $usage['publishes']);
        $this->assertSame(1, $usage['uploads']);
        $this->assertGreaterThan(0, $usage['bytes_added']);
    }

    public function test_stored_bytes_accumulate_across_months_while_counts_do_not(): void
    {
        // Storage is what a customer pays to keep, whenever they uploaded it.
        $this->post($this->url('/media'), ['file' => UploadedFile::fake()->image('a.jpg')], $this->editor())->assertOk();

        $first = $this->site->fresh()->bytes_stored;
        $this->assertGreaterThan(0, $first);

        $this->post($this->url('/media'), ['file' => UploadedFile::fake()->image('b.jpg')], $this->editor())->assertOk();

        $this->assertGreaterThan($first, $this->site->fresh()->bytes_stored);
    }

    public function test_one_sites_use_is_never_added_to_another(): void
    {
        $other = Site::query()->create(['slug' => 'other', 'name' => 'Other', 'allowed_origins' => ['https://other.test']]);
        [, $theirs] = $other->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());

        $this->save('ours');
        $this->postJson('/api/live-edit/v1/other/content', ['key' => 'heroTitle', 'value' => 'theirs'],
            ['Authorization' => 'Bearer '.$theirs, 'Origin' => 'https://other.test'])->assertOk();

        $this->assertSame(1, Meter::current($this->site)['writes']);
        $this->assertSame(1, Meter::current($other)['writes']);
    }

    public function test_a_site_with_no_limits_is_never_refused(): void
    {
        // A limit nobody configured must never be the reason a customer
        // cannot save their own words.
        for ($i = 0; $i < 20; $i++) {
            $this->save("edit {$i}");
        }

        $this->assertSame(20, Meter::current($this->site)['writes']);
    }

    public function test_a_site_over_its_limit_is_told_so_plainly(): void
    {
        $this->site->forceFill(['limits' => ['writes' => 2]])->save();

        $this->save('one');
        $this->save('two');

        $refused = $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'three'], $this->editor());

        // Nothing is wrong with the request; the account needs attention.
        $refused->assertStatus(402)->assertJsonPath('error.type', 'over_limit');
        $this->assertStringContainsString('limit', $refused->json('error.message'));

        $this->assertSame(2, Meter::current($this->site)['writes'], 'a refused save must not be billed');
    }

    public function test_a_storage_limit_refuses_before_the_file_is_written(): void
    {
        // Refusing an upload that is already in the bucket costs the storage
        // anyway, which is the worst of both.
        $this->site->forceFill(['limits' => ['bytes_stored' => 10]])->save();

        $this->post($this->url('/media'), ['file' => UploadedFile::fake()->image('big.jpg')], $this->editor())
            ->assertStatus(402);

        $this->assertSame([], Storage::disk('s3')->allFiles());
        $this->assertSame(0, $this->site->fresh()->bytes_stored);
    }

    public function test_usage_can_be_read_for_billing(): void
    {
        $this->save('one');

        $response = $this->getJson('/api/live-edit/v1/sites/acme/usage', ['Authorization' => 'Bearer '.self::ADMIN]);

        $response->assertOk()
            ->assertJsonPath('site', 'acme')
            ->assertJsonPath('usage.writes', 1)
            ->assertJsonPath('usage.period', now()->format('Y-m'));
    }

    public function test_an_earlier_month_can_still_be_answered_for(): void
    {
        // "What did we use in March" has to be a row, not a reconstruction.
        $this->save('one');

        $this->getJson('/api/live-edit/v1/sites/acme/usage?period=2020-01', ['Authorization' => 'Bearer '.self::ADMIN])
            ->assertOk()
            ->assertJsonPath('usage.writes', 0)
            ->assertJsonPath('usage.period', '2020-01');
    }

    public function test_limits_can_be_changed_without_touching_the_site(): void
    {
        $this->patchJson('/api/live-edit/v1/sites/acme', ['limits' => ['writes' => 5]],
            ['Authorization' => 'Bearer '.self::ADMIN])
            ->assertOk()
            ->assertJsonPath('site.limits.writes', 5);

        // And removed again, because a plan change should not require
        // deleting a site.
        $this->patchJson('/api/live-edit/v1/sites/acme', ['limits' => []],
            ['Authorization' => 'Bearer '.self::ADMIN])
            ->assertOk()
            ->assertJsonPath('site.limits', null);
    }

    public function test_activity_is_recorded_so_a_dormant_site_can_be_seen(): void
    {
        $this->assertNull($this->site->last_active_at);

        $this->save('one');

        $this->assertNotNull($this->site->fresh()->last_active_at);
    }
}
