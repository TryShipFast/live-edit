/*
 * A video from YouTube or Vimeo, and a map to an address, in the editor (LIVE-EDIT-STRUCTURE.md, "A video from
 * YouTube or Vimeo" and "A map to an address").
 *
 * The way Wix's and Squarespace's video and map blocks are changed: pressing the video opens one panel with its
 * Video link and an optional Caption; pressing the map opens one with its Address and the words on its button. That
 * is all (dead simple: no zoom, style, pin, autoplay or loop to learn).
 *
 * Both are made of the parts every adapter already saves (a link's address, a picture, words), so they work on
 * WordPress, Laravel, React, Next.js and plain HTML alike:
 *   video  [data-kit-video]  > a[data-kit-video-link] (its address: the video's own page)
 *                                > img[data-kit-video-cover] (its cover, stored as the site's own picture)
 *                                > [data-kit-video-title] (its title, the press's accessible name)
 *                            > [data-kit-video-caption] (optional words under it)
 *   map    [data-kit-map]    > [data-kit-map-frame] (the room the map is drawn in, its Show map button inside)
 *                            > [data-kit-map-address] (the address, words)
 *                            > a[data-kit-map-directions] (Get directions: its words, and an address the panel keeps)
 */
import { NOT_A_VIDEO, NO_ADDRESS, cleanAddress, directionsFor, videoOf } from './embed-links.js';

export { NOT_A_VIDEO, NO_ADDRESS };

const clean = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();

/** "setting:tpl:abc" is the key "tpl:abc"; a bare key (the Kit's addresses) is itself. */
export const keyOf = (marker) => {
    const said = String(marker ?? '');
    if (said === '') return null;

    return said.startsWith('setting:') ? said.slice(8) : said;
};

/** The video or the map a press on the page is in, with what it is, or null. */
export function embedOf(node) {
    const video = node?.closest?.('[data-kit-video]');
    if (video) return { element: video, kind: 'video' };
    const map = node?.closest?.('[data-kit-map]');
    if (map) return { element: map, kind: 'map' };

    return null;
}

/** A video's parts, each with the key it is saved under. */
export function videoParts(figure) {
    const link = figure.querySelector('[data-kit-video-link]');
    const cover = figure.querySelector('[data-kit-video-cover]');
    const title = figure.querySelector('[data-kit-video-title]');
    const caption = figure.querySelector('[data-kit-video-caption]');

    return {
        link,
        cover,
        title,
        caption,
        linkKey: keyOf(link?.getAttribute('data-edit-href')),
        coverTarget: cover?.getAttribute('data-edit-img') ?? null,
        titleKey: keyOf(title?.getAttribute('data-edit')),
        captionKey: keyOf(caption?.getAttribute('data-edit')),
    };
}

/** A map's parts, each with the key it is saved under (the button's words are its link's words, "<key>.text"). */
export function mapParts(map) {
    const address = map.querySelector('[data-kit-map-address]');
    const directions = map.querySelector('[data-kit-map-directions]');
    const wordsOn = directions?.hasAttribute('data-edit') ? directions : directions?.querySelector('[data-edit]');

    return {
        address,
        directions,
        addressKey: keyOf(address?.getAttribute('data-edit')),
        hrefKey: keyOf(directions?.getAttribute('data-edit-href')),
        wordsKey: keyOf(wordsOn?.getAttribute('data-edit')),
    };
}

/** What a video shows now: its link, title and caption. */
export function videoNow(figure) {
    const parts = videoParts(figure);

    return {
        link: parts.link?.getAttribute('href') ?? '',
        title: clean(parts.title?.textContent),
        caption: clean(parts.caption?.textContent),
    };
}

/** What a map shows now: its address and the words on its button. */
export function mapNow(map) {
    const parts = mapParts(map);

    return { address: clean(parts.address?.textContent), words: clean(parts.directions?.textContent) };
}

