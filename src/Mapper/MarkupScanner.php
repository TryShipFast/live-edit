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
     * $labeller, when given, receives the candidate list and returns a human
     * label per index (this is where the AI refiner plugs in), so auto-tagged
     * elements can carry a meaningful name instead of a generic role.
     *
     * @param  array<int, string>  $kinds
     * @return array{html: string, applied: int, skipped: array<string, int>}
     */
    public function apply(string $html, array $kinds = ['text', 'image', 'link'], bool $auto = false, ?callable $labeller = null): array
    {
        $this->autoMode = $auto;
        $this->run($html);

        // Lists first: each item gets a stable id, so the keys of everything
        // inside it stay put when items are added or removed around it.
        if ($auto) {
            $this->applyListTags();
        }

        $labels = [];
        if ($labeller !== null) {
            $labels = $labeller(array_map(fn (array $c) => array_diff_key($c, ['node' => null]), $this->candidates));
        }

        $applied = 0;
        $skipped = [];

        foreach ($this->candidates as $index => $candidate) {
            $node = $candidate['node'] ?? null;
            if (! $node instanceof DOMElement) {
                continue;
            }

            if (! in_array($candidate['kind'], $kinds, true)) {
                $skipped[$candidate['kind']] = ($skipped[$candidate['kind']] ?? 0) + 1;

                continue;
            }

            $this->writeTag($node, $candidate, (array) ($labels[$index] ?? []));
            $applied++;
        }

        if ($this->autoMode) {
            $applied += $this->applyStyles();
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

        $this->assignBands();
    }

    /**
     * Where each candidate sits in the page's structure. Region boundaries are
     * a fact of the DOM, not something to guess from reading order, so the
     * band each element belongs to is computed here and handed to the labeller.
     */
    protected function assignBands(): void
    {
        $seen = [];
        $next = 0;

        foreach ($this->candidates as $index => $candidate) {
            $node = $candidate['node'] ?? null;
            if (! $node instanceof DOMElement) {
                continue;
            }

            $band = $this->bandFor($node);
            // Identify the band by its position in the tree, not by object id:
            // PHP's DOM hands back a new wrapper object each time you walk to a
            // parent, and freed object ids get reused, so ids collide and
            // unrelated bands merge into one.
            $id = $band ? $band->getNodePath() : '';
            if (! array_key_exists($id, $seen)) {
                $seen[$id] = $next++;
            }

            $this->candidates[$index]['band'] = $seen[$id];
            $this->candidates[$index]['bandTag'] = $band ? strtolower($band->tagName) : null;
        }
    }

    protected function writeTag(DOMElement $node, array $candidate, array $meta = []): void
    {
        if ($node->hasAttribute('data-edit') || $node->hasAttribute('data-edit-img') || $node->hasAttribute('data-edit-href')) {
            return; // already tagged — apply is idempotent
        }

        $key = $this->autoMode ? 'auto:'.$this->autoKey($node) : $candidate['key'];

        // In auto mode the key is derived from the element's own words, which
        // makes a poor label ("Magna primis lobortis"); the runtime names the
        // element by its role instead. Hand-authored sites keep their labels.
        $label = $this->autoMode
            // A key derived from the element's own words makes a poor title, so
            // auto mode stays unlabelled unless a labeller named it properly.
            ? (filled($meta['label'] ?? null) ? ['data-edit-label' => $meta['label']] : [])
            : ['data-edit-label' => $this->humanise($candidate['key'])];

        // The region the element was understood to belong to ("Hero", "FAQ")
        // belongs on the band around it, which is what the editor navigates by.
        if (filled($meta['region'] ?? null)) {
            $this->tagRegion($node, (string) $meta['region']);
        }

        match ($candidate['kind']) {
            'text' => $this->setAttrs($node, [
                'data-edit' => 'setting:'.$key,
            ] + $label),
            'image' => $this->setAttrs($node, [
                'data-edit-img' => 'setting:'.$key,
                'data-edit-preview' => $node->getAttribute('src'),
            ] + $label),
            'link' => $this->setAttrs($node, $this->autoMode
                // Auto: a link's TEXT and its href are both editable.
                ? [
                    'data-edit' => 'setting:'.$key,
                    'data-edit-href' => 'auto:'.$this->autoKey($node, '#href'),
                ]
                : [
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

        // Lists first — an item added or removed changes what the content
        // loops below have to fill in.
        foreach ($xpath->query('//*[@data-edit-list]') as $container) {
            $listKey = $container->getAttribute('data-edit-list');
            if (! array_key_exists($listKey, $overrides)) {
                continue;
            }
            $order = json_decode($overrides[$listKey], true);
            if (! is_array($order)) {
                continue;
            }

            $items = [];
            foreach (iterator_to_array($container->childNodes) as $child) {
                if ($child instanceof DOMElement && $child->hasAttribute('data-edit-item')) {
                    $items[$child->getAttribute('data-edit-item')] = $child;
                    $container->removeChild($child);
                }
            }
            if ($items === []) {
                continue;
            }
            $template = reset($items);

            foreach ($order as $id) {
                $id = (string) $id;
                if (isset($items[$id])) {
                    $container->appendChild($items[$id]);

                    continue;
                }
                // An added item: copy the first one and give the copy its own
                // keys, so editing it cannot disturb the original.
                $clone = $template->cloneNode(true);
                if ($clone instanceof DOMElement) {
                    $this->rekeyItem($clone, $id);
                    $container->appendChild($clone);
                }
            }
        }

        foreach ($xpath->query('//*[@data-edit]') as $node) {
            $value = $node->getAttribute('data-edit');
            if (! str_starts_with($value, 'setting:')) {
                continue;
            }
            $key = substr($value, strlen('setting:'));
            if (! array_key_exists($key, $overrides)) {
                continue;
            }
            // Put the new words where the old ones were. Appending instead
            // pushed them past any child element, so a paragraph ending in a
            // link rendered as "HTML5 UPMy new sentence".
            $replaced = false;
            foreach (iterator_to_array($node->childNodes) as $child) {
                if ($child->nodeType !== XML_TEXT_NODE) {
                    continue;
                }
                if ($replaced) {
                    $node->removeChild($child);

                    continue;
                }
                // Keep the spacing that separated the text from a sibling link.
                $trailing = preg_match('/\s$/', $child->nodeValue) ? ' ' : '';
                $child->nodeValue = $overrides[$key].$trailing;
                $replaced = true;
            }
            if (! $replaced) {
                $node->appendChild($this->doc->createTextNode($overrides[$key]));
            }
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

        foreach ($xpath->query('//*[@data-edit-href]') as $node) {
            $key = $node->getAttribute('data-edit-href');
            if ($key !== '' && array_key_exists($key, $overrides) && $overrides[$key] !== '') {
                $node->setAttribute('href', $overrides[$key]);
            }
        }

        foreach ($xpath->query('//*[@data-edit-bg]') as $node) {
            $value = $node->getAttribute('data-edit-bg');
            if (! str_starts_with($value, 'setting:')) {
                continue;
            }
            $key = substr($value, strlen('setting:'));
            if (! array_key_exists($key, $overrides) || $overrides[$key] === '') {
                continue;
            }
            $url = $overrides[$key];
            // Feed both the JS lazy-bg attributes and an inline fallback.
            foreach (['data-background', 'data-bg', 'data-background-image'] as $attr) {
                if ($node->hasAttribute($attr)) {
                    $node->setAttribute($attr, $url);
                }
            }
            $node->setAttribute('data-edit-preview', $url);
            $style = $node->getAttribute('style');
            $style = trim(preg_replace('/background-image\s*:[^;]*;?/i', '', $style), '; ');
            $node->setAttribute('style', trim($style.";background-image:url('".$url."')", '; '));
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
    protected function autoKey(DOMElement $node, string $salt = ''): string
    {
        return substr(hash('sha256', $this->keyPath($node).$salt), 0, 12);
    }

    /**
     * Position alone is not a safe identity inside a list: delete the second
     * card and every later card shifts up, so saved content would follow the
     * wrong element. Inside a list item we key relative to the item's stable
     * id instead, which survives insertion and removal.
     */
    protected function keyPath(DOMElement $node): string
    {
        // Inside a list, key relative to the item's own id. The id is only
        // unique within its list ("i0" is the first item of every list on the
        // page), so the list's own key has to be part of the path: without it
        // the first menu entry, the first social link and the copyright line
        // all collapse onto one key and overwrite each other.
        for ($el = $node; $el instanceof DOMElement; $el = $el->parentNode) {
            if ($el->hasAttribute('data-edit-item')) {
                $list = $el->parentNode instanceof DOMElement ? $el->parentNode->getAttribute('data-edit-list') : '';

                return 'list:'.$list.'/item:'.$el->getAttribute('data-edit-item').'/'.$this->structuralPath($node, $el);
            }
        }

        // Otherwise anchor to the nearest id. A template's ids are landmarks
        // (#banner, #footer), so a developer editing one part of the document
        // cannot shift keys in another part and orphan the content saved
        // against them. Without this the whole page is one brittle chain.
        for ($el = $node; $el instanceof DOMElement; $el = $el->parentNode) {
            $id = $el->getAttribute('id');
            if ($id !== '') {
                return 'id:'.$id.'/'.$this->structuralPath($node, $el);
            }
        }

        return $this->structuralPath($node);
    }

    /**
     * The band an element belongs to: the OUTERMOST sectioning element around
     * it. Themes nest these freely (a <header> holding a section's title, four
     * <section>s inside one band), and treating each of those as its own region
     * splits a single part of the page into several. <main> is excluded because
     * it wraps the whole document.
     */
    protected function bandFor(DOMElement $node): ?DOMElement
    {
        $tags = ['section', 'header', 'footer', 'nav', 'article', 'aside'];
        $band = null;

        for ($el = $node; $el instanceof DOMElement; $el = $el->parentNode) {
            if (in_array(strtolower($el->tagName), $tags, true)) {
                $band = $el; // keep going: the last one found is the outermost
            }
        }

        return $band;
    }

    /** Record the page region on the band containing this element. */
    protected function tagRegion(DOMElement $node, string $region): void
    {
        $band = $this->bandFor($node);

        if ($band !== null && ! $band->hasAttribute('data-edit-region')) {
            $band->setAttribute('data-edit-region', $region);
        }
    }

    /**
     * Point a duplicated item's keys at its own id, so its content is stored
     * separately from the item it was copied from.
     */
    protected function rekeyItem(DOMElement $item, string $newId): void
    {
        $item->setAttribute('data-edit-item', $newId);

        $nodes = [$item];
        foreach ($item->getElementsByTagName('*') as $descendant) {
            $nodes[] = $descendant;
        }

        foreach ($nodes as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }
            foreach (['data-edit' => 'setting:auto:', 'data-edit-img' => 'setting:auto:', 'data-edit-bg' => 'setting:auto:'] as $attr => $prefix) {
                if (str_starts_with($node->getAttribute($attr), $prefix)) {
                    $salt = $attr === 'data-edit-bg' ? '#bg' : '';
                    $node->setAttribute($attr, $prefix.$this->autoKey($node, $salt));
                }
            }
            if (str_starts_with($node->getAttribute('data-edit-href'), 'auto:')) {
                $node->setAttribute('data-edit-href', 'auto:'.$this->autoKey($node, '#href'));
            }
            if (str_starts_with($node->getAttribute('data-style'), 's')) {
                $node->setAttribute('data-style', 's'.$this->autoKey($node));
            }
        }
    }

    /**
     * Give every repeated run of siblings a list id and each item a stable id.
     */
    protected function applyListTags(): void
    {
        foreach (iterator_to_array($this->doc->getElementsByTagName('*')) as $container) {
            if (! $container instanceof DOMElement || $container->hasAttribute('data-edit-list')) {
                continue;
            }
            if (! $this->isCollectionContainer($container)) {
                continue;
            }

            $container->setAttribute('data-edit-list', 'auto:'.substr(hash('sha256', $this->structuralPath($container).'#list'), 0, 12));

            $index = 0;
            foreach ($container->childNodes as $child) {
                if ($child instanceof DOMElement) {
                    $child->setAttribute('data-edit-item', 'i'.$index++);
                }
            }
        }
    }

    protected function structuralPath(DOMElement $node, ?DOMElement $stopAt = null): string
    {
        $segments = [];

        for ($el = $node; $el instanceof DOMElement; $el = $el->parentNode) {
            if ($stopAt !== null && $el === $stopAt) {
                break;
            }
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

    /** Style props every element exposes to the editor. */
    protected const STYLE_PROPS = 'background,backgroundImage,textColor,fontSize,paddingY,paddingX,radius,hidden';

    /**
     * Auto mode: make EVERY element styleable. Each gets a stable `data-style`
     * key + its editable props; the runtime opens the style editor when the
     * element is clicked in edit mode (no per-element chip). Skips only tags
     * with no visual box or that belong to the editing chrome.
     */
    protected function applyStyles(): int
    {
        $tagged = 0;

        $skip = ['html', 'head', 'body', 'script', 'style', 'meta', 'link', 'title', 'br', 'hr', 'source', 'template'];

        foreach (iterator_to_array($this->doc->getElementsByTagName('*')) as $el) {
            if (! $el instanceof DOMElement) {
                continue;
            }

            $tag = strtolower($el->tagName);
            if (in_array($tag, $skip, true) || $el->hasAttribute('data-style')) {
                continue;
            }

            $el->setAttribute('data-style', 's'.$this->autoKey($el));
            $el->setAttribute('data-style-props', self::STYLE_PROPS);
            $tagged++;

            // A background image — inline or a slider-style data-* attribute —
            // is itself editable.
            $bgUrl = $this->backgroundImageUrl($el);
            if ($bgUrl !== null && ! $el->hasAttribute('data-edit-bg')) {
                $el->setAttribute('data-edit-bg', 'setting:auto:'.$this->autoKey($el, '#bg'));
                $el->setAttribute('data-edit-preview', $bgUrl);
                $el->setAttribute('data-edit-kind', 'background');
            }
        }

        return $tagged;
    }

    /**
     * The background image URL of an element, whether set inline
     * (style="background-image:url()") or via a common lazy-bg data attribute
     * (data-background / data-bg / data-background-image) that theme JS applies.
     */
    protected function backgroundImageUrl(DOMElement $el): ?string
    {
        foreach (['data-background', 'data-bg', 'data-background-image'] as $attr) {
            if ($el->hasAttribute($attr) && $el->getAttribute($attr) !== '') {
                return $el->getAttribute($attr);
            }
        }

        $style = $el->getAttribute('style');
        if (stripos($style, 'background') !== false && preg_match('/url\(\s*[\'"]?([^\'")]+)/i', $style, $m)) {
            return $m[1];
        }

        return null;
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

            // An anchor with no href is still a label worth editing. Wrappers
            // used to be tagged on its behalf; now that they are not, it has to
            // stand on its own or its words become uneditable.
            if ($tag === 'a' && $this->isTextLeaf($child)) {
                $this->addText($child);

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

        // A wrapper whose words all live in a child, like <li><a>Activate</a>,
        // is not the editable thing: the child is. Tagging both of them let an
        // edit to the wrapper append a stray phrase beside the button.
        $direct = '';
        foreach ($element->childNodes as $child) {
            if ($child->nodeType === XML_TEXT_NODE) {
                $direct .= $child->nodeValue;
            }
        }
        if (trim($direct) === '') {
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

        // Bare same-tag links (a nav) count without shared classes, and so do
        // list items: a menu is <ul><li>Home</li><li>About</li></ul>, whose
        // items carry no classes at all but are plainly a list to an editor.
        return $shared !== [] || $tags[0] === 'a' || $tags[0] === 'li';
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
