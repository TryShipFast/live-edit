/*
 * (A copy of the engine's resources/js/embed-links.js, so this package installs on its own; a test keeps the two the
 * same.)
 *
 * A video from YouTube or Vimeo, and a map to an address: the addresses they are made of
 * (LIVE-EDIT-STRUCTURE.md, "A video from YouTube or Vimeo" and "A map to an address").
 *
 * Shared by the editor's panels (embeds.js) and the script a visitor's browser runs (kit-embeds.js), so the link an
 * owner pastes is read one way everywhere. Only the players people know are accepted, and only these hosts are ever
 * framed or linked: www.youtube-nocookie.com, player.vimeo.com, maps.google.com and www.google.com/maps.
 */

/** Said wherever a link that is not a video is refused: the add window, the video's panel and Ask AI. */
export const NOT_A_VIDEO = 'Paste a link to a YouTube or Vimeo video.';

/** Said where an address is left empty. */
export const NO_ADDRESS = 'Type the address or the name of the place.';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com'];
const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];

/** The most an address may be: a street, a town and a country with room to spare. */
export const LONGEST_ADDRESS = 240;

const asUrl = (text) => {
    let said = String(text ?? '').trim();
    if (said === '') return null;
    // "youtu.be/abc" typed without its scheme, as people paste from a phone's share sheet
    if (!/^[a-z][a-z0-9+.-]*:/i.test(said)) said = `https://${said}`;
    try {
        const url = new URL(said);

        return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
    } catch {
        return null;
    }
};

/**
 * The video a link is, or null: {provider, id, hash, link}. `link` is the address it is saved under (the video's own
 * page, so it still opens without our script); `hash` is an unlisted Vimeo video's private part.
 *
 * YouTube: youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/. Vimeo: vimeo.com/<id>, an unlisted
 * vimeo.com/<id>/<hash>, a channel's or a showcase's video, player.vimeo.com/video/<id>.
 */
export function videoOf(text) {
    const url = asUrl(text);
    if (!url) return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);

    if (YOUTUBE_HOSTS.includes(host)) {
        let id = null;
        if (host === 'youtu.be') id = parts[0] ?? null;
        else if (parts[0] === 'watch') id = url.searchParams.get('v');
        else if (['shorts', 'embed', 'live', 'v'].includes(parts[0])) id = parts[1] ?? null;
        if (!id || !YOUTUBE_ID.test(id)) return null;

        return { provider: 'youtube', id, hash: null, link: `https://www.youtube.com/watch?v=${id}` };
    }

    if (VIMEO_HOSTS.includes(host)) {
        let id = null;
        let hash = null;
        if (host === 'player.vimeo.com') {
            if (parts[0] === 'video') id = parts[1] ?? null;
            hash = url.searchParams.get('h');
        } else {
            // the first number in the path is the video (vimeo.com/123, /channels/staffpicks/123, /showcase/9/video/123)
            const at = parts.findIndex((part) => /^\d+$/.test(part));
            if (at >= 0) {
                id = parts[at];
                // an unlisted video's address carries its private part after it (vimeo.com/123/abcdef0123)
                if (parts[at + 1] && /^[0-9a-f]{6,20}$/i.test(parts[at + 1])) hash = parts[at + 1];
            }
            hash = hash ?? url.searchParams.get('h');
        }
        if (!id || !/^\d{1,12}$/.test(id)) return null;
        if (hash && !/^[0-9a-f]{6,20}$/i.test(hash)) hash = null;

        return { provider: 'vimeo', id, hash, link: `https://vimeo.com/${id}${hash ? `/${hash}` : ''}` };
    }

    return null;
}

/**
 * The player a press swaps in, playing at once: YouTube's privacy-enhanced player (no cookies until the visitor plays)
 * or Vimeo's with Do Not Track. Null for anything that is not one of these videos.
 */
export function playerFor(text, { autoplay = true } = {}) {
    const video = videoOf(text);
    if (!video) return null;
    if (video.provider === 'youtube') {
        return `https://www.youtube-nocookie.com/embed/${video.id}${autoplay ? '?autoplay=1' : ''}`;
    }

    return `https://player.vimeo.com/video/${video.id}?dnt=1${video.hash ? `&h=${video.hash}` : ''}${autoplay ? '&autoplay=1' : ''}`;
}

/** An address as it is kept: one line, its spaces tidied, never longer than LONGEST_ADDRESS. */
export function cleanAddress(text) {
    return String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, LONGEST_ADDRESS);
}

/** Google's map of a place, the keyless embed (no key, no account): what the map's frame shows. */
export function mapSrc(address) {
    const said = cleanAddress(address);

    return said === '' ? null : `https://maps.google.com/maps?q=${encodeURIComponent(said)}&output=embed`;
}

/** Google Maps' directions to a place, opened in a new tab by the map's Get directions button. */
export function directionsFor(address) {
    const said = cleanAddress(address);

    return said === '' ? null : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(said)}`;
}

/** The place a directions link goes to, or '' (the map's address, read back from the link it saved). */
export function addressOfDirections(href) {
    const url = asUrl(href);
    if (!url || url.hostname !== 'www.google.com' || !url.pathname.startsWith('/maps')) return '';

    return cleanAddress(url.searchParams.get('destination') ?? '');
}

/** Whether a frame's address is one of the hosts these two may load: nothing else is ever framed. */
export function aFrameWeAllow(src) {
    const url = asUrl(src);
    if (!url || url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();

    return host === 'www.youtube-nocookie.com' || host === 'player.vimeo.com' || (host === 'maps.google.com' && url.pathname === '/maps');
}

/**
 * The still picture a map shows until the visitor presses Show map: our own drawn streets and a pin, in the template's
 * colours (kit-embeds.css colours its parts by class), so nothing of Google's is loaded, not even a picture. One drawing
 * for every adapter (kit-embeds.js puts it in the map's frame; React draws it itself). Decorative: hidden from screen
 * readers, as the Show map button says what it does.
 */
export const MAP_PICTURE = '<svg class="kit-map__picture" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">'
    + '<rect class="kit-map__ground" width="640" height="360"/>'
    + '<path class="kit-map__water" d="M0 286c70-18 120-6 182 8s128 18 196-6 150-30 262-10v82H0z"/>'
    + '<g class="kit-map__blocks"><rect x="28" y="24" width="116" height="74" rx="6"/><rect x="176" y="24" width="150" height="74" rx="6"/><rect x="360" y="24" width="98" height="74" rx="6"/>'
    + '<rect x="492" y="24" width="124" height="120" rx="6"/><rect x="28" y="130" width="116" height="96" rx="6"/><rect x="176" y="130" width="72" height="96" rx="6"/>'
    + '<rect x="282" y="130" width="176" height="96" rx="6"/><rect x="492" y="176" width="124" height="70" rx="6"/></g>'
    + '<g class="kit-map__roads"><path d="M0 114h640M160 0v262M342 0v250M476 0v246M0 246c90-8 220-4 340 2s200 2 300-8"/><path class="kit-map__lane" d="M264 114v124M28 166h116M492 160h124"/></g>'
    + '<g class="kit-map__pin" transform="translate(320 150)"><path d="M0 0c-22-30-34-47-34-63a34 34 0 0 1 68 0c0 16-12 33-34 63z"/><circle class="kit-map__pin-dot" cy="-63" r="12"/></g>'
    + '</svg>';

/** What the Show map button says to a screen reader. */
export function showMapName(address) {
    const said = cleanAddress(address);

    return said === '' ? 'Show map' : `Show map of ${said}`;
}
