<?php

/**
 * Which approach should decide what is editable on a page?
 *
 * A — the deterministic walk that ships today: rules over the DOM, the same
 *     answer every time, the AI only naming what it found.
 * B — the model decides: every element on the page is offered to it, and it
 *     picks which are editable and of what kind.
 *
 * Run on pages somebody actually tagged by hand — Tokreams Blue's five, where
 * every marker was put there deliberately — with every marker stripped off
 * before either approach sees them. The hand tagging is reported as a third
 * row rather than as an answer key: it binds a whole card to a record where a
 * scanner marks each leaf, and scoring one against the other mostly counts
 * that difference in granularity.
 *
 * So the measures are taken on the page itself, and are the things that decide
 * what a client can do and what breaks:
 *
 *   words reachable   how much of what a visitor reads can be changed at all
 *   overlapping       markers inside other markers — two boxes, one sentence
 *   empty             a text box on an element with no words of its own
 *   images / icons    of those present on the page
 *
 * Usage: php tools/ab-mapper.php <dir-of-html> [--only=A|B] [--model=…] [--batch=N] [--limit=N]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Mapper\MarkupScanner;

$appBase = getenv('AB_APP') ?: '/Users/temitopeolotin/PhpstormProjects/tokreamsblue';
require $appBase.'/vendor/autoload.php';
$app = require $appBase.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$dir = $argv[1] ?? null;
if (! $dir || ! is_dir($dir)) {
    fwrite(STDERR, "Usage: php tools/ab-mapper.php <dir-of-html>\n");
    exit(1);
}

$options = [];
foreach (array_slice($argv, 2) as $arg) {
    if (preg_match('/^--([a-z]+)=(.*)$/', $arg, $m)) {
        $options[$m[1]] = $m[2];
    }
}
$only = strtoupper($options['only'] ?? '');

if (isset($options['model'])) {
    config()->set('live-edit.ai.model', $options['model']);
}
echo 'B model: '.config('live-edit.ai.model')."\n";

/* ------------------------------ the answer key ------------------------------ */

/**
 * Every element a human marked, as a path in the tree and the kind of thing
 * it is.
 *
 * An image is recorded as the <img> it governs rather than as the element
 * carrying the marker: a hand-written host marks a panel laid OVER a picture,
 * a scanner marks the picture. Both mean "this picture is editable", and
 * comparing them by node would score a correct answer as two mistakes.
 */
function groundTruth(string $html): array
{
    $doc = loadDoc($html);
    $xpath = new DOMXPath($doc);
    $found = [];

    $kinds = [
        'data-edit' => 'text',
        'data-edit-img' => 'image',
        'data-edit-href' => 'link',
        'data-edit-icon' => 'icon',
        'data-edit-svg' => 'icon',
    ];

    foreach ($kinds as $attribute => $kind) {
        foreach ($xpath->query('//*[@'.$attribute.']') as $node) {
            $target = $kind === 'image' ? resolveImage($node) : $node;
            if ($target === null) {
                continue;
            }
            $found[$kind][$target->getNodePath()] = true;
        }
    }

    return $found;
}

/** The picture an image marker governs. */
function resolveImage(DOMElement $node): ?DOMElement
{
    if (strtolower($node->tagName) === 'img') {
        return $node;
    }

    $inside = $node->getElementsByTagName('img')->item(0);
    if ($inside instanceof DOMElement) {
        return $inside;
    }

    // An overlay panel sits beside the picture it covers.
    $parent = $node->parentNode;
    if ($parent instanceof DOMElement) {
        $sibling = $parent->getElementsByTagName('img')->item(0);
        if ($sibling instanceof DOMElement) {
            return $sibling;
        }
    }

    return null;
}

/** The same page with every marker taken off — what each approach is given. */
function stripMarkers(string $html): string
{
    $doc = loadDoc($html);
    $xpath = new DOMXPath($doc);

    // The editor's own buttons, which only exist because the page was
    // captured while signed in. Offering "+ Add a service" to either approach
    // measures nothing but the capture.
    foreach (iterator_to_array($xpath->query('//*[@data-live-create or @data-style-edit]')) as $chrome) {
        $chrome->parentNode?->removeChild($chrome);
    }

    foreach ($xpath->query('//*') as $node) {
        if (! $node instanceof DOMElement) {
            continue;
        }
        foreach (iterator_to_array($node->attributes) as $attribute) {
            if (str_starts_with($attribute->name, 'data-edit') || str_starts_with($attribute->name, 'data-style')) {
                $node->removeAttribute($attribute->name);
            }
        }
    }

    return (string) $doc->saveHTML();
}

