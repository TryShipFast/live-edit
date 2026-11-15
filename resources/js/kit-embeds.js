/*
 * What a visitor's browser runs for a video from YouTube or Vimeo and a map to an address
 * (LIVE-EDIT-STRUCTURE.md, "A video from YouTube or Vimeo" and "A map to an address").
 *
 * The way Wix's and Squarespace's video and map blocks behave, kept light:
 * - A video shows its cover picture (our own stored copy), its title and a play button. Nothing from YouTube or Vimeo
 *   loads before the press: the press swaps in the player (youtube-nocookie.com or player.vimeo.com with Do Not
 *   Track), playing at once, in the same 16:9 room, so nothing moves. Without this script the cover is a link to the
 *   video's own page.
 * - A map is our own still picture of streets and a pin with Show map, and Get directions beside it: nothing of
 *   Google's loads until the visitor presses Show map (owner, 15 Nov 2026: so the templates' "no cookies, no tracking"
 *   stays true), which swaps in Google's keyless embed of the address the page shows, in the same room. The frame is
 *   made here from the address, so an address changed in the editor (or saved on any adapter) is the map drawn.
 *
 * One file for every adapter: the host writes it beside a published site (assets/kit/kit-embeds.js), the HTML and
 * Laravel adapters' embed loads it on a page that holds one, WordPress adds it to such a page, and the editor runs it.
 * While the page is being edited (body.editing) a press opens the editor's panel instead, and the map lets presses
 * through to the editor.
 */
import { MAP_PICTURE, aFrameWeAllow, cleanAddress, directionsFor, mapSrc, playerFor, showMapName } from './embed-links.js';

