import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forget, store, currentSession } from '../../resources/js/session.js';

/**
 * A 401 must not reload a page that was never signed in.
 *
 * The chain that made this matter, found on the product's own website: a
 * person the host treats as an editor is served the editor; the editor calls
 * a route the host answers with 401; the 401 handler decides the editing key
 * is dead and ends the session; ending a session reloads the page so it stops
 * showing chrome that no longer works - and the reload arrives at exactly the
 * same 401.
 *
 * Every step is reasonable and the loop is total: the page reloads for ever,
 * hundreds of requests a minute, and nothing on screen stays long enough to
 * read. It kept the product's own site unusable for anybody signed in.
 *
 * The missing question is whether there was a session at all. Reloading
 * cannot fix "you were never signed in" - it can only ask again.
 */
const aWindow = () => {
    const storage = new Map();

    return {
        sessionStorage: {
            getItem: (k) => (storage.has(k) ? storage.get(k) : null),
            setItem: (k, v) => storage.set(k, v),
            removeItem: (k) => storage.delete(k),
        },
        location: { hash: '', pathname: '/', search: '', reload: vi.fn() },
        history: { replaceState: vi.fn() },
    };
};

describe('a session that never existed', () => {
    let win;

    beforeEach(() => {
        win = aWindow();
    });

    it('is not there to be found', () => {
        // The question the guard asks. If this answered anything other than
        // nothing, the guard would let the loop through.
        expect(currentSession(win)).toBeNull();
    });

    it('survives being forgotten, without complaint', () => {
        // Called on every 401, including the ones from a page that never had
        // a session, so it has to be safe to call against nothing.
        expect(() => forget(win)).not.toThrow();
        expect(currentSession(win)).toBeNull();
    });
});

describe('a session that does exist', () => {
    it('is found, and is gone once forgotten', () => {
        /*
         * The other half, and the reason the guard is a question rather than
         * simply never reloading: a real editing session going dead does
         * deserve a reload, because the page is still showing editing chrome
         * that will fail on every save.
         */
        const win = aWindow();

        store('a-real-token', win);

        expect(currentSession(win)).toBe('a-real-token');

        forget(win);

        expect(currentSession(win)).toBeNull();
    });
});