function loadDoc(string $html): DOMDocument
{
    $doc = new DOMDocument;
    libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NOWARNING | LIBXML_NOERROR);
    libxml_clear_errors();

    return $doc;
}

/* --------------------------------- A and B --------------------------------- */

/** The deterministic walk, read back as the set of elements it marked. */
function approachA(string $clean): array
{
    $scanner = new MarkupScanner;
    $result = $scanner->apply($clean, ['text', 'image', 'link', 'icon'], true, null, 'ab');

    return groundTruth($result['html']);
}

/**
 * The model decides. Every element that could plausibly hold content is
 * offered — not only the ones A found, or B could never do better than A.
 */
function approachB(string $clean, int $batch = 50): array
{
    $doc = loadDoc($clean);
    $xpath = new DOMXPath($doc);

    $candidates = [];
    foreach ($xpath->query('//body//*') as $node) {
        if (! $node instanceof DOMElement) {
            continue;
        }
        $tag = strtolower($node->tagName);
        if (in_array($tag, ['script', 'style', 'noscript', 'head', 'meta', 'link', 'br', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'g', 'defs', 'stop', 'lineargradient'], true)) {
            continue;
        }

        $own = ownText($node);
        $isMedia = in_array($tag, ['img', 'svg', 'video', 'iframe'], true);
        $isLink = $tag === 'a' && $node->getAttribute('href') !== '';

        if ($own === '' && ! $isMedia && ! $isLink) {
            continue;
        }

        $candidates[] = [
            'path' => $node->getNodePath(),
            'tag' => $tag,
            'class' => mb_substr($node->getAttribute('class'), 0, 60),
            'text' => mb_substr($own, 0, 70),
            'href' => $isLink ? mb_substr($node->getAttribute('href'), 0, 40) : null,
            'childTags' => implode(',', array_slice(childTags($node), 0, 4)),
        ];
    }

    $picked = [];
    $calls = 0;

    foreach (array_chunk($candidates, $batch, true) as $chunk) {
        $items = [];
        foreach ($chunk as $i => $c) {
            $items[] = array_filter([
                'i' => $i,
                'tag' => $c['tag'],
                'class' => $c['class'] ?: null,
                'text' => $c['text'] ?: null,
                'href' => $c['href'],
                'children' => $c['childTags'] ?: null,
            ], fn ($v) => $v !== null);
        }

        $system = 'You decide which elements of a web page a non-technical site owner should be able to edit '
            .'in place. The items are elements of one page in document order.'."\n\n"
            .'KINDS'."\n"
            .'  "text"  the element that HOLDS the editable words'."\n"
            .'  "image" a picture that could be replaced'."\n"
            .'  "link"  an anchor whose destination could be changed'."\n"
            .'  "icon"  an inline drawing or icon glyph that could be swapped'."\n\n"
            .'COMPLETENESS — these are not judgement calls:'."\n"
            .'  every item with tag "img" is an image. Return it.'."\n"
            .'  every item with tag "svg" is an icon. Return it.'."\n"
            .'  every item with tag "a" that has an href is a link. Return it.'."\n"
            .'  an element may be several kinds at once; return one row per kind.'."\n\n"
            .'CHOOSING THE TEXT ELEMENT'."\n"
            .'  choose the element whose OWN words are shown — the "text" field here is an '
            .'element\'s own words, excluding its children\'s.'."\n"
            .'  never return both a wrapper and something inside it: marking both gives the client '
            .'two boxes for the same sentence.'."\n"
            .'  a heading, a paragraph, a label, a caption, a button\'s words, a list item, a table '
            .'cell, a price, a date, an address, a phone number are all editable text.'."\n"
            .'  skip an item whose text is empty.'."\n\n"
            .'Return EVERY item that qualifies. Omitting one means the client cannot change it at '
            .'all, which is worse than including a doubtful one.'."\n"
            .'Respond as JSON: {"picks":[{"i":0,"kind":"text"}]}';

        $response = Http::withToken(config('live-edit.ai.api_key'))
            ->timeout((int) config('live-edit.ai.timeout', 60))
            ->post(config('live-edit.ai.endpoint'), [
                'model' => config('live-edit.ai.model'),
                'temperature' => 0,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => json_encode(['items' => $items], JSON_UNESCAPED_SLASHES)],
                ],
            ]);

        $calls++;

        if (! $response->successful()) {
            fwrite(STDERR, '  ! batch failed: '.$response->status()."\n");

            continue;
        }

        $parsed = json_decode(data_get($response->json(), 'choices.0.message.content', '{}'), true) ?: [];

        foreach ($parsed['picks'] ?? [] as $pick) {
            $i = $pick['i'] ?? null;
            $kind = $pick['kind'] ?? null;
            if (! isset($candidates[$i]) || ! in_array($kind, ['text', 'image', 'link', 'icon'], true)) {
                continue;
            }
            $picked[$kind][$candidates[$i]['path']] = true;
        }
    }

    $picked['_calls'] = $calls;
    $picked['_candidates'] = count($candidates);

    return $picked;
}

