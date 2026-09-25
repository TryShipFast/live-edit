<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * One customer's key reaches one customer's site, and nothing else.
 *
 * This is the property the whole service rests on. Everything else here is a
 * feature; this is the thing that must not be wrong once. A key that crosses
 * between sites is not a bug somebody reports — it is somebody else's words
 * appearing on their page, found months later, and it ends the business.
 *
 * So the cases below are taken from the ROUTER rather than written out. Two
 * endpoints added the same day this was written — styles and media — had no
 * tenancy case at all, because a list maintained by hand records what somebody
 * remembered. Enumerating the routes means a new endpoint arrives already
 * covered, or this fails until it is.
 */
class BoundedToTheSiteTest extends TestCase
{
    protected Site $mine;

    protected Site $theirs;

    /** Keys for my site. */
    protected string $myPublishable;

    protected string $mySecret;

    protected string $mySession;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 1800,
            'throttle' => [
                'read' => ['burst' => ['max' => 600, 'seconds' => 60], 'sustained' => ['max' => 6000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 600, 'seconds' => 60], 'sustained' => ['max' => 6000, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 600, 'seconds' => 60], 'sustained' => ['max' => 6000, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 600, 'seconds' => 60], 'sustained' => ['max' => 6000, 'seconds' => 3600]],
                'upload' => ['burst' => ['max' => 600, 'seconds' => 60], 'sustained' => ['max' => 6000, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('cors.paths', []);
        $app['config']->set('live-edit.auto_keys', true);
        $app['config']->set('live-edit.settings', ['heroImage']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->mine = Site::query()->create([
            'slug' => 'mine', 'name' => 'Mine', 'allowed_origins' => ['https://mine.test'],
        ]);
        $this->theirs = Site::query()->create([
            'slug' => 'theirs', 'name' => 'Theirs', 'allowed_origins' => ['https://theirs.test'],
        ]);

        [, $this->myPublishable] = $this->mine->issueToken(TokenType::Publishable, 'Web');
        [, $this->mySecret] = $this->mine->issueToken(TokenType::Secret, 'Server');
        [, $this->mySession] = $this->mine->issueToken(
            TokenType::Session, 'Edit', [Ability::Read, Ability::Write, Ability::Publish], now()->addHour()
        );
    }

    /**
     * Every endpoint that names a site in its path, taken from the router.
     *
     * @return array<int, array{method: string, uri: string}>
     */
    protected function siteScopedRoutes(): array
    {
        $prefix = 'api/live-edit/v1/';
        $found = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            // The site-scoped group is the one whose path begins with the site
            // — provisioning names it later ("sites/{site}") and is a
            // different credential entirely.
            if (! str_starts_with($uri, $prefix.'{site')) {
                continue;
            }

            foreach ($route->methods() as $method) {
                if (in_array($method, ['HEAD', 'OPTIONS'], true)) {
                    continue;
                }

                $found[] = ['method' => $method, 'uri' => $uri];
            }
        }

        return $found;
    }

    /** Something plausible to send, so a refusal is about the key and not the body. */
    protected function bodyFor(string $uri): array
    {
        return match (true) {
            str_contains($uri, '/content') => ['key' => 'auto:1a2b3c4d5e6f', 'value' => 'Not yours'],
            str_contains($uri, '/styles') => ['key' => 'hero', 'props' => ['background' => '#000000']],
            str_contains($uri, '/media') => ['target' => 'setting:heroImage', 'url' => 'https://example.com/x.jpg'],
            str_contains($uri, '/restore') => ['version' => 1],
            str_contains($uri, '/export') => ['html' => '<p>theirs</p>', 'page' => 'index'],
            str_contains($uri, '/tag') => ['html' => '<p>theirs</p>'],
            default => [],
        };
    }

    protected function path(string $uri, Site $site): string
    {
        return '/'.str_replace(['{site:slug}', '{site}'], $site->slug, $uri);
    }

    /* ------------------------------------------------------------------ */

    public function test_every_site_scoped_endpoint_refuses_another_sites_key(): void
    {
        $routes = $this->siteScopedRoutes();

        $this->assertNotEmpty($routes, 'no site-scoped routes found — this test is checking nothing');

        $allowed = [];

        foreach ($routes as $route) {
            // My keys, pointed at their site. Every one of these must be
            // refused, whichever key it is: the publishable one that sits in
            // every page, the session one a browser holds, and the secret one.
            foreach ([
                'publishable' => $this->myPublishable,
                'session' => $this->mySession,
                'secret' => $this->mySecret,
            ] as $kind => $key) {
                $response = $this->json(
                    $route['method'],
                    $this->path($route['uri'], $this->theirs),
                    $this->bodyFor($route['uri']),
                    ['Authorization' => 'Bearer '.$key, 'Origin' => 'https://mine.test'],
                );

                if ($response->status() < 400) {
                    $allowed[] = "{$kind} key reached {$route['method']} {$route['uri']}";
                }
            }
        }

        $this->assertSame([], $allowed, 'a key reached a site it does not belong to');
    }

    public function test_the_words_of_one_site_never_appear_on_another(): void
    {
        // The end of the story, said plainly: whatever the refusals do, the
        // content must stay apart.
        $this->postJson('/api/live-edit/v1/mine/content',
            ['key' => 'auto:aaaaaaaaaaaa', 'value' => 'Words that belong to me'],
            ['Authorization' => 'Bearer '.$this->mySession, 'Origin' => 'https://mine.test'],
        )->assertOk();

        [, $theirSession] = $this->theirs->issueToken(
            TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour()
        );

        $theirContent = $this->getJson('/api/live-edit/v1/theirs/content',
            ['Authorization' => 'Bearer '.$theirSession, 'Origin' => 'https://theirs.test'],
        )->assertOk()->json('settings');

        $this->assertArrayNotHasKey('auto:aaaaaaaaaaaa', (array) $theirContent);
    }

    public function test_a_key_that_reads_cannot_write(): void
    {
        // The publishable key is printed into every page of a site, so it is
        // public by definition. Everything it can do, anybody can do.
        foreach ($this->siteScopedRoutes() as $route) {
            if ($route['method'] === 'GET') {
                continue;
            }

            // Two POSTs that are reads. Both take markup the caller already
            // has and hand it back — /tag as a list of positions, /prepare as
            // the finished page — carrying only content the publishable key
            // could fetch from /content anyway. They are POSTs because a whole
            // document does not fit in a query string, not because they change
            // anything.
            if (str_ends_with($route['uri'], '/tag') || str_ends_with($route['uri'], '/prepare')) {
                continue;
            }

            $this->json(
                $route['method'],
                $this->path($route['uri'], $this->mine),
                $this->bodyFor($route['uri']),
                ['Authorization' => 'Bearer '.$this->myPublishable, 'Origin' => 'https://mine.test'],
            )->assertStatus(403, "the public key reached {$route['method']} {$route['uri']}");
        }
    }

    public function test_a_browser_on_an_address_the_site_does_not_claim_is_refused(): void
    {
        // Blast radius rather than authentication: a copy of somebody's page
        // on an attacker's server holds the same public key, because that key
        // is in the markup. What stops it is that the request comes from an
        // address the site never listed.
        foreach (['https://attacker.test', 'https://mine.test.attacker.test', 'null'] as $origin) {
            $this->postJson('/api/live-edit/v1/mine/content',
                ['key' => 'auto:aaaaaaaaaaaa', 'value' => 'from somewhere else'],
                ['Authorization' => 'Bearer '.$this->mySession, 'Origin' => $origin],
            )->assertStatus(403, "a request from {$origin} was allowed");
        }
    }

    public function test_a_session_cannot_mint_another_session(): void
    {
        // A key a browser holds must not be able to renew itself into a new
        // one, or taking it out of a page once is taking it forever.
        $this->postJson('/api/live-edit/v1/mine/sessions', [],
            ['Authorization' => 'Bearer '.$this->mySession, 'Origin' => 'https://mine.test'],
        )->assertStatus(403);
    }

    public function test_a_suspended_site_stops_answering(): void
    {
        $this->mine->forceFill(['suspended_at' => now()])->save();

        $this->getJson('/api/live-edit/v1/mine/content',
            ['Authorization' => 'Bearer '.$this->myPublishable, 'Origin' => 'https://mine.test'],
        )->assertStatus(403);

        $this->postJson('/api/live-edit/v1/mine/content',
            ['key' => 'auto:aaaaaaaaaaaa', 'value' => 'x'],
            ['Authorization' => 'Bearer '.$this->mySession, 'Origin' => 'https://mine.test'],
        )->assertStatus(403);
    }

    public function test_a_revoked_key_stops_working_at_once(): void
    {
        $this->mine->tokens()->where('type', TokenType::Session->value)->update(['revoked_at' => now()]);

        $this->postJson('/api/live-edit/v1/mine/content',
            ['key' => 'auto:aaaaaaaaaaaa', 'value' => 'x'],
            ['Authorization' => 'Bearer '.$this->mySession, 'Origin' => 'https://mine.test'],
        )->assertStatus(401);
    }

    public function test_an_expired_session_stops_working(): void
    {
        [, $expired] = $this->mine->issueToken(
            TokenType::Session, 'Old', [Ability::Read, Ability::Write], now()->subMinute()
        );

        $this->postJson('/api/live-edit/v1/mine/content',
            ['key' => 'auto:aaaaaaaaaaaa', 'value' => 'x'],
            ['Authorization' => 'Bearer '.$expired, 'Origin' => 'https://mine.test'],
        )->assertStatus(401);
    }

    public function test_a_site_cannot_be_reached_by_dressing_up_its_name(): void
    {
        // The slug comes out of a URL and is looked up as a name. Anything
        // that turns a URL into a lookup without binding it is one clever
        // string away from resolving to something else.
        foreach (['mine%2F..%2Ftheirs', 'MINE', 'mine.', ' mine', 'mine/../theirs'] as $attempt) {
            $response = $this->getJson('/api/live-edit/v1/'.$attempt.'/content',
                ['Authorization' => 'Bearer '.$this->myPublishable, 'Origin' => 'https://mine.test'],
            );

            $this->assertNotSame(200, $response->status(), "'{$attempt}' resolved to a site");
        }
    }

    public function test_an_uploaded_file_lands_in_its_own_sites_folder(): void
    {
        config()->set('live-edit.disk', 'local');

        $path = $this->postJson('/api/live-edit/v1/mine/media', [],
            ['Authorization' => 'Bearer '.$this->mySession, 'Origin' => 'https://mine.test'],
        )->status();

        // Sent as multipart, which postJson cannot do.
        $stored = $this->post('/api/live-edit/v1/mine/media',
            ['file' => UploadedFile::fake()->image('x.jpg')],
            ['Authorization' => 'Bearer '.$this->mySession, 'Origin' => 'https://mine.test', 'Accept' => 'application/json'],
        )->assertOk()->json('path');

        $this->assertStringContainsString('/mine/', $stored);
        $this->assertStringNotContainsString('/theirs/', $stored);
        $this->assertGreaterThan(0, $path);
    }

    public function test_provisioning_is_not_reachable_with_a_sites_own_key(): void
    {
        // Creating sites is a different kind of power from editing one, so it
        // asks for a different credential. A leak from any customer's server
        // must not be able to provision against everybody.
        foreach ([$this->myPublishable, $this->mySession, $this->mySecret] as $key) {
            $this->postJson('/api/live-edit/v1/sites',
                ['slug' => 'stolen-'.bin2hex(random_bytes(3))],
                ['Authorization' => 'Bearer '.$key],
            )->assertStatus(in_array($this->app['config']->get('live-edit.api.provisioning_token'), [null, ''], true) ? 404 : 403);
        }
    }
}
