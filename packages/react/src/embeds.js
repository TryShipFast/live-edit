import { createElement as h, useState } from 'react';
import { useContent } from './useContent.js';
import { directionsFor, mapSrc, playerFor } from './embed-links.js';

/*
 * A video from YouTube or Vimeo, and a map to an address, for React and Next.js (LIVE-EDIT-STRUCTURE.md, "A video from
 * YouTube or Vimeo" and "A map to an address" in the Go Live repository; the engine's resources/js/embeds.js).
 *
 * The same markup and markers as every other adapter, so the editor's Video and Map panels change them here too, and
 * the same behaviour as the script other adapters load (kit-embeds.js), done by React: nothing from YouTube or Vimeo
 * loads before the visitor presses play, and the map is Google's keyless embed, loaded lazily.
 *
 *   <LiveEditVideo contentKey="homeVideo" link="https://youtu.be/…" title="Our story" cover="/story.jpg" />
 *   <LiveEditMap contentKey="visit" address="12 Allen Avenue, Ikeja" />
 *
 * Each part is a value of its own under the key: `<key>.link`, `.cover`, `.title`, `.caption` for a video;
 * `<key>.address`, `.directions` (where the button goes) and `.directions.text` (its words) for a map. The look is
 * the stylesheet the engine ships (resources/dist/kit-embeds.css), or the page's own.
 */

const marker = (key) => `setting:${key}`;

const editing = () => typeof document !== 'undefined' && document.body?.classList.contains('editing');

export function LiveEditVideo({ contentKey, link = '', title = 'Video', cover = '', caption = '', className = '' }) {
    const href = useContent(`${contentKey}.link`, link);
    const picture = useContent(`${contentKey}.cover`, cover);
    const named = useContent(`${contentKey}.title`, title);
    const words = useContent(`${contentKey}.caption`, caption);
    const [playing, setPlaying] = useState(false);
    const player = playerFor(href);

    const press = (event) => {
        if (editing() || !player || event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        setPlaying(true);
    };

    const frame = playing && player
        ? h('div', { className: 'kit-video__frame is-playing', 'data-kit-video-playing': '' },
            h('iframe', { src: player, title: named || 'Video', allow: 'autoplay; fullscreen; picture-in-picture; encrypted-media', allowFullScreen: true, referrerPolicy: 'strict-origin-when-cross-origin' }))
        : h('a', {
            className: 'kit-video__frame',
            href,
            target: '_blank',
            rel: 'noopener',
            role: 'button',
            'data-kit-video-link': '',
            'data-edit-href': marker(`${contentKey}.link`),
            onClick: press,
            onKeyDown: (event) => { if (event.key === ' ') press(event); },
        },
        h('img', { className: 'kit-video__cover', src: picture, alt: '', width: 1280, height: 720, loading: 'lazy', decoding: 'async', 'data-kit-video-cover': '', 'data-edit-img': marker(`${contentKey}.cover`) }),
        h('span', { className: 'kit-video__shade', 'aria-hidden': 'true' }),
        h('span', { className: 'kit-video__sr' }, 'Play: '),
        h('span', { className: 'kit-video__title', 'data-kit-video-title': '', 'data-edit': marker(`${contentKey}.title`) }, named),
        h('span', { className: 'kit-video__play', 'aria-hidden': 'true' },
            h('svg', { viewBox: '0 0 24 24', focusable: 'false' }, h('path', { d: 'M8 5v14l11-7z' }))));

    return h('figure', { className: `kit-video__figure ${className}`.trim(), 'data-kit-video': '' },
        frame,
        h('figcaption', { className: 'kit-video__caption', 'data-kit-video-caption': '', 'data-edit': marker(`${contentKey}.caption`) }, words));
}

export function LiveEditMap({ contentKey, address = '', button = 'Get directions', className = '' }) {
    const place = useContent(`${contentKey}.address`, address);
    const words = useContent(`${contentKey}.directions.text`, button);
    const src = mapSrc(place);

    return h('div', { className: `kit-map__figure ${className}`.trim(), 'data-kit-map': '' },
        h('div', { className: 'kit-map__frame', 'data-kit-map-frame': '' },
            src ? h('iframe', { src, title: `Map of ${place}`, loading: 'lazy', referrerPolicy: 'no-referrer-when-downgrade', allowFullScreen: true }) : null),
        h('div', { className: 'kit-map__bar' },
            h('p', { className: 'kit-map__address', 'data-kit-map-address': '', 'data-edit': marker(`${contentKey}.address`) }, place),
            h('a', {
                className: 'kit-map__directions',
                href: directionsFor(place) ?? '#',
                target: '_blank',
                rel: 'noopener',
                'data-kit-map-directions': '',
                'data-edit-href': marker(`${contentKey}.directions`),
                'data-edit': marker(`${contentKey}.directions.text`),
            }, words)));
}
