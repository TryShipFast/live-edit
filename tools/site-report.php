<?php

/**
 * What would happen if this site were handed to a client.
 *
 * Point it at a real one — a bought theme, a page builder, whatever somebody
 * actually paid for — and it answers the questions worth answering before a
 * customer does: how much of the page could they change, what would the editor
 * miss, and what would silently go wrong later.
 *
 * The last one is the point. A missed element is visible the moment somebody
 * looks: they try to click a heading and nothing happens, and they tell you.
 * A key that MOVES is not visible at all — their words are saved against a
 * name that no longer matches anything, and the page quietly goes back to the
 * theme's own text weeks later. That is the failure that loses a customer, and
 * it is the one nobody finds by looking at a page.
 *
 *   php tools/site-report.php https://example.com
 *   php tools/site-report.php path/to/page.html
 *   php tools/site-report.php https://example.com --save=report.json
 */

use Illuminate\Contracts\Console\Kernel;
use ShipFast\LiveEdit\Mapper\MarkupScanner;

$appBase = getenv('REPORT_APP') ?: '/Users/temitopeolotin/PhpstormProjects/tokreamsblue';
require $appBase.'/vendor/autoload.php';
$app = require $appBase.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
config()->set('live-edit.auto_keys', true);

$source = $argv[1] ?? null;

if (! $source) {
    fwrite(STDERR, "Usage: php tools/site-report.php <url-or-file> [--save=report.json]\n");
    exit(1);
}

$options = [];
foreach (array_slice($argv, 2) as $arg) {
    if (preg_match('/^--([a-z]+)=?(.*)$/', $arg, $m)) {
        $options[$m[1]] = $m[2];
    }
}

/* ------------------------------- getting it ------------------------------- */

// "-" means the page arrives on stdin, already rendered by a browser. That is
// the honest input for any site whose content is assembled by scripts.
$html = $source === '-'
    ? stream_get_contents(STDIN)
    : (str_starts_with($source, 'http') ? fetch($source) : (is_file($source) ? file_get_contents($source) : null));

if ($html === null || trim($html) === '') {
    fwrite(STDERR, "Could not read {$source}\n");
    exit(1);
}

function fetch(string $url): ?string
{
    $context = stream_context_create(['http' => [
        'timeout' => 20,
        'follow_location' => 1,
        'header' => "User-Agent: live-edit-site-report\r\n",
    ]]);

    return @file_get_contents($url, false, $context) ?: null;
}

function loadDoc(string $html): DOMDocument
{
    $doc = new DOMDocument;
    libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NOWARNING | LIBXML_NOERROR);
    libxml_clear_errors();

    return $doc;
}

function tag(string $html): array
{
    return (new MarkupScanner)->apply($html, ['text', 'image', 'link', 'icon'], true, null, 'report');
}

/** Every marker the scanner wrote, as key => kind. */
function keysIn(string $taggedHtml): array
{
    $xpath = new DOMXPath(loadDoc($taggedHtml));
    $keys = [];

    foreach ([
        'data-edit' => 'text',
        'data-edit-img' => 'image',
        'data-edit-href' => 'link',
        'data-edit-icon' => 'icon',
        'data-edit-svg' => 'icon',
    ] as $attribute => $kind) {
        foreach ($xpath->query('//*[@'.$attribute.']') as $node) {
            // Whether a visitor can see it, decided in the browser before the
            // page was handed over. Content in a cookie dialog is repeated,
            // identical and never looked at, and counting it alongside a
            // headline says nothing about either.
            $unseen = false;
            for ($el = $node; $el instanceof DOMElement; $el = $el->parentNode) {
                if ($el->hasAttribute('data-report-unseen')) {
                    $unseen = true;
                    break;
                }
            }

            $keys[str_replace('setting:', '', $node->getAttribute($attribute))] = ['kind' => $kind, 'seen' => ! $unseen];
        }
    }

    return $keys;
}

/* --------------------------------- reading -------------------------------- */

$tagged = tag($html);
$keys = keysIn($tagged['html']);
$doc = loadDoc($html);
$xpath = new DOMXPath($doc);

