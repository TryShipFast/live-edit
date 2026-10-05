<?php

namespace ShipFast\LiveEdit\Tests;

/**
 * The runtime asks every page which languages this site is written in, because
 * the language picker has to know whether there is a choice before it can
 * decide to stay hidden.
 *
 * On a site we host, support.js rewrites that path to the content API. A site
 * keeping its own content has no rewrite, so it asks here. There was no route,
 * so it got a 404 on every page load of every self-hosted install.
 *
 * Nothing broke: the call sits inside a try/catch that swallows it and the
 * picker correctly stayed hidden. What it left was a red line in the console
 * of a working install, which is how a working install gets reported as
 * broken. It was.
 */
class TheLanguagePickerCanAskWhatLanguagesExistTest extends TestCase
{
    public function test_a_self_hosted_site_answers_rather_than_404ing(): void
    {
        $this->getJson('/live-edit/translations')
            ->assertOk()
            ->assertJson([
                'default_locale' => 'en',
                'locales' => ['en'],
                'names' => ['en' => 'English'],
            ]);
    }

    public function test_it_reports_the_languages_the_host_declared(): void
    {
        // Where a host says what it writes in, and where the docs send them.
        config(['live-edit.locales' => ['en' => 'English', 'fr' => 'French']]);

        $response = $this->getJson('/live-edit/translations')->assertOk();

        $this->assertSame(['en', 'fr'], $response->json('locales'));
        $this->assertSame('French', $response->json('names.fr'));
    }

    public function test_it_names_the_languages_rather_than_sending_codes(): void
    {
        /*
         * A menu reading "French" is the point of sending names at all. Left
         * to a code the browser guesses, and guesses differently on every
         * device, so two people looking at the same site see two menus.
         */
        config(['live-edit.locales' => ['en' => 'English', 'de' => 'Deutsch']]);

        $names = $this->getJson('/live-edit/translations')->assertOk()->json('names');

        $this->assertSame(['en' => 'English', 'de' => 'Deutsch'], $names);
    }

    public function test_it_does_not_claim_to_track_what_has_drifted(): void
    {
        /*
         * The hosted service answers needing_review and stale because it holds
         * both sides of a translation and stamps them. A site keeping content
         * in its own database has no such record, and an empty count would
         * read as "nothing has drifted" rather than "nobody is counting here".
         */
        $body = $this->getJson('/live-edit/translations')->assertOk()->json();

        $this->assertArrayNotHasKey('needing_review', $body);
        $this->assertArrayNotHasKey('stale', $body);
    }

    public function test_one_language_is_still_answered_rather_than_refused(): void
    {
        // The runtime decides whether to show a picker. Answering "one" is how
        // it knows to hide it; refusing the question is how it logs an error.
        config(['live-edit.locales' => ['en' => 'English']]);

        $this->getJson('/live-edit/translations')
            ->assertOk()
            ->assertJsonCount(1, 'locales');
    }
}
