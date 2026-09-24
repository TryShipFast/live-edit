<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Published content as files.
 *
 * This is the part that lets a customer's pages be served without touching
 * this application at all, so what matters is that the files are written, that
 * they are read in preference to the database, that they never change once
 * written, and that one site's files can never be served as another's.
 */
class SnapshotTest extends TestCase
{
    private Site $acme;

    private Site $rival;

    private string $session;

    private string $secret;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
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
        $app['config']->set('live-edit.publishing', true);
        $app['config']->set('live-edit.snapshot_disk', 'snapshots');
        $app['config']->set('live-edit.snapshot_directory', 'live-edit/content');
        $app['config']->set('cors.paths', []);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('snapshots');

        $this->acme = Site::query()->create(['slug' => 'acme', 'name' => 'Acme', 'allowed_origins' => ['https://acme.test']]);
        $this->rival = Site::query()->create(['slug' => 'rival', 'name' => 'Rival', 'allowed_origins' => ['https://rival.test']]);

        [, $this->session] = $this->acme->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour());
        [, $this->secret] = $this->acme->issueToken(TokenType::Secret, 'Server');

        SiteSetting::query()->create(['site_id' => $this->acme->id, 'key' => 'heroTitle', 'value' => 'First words']);
        SiteSetting::query()->create(['site_id' => $this->rival->id, 'key' => 'heroTitle', 'value' => 'Rival words']);
    }

    private function url(string $path = '/content', string $site = 'acme'): string
    {
        return "/api/live-edit/v1/{$site}{$path}";
    }

    private function editor(): array
    {
        return ['Authorization' => 'Bearer '.$this->session, 'Origin' => 'https://acme.test'];
    }

    private function server(): array
    {
        return ['Authorization' => 'Bearer '.$this->secret];
    }

    private function publish(): void
    {
        $this->postJson($this->url('/publish'), [], $this->server())->assertOk();
    }

    public function test_publishing_writes_files_a_cdn_can_serve(): void
    {
        $this->publish();

        $disk = Storage::disk('snapshots');

        $disk->assertExists('live-edit/content/sites/acme/current.json');
        $disk->assertExists('live-edit/content/sites/acme/v1/en.json');

        $pointer = json_decode($disk->get('live-edit/content/sites/acme/current.json'), true);
        $this->assertSame(1, $pointer['version']);

        $file = json_decode($disk->get('live-edit/content/sites/acme/v1/en.json'), true);
        $this->assertSame('First words', $file['settings']['heroTitle']);
    }

    public function test_each_site_writes_under_its_own_directory(): void
    {
        // So a customer's distribution can be pointed at their content and
        // reach nothing else.
        $this->publish();
        (new SiteStore($this->rival))->publish();

        $disk = Storage::disk('snapshots');

        $this->assertStringContainsString('Rival words',
            $disk->get('live-edit/content/sites/rival/v1/en.json'));
        $this->assertStringNotContainsString('Rival words',
            $disk->get('live-edit/content/sites/acme/v1/en.json'));
    }

    public function test_reads_come_from_the_file_once_it_exists(): void
    {
        $this->publish();

        // Prove the file is what answers, by changing it underneath.
        $disk = Storage::disk('snapshots');
        $disk->put('live-edit/content/sites/acme/v1/en.json', json_encode([
            'settings' => ['heroTitle' => 'Straight from the file'],
            'styles' => [],
        ]));

        $this->getJson($this->url(), ['Authorization' => 'Bearer '.$this->session, 'Origin' => 'https://acme.test'])
            ->assertOk()
            ->assertJsonPath('settings.heroTitle', 'Straight from the file');
    }

    public function test_a_site_that_never_published_still_answers(): void
    {
        // No file, so the database answers and nothing changes for them.
        $this->getJson($this->url(), $this->editor())
            ->assertOk()
            ->assertJsonPath('settings.heroTitle', 'First words');
    }

    public function test_a_version_file_is_never_rewritten(): void
    {
        // That is what lets a consumer cache one forever, and what makes a
        // rollback a change of pointer rather than an unpicking of edits.
        $this->publish();
        $first = Storage::disk('snapshots')->get('live-edit/content/sites/acme/v1/en.json');

        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'Second words'], $this->editor())->assertOk();
        $this->publish();

        $this->assertSame($first, Storage::disk('snapshots')->get('live-edit/content/sites/acme/v1/en.json'));
        $this->assertStringContainsString('Second words',
            Storage::disk('snapshots')->get('live-edit/content/sites/acme/v2/en.json'));
    }

    public function test_the_pointer_moves_on_each_publish(): void
    {
        $this->publish();
        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'Second words'], $this->editor())->assertOk();
        $this->publish();

        $pointer = json_decode(Storage::disk('snapshots')->get('live-edit/content/sites/acme/current.json'), true);

        $this->assertSame(2, $pointer['version']);
    }

    public function test_an_earlier_version_can_be_put_back(): void
    {
        $this->publish();                                                   // v1: First words
        $this->postJson($this->url(), ['key' => 'heroTitle', 'value' => 'Regrettable'], $this->editor())->assertOk();
        $this->publish();                                                   // v2: Regrettable

        $this->postJson($this->url('/restore'), ['version' => 1], $this->server())
            ->assertOk()
            ->assertJsonPath('restored_from', 1);

        // Applied forward: the restore is the newest version, so history stays
        // append-only and undoing a bad rollback is the same operation again.
        $pointer = json_decode(Storage::disk('snapshots')->get('live-edit/content/sites/acme/current.json'), true);
        $this->assertSame(3, $pointer['version']);

        $this->getJson($this->url(), $this->editor())->assertJsonPath('settings.heroTitle', 'First words');
    }

    public function test_restoring_a_version_that_is_not_there_says_so(): void
    {
        $this->publish();

        $this->postJson($this->url('/restore'), ['version' => 99], $this->server())->assertStatus(404);
    }

    public function test_one_site_cannot_restore_from_anothers_history(): void
    {
        (new SiteStore($this->rival))->publish();

        // Rival has a v1; Acme does not. Acme asking for v1 must not get it.
        $this->postJson($this->url('/restore'), ['version' => 1], $this->server())->assertStatus(404);
    }

    public function test_the_addresses_of_the_files_can_be_listed(): void
    {
        config()->set('live-edit.snapshot_url', 'https://cdn.test/content');
        $this->publish();

        $response = $this->getJson($this->url('/versions'), $this->editor())->assertOk();

        $this->assertSame(1, $response->json('current'));
        $this->assertSame('https://cdn.test/content/sites/acme/current.json', $response->json('pointer'));
        $this->assertSame('https://cdn.test/content/sites/acme/v1/en.json', $response->json('versions.0.url'));
    }

    public function test_removing_a_site_removes_its_published_files(): void
    {
        $this->publish();
        Storage::disk('snapshots')->assertExists('live-edit/content/sites/acme/current.json');

        $this->acme->delete();

        Storage::disk('snapshots')->assertMissing('live-edit/content/sites/acme/current.json');
    }
}
