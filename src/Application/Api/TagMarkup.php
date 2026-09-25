<?php

namespace ShipFast\LiveEdit\Application\Api;

use DOMDocument;
use DOMElement;
use DOMXPath;
use ShipFast\LiveEdit\Domain\Content\CarryContentAcrossRetag;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * Tagging a page that was never prepared, from the page itself.
 *
 * A site built on a framework is tagged while it renders, and a site we sold
 * was tagged before it shipped. A folder of HTML somebody already owns is
 * neither: asking them to install PHP and run a command is the difference
 * between a product and a favour.
 *
 * So the page sends what it has and is told which of its elements are
 * editable. Nothing is written to their files, there is no build step, and the
 * scanner — which is the part worth having — never leaves this server.
 *
 * Elements come back as positions rather than selectors. A path of child
 * indices is exact and cheap to follow, where a CSS selector has to be
 * generated, escaped, and can still match the wrong thing on a page nobody
 * wrote carefully.
 */
class TagMarkup
{
    /** Sent by a browser, so it is bounded by what is reasonable to render. */
    public const MAX_BYTES = 2_000_000;

    /**
     * @return array{elements: array<int, array<string, mixed>>, count: int}
     */
    public function __invoke(Site $site, string $html, string $page = ''): array
    {
        $tagged = (new MarkupScanner)->apply($html, ['text', 'image', 'link', 'icon'], true, null, $page)['html'] ?? '';

        if ($tagged === '') {
            return ['elements' => [], 'count' => 0];
        }

        // Before answering, make sure the answer still points at the client's
        // work. A page tagged as it loads has no previous file to compare
        // against, so the names it was given last time are remembered here —
        // and when the scanner improves and an element is renamed, its content
        // follows it. Otherwise improving the scanner would quietly revert
        // every site to its theme's own words, which is the one failure this
        // product cannot have.
        //
        // Costs a hash and a comparison on an ordinary view; writes only when
        // the names actually move, which is almost never.
        rescue(fn () => app(CarryContentAcrossRetag::class)(new SiteStore($site), $page, $tagged), null, false);

        $doc = new DOMDocument;
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">'.$tagged, LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $xpath = new DOMXPath($doc);
        $elements = [];

        // Anything the scanner marked, whatever kind of marker it used.
        $marked = $xpath->query('//*[@data-edit or @data-edit-img or @data-edit-href or @data-edit-icon or @data-style]');

        foreach ($marked as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }

            $attributes = [];

            foreach ($node->attributes as $attribute) {
                if (str_starts_with($attribute->name, 'data-edit') || str_starts_with($attribute->name, 'data-style')) {
                    $attributes[$attribute->name] = $attribute->value;
                }
            }

            if ($attributes === []) {
                continue;
            }

            $elements[] = ['at' => $this->pathOf($node), 'attributes' => $attributes];
        }

        return ['elements' => $elements, 'count' => count($elements)];
    }

    /**
     * Where this element sits, as the indices walked from the document root.
     *
     * Computed from the very markup the page sent, so the two agree by
     * construction — the page walks its own DOM with the same numbers.
     *
     * @return array<int, int>
     */
    private function pathOf(DOMElement $node): array
    {
        $path = [];

        for ($current = $node; $current?->parentNode instanceof DOMElement; $current = $current->parentNode) {
            $index = 0;

            foreach ($current->parentNode->childNodes as $sibling) {
                if ($sibling === $current) {
                    break;
                }

                if ($sibling instanceof DOMElement) {
                    $index++;
                }
            }

            array_unshift($path, $index);
        }

        return $path;
    }
}
