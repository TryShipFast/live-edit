import { describe, expect, it, vi } from 'vitest';
import { interactiveTarget, nameOfControl } from '../../resources/js/support.js';
import { watchForLateContent } from '../../resources/js/autotag.js';

/**
 * A testimonial slider, and the two separate reasons it could not be edited.
 *
 * Reported as "it can't detect testimonials on slides". Detection was never
 * the problem - measured on a real page, a slide that arrived was noticed and
 * keyed within seconds. Two other things were:
 *
 * One, the slider could not be worked at all. Editing swallows every click, so
 * the Next arrow did nothing and four of the five testimonials could not be
 * brought on screen in the first place.
 *
 * Two, and worse: every testimonial is rendered into the same node, so a name
 * taken from position gives all five of them one key. Measured - slide one and
 * slide two both came back as setting:auto:86ee3457c4e9. Editing the second
 * would not have sat beside the first, it would have replaced it, and then
 * shown under whichever slide was on screen. "Cannot edit" is a complaint;
 * "edited the wrong one, silently" is a bug somebody finds months later.
 */
const settle = (ms = 900) => new Promise((r) => setTimeout(r, ms));

describe('reaching a slide at all', () => {
    it('offers to run a carousel arrow, which announces itself as nothing', () => {
        // The reported control, copied from the page: no aria-controls, no
        // aria-expanded, no data-toggle, no role. Just a button.
        document.body.innerHTML = '<button aria-label="Next testimonial"><svg></svg></button>';
        const arrow = document.querySelector('svg');

        expect(interactiveTarget(arrow)).toBe(document.querySelector('button'));
    });

    it('still offers to run the menus it always did', () => {
        document.body.innerHTML = '<button aria-expanded="false">Menu</button>';

        expect(interactiveTarget(document.querySelector('button'))).not.toBeNull();
    });

    it('refuses to run a button that would post a form', () => {
        /*
         * A submit button reveals nothing - it sends somebody's half-filled
         * sign-in and leaves the page. Offering to press it is offering to
         * lose their work.
         */
        document.body.innerHTML = '<form><input name="email"><button>Sign in</button></form>';

        expect(interactiveTarget(document.querySelector('button'))).toBeNull();
    });

    it('runs a plain button inside a form, which is not a submit', () => {
        document.body.innerHTML = '<form><button type="button" aria-label="Show password">eye</button></form>';

        expect(interactiveTarget(document.querySelector('button'))).not.toBeNull();
    });

    it('names the button after the control it runs', () => {
        document.body.innerHTML = '<button aria-label="Next testimonial"></button>';

        expect(nameOfControl(document.querySelector('button'))).toBe('Next testimonial');
    });

    it('says nothing rather than quoting a paragraph back', () => {
        // A role=button on a whole card has a great deal of text in it, and
        // none of it belongs on a chip.
        document.body.innerHTML = '<div role="button">' + 'word '.repeat(40) + '</div>';

        expect(nameOfControl(document.querySelector('div'))).toBe('');
    });
});

describe('content that took another\'s place', () => {
    const slider = () => {
        document.body.innerHTML = '<section><div id="stage">'
            + '<p data-edit="setting:auto:86ee3457c4e9">NewBanger got my single onto 12 playlists</p>'
            + '</div></section>';

        return document.querySelector('#stage');
    };

    it('marks a slide that replaced a keyed slide', async () => {
        const stage = slider();
        watchForLateContent(document, () => {});

        // What React does with key={current.name}: the old one out, a new one
        // in, on the same parent.
        stage.querySelector('p').remove();
        const next = document.createElement('p');
        next.textContent = 'I have tried other promotion services and got nothing';
        stage.append(next);

        await settle();

        expect(next.getAttribute('data-kb-swaps')).toBe('1');
    });

    it('leaves content that merely arrived alone', async () => {
        /*
         * A menu building itself, a comment thread loading, a section
         * appearing on scroll. Nothing was displaced, so position is still a
         * perfectly good name and the cheaper one.
         */
        slider();
        watchForLateContent(document, () => {});

        const panel = document.createElement('div');
        panel.innerHTML = '<a>Promote</a><a>Curators</a>';
        document.body.append(panel);

        await settle();

        expect(panel.hasAttribute('data-kb-swaps')).toBe(false);
    });

    it('does not call it a swap when what left was never keyed', async () => {
        // A spinner being swapped for the content it was standing in for is
        // one piece of content, not two.
        const stage = slider();
        const spinner = document.createElement('div');
        stage.append(spinner);

        await settle(50);
        watchForLateContent(document, () => {});

        spinner.remove();
        const arrived = document.createElement('p');
        arrived.textContent = 'Loaded at last';
        stage.append(arrived);

        await settle();

        expect(arrived.hasAttribute('data-kb-swaps')).toBe(false);
    });

    it('still asks to be tagged once it has marked the swap', async () => {
        const stage = slider();
        const onFound = vi.fn();
        watchForLateContent(document, onFound);

        stage.querySelector('p').remove();
        const next = document.createElement('p');
        next.textContent = 'A different testimonial entirely';
        stage.append(next);

        await settle();

        expect(onFound).toHaveBeenCalledTimes(1);
        expect(next.getAttribute('data-kb-swaps')).toBe('1');
    });
});
