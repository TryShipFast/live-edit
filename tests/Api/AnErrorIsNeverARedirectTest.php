<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * A failed request answers with a reason, not with a redirect.
 *
 * Reported from a live site as a CORS failure:
 *
 *   Access to fetch at .../learnkasts/tag from origin https://learnkasts.com
 *   has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
 *   is present on the requested resource.
 *
 * The origin was allowed all along. Laravel redirects on a failed validation
 * unless the caller said it wanted JSON, the fetch follows that redirect to a
 * page with no CORS headers, and the browser reports the only thing it can see
 * - which sends whoever reads it into an origin allowlist that was never the
 * problem.
 *
 * Our own runtime sends `Accept: application/json`, so the editor never hit
 * this. Every other caller is somebody else's code, and "remember this header
 * or the errors become unreadable" is not a contract worth having.
 */
class AnErrorIsNeverARedirectTest extends TestCase
{
    private Site $site;

    private string $key;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api.enabled', true);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'allowed_origins' => ['https://acme.test'],
        ]);

        [, $this->key] = $this->site->issueToken(TokenType::Publishable, 'Web');
    }

    public function test_a_failed_validation_is_a_422_and_not_a_redirect(): void
    {
        // Deliberately without Accept: application/json, which is the whole
        // case. With it, this always worked.
        $response = $this->post('/api/live-edit/v1/acme/tag', [], [
            'Authorization' => 'Bearer '.$this->key,
            'Origin' => 'https://acme.test',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('application/json', (string) $response->headers->get('Content-Type'));
    }

    public function test_the_reason_is_in_the_answer(): void
    {
        /*
         * A 422 with nothing in it is only marginally better than a redirect.
         * The field that was wrong is the one thing the caller needs.
         */
        $response = $this->post('/api/live-edit/v1/acme/tag', [], [
            'Authorization' => 'Bearer '.$this->key,
            'Origin' => 'https://acme.test',
        ]);

        // The field, named. A 422 with nothing in it is only marginally
        // better than a redirect.
        $this->assertStringContainsString('html', strtolower((string) $response->getContent()));
    }

    public function test_the_cors_header_is_on_the_failure_too(): void
    {
        /*
         * The other half. An error without this header is read by every
         * browser as an origin problem, whatever it actually was - so a
         * failure that cannot be seen is worse than the failure itself.
         */
        $response = $this->post('/api/live-edit/v1/acme/tag', [], [
            'Authorization' => 'Bearer '.$this->key,
            'Origin' => 'https://acme.test',
        ]);

        $this->assertContains(
            $response->headers->get('Access-Control-Allow-Origin'),
            ['https://acme.test', '*'],
            'a failure with no CORS header reads as a blocked origin whatever went wrong'
        );
    }

    public function test_even_a_caller_asking_for_a_page_is_given_json(): void
    {
        /*
         * Including HTML, deliberately. Every route here answers with JSON on
         * its best day, so a caller asking for a page is asking for something
         * that does not exist - and handing them an HTML error page instead is
         * the whole fault. An API that answers one way on success and another
         * on failure is an API whose failures nobody can read.
         */
        $request = \Illuminate\Http\Request::create('/api/live-edit/v1/acme/tag', 'POST');
        $request->headers->set('Accept', 'text/html');

        (new \ShipFast\LiveEdit\Http\Api\Middleware\AnswersJsonAlways)->handle(
            $request,
            fn () => response('fine')
        );

        $this->assertSame('application/json', $request->headers->get('Accept'));
    }

    public function test_a_caller_that_asked_for_nothing_is_given_json(): void
    {
        $request = \Illuminate\Http\Request::create('/api/live-edit/v1/acme/tag', 'POST');
        $request->headers->remove('Accept');

        (new \ShipFast\LiveEdit\Http\Api\Middleware\AnswersJsonAlways)->handle(
            $request,
            fn () => response('fine')
        );

        $this->assertSame('application/json', $request->headers->get('Accept'));
    }
}
