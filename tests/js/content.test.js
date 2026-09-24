import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyContent, applyValue, fetchContent } from '../../resources/js/content.js';

const page = (html) => {
    document.body.innerHTML = html;
    return document;
};

describe('putting published content into a static page', () => {
    it('replaces the words in a tagged element', () => {
        const root = page('<h1 data-edit="setting:auto:abc">Original</h1>');

        expect(applyContent(root, { 'auto:abc': 'Published' })).toBe(1);
        expect(root.querySelector('h1').textContent).toBe('Published');
    });

    it('leaves untagged elements alone', () => {
        const root = page('<h1 data-edit="setting:auto:abc">A</h1><p>Untouched</p>');

        applyContent(root, { 'auto:abc': 'B' });

        expect(root.querySelector('p').textContent).toBe('Untouched');
    });

    it('keeps the words in the file when the service has no value for a key', () => {
        const root = page('<h1 data-edit="setting:auto:abc">In the file</h1>');

        expect(applyContent(root, {})).toBe(0);
        expect(root.querySelector('h1').textContent).toBe('In the file');
    });

    it('treats a cleared value as an edit rather than as missing', () => {
        // Somebody deleted the heading. Springing back to the file's words
        // would look like the editor refusing to do as it was told.
        const root = page('<h1 data-edit="setting:auto:abc">In the file</h1>');

        applyContent(root, { 'auto:abc': '' });

        expect(root.querySelector('h1').textContent).toBe('');
    });

    it('sets a source on an image rather than its text', () => {
        const root = page('<img data-edit="setting:auto:img" src="/old.jpg" alt="">');

        applyContent(root, { 'auto:img': '/new.jpg' });

        expect(root.querySelector('img').getAttribute('src')).toBe('/new.jpg');
    });

    it('sets a link target from its own key', () => {
        const root = page('<a data-edit="setting:auto:t" data-edit-href="auto:h" href="/old">Book</a>');

        applyContent(root, { 'auto:t': 'Book now', 'auto:h': '/new' });

        expect(root.querySelector('a').textContent).toBe('Book now');
        expect(root.querySelector('a').getAttribute('href')).toBe('/new');
    });

    it('never writes markup from the network into the page', () => {
        // A content service that can put HTML into a page is a way to run
        // scripts in every visitor's browser.
        const root = page('<h1 data-edit="setting:auto:abc">Safe</h1>');

        applyValue(root.querySelector('h1'), '<img src=x onerror=alert(1)>');

        expect(root.querySelector('h1').querySelector('img')).toBeNull();
        expect(root.querySelector('h1').textContent).toContain('<img');
    });

    it('asks the content endpoint with the publishable key', async () => {
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true, status: 200, json: () => Promise.resolve({ settings: {} }),
        }));

        await fetchContent({ base: 'https://cms.test/api/v1/', site: 'acme', key: 'kbp_x' });

        const [url, init] = globalThis.fetch.mock.calls[0];
        expect(url).toBe('https://cms.test/api/v1/acme/content');
        expect(init.headers.Authorization).toBe('Bearer kbp_x');
    });

    it('says so rather than silently succeeding when the service refuses', async () => {
        globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({}) }));

        await expect(fetchContent({ base: 'https://cms.test', site: 'a', key: 'k' })).rejects.toThrow('503');
    });
});
