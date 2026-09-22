<?php

namespace ShipFast\LiveEdit\Mapper;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;
use Illuminate\Support\Str;

/**
 * Recognises the editable surface of arbitrary HTML — the core of the
 * "map any website" auto-mapper. It classifies elements into the same kinds
 * the runtime already understands (text, image, link, collection) and
 * suggests the tag + config each would need, so a developer can review the
 * plan before it is applied. Recognition is deterministic; naming is a hint.
 */
class MarkupScanner
{
    /** Leaf elements whose text is worth editing. */
    protected const TEXT_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote', 'figcaption', 'figure', 'span', 'div', 'button', 'label', 'th', 'td', 'dt', 'dd', 'summary', 'caption', 'cite', 'q'];

    /** Inline tags that don't disqualify an element from being a text leaf. */
    protected const INLINE_TAGS = ['b', 'strong', 'i', 'em', 'u', 'small', 'br', 'span', 'a', 'sup', 'sub', 'mark'];

    /** @var array<int, array<string, mixed>> */
    protected array $candidates = [];

    /** @var array<string, int> */
    protected array $usedKeys = [];

    protected ?DOMDocument $doc = null;

    protected bool $fullDocument = false;

    /**
     * @return array{candidates: array<int, array<string, mixed>>, summary: array<string, int>}
     */
    public function scan(string $html): array
    {
        $this->run($html);

        $public = array_map(fn (array $c) => array_diff_key($c, ['node' => null]), $this->candidates);

        $summary = [];
        foreach ($this->candidates as $candidate) {
            $summary[$candidate['kind']] = ($summary[$candidate['kind']] ?? 0) + 1;
        }

        return ['candidates' => array_values($public), 'summary' => $summary];
    }

    /**
     * Return the HTML with data-edit* attributes written onto the recognised
     * elements. By default only text / image / link are applied — collections
     * need a backing model and real ids the markup alone can't supply.
     *
     * @param  array<int, string>  $kinds
     * @return array{html: string, applied: int, skipped: array<string, int>}
     */
    public function apply(string $html, array $kinds = ['text', 'image', 'link'], bool $auto = false): array
    {
        $this->autoMode = $auto;
        $this->run($html);

        $applied = 0;
        $skipped = [];

        foreach ($this->candidates as $candidate) {
            $node = $candidate['node'] ?? null;
            if (! $node instanceof DOMElement) {
                continue;
            }

            if (! in_array($candidate['kind'], $kinds, true)) {
                $skipped[$candidate['kind']] = ($skipped[$candidate['kind']] ?? 0) + 1;

                continue;
            }

            $this->writeTag($node, $candidate);
            $applied++;
        }

        return ['html' => $this->serialize(), 'applied' => $applied, 'skipped' => $skipped];
    }

    protected function run(string $html): void
    {
        $this->candidates = [];
        $this->usedKeys = [];

        $this->fullDocument = (bool) preg_match('/<html[\s>]/i', $html);

        $this->doc = new DOMDocument;
        libxml_use_internal_errors(true);
        $this->doc->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $body = $this->doc->getElementsByTagName('body')->item(0) ?? $this->doc->documentElement;

        if ($body instanceof DOMNode) {
            $this->walk($body);
        }
    }

    protected function writeTag(DOMElement $node, array $candidate): void
    {
        if ($node->hasAttribute('data-edit') || $node->hasAttribute('data-edit-img') || $node->hasAttribute('data-edit-href')) {
            return; // already tagged — apply is idempotent
        }

        $key = $this->autoMode ? 'auto:'.$this->autoKey($node) : $candidate['key'];

        match ($candidate['kind']) {
            'text' => $this->setAttrs($node, [
                'data-edit' => 'setting:'.$key,
                'data-edit-label' => $this->humanise($candidate['key']),
            ]),
            'image' => $this->setAttrs($node, [
                'data-edit-img' => 'setting:'.$key,
                'data-edit-preview' => $node->getAttribute('src'),
                'data-edit-label' => $this->humanise($candidate['key']),
            ]),
            'link' => $this->setAttrs($node, [
                'data-edit-href' => $key,
                'data-edit-label' => $this->humanise($candidate['key']),
            ]),
            default => null,
        };
    }

