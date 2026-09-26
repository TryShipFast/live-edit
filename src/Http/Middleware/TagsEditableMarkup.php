<?php

namespace ShipFast\LiveEdit\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Support\DraftStore;
use ShipFast\LiveEdit\Support\Licence;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Make an ordinary Laravel page editable without touching its templates.
 *
 * The runtime only acts on elements carrying data-edit, and until now the
 * only things that put those attributes anywhere were the API — which is how
 * WordPress and the bought-template adapters work, posting their HTML and
 * getting it back tagged — and a developer typing them by hand. So a Laravel
 * site had exactly one route in: go through every Blade file and annotate it.
 *
 * That is a fine choice and remains the better one for a site somebody is
 * building deliberately: a named key (`data-edit="setting:heroTitle"`) is
 * stable, survives the wording changing, and says what it is for. An auto key
 * is a signature of the content, so the same edit is orphaned the day a
 * developer rewrites that sentence in the template.
 *
 * But it cannot be the ONLY route in, because it makes "install the editor"
 * mean "annotate your site first" — which is the work the product exists to
 * avoid, and which nobody can do to a site they bought.
 *
 * Off unless asked for, and this is not timidity: it rewrites every HTML
 * response it is allowed to touch, and a package that started reformatting a
 * host's pages on upgrade would be indefensible. Turning it on is one line.
 *
 * Only for somebody who may edit. A visitor's page is never parsed, never
 * rewritten, and never slowed down — the cost falls entirely on the person
 * doing the editing, which is the only person getting anything for it.
 */
class TagsEditableMarkup
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! config('live-edit.auto_tag', false)) {
            return $response;
        }

        if (! $this->worthTagging($request, $response)) {
            return $response;
        }

        $html = (string) $response->getContent();

        // The editor mounts off the body, not off the script tag, so a page
        // with neither attribute loads the runtime and then does nothing —
        // which is exactly what "installed it and no toolbar appeared" looks
        // like from the outside. @liveEdit sits in the head and cannot reach
        // the body, so it is done here.
        $html = $this->markBodyAsEditable($html);

        /*
         * A page that already carries keys keeps them.
         *
         * Both kinds can live in one page — a developer names the handful
         * that matter and the rest are found — but a page that has been
         * annotated has had that thought applied to it already, and
         * re-deriving keys over the top would hang a client's saved work off
         * a different key than the one it was saved under.
         */
        if (str_contains($html, 'data-edit')) {
            $response->setContent($html);

            return $response;
        }

        $tagged = (new MarkupScanner)->apply(
            $html,
            ['text', 'image', 'link', 'icon'],
            true,
            null,
            trim($request->path(), '/'),
        )['html'] ?? null;

        if (is_string($tagged) && $tagged !== '') {
            $html = $tagged;
        }

        $response->setContent($this->applyStoredWords($html));

        return $response;
    }

    /**
     * Put the client's saved words back onto the page.
     *
     * The half that is easy to forget, and it fails quietly: tagging alone
     * gives a page that can be edited and saves successfully, and then shows
     * the template's original wording on the next load. Every part reports
     * success and the work appears to vanish.
     *
     * A named key does not need this — the host's own template asks its model
     * for the value and renders it. A derived key has nowhere to be rendered
     * from, because the words are hardcoded in the Blade file, so the only
     * moment they can be swapped is here.
     *
     * Drafts are laid over the published values for an editor, and only for
     * an editor. Same rule and the same order as everywhere else, because a
     * second answer to "who sees unpublished work" is how a half-typed
     * sentence reaches a visitor.
     */
    private function applyStoredWords(string $html): string
    {
        $stored = $this->publishedSettings();

        if (DraftStore::visibleToViewer()) {
            $stored = array_merge($stored, DraftStore::settings());
        }

        return $stored === [] ? $html : (new MarkupScanner)->applyOverrides($html, $stored);
    }

    /** @return array<string, string> */
    private function publishedSettings(): array
    {
        $model = config('live-edit.setting_model');

        if (! is_string($model) || ! class_exists($model)) {
            return [];
        }

        return $model::query()
            ->pluck('value', 'key')
            ->map(fn ($value) => (string) $value)
            ->all();
    }

    /**
     * Tell the runtime this page is being edited, and by whom it may save.
     *
     * Left alone if the host has already said so: a site that sets these
     * itself — because it had to, before this existed — has an opinion about
     * when the editor appears, and quietly overriding it would turn the
     * editor on for pages its author had kept it off.
     */
    private function markBodyAsEditable(string $html): string
    {
        if (! preg_match('/<body\b[^>]*>/i', $html, $match)) {
            return $html;
        }

        $body = $match[0];

        if (str_contains(strtolower($body), 'data-admin')) {
            return $html;
        }

        $replacement = rtrim(substr($body, 0, -1))
            .' data-admin data-csrf="'.e(csrf_token()).'">';

        // Once: a page may legitimately contain the string "<body" inside a
        // script or a code sample, and only the real one should be touched.
        $position = strpos($html, $body);

        return substr_replace($html, $replacement, $position, strlen($body));
    }

    private function worthTagging(Request $request, Response $response): bool
    {
        // A streamed or downloadable response has no body to rewrite, and
        // reading one to find out would consume it.
        if ($response instanceof StreamedResponse || $response instanceof BinaryFileResponse) {
            return false;
        }

        if ($response->getStatusCode() !== 200) {
            return false;
        }

        if (! str_contains(strtolower((string) $response->headers->get('Content-Type', '')), 'text/html')) {
            return false;
        }

        // Livewire and Inertia exchange JSON fragments over the same routes;
        // rewriting one is rewriting a data structure that happens to contain
        // markup, and the page it belongs to was tagged when it was served.
        if ($request->hasHeader('X-Livewire') || $request->hasHeader('X-Inertia') || $request->ajax()) {
            return false;
        }

        return Gate::allows('live-edit') && Licence::permits();
    }
}
