import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LiveEditMap, LiveEditVideo } from '../../packages/react/src/index.js';
import { LiveEditProvider } from '../../packages/react/src/provider.js';

/*
 * A video from YouTube or Vimeo and a map to an address on React and Next.js: the same markup and markers as every
 * other adapter (so the editor's Video and Map panels change them), the saved values used, nothing from YouTube loaded
 * before play is pressed, and the map's frame lazy and named.
 */
describe('a video and a map, in React', () => {
    afterEach(() => {
        cleanup();
        document.body.className = '';
    });

    it('a video shows its cover and title, carries the markers, and plays only when pressed', () => {
        const { container } = render(<LiveEditVideo contentKey="homeVideo" link="https://youtu.be/dQw4w9WgXcQ" title="Our story" cover="/story.jpg" />);
        const link = container.querySelector('[data-kit-video] [data-kit-video-link]');
        expect(link.getAttribute('data-edit-href')).toBe('setting:homeVideo.link');
        expect(container.querySelector('[data-kit-video-cover]').getAttribute('data-edit-img')).toBe('setting:homeVideo.cover');
        expect(container.querySelector('[data-kit-video-title]').getAttribute('data-edit')).toBe('setting:homeVideo.title');
        expect(link.textContent).toBe('Play: Our story');
        expect(container.querySelector('iframe')).toBeNull();

        // the test's browser never follows a link (no network in tests): the editor's own press handling is what is checked
        container.addEventListener('click', (event) => event.preventDefault(), true);
        document.body.classList.add('editing');
        fireEvent.click(link);
        expect(container.querySelector('iframe')).toBeNull();
        document.body.classList.remove('editing');

        fireEvent.click(link);
        expect(container.querySelector('iframe').getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
        expect(container.querySelector('iframe').getAttribute('title')).toBe('Our story');
    });

    it('a saved link, title and address are what is drawn', () => {
        const { container } = render(
            <LiveEditProvider site="acme" apiBase="https://cms.test/api/live-edit/v1" publishableKey="kbp_x"
                content={{ 'homeVideo.link': 'https://vimeo.com/76979871', 'homeVideo.title': 'The Mountain', 'visit.address': 'Lekki Phase 1, Lagos' }}>
                <LiveEditVideo contentKey="homeVideo" link="https://youtu.be/dQw4w9WgXcQ" title="Our story" />
                <LiveEditMap contentKey="visit" address="12 Allen Avenue, Ikeja" />
            </LiveEditProvider>,
        );
        expect(container.querySelector('[data-kit-video-title]').textContent).toBe('The Mountain');
        fireEvent.click(container.querySelector('[data-kit-video-link]'));
        expect(container.querySelector('[data-kit-video] iframe').getAttribute('src')).toBe('https://player.vimeo.com/video/76979871?dnt=1&autoplay=1');

        // nothing of Google's until Show map is pressed
        expect(container.querySelector('[data-kit-map-frame] iframe')).toBeNull();
        expect(container.querySelector('[data-kit-map-frame] svg.kit-map__picture')).not.toBeNull();
        const show = container.querySelector('button[data-kit-map-show]');
        expect(show.getAttribute('aria-label')).toBe('Show map of Lekki Phase 1, Lagos');
        expect(container.querySelector('.kit-map__note').textContent).toBe('The map loads from Google when you press Show map.');
        fireEvent.click(show);
        const frame = container.querySelector('[data-kit-map-frame] iframe');
        expect(frame.getAttribute('src')).toBe('https://maps.google.com/maps?q=Lekki%20Phase%201%2C%20Lagos&output=embed');
        expect(frame.getAttribute('loading')).toBe('eager');
        expect(container.querySelector('[data-kit-map-show]')).toBeNull();
        expect(frame.getAttribute('title')).toBe('Map of Lekki Phase 1, Lagos');
        const go = container.querySelector('[data-kit-map-directions]');
        expect(go.getAttribute('href')).toBe('https://www.google.com/maps/dir/?api=1&destination=Lekki%20Phase%201%2C%20Lagos');
        expect(go.getAttribute('target')).toBe('_blank');
        expect(go.textContent).toBe('Get directions');
        expect(container.querySelector('[data-kit-map-address]').getAttribute('data-edit')).toBe('setting:visit.address');
    });
});