/**
 * Whether a marked part is the video's or the map's own, set only through its panel (the link, the cover, the title;
 * the address and where the button goes): Ask AI changes those with change_video and change_map, never one at a time.
 * A caption and the button's words are words like any other.
 */
export function ownedByAnEmbed(element, attribute) {
    if (!element?.closest?.('[data-kit-video], [data-kit-map]')) return false;
    if (element.matches('[data-kit-video-link], [data-kit-video-cover], [data-kit-video-title], [data-kit-map-address]')) return true;

    return attribute === 'data-edit-href' && element.matches('[data-kit-map-directions]');
}

/** The page's videos, for Ask AI (as its panel shows each): its id is its link's key. */
export function videosOf(root, limit = 20) {
    const found = [];
    for (const figure of root.querySelectorAll('[data-kit-video]')) {
        if (figure.closest('#live-edit-ui, [data-live-lock], [data-live-edit-lock]') || found.length >= limit) continue;
        const { linkKey } = videoParts(figure);
        if (!linkKey) continue;
        const now = videoNow(figure);
        found.push({ id: linkKey, name: now.title || 'Video', link: now.link, caption: now.caption });
    }

    return found;
}

/** The page's maps, for Ask AI: its id is its address's key. */
export function mapsOf(root, limit = 20) {
    const found = [];
    for (const map of root.querySelectorAll('[data-kit-map]')) {
        if (map.closest('#live-edit-ui, [data-live-lock], [data-live-edit-lock]') || found.length >= limit) continue;
        const { addressKey } = mapParts(map);
        if (!addressKey) continue;
        const now = mapNow(map);
        found.push({ id: addressKey, address: now.address, button: now.words });
    }

    return found;
}

/**
 * A video saved as the owner chose it, the parts it is made of each saved the way their own panels save them: the link
 * to the video's page, the cover the host stored as the site's own picture (or none, when there is none: the frame
 * then shows the title on the template's colours), the title, and the caption when it changed.
 *
 * @param {{link: string, title: string, cover: string|null}} found  What the host's look-up said (`/live-edit/video`).
 */
export async function saveVideo(figure, found, caption, { saveSetting, saveImage }) {
    const parts = videoParts(figure);
    if (!parts.linkKey) throw new Error('This video cannot be changed here.');
    await saveSetting(parts.linkKey, found.link, 'Video');
    if (parts.coverTarget) await saveImage(parts.coverTarget, found.cover || '', clean(found.title));
    if (parts.titleKey) await saveSetting(parts.titleKey, clean(found.title) || 'Video', 'Video');
    if (parts.captionKey && caption !== null && caption !== undefined && clean(caption) !== videoNow(figure).caption) {
        await saveSetting(parts.captionKey, clean(caption), 'Video');
    }
    // shown at once, as it was saved
    parts.link?.setAttribute('href', found.link);
    if (parts.cover) {
        if (found.cover) parts.cover.setAttribute('src', found.cover);
        else parts.cover.setAttribute('src', '');
        parts.cover.setAttribute('alt', '');
    }
    if (parts.title) parts.title.textContent = clean(found.title) || 'Video';
    if (parts.caption && caption !== null && caption !== undefined) parts.caption.textContent = clean(caption);
}

/** A map saved as the owner chose it: its address, where Get directions goes (worked out from it) and the button's words. */
export async function saveMap(map, { address, words = null }, { saveSetting }) {
    const parts = mapParts(map);
    const said = cleanAddress(address);
    if (said === '') throw new Error(NO_ADDRESS);
    if (!parts.addressKey) throw new Error('This map cannot be changed here.');
    const before = mapNow(map);
    if (said !== before.address) {
        await saveSetting(parts.addressKey, said, 'Map');
        if (parts.hrefKey) await saveSetting(parts.hrefKey, directionsFor(said), 'Map');
    }
    const wordsNow = clean(words);
    if (words !== null && wordsNow !== '' && wordsNow !== before.words && parts.wordsKey) await saveSetting(parts.wordsKey, wordsNow, 'Map');
    if (parts.address) parts.address.textContent = said;
    parts.directions?.setAttribute('href', directionsFor(said));
    if (words !== null && wordsNow !== '' && parts.directions) {
        const on = parts.directions.hasAttribute('data-edit') ? parts.directions : parts.directions.querySelector('[data-edit]') ?? parts.directions;
        on.textContent = wordsNow;
    }
}