/* kit-embeds:base */
export const KIT_EMBEDS_CSS = ':where(.kit-embed){display:block;padding-block:var(--kit-section-space,clamp(48px,7vw,96px));color:var(--brand-body,inherit)}'
    + ':where(.kit-embed__in){width:min(100% - 2*var(--kit-gutter,clamp(16px,4vw,48px)),var(--kit-measure,1200px));margin-inline:auto}'
    + ':where(.kit-video__figure){margin:0}'
    + ':where(.kit-video__frame){position:relative;display:block;aspect-ratio:16/9;width:100%;overflow:hidden;border-radius:var(--kit-embed-radius,12px);'
    + 'background:linear-gradient(135deg,var(--brand-ink,#0f2447),color-mix(in srgb,var(--brand-ink,#0f2447) 70%,var(--brand-accent,#2e6b9f)));color:#fff;text-decoration:none;cursor:pointer}'
    + ':where(.kit-video__frame iframe){position:absolute;inset:0;width:100%;height:100%;border:0}'
    + ':where(.kit-video__cover){position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}'
    + ':where(.kit-video__cover[src=""],.kit-video__cover:not([src]),.kit-video__cover[src^="data:"]){visibility:hidden}'
    + ':where(.kit-video__shade){position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55),rgba(0,0,0,0) 45%,rgba(0,0,0,0) 70%,rgba(0,0,0,.35));pointer-events:none}'
    + ':where(.kit-video__title){position:absolute;left:clamp(12px,2.5vw,24px);right:clamp(12px,2.5vw,24px);bottom:clamp(10px,2vw,20px);margin:0;font-family:var(--font-display,inherit);'
    + 'font-size:clamp(.95rem,1.6vw,1.25rem);font-weight:600;line-height:1.3;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'
    + ':where(.kit-video__play){position:absolute;left:50%;top:50%;width:clamp(56px,9vw,76px);aspect-ratio:68/48;transform:translate(-50%,-50%);display:grid;place-items:center;'
    + 'border-radius:14px;background:var(--brand-accent,#e11d48);box-shadow:0 6px 20px rgba(0,0,0,.35);transition:transform .15s ease}'
    + ':where(.kit-video__play svg){width:38%;height:auto;fill:#fff;margin-left:6%}'
    + ':where(.kit-video__frame:hover .kit-video__play,.kit-video__frame:focus-visible .kit-video__play){transform:translate(-50%,-50%) scale(1.08)}'
    + ':where(.kit-video__frame:focus-visible){outline:3px solid var(--brand-accent,#2e6b9f);outline-offset:3px}'
    + ':where(.kit-video__sr){position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'
    + ':where(.kit-video__caption){margin:12px 0 0;color:var(--brand-muted,#6b7280);font-size:.95rem}'
    + ':where(.kit-video__caption:empty){display:none}'
    + ':where(.kit-map__figure){margin:0;border-radius:var(--kit-embed-radius,12px);overflow:hidden;border:1px solid var(--brand-line,#d1d9e2);background:var(--brand-raised,#eef2f6)}'
    + ':where(.kit-map__frame){position:relative;height:clamp(300px,42vw,480px)}'
    + ':where(.kit-map__frame iframe){position:absolute;inset:0;width:100%;height:100%;border:0;display:block}'
    + ':where(.kit-map__bar){display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 20px;padding:14px clamp(14px,2.5vw,24px);background:var(--brand-surface,#fff)}'
    + ':where(.kit-map__address){margin:0;color:var(--brand-ink,inherit);font-weight:500;min-width:0;overflow-wrap:anywhere}'
    + ':where(.kit-map__directions){display:inline-flex;align-items:center;min-height:44px;padding:0 20px;border-radius:999px;background:var(--brand-accent,#2e6b9f);color:var(--brand-on-accent,#fff);font-weight:600;text-decoration:none;white-space:nowrap}'
    + ':where(.kit-map__directions:focus-visible){outline:3px solid var(--brand-ink,#0f2447);outline-offset:2px}'
    + ':where(.kit-map__picture){position:absolute;inset:0;width:100%;height:100%;display:block}'
    + ':where(.kit-map__ground){fill:var(--brand-raised,#eef2f6)}'
    + ':where(.kit-map__water){fill:color-mix(in srgb,var(--brand-accent,#2e6b9f) 16%,var(--brand-raised,#eef2f6))}'
    + ':where(.kit-map__blocks rect){fill:color-mix(in srgb,var(--brand-line,#d1d9e2) 55%,var(--brand-raised,#eef2f6))}'
    + ':where(.kit-map__roads path){fill:none;stroke:var(--brand-surface,#fff);stroke-width:14;stroke-linecap:round}'
    + ':where(.kit-map__roads .kit-map__lane){stroke-width:7}'
    + ':where(.kit-map__pin){fill:var(--brand-accent,#2e6b9f)}'
    + ':where(.kit-map__pin-dot){fill:var(--brand-surface,#fff)}'
    + ':where(.kit-map__show){position:absolute;left:50%;bottom:clamp(14px,4%,28px);transform:translateX(-50%);display:inline-flex;align-items:center;min-height:44px;padding:0 22px;'
    + 'border:1px solid var(--brand-line,#d1d9e2);border-radius:999px;background:var(--brand-surface,#fff);color:var(--brand-ink,#0f2447);font:inherit;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.12);white-space:nowrap}'
    + ':where(.kit-map__show:focus-visible){outline:3px solid var(--brand-accent,#2e6b9f);outline-offset:2px}'
    + ':where(.kit-map__note){flex-basis:100%;margin:0;font-size:.85rem;color:var(--brand-muted,#6b7280)}'
    + ':where([data-kit-map-shown] .kit-map__note){display:none}'
    + 'body.editing :where(.kit-map__frame iframe){pointer-events:none}';
/* /kit-embeds:base */

const editing = (doc) => Boolean(doc.body?.classList.contains('editing'));

/** The page's own look for these, unless the host already wrote it into the head (<style data-kit-embeds-base>). */
export function ensureLook(doc = document) {
    if (doc.querySelector('style[data-kit-embeds-base]')) return;
    const style = doc.createElement('style');
    style.setAttribute('data-kit-embeds-base', '');
    style.textContent = KIT_EMBEDS_CSS;
    (doc.head ?? doc.documentElement).append(style);
}

/** The player in place of the cover, playing: the visitor pressed play, which is their choice to load it. */
export function play(link) {
    const doc = link.ownerDocument;
    const src = playerFor(link.getAttribute('href'));
    if (!src || !aFrameWeAllow(src)) return false;
    const title = (link.querySelector('[data-kit-video-title]')?.textContent ?? '').replace(/\s+/g, ' ').trim() || 'Video';
    const frame = doc.createElement('div');
    frame.className = `${link.className} is-playing`.trim();
    frame.setAttribute('data-kit-video-playing', '');
    const player = doc.createElement('iframe');
    player.src = src;
    player.title = title;
    player.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
    player.setAttribute('allowfullscreen', '');
    player.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.append(player);
    link.replaceWith(frame);
    player.focus?.();

    return true;
}

