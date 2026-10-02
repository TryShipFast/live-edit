import { describe, expect, it, vi } from 'vitest';
import { watchForLateContent } from '../../resources/js/autotag.js';

/**
 * A menu that is built when it opens, and a slide that is not showing yet.
 *
 * Reported from a real site: the parent links of a mega menu were editable and
 * nothing inside it was, and of a set of testimonials only whichever one
 * happened to be on screen at page load could be changed. Both are ordinary
 * ways to build a website, and neither is visible to a scanner reading the
 * markup that was sent.
 *
 * There was already a watcher for backgrounds arriving late - the right shape,
 * asking again once the page has changed - but it only ever noticed pictures.
 * A menu full of new words went unseen.
 *
 * The guards are the part worth testing. A page that re-tags on every mutation
 * is worse than one that misses a menu: each ask sends the page's own markup
 * back over the wire, a third of a megabyte on a real site.
 */
const settle = (ms = 900) => new Promise((r) => setTimeout(r, ms));

const page = () => {
    document.body.innerHTML = '<nav><a data-edit="setting:auto:home">Home</a></nav>';

    return document;
};

describe('words that arrive late', () => {
    it('asks again when a menu fills itself in', async () => {
        const doc = page();
        const onFound = vi.fn();
        watchForLateContent(doc, onFound);

        const panel = doc.createElement('div');
        panel.innerHTML = '<a>Promote</a><a>Curators</a><a>Pricing</a>';
        doc.querySelector('nav').append(panel);

        await settle();

        expect(onFound).toHaveBeenCalledTimes(1);
    });

    it('treats a burst of changes as one ask', async () => {
        /*
         * A menu opening is a burst of mutations and a carousel is a stream of
         * them. Asking on the first one asks about half a menu, and asking on
         * each is thirty requests for one gesture.
         */
        const doc = page();
        const onFound = vi.fn();
        watchForLateContent(doc, onFound);

        for (let i = 0; i < 20; i++) {
            const slide = doc.createElement('div');
            slide.textContent = `Testimonial ${i}`;
            doc.body.append(slide);
        }

        await settle();

        expect(onFound).toHaveBeenCalledTimes(1);
    });

    it('says nothing when what appeared holds no words', async () => {
        // A wrapper, a spacer, a class flipping on an element already marked.
        // None of it is anything to ask about, and asking costs a request.
        const doc = page();
        const onFound = vi.fn();
        watchForLateContent(doc, onFound);

        doc.body.append(doc.createElement('div'));
        doc.body.append(doc.createElement('span'));

        await settle();

        expect(onFound).not.toHaveBeenCalled();
    });

    it('says nothing when what appeared is already marked', async () => {
        const doc = page();
        const onFound = vi.fn();
        watchForLateContent(doc, onFound);

        const already = doc.createElement('p');
        already.setAttribute('data-edit', 'setting:auto:known');
        already.textContent = 'Already editable';
        doc.body.append(already);

        await settle();

        expect(onFound).not.toHaveBeenCalled();
    });

    it('notices a picture that arrives with no words beside it', async () => {
        const doc = page();
        const onFound = vi.fn();
        watchForLateContent(doc, onFound);

        const shot = doc.createElement('img');
        shot.src = '/late.jpg';
        doc.body.append(shot);

        await settle();

        expect(onFound).toHaveBeenCalledTimes(1);
    });

    it('stops asking rather than following a page that rebuilds forever', async () => {
        /*
         * A ticker, a live feed, a page that re-renders on a timer. It must
         * not spend somebody's afternoon posting their own markup back to us.
         */
        const doc = page();
        const onFound = vi.fn();
        watchForLateContent(doc, onFound);

        for (let round = 0; round < 14; round++) {
            const item = doc.createElement('p');
            item.textContent = `Update ${round}`;
            doc.body.append(item);
            await settle();
        }

        expect(onFound.mock.calls.length).toBeLessThanOrEqual(10);
    }, 30000);
});

describe('asking again once the words are there', () => {
    it('does not answer "already prepared" about a menu that just appeared', async () => {
        /*
         * The guard inside autoTag asks one question - is there a picture we
         * have written down and not yet keyed - and says "nothing to do" for
         * everything else. Right while a background was the only thing that
         * could arrive late; wrong the moment words can.
         *
         * Measured on a live site: the menu items were genuinely absent at
         * tagging time, the watcher noticed them arrive and asked, and this
         * guard sent it away while three new links sat there uneditable.
         */
        const { autoTag } = await import('../../resources/js/autotag.js');

        document.body.innerHTML = '<p data-edit="setting:auto:known">Already prepared</p>'
            + '<nav><a>Playlist Promotion</a></nav>';

        const fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ elements: [] }),
        });
        vi.stubGlobal('fetch', fetch);

        // Without a reason: the page looks prepared, so nothing is asked.
        await autoTag({ base: 'https://x/api', site: 'acme', key: 'kbp_x', page: '/' }, document);
        expect(fetch).not.toHaveBeenCalled();

        // With one: the page has changed, and it asks.
        await autoTag({ base: 'https://x/api', site: 'acme', key: 'kbp_x', page: '/' }, document, { because: 'new content' });
        expect(fetch).toHaveBeenCalledTimes(1);

        vi.unstubAllGlobals();
    });
});
