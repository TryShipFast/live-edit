<?php

namespace ShipFast\LiveEdit\Application\Api;

use DOMDocument;
use DOMElement;
use DOMXPath;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * Handing a customer their content back, in files that need nothing from us.
 *
 * The published words live here rather than on their server, which is what
 * makes this a service — and also what makes "what happens if you disappear?"
 * the first serious question anybody asks. The honest answer should not be
 * "your site reverts to the template you bought".
 *
 * So: their markup goes in, their published words are baked into it, every
 * trace of the editor is taken out, and what comes back is a plain page. It
 * costs almost nothing commercially — anyone exporting was leaving anyway —
 * and being able to say "take your content whenever you like" closes more than
 * lock-in ever does.
 */
class ExportMarkup
{
    public const MAX_BYTES = 2_000_000;

    /**
     * @return array{html: string, applied: int}
     */
    public function __invoke(Site $site, string $html, string $page = ''): array
    {
        $store = new SiteStore($site);
        $published = $store->published();

        $scanner = new MarkupScanner;

        // A page that was never marked is marked now, purely so the content
        // has somewhere to land. Those markers are stripped again below, so
        // the customer never sees them.
        $marked = str_contains($html, 'data-edit')
            ? $html
            : ($scanner->apply($html, ['text', 'image', 'link', 'icon'], true, null, $page)['html'] ?? $html);

        $baked = $published === [] ? $marked : $scanner->applyOverrides($marked, $published);

        return ['html' => $this->clean($baked), 'applied' => count($published)];
    }

    /**
     * Take the editor out of the page.
     *
     * Their own file should not carry markers for a service they have stopped
     * using, or a script tag pointing at a host that may no longer answer.
     */
    private function clean(string $html): string
    {
        $doc = new DOMDocument;
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $xpath = new DOMXPath($doc);

        foreach ($xpath->query('//*[@*]') as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }

            foreach (iterator_to_array($node->attributes) as $attribute) {
                if (str_starts_with($attribute->name, 'data-edit') || str_starts_with($attribute->name, 'data-style')) {
                    $node->removeAttribute($attribute->name);
                }
            }
        }

        // The one line they pasted, pointing at a service they are leaving.
        foreach (iterator_to_array($xpath->query('//script[@src]')) as $script) {
            $src = $script->getAttribute('src');

            if (str_contains($src, '/live-edit/') || preg_match('#/s/[a-z0-9-]+\.js$#', $src)) {
                $script->parentNode?->removeChild($script);
            }
        }

        $out = $doc->saveHTML();

        return is_string($out) ? trim(str_replace('<?xml encoding="UTF-8">', '', $out)) : $html;
    }
}
