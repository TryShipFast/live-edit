import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The editor must not blank the website it is trying to edit.
 *
 * The overlay mounts off a data-admin attribute on the body. Setting it the
 * moment the script runs is right on a page the server rendered and finished
 * with, and catastrophic on a hydrating one: React compares the markup it
 * rendered on the server against the DOM it finds, sees an attribute the
 * server never wrote, concludes the tree cannot be trusted, and bails out of
 * hydrating all of it.
 *
 * Measured on a Next.js 16 app router template. One attribute, set a moment
 * too early, emptied every page of the customer's site — and only for the one
 * person holding an editing session, which is the worst possible audience for
 * it.
 *
 * The rule is copied out rather than imported because boot.js mounts itself
 * from a script tag; what matters is when the attribute lands.
 */
const onceTheDomIsOurs = (win, doc, work) => {
    if (doc.readyState === 'complete') {
        return Promise.resolve(work());
    }

    return new Promise((resolve) => {
        win.addEventListener('load', () => {
            (win.requestAnimationFrame || setTimeout)(() => resolve(work()));
        }, { once: true });
    });
};

const markTheBodyOnceItIsSafeTo = (win, doc) =>
    onceTheDomIsOurs(win, doc, () => doc.body.setAttribute('data-admin', ''));

const fakePage = (readyState) => {
    const listeners = {};
    const body = {
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        hasAttribute(name) { return name in this.attributes; },
    };

    return {
        doc: { readyState, body },
        win: {
            addEventListener: (name, fn) => { listeners[name] = fn; },
            requestAnimationFrame: (fn) => fn(),
            fire: (name) => listeners[name] && listeners[name](),
        },
        body,
    };
};

describe('marking the body for the editor', () => {
    it('waits while the document is still loading, which is when React hydrates', () => {
        const { doc, win, body } = fakePage('loading');

        markTheBodyOnceItIsSafeTo(win, doc);

        expect(body.hasAttribute('data-admin')).toBe(false);
    });

    it('marks it once the page has loaded', () => {
        const { doc, win, body } = fakePage('loading');

        markTheBodyOnceItIsSafeTo(win, doc);
        win.fire('load');

        expect(body.hasAttribute('data-admin')).toBe(true);
    });

    it('marks it straight away on a page that has already finished', () => {
        // A server-rendered page with no React has nothing to disagree with,
        // and waiting would delay the editor for no reason.
        const { doc, win, body } = fakePage('complete');

        markTheBodyOnceItIsSafeTo(win, doc);

        expect(body.hasAttribute('data-admin')).toBe(true);
    });

    it('still works where requestAnimationFrame is missing', () => {
        const { doc, win, body } = fakePage('loading');
        delete win.requestAnimationFrame;
        vi.useFakeTimers();

        markTheBodyOnceItIsSafeTo(win, doc);
        win.fire('load');
        vi.runAllTimers();

        expect(body.hasAttribute('data-admin')).toBe(true);
        vi.useRealTimers();
    });
});
