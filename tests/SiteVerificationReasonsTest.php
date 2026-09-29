<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\SiteVerification;

/**
 * Why a domain did not verify, said accurately.
 *
 * A wrong reason is worse than a vague one, because it sends somebody to the
 * wrong place. Met for real on 2026-09-29: a site answered a branded 500 page
 * and the console reported "nothing answered, check the site is live and
 * reachable from the internet" - so the owner went looking at DNS while their
 * own application was the thing erroring.
 */
class SiteVerificationReasonsTest extends TestCase
{
    private function site(): Site
    {
        return Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'domain' => 'acme.com',
            'allowed_origins' => [],
            'verification_code' => 'shipfast-verify-abc123',
        ]);
    }

    public function test_a_site_that_errors_is_not_called_unreachable(): void
    {
        Http::fake(['*' => Http::response('<html><title>500</title></html>', 500)]);

        $this->assertSame('site_errored', SiteVerification::attempt($this->site())['reason']);
    }

    public function test_a_page_that_is_not_there_says_so(): void
    {
        Http::fake(['*' => Http::response('Not found', 404)]);

        $this->assertSame('no_page_there', SiteVerification::attempt($this->site())['reason']);
    }

    public function test_a_page_without_the_tag_is_not_found_rather_than_broken(): void
    {
        // The ordinary case: the site is fine and nobody has added the tag.
        Http::fake(['*' => Http::response('<html><head></head><body>Hello</body></html>', 200)]);

        $this->assertSame('not_found', SiteVerification::attempt($this->site())['reason']);
    }

    public function test_the_tag_still_verifies(): void
    {
        Http::fake(['*' => Http::response(
            '<html><head><meta name="shipfast-site-verification" content="shipfast-verify-abc123"></head></html>',
            200
        )]);

        $result = SiteVerification::attempt($this->site());

        $this->assertTrue($result['verified']);
        $this->assertSame('meta', $result['method']);
    }
}
