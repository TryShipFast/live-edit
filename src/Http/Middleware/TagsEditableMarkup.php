<?php

namespace ShipFast\LiveEdit\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Support\CloudInstall;
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

        if (! $this->isARewritablePage($request, $response)) {
            return $response;
        }

        $html = (string) $response->getContent();

        /*
         * Whether this request is an editor's, which decides how much is done
         * to the page — but NOT whether the client's words are put back.
         *
         * Those two were one check, and it made the product quietly useless:
         * a client could edit a sentence, save it, see it on their own next
         * page load, and every visitor carried on reading the original. The
         * edit was stored the whole time and never reached anybody.
         */
        $forAnEditor = Gate::allows('live-edit') && Licence::permits();

        /*
         * Installed, allowed to edit, and never registered.
         *
         * This used to be the one case that edited freely: an install with no
         * site and no key was treated as licensed, so the way past every
         * check here was to have nothing to check. Now it does not edit, and
         * the person who installed it is told why and what to do, once, in a
         * strip only they can see. Silence would read as the package being
         * broken, and somebody who has installed it is somebody trying to buy
         * from us.
         */
        $askToRegister = ! $forAnEditor && Licence::unregistered() && Gate::allows('live-edit');

        // The editor mounts off the body, not off the script tag, so a page
        // with neither attribute loads the runtime and then does nothing —
        // which is exactly what "installed it and no toolbar appeared" looks
        // like from the outside. @liveEdit sits in the head and cannot reach
        // the body, so it is done here.
        if ($forAnEditor) {
            $html = $this->markBodyAsEditable($html);
            $html = $this->carriesTheRuntime($html);
        }

        if ($askToRegister) {
            $response->setContent($this->invitesRegistration($html));

            return $response;
        }

        /*
         * The keys have to exist before stored words can be matched to them,
         * so a visitor's page is scanned too — but only when there is
         * something to put back. With nothing stored, which is every page of
         * a site nobody has edited yet, a visitor costs exactly one cheap
         * query and no parse at all.
         */
        $stored = $this->storedWords($forAnEditor);

        if (! $forAnEditor && $stored === []) {
            return $response;
        }

        /*
         * A page that already carries keys keeps them.
         *
         * Both kinds can live in one page — a developer names the handful
         * that matter and the rest are found — but a page that has been
         * annotated has had that thought applied to it already, and
         * re-deriving keys over the top would hang a client's saved work off
         * a different key than the one it was saved under.
         */
        if (! str_contains($html, 'data-edit')) {
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
        }

        if ($stored !== []) {
            $html = (new MarkupScanner)->applyOverrides($html, $stored);
        }

        /*
         * A visitor is served the words, not the scaffolding.
         *
         * The attributes exist only so the overrides could be matched. Left
         * in, they would tell anybody reading the source that this site is
         * editable and hand them the key for every sentence on it.
         */
        if (! $forAnEditor) {
            $html = preg_replace('/\s+data-edit(?:-[a-z-]+)?="[^"]*"/i', '', $html) ?? $html;
        }

        $response->setContent($html);

        return $response;
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
    /**
     * Make sure the page an editor is looking at can actually load the editor.
     *
     * @liveEdit prints the runtime, and a developer pastes it into a layout.
     * Real applications have several: this one tags its marketing pages
     * through one layout and its course pages through another, and only the
     * first had the directive. The result was the worst kind of half-working
     * — the server recognised the editor, marked the body, tagged 278
     * elements, and the browser received no editor at all. Nothing on screen
     * said why, and the obvious conclusion from the outside is that the
     * product is broken.
     *
     * So the middleware that decided this page is editable also gives it what
     * it needs to be edited. The directive still works and still wins: a
     * layout that has it is left alone, which is how somebody controls where
     * the tag sits.
     */
    /**
     * A strip inviting whoever installed this to register the site.
     *
     * Shown only to somebody the host's own gate already trusts to edit, so a
     * visitor never sees it and it cannot be used to work out that a site runs
     * this. Self-contained styles, because it has to look deliberate on a page
     * whose CSS we have never seen, and no script, because an unregistered
     * install is exactly where loading our runtime would be wrong.
     *
     * Dismissable for the session. Somebody mid-way through building a site
     * should be able to get on with it, and a strip that cannot be closed is
     * one they will remove by removing the package.
     */
    private function invitesRegistration(string $html): string
    {
        if (! preg_match('/<\/body\s*>/i', $html)) {
            return $html;
        }

        $where = e(Licence::registerUrl());
        $host = e(request()->getHost());

        $strip = <<<HTML
            <div id="live-edit-register" role="status" style="position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;margin:0 auto;max-width:640px;display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:12px;background:#111827;color:#fff;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25)">
                <span style="flex:1">Live Edit is installed on <strong>{$host}</strong> but this site is not registered, so editing is switched off.</span>
                <a href="{$where}" target="_blank" rel="noopener" style="flex:none;background:#fff;color:#111827;text-decoration:none;font-weight:600;padding:8px 14px;border-radius:8px">Register this site</a>
                <button type="button" aria-label="Dismiss" onclick="this.parentNode.remove()" style="flex:none;background:transparent;border:0;color:#9ca3af;font-size:18px;line-height:1;cursor:pointer;padding:4px">&times;</button>
            </div>
            HTML;

        return preg_replace('/<\/body\s*>/i', $strip.'</body>', $html, 1) ?? $html;
    }

    private function carriesTheRuntime(string $html): string
    {
        $script = CloudInstall::script();

        if (trim($script) === '' || ! preg_match('/<\/body\s*>/i', $html, $match)) {
            return $html;
        }

        /*
         * Already there, by directive or by hand.
         *
         * Compared against the tag this install would print rather than
         * against a name: it is /s/{site}.js for a cloud install and
         * live-edit/runtime.js for a self-hosted one, and a guard that knew
         * only one of them would double the runtime on the other. Two
         * runtimes on one page is two editors arguing over the same elements,
         * which is worse than none.
         */
        if (preg_match('#(?:/s/[^"\']+\.js|live-edit/runtime\.js)#', $html)) {
            return $html;
        }

        $closing = $match[0];
        $at = strrpos($html, $closing);

        return $at === false ? $html : substr_replace($html, $script."\n".$closing, $at, strlen($closing));
    }

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

    /**
     * Whether this response is HTML we could safely rewrite at all.
     *
     * Deliberately says nothing about who is asking: the client's published
     * words belong on a visitor's page just as much as on an editor's, and
     * folding that question in here is what hid them from everybody.
     */
    private function isARewritablePage(Request $request, Response $response): bool
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

        return true;
    }

    /**
     * The client's words, published — plus their unpublished ones if they are
     * the one looking.
     *
     * @return array<string, string>
     */
    private function storedWords(bool $forAnEditor): array
    {
        $stored = $this->publishedSettings();

        if ($forAnEditor && DraftStore::visibleToViewer()) {
            $stored = array_merge($stored, DraftStore::settings());
        }

        return $stored;
    }
}