    /**
     * Re-inject stored overrides into auto-tagged HTML at serve time: for each
     * element the scanner tagged, if the store holds a value for its key,
     * swap in the edited text (or image src). This is how a static theme shows
     * edited content with no per-element template binding — the counterpart to
     * apply(..., auto: true).
     *
     * @param  array<string, string>  $overrides  key (e.g. "auto:ab12cd") => value
     */
    public function applyOverrides(string $html, array $overrides): string
    {
        if ($overrides === []) {
            return $html;
        }

        $this->fullDocument = (bool) preg_match('/<html[\s>]/i', $html);
        $this->doc = new DOMDocument;
        libxml_use_internal_errors(true);
        $this->doc->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $xpath = new DOMXPath($this->doc);

        foreach ($xpath->query('//*[@data-edit]') as $node) {
            $value = $node->getAttribute('data-edit');
            if (! str_starts_with($value, 'setting:')) {
                continue;
            }
            $key = substr($value, strlen('setting:'));
            if (! array_key_exists($key, $overrides)) {
                continue;
            }
            // Replace the element's own text, preserving any child elements
            // (e.g. a decorative <span> before the label).
            foreach (iterator_to_array($node->childNodes) as $child) {
                if ($child->nodeType === XML_TEXT_NODE) {
                    $node->removeChild($child);
                }
            }
            $node->appendChild($this->doc->createTextNode($overrides[$key]));
        }

        foreach ($xpath->query('//*[@data-edit-img]') as $node) {
            $value = $node->getAttribute('data-edit-img');
            if (! str_starts_with($value, 'setting:')) {
                continue;
            }
            $key = substr($value, strlen('setting:'));
            if (array_key_exists($key, $overrides) && strtolower($node->tagName) === 'img') {
                $node->setAttribute('src', $overrides[$key]);
            }
        }

        return $this->serialize();
    }

    protected bool $autoMode = false;

    /**
     * A stable, content-independent key for an element: a short hash of its
     * structural position (tag + sibling index up to the root). It survives
     * text edits — only a change to the page's structure moves it — so the
     * scanner can tag a whole theme with keys the generic store persists
     * against, no hand-authored config per element.
     */
    protected function autoKey(DOMElement $node): string
    {
        return substr(hash('sha256', $this->structuralPath($node)), 0, 12);
    }

    protected function structuralPath(DOMElement $node): string
    {
        $segments = [];

        for ($el = $node; $el instanceof DOMElement; $el = $el->parentNode) {
            $tag = strtolower($el->tagName);
            $index = 1;
            for ($sib = $el->previousSibling; $sib !== null; $sib = $sib->previousSibling) {
                if ($sib instanceof DOMElement && strtolower($sib->tagName) === $tag) {
                    $index++;
                }
            }
            array_unshift($segments, $tag.'['.$index.']');

            if ($tag === 'body' || $tag === 'html') {
                break;
            }
        }

        return implode('/', $segments);
    }

    protected function setAttrs(DOMElement $node, array $attributes): void
    {
        foreach ($attributes as $name => $value) {
            $node->setAttribute($name, $value);
        }
    }

    protected function serialize(): string
    {
        if ($this->doc === null) {
            return '';
        }

        // A fragment came in without <html>: return the body's inner HTML so we
        // don't emit a doctype/html/body wrapper the source never had.
        if (! $this->fullDocument) {
            $body = $this->doc->getElementsByTagName('body')->item(0);
            $inner = '';
            if ($body) {
                foreach ($body->childNodes as $child) {
                    $inner .= $this->doc->saveHTML($child);
                }
            }

            return trim($inner);
        }

        $out = (string) $this->doc->saveHTML();

        // Drop the UTF-8 hint we injected (DOMDocument renders it as a comment).
        return trim(preg_replace('/<!--\?xml[^>]*-->\s*/', '', $out));
    }

    protected function humanise(string $key): string
    {
        return Str::of($key)->snake(' ')->replace('href', '')->squish()->ucfirst()->toString();
    }

    protected function walk(DOMNode $node): void
    {
        foreach ($node->childNodes as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            $tag = strtolower($child->tagName);

            if ($tag === 'script' || $tag === 'style' || $tag === 'noscript') {
                continue;
            }

            // Inline SVG icon — a replaceable brand asset.
            if ($tag === 'svg') {
                $this->addIcon($child);

                continue;
            }

            // A CSS background image sits on a wrapper we still recurse into,
            // so record it without stopping traversal.
            if ($this->hasBackgroundImage($child)) {
                $this->addBackground($child);
            }

            // A repeated run of same-tag siblings is a collection: tag the
            // container once and recurse only into the first item as a template.
            // In auto mode there is no backing model — every leaf is flat
            // auto-keyed content — so grouping is skipped and we recurse in.
            if (! $this->autoMode && $this->isCollectionContainer($child)) {
                // The item's structure becomes the collection's fields — one
                // "card" unit — instead of loose page settings.
                $this->addCollection($child);

                continue;
            }

            if (in_array($tag, ['video', 'iframe', 'audio'], true)) {
                $this->addMedia($child);

                continue;
            }

            if (in_array($tag, ['input', 'textarea'], true) && $child->getAttribute('placeholder') !== '') {
                $this->addPlaceholder($child);

                continue;
            }

            if ($tag === 'img') {
                $this->addImage($child);

                continue;
            }

            if ($tag === 'a' && $child->getAttribute('href') !== '') {
                $this->addLink($child);
                if (! $this->isTextLeaf($child)) {
                    $this->walk($child);
                }

                continue;
            }

            if (in_array($tag, self::TEXT_TAGS, true) && $this->isTextLeaf($child)) {
                $this->addText($child);

                continue;
            }

            $this->walk($child);
        }
    }

