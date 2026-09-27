<?php

namespace ShipFast\LiveEdit\Application\Api;

use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Support\StyleCss;

/**
 * A finished page for a host that cannot run the scanner itself.
 *
 * A browser can be sent the editor and left to mark its own page up. A server
 * rendering HTML — WordPress, or anything else with a template and no build
 * step — cannot, and the WordPress plugin solved that by carrying a copy of
 * the engine inside its own zip.
 *
 * That copy is the problem. The editor runtime is fetched from here on every
 * page view, so improving it reaches every site at once; the scanner sat
 * frozen in each plugin until somebody pressed update in wp-admin. The two
 * halves of the same product moved at different speeds, and the half that
 * decides what is editable was the slow one. The work worth paying for is the
 * scanner, and it belongs on this side of the wire.
 *
 * So the host posts the page it just rendered and gets it back ready: marked
 * up, with the client's words already in it. One call replaces both the
 * tagging and the separate fetch of content the host used to do afterwards.
 *
 * This is ExportMarkup's sibling and deliberately not the same thing. Export
 * takes the editor OUT, because that page is leaving and must need nothing
 * from us. This leaves every marker in, because that page is about to be
 * edited.
 */
class PrepareMarkup
{
    public const MAX_BYTES = 2_000_000;

    /**
     * @return array{html: string, applied: int, tagged: bool, version: int}
     */
    /**
     * @param  array<string, string>|null  $given  Words the caller holds itself
     */
    public function __invoke(Site $site, string $html, string $page = '', bool $editing = false, ?array $given = null): array
    {
        $store = new SiteStore($site);
        $scanner = new MarkupScanner;

        // A page that arrives already marked — by the CLI, by a framework, or
        // by whoever sold it — keeps the keys it shipped with, because a
        // client's saved work hangs off them.
        $alreadyMarked = str_contains($html, 'data-edit');

        $marked = $alreadyMarked
            ? $html
            : ($scanner->apply($html, ['text', 'image', 'link', 'icon'], true, null, $page)['html'] ?? $html);

        /*
         * The words, from whoever owns them.
         *
         * A host that keeps its customers' content in its own database sends
         * it along with the page and we store none of it. WordPress does
         * exactly that: its client's words live in their WordPress tables, and
         * this service applies them without ever holding a copy. Passing an
         * empty array is a real answer — a site with nothing written yet —
         * which is why the check is for null rather than for emptiness.
         *
         * Otherwise the words are ours to keep, as they are for a site with no
         * data layer of its own, and the rule is the same one the content
         * endpoint follows: an editor sees their own unpublished work laid
         * over the published page, everybody else sees only what is published.
         * A second answer to that question is how a half-typed sentence
         * reaches a visitor.
         */
        if ($given !== null) {
            $content = $given;
        } else {
            $content = $store->published();

            if ($editing) {
                $content = array_merge($content, $store->draftedSettings());
            }
        }

        $html = $content === [] ? $marked : $scanner->applyOverrides($marked, $content);

        /*
         * A visitor gets the words, not the scaffolding.
         *
         * The attributes exist so the client's words can be matched to the
         * places they belong. Once that is done they have no further use to
         * somebody reading the page, and leaving them in tells anybody who
         * views the source that this site is editable and hands them the key
         * for every sentence on it.
         *
         * Only where this page derived them. A page that arrived already
         * marked was annotated by its own developer, and those attributes are
         * part of their markup rather than ours to remove.
         */
        if (! $editing && ! $alreadyMarked) {
            $html = preg_replace('/\s+data-edit(?:-[a-z-]+)?="[^"]*"/i', '', $html) ?? $html;
        }

        return [
            'html' => $this->withStyling($html, $store, $editing),
            'applied' => count($content),
            'tagged' => ! $alreadyMarked,
            'version' => (int) ($store->version() ?? 0),
        ];
    }

    /**
     * The client's styling, written into the page.
     *
     * Words were being baked in here and colours were not, so on a page a
     * server renders — every bought WordPress theme — a client could change a
     * background, watch it save, see it listed under Changes, publish it, and
     * reload onto the theme's original colour. Nothing errored. The style was
     * stored the whole time; no part of this pipeline ever painted it.
     *
     * A page the browser fetches its own content for never had the problem,
     * because content.js applies styles as it hydrates. This is that same step
     * for a host that cannot run it, and it reuses the renderer content.js is
     * kept in step with rather than growing a second answer.
     */
    private function withStyling(string $html, SiteStore $store, bool $editing): string
    {
        // Passed in rather than left to the renderer to look up. Its fallback
        // reads every style row on the service, which on a host serving more
        // than one site is another client's colours.
        $css = StyleCss::render(
            $editing ? $store->draftedStyles() : [],
            $store->publishedStyles(),
        );

        if (trim($css) === '') {
            return $html;
        }

        $tag = '<style id="live-edit-styles">'.$css.'</style>';

        // Last thing in the head, so it beats the theme's own stylesheet on
        // equal specificity as well as by !important. A page with no head is
        // a fragment rather than a document, and appending is the only honest
        // thing left to do with it.
        $position = stripos($html, '</head>');

        return $position === false
            ? $html.$tag
            : substr($html, 0, $position).$tag.substr($html, $position);
    }
}
