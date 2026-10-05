<?php

namespace ShipFast\LiveEdit\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\URL;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Support\DraftStore;
use ShipFast\LiveEdit\Support\EditorConfig;
use ShipFast\LiveEdit\Support\MayEdit;
use ShipFast\LiveEdit\Support\PublishedContent;
use ShipFast\LiveEdit\Support\StyleCss;

/**
 * Serves a tagged theme, with the client's edits applied.
 *
 * Every site that installed this package had written its own copy of this,
 * which meant the answer to "how do I use it" was thirty lines of glue rather
 * than a route. It serves any page of the theme, because a bought template is
 * a set of pages and its own navigation links between them: a template whose
 * About link 404s is not a site.
 */
class ThemeController extends Controller
{
    public function show(MarkupScanner $scanner, string $page = 'index'): Response
    {
        $path = $this->pathFor($page);
        abort_unless($path !== null, 404);

        $html = $scanner->applyOverrides((string) file_get_contents($path), $this->overrides());

        $styles = StyleCss::render(
            DraftStore::visibleToViewer() ? DraftStore::styles() : [],
            PublishedContent::styles()
        );
        if ($styles !== '') {
            $html = str_replace('</head>', '<style id="live-edit-styles">'.$styles.'</style></head>', $html);
        }

        $attributes = 'data-csrf="'.e(csrf_token()).'"';
        if (MayEdit::check()) {
            $attributes .= ' data-admin';
        }
        $html = preg_replace('/<body\b/', '<body '.$attributes, $html, 1);

        $chrome = view(config('live-edit.chrome_view'))->render().EditorConfig::publishingScript();

        return response(str_replace('</body>', $chrome."\n</body>", $html));
    }

    /**
     * The tagged file for a page name, or null if the theme has no such page.
     *
     * The name comes from the URL, so it is checked against the pages that
     * actually exist rather than being pasted into a path.
     */
    protected function pathFor(string $page): ?string
    {
        $page = pathinfo($page, PATHINFO_FILENAME);
        $directory = resource_path('themes/'.config('live-edit.theme'));

        foreach (glob($directory.'/*.tagged.html') ?: [] as $file) {
            if (basename($file, '.tagged.html') === $page) {
                return $file;
            }
        }

        return null;
    }

    /**
     * The content to serve.
     *
     * Published values, with unpublished work laid over them for anyone
     * entitled to see it — whoever is editing, and whoever was given a preview
     * link. A visitor gets the published site.
     *
     * @return array<string, string>
     */
    protected function overrides(): array
    {
        $published = PublishedContent::settings();

        return DraftStore::visibleToViewer()
            ? array_merge($published, DraftStore::settings())
            : $published;
    }
}