    protected function isTextLeaf(DOMElement $element): bool
    {
        if (trim($element->textContent) === '') {
            return false;
        }

        foreach ($element->childNodes as $child) {
            if ($child instanceof DOMElement && ! in_array(strtolower($child->tagName), self::INLINE_TAGS, true)) {
                return false;
            }
        }

        return true;
    }

    /** Landmarks are page structure, not repeatable content. */
    protected const NON_COLLECTION_PARENTS = ['header', 'main', 'footer', 'body', 'html', 'button', 'form'];

    protected function isCollectionContainer(DOMElement $element): bool
    {
        if (in_array(strtolower($element->tagName), self::NON_COLLECTION_PARENTS, true)) {
            return false;
        }

        $children = [];
        foreach ($element->childNodes as $child) {
            if ($child instanceof DOMElement && ! in_array(strtolower($child->tagName), ['br', 'hr', 'option', 'svg', 'script', 'style'], true)) {
                $children[] = $child;
            }
        }

        if (count($children) < 2) {
            return false;
        }

        // Same tag AND a shared class token across the run — that pattern is
        // what distinguishes a repeated content list (cards, links, rows) from
        // an arbitrary wrapper of mixed structural blocks.
        $tags = array_map(fn (DOMElement $c) => strtolower($c->tagName), $children);
        if (count(array_unique($tags)) !== 1) {
            return false;
        }

        $classSets = array_map(
            fn (DOMElement $c) => array_filter(preg_split('/\s+/', $c->getAttribute('class'))),
            $children
        );
        $shared = array_shift($classSets);
        foreach ($classSets as $set) {
            $shared = array_intersect($shared, $set);
        }

        // Bare same-tag links (a nav) also count even without shared classes.
        return $shared !== [] || $tags[0] === 'a';
    }

    protected function firstElementChild(DOMElement $element): ?DOMElement
    {
        foreach ($element->childNodes as $child) {
            if ($child instanceof DOMElement) {
                return $child;
            }
        }

        return null;
    }

    protected function addText(DOMElement $element): void
    {
        $text = $this->normalise($element->textContent);
        $this->candidates[] = [
            'kind' => 'text',
            'tag' => strtolower($element->tagName),
            'key' => $this->key($text ?: strtolower($element->tagName)),
            'sample' => Str::limit($text, 60),
            'suggested' => 'data-edit="setting:'.$this->lastKey.'"',
            'node' => $element,
        ];
    }

    protected function addImage(DOMElement $element): void
    {
        $alt = $this->normalise($element->getAttribute('alt'));
        $this->candidates[] = [
            'kind' => 'image',
            'tag' => 'img',
            'key' => $this->key('img'.Str::studly($alt ?: 'image')),
            'sample' => $element->getAttribute('src'),
            'suggested' => 'data-edit-img="setting:'.$this->lastKey.'"',
            'node' => $element,
        ];
    }

    protected function hasBackgroundImage(DOMElement $element): bool
    {
        $style = $element->getAttribute('style');

        return stripos($style, 'background-image') !== false && stripos($style, 'url(') !== false;
    }

    protected function addBackground(DOMElement $element): void
    {
        preg_match('/url\(\s*[\'"]?([^\'")]+)/i', $element->getAttribute('style'), $m);
        $this->candidates[] = [
            'kind' => 'background',
            'tag' => strtolower($element->tagName),
            'key' => $this->key('bg'.Str::studly(strtolower($element->tagName)), 'setting'),
            'sample' => $m[1] ?? '(inline background-image)',
            'suggested' => 'data-edit-bg="setting:'.$this->lastKey.'"',
            'node' => $element,
        ];
    }

    protected function addIcon(DOMElement $element): void
    {
        $label = $this->normalise($element->getAttribute('aria-label'));
        $this->candidates[] = [
            'kind' => 'icon',
            'tag' => 'svg',
            'key' => $this->key('icon'.Str::studly($label ?: 'svg'), 'setting'),
            'sample' => $label ?: '(inline SVG)',
            'suggested' => 'data-edit-icon on the &lt;svg&gt; (needs an icon set)',
            'node' => $element,
        ];
    }

