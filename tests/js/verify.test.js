import { describe, expect, it } from 'vitest';
import { confirm, expectChange, matches, observed, takeExpected } from '../../resources/js/verify.js';

/*
 * The cases here are the faults that reached a working site, asked as the
 * question this is for: after that save, would the editor have noticed?
 *
 * Each one really happened. The save returned 200, the value really was
 * stored, and the page showed the old version with nothing to say why.
 */

const page = (html) => {
    document.body.innerHTML = html;

    return document;
};

describe('noticing that a change never reached the page', () => {
    it('catches a page still reading with the wrong key', () => {
        // The editor ran a build cached before drafts were readable, so it
        // fetched with the publishable key and was shown the published words.
        const doc = page('<h1 data-edit="setting:auto:a">Published headline</h1>');

        const result = confirm(doc, { attr: 'data-edit', marker: 'setting:auto:a', kind: 'text', value: 'My new headline' });

        expect(result.ok).toBe(false);
        expect(result.saw).toBe('Published headline');
    });

    it('catches a picture stored in the bucket that no page points at', () => {
        // The upload endpoint stored the file, answered with an address, and
        // nobody wrote the address down.
        const doc = page('<img data-edit-img="setting:auto:p" src="/images/old.jpg" alt="">');

        const result = confirm(doc, { attr: 'data-edit-img', marker: 'setting:auto:p', kind: 'image', value: 'https://cdn.example.com/new.jpg' });

        expect(result.ok).toBe(false);
    });

    it('catches an inline drawing that was saved and never applied', () => {
        const doc = page('<span data-edit-icon="setting:auto:i" class="icon fa-twitter"></span>');

        const result = confirm(doc, { attr: 'data-edit-icon', marker: 'setting:auto:i', kind: 'icon', value: 'fa-mastodon' });

        expect(result.ok).toBe(false);
    });

    it('says nothing when the change did arrive', () => {
        const doc = page('<h1 data-edit="setting:auto:a">My new headline</h1>');

        expect(confirm(doc, { attr: 'data-edit', marker: 'setting:auto:a', kind: 'text', value: 'My new headline' }).ok).toBe(true);
    });
});

describe('not crying wolf', () => {
    /*
     * A check that warns about changes which did land is worse than the
     * silence it replaces: the client learns to dismiss it, and then it cannot
     * tell them the one thing it exists to tell them.
     */

    it('accepts an address rewritten on its way to the page', () => {
        // Stored relative, served from a CDN, or given a cache-busting tail.
        expect(matches('image', '/uploads/hero.jpg', 'https://cdn.example.com/uploads/hero.jpg')).toBe(true);
        expect(matches('image', 'https://cdn.example.com/hero.jpg?v=3', '/hero.jpg')).toBe(true);
    });

    it('accepts theme classes kept alongside the icon it was given', () => {
        expect(matches('icon', 'fa-mastodon', 'icon brands alt fa-mastodon')).toBe(true);
    });

    it('accepts words the markup wrapped across lines', () => {
        const doc = page('<h1 data-edit="setting:auto:a">\n    This is\n    a headline\n</h1>');

        expect(confirm(doc, { attr: 'data-edit', marker: 'setting:auto:a', kind: 'text', value: 'This is a headline' }).ok).toBe(true);
    });

    it('reads the words a button wraps, which is what the drawer offered', () => {
        const doc = page('<a data-edit="setting:auto:b" href="/x"><span class="label">Reserve</span></a>');

        expect(confirm(doc, { attr: 'data-edit', marker: 'setting:auto:b', kind: 'text', value: 'Reserve' }).ok).toBe(true);
    });

    it('reads a picture through the panel laid over it', () => {
        // A hand-written host marks the panel, not the picture.
        const doc = page('<div class="tile"><img src="/new.jpg" alt=""><div data-edit-img="gallery:1">Replace image</div></div>');

        expect(confirm(doc, { attr: 'data-edit-img', marker: 'gallery:1', kind: 'image', value: '/new.jpg' }).ok).toBe(true);
    });

    it('stays quiet when the element is no longer on the page', () => {
        // An item deleted, or the client moved to another page before it
        // reloaded. Neither is a failed save.
        const doc = page('<p>nothing here</p>');

        expect(confirm(doc, { attr: 'data-edit', marker: 'setting:auto:a', kind: 'text', value: 'x' })).toBe(null);
    });

    it('stays quiet when there is nothing to check', () => {
        expect(confirm(page(''), null)).toBe(null);
    });
});

describe('carrying the expectation across the reload', () => {
    it('is remembered once and then forgotten', () => {
        const check = { attr: 'data-edit', marker: 'setting:auto:a', kind: 'text', value: 'Hello' };

        expectChange(check);

        expect(takeExpected()).toEqual(check);
        // Used once: a stale expectation would warn about the wrong save.
        expect(takeExpected()).toBe(null);
    });

    it('survives storage being unavailable', () => {
        const broken = { sessionStorage: { setItem() { throw new Error('off'); }, getItem() { throw new Error('off'); }, removeItem() {} } };

        expect(() => expectChange({ kind: 'text' }, broken)).not.toThrow();
        expect(takeExpected(broken)).toBe(null);
    });
});

describe('what the page is showing', () => {
    it('reads a picture, a link and an icon from where each lives', () => {
        const doc = page('<a data-edit-href="auto:h" href="/contact">x</a><img data-edit-img="setting:p" src="/a.jpg"><i data-edit-icon="setting:i" class="fa fa-star"></i>');

        expect(observed(doc.querySelector('[data-edit-href]'), 'href')).toBe('/contact');
        expect(observed(doc.querySelector('[data-edit-img]'), 'image')).toBe('/a.jpg');
        expect(observed(doc.querySelector('[data-edit-icon]'), 'icon')).toBe('fa fa-star');
    });
});
