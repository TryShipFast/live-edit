import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { masked } from '../../resources/js/every-render.js';

/*
 * One rule, two implementations, compared.
 *
 * Whether a page still needs tagging is decided twice: by the service, so the
 * next visitor is not re-tagged, and by the browser, so it does not send a
 * third of a megabyte to be told what it already knows. Neither can use the
 * markup as rendered, because a CSRF token and a Livewire snapshot are fresh
 * every time, so both mask the same handful of values first.
 *
 * If those two ever stop agreeing, nothing breaks loudly. The two caches just
 * quietly stop agreeing about which pages are the same page - the browser
 * keeps an answer the service would not have given it, or sends markup the
 * service already holds. That is the shape of fault this codebase has paid for
 * most often, and running both sides is the only thing that has ever caught it.
 */
const server = (html) => execFileSync('php', ['tools/every-render-mask.php'], {
    input: html,
    encoding: 'utf8',
});

const both = (html) => ({ php: server(html), js: masked(html) });

describe('what changes on every render', () => {
    it('agrees about a Laravel page carrying a token twice', () => {
        const html = `<html><head><meta name="csrf-token" content="4f3a9b"></head>`
            + `<body><h1>Our work</h1><script src="/livewire.js" data-csrf="4f3a9b"></script></body></html>`;

        const { php, js } = both(html);

        expect(js).toBe(php);
        expect(js).not.toContain('4f3a9b');
    });

    it('agrees about Livewire per-render state, including the id', () => {
        /*
         * The id is the one that nearly got away: twenty characters of fresh
         * randomness on every render, and with the snapshot and the token
         * already blanked it was still the thing defeating the key.
         */
        const html = `<div wire:snapshot="{&quot;checksum&quot;:&quot;abc&quot;}" wire:effects="[]" wire:id="9Zg9zBp1IxGz1GodYSHk">`
            + `<p>Words</p></div>`;

        const { php, js } = both(html);

        expect(js).toBe(php);
        expect(js).not.toContain('9Zg9zBp1IxGz1GodYSHk');
    });

    it('agrees about a posted token field and a nonce', () => {
        const html = `<form><input type="hidden" name="_token" value="zzz111"></form>`
            + `<script nonce="r4nd0m">console.log(1)</script>`;

        const { php, js } = both(html);

        expect(js).toBe(php);
        expect(js).not.toContain('zzz111');
        expect(js).not.toContain('r4nd0m');
    });

    it('agrees that two renders of one page come out the same', () => {
        // The property the whole thing exists for, stated directly.
        const page = (token) => `<html><head><meta name="csrf-token" content="${token}"></head>`
            + `<body><div wire:id="${token}" wire:snapshot="{&quot;t&quot;:&quot;${token}&quot;}">`
            + `<h1>Our work</h1><img src="/hero.jpg" alt="A hero"></div></body></html>`;

        expect(masked(page('AAAA1111'))).toBe(masked(page('BBBB2222')));
        expect(server(page('AAAA1111'))).toBe(server(page('BBBB2222')));
    });

    it('agrees that changed words are a changed page', () => {
        /*
         * The guard against a mask so broad it says every page is the same
         * page. Both sides must still notice content, or a client edits a
         * heading and is served yesterday's tags for it.
         */
        const page = (heading) => `<html><body><h1>${heading}</h1></body></html>`;

        expect(masked(page('Our work'))).not.toBe(masked(page('What we do')));
        expect(server(page('Our work'))).not.toBe(server(page('What we do')));
    });

    it('agrees about a framework hiding something after the page loaded', () => {
        /*
         * Alpine writes exactly this onto an x-show element as it starts, so
         * whether it is present depends on a race with the host page's own
         * JavaScript. Two views of one real page produced two keys depending
         * on which won - a cache that works most of the time.
         */
        const html = '<div x-show="showTrialModal" style="display: none;"><p>Trial</p></div>';

        const { php, js } = both(html);

        expect(js).toBe(php);
        expect(js).toBe('<div x-show="showTrialModal" style=""><p>Trial</p></div>');
    });

    it('agrees that a real inline style is left alone', () => {
        // The guard on the line above: only a style that is nothing but a
        // hide. Anything authored stays, because it is part of the page.
        const html = '<div style="display: none; color: red"><p>Words</p></div>';

        const { php, js } = both(html);

        expect(js).toBe(php);
        expect(js).toBe(html);
    });

    it('agrees about markup that has none of it', () => {
        // The ordinary static page this product exists for: a folder of HTML
        // with no framework in it at all. Nothing to mask, nothing changed.
        const html = '<html><body><h1>Hello</h1><p>Some words.</p></body></html>';

        const { php, js } = both(html);

        expect(js).toBe(php);
        expect(js).toBe(html);
    });

    it('agrees about nothing at all', () => {
        expect(masked('')).toBe(server(''));
    });
});
