import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOT_A_VIDEO, aFrameWeAllow, addressOfDirections, directionsFor, mapSrc, playerFor, videoOf } from '../../resources/js/embed-links.js';
import * as reactCopy from '../../packages/react/src/embed-links.js';
import { embedOf, mapsOf, ownedByAnEmbed, refusalFor, renderMapPanel, renderVideoPanel, saveMap, saveVideo, videosOf } from '../../resources/js/embeds.js';
import { drawMap, play, start } from '../../resources/js/kit-embeds.js';
import { kindSays, nounFor, renderSectionBrowser } from '../../resources/js/pages.js';
import { pageForTheChat } from '../../resources/js/chat-page.js';

/*
 * A video from YouTube or Vimeo, and a map to an address (owner's brief, 15 Nov 2026: "Copy how Wix and Squarespace
 * video blocks work"; "Copy how Wix and Squarespace map blocks work"): the link pasted, read one way everywhere; the
 * cover and title until play is pressed, nothing from YouTube or Vimeo before; the map from the address, lazily; the
 * panels; the add window; and what Ask AI is told.
 */

const video = (link = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title = 'Our story', caption = '') => `
<section data-edit-item="s-add-v1">
  <figure class="kit-video__figure" data-kit-video>
    <a class="kit-video__frame" href="${link}" data-kit-video-link data-edit-href="added:home/add-v1:link">
      <img class="kit-video__cover" src="/media/cover.jpg" alt="" data-kit-video-cover data-edit-img="setting:added:home/add-v1:cover">
      <span class="kit-video__sr">Play: </span><span class="kit-video__title" data-kit-video-title data-edit="setting:added:home/add-v1:title">${title}</span>
    </a>
    <figcaption class="kit-video__caption" data-kit-video-caption data-edit="setting:added:home/add-v1:caption">${caption}</figcaption>
  </figure>
</section>`;

const map = (address = '12 Allen Avenue, Ikeja') => `
<section data-edit-item="s-add-m1">
  <div class="kit-map__figure" data-kit-map>
    <div class="kit-map__frame" data-kit-map-frame></div>
    <div class="kit-map__bar">
      <p class="kit-map__address" data-kit-map-address data-edit="setting:added:home/add-m1:address">${address}</p>
      <a class="kit-map__directions" href="${directionsFor(address)}" data-kit-map-directions data-edit-href="added:home/add-m1:go" data-edit="setting:added:home/add-m1:go.text">Get directions</a>
    </div>
  </div>
</section>`;