/**
 * A map, kept in step with the address the page shows. Until the visitor presses Show map it is our own still picture
 * and the button, and nothing of Google's is loaded (the templates say they set no cookies and do no tracking, and that
 * stays true); once pressed, Google's map in the same room. Get directions follows the address either way.
 */
export function drawMap(map) {
    const doc = map.ownerDocument;
    const address = cleanAddress(map.querySelector('[data-kit-map-address]')?.textContent ?? '');
    const room = map.querySelector('[data-kit-map-frame]');
    const directions = map.querySelector('[data-kit-map-directions]');
    const to = directionsFor(address);
    if (directions && to && directions.getAttribute('href') !== to) directions.setAttribute('href', to);
    if (!room) return;

    if (!map.hasAttribute('data-kit-map-shown')) {
        room.querySelector('iframe')?.remove();
        if (!room.querySelector('.kit-map__picture')) room.insertAdjacentHTML('afterbegin', MAP_PICTURE);
        let show = room.querySelector('[data-kit-map-show]');
        if (!show) {
            show = doc.createElement('button');
            show.type = 'button';
            show.className = 'kit-map__show';
            show.setAttribute('data-kit-map-show', '');
            show.textContent = 'Show map';
            room.append(show);
        }
        if (show.getAttribute('aria-label') !== showMapName(address)) show.setAttribute('aria-label', showMapName(address));

        return;
    }

    const src = mapSrc(address);
    let frame = room.querySelector('iframe');
    if (!src) {
        frame?.remove();

        return;
    }
    if (!frame) {
        frame = doc.createElement('iframe');
        // pressed: wanted now
        frame.setAttribute('loading', 'eager');
        frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        frame.setAttribute('allowfullscreen', '');
        room.append(frame);
    }
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    if (frame.title !== `Map of ${address}`) frame.title = `Map of ${address}`;
}

/** Show map pressed: Google's map in place of the picture, in the same room, focus kept on the map. */
export function showMap(map) {
    if (!mapSrc(map.querySelector('[data-kit-map-address]')?.textContent ?? '')) return false;
    map.setAttribute('data-kit-map-shown', '');
    const room = map.querySelector('[data-kit-map-frame]');
    room?.querySelector('.kit-map__picture')?.remove();
    room?.querySelector('[data-kit-map-show]')?.remove();
    drawMap(map);
    room?.querySelector('iframe')?.focus?.();

    return true;
}

/** Every video and map on the page, made ready, and kept ready as the page changes (the editor, an adapter). */
export function start(doc = document) {
    if (doc.__kitEmbeds) return doc.__kitEmbeds;
    ensureLook(doc);

    const ready = (root) => {
        root.querySelectorAll?.('[data-kit-video] [data-kit-video-link]').forEach((link) => {
            // a press plays it; Space too, as a button does
            link.setAttribute('role', 'button');
        });
        root.querySelectorAll?.('[data-kit-map]').forEach(drawMap);
    };

    doc.addEventListener('click', (event) => {
        if (editing(doc) || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
        const link = event.target?.closest?.('[data-kit-video] [data-kit-video-link]');
        if (link && play(link)) event.preventDefault();
        const show = event.target?.closest?.('[data-kit-map] [data-kit-map-show]');
        if (show && showMap(show.closest('[data-kit-map]'))) event.preventDefault();
    });
    doc.addEventListener('keydown', (event) => {
        if (editing(doc) || event.key !== ' ') return;
        const link = event.target?.closest?.('[data-kit-video] [data-kit-video-link]');
        if (link && play(link)) event.preventDefault();
    });

    ready(doc);
    let queued = false;
    const observer = new (doc.defaultView?.MutationObserver ?? MutationObserver)((changes) => {
        if (queued) return;
        if (!changes.some((change) => change.target?.closest?.('[data-kit-map], [data-kit-video]') || [...(change.addedNodes ?? [])].some((node) => node.querySelector?.('[data-kit-map], [data-kit-video]') || node.matches?.('[data-kit-map], [data-kit-video]')))) return;
        queued = true;
        (doc.defaultView?.requestAnimationFrame ?? ((go) => setTimeout(go, 16)))(() => {
            queued = false;
            ready(doc);
        });
    });
    observer.observe(doc.body ?? doc.documentElement, { childList: true, subtree: true, characterData: true });
    doc.__kitEmbeds = { observer, ready };

    return doc.__kitEmbeds;
}

if (typeof document !== 'undefined' && !(typeof window !== 'undefined' && window.__kitEmbedsManual)) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => start(document), { once: true });
    else start(document);
}