function ownText(DOMElement $node): string
{
    $direct = '';
    foreach ($node->childNodes as $child) {
        if ($child->nodeType === XML_TEXT_NODE) {
            $direct .= $child->nodeValue;
        }
    }

    return trim(preg_replace('/\s+/', ' ', $direct));
}

function childTags(DOMElement $node): array
{
    $tags = [];
    foreach ($node->childNodes as $child) {
        if ($child instanceof DOMElement) {
            $tags[] = strtolower($child->tagName);
        }
    }

    return array_values(array_unique($tags));
}

/* --------------------------------- scoring --------------------------------- */

/*
 * Measured on the page rather than against the key, because the key answers a
 * different question. Tokreams Blue binds a whole card to a record — one
 * marker, several fields in a drawer — while a scanner marks each leaf. Both
 * are right; scoring one against the other mostly counts the difference in
 * granularity. What actually decides which approach to ship is what the client
 * ends up able to do, and what breaks.
 */

/** Every run of visible words on the page, by the element that holds it. */
function visibleRuns(DOMDocument $doc): array
{
    $xpath = new DOMXPath($doc);
    $runs = [];

    foreach ($xpath->query('//body//text()') as $text) {
        $words = trim(preg_replace('/\s+/', ' ', $text->nodeValue));
        if ($words === '' || mb_strlen($words) < 2) {
            continue;
        }
        $parent = $text->parentNode;
        if (! $parent instanceof DOMElement) {
            continue;
        }
        if (in_array(strtolower($parent->tagName), ['script', 'style', 'noscript', 'title'], true)) {
            continue;
        }
        $runs[$text->getNodePath()] = ['chars' => mb_strlen($words), 'path' => $parent->getNodePath()];
    }

    return $runs;
}

/**
 * How much of what a visitor reads the client can change.
 *
 * A marker on a wrapper covers everything inside it, a marker on a leaf covers
 * its own words. Counting characters rather than elements makes the two
 * comparable.
 */
function coverage(DOMDocument $doc, array $marked): array
{
    $runs = visibleRuns($doc);
    $total = 0;
    $covered = 0;

    foreach ($runs as $run) {
        $total += $run['chars'];
        foreach ($marked as $markedPath) {
            // A marker covers a run when it is the run's element or above it.
            if ($run['path'] === $markedPath || str_starts_with($run['path'], $markedPath.'/')) {
                $covered += $run['chars'];
                break;
            }
        }
    }

    return ['covered' => $covered, 'total' => $total];
}

/** Markers that sit inside another marker — two drawers for the same words. */
function overlapping(array $marked): int
{
    $count = 0;
    foreach ($marked as $path) {
        foreach ($marked as $other) {
            if ($path !== $other && str_starts_with($path, $other.'/')) {
                $count++;
                break;
            }
        }
    }

    return $count;
}

/** Markers offering a text box for an element that has no words of its own. */
function emptyMarkers(DOMDocument $doc, array $marked): int
{
    $xpath = new DOMXPath($doc);
    $count = 0;

    foreach ($marked as $path) {
        $node = $xpath->query($path)->item(0);
        if ($node instanceof DOMElement && ownText($node) === '') {
            $count++;
        }
    }

    return $count;
}

