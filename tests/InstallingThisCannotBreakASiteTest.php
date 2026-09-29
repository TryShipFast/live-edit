<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use ShipFast\LiveEdit\Http\Middleware\TagsEditableMarkup;
use ShipFast\LiveEdit\Support\PublishedContent;
use Symfony\Component\HttpFoundation\Response;

/**
 * Installing this package must not be able to take a site down.
 *
 * Learned on a live one, on 2026-09-29. An API-driven Laravel frontend added
 * the engine. Its own pages need no database, so its default connection had
 * pointed at a SQLite file that never existed on that server, for months,
 * harmlessly. The first request for `live_edit_settings` threw and every page
 * on the site answered 500.
 *
 * The site was fine. The application needed no database. This package was the
 * only thing that did, and it took the whole site with it.
 *
 * A site with no usable database has nothing stored, which is exactly what a
 * fresh install is and is an entirely ordinary state. It renders the words
 * already in its templates, the same as before anybody installed anything.
 */
class InstallingThisCannotBreakASiteTest extends TestCase
{
    private function withNoDatabase(): void
    {
        // A connection that cannot answer, which is the shape of the outage:
        // not a missing table, a missing database.
        config()->set('database.connections.broken', [
            'driver' => 'sqlite',
            'database' => '/nowhere/that/exists/database.sqlite',
        ]);
        // Only THIS package is pointed at it, which is both closer to the
        // real fault and keeps the rest of the test run working.
        config()->set('live-edit.connection', 'broken');
        DB::purge('broken');
    }

    public function test_a_site_with_no_database_still_has_its_words(): void
    {
        $this->withNoDatabase();

        // Empty, not an exception. The page then renders whatever the
        // template already said.
        $this->assertSame([], PublishedContent::settings());
    }

    public function test_styles_do_not_bring_the_page_down_either(): void
    {
        $this->withNoDatabase();

        $this->assertSame([], PublishedContent::styles());
    }

    public function test_nothing_is_published_when_nothing_can_be_asked(): void
    {
        // hasTable() needs a working connection to answer, so it throws
        // rather than returning false. That is the case that took the site
        // down, and the guard that existed did not cover it.
        $this->withNoDatabase();

        $this->assertNull(PublishedContent::version());
    }

    public function test_a_working_database_still_answers_normally(): void
    {
        // The guard must not turn a real fault into silence for the sites
        // that genuinely do keep their words here.
        $this->assertIsArray(PublishedContent::settings());
        $this->assertNull(PublishedContent::version());
    }

    public function test_a_visitors_page_still_renders_with_no_database(): void
    {
        /*
         * The exact path that took the site down, and the most dangerous read
         * in the package: this middleware runs for EVERY visitor, not only an
         * editor, because a client's published words have to reach the
         * public. Whatever it does, it does to every page of every site with
         * auto-tagging switched on.
         */
        config()->set('live-edit.auto_tag', true);
        $this->withNoDatabase();

        $html = '<html lang="en"><body><h1>The words already in the template</h1></body></html>';

        $response = (new TagsEditableMarkup)->handle(
            Request::create('/', 'GET'),
            fn (): Response => new Response($html, 200, ['Content-Type' => 'text/html'])
        );

        $this->assertSame(200, $response->getStatusCode());
        $this->assertStringContainsString('The words already in the template', (string) $response->getContent());
    }

    private function wordsLiveWithTheService(): void
    {
        config()->set('live-edit.cloud.site', 'learnkasts');
        config()->set('live-edit.cloud.host', 'https://live.tryshipfast.com');
    }

    public function test_a_cloud_site_never_reaches_for_a_local_database(): void
    {
        /*
         * The root cause, rather than another guard on another read.
         *
         * A site whose words live with us is served our runtime, which tags
         * the markup in the browser and fetches content over the API.
         * Nothing in that arrangement involves the host's database - and on
         * an API-driven frontend there is no such database. Reading one
         * anyway took a live site down twice: the first fix guarded one
         * reader, and the next one along was not guarded either.
         *
         * The site's owner asked the right question, which was why a cloud
         * install was reading local settings at all. This is the answer in
         * the form of a test: the connection is one that cannot answer, and
         * nothing here may ask it.
         */
        $this->withNoDatabase();
        $this->wordsLiveWithTheService();
        config()->set('live-edit.auto_tag', true);

        $this->assertSame([], PublishedContent::settings());
        $this->assertSame([], PublishedContent::styles());
        $this->assertNull(PublishedContent::version());

        $html = '<html lang="en"><body><h1>The theme\'s own words</h1></body></html>';

        $response = (new TagsEditableMarkup)->handle(
            Request::create('/', 'GET'),
            fn (): Response => new Response($html, 200, ['Content-Type' => 'text/html'])
        );

        $this->assertSame(200, $response->getStatusCode());
        // Untouched: not merely un-broken, but not rewritten at all. There is
        // nothing here for this middleware to apply.
        $this->assertSame($html, (string) $response->getContent());
    }

    public function test_a_site_that_keeps_its_own_words_still_reads_them(): void
    {
        // The rule must not become "never read anything". A normal install
        // still keeps its content here and still renders it.
        config()->set('live-edit.cloud.site', null);
        config()->set('live-edit.cloud.host', null);

        $this->assertIsArray(PublishedContent::settings());
    }
}