const make = (doc, tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
};

const field = (doc, label, value, { placeholder = '', hint = '', name }) => {
    const wrap = make(doc, 'label', 'le-field');
    wrap.append(label);
    const input = make(doc, 'input', 'le-input');
    input.type = name === 'link' ? 'url' : 'text';
    input.name = name;
    input.value = value;
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.setAttribute('data-embed-field', name);
    wrap.append(input);
    if (hint) wrap.append(make(doc, 'span', 'le-hint', hint));

    return { wrap, input };
};

/**
 * The video's panel: Video link and Caption (optional), and Save. A link that is not a YouTube or Vimeo video is
 * refused where they are looking, before anything is sent. `leSave({link, caption})` is the same Save, for Ask AI.
 *
 * @param {{figure: Element, lookUp: (link: string) => Promise<object>, save: (found: object, caption: string) => Promise<void>, done?: (message: string) => void}} deps
 */
export function renderVideoPanel({ figure, lookUp, save, done = () => {} }) {
    const doc = figure.ownerDocument;
    const now = videoNow(figure);
    const wrap = make(doc, 'div', 'le-embed-panel');
    const link = field(doc, 'Video link', now.link, { name: 'link', placeholder: 'https://www.youtube.com/watch?v=…', hint: 'Paste the link from YouTube or Vimeo (Share, then Copy link).' });
    const caption = field(doc, 'Caption (optional)', now.caption, { name: 'caption', hint: 'A line under the video. Leave it empty for none.' });
    const said = make(doc, 'p', 'le-hint le-hint--warn');
    said.setAttribute('role', 'alert');
    said.hidden = true;
    const button = make(doc, 'button', 'le-btn-publish le-embed-save', 'Save');
    button.type = 'button';
    wrap.append(link.wrap, caption.wrap, said, button);

    const say = (message) => {
        said.textContent = message ?? '';
        said.hidden = !message;
    };

    const run = async ({ link: typed = link.input.value, caption: words = caption.input.value } = {}) => {
        say('');
        link.input.value = typed;
        caption.input.value = words ?? '';
        const video = videoOf(typed);
        if (!video) {
            say(NOT_A_VIDEO);

            return [NOT_A_VIDEO];
        }
        button.disabled = true;
        button.textContent = 'Saving…';
        try {
            // the same video and only the caption changed: nothing to look up
            const sameVideo = videoOf(now.link)?.id === video.id && videoOf(now.link)?.provider === video.provider;
            const found = sameVideo && now.title ? { link: video.link, title: now.title, cover: figure.querySelector('[data-kit-video-cover]')?.getAttribute('src') || null, same: true } : await lookUp(typed);
            await save(found, words ?? '');
            done('Video saved ✓');

            return [];
        } catch (error) {
            say(error?.message || 'That video could not be saved. Try again.');

            return [error?.message || 'That video could not be saved.'];
        } finally {
            button.disabled = false;
            button.textContent = 'Save';
        }
    };
    button.addEventListener('click', () => { void run(); });
    link.input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); void run(); } });
    wrap.leSave = run;

    return wrap;
}

/**
 * The map's panel: Address and Button words, and Save. `leSave({address, words})` is the same Save, for Ask AI.
 *
 * @param {{map: Element, save: (chosen: {address: string, words: string}) => Promise<void>, done?: (message: string) => void}} deps
 */
