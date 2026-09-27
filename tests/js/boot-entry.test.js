import { describe, expect, it, vi } from 'vitest';

/**
 * The way in, for a site that has nowhere else to put one.
 *
 * WordPress has a plugin that can answer a URL and Laravel has a route, so
 * both can offer a door. A folder of HTML files has neither, and until this
 * there was no way for its owner to start editing at all: the session arrives
 * in a URL fragment, and nothing put a fragment there. They were expected to
 * assemble a sign-in URL by hand, which is not a thing to ask of somebody
 * whose whole site is four files and an FTP client.
 *
 * The rule is copied out rather than imported because boot.js is a classic
 * script that mounts itself from a script tag; what matters is the decision,
 * and that is small enough to state exactly.
 */
const entryRedirect = (win, config) => {
    if (win.location.search.indexOf('kb-enter') === -1) {
        return null;
    }

    const here = new URL(win.location.href);
    here.searchParams.delete('kb-enter');

    const plane = config.api.replace(/\/api\/live-edit\/v\d+\/?$/, '');

    return plane + '/live-edit/sign-in?site=' + encodeURIComponent(config.site)
        + '&return_to=' + encodeURIComponent(here.href);
};

const config = { site: 'video-catalog', api: 'https://live.shipfast.test/api/live-edit/v1' };
const at = (href) => ({ location: { href, search: new URL(href).search } });

describe('the door on a static site', () => {
    it('sends somebody to sign in for this site', () => {
        const to = entryRedirect(at('http://acme.com/?kb-enter=1'), config);

        expect(to).toContain('https://live.shipfast.test/live-edit/sign-in');
        expect(to).toContain('site=video-catalog');
    });

    it('brings them back to the page they were on', () => {
        const to = entryRedirect(at('http://acme.com/about.html?kb-enter=1'), config);

        expect(to).toContain('return_to=' + encodeURIComponent('http://acme.com/about.html'));
    });

    it('drops the parameter from the address it returns to', () => {
        // Otherwise arriving back would send them straight out again, and
        // round it would go.
        const to = entryRedirect(at('http://acme.com/?kb-enter=1'), config);

        expect(decodeURIComponent(to.split('return_to=')[1])).not.toContain('kb-enter');
    });

    it('keeps the rest of the query string, which may be the page itself', () => {
        const to = entryRedirect(at('http://acme.com/shop?category=lamps&kb-enter=1'), config);

        expect(decodeURIComponent(to.split('return_to=')[1])).toContain('category=lamps');
    });

    it('does nothing at all on an ordinary visit', () => {
        expect(entryRedirect(at('http://acme.com/'), config)).toBeNull();
        expect(entryRedirect(at('http://acme.com/?utm_source=x'), config)).toBeNull();
    });
});
