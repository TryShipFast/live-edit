<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Models\LiveEditSetting;

/**
 * That an edit reaches the people the site is for.
 *
 * The bug this exists to prevent was invisible from the inside and total from
 * the outside. Tagging a page and putting the client's words back onto it were
 * one decision, gated on "is this an editor" — so a client could change a
 * sentence, save it, reload, see their change, and be satisfied, while every
 * visitor carried on reading the original. The words were stored the whole
 * time. Nothing errored. The only way to notice was to look at the site while
 * signed out, which the person who made the edit never does.
 *
 * So these are written from the visitor's side, which is the side that pays.
 */
class PublishedWordsReachVisitorsTest extends TestCase
{
    /**
     * Set before the package boots, not after.
     *
     * The tagging middleware is only added to the stack when auto_tag is on
     * at boot, so setting it in setUp leaves the middleware absent and every
     * assertion below passing for the wrong reason.
     */
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.auto_tag', true);
        $app['config']->set('live-edit.auto_keys', true);
        $app['config']->set('live-edit.setting_model', LiveEditSetting::class);
        $app['config']->set('live-edit.licence', ['host' => null, 'site' => null, 'key' => null]);
    }

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('web')->get('/a-page', fn () => <<<'HTML'
            <!doctype html><html><head><title>A page</title></head>
            <body><main><p>The words the template shipped with.</p></main></body></html>
            HTML);
    }

    private function nobodyMayEdit(): void
    {
        Gate::define('live-edit', fn ($user = null) => false);
    }

    private function everybodyMayEdit(): void
    {
        Gate::define('live-edit', fn ($user = null) => true);
    }

    /** The key the scanner derives for that paragraph, whoever asks for it. */
    private function keyOnThePage(): string
    {
        $this->everybodyMayEdit();

        $html = $this->get('/a-page')->getContent();

        preg_match('/data-edit="setting:(auto:[a-f0-9]+)"/', $html, $found);

        $this->assertNotEmpty($found, 'the page was never tagged, so this test proves nothing');

        return $found[1];
    }

    public function test_a_visitor_is_served_the_clients_words_not_the_templates(): void
    {
        $key = $this->keyOnThePage();
        LiveEditSetting::query()->create(['key' => $key, 'value' => 'The words the client wrote.']);

        $this->nobodyMayEdit();

        $this->get('/a-page')
            ->assertSee('The words the client wrote.')
            ->assertDontSee('The words the template shipped with.');
    }

    public function test_a_visitor_is_not_served_the_scaffolding(): void
    {
        $key = $this->keyOnThePage();
        LiveEditSetting::query()->create(['key' => $key, 'value' => 'The words the client wrote.']);

        $this->nobodyMayEdit();
        $html = $this->get('/a-page')->getContent();

        // The attributes exist only so the words could be matched to them.
        // Left in, they announce that this site is editable and hand over the
        // key for every sentence on it.
        $this->assertStringNotContainsString('data-edit', $html);
        $this->assertStringNotContainsString('data-admin', $html);
    }

    public function test_an_untouched_page_is_left_exactly_as_the_host_wrote_it(): void
    {
        $this->nobodyMayEdit();

        // Nothing stored, which is every page of a site nobody has edited
        // yet. A visitor should not pay for a parse that could only put back
        // words that do not exist.
        $html = $this->get('/a-page')->getContent();

        $this->assertStringContainsString('The words the template shipped with.', $html);
        $this->assertStringNotContainsString('data-edit', $html);
    }

    public function test_an_editor_gets_the_words_and_the_scaffolding(): void
    {
        $key = $this->keyOnThePage();
        LiveEditSetting::query()->create(['key' => $key, 'value' => 'The words the client wrote.']);

        $this->everybodyMayEdit();
        $html = $this->get('/a-page')->getContent();

        $this->assertStringContainsString('The words the client wrote.', $html);
        $this->assertStringContainsString('data-edit', $html);
        $this->assertStringContainsString('data-admin', $html);
    }

    public function test_the_two_sides_agree_about_what_the_page_says(): void
    {
        $key = $this->keyOnThePage();
        LiveEditSetting::query()->create(['key' => $key, 'value' => 'One sentence, one version.']);

        $this->everybodyMayEdit();
        $editorSaw = $this->get('/a-page')->getContent();

        $this->nobodyMayEdit();
        $visitorSaw = $this->get('/a-page')->getContent();

        // The whole point. An editor who reloads and sees their change has
        // been told the truth about what everybody else sees.
        $this->assertStringContainsString('One sentence, one version.', $editorSaw);
        $this->assertStringContainsString('One sentence, one version.', $visitorSaw);
    }
}