export function renderMapPanel({ map, save, done = () => {} }) {
    const doc = map.ownerDocument;
    const now = mapNow(map);
    const wrap = make(doc, 'div', 'le-embed-panel');
    const address = field(doc, 'Address', now.address, { name: 'address', placeholder: '12 Allen Avenue, Ikeja, Lagos', hint: 'A street address or the name of a place, as you would search for it in Google Maps.' });
    const words = field(doc, 'Button words', now.words, { name: 'words', hint: 'The button opens Google Maps with directions to this address.' });
    const said = make(doc, 'p', 'le-hint le-hint--warn');
    said.setAttribute('role', 'alert');
    said.hidden = true;
    const button = make(doc, 'button', 'le-btn-publish le-embed-save', 'Save');
    button.type = 'button';
    wrap.append(address.wrap, words.wrap, said, button);

    const say = (message) => {
        said.textContent = message ?? '';
        said.hidden = !message;
    };
    const run = async ({ address: typed = address.input.value, words: on = words.input.value } = {}) => {
        say('');
        address.input.value = typed;
        words.input.value = on ?? '';
        if (cleanAddress(typed) === '') {
            say(NO_ADDRESS);

            return [NO_ADDRESS];
        }
        button.disabled = true;
        button.textContent = 'Saving…';
        try {
            await save({ address: typed, words: on });
            done('Map saved ✓');

            return [];
        } catch (error) {
            say(error?.message || 'That map could not be saved. Try again.');

            return [error?.message || 'That map could not be saved.'];
        } finally {
            button.disabled = false;
            button.textContent = 'Save';
        }
    };
    button.addEventListener('click', () => { void run(); });
    address.input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); void run(); } });
    wrap.leSave = run;

    return wrap;
}

/** Whether a library entry is one of these: it is added with what the owner types in the add window. */
export const anEmbed = (section) => section?.kind === 'video' || section?.kind === 'map';

/**
 * What the add window asks for before a video or a map is added (owner's brief, 15 Nov 2026: "the owner adds Video
 * from the add window and pastes a YouTube or Vimeo link"; "adds Map and types an address"), the way Squarespace's
 * blocks ask for their link or address as they are added. Returns the box and its value.
 */
export function askedInTheAddWindow(doc, section, value = '') {
    const video = section.kind === 'video';
    const { wrap, input } = field(doc, video ? 'Video link' : 'Address', value, video
        ? { name: 'link', placeholder: 'https://www.youtube.com/watch?v=…', hint: 'Paste the link from YouTube or Vimeo (Share, then Copy link).' }
        : { name: 'address', placeholder: '12 Allen Avenue, Ikeja, Lagos', hint: 'A street address or the name of a place, as you would search for it in Google Maps.' });
    wrap.classList.add('le-embed-ask');
    input.classList.add('le-embed-value');

    return { wrap, input };
}

/** What the add window says a video or a map is, before it is added. */
export function embedSays(kind) {
    if (kind === 'video') {
        return [
            'A video from YouTube or Vimeo, in a 16:9 frame that fits every screen.',
            'Visitors see its cover picture and title with a play button. Nothing from YouTube or Vimeo loads until they press play, so your page stays fast and sets no cookies before then.',
            'Change the link or add a caption any time by pressing the video.',
        ];
    }
    if (kind === 'map') {
        return [
            'A Google map of your address, with a Get directions button that opens Google Maps.',
            'Visitors see a drawn map with Show map: nothing from Google loads until they press it, so your page stays fast and sets no cookies before then.',
            'Change the address or the button’s words any time by pressing the map.',
        ];
    }

    return [];
}

/** Whether what was typed in the add window can be added, or why not (said there). */
export function refusalFor(kind, value) {
    if (kind === 'video') return videoOf(value) ? null : NOT_A_VIDEO;
    if (kind === 'map') return cleanAddress(value) === '' ? NO_ADDRESS : null;

    return null;
}

/** Kept across the reload that draws an added video or map, so its link or address is saved into it once it is there. */
export const PENDING = 'le-embed-pending';
