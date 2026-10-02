/**
 * The few values a page changes on every render, blanked.
 *
 * The browser half of the rule in src/Support/WhatChangesEveryRender.php, kept
 * beside it because a parity test runs both over the same markup and compares
 * the result. Most faults in this codebase have been two implementations of one
 * thing disagreeing; this is one rule that has to have two, because the browser
 * cannot call PHP and the server cannot wait to be told what it already has.
 *
 * What it buys here: this page already remembers what it was told last time,
 * against a fingerprint of its own markup. That fingerprint was taken of the
 * markup as rendered, which carries a fresh CSRF token and a fresh Livewire
 * snapshot on every single load - so the fingerprint was new every time, the
 * stored answer was never found, and a third of a megabyte went back to the
 * service on every page view to be told exactly what it had been told before.
 *
 * Values only, never structure and never text. Positions in the answer are
 * indices walked from the document root, so emptying an attribute moves
 * nothing, and the signatures are built from the theme's own words, which are
 * untouched. A page whose content really changed still gets a new fingerprint
 * and is tagged again, which is the whole point of having one.
 */

/** Each pattern keeps what it captures and drops the rest. */
const FRESH_EVERY_TIME = [
    // Laravel's token, in the meta tag every page carries it in.
    [/(<meta[^>]+name=["']csrf-token["'][^>]+content=["'])[^"']*/gi, '$1'],
    // The same token, handed to Livewire's script tag.
    [/(\sdata-csrf=["'])[^"']*/gi, '$1'],
    /*
     * Livewire's per-render state: the serialised snapshot, the effects beside
     * it, and the id stamped on the component wrapper. The id is the one that
     * is easy to miss - twenty characters of fresh randomness on every render,
     * and with the other two blanked it was still defeating the key.
     */
    [/(\swire:snapshot=["'])[^"']*/gi, '$1'],
    [/(\swire:effects=["'])[^"']*/gi, '$1'],
    [/(\swire:id=["'])[^"']*/gi, '$1'],
    // The hidden field the token is posted back in.
    [/(name=["']_token["'][^>]+value=["'])[^"']*/gi, '$1'],
    // Nonces, which are a fresh value per response by definition.
    [/(\snonce=["'])[^"']*/gi, '$1'],
    /*
     * Flux's generated ids, in whichever attribute carries one.
     *
     * Livewire's own component library mints these in the browser rather than
     * on the server, which is why they matter most here: the markup a server
     * sent differed in three lines, and the DOM this half fingerprints
     * differed in fifty - every one of them an id and the aria-controls
     * pointing at it.
     *
     * Matched on the prefix rather than the attribute, because one generated
     * id is referred to by several and the next version will use one this does
     * not list.
     */
    [/(=["'])lofi-[0-9a-z-]*/gi, '$1'],
];

export const masked = (html) => FRESH_EVERY_TIME.reduce(
    (said, [pattern, keep]) => said.replace(pattern, keep),
    String(html ?? '')
);