function countTags(DOMDocument $doc, string $tag): int
{
    return $doc->getElementsByTagName($tag)->length;
}

/* ---------------------------------- run it --------------------------------- */

$pages = glob(rtrim($dir, '/').'/*.html');
if (isset($options['limit'])) {
    $pages = array_slice($pages, 0, (int) $options['limit']);
}

$totals = [];
$timing = ['A' => 0.0, 'B' => 0.0];
$calls = 0;
$report = [];

foreach ($pages as $page) {
    $name = basename($page, '.html');
    $html = file_get_contents($page);
    $clean = stripMarkers($html);
    $doc = loadDoc($clean);

    $truth = groundTruth($html);
    $handText = array_keys($truth['text'] ?? []);

    $images = countTags($doc, 'img');
    $svgs = countTags($doc, 'svg');

    printf("\n== %s   %d imgs, %d svgs\n", $name, $images, $svgs);

    $rows = ['hand' => ['text' => $handText, 'image' => array_keys($truth['image'] ?? []), 'icon' => array_keys($truth['icon'] ?? [])]];

    foreach (['A', 'B'] as $which) {
        if ($only !== '' && $only !== $which) {
            continue;
        }
        $started = microtime(true);
        $got = $which === 'A' ? approachA($clean) : approachB($clean, (int) ($options['batch'] ?? 50));
        $timing[$which] += microtime(true) - $started;
        if ($which === 'B') {
            $calls += $got['_calls'] ?? 0;
        }
        $rows[$which] = ['text' => array_keys($got['text'] ?? []), 'image' => array_keys($got['image'] ?? []), 'icon' => array_keys($got['icon'] ?? [])];
    }

    foreach ($rows as $which => $row) {
        $cov = coverage($doc, $row['text']);
        $pct = $cov['total'] ? 100 * $cov['covered'] / $cov['total'] : 0;
        $overlap = overlapping($row['text']);
        $empty = emptyMarkers($doc, $row['text']);

        printf("   %-5s text %3d  words reachable %5.1f%%  overlapping %3d  empty %2d   images %d/%d  icons %d/%d\n",
            $which, count($row['text']), $pct, $overlap, $empty, count($row['image']), $images, count($row['icon']), $svgs);

        $totals[$which]['text'] = ($totals[$which]['text'] ?? 0) + count($row['text']);
        $totals[$which]['covered'] = ($totals[$which]['covered'] ?? 0) + $cov['covered'];
        $totals[$which]['chars'] = ($totals[$which]['chars'] ?? 0) + $cov['total'];
        $totals[$which]['overlap'] = ($totals[$which]['overlap'] ?? 0) + $overlap;
        $totals[$which]['empty'] = ($totals[$which]['empty'] ?? 0) + $empty;
        $totals[$which]['image'] = ($totals[$which]['image'] ?? 0) + count($row['image']);
        $totals[$which]['images'] = ($totals[$which]['images'] ?? 0) + $images;
        $totals[$which]['icon'] = ($totals[$which]['icon'] ?? 0) + count($row['icon']);
        $totals[$which]['svgs'] = ($totals[$which]['svgs'] ?? 0) + $svgs;

        $report[$name][$which] = ['text' => count($row['text']), 'coverage' => round($pct, 1), 'overlap' => $overlap, 'empty' => $empty];
    }
}

echo "\n".str_repeat('-', 78)."\n";
foreach ($totals as $which => $t) {
    printf("%-5s  %4d text markers  %5.1f%% of words reachable  %3d overlapping  %2d empty  images %d/%d  icons %d/%d%s\n",
        $which, $t['text'], $t['chars'] ? 100 * $t['covered'] / $t['chars'] : 0,
        $t['overlap'], $t['empty'], $t['image'], $t['images'], $t['icon'], $t['svgs'],
        isset($timing[$which]) && $timing[$which] > 0 ? sprintf('  %.1fs', $timing[$which]) : '');
}
if ($calls > 0) {
    echo "\nB used {$calls} model calls\n";
}

file_put_contents(rtrim($dir, '/').'/report.json', json_encode($report, JSON_PRETTY_PRINT));
