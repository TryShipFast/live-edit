<?php

namespace ShipFast\LiveEdit\Support;

/**
 * The few values a page changes on every render, blanked.
 *
 * Here so that two things can agree about it. Tagging a page is expensive, the
 * answer depends on the markup and nothing else, and both ends want to skip
 * the work when the markup has not meaningfully changed - the server so the
 * next visitor is not re-tagged, the browser so it does not send a third of a
 * megabyte to be told what it already knows.
 *
 * Neither can use the markup as sent. A page from any framework carries values
 * that are fresh on every render: two consecutive loads of a real site differed
 * by three lines out of three hundred thousand - a CSRF token, twice, and
 * Livewire's snapshot - and the tagging answers computed from those two loads
 * were byte-identical. Keyed on the raw markup, every cache on both sides
 * misses every time, which is exactly what was happening.
 *
 * Values only, never structure and never text. An element's position in the
 * answer is the indices walked from the document root, so blanking what is
 * inside an attribute moves nothing; a signature is built from the words the
 * theme put in an element, and no words are touched here. That is what makes
 * this safe rather than clever.
 *
 * Mirrored in resources/js/every-render.js, and a parity test runs both over
 * the same markup. Most faults in this codebase have been two implementations
 * of one thing disagreeing, and this is one rule with two implementations by
 * necessity - the browser cannot call PHP, and the server cannot wait for the
 * browser to tell it what it already has.
 */
final class WhatChangesEveryRender
{
    /**
     * Each pattern keeps what it captures and drops the rest, so an attribute
     * survives as itself with nothing in it.
     *
     * @var array<int, string>
     */
    private const FRESH_EVERY_TIME = [
        // Laravel's token, in the meta tag every page carries it in.
        '/(<meta[^>]+name=["\']csrf-token["\'][^>]+content=["\'])[^"\']*/i',
        // The same token, handed to Livewire's script tag.
        '/(\sdata-csrf=["\'])[^"\']*/i',
        /*
         * Livewire's per-render state: the serialised snapshot, the effects
         * beside it, and the id stamped on the component wrapper. The id is
         * the one that is easy to miss - twenty characters of fresh randomness
         * on every render, and with the other two blanked it was still the
         * thing defeating the key.
         */
        '/(\swire:snapshot=["\'])[^"\']*/i',
        '/(\swire:effects=["\'])[^"\']*/i',
        '/(\swire:id=["\'])[^"\']*/i',
        // The hidden field the token is posted back in.
        '/(name=["\']_token["\'][^>]+value=["\'])[^"\']*/i',
        // Nonces, which are a fresh value per response by definition.
        '/(\snonce=["\'])[^"\']*/i',
        /*
         * Flux's generated ids, in whichever attribute carries one.
         *
         * Livewire's own component library mints these in the browser rather
         * than on the server, so they are absent from the markup a server
         * sends and present - differently - in the DOM a browser holds. Found
         * exactly that way: the raw page differed in three lines, and the
         * page the browser had differed in fifty, all of them an id and the
         * aria-controls pointing at it.
         *
         * Matched on the prefix rather than on the attribute, because one
         * generated id is referred to by several attributes and the next
         * version will use one this does not list. Narrow enough to be safe:
         * nothing that is not Flux's own naming is touched.
         */
        '/(=["\'])lofi-[0-9a-z-]*/i',
    ];

    public static function masked(string $html): string
    {
        return preg_replace(self::FRESH_EVERY_TIME, '$1', $html) ?? $html;
    }
}
