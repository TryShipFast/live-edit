<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\LiveEdit;
use ShipFast\LiveEdit\Support\PluginArchive;
use ShipFast\LiveEdit\Tests\TestCase;
use ZipArchive;

/**
 * A WordPress site finding out that a newer plugin exists.
 *
 * There was no way for it to. WordPress offers an update only when something
 * claims one is available, the plugin claimed nothing, and so a site that
 * installed it in August would be running August's copy next year. Every fix
 * released in between reached a WordPress customer only if they happened to
 * come back to the console, download the zip again and upload it by hand,
 * having never been told there was any reason to.
 *
 * Found on 2026-09-30 while checking that the plugins were current and
 * downloadable. They were downloadable. The plugin's own version header had
 * sat at 0.12.0 through nine engine releases, so even a customer who did
 * re-download got current code wearing an old number - and WordPress, which
 * decides whether an update exists by comparing exactly that number, would
 * still have offered nothing.
 */
class TheWordPressPluginCanUpdateItselfTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $limits = ['burst' => ['max' => 500, 'seconds' => 60], 'sustained' => ['max' => 5000, 'seconds' => 3600]];

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'admin_token' => 'provision-me',
            'throttle' => array_fill_keys(
                ['read', 'write', 'session', 'publish', 'upload', 'provision', 'sign_in'],
                $limits
            ),
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);
    }

    /** @return array{slug: string, headers: array<string, string>} */
    private function aSiteWithAKey(): array
    {
        $site = Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'allowed_origins' => ['https://acme.test'],
            'domain' => 'acme.test',
            'verification_code' => 'shipfast-verify-abc123',
            'verified_at' => now(),
        ]);

        [, $plain] = $site->issueToken(TokenType::Publishable, 'Web', null, now()->addYear());

        return ['slug' => $site->slug, 'headers' => ['Authorization' => 'Bearer '.$plain]];
    }

    public function test_the_plugin_header_matches_the_release(): void
    {
        /*
         * The guard that matters most here, and the reason this is a test
         * rather than a note. Two numbers that have to agree by hand is one
         * number that will eventually be wrong, and this one already was for
         * nine releases. Releasing without bumping both now fails the build.
         */
        $this->assertSame(
            LiveEdit::VERSION,
            PluginArchive::version(),
            'the WordPress plugin header and the release have drifted apart, which is how a fix stops reaching WordPress customers'
        );
    }

    public function test_it_tells_a_site_what_the_newest_plugin_is(): void
    {
        $site = $this->aSiteWithAKey();

        $this->getJson("/api/live-edit/v1/{$site['slug']}/plugin", $site['headers'])
            ->assertOk()
            ->assertJsonPath('version', LiveEdit::VERSION)
            ->assertJsonPath('slug', 'kastsbuild')
            ->assertJsonStructure(['version', 'slug', 'download_url', 'requires_php']);
    }

    public function test_the_address_it_gives_back_is_one_wordpress_can_fetch(): void
    {
        // Absolute, because WordPress downloads it from the site's own server
        // rather than from a browser that already knows where it is.
        $site = $this->aSiteWithAKey();

        $url = $this->getJson("/api/live-edit/v1/{$site['slug']}/plugin", $site['headers'])->json('download_url');

        $this->assertStringStartsWith('http', $url);
        $this->assertStringContainsString("/{$site['slug']}/plugin/download", $url);
    }

    public function test_a_site_with_no_key_is_told_nothing(): void
    {
        $site = $this->aSiteWithAKey();

        $this->getJson("/api/live-edit/v1/{$site['slug']}/plugin")->assertUnauthorized();
        $this->get("/api/live-edit/v1/{$site['slug']}/plugin/download")->assertUnauthorized();
    }

    public function test_the_download_is_a_plugin_wordpress_can_install(): void
    {
        $site = $this->aSiteWithAKey();

        $response = $this->get("/api/live-edit/v1/{$site['slug']}/plugin/download", $site['headers']);
        $response->assertOk();

        $file = tempnam(sys_get_temp_dir(), 'downloaded').'.zip';
        file_put_contents($file, $response->streamedContent());

        $zip = new ZipArchive;
        $this->assertTrue($zip->open($file) === true, 'what came back was not a readable zip');

        $names = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $names[] = $zip->getNameIndex($i);
        }
        $zip->close();
        @unlink($file);

        // Everything under one folder: WordPress installs the folder, and a
        // flat zip lands as a plugin with no name.
        $this->assertContains('kastsbuild/kastsbuild.php', $names);

        // The engine must not travel inside the plugin. It did once - some
        // seventeen hundred files - and that copy froze at whatever version a
        // customer installed while the runtime beside it stayed current.
        $this->assertEmpty(
            array_filter($names, fn ($name) => str_contains($name, '/vendor/')),
            'a vendor tree is back in the plugin download, which is how the plugin starts going stale again'
        );
    }

    public function test_the_version_is_read_from_the_plugin_itself(): void
    {
        // Read from the header rather than held beside it, because the header
        // is the number WordPress compares against on the other side.
        $header = file_get_contents(PluginArchive::source().'/kastsbuild.php');

        $this->assertMatchesRegularExpression(
            '/^\s*\*\s*Version:\s*'.preg_quote(PluginArchive::version(), '/').'\s*$/m',
            $header
        );
    }
}
