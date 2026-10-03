<?php

namespace ShipFast\LiveEdit\Application\Api;

use DOMDocument;
use DOMElement;
use DOMXPath;
use Illuminate\Support\Facades\Cache;
use ShipFast\LiveEdit\Domain\Content\CarryContentAcrossRetag;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\LiveEdit;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Support\WhatChangesEveryRender;

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
     * Whether the last answer came from the cache, for somebody to read.
     *
     * Not decoration, and not for the runtime - nothing in the browser does
     * anything with this. It exists because the guard that makes a broken
     * cache safe also makes a broken cache invisible: a store that throws, a
     * table that was never migrated, or a per-instance driver behind several
     * app servers all look exactly like a cache that is working and simply
     * being asked about a new page every time.
     *
     * That blindness cost this project a day once already, which is why the
     * engine says its own version on the page. The same reasoning applies to
     * anything whose failure mode is "quietly does nothing": if it cannot be
     * asked, it will be believed, and believing it is how an afternoon goes.
     */
    public bool $remembered = false;

    /**
     * How long an answer is kept. Nil turns the cache off entirely.
     */
    private function keptFor(): int
    {
        return (int) config('live-edit.tag_cache_seconds', 86400);
    }

    /**
     * The same page, asked for by the next visitor.
     *
     * This endpoint is the slowest thing on the path to a page's own words -
     * measured against a real site, 1.8s of server time on every uncached
     * view - and it does identical work every time. The answer depends on the
     * markup and nothing else: no session, no visitor, no clock.
     *
     * Not keyed on the markup as sent, which was the first idea and would have
     * missed every single time. A page from any framework carries a few values
     * that change on every render - a CSRF token, a Livewire snapshot - and
     * two consecutive loads of the same page differ by exactly three lines of
     * three hundred thousand. Proved before building on it: the two answers
     * computed from those two loads are byte-identical.
     *
     * So the values that cannot affect an answer are masked before hashing.
     * Only values, never structure or text: an element's position is the
     * indices walked from the root, and blanking the contents of an attribute
     * moves nothing. A signature is built from what the theme put in an
     * element, which is text, and no text is touched here.
     *
     * The engine version is in the key because the scanner is the thing that
     * decides the answer. A release that improves it must not be served last
     * release's tags out of a cache that cannot know the difference.
     */
    private function cacheKey(Site $site, string $html, string $page, bool $mayEditLocked): string
    {
        $stable = WhatChangesEveryRender::masked($html);

        return 'live-edit:tag:'.hash('sha256', implode("\0", [
            LiveEdit::VERSION,
            (string) $site->id,
            $page,
            // Two people asking about the same page get different answers,
            // so they must not be handed each other's. Without this the
            // first developer to open a page would cache the unlocked
            // version and every client after them would be served it.
            $mayEditLocked ? 'all' : 'invited',
            hash('sha256', $stable),
        ]));
    }

    /**
     * @return array{elements: array<int, array<string, mixed>>, count: int}
     */
    /**
     * @param  bool  $mayEditLocked  Whether the person asking may touch what
     *                               the page's author marked data-live-lock.
     *                               Part of the cache key, because two people
     *                               must not be handed each other's answer.
     */
    public function __invoke(Site $site, string $html, string $page = '', bool $mayEditLocked = true): array
    {
        $this->remembered = false;

        $kept = $this->keptFor();
        $key = $kept > 0 ? $this->cacheKey($site, $html, $page, $mayEditLocked) : null;

        if ($key !== null) {
            /*
             * Asking must not be able to fail the request.
             *
             * This runs on a cache the host configured, not one we chose, and
             * the commonest driver in a Laravel application is a database
             * table. Migrations do not run themselves on a deploy - it says so
             * in our own deployment notes - so a table that is not there yet
             * would turn tagging from slow into broken, for every site at
             * once, the moment this released. A cache that cannot answer is a
             * cache miss.
             */
            $held = rescue(fn () => Cache::get($key), null, false);

            if (is_string($held)) {
                /*
                 * Compressed because this is 229KB of positions and attributes
                 * for an ordinary page and 19KB once squeezed - and a cache
                 * that costs more to store than the work costs to repeat is
                 * not a saving, it is a second problem.
                 *
                 * Anything unreadable is treated as a miss rather than an
                 * error: a half-written entry must cost a page its speed, not
                 * its editor.
                 */
                $answer = rescue(fn () => json_decode(gzuncompress($held), true, 512, JSON_THROW_ON_ERROR), null, false);

                if (is_array($answer) && isset($answer['elements'])) {
                    $this->remembered = true;

                    return $answer;
                }
            }
        }

        $tagged = (new MarkupScanner)->asAnInvitedEditor(! $mayEditLocked)
            ->apply($html, ['text', 'image', 'link', 'icon'], true, null, $page)['html'] ?? '';

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

        $answer = ['elements' => $elements, 'count' => count($elements)];

        if ($key !== null) {
            // Failing to store is not failing to answer. A cache that is full,
            // or a driver that refuses a value this size, must cost the next
            // visitor time rather than cost this one their page.
            rescue(fn () => Cache::put($key, gzcompress(json_encode($answer, JSON_THROW_ON_ERROR), 6), $kept), null, false);
        }

        return $answer;
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