/** How much of what a visitor reads could be changed. */
function coverage(string $taggedHtml): array
{
    $doc = loadDoc($taggedHtml);
    $xpath = new DOMXPath($doc);
    $marked = [];

    foreach ($xpath->query('//*[@data-edit]') as $node) {
        $marked[] = $node->getNodePath();
    }

    $unseen = [];
    foreach ($xpath->query('//*[@data-report-unseen]') as $node) {
        $unseen[] = $node->getNodePath();
    }

    $total = 0;
    $covered = 0;

    foreach ($xpath->query('//body//text()') as $text) {
        $words = trim(preg_replace('/\s+/', ' ', $text->nodeValue));
        if ($words === '' || mb_strlen($words) < 2) {
            continue;
        }
        $parent = $text->parentNode;
        if (! $parent instanceof DOMElement || in_array(strtolower($parent->tagName), ['script', 'style', 'noscript', 'title'], true)) {
            continue;
        }

        $path = $parent->getNodePath();

        // Words a visitor never sees are not words a client would edit.
        foreach ($unseen as $u) {
            if ($path === $u || str_starts_with($path, $u.'/')) {
                continue 2;
            }
        }

        $total += mb_strlen($words);

        foreach ($marked as $m) {
            if ($path === $m || str_starts_with($path, $m.'/')) {
                $covered += mb_strlen($words);
                break;
            }
        }
    }

    return ['covered' => $covered, 'total' => $total];
}

/* ------------------------ will the keys stay put? ------------------------- */

/**
 * The quiet failure, measured.
 *
 * Keys are structural — an element is named by where it sits, anchored to the
 * nearest id. That is stable while the markup is, and a page builder is not:
 * a client adds a section, the blocks below it shift, and every key below
 * moves with them. Nothing errors. The words are simply saved against a name
 * that matches nothing, and the page goes back to the theme's own text.
 *
 * So the page is perturbed the way an owner would perturb it, and the keys are
 * compared. What survives is what would survive a client using their builder.
 */
function stability(string $html): array
{
    $before = keysIn(tag($html)['html']);
    $results = [];

    foreach ([
        'a block added at the top' => function (DOMDocument $d) {
            $body = $d->getElementsByTagName('body')->item(0);
            $new = $d->createElement('div');
            $new->setAttribute('class', 'newly-added');
            $new->appendChild($d->createElement('p', 'An announcement bar'));
            $body?->insertBefore($new, $body->firstChild);
        },
        'a section added in the middle' => function (DOMDocument $d) {
            $sections = $d->getElementsByTagName('section');
            $at = $sections->item((int) floor($sections->length / 2));
            if ($at?->parentNode) {
                $new = $d->createElement('section');
                $new->appendChild($d->createElement('h2', 'A new section'));
                $at->parentNode->insertBefore($new, $at);
            }
        },
        'two blocks swapped' => function (DOMDocument $d) {
            $sections = $d->getElementsByTagName('section');
            $a = $sections->item(0);
            $b = $sections->item(1);
            if ($a && $b && $a->parentNode === $b->parentNode) {
                $a->parentNode->insertBefore($b, $a);
            }
        },
        'a wrapper added around the content' => function (DOMDocument $d) {
            $body = $d->getElementsByTagName('body')->item(0);
            if (! $body) {
                return;
            }
            $wrap = $d->createElement('div');
            $wrap->setAttribute('class', 'page-wrapper');
            foreach (iterator_to_array($body->childNodes) as $child) {
                $wrap->appendChild($child);
            }
            $body->appendChild($wrap);
        },
    ] as $label => $perturb) {
        $doc = loadDoc($html);
        $perturb($doc);
        $after = keysIn(tag((string) $doc->saveHTML())['html']);

        $seenBefore = array_filter($before, fn ($v) => $v['seen']);
        $keptSeen = count(array_intersect_key($seenBefore, $after));
        $kept = count(array_intersect_key($before, $after));

        $results[$label] = [
            'kept' => $keptSeen,
            'of' => count($seenBefore),
            'percent' => count($seenBefore) ? round(100 * $keptSeen / count($seenBefore)) : 0,
            'includingUnseen' => count($before) ? round(100 * $kept / count($before)) : 0,
        ];
    }

    return $results;
}

/* --------------------------- what else is in here -------------------------- */

