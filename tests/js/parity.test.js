import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { applyContent, applyStyles } from '../../resources/js/content.js';

/*
 * The same content, applied both ways, compared.
 *
 * Every piece of content has two implementations: PHP applies it before a page
 * is sent, JavaScript applies it in a page nobody server-renders. Six separate
 * faults have now been one of those two quietly doing nothing — the editor
 * unable to see their own drafts, then published words, then styles, then
 * pictures, then icons and backgrounds, then list order. Each was invisible to
 * tests that exercised one side, and each was found by somebody using the
 * thing.
 *
 * So these cases run both and compare what a visitor would actually see. They
 * do not compare markup byte for byte — two parsers will never agree on
 * whitespace — they compare the outcome that matters for each kind.
 */

const server = (html, overrides = {}, styles = {}) => {
    const out = execFileSync('php', ['tools/server-apply.php'], {
        input: JSON.stringify({ html, overrides, styles }),
        encoding: 'utf8',
    });

    return JSON.parse(out);
};

/** The browser half: apply into a document and hand it back. */
const browser = (html, overrides = {}, styles = {}) => {
    document.body.innerHTML = html;
    applyContent(document, overrides);
    applyStyles(document, styles);

    return document;
};

/** Read the same fact out of the server's HTML. */
const asDocument = (html) => {
    const parsed = new DOMParser().parseFromString(html, 'text/html');

    return parsed;
};

const both = (html, overrides, styles, read) => {
    const serverResult = server(html, overrides, styles);

    return {
        server: read(asDocument(serverResult.html), serverResult.css ?? ''),
        browser: read(browser(html, overrides, styles), document.getElementById('live-edit-styles')?.textContent ?? ''),
    };
};

const normaliseCss = (css) => css.replace(/\s+/g, '').replace(/;}/g, '}');

