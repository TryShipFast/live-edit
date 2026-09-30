<?php

namespace ShipFast\LiveEdit\Tests\WordPress;

use KastsBuild\Content;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * The end of the translation chain, which was the part a reader sees.
 *
 * Everything else existed: keys stored per locale, a unique index that keeps
 * them apart, a save that accepts a language, a menu in the editor bar. Then
 * `Frontend` asked for content without saying which language, so a French row
 * stored perfectly correctly was never served to anybody. The whole feature
 * worked except being read.
 *
 * Two rules here, both of which fail silently if they are wrong, which is why
 * they are worth pinning. A page in the wrong language renders beautifully.
 *
 * Tested away from WordPress, as the rest of this folder is: what can be got
 * wrong is the order of an array and the spelling of a string, and the
 * database has nothing to say about either.
 */
class AFrenchPageIsServedInFrenchTest extends TestCase
{
    private function loadPlugin(): void
    {
        require_once __DIR__.'/../../packages/wordpress/kastsbuild/includes/Content.php';
    }

    public function test_an_untranslated_sentence_keeps_the_clients_own_words(): void
    {
        /*
         * The reason this is a layering and not a lookup.
         *
         * Asking the table for locale = 'fr' alone returns only what has been
         * translated, so every other element falls back past the client's
         * edits and renders whatever the theme shipped with. A half-translated
         * site would have served half of somebody else's copy - and it would
         * have looked completely normal.
         */
        $this->loadPlugin();

        $served = Content::overlaid(
            ['auto:title' => 'Our own words', 'auto:body' => 'Edited last week'],
            ['auto:title' => 'Nos propres mots'],
        );

        $this->assertSame([
            'auto:title' => 'Nos propres mots',
            'auto:body' => 'Edited last week',
        ], $served);
    }

    public function test_a_translation_cleared_on_purpose_stays_cleared(): void
    {
        // A missing row means nobody has translated it. An empty row means
        // somebody emptied it. Treating the two alike would make a cleared
        // French heading spring back to English.
        $this->loadPlugin();

        $this->assertSame(
            ['auto:title' => ''],
            Content::overlaid(['auto:title' => 'Our own words'], ['auto:title' => ''])
        );
    }

    public function test_both_spellings_of_a_language_are_tried(): void
    {
        /*
         * WordPress says fr_FR and a site's languages are usually listed as
         * fr. Guessing one spelling means a correctly stored translation is
         * never found, and the page renders perfectly in the wrong language
         * with nothing to say why.
         */
        $this->loadPlugin();

        $this->assertSame(['fr-fr', 'fr'], Content::spellingsOf('fr_FR'));
        $this->assertSame(['pt-br', 'pt'], Content::spellingsOf('pt_BR'));
    }

    public function test_a_language_with_no_region_is_tried_once(): void
    {
        $this->loadPlugin();

        $this->assertSame(['sw'], Content::spellingsOf('sw'));
    }

    public function test_no_language_at_all_asks_for_nothing(): void
    {
        /*
         * Which is what keeps this safe to turn on for every install that
         * already exists. Nothing to try means the canonical rows, which is
         * exactly what a monolingual site has always been served.
         */
        $this->loadPlugin();

        $this->assertSame([], Content::spellingsOf(''));
        $this->assertSame([], Content::spellingsOf('   '));
    }
}