    protected function addMedia(DOMElement $element): void
    {
        $tag = strtolower($element->tagName);
        $src = $element->getAttribute('src') ?: ($this->firstElementChild($element)?->getAttribute('src') ?? '');
        $this->candidates[] = [
            'kind' => 'media',
            'tag' => $tag,
            'key' => $this->key($tag.'Src', 'setting'),
            'sample' => $src ?: "({$tag})",
            'suggested' => 'data-edit-media="setting:'.$this->lastKey.'"',
            'node' => $element,
        ];
    }

    protected function addPlaceholder(DOMElement $element): void
    {
        $placeholder = $this->normalise($element->getAttribute('placeholder'));
        $this->candidates[] = [
            'kind' => 'placeholder',
            'tag' => strtolower($element->tagName),
            'key' => $this->key(($placeholder ?: 'field').'Placeholder', 'setting'),
            'sample' => $placeholder,
            'suggested' => 'data-edit-attr="placeholder:setting:'.$this->lastKey.'"',
            'node' => $element,
        ];
    }

    protected function addLink(DOMElement $element): void
    {
        $text = $this->normalise($element->textContent);
        $this->candidates[] = [
            'kind' => 'link',
            'tag' => 'a',
            'key' => $this->key(($text ?: 'link').'Href'),
            'sample' => $element->getAttribute('href'),
            'suggested' => 'data-edit-href="'.$this->lastKey.'"',
            'node' => $element,
        ];
    }

    protected function addCollection(DOMElement $element): void
    {
        $first = $this->firstElementChild($element);
        $fields = $first ? $this->collectionFields($first) : [];
        $type = $this->key(Str::singular($this->normalise($element->textContent)) ?: 'item', 'model');
        $this->candidates[] = [
            'kind' => 'collection',
            'tag' => strtolower($element->tagName),
            'key' => $type,
            'fields' => $fields,
            'sample' => $this->countElementChildren($element).' items {'.implode(', ', $fields).'}',
            'suggested' => 'data-edit="record:'.$type.':{id}" on each item',
            'node' => $element,
        ];
    }

    /**
     * Derive an item's field names by looking at its structure: headings →
     * title, paragraphs/spans → text, img → image, svg → icon, a → link.
     *
     * @return array<int, string>
     */
    protected function collectionFields(DOMElement $item): array
    {
        $fields = [];
        $used = [];
        $name = function (string $base) use (&$used): string {
            $used[$base] = ($used[$base] ?? 0) + 1;

            return $used[$base] > 1 ? $base.$used[$base] : $base;
        };

        $visit = function (DOMNode $node) use (&$visit, &$fields, $name): void {
            foreach ($node->childNodes as $child) {
                if (! $child instanceof DOMElement) {
                    continue;
                }
                $tag = strtolower($child->tagName);

                if ($tag === 'img') {
                    $fields[] = $name('image');
                } elseif ($tag === 'svg') {
                    $fields[] = $name('icon');
                } elseif ($tag === 'a' && $child->getAttribute('href') !== '') {
                    $fields[] = $name('link');
                } elseif (in_array($tag, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], true) && $this->isTextLeaf($child)) {
                    $fields[] = $name('title');
                } elseif (in_array($tag, self::TEXT_TAGS, true) && $this->isTextLeaf($child)) {
                    $fields[] = $name('text');
                } else {
                    $visit($child);
                }
            }
        };

        $visit($item);

        return $fields;
    }

    protected function countElementChildren(DOMElement $element): int
    {
        $n = 0;
        foreach ($element->childNodes as $child) {
            if ($child instanceof DOMElement) {
                $n++;
            }
        }

        return $n;
    }

    protected string $lastKey = '';

    protected function key(string $seed, string $kind = 'setting'): string
    {
        $words = Str::of($seed)->lower()->replaceMatches('/[^a-z0-9\s]/', ' ')->squish()->explode(' ')->take(3);
        $base = $words->isEmpty() ? $kind : Str::camel($words->implode(' '));
        $base = $base === '' ? $kind : $base;

        $key = $base;
        if (isset($this->usedKeys[$base])) {
            $key = $base.(++$this->usedKeys[$base]);
        } else {
            $this->usedKeys[$base] = 1;
        }

        return $this->lastKey = $key;
    }

    protected function normalise(string $text): string
    {
        return trim(preg_replace('/\s+/', ' ', $text));
    }
}
