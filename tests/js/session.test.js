import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectFromFragment, contentConfigFor, currentSession, forget, requestLink, store, stored } from '../../resources/js/session.js';

const fakeWindow = (hash = '') => {
    const store = new Map();

    return {
        location: { hash, origin: 'https://acme.test', pathname: '/about', search: '' },
        history: { replaceState: vi.fn() },
        sessionStorage: {
            getItem: (k) => store.get(k) ?? null,
            setItem: (k, v) => store.set(k, v),
            removeItem: (k) => store.delete(k),
        },
    };
};

describe('picking up an edit session', () => {
    it('takes the key out of the fragment', () => {
        const win = fakeWindow('#kb_session=kbe_abc123');

        expect(collectFromFragment(win)).toBe('kbe_abc123');
        expect(stored(win)).toBe('kbe_abc123');
    });

    it('clears it from the address bar at once', () => {
        // A URL gets copied, pasted into chats and shared in screenshots.
        const win = fakeWindow('#kb_session=kbe_abc123');

        collectFromFragment(win);

        expect(win.history.replaceState).toHaveBeenCalledWith(null, '', '/about');
    });

    it('keeps any other fragment the page was using', () => {
        const win = fakeWindow('#services#kb_session=kbe_abc');

        collectFromFragment(win);

        expect(win.history.replaceState).toHaveBeenCalledWith(null, '', '/about#services');
    });

    it('decodes a key that was escaped in the URL', () => {
        const win = fakeWindow('#kb_session=' + encodeURIComponent('kbe_a+b/c=='));

        expect(collectFromFragment(win)).toBe('kbe_a+b/c==');
    });

    it('finds nothing when there is nothing there', () => {
        expect(collectFromFragment(fakeWindow('#services'))).toBeNull();
        expect(collectFromFragment(fakeWindow(''))).toBeNull();
        expect(collectFromFragment(fakeWindow('#kb_session='))).toBeNull();
    });

    it('remembers a key across pages, and forgets it when asked', () => {
        const win = fakeWindow();

        store('kbe_x', win);
        expect(currentSession(win)).toBe('kbe_x');

        forget(win);
        expect(currentSession(win)).toBeNull();
    });

    it('survives storage being unavailable', () => {
        // Private browsing, or storage switched off. Editing should still work
        // for this page rather than throwing.
        const win = fakeWindow('#kb_session=kbe_abc');
        win.sessionStorage = {
            getItem: () => { throw new Error('denied'); },
            setItem: () => { throw new Error('denied'); },
            removeItem: () => { throw new Error('denied'); },
        };

        expect(() => collectFromFragment(win)).not.toThrow();
        expect(stored(win)).toBeNull();
    });

    it('asks for a link back to the page the person is on', async () => {
        globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true }));
        const win = fakeWindow();

        await requestLink({ base: 'https://cms.test/api/v1/', site: 'acme' }, 'amaka@acme.test', win);

        const [url, init] = globalThis.fetch.mock.calls[0];
        expect(url).toBe('https://cms.test/api/v1/sign-in');
        expect(JSON.parse(init.body)).toEqual({
            site: 'acme',
            email: 'amaka@acme.test',
            return_to: 'https://acme.test/about',
        });
    });
});

describe('deciding what a page should ask for', () => {
    const config = {
        api: 'https://cms.test/api/v1',
        site: 'acme',
        key: 'kbp_public',
        snapshot: 'https://cdn.test/sites/acme',
    };

    it('a visitor reads the published files', () => {
        const chosen = contentConfigFor(config, null);

        expect(chosen.snapshot).toBe('https://cdn.test/sites/acme');
        expect(chosen.key).toBe('kbp_public');
    });

    it('an editor reads with their own key, so they see their own drafts', () => {
        // Reading with the publishable key hands the person who just saved the
        // same page every visitor gets — their words replaced by the published
        // ones, with nothing to say why.
        const chosen = contentConfigFor(config, 'kbe_session');

        expect(chosen.key).toBe('kbe_session');
    });

    it('an editor does not read the files', () => {
        // A snapshot holds published content only, and a cached answer would
        // show stale words to the one person who knows they are stale.
        expect(contentConfigFor(config, 'kbe_session').snapshot).toBeNull();
    });

    it('carries the locale either way', () => {
        const withLocale = { ...config, locale: 'fr' };

        expect(contentConfigFor(withLocale, null).locale).toBe('fr');
        expect(contentConfigFor(withLocale, 'kbe_x').locale).toBe('fr');
    });

    it('works for a site with no files published yet', () => {
        const chosen = contentConfigFor({ ...config, snapshot: undefined }, null);

        expect(chosen.snapshot).toBeNull();
        expect(chosen.base).toBe('https://cms.test/api/v1');
    });
})
