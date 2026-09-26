import { describe, expect, it } from 'vitest';
import { apiRequestFor } from '../../resources/js/support.js';

const api = { base: 'https://cms.test/api/live-edit/v1/', site: 'acme', token: 'kbe_x' };

describe('apiRequestFor', () => {
    it('points a setting save at the content endpoint', () => {
        const { url, init } = apiRequestFor('/live-edit/setting', { method: 'POST' }, api);

        expect(url).toBe('https://cms.test/api/live-edit/v1/acme/content');
        expect(init.headers.Authorization).toBe('Bearer kbe_x');
        expect(init.method).toBe('POST');
    });

    it('cannot have its key dropped by the caller', () => {
        const { init } = apiRequestFor('/live-edit/setting', { headers: { Authorization: 'Bearer nothing' } }, api);

        expect(init.headers.Authorization).toBe('Bearer kbe_x');
    });

    it('points an image upload at the media endpoint', () => {
        const { url } = apiRequestFor('/live-edit/image', { method: 'POST', body: new FormData() }, api);

        expect(url).toBe('https://cms.test/api/live-edit/v1/acme/media');
    });

    it('does not set a content type for an upload', () => {
        // FormData carries a boundary the browser generates. Setting the
        // header by hand strips it, the server reads an empty body, and the
        // picture silently never arrives.
        const { init } = apiRequestFor('/live-edit/image', { method: 'POST', body: new FormData() }, api);

        expect(init.headers['Content-Type']).toBeUndefined();
    });

    it('says plainly when an action has no API endpoint yet', () => {
        // Better than posting to a URL that does not exist and calling it saved.
        expect(() => apiRequestFor('/live-edit/record', {}, api)).toThrow(/not available over the content API/);
        expect(() => apiRequestFor('/live-edit/undo', {}, api)).toThrow(/not available over the content API/);
    });

    it('refuses to run half configured', () => {
        expect(() => apiRequestFor('/live-edit/setting', {}, { base: '', site: 'a', token: 't' })).toThrow(/not configured/);
        expect(() => apiRequestFor('/live-edit/setting', {}, { base: 'https://x', site: 'a' })).toThrow(/not configured/);
    });
});

describe('publishing through a host that has its own idea of who may publish', () => {
    const wp = { ...api, publishUrl: 'https://site.test/wp-json/kastsbuild/v1/publish', publishHeaders: { 'X-WP-Nonce': 'abc123' } };

    it('posts to the host route rather than the content API', () => {
        // The content API asks for a secret key to publish, and a browser must
        // never hold one. WordPress knows who its own users are, so it decides
        // and publishes from its server.
        const { url, init } = apiRequestFor('/live-edit/publish', { method: 'POST' }, wp);

        expect(url).toBe('https://site.test/wp-json/kastsbuild/v1/publish');
        expect(init.headers['X-WP-Nonce']).toBe('abc123');
        expect(init.credentials).toBe('same-origin');
    });

    it('does not send the content API key to the host', () => {
        // It is a different service and has no use for it.
        const { init } = apiRequestFor('/live-edit/publish', { method: 'POST' }, wp);

        expect(init.headers.Authorization).toBeUndefined();
    });

    it('still uses the content API when no host route is given', () => {
        const { url, init } = apiRequestFor('/live-edit/publish', { method: 'POST' }, api);

        expect(url).toBe('https://cms.test/api/live-edit/v1/acme/publish');
        expect(init.headers.Authorization).toBe('Bearer kbe_x');
    });
});

describe('a search, which carries its terms in the address', () => {
    const api = { base: 'https://cms.test/api/live-edit/v1', site: 'acme', token: 'k' };

    it('finds the route by its path and keeps the query', () => {
        // Matching the whole string meant every search missed the map and was
        // reported as an endpoint the API does not have — which is how the
        // photo picker came to say "could not look for photographs" on a
        // perfectly working service.
        const { url } = apiRequestFor('/live-edit/photos?q=clinic%20waiting', {}, api);

        expect(url).toBe('https://cms.test/api/live-edit/v1/acme/photos?q=clinic%20waiting');
    });

    it('maps the endpoints the picker needs', () => {
        expect(apiRequestFor('/live-edit/imagine', {}, api).url).toBe('https://cms.test/api/live-edit/v1/acme/imagine');
        expect(apiRequestFor('/live-edit/photos/used', {}, api).url).toBe('https://cms.test/api/live-edit/v1/acme/photos/used');
    });

    it('still refuses an endpoint that does not exist', () => {
        expect(() => apiRequestFor('/live-edit/nonsense?q=1', {}, api)).toThrow(/not available/);
    });
});
