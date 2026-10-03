import { describe, expect, it } from 'vitest';
import { worthSending } from '../../resources/js/autotag.js';

/**
 * Half of every tagging request was not a page.
 *
 * Measured on a live Next install, with the editor running: 329KB goes up on
 * each request and 181KB of it - 55 per cent - is the text inside 57 inline
 * <script> tags and the <style> blocks beside them. The scanner skips script,
 * style and noscript by name, and always has, so every one of those bytes was
 * carried across the wire, parsed into a document, walked past and discarded.
 *
 * The quieter cost is the cache. A framework's inline payload changes between
 * renders, so the fingerprint a page was remembered under changed every time
 * and a cache meant to make the second visit free could never hit once.
 *
 * The tags themselves stay. An element's position is part of its name, so
 * removing a node would move the name of everything after it.
 */
const pageWith = (body) => {
    document.documentElement.innerHTML = body;

    return document;
};

describe('only the page goes up', () => {
    it('empties a script without removing it', () => {
        const sent = worthSending(pageWith('<body><script>window.__DATA__={a:1}</script><h1>Hello</h1></body>'));

        expect(sent).not.toContain('__DATA__');
        expect(sent).toContain('<script></script>');
        expect(sent).toContain('<h1>Hello</h1>');
    });

    it('empties a style and a noscript too', () => {
        const sent = worthSending(pageWith('<body><style>.a{color:red}</style><noscript>Turn it on</noscript><p>Words</p></body>'));

        expect(sent).not.toContain('color:red');
        expect(sent).not.toContain('Turn it on');
        expect(sent).toContain('<p>Words</p>');
    });

    it('leaves the number and order of elements exactly as they were', () => {
        /*
         * The constraint this has to respect. An element is named by where it
         * sits, so dropping a node would rename everything after it and orphan
         * whatever is stored against those names.
         */
        const doc = pageWith('<body><script>x</script><h1>One</h1><style>y</style><h2>Two</h2></body>');
        const before = doc.querySelectorAll('*').length;

        const parsed = new DOMParser().parseFromString(worthSending(doc), 'text/html');

        expect(parsed.querySelectorAll('*').length).toBe(before);
        expect([...parsed.querySelectorAll('body > *')].map((n) => n.tagName))
            .toEqual(['SCRIPT', 'H1', 'STYLE', 'H2']);
    });

    it('keeps an element child inside a noscript, which textContent would have eaten', () => {
        /*
         * The trap, caught by counting elements before and after on a real
         * page. A noscript is parsed as markup wherever scripting is on, and
         * that page kept a custom element inside one - so emptying by
         * textContent removed a node, and removing a node shifts the position
         * of everything after it. Position is how an element is named here, so
         * that would have renamed the back half of the page.
         */
        const doc = pageWith('<body><noscript><span id="keep">x</span>junk</noscript><h1>After</h1></body>');
        const parsed = new DOMParser().parseFromString(worthSending(doc), 'text/html');

        expect(parsed.querySelector('#keep')).not.toBeNull();
        expect(parsed.querySelectorAll('*').length).toBe(doc.querySelectorAll('*').length);
    });

    it('does not touch the live document', () => {
        // It is the page somebody is looking at. Emptying its scripts would
        // stop the site working.
        const doc = pageWith('<body><script>window.keep=1</script><h1>Hi</h1></body>');
        worthSending(doc);

        expect(doc.querySelector('script').textContent).toBe('window.keep=1');
    });

    it('keeps an attribute the scanner reads, on a tag it empties', () => {
        const sent = worthSending(pageWith('<body><style data-keep="yes">.a{color:red}</style></body>'));

        expect(sent).toContain('data-keep="yes"');
    });
});