describe('a video link, read one way everywhere', () => {
    it('takes the YouTube and Vimeo links people paste, and saves each as the video’s own page', () => {
        for (const link of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'https://youtu.be/dQw4w9WgXcQ?si=abc', 'youtu.be/dQw4w9WgXcQ',
            'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ']) {
            expect(videoOf(link)).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ', hash: null, link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
        }
        expect(videoOf('https://vimeo.com/76979871')?.link).toBe('https://vimeo.com/76979871');
        expect(videoOf('https://vimeo.com/channels/staffpicks/76979871')?.id).toBe('76979871');
        expect(videoOf('https://vimeo.com/76979871/abcdef1234')).toMatchObject({ id: '76979871', hash: 'abcdef1234' });
        expect(videoOf('https://player.vimeo.com/video/76979871?h=abcdef1234')).toMatchObject({ id: '76979871', hash: 'abcdef1234' });
    });

    it('refuses anything else, with one sentence', () => {
        for (const link of ['', 'hello', 'https://example.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=short', 'https://www.youtube.com/@channel',
            'javascript:alert(1)', 'https://vimeo.com/about', 'https://www.tiktok.com/@a/video/1', 'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ']) {
            expect(videoOf(link)).toBeNull();
        }
        expect(NOT_A_VIDEO).toBe('Paste a link to a YouTube or Vimeo video.');
        expect(refusalFor('video', 'https://example.com')).toBe(NOT_A_VIDEO);
        expect(refusalFor('video', 'https://youtu.be/dQw4w9WgXcQ')).toBeNull();
        expect(refusalFor('map', '   ')).toBe('Type the address or the name of the place.');
    });

    it('plays in the privacy-enhanced YouTube player or Vimeo with Do Not Track, and frames nothing else', () => {
        expect(playerFor('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
        expect(playerFor('https://vimeo.com/76979871')).toBe('https://player.vimeo.com/video/76979871?dnt=1&autoplay=1');
        expect(playerFor('https://vimeo.com/76979871/abcdef1234')).toBe('https://player.vimeo.com/video/76979871?dnt=1&h=abcdef1234&autoplay=1');
        expect(mapSrc('12 Allen Avenue, Ikeja')).toBe('https://maps.google.com/maps?q=12%20Allen%20Avenue%2C%20Ikeja&output=embed');
        expect(directionsFor('12 Allen Avenue, Ikeja')).toBe('https://www.google.com/maps/dir/?api=1&destination=12%20Allen%20Avenue%2C%20Ikeja');
        expect(addressOfDirections(directionsFor('Lekki Phase 1'))).toBe('Lekki Phase 1');
        expect(aFrameWeAllow(playerFor('https://youtu.be/dQw4w9WgXcQ'))).toBe(true);
        expect(aFrameWeAllow(mapSrc('Ikeja'))).toBe(true);
        expect(aFrameWeAllow('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(false);
        expect(aFrameWeAllow('https://evil.test/maps')).toBe(false);
    });

    it('is the same in the React package, which installs on its own', () => {
        for (const link of ['https://youtu.be/dQw4w9WgXcQ', 'https://vimeo.com/76979871/abcdef1234', 'https://example.com', '12 Allen Avenue']) {
            expect(reactCopy.videoOf(link)).toEqual(videoOf(link));
            expect(reactCopy.playerFor(link)).toEqual(playerFor(link));
            expect(reactCopy.mapSrc(link)).toEqual(mapSrc(link));
            expect(reactCopy.directionsFor(link)).toEqual(directionsFor(link));
        }
        const body = (file) => readFileSync(new URL(file, import.meta.url), 'utf8').replace(/^\/\*[\s\S]*?\*\/\s*/, '');
        expect(body('../../packages/react/src/embed-links.js')).toBe(body('../../resources/js/embed-links.js'));
    });
});

describe('on the page a visitor sees', () => {
    beforeEach(() => {
        window.__kitEmbedsManual = true;
        document.body.className = '';
        delete document.__kitEmbeds;
    });
    afterEach(() => {
        document.__kitEmbeds?.observer.disconnect();
        delete document.__kitEmbeds;
        document.body.innerHTML = '';
        document.head.querySelectorAll('style[data-kit-embeds-base]').forEach((s) => s.remove());
    });

    it('shows the cover and title, loads nothing from YouTube until play is pressed, then plays in the same room', () => {
        document.body.innerHTML = video();
        start(document);
        expect(document.querySelector('iframe')).toBeNull();
        expect(document.head.querySelector('style[data-kit-embeds-base]')?.textContent).toContain('aspect-ratio:16/9');
        const link = document.querySelector('[data-kit-video-link]');
        expect(link.getAttribute('role')).toBe('button');
        // its accessible name: "Play: " and the title
        expect(link.textContent.replace(/\s+/g, ' ').trim()).toBe('Play: Our story');

        const press = new MouseEvent('click', { bubbles: true, cancelable: true });
        link.dispatchEvent(press);
        expect(press.defaultPrevented).toBe(true);
        const player = document.querySelector('[data-kit-video] iframe');
        expect(player.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
        expect(player.title).toBe('Our story');
        expect(player.closest('.kit-video__frame')).not.toBeNull();
        expect(document.querySelector('[data-kit-video-link]')).toBeNull();
    });

    it('plays with Space, as a button does, and never while the page is being edited', () => {
        document.body.innerHTML = video('https://vimeo.com/76979871');
        start(document);
        document.body.classList.add('editing');
        // the test's browser never follows a link (no network in tests)
        const stay = (event) => event.preventDefault();
        document.body.addEventListener('click', stay);
        document.querySelector('[data-kit-video-link]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        document.body.removeEventListener('click', stay);
        expect(document.querySelector('iframe')).toBeNull();
        document.body.classList.remove('editing');
        document.querySelector('[data-kit-video-link]').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
        expect(document.querySelector('iframe').getAttribute('src')).toBe('https://player.vimeo.com/video/76979871?dnt=1&autoplay=1');
    });

    it('leaves a link that is not a video to open as a link', () => {
        document.body.innerHTML = video('https://example.com/');
        expect(play(document.querySelector('[data-kit-video-link]'))).toBe(false);
        expect(document.querySelector('iframe')).toBeNull();
    });

    it('draws the map from the address shown, lazily, named for it, and follows a changed address', async () => {
        document.body.innerHTML = map();
        start(document);
        const frame = document.querySelector('[data-kit-map-frame] iframe');
        expect(frame.getAttribute('src')).toBe('https://maps.google.com/maps?q=12%20Allen%20Avenue%2C%20Ikeja&output=embed');
        expect(frame.getAttribute('loading')).toBe('lazy');
        expect(frame.title).toBe('Map of 12 Allen Avenue, Ikeja');
        document.querySelector('[data-kit-map-address]').textContent = 'Lekki Phase 1, Lagos';
        drawMap(document.querySelector('[data-kit-map]'));
        expect(document.querySelectorAll('[data-kit-map-frame] iframe')).toHaveLength(1);
        expect(frame.getAttribute('src')).toContain('Lekki%20Phase%201');
        expect(document.querySelector('[data-kit-map-directions]').getAttribute('href')).toBe('https://www.google.com/maps/dir/?api=1&destination=Lekki%20Phase%201%2C%20Lagos');
    });
});

describe('in the editor', () => {
    afterEach(() => { document.body.innerHTML = ''; });

    it('a press anywhere on a video or a map opens its own panel', () => {
        document.body.innerHTML = video() + map();
        expect(embedOf(document.querySelector('[data-kit-video-title]'))?.kind).toBe('video');
        expect(embedOf(document.querySelector('[data-kit-video-caption]'))?.kind).toBe('video');
        expect(embedOf(document.querySelector('[data-kit-map-directions]'))?.kind).toBe('map');
        expect(embedOf(document.body)).toBeNull();
    });

    it('the video’s panel: Video link and Caption, a link that is not a video refused there, the rest saved as each part saves', async () => {
        document.body.innerHTML = video();
        const figure = document.querySelector('[data-kit-video]');
        const saved = [];
        const deps = { saveSetting: vi.fn(async (key, value) => saved.push(['setting', key, value])), saveImage: vi.fn(async (target, url) => saved.push(['image', target, url])) };
        const lookUp = vi.fn(async () => ({ link: 'https://vimeo.com/76979871', title: 'The Mountain', cover: 'https://cdn.example/media/v.jpg' }));
        const panel = renderVideoPanel({ figure, lookUp, save: (found, caption) => saveVideo(figure, found, caption, deps) });
        document.body.append(panel);
        expect([...panel.querySelectorAll('label')].map((l) => l.firstChild.textContent)).toEqual(['Video link', 'Caption (optional)']);
        expect(panel.querySelector('[data-embed-field="link"]').value).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

        expect(await panel.leSave({ link: 'https://example.com/clip.mp4' })).toEqual([NOT_A_VIDEO]);
        expect(panel.querySelector('[role="alert"]').textContent).toBe(NOT_A_VIDEO);
        expect(lookUp).not.toHaveBeenCalled();

        expect(await panel.leSave({ link: 'https://vimeo.com/76979871', caption: 'Filmed in Jos' })).toEqual([]);
        expect(saved).toEqual([
            ['setting', 'added:home/add-v1:link', 'https://vimeo.com/76979871'],
            ['image', 'setting:added:home/add-v1:cover', 'https://cdn.example/media/v.jpg'],
            ['setting', 'added:home/add-v1:title', 'The Mountain'],
            ['setting', 'added:home/add-v1:caption', 'Filmed in Jos'],
        ]);
        expect(figure.querySelector('[data-kit-video-title]').textContent).toBe('The Mountain');
        expect(figure.querySelector('[data-kit-video-caption]').textContent).toBe('Filmed in Jos');
    });

    it('a video with no cover the host could keep shows its title on the template’s colours', async () => {
        document.body.innerHTML = video();
        const figure = document.querySelector('[data-kit-video]');
        const deps = { saveSetting: vi.fn(async () => {}), saveImage: vi.fn(async () => {}) };
        await saveVideo(figure, { link: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', title: 'Launch day', cover: null }, null, deps);
        expect(deps.saveImage).toHaveBeenCalledWith('setting:added:home/add-v1:cover', '', 'Launch day');
        expect(figure.querySelector('[data-kit-video-cover]').getAttribute('src')).toBe('');
    });

    it('the map’s panel: Address and Button words; the button goes where the address is', async () => {
        document.body.innerHTML = map();
        const box = document.querySelector('[data-kit-map]');
        const saved = [];
        const panel = renderMapPanel({ map: box, save: (chosen) => saveMap(box, chosen, { saveSetting: async (key, value) => saved.push([key, value]) }) });
        expect([...panel.querySelectorAll('label')].map((l) => l.firstChild.textContent)).toEqual(['Address', 'Button words']);
        expect(await panel.leSave({ address: '' })).toEqual(['Type the address or the name of the place.']);
        expect(await panel.leSave({ address: '  Lekki   Phase 1, Lagos ', words: 'Find us' })).toEqual([]);
        expect(saved).toEqual([
            ['added:home/add-m1:address', 'Lekki Phase 1, Lagos'],
            ['added:home/add-m1:go', 'https://www.google.com/maps/dir/?api=1&destination=Lekki%20Phase%201%2C%20Lagos'],
            ['added:home/add-m1:go.text', 'Find us'],
        ]);
    });

    it('Ask AI is told each video and map as its panel shows it, and never their parts one at a time', () => {
        document.body.innerHTML = video('https://youtu.be/dQw4w9WgXcQ', 'Our story', 'Filmed in Lagos') + map();
        expect(videosOf(document)).toEqual([{ id: 'added:home/add-v1:link', name: 'Our story', link: 'https://youtu.be/dQw4w9WgXcQ', caption: 'Filmed in Lagos' }]);
        expect(mapsOf(document)).toEqual([{ id: 'added:home/add-m1:address', address: '12 Allen Avenue, Ikeja', button: 'Get directions' }]);
        expect(ownedByAnEmbed(document.querySelector('[data-kit-video-link]'), 'data-edit-href')).toBe(true);
        expect(ownedByAnEmbed(document.querySelector('[data-kit-video-caption]'), 'data-edit')).toBe(false);
        expect(ownedByAnEmbed(document.querySelector('[data-kit-map-directions]'), 'data-edit')).toBe(false);
        expect(ownedByAnEmbed(document.querySelector('[data-kit-map-directions]'), 'data-edit-href')).toBe(true);

        const page = pageForTheChat(document);
        expect(page.videos).toHaveLength(1);
        expect(page.maps).toHaveLength(1);
        const keys = page.fields.map((field) => field.key);
        expect(keys).toContain('added:home/add-v1:caption');
        expect(keys).toContain('added:home/add-m1:go.text');
        expect(keys).not.toContain('added:home/add-v1:link');
        expect(keys).not.toContain('added:home/add-v1:title');
        expect(keys).not.toContain('added:home/add-m1:address');
    });
});

describe('the add window', () => {
    afterEach(() => { document.body.innerHTML = ''; });

    const library = [
        { from: 'kit.embed.video', label: 'Video', page: 'Video and map', kind: 'video', at: null },
        { from: 'kit.embed.map', label: 'Map', page: 'Video and map', kind: 'map', at: null },
    ];

    it('names them, says what each does, and asks for the link or the address before adding', async () => {
        expect(nounFor(library[0])).toBe('video');
        expect(nounFor(library[1])).toBe('map');
        expect(kindSays('video').join(' ')).toContain('Nothing from YouTube or Vimeo loads until they press play');
        expect(kindSays('map').join(' ')).toContain('Get directions');

        const container = document.createElement('div');
        document.body.append(container);
        const add = vi.fn();
        renderSectionBrowser({ container, library, add, actionLabel: (s) => `Add this ${nounFor(s)}` });
        await new Promise((resolve) => setTimeout(resolve, 0));
        const box = container.querySelector('.le-embed-value');
        expect(box.closest('label').firstChild.textContent).toBe('Video link');
        const button = container.querySelector('.le-browser-add');
        expect(button.textContent).toBe('Add this video');

        box.value = 'https://www.dailymotion.com/video/x7';
        button.click();
        expect(add).not.toHaveBeenCalled();
        expect(container.querySelector('.le-browser-note').textContent).toBe(NOT_A_VIDEO);

        box.value = 'https://youtu.be/dQw4w9WgXcQ';
        button.click();
        expect(add).toHaveBeenCalledWith(expect.objectContaining({ kind: 'video', value: 'https://youtu.be/dQw4w9WgXcQ' }), undefined);

        container.querySelector('.le-library-item[data-from="kit.embed.map"]').click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        const address = container.querySelector('.le-embed-value');
        expect(address.closest('label').firstChild.textContent).toBe('Address');
        address.value = '12 Allen Avenue, Ikeja';
        container.querySelector('.le-browser-add').click();
        expect(add).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'map', value: '12 Allen Avenue, Ikeja' }), undefined);
    });
});
