<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Site\Provisioner;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;

/**
 * There is one definition of a registered site, and both ways in produce it.
 *
 * A site can be registered from the console's form or from the command line,
 * and the two used to disagree. The form went through the Provisioner and got
 * a domain, a verification code, a platform and both dated keys. The command
 * wrote the row itself and got a slug, a name and nothing else.
 *
 * That divergence was harmless while the command was a developer's
 * convenience. It stopped being harmless when registering sites became the
 * urgent task, because a command is what somebody reaches for under time
 * pressure - and the site it made failed later and somewhere else, as a
 * licence refusal on a customer's page rather than an error in the terminal.
 *
 * These pin the two together by comparing them, rather than by listing what a
 * registered site happens to have today. A field added to one and not the
 * other is the fault this is here to catch.
 */
class RegisteringASiteMeansOneThingTest extends TestCase
{
    public function test_the_command_registers_what_the_form_registers(): void
    {
        $this->artisan('live-edit:site', [
            'action' => 'create',
            'name' => 'by-command',
            '--domain' => 'acme.com',
            '--platform' => 'wordpress',
            '--origins' => 'https://acme.com',
        ])->assertSuccessful();

        $viaForm = app(Provisioner::class)->create(
            'by-form', 'by-form', ['https://acme.com'], 'acme.com', 'wordpress'
        )['site'];

        $viaCommand = Site::query()->where('slug', 'by-command')->firstOrFail();

        foreach (['domain', 'platform', 'allowed_origins'] as $field) {
            $this->assertSame(
                $viaForm->$field,
                $viaCommand->$field,
                "the two ways of registering a site disagree about {$field}"
            );
        }

        // Not compared, because they are meant to differ. Only that the
        // command produced one at all: a site that cannot be verified is a
        // site whose licence can never be bound to its website.
        $this->assertNotEmpty($viaCommand->verification_code);
    }

    public function test_the_command_issues_both_keys_and_dates_them(): void
    {
        /*
         * A site with only one key cannot be used: the publishable key reads
         * and the secret key vouches for editors. The command used to issue
         * neither, so registering was two commands and the second was easy to
         * forget - and a site with no key is indistinguishable, from the
         * customer's side, from one that was never registered.
         *
         * Dated because the licence is annual. A key with no expiry is not a
         * licence, it is a one-off purchase billed annually until somebody
         * notices they can stop.
         */
        $this->artisan('live-edit:site', [
            'action' => 'create',
            'name' => 'keyed',
            '--domain' => 'acme.com',
        ])->assertSuccessful();

        $site = Site::query()->where('slug', 'keyed')->firstOrFail();
        $types = $site->tokens()->pluck('expires_at', 'type');

        foreach ([TokenType::Publishable, TokenType::Secret] as $type) {
            $this->assertArrayHasKey($type->value, $types->all(), "no {$type->value} key was issued");
            $this->assertNotNull($types[$type->value], "the {$type->value} key never expires, so it is not a licence");
        }
    }

    public function test_it_says_so_when_the_licence_is_for_no_website(): void
    {
        // The licence is for a website. Without one named the origin check has
        // nothing to compare against and verification cannot start, and
        // neither of those says so at the point it fails.
        $this->artisan('live-edit:site', ['action' => 'create', 'name' => 'no-domain'])
            ->expectsOutputToContain('not yet for any website')
            ->assertSuccessful();
    }

    public function test_it_says_which_half_of_registering_it_did_not_do(): void
    {
        /*
         * The command registers a licence. A site managed by a console has a
         * second half that lives there: an owner, a plan, a timezone, and a
         * record of who may sign in. A site registered here on a console
         * deployment is correctly licensed and invisible in the sites list,
         * on no plan, and impossible for its owner to sign in to.
         *
         * Printed rather than documented because the command now looks
         * complete enough to be trusted for a job it only half does - and it
         * is reached for under the time pressure that stops people checking.
         * This very mistake was nearly made from a chat message recommending
         * it for two console-managed sites.
         */
        $this->artisan('live-edit:site', [
            'action' => 'create',
            'name' => 'half-a-job',
            '--domain' => 'acme.com',
        ])
            ->expectsOutputToContain('licence only')
            ->expectsOutputToContain('console')
            ->assertSuccessful();
    }

    public function test_it_refuses_a_slug_the_licence_check_could_not_use(): void
    {
        // The form validates the slug through the Provisioner. The command
        // wrote whatever it was given, so a slug with a slash or a space
        // reached the database and broke the routes built from it.
        $this->artisan('live-edit:site', ['action' => 'create', 'name' => 'Not A Slug'])
            ->assertFailed();

        $this->assertSame(0, Site::query()->where('slug', 'Not A Slug')->count());
    }
}
