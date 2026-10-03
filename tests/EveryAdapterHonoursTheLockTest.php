<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Gate;
use ShipFast\LiveEdit\Application\Api\IssueEditSession;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * A guardrail is only a guardrail on the platforms that honour it.
 *
 * data-live-lock is read by the scanner, and three different things run that
 * scanner. A site on the service asks the API. A self-hosted Laravel install
 * runs it in its own middleware. WordPress mints its own sessions, because it
 * knows which of its users is at the keyboard and we have no way to.
 *
 * Only the first of those was asking. The other two would have shipped a
 * feature that is documented, visible in the console, and silently absent -
 * which is worse than not having it, because somebody would hand over a site
 * believing the nav was safe.
 *
 * Both gaps have the same shape and the same answer: the host knows who this
 * is, so the host says. A Laravel application says it through a gate, the way
 * it already says who may edit at all. A host minting a session says it at the
 * moment of minting, which is the only moment anybody knows.
 */
class EveryAdapterHonoursTheLockTest extends TestCase
{
    public function test_a_session_a_host_minted_can_be_narrowed(): void
    {
        /*
         * The WordPress case. The session has nobody behind it - that is the
         * whole reason minting exists - so without being told at mint time it
         * looks like the site asking about itself, and a site may edit all of
         * itself.
         */
        $site = Site::query()->create(['slug' => 'client', 'name' => 'Client']);

        (new IssueEditSession)($site, 'An editor', null, false);

        $token = $site->tokens()->latest('id')->firstOrFail();

        $this->assertFalse($token->mayEditLocked());
    }

    public function test_a_session_minted_the_old_way_still_sees_everything(): void
    {
        // An older plugin against a newer service sends no flag at all, and
        // must keep working exactly as it did.
        $site = Site::query()->create(['slug' => 'client', 'name' => 'Client']);

        (new IssueEditSession)($site, 'An editor');

        $this->assertTrue($site->tokens()->latest('id')->firstOrFail()->mayEditLocked());
    }

    public function test_a_site_key_is_the_site_asking_about_itself(): void
    {
        /*
         * The publishable key in every page and the secret key on a server
         * have no person behind them and are not narrowed by anybody. They
         * must keep seeing the whole site, or tagging for visitors would start
         * withholding the regions the client is allowed to edit.
         */
        $site = Site::query()->create(['slug' => 'client', 'name' => 'Client']);

        [$token] = $site->issueToken(\ShipFast\LiveEdit\Domain\Site\TokenType::Publishable, 'In the page');

        $this->assertTrue($token->mayEditLocked());
    }

    public function test_a_self_hosted_install_that_never_heard_of_locking_is_unaffected(): void
    {
        /*
         * The upgrade path. An application with no live-edit-locked gate is
         * every application that exists today, and the answer for it has to be
         * what it meant yesterday.
         */
        $this->assertFalse(Gate::has('live-edit-locked'));
    }

    public function test_a_self_hosted_install_can_narrow_it_with_its_own_gate(): void
    {
        // Said the way that application already says who may edit at all.
        Gate::define('live-edit-locked', fn () => false);

        $this->assertTrue(Gate::has('live-edit-locked'));
        $this->assertFalse(Gate::allows('live-edit-locked'));
    }
}
