<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * The command that should have existed before the last four releases.
 *
 * A cloud install with no app key could not read published content while
 * rendering a page and fell back to an ancient snapshot nobody knew was there.
 * The editor worked, the browser applied every change, and the owner saw their
 * site exactly as they had left it. Only visitors and crawlers got the theme's
 * copy. Locating it took four releases and three wrong theories, almost all of
 * the effort spent reconstructing from outside what the server could have said
 * in one line.
 *
 * So what is tested here is not that the command runs. It is that each of the
 * four ways this can be broken produces a different, nameable answer, because
 * a diagnostic that says the same thing about a missing key, a refused key and
 * an unreachable service would have saved nobody any time at all.
 */
class DiagnosingWhereAPagesWordsComeFromTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('live-edit.cloud.host', 'https://live.tryshipfast.com');
        config()->set('live-edit.cloud.site', 'learnkasts');
        config()->set('live-edit.licence.host', 'https://live.tryshipfast.com');
        config()->set('live-edit.licence.site', 'learnkasts');
        config()->set('live-edit.snapshot_url', null);
        config()->set('live-edit.remote_content', true);
    }

    public function test_a_cloud_install_with_no_key_is_told_exactly_that(): void
    {
        config()->set('live-edit.licence.key', '');

        $this->artisan('live-edit:diagnose')
            ->expectsOutputToContain('app key           NOT SET')
            // One per line written, which is all the helper can match: it
            // routes a single write to the first expectation that fits.
            ->expectsOutputToContain('No LIVE_EDIT_APP_KEY')
            ->expectsOutputToContain('Visitors and crawlers are being served')
            ->assertExitCode(1);
    }

    public function test_a_refused_key_is_not_reported_as_a_missing_one(): void
    {
        /*
         * Different problem, different owner. From the page these are
         * identical: both end in the theme's words being served.
         */
        config()->set('live-edit.licence.key', 'kbp_wrong');

        Http::fake(['*' => Http::response(['message' => 'Unauthenticated.'], 401)]);

        $this->artisan('live-edit:diagnose')
            ->expectsOutputToContain('app key           set')
            ->expectsOutputToContain('the key was refused')
            ->assertExitCode(1);
    }

    public function test_an_unreachable_service_says_so_rather_than_saying_nothing(): void
    {
        config()->set('live-edit.licence.key', 'kbp_fine');

        Http::fake(fn () => throw new ConnectionException('Connection timed out'));

        $this->artisan('live-edit:diagnose')
            ->expectsOutputToContain('unreachable')
            ->assertExitCode(1);
    }

    public function test_a_working_install_says_how_many_overrides_a_page_will_get(): void
    {
        // The positive control. Without it every assertion above would pass on
        // a command that only ever reported bad news.
        config()->set('live-edit.licence.key', 'kbp_fine');

        Http::fake(['*' => Http::response([
            'version' => 5,
            'settings' => ['auto:a' => 'one', 'auto:b' => 'two', 'auto:c' => 'three'],
        ])]);

        $this->artisan('live-edit:diagnose')
            ->expectsOutputToContain('service publishes 3 override(s)')
            ->expectsOutputToContain('overrides in use  3')
            ->assertExitCode(0);
    }

    public function test_it_says_when_tagging_is_off_because_then_nothing_is_applied_either_way(): void
    {
        /*
         * The other way to serve the theme's words with everything else
         * correct, and one nobody thinks to check: content reads perfectly and
         * no element has a key to match it to.
         */
        config()->set('live-edit.licence.key', 'kbp_fine');
        config()->set('live-edit.auto_tag', false);

        Http::fake(['*' => Http::response(['settings' => ['auto:a' => 'one']])]);

        $this->artisan('live-edit:diagnose')
            ->expectsOutputToContain('auto tagging      OFF')
            ->assertExitCode(0);
    }

    public function test_it_never_prints_the_key(): void
    {
        /*
         * This is a command people paste into chat and into support tickets.
         * The key is publishable rather than secret, and that is still no
         * reason for a diagnostic to be how it gets spread around.
         */
        config()->set('live-edit.licence.key', 'kbp_5cfd41aaa7bd6e3f_secretlookingtail');

        Http::fake(['*' => Http::response(['settings' => ['auto:a' => 'one']])]);

        $this->artisan('live-edit:diagnose')
            ->doesntExpectOutputToContain('kbp_5cfd41aaa7bd6e3f')
            ->doesntExpectOutputToContain('secretlookingtail')
            ->assertExitCode(0);
    }

    public function test_a_self_hosted_install_is_not_asked_about_a_service(): void
    {
        // It has no licence to talk about and no key to be missing. Telling a
        // self-hosted install its app key is unset would be noise.
        config()->set('live-edit.cloud.host', null);
        config()->set('live-edit.cloud.site', null);
        config()->set('live-edit.licence.site', null);

        Http::fake();

        $this->artisan('live-edit:diagnose')
            ->expectsOutputToContain('content lives     in this application')
            ->doesntExpectOutputToContain('service           HTTP');

        /*
         * Not "nothing was sent", which is what this asserted first and was
         * wrong about: a self-hosted install legitimately reads its own
         * snapshot, and that is a request. What must not happen is this
         * install being asked about a licence it does not have.
         */
        Http::assertNotSent(fn ($request) => str_contains($request->url(), '/api/live-edit/'));
    }
}
