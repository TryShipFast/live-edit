<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use ShipFast\LiveEdit\Models\LiveEditSetting;
use ShipFast\LiveEdit\Support\CloudInstall;

/**
 * A page the server treats as editable must arrive able to be edited.
 *
 * @liveEdit prints the runtime and a developer pastes it into a layout. Real
 * applications have more than one. Found on a live Laravel site: its
 * marketing pages render through one layout and its course pages through
 * another, and only the first had the directive. The second was the worst
 * kind of half-working — the server recognised the editor, marked the body,
 * tagged two hundred and seventy-eight elements, and the browser received no
 * editor at all.
 *
 * Nothing on screen explained it. From the outside that is indistinguishable
 * from the product being broken, and the person who would notice the missing
 * directive is the one developer who is not in the room when the client tries
 * to edit their own site.
 */
class EveryEditablePageCarriesTheEditorTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        // Set before the package boots. The tagging middleware is only added
        // to the stack when auto_tag is on at boot, so setting it later
        // leaves the middleware absent and every assertion here passing for
        // the wrong reason.
        $app['config']->set('live-edit.auto_tag', true);
        $app['config']->set('live-edit.auto_keys', true);
        $app['config']->set('live-edit.setting_model', LiveEditSetting::class);
        // Registered, because an install that names no site and holds no key
        // is refused the editor now: it gets an invitation to register
        // instead, which is a different test.
        $app['config']->set('live-edit.licence', [
            'host' => 'https://live.shipfast.test',
            'site' => 'acme',
            'key' => 'kbp_test_licence_key',
            'ttl' => 86400,
        ]);

        // A cloud-configured install, which is what prints a runtime tag.
        $app['config']->set('live-edit.cloud.site', 'acme');
        $app['config']->set('live-edit.cloud.host', 'https://live.example.com');
    }

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('web')->get('/no-directive', fn () => <<<'HTML'
            <!doctype html><html><head><title>A page</title></head>
            <body><main><p>A layout nobody remembered to paste the tag into.</p></main></body></html>
            HTML);

        Route::middleware('web')->get('/has-directive', fn () => '<!doctype html><html><head></head><body>'
            .'<main><p>A layout that already has it.</p></main>'
            .CloudInstall::script()
            .'</body></html>');
    }

    private function mayEdit(bool $allowed): void
    {
        Gate::define('live-edit', fn ($user = null) => $allowed);
    }

    public function test_a_layout_without_the_directive_still_gets_the_editor(): void
    {
        $this->mayEdit(true);

        $html = $this->get('/no-directive')->getContent();

        $this->assertStringContainsString('data-admin', $html, 'the page was not marked editable at all');
        $this->assertStringContainsString('/s/acme.js', $html);
    }

    public function test_the_runtime_goes_in_once_when_the_directive_is_already_there(): void
    {
        // Two runtimes on one page is two editors arguing over the same
        // elements, which is worse than none.
        $this->mayEdit(true);

        $html = $this->get('/has-directive')->getContent();

        $this->assertSame(1, substr_count($html, '/s/acme.js'));
    }

    public function test_a_visitor_is_given_no_editor_to_load(): void
    {
        // The whole point of the gate. A runtime on a visitor's page is both
        // a download they did not ask for and an invitation to go looking.
        $this->mayEdit(false);

        $html = $this->get('/no-directive')->getContent();

        $this->assertStringNotContainsString('/s/acme.js', $html);
        $this->assertStringNotContainsString('data-admin', $html);
    }

    public function test_a_page_that_is_not_a_page_is_left_alone(): void
    {
        $this->mayEdit(true);

        Route::middleware('web')->get('/some.json', fn () => response()->json(['ok' => true]));

        $this->get('/some.json')->assertJson(['ok' => true]);
    }
}