/** Things known to fight with an editor that applies content after load. */
function risks(string $html, DOMXPath $xpath): array
{
    $found = [];

    $builders = [
        'Elementor' => '/elementor/i',
        'WPBakery / Visual Composer' => '/vc_row|js_composer/i',
        'Divi' => '/et_pb_/i',
        'Beaver Builder' => '/fl-builder/i',
        'Bricks' => '/brxe-/i',
        'Oxygen' => '/ct_section|oxy-/i',
        'Gutenberg blocks' => '/wp-block-/i',
    ];

    foreach ($builders as $name => $pattern) {
        if (preg_match($pattern, $html)) {
            $found['builder'][] = $name;
        }
    }

    // Images a theme loads itself, later. Ours is applied on load; whatever
    // the theme does afterwards wins.
    $lazy = [];
    foreach (['data-src', 'data-lazy-src', 'data-original', 'data-srcset', 'data-bg', 'data-background', 'data-background-image', 'data-lazy-bg'] as $attribute) {
        $count = $xpath->query('//*[@'.$attribute.']')->length;
        if ($count > 0) {
            $lazy[$attribute] = $count;
        }
    }
    if ($lazy !== []) {
        $found['lazy'] = $lazy;
    }

    // Content a script writes after the page is ready.
    $scripts = $xpath->query('//script[not(@src)]');
    $writes = 0;
    foreach ($scripts as $script) {
        if (preg_match('/\.(innerHTML|textContent|innerText)\s*=|\.html\(|\.text\(/', $script->textContent)) {
            $writes++;
        }
    }
    if ($writes > 0) {
        $found['writesAfterLoad'] = $writes;
    }

    foreach ([
        'iframe' => '//iframe',
        'canvas' => '//canvas',
        'template' => '//template',
        'svg' => '//svg',
    ] as $what => $query) {
        $n = $xpath->query($query)->length;
        if ($n > 0) {
            $found[$what] = $n;
        }
    }

    return $found;
}

/* --------------------------------- output --------------------------------- */

$cover = coverage($tagged['html']);
$percent = $cover['total'] ? round(100 * $cover['covered'] / $cover['total'], 1) : 0;
$seen = array_filter($keys, fn ($v) => $v['seen']);
$byKind = array_count_values(array_map(fn ($v) => $v['kind'], $seen));
$unseenCount = count($keys) - count($seen);
$images = $doc->getElementsByTagName('img')->length;
$stability = stability($html);
$risks = risks($html, $xpath);

$payload = [
    'source' => $source,
    'reachable' => ['percent' => $percent] + $cover,
    'found' => $byKind,
    'unseen' => $unseenCount,
    'images' => ['marked' => $byKind['image'] ?? 0, 'onPage' => $images],
    'stability' => $stability,
    'risks' => $risks,
];

// Machine-readable, for the browser driver that renders the page first.
if (isset($options['json'])) {
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit(0);
}

printf("\n%s\n%s\n\n", $source, str_repeat('=', min(strlen($source), 72)));

printf("REACHABLE\n");
printf("  %.1f%% of the words on this page could be changed\n", $percent);
printf("  %d text, %d images of %d, %d links, %d icons\n\n",
    $byKind['text'] ?? 0, $byKind['image'] ?? 0, $images, $byKind['link'] ?? 0, $byKind['icon'] ?? 0);

printf("WILL THE CONTENT STAY ATTACHED\n");
printf("  A client's edits are saved against a name derived from where the\n");
printf("  element sits. If the page changes shape, the name changes with it.\n\n");
foreach ($stability as $label => $r) {
    $mark = $r['percent'] >= 95 ? 'ok  ' : ($r['percent'] >= 70 ? 'some' : 'BAD ');
    printf("  [%s] %-34s %3d%% of %d keys survive\n", $mark, $label, $r['percent'], $r['of']);
}

if ($risks !== []) {
    printf("\nWHAT ELSE IS ON THIS PAGE\n");

    if (isset($risks['builder'])) {
        printf("  built with     %s\n", implode(', ', $risks['builder']));
        printf("                 the builder regenerates this markup from its own store,\n");
        printf("                 so an edit made here and an edit made there are two\n");
        printf("                 different answers to the same question\n");
    }
    if (isset($risks['lazy'])) {
        $pairs = [];
        foreach ($risks['lazy'] as $attribute => $n) {
            $pairs[] = "{$attribute} ({$n})";
        }
        printf("  lazy images    %s\n", implode(', ', $pairs));
        printf("                 the theme sets these itself after load; a replaced\n");
        printf("                 picture can be put back by its own script\n");
    }
    if (isset($risks['writesAfterLoad'])) {
        printf("  scripts        %d inline script(s) write into the page after load\n", $risks['writesAfterLoad']);
    }
    foreach (['iframe', 'canvas', 'template', 'svg'] as $what) {
        if (isset($risks[$what])) {
            printf("  %-14s %d\n", $what, $risks[$what]);
        }
    }
}

printf("\n");

if (isset($options['save'])) {
    file_put_contents($options['save'], json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    printf("written to %s\n\n", $options['save']);
}
