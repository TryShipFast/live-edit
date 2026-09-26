<?php

namespace ShipFast\LiveEdit\Mapper;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;
use Illuminate\Support\Str;
use ShipFast\LiveEdit\Domain\Content\Companions;
use ShipFast\LiveEdit\Support\ContentSignature;
use ShipFast\LiveEdit\Support\SvgSanitiser;

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
    protected const TEXT_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'address', 'li', 'blockquote', 'figcaption', 'figure', 'span', 'div', 'button', 'label', 'th', 'td', 'dt', 'dd', 'summary', 'caption', 'cite', 'q'];

    /**
     * Inline tags that don't disqualify an element from being a text leaf.
     *
     * This is the HTML phrasing set rather than a handful of favourites,
     * because a short list is indistinguishable from a bug. A paragraph
     * carrying one <code> or one <abbr> used to be disqualified here, and
     * since <code> is not a text tag either the words fell through both rules
     * and the whole paragraph became uneditable — no warning, no mark on the
     * page, just a client asking why that one sentence cannot be changed. On
     * real WordPress content that was half the words on the page.
     *
     * Widening this is safe in a way that widening TEXT_TAGS is not: it only
     * ever admits an element whose own words are already editable, and the
     * applier replaces text nodes while leaving child markup alone, so the
     * <code> keeps its tag and its styling.
     */
    protected const INLINE_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'small', 'br', 'wbr', 'span', 'a', 'sup', 'sub', 'mark', 'code', 'kbd', 'samp', 'var', 'abbr', 'acronym', 'cite', 'q', 'del', 'ins', 'dfn', 'time', 'data', 'bdi', 'bdo', 'ruby', 'rt', 'rp', 'big', 'tt', 'strike', 'font', 'nobr'];

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
    public function apply(string $html, array $kinds = ['text', 'image', 'link', 'icon'], bool $auto = false, ?callable $labeller = null, string $page = ''): array
    {
        $this->page = $page;
        $this->sharedKeys = [];
        $this->sharedSeen = [];

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

        $this->countClasses();

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

        // A counter's words are a placeholder, so say where its real value
        // lives. The panel shows that instead of the "00" on the page, which
        // is also what the client sees once the script has run and left the
        // element with no words of its own at all.
        $counter = $this->counterAttributeOf($node);
        $counted = $counter === null ? [] : [
            'data-edit-attr' => $counter,
            'data-edit-value' => trim($node->getAttribute($counter)),
        ];

        match ($candidate['kind']) {
            'text' => $this->setAttrs($node, [
                'data-edit' => 'setting:'.$key,
            ] + $counted + $label),
            'icon' => $this->setAttrs($node, [
                // An inline drawing is replaceable like any other asset. The
                // scanner found these already and had nowhere to put them.
                'data-edit-svg' => 'setting:'.$key,
            ] + $label),
            'image' => $this->setAttrs($node, [
                'data-edit-img' => 'setting:'.$key,
                'data-edit-preview' => $node->getAttribute('src'),
            ] + $label),
            'link' => $this->setAttrs($node, $this->autoMode
                // Auto: a link's href is editable, and its text too when the
                // words are its own. A social link wraps them in a span
                // ("<a><span>Instagram</span></a>"), and offering the anchor a
                // text box then hands the client a blank for a word plainly on
                // the page. The span is reached and tagged separately.
                ? array_filter([
                    'data-edit' => ContentSignature::hasOwnText($node) ? 'setting:'.$key : null,
                    'data-edit-href' => 'auto:'.$this->autoKey($node, '#href'),
                ])
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
            $this->writeWords($node, (string) $overrides[$key]);

            // A counter renders from its attribute, so text alone would be
            // overwritten the moment the theme's script ran.
            $attribute = $node->getAttribute('data-edit-attr');
            if ($attribute !== '') {
                $node->setAttribute($attribute, $overrides[$key]);
                $node->setAttribute('data-edit-value', $overrides[$key]);
            }
        }

        foreach ($xpath->query('//*[@data-edit-svg]') as $node) {
            $value = $node->getAttribute('data-edit-svg');
            if (! str_starts_with($value, 'setting:')) {
                continue;
            }
            $key = substr($value, strlen('setting:'));
            if (! array_key_exists($key, $overrides) || trim((string) $overrides[$key]) === '') {
                continue;
            }

            // Rebuilt from the allowed list before it goes near the page: this
            // is the only stored value that is markup rather than text.
            $clean = SvgSanitiser::clean((string) $overrides[$key]);
            if ($clean === '') {
                continue;
            }

            $fragment = $this->doc->createDocumentFragment();
            if (! @$fragment->appendXML($clean)) {
                continue;
            }
            $replacement = $fragment->firstChild;
            if (! $replacement instanceof DOMElement) {
                continue;
            }

            // The theme's own sizing and classes stay on the element; only the
            // drawing inside it changes.
            foreach (['class', 'width', 'height', 'style', 'data-edit-svg', 'data-edit-label'] as $keep) {
                if ($node->hasAttribute($keep)) {
                    $replacement->setAttribute($keep, $node->getAttribute($keep));
                }
            }
            $node->parentNode?->replaceChild($replacement, $node);
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

            // The description is stored beside the picture. The browser
            // applies it the same way; two implementations of one rule is how
            // an exported page ends up missing the alt text the live one has.
            foreach (['Alt' => 'alt', 'Title' => 'title'] as $suffix => $attribute) {
                if (! array_key_exists($key.$suffix, $overrides)) {
                    continue;
                }

                $described = (string) $overrides[$key.$suffix];

                // alt="" is a real answer — it tells a screen reader to skip
                // the image. An empty title is a tooltip nobody wanted.
                if ($described === '' && $attribute === 'title') {
                    $node->removeAttribute('title');
                } else {
                    $node->setAttribute($attribute, $described);
                }
            }

            /*
             * And who took it, written onto the picture itself.
             *
             * Under Unsplash's terms and every Creative Commons licence but
             * CC0 the photographer has to be named where the work appears, so
             * the page has to carry the credit rather than us knowing it in a
             * database. On the element, because that is the only place that
             * survives a theme rearranging its own markup, and because it is
             * what lets the page show the credit next to the right picture
             * without anybody wiring the two together.
             */
            foreach (Companions::CREDIT as $suffix) {
                if (! array_key_exists($key.$suffix, $overrides)) {
                    continue;
                }

                $attribute = 'data-edit-'.strtolower(preg_replace('/(?<!^)[A-Z]/', '-$0', $suffix));
                $said = (string) $overrides[$key.$suffix];

                // A picture replaced by one that needs no credit clears the
                // last one. The previous photographer's name under somebody
                // else's photograph is a false statement about who took it.
                $said === ''
                    ? $node->removeAttribute($attribute)
                    : $node->setAttribute($attribute, $said);
            }
        }

        foreach ($xpath->query('//*[@data-edit-href]') as $node) {
            $key = $node->getAttribute('data-edit-href');
            if ($key !== '' && array_key_exists($key, $overrides) && $overrides[$key] !== '') {
                $node->setAttribute('href', $overrides[$key]);
            }
        }

        foreach ($xpath->query('//*[@data-edit-icon]') as $node) {
            $value = $node->getAttribute('data-edit-icon');
            if (! str_starts_with($value, 'setting:')) {
                continue;
            }
            $key = substr($value, strlen('setting:'));
            if (! array_key_exists($key, $overrides) || $overrides[$key] === '') {
                continue;
            }
            // Class names land in an attribute, so nothing but class names is
            // allowed through.
            $chosen = array_values(array_filter(preg_split('/\s+/', (string) preg_replace('/[^A-Za-z0-9_\- ]/', '', $overrides[$key]))));
            $was = $node->getAttribute('data-edit-icon-current');
            if ($chosen === [] || $was === '') {
                continue;
            }

            if (count($chosen) === 1) {
                // One name: swap it for the old one and leave the theme's own
                // classes exactly as they are.
                $classes = preg_split('/\s+/', trim($node->getAttribute('class'))) ?: [];
                $classes = array_map(fn (string $class) => $class === $was ? $chosen[0] : $class, $classes);
            } else {
                // Several: the editor moved this icon to another of the theme's
                // variants, which takes different classes, so the list it built
                // stands in for the whole attribute.
                $classes = $chosen;
            }

            $node->setAttribute('class', implode(' ', $classes));
            $name = $this->iconTokenOf($node);
            if ($name !== null) {
                $node->setAttribute('data-edit-icon-current', $name);
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
    /**
     * Whether this element's content belongs to one page or to all of them.
     *
     * A theme repeats its navigation and footer on every page, and a client who
     * renames a menu entry means it renamed everywhere, not on the page they
     * happened to be looking at. Everything else is that page's own: two pages
     * built from the same layout would otherwise share a key and overwrite each
     * other's words.
     *
     * The OUTERMOST sectioning ancestor decides it, so a <header class="major">
     * heading inside a section stays the page's own.
     */
    /**
     * A content-based key for an element in a repeated region.
     *
     * Memoised per node: a node can be asked for its key more than once (its
     * words and its link are separate candidates), and the repeat counter must
     * not move underneath it.
     */
    protected function sharedKey(DOMElement $node): string
    {
        $path = $node->getNodePath();
        if (isset($this->sharedKeys[$path])) {
            return $this->sharedKeys[$path];
        }

        $band = $this->bandFor($node);

        return $this->sharedKeys[$path] = 'shared:'.$this->signatureFor($node, strtolower($band?->tagName ?? 'shared'));
    }

    /**
     * Name an element by what the theme put in it, numbered where that is not
     * unique.
     *
     * Used wherever position is a bad name. The words themselves are safe to
     * key on because a tagged document always holds the THEME's text: content
     * is applied when a page is served, never written back, so a client can
     * replace every word of an element and its signature does not move.
     */
    protected function signatureFor(DOMElement $node, string $scope): string
    {
        $signature = $scope.'/'.ContentSignature::of($node);
        // The same words can appear twice in one footer, so each repeat is
        // numbered in document order.
        $occurrence = $this->sharedSeen[$signature] = ($this->sharedSeen[$signature] ?? -1) + 1;

        return $signature.'#'.$occurrence;
    }

    /** Whether this element sits inside a list item, which keys its own way. */
    protected function insideListItem(DOMElement $node): bool
    {
        for ($el = $node; $el instanceof DOMElement; $el = $el->parentNode) {
            if ($el->hasAttribute('data-edit-item')) {
                return true;
            }
        }

        return false;
    }

    protected function isShared(DOMElement $node): bool
    {
        $band = $this->bandFor($node);

        return $band !== null && in_array(strtolower($band->tagName), ['header', 'footer', 'nav'], true);
    }

    protected function keyPath(DOMElement $node): string
    {
        $shared = $this->isShared($node);
        $scope = ($this->page === '' || $shared) ? '' : 'page:'.$this->page.'/';

        // In a region the theme repeats, name the element by what it holds
        // rather than by where it sits. A footer copied onto every page picks
        // up small differences — one page carries an extra block above the
        // copyright — and a position-based name then treats the same line as
        // two, so editing it on one page leaves the others behind.
        if ($shared && ! $this->insideListItem($node)) {
            return $this->sharedKey($node);
        }

        // Inside a list, key relative to the item's own id. The id is only
        // unique within its list ("i0" is the first item of every list on the
        // page), so the list's own key has to be part of the path: without it
        // the first menu entry, the first social link and the copyright line
        // all collapse onto one key and overwrite each other.
        for ($el = $node; $el instanceof DOMElement; $el = $el->parentNode) {
            if ($el->hasAttribute('data-edit-item')) {
                $list = $el->parentNode instanceof DOMElement ? $el->parentNode->getAttribute('data-edit-list') : '';

                return $scope.'list:'.$list.'/item:'.$el->getAttribute('data-edit-item').'/'.$this->structuralPath($node, $el);
            }
        }

        // Otherwise anchor to the nearest landmark. A template's ids are
        // landmarks (#banner, #footer), so a developer editing one part of the
        // document cannot shift keys in another part and orphan the content
        // saved against them. Without this the whole page is one brittle chain.
        for ($el = $node; $el instanceof DOMElement; $el = $el->parentNode) {
            $landmark = $this->landmarkOf($el);

            if ($landmark !== null) {
                return $scope.$landmark.'/'.$this->structuralPath($node, $el);
            }
        }

        // No landmark anywhere above it. Rather than name the element by its
        // position in the whole document — which is what made a key move the
        // moment anything above it changed — name it relative to the region it
        // sits in.
        //
        // The observation this rests on: wrapping a page, which is what a
        // builder does whenever somebody adds a container, leaves every
        // element's position relative to its OWN parent untouched. Only the
        // path from the body changes. So a key that never measures from the
        // body survives it.
        //
        // Measured across ten real sites — Webflow, Squarespace, Framer,
        // Shopify, two page builders, Tailwind, Bootstrap — that one change is
        // the difference between a client's edits surviving a container being
        // added and most of them coming loose.
        $region = $this->regionToken($node);

        if ($region !== null) {
            return $scope.$region['token'].'/'.$this->structuralPath($node, $region['element']);
        }

        // Nothing distinctive anywhere above it — no id, no builder handle, no
        // class of its own, not even a region. Naming it by its position in
        // the whole document is what made a key move the moment anything above
        // it changed, and on a page built entirely from anonymous divs that is
        // most of the page.
        //
        // A list container is the costly case: every item is named partly by
        // its list, so one list named by position takes all of its items' keys
        // with it whenever the page is rearranged. Measured on a real builder
        // page, inserting a single element at the top moved 82% of the visible
        // keys, almost all of them inside lists.
        //
        // So name it by what the theme put in it, the way a repeated region is
        // already named. That cannot move when something above it does.
        return $scope.'sig:'.$this->signatureFor($node, 'anon');
    }

    /**
     * The nearest region around this element, named without reference to
     * anything above it.
     *
     * A region is named by what it is and how it sits among its own siblings —
     * never by the chain back to the document. Its classes come first because
     * a theme gives its sections distinctive ones, and they say more about
     * which section this is than a number does.
     *
     * @return array{element: DOMElement, token: string}|null
     */
    protected function regionToken(DOMElement $node): ?array
    {
        $regions = ['section', 'header', 'footer', 'nav', 'article', 'aside', 'main', 'form'];

        for ($el = $node->parentNode; $el instanceof DOMElement; $el = $el->parentNode) {
            $tag = strtolower($el->tagName);

            if (! in_array($tag, $regions, true)) {
                continue;
            }

            $classes = trim(preg_replace('/\s+/', ' ', $el->getAttribute('class')));

            // Among its own siblings of the same kind, so a second <section>
            // is distinguishable from the first without either of them
            // depending on what surrounds their parent.
            $index = 1;
            for ($sib = $el->previousSibling; $sib !== null; $sib = $sib->previousSibling) {
                if ($sib instanceof DOMElement && strtolower($sib->tagName) === $tag) {
                    $index++;
                }
            }

            $name = $classes !== '' ? substr(hash('sha256', $classes), 0, 8) : 'n';

            return ['element' => $el, 'token' => 'in:'.$tag.'.'.$name.'#'.$index];
        }

        return null;
    }

    /**
     * The band an element belongs to: the OUTERMOST sectioning element around
     * it. Themes nest these freely (a <header> holding a section's title, four
     * <section>s inside one band), and treating each of those as its own region
     * splits a single part of the page into several. <main> is excluded because
     * it wraps the whole document.
     */
    /** The page being tagged, so its content does not collide with another's. */
    protected string $page = '';

    /** Node path => key, so a node asked twice answers the same. */
    protected array $sharedKeys = [];

    /** Signature => times seen, to number repeats within one page. */
    protected array $sharedSeen = [];

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

            // Named the way everything else is named, rather than by its
            // position in the whole document.
            //
            // This was the costly line. Every item of a list carries its
            // list's name in its own key, so a list named by a path from the
            // body takes all of its items' content with it whenever anything
            // above it changes — and on a page built from anonymous divs,
            // almost everything a client edits is inside one. Measured on a
            // real builder page: inserting a single element at the top moved
            // 82% of the visible keys, nearly all of them for this reason.
            //
            // keyPath already knows how to name a thing without measuring from
            // the body: a landmark if there is one, the region it sits in, a
            // class that appears once, and failing all of those, what the
            // theme put inside it. A repeated region keeps its own rule — the
            // menu is the menu on every page, however the markup shifts.
            $identity = $this->isShared($container)
                ? 'shared-list:'.ContentSignature::ofSubtree($container)
                : $this->keyPath($container).'#list';
            $container->setAttribute('data-edit-list', 'auto:'.substr(hash('sha256', $identity), 0, 12));

            $index = 0;
            foreach ($container->childNodes as $child) {
                if ($child instanceof DOMElement) {
                    $child->setAttribute('data-edit-item', 'i'.$index++);
                }
            }
        }
    }

    /** How often each class string appears on this page. */
    protected array $classCounts = [];

    /**
     * Count the class strings, so a rare one can be used as a landmark.
     *
     * A modern page has almost no ids and almost no sectioning elements — it
     * is divs all the way down — but it is generous with classes, and a class
     * string that appears once on a page identifies its element as well as an
     * id would. Counting them first is what makes that usable: a class shared
     * by forty cards says nothing, and one that appears once says everything.
     */
    protected function countClasses(): void
    {
        $this->classCounts = [];

        foreach ($this->doc->getElementsByTagName('*') as $el) {
            $classes = $this->classSignature($el);

            if ($classes !== '') {
                $this->classCounts[$classes] = ($this->classCounts[$classes] ?? 0) + 1;
            }
        }
    }

    protected function classSignature(DOMElement $element): string
    {
        $classes = preg_split('/\s+/', trim($element->getAttribute('class'))) ?: [];
        sort($classes);

        return implode(' ', array_filter($classes));
    }

    /**
     * A name for this element that survives the page being rearranged.
     *
     * An id is the obvious one, and on a hand-written template it is the only
     * one. A page builder writes almost none — and gives every block an
     * identity of its own instead, because it needs to find them again itself:
     * Elementor puts it in data-id and repeats it in a class, Bricks and
     * Oxygen do the same with their own prefixes.
     *
     * Anchoring only to id meant walking straight past hundreds of perfectly
     * stable names. Measured on one Elementor page: wrapping the content in a
     * new div — which a builder does whenever somebody adds a container —
     * moved half of the keys, and every edit saved against them would have
     * come loose. Nothing would have errored; the page would simply have gone
     * back to the theme's own words.
     *
     * The nearest one wins, whichever kind it is, because the nearer the
     * anchor the less of the page can move underneath it.
     */
    protected function landmarkOf(DOMElement $element): ?string
    {
        $id = trim($element->getAttribute('id'));

        if ($id !== '') {
            return 'id:'.$id;
        }

        // A builder's own handle for this block. Stable across edits, because
        // it is how the builder itself finds the block again.
        $dataId = trim($element->getAttribute('data-id'));

        if ($dataId !== '') {
            return 'block:'.$dataId;
        }

        // A class string that appears once on this page. Not an identifier
        // anybody meant as one, but it behaves like one — and on a page with
        // no ids and no sections it is the only thing between a key and being
        // measured from the body.
        $classes = $this->classSignature($element);

        if ($classes !== '' && ($this->classCounts[$classes] ?? 0) === 1) {
            return 'cls:'.substr(hash('sha256', $classes), 0, 10);
        }

        // The same handle, repeated in a class by the builders that do that.
        // Matched by shape rather than by name so a builder nobody has heard
        // of still benefits: a prefix, then something that looks like a
        // generated id rather than a word somebody typed.
        foreach (preg_split('/\s+/', trim($element->getAttribute('class'))) ?: [] as $class) {
            if (preg_match('/^(elementor-element|brxe|ct|oxy|fl-node|et_pb_module)-([a-f0-9]{5,}|[a-z0-9]{6,})$/i', $class, $m)) {
                return 'block:'.$m[2];
            }
        }

        return null;
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
    /**
     * Attributes a theme's own script counts up from.
     *
     * A counter shows a number the markup does not contain: the text is a
     * placeholder ("00") and the real figure sits in an attribute, which the
     * script renders once the section is scrolled to. Editing the text is
     * pointless — the script overwrites it on the next load — so the attribute
     * is the thing the client is actually changing.
     */
    protected const COUNTER_ATTRIBUTES = [
        'data-count', 'data-counter', 'data-number', 'data-num', 'data-stop', 'data-purecounter-end',
    ];

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
            if (in_array($tag, $skip, true)) {
                continue;
            }

            // This pass walks the document flat rather than descending, so
            // refusing the chrome element itself is not enough — everything
            // under it has to be refused too. That is how ninety-four pieces
            // of the WordPress toolbar came to be styleable on a real site.
            if ($this->insideChrome($el)) {
                continue;
            }

            /*
             * An element that already has a style key keeps it — but is still
             * asked the other questions.
             *
             * This used to skip the whole element, which was fine while every
             * page arrived unmarked. It stopped being fine the moment a page
             * could be scanned twice: WordPress is prepared on the server, so
             * every element comes back carrying a style key, and then the
             * browser — the only thing that can see a background living in a
             * stylesheet — writes down what it found and asks again. Every one
             * of those elements was skipped on the second pass, so the
             * backgrounds were written down and never given a key. Nothing
             * errored; the pictures were simply never offered.
             *
             * An icon is the same shape of answer for the same reason: it can
             * appear after the first look.
             */
            if (! $el->hasAttribute('data-style')) {
                $el->setAttribute('data-style', 's'.$this->autoKey($el));
                $el->setAttribute('data-style-props', self::STYLE_PROPS);
                $tagged++;
            }

            // An icon in a bought theme is a class on an empty element, not
            // content, so nothing above would ever offer it for editing.
            $icon = $this->iconTokenOf($el);
            if ($icon !== null && ! $el->hasAttribute('data-edit-icon')) {
                $el->setAttribute('data-edit-icon', 'setting:auto:'.$this->autoKey($el, '#icon'));
                $el->setAttribute('data-edit-icon-current', $icon);
            }

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
     * The icon class an element is displaying, if it is showing one.
     *
     * Icon fonts all follow the same shape: a family class plus a name class
     * such as "fa-gem" or "flaticon-shipped". The name is what an editor wants
     * to change, so that token is what gets tagged.
     */
    protected function iconTokenOf(DOMElement $el): ?string
    {
        $classes = preg_split('/\s+/', trim($el->getAttribute('class'))) ?: [];

        foreach ($classes as $class) {
            if (preg_match('/^(fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*$/i', $class)) {
                return $class;
            }
        }

        return null;
    }

    /**
     * The background image URL of an element, whether set inline
     * (style="background-image:url()") or via a common lazy-bg data attribute
     * (data-background / data-bg / data-background-image) that theme JS applies.
     *
     * data-kb-bg is the browser's answer rather than the theme's: a page
     * builder puts its backgrounds in a generated stylesheet, so the biggest
     * picture on the page is often nowhere in the markup. The runtime resolves
     * those against the live cascade and writes them here before the page is
     * sent, which keeps selector matching out of this class entirely.
     */
    protected function backgroundImageUrl(DOMElement $el): ?string
    {
        // The theme's own attribute first: it is what that theme will act on
        // when it loads the picture, so it stays authoritative over anything
        // the browser computed from a stylesheet afterwards. The runtime skips
        // these elements for the same reason, so the two rules agree.
        foreach (['data-background', 'data-bg', 'data-background-image', 'data-kb-bg'] as $attr) {
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

    /**
     * Somebody else's furniture, which is not the site.
     *
     * A signed-in WordPress page carries an admin toolbar, and a document may
     * carry a debug bar, a cookie banner's own shell, or our editor's chrome.
     * None of it belongs to the client and none of it is theirs to change.
     *
     * The WordPress adapter used to strip its toolbar after the fact, and only
     * of content — leaving ninety-four styleable elements behind, so a client
     * could restyle the WordPress toolbar. Every adapter would have to
     * remember to do the same thing, and each would forget a different half of
     * it. Refusing to tag it in the first place is one rule in one place, and
     * data-no-edit lets any host mark its own furniture without us knowing the
     * name of it.
     */
    protected function isChrome(DOMElement $element): bool
    {
        if ($element->hasAttribute('data-no-edit') || $element->hasAttribute('data-live-edit-chrome')) {
            return true;
        }

        $id = strtolower($element->getAttribute('id'));

        if (in_array($id, ['wpadminbar', 'wp-toolbar', 'query-monitor', 'debug-bar', 'adminmenumain'], true)) {
            return true;
        }

        $classes = preg_split('/\s+/', strtolower(trim($element->getAttribute('class')))) ?: [];

        return (bool) array_intersect($classes, ['live-edit-chrome', 'le-chrome', 'kastsbuild-chrome']);
    }

    /** The same question asked of an element and everything above it. */
    protected function insideChrome(DOMElement $element): bool
    {
        for ($node = $element; $node instanceof DOMElement; $node = $node->parentNode) {
            if ($this->isChrome($node)) {
                return true;
            }
        }

        return false;
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

            if ($this->isChrome($child)) {
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

            // Before anything else: a counter's placeholder text can fail the
            // usual checks, and two of Transfar's four went untagged for it.
            if ($this->counterAttributeOf($child) !== null) {
                $this->addText($child);

                continue;
            }

            // An empty href is not "no link" — it is the one link that most
            // needs an answer.
            //
            // A bought template ships its social row as <a href=""> with the
            // brand's icon inside, waiting for the buyer's own address. Those
            // were the only anchors skipped here, so the very first thing a new
            // customer sits down to do — put their Facebook page in — was the
            // one thing the editor would not let them do. All they could reach
            // was the screen-reader label inside, which is invisible.
            //
            // Found on a real Elementor template: four social links, four
            // empty hrefs, none of them editable.
            //
            // The value is not the test. An href="" is the template declaring
            // a destination it does not know yet, and Elementor drops the
            // attribute altogether — the four social anchors on the page that
            // exposed this carried target="_blank" and nothing else.
            //
            // target and rel are the tell: they mean nothing except on
            // something meant to navigate, so an anchor wearing one is a link
            // whatever its href says. A bare <a> with none of the three is
            // usually a control a script drives — a tab, an accordion — and
            // offering a web address for one of those invites breaking it.
            if ($tag === 'a' && $this->isDestination($child)) {
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

                // A counter sits inside a wrapper whose own words are a suffix
                // ("3670" + "K"). The wrapper is editable for the suffix, but
                // the number is a separate thing and has to be reached.
                //
                // A picture floated inside a paragraph is the same shape: the
                // paragraph is editable for its words, and stopping here left
                // the picture unreachable — a client could see it, could not
                // replace it, and nothing said why.
                if ($this->hasCounterInside($child) || $this->hasMediaInside($child)) {
                    $this->walk($child);
                }

                continue;
            }

            $this->walk($child);
        }
    }

    /**
     * The attribute holding this element's number, if it is a counter.
     *
     * The value must look like a number, which is what keeps this from
     * matching the many other things a theme keeps in a data attribute.
     */
    protected function counterAttributeOf(DOMElement $element): ?string
    {
        foreach (self::COUNTER_ATTRIBUTES as $attribute) {
            if ($element->hasAttribute($attribute)
                && preg_match('/^\s*\d[\d,. ]*\s*$/', $element->getAttribute($attribute))) {
                return $attribute;
            }
        }

        return null;
    }

    /** Whether a counter sits somewhere below this element. */
    /**
     * Put new words where the old ones were, leaving alone whatever else the
     * element holds.
     *
     * Replacing the contents outright pushed the words past any child element,
     * so a paragraph ending in a link rendered as "HTML5 UPMy new sentence" —
     * and a paragraph with a picture floated inside it lost the picture
     * altogether. The browser's applier does exactly this; the two disagreeing
     * would mean the same edit reading differently live and in an export.
     */
    protected function writeWords(DOMElement $node, string $value): void
    {
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
            $child->nodeValue = $value.$trailing;
            $replaced = true;
        }

        if ($replaced) {
            return;
        }

        // No words of its own. A wrapper around a single element that holds
        // them — a button written as "<a><span>Book</span></a>", which is what
        // the panel showed the client — is the one case where where they go is
        // not a guess. Appending instead rendered "BookReserve".
        $children = [];
        foreach ($node->childNodes as $child) {
            if ($child instanceof DOMElement) {
                $children[] = $child;
            }
        }

        if (count($children) === 1 && $children[0]->getElementsByTagName('*')->length === 0) {
            $this->writeWords($children[0], $value);

            return;
        }

        $node->appendChild($this->doc->createTextNode($value));
    }

    /**
     * Whether this element has a picture or a player inside it.
     *
     * Only the kinds the walk itself knows what to do with: listing a tag here
     * that nothing tags would descend for nothing.
     */
    protected function hasMediaInside(DOMElement $element): bool
    {
        foreach (['img', 'svg', 'video', 'iframe', 'audio'] as $tag) {
            if ($element->getElementsByTagName($tag)->length > 0) {
                return true;
            }
        }

        return false;
    }

    protected function hasCounterInside(DOMElement $element): bool
    {
        foreach ($element->getElementsByTagName('*') as $descendant) {
            if ($descendant instanceof DOMElement && $this->counterAttributeOf($descendant) !== null) {
                return true;
            }
        }

        return false;
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

    /**
     * Whether this anchor is meant to take somebody somewhere.
     *
     * An href of any value says so. So does target or rel, which mean nothing
     * on anything else — and that is the only signal a page builder leaves
     * when the buyer has not filled the address in yet.
     */
    protected function isDestination(DOMElement $element): bool
    {
        return $element->hasAttribute('href')
            || $element->hasAttribute('target')
            || $element->hasAttribute('rel');
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