describe('what a visitor sees, applied by the server and by the browser', () => {
    it('agrees on words', () => {
        const { server: s, browser: b } = both(
            '<h1 data-edit="setting:auto:a">Before</h1>',
            { 'auto:a': 'After' }, {},
            (doc) => doc.querySelector('h1').textContent,
        );

        expect(b).toBe(s);
        expect(b).toBe('After');
    });

    it('agrees on a picture', () => {
        const { server: s, browser: b } = both(
            '<img data-edit-img="setting:auto:p" src="/old.jpg" alt="">',
            { 'auto:p': '/new.jpg' }, {},
            (doc) => doc.querySelector('img').getAttribute('src'),
        );

        expect(b).toBe(s);
        expect(b).toBe('/new.jpg');
    });

    it('keeps a picture that lives inside the words being replaced', () => {
        // A paragraph with a picture floated inside it. Replacing the whole
        // contents took the picture with it, and the client had no way back:
        // the markup that held it was gone from the page.
        const { server: s, browser: b } = both(
            '<p data-edit="setting:auto:t">Some words <span class="image"><img src="/pic.jpg" alt=""></span> and more.</p>',
            { 'auto:t': 'New sentence.' }, {},
            (doc) => {
                const p = doc.querySelector('p');
                return `${p.querySelectorAll('img').length}|${p.textContent.trim()}`;
            },
        );

        expect(b).toBe(s);
        expect(b).toBe('1|New sentence.');
    });

    it('agrees on a button whose words live in a span', () => {
        // The panel shows the words it wraps, so that is what the client
        // edits. Appending rendered "BookReserve"; replacing the contents
        // threw away the span carrying the icon and the classes.
        const { server: s, browser: b } = both(
            '<a data-edit="setting:auto:t" href="/book"><span class="label">Book</span></a>',
            { 'auto:t': 'Reserve' }, {},
            (doc) => {
                const a = doc.querySelector('a');
                return `${a.querySelector('span.label')?.textContent}|${a.textContent.trim()}`;
            },
        );

        expect(b).toBe(s);
        expect(b).toBe('Reserve|Reserve');
    });

    it('agrees on words that sit beside a link', () => {
        const { server: s, browser: b } = both(
            '<p data-edit="setting:auto:t">Designed by <a href="/x">HTML5 UP</a></p>',
            { 'auto:t': 'Written by' }, {},
            (doc) => doc.querySelector('p').textContent,
        );

        expect(b).toBe(s);
        expect(b).toBe('Written by HTML5 UP');
    });

    it('agrees on how a picture is described', () => {
        // The browser applies the description on a live page; the server
        // applies it when a customer exports their files. One rule written
        // twice is how an exported page loses the alt text the live one has.
        const { server: s, browser: b } = both(
            '<img data-edit-img="setting:auto:p" src="/old.jpg" alt="Old" title="Old">',
            { 'auto:p': '/new.jpg', 'auto:pAlt': 'A beach at dawn', 'auto:pTitle': '' }, {},
            (doc) => {
                const img = doc.querySelector('img');
                return `${img.getAttribute('alt')}|${img.hasAttribute('title')}`;
            },
        );

        expect(b).toBe(s);
        expect(b).toBe('A beach at dawn|false');
    });

    it('agrees on where a link goes', () => {
        const { server: s, browser: b } = both(
            '<a data-edit="setting:auto:t" data-edit-href="auto:h" href="/old">Book</a>',
            { 'auto:t': 'Book now', 'auto:h': '/new' }, {},
            (doc) => doc.querySelector('a').getAttribute('href') + '|' + doc.querySelector('a').textContent,
        );

        expect(b).toBe(s);
    });

    it('agrees on an icon, including the theme own classes', () => {
        const { server: s, browser: b } = both(
            '<span class="icon brands fa-twitter" data-edit-icon="setting:auto:i" data-edit-icon-current="fa-twitter"></span>',
            { 'auto:i': 'fa-mastodon' }, {},
            (doc) => doc.querySelector('span').getAttribute('class'),
        );

        expect(b).toBe(s);
        expect(b).toContain('icon brands');
    });

    it('agrees on a background', () => {
        const { server: s, browser: b } = both(
            '<section data-edit-bg="setting:auto:b" data-background="/old.jpg" style="color:red"></section>',
            { 'auto:b': '/new.jpg' }, {},
            (doc) => {
                const el = doc.querySelector('section');
                return [
                    el.getAttribute('data-background'),
                    /background-image:url\(['"]?([^'")]+)/.exec(el.getAttribute('style') ?? '')?.[1],
                ].join('|');
            },
        );

        expect(b).toBe(s);
        expect(b).toBe('/new.jpg|/new.jpg');
    });

    it('agrees on the order of a list', () => {
        const { server: s, browser: b } = both(
            '<ul data-edit-list="auto:l">'
            + '<li data-edit-item="i0">One</li><li data-edit-item="i1">Two</li><li data-edit-item="i2">Three</li>'
            + '</ul>',
            { 'auto:l': JSON.stringify(['i2', 'i0', 'i1']) }, {},
            (doc) => [...doc.querySelector('ul').children].map((c) => c.textContent).join(','),
        );

        expect(b).toBe(s);
        expect(b).toBe('Three,One,Two');
    });

    it('agrees on an item added in the editor', () => {
        const { server: s, browser: b } = both(
            '<ul data-edit-list="auto:l"><li data-edit-item="i0">One</li><li data-edit-item="i1">Two</li></ul>',
            { 'auto:l': JSON.stringify(['i0', 'i1', 'i2']) }, {},
            (doc) => [...doc.querySelector('ul').children].map((c) => c.getAttribute('data-edit-item')).join(','),
        );

        expect(b).toBe(s);
        expect(b).toBe('i0,i1,i2');
    });

    it('agrees on the stylesheet', () => {
        const { server: s, browser: b } = both(
            '<a data-style="sbtn">Book</a>',
            {},
            { sbtn: { background: '#4ade80', textColor: '#062', radius: '6' } },
            (_doc, css) => normaliseCss(css),
        );

        expect(b).toBe(s);
        expect(b).toContain('background:#4ade80!important');
    });

    it('agrees on hiding something from visitors', () => {
        const { server: s, browser: b } = both(
            '<section data-style="shide">Seasonal</section>',
            {}, { shide: { hidden: '1' } },
            (_doc, css) => normaliseCss(css),
        );

        expect(b).toBe(s);
        expect(b).toContain('display:none!important');
    });

    it('agrees that an absent value changes nothing', () => {
        const { server: s, browser: b } = both(
            '<h1 data-edit="setting:auto:a">Left alone</h1>',
            {}, {},
            (doc) => doc.querySelector('h1').textContent,
        );

        expect(b).toBe(s);
        expect(b).toBe('Left alone');
    });

    it('agrees that a cleared value is an edit', () => {
        // Somebody deleted the heading. Springing back to the template's words
        // on one path and not the other is exactly the kind of divergence
        // these cases exist to catch.
        const { server: s, browser: b } = both(
            '<h1 data-edit="setting:auto:a">Template words</h1>',
            { 'auto:a': '' }, {},
            (doc) => doc.querySelector('h1').textContent,
        );

        expect(b).toBe(s);
    });

    it('writes an edit back into a sentence that has an element inside it, the same way', () => {
        // The fault this closes was in both halves at once: each wrote the
        // whole sentence into the first run of text and deleted the rest, so
        // the words after a bold phrase were destroyed and the phrase ended up
        // trailing the sentence. Fixing one and not the other would mean the
        // same edit reading differently live and in an export.
        const html = '<p data-edit="setting:hero">We design for the <strong>street it stands on</strong>, not a photograph.</p>';
        const edit = { hero: 'We build for the , not a photograph.' };

        const fromServer = asDocument(server(html, edit).html).querySelector('p');
        const fromBrowser = browser(html, edit).querySelector('p');

        expect(fromBrowser.querySelector('strong')).not.toBeNull();
        expect(fromServer.querySelector('strong')).not.toBeNull();
        expect(fromBrowser.textContent.trim()).toBe(fromServer.textContent.trim());
        expect(fromBrowser.textContent).toContain('not a photograph.');
    });

    it('keeps a leading icon in front of the words in both halves', () => {
        const html = '<a data-edit="setting:cta"><svg width="8"></svg> Book a call</a>';
        const edit = { cta: 'Book a visit' };

        const fromServer = asDocument(server(html, edit).html).querySelector('a');
        const fromBrowser = browser(html, edit).querySelector('a');

        expect(fromBrowser.firstElementChild.tagName.toLowerCase()).toBe('svg');
        expect(fromServer.firstElementChild.tagName.toLowerCase()).toBe('svg');
        expect(fromBrowser.textContent).toBe(fromServer.textContent);
    });
});
