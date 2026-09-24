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
