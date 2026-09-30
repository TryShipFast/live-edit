<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Content\Translations;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * One canonical value with translations hanging off it, not seven independent
 * pieces of content.
 *
 * The failure this closes is quiet and expensive. A site running seven
 * languages has its English edited; the save works, the editor says so, and
 * six pages go on serving translations of the sentence that used to be there.
 * Nothing anywhere knows. The site looks finished and is wrong in five
 * languages nobody on the team reads, for as long as it takes somebody to
 * notice - which on a marketing site can be never.
 *
 * Nothing here overwrites a translation and nothing offers to. Replacing
 * "Learn from the best educators" with "Learn from Africa's leading educators"
 * is a change of meaning, and machine-translating over somebody's reviewed
 * French without telling them is a worse failure than leaving it stale and
 * saying so. This marks; a person decides.
 */
class EditingEnglishDoesNotSilentlyBreakSixLanguagesTest extends TestCase
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
        $app['config']->set('live-edit.default_locale', 'en');
        $app['config']->set('live-edit.locales', [
            'en' => 'English', 'fr' => 'French', 'es' => 'Spanish',
            'de' => 'German', 'pt' => 'Portuguese', 'ar' => 'Arabic', 'sw' => 'Swahili',
        ]);
        $app['config']->set('cors.paths', []);
    }

    private function site(): Site
    {
        return Site::query()->create([
            'slug' => 'learnkasts',
            'name' => 'LearnKasts',
            'allowed_origins' => ['https://learnkasts.com'],
            'domain' => 'learnkasts.com',
            'verified_at' => now(),
        ]);
    }

    /** The English, then the same sentence in six languages. */
    private function aTranslatedSite(): Site
    {
        $site = $this->site();
        $store = new SiteStore($site);

        $store->put('homepage.hero.title', 'Learn from the best educators', false);

        foreach ([
            'fr' => 'Apprenez auprès des meilleurs éducateurs',
            'es' => 'Aprende de los mejores educadores',
            'de' => 'Lernen Sie von den besten Pädagogen',
            'pt' => 'Aprenda com os melhores educadores',
            'ar' => 'تعلم من أفضل المعلمين',
            'sw' => 'Jifunze kutoka kwa waelimishaji bora',
        ] as $locale => $said) {
            $store->put("{$locale}:homepage.hero.title", $said, false);
        }

        return $site;
    }

    public function test_every_translation_starts_current(): void
    {
        $site = $this->aTranslatedSite();

        $this->assertSame([], Translations::needingReview($site));
        $this->assertCount(6, Translations::statusFor($site));
    }

    public function test_changing_the_english_puts_every_translation_under_review(): void
    {
        $site = $this->aTranslatedSite();

        (new SiteStore($site))->put('homepage.hero.title', "Learn from Africa's leading educators", false);

        $review = Translations::needingReview($site);

        $this->assertCount(6, $review);
        foreach (['fr', 'es', 'de', 'pt', 'ar', 'sw'] as $locale) {
            $this->assertSame(1, $review[$locale] ?? 0, "{$locale} was not flagged after the English changed");
        }
    }

    public function test_the_translations_themselves_are_never_touched(): void
    {
        /*
         * The rule that matters most. Marking is cheap to undo and a person
         * can decide; overwriting somebody's reviewed French with a machine's
         * guess is not, and the site would go on looking finished.
         */
        $site = $this->aTranslatedSite();

        (new SiteStore($site))->put('homepage.hero.title', "Learn from Africa's leading educators", false);

        $this->assertDatabaseHas('live_edit_site_settings', [
            'site_id' => $site->id,
            'key' => 'fr:homepage.hero.title',
            'value' => 'Apprenez auprès des meilleurs éducateurs',
        ]);
    }

    public function test_the_french_page_still_serves_french_while_it_is_stale(): void
    {
        /*
         * Flagged is not withdrawn. A stale translation is still the best
         * thing to show a French reader - certainly better than English - and
         * taking it down because it needs review would turn an editorial note
         * into an outage in six languages.
         */
        $site = $this->aTranslatedSite();

        (new SiteStore($site))->put('homepage.hero.title', 'Changed', false);

        $published = (new SiteStore($site))->published('fr');

        $this->assertSame('Apprenez auprès des meilleurs éducateurs', $published['homepage.hero.title']);
    }

    public function test_retranslating_clears_the_flag_for_that_language_alone(): void
    {
        $site = $this->aTranslatedSite();
        $store = new SiteStore($site);

        $store->put('homepage.hero.title', "Learn from Africa's leading educators", false);
        $store->put('fr:homepage.hero.title', "Apprenez auprès des meilleurs éducateurs d'Afrique", false);

        $review = Translations::needingReview($site);

        $this->assertArrayNotHasKey('fr', $review);
        $this->assertSame(5, count($review));
    }

    public function test_undoing_the_english_makes_the_translations_current_again(): void
    {
        /*
         * The case a version number gets wrong, and the reason this compares a
         * fingerprint of the words instead. Somebody edits the English, looks
         * at it, and puts it back. A counter has moved twice and every
         * translation is stale forever, though not one word of what they were
         * translated from has changed.
         */
        $site = $this->aTranslatedSite();
        $store = new SiteStore($site);

        $store->put('homepage.hero.title', 'Something else entirely', false);
        $this->assertCount(6, Translations::needingReview($site));

        $store->put('homepage.hero.title', 'Learn from the best educators', false);

        $this->assertSame([], Translations::needingReview($site));
    }

    public function test_a_translation_of_words_that_live_in_the_template_is_not_stale(): void
    {
        /*
         * Nobody has edited the English, so it is still whatever the template
         * says and there is no stored canonical to have gone out of step with.
         * Calling these stale would put every translation on an untouched site
         * under review on the day this shipped, which is how a warning teaches
         * people to ignore it.
         */
        $site = $this->site();

        (new SiteStore($site))->put('fr:homepage.hero.title', 'Apprenez', false);

        $this->assertSame([], Translations::needingReview($site));
    }

    public function test_the_scanners_own_keys_are_not_read_as_a_language(): void
    {
        // "auto:1a2b3c" looks exactly like a locale prefix. Reading it as one
        // has cost this codebase a day before.
        $site = $this->site();

        (new SiteStore($site))->put('auto:1a2b3c', 'Some words', false);

        $this->assertSame([], Translations::statusFor($site));
        $this->assertNull(Translations::localeOf('auto:1a2b3c', Translations::declaredLocales()));
    }

    public function test_the_editor_can_ask_which_languages_need_review(): void
    {
        $site = $this->aTranslatedSite();
        (new SiteStore($site))->put('homepage.hero.title', 'Changed', false);

        [, $key] = $site->issueToken(TokenType::Publishable, 'Web', null, now()->addYear());

        $this->getJson('/api/live-edit/v1/learnkasts/translations', ['Authorization' => 'Bearer '.$key])
            ->assertOk()
            ->assertJsonPath('default_locale', 'en')
            ->assertJsonPath('counts.translated', 6)
            ->assertJsonPath('counts.stale', 6)
            ->assertJsonPath('needing_review.fr', 1);
    }

    public function test_only_languages_the_site_declares_are_treated_as_languages(): void
    {
        $site = $this->site();
        $store = new SiteStore($site);

        $store->put('homepage.hero.title', 'Words', false);
        // Not in the configured list, so it is a key with a colon in it and
        // not a Klingon translation.
        $store->put('tlh:homepage.hero.title', 'Something', false);

        $this->assertSame([], Translations::statusFor($site));
    }
}
