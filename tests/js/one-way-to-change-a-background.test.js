import { describe, expect, it } from 'vitest';
import { stylePropsFor } from '../../resources/js/support.js';

/**
 * Two "Replace background" buttons in one panel.
 *
 * Seen on a real sign-in page: a section keyed for its background opened with
 * its own Background image editor at the top - preview, credit, Remove - and
 * then offered backgroundImage again down in Style, with a second button
 * carrying the same words.
 *
 * They are not the same button. The style one writes
 * `background-image:url(...) !important`, which outranks whatever the editor
 * above stores. So somebody who uses the style control once and the top
 * control afterwards changes the picture, is told it saved, and watches the
 * old one stay on the page with nothing on screen explaining why.
 *
 * The style control is kept everywhere else, because on an element with no
 * background of its own it is the only way to put one there.
 */
const element = (html) => {
    document.body.innerHTML = html;

    return document.body.firstElementChild;
};

const EVERY_PROP = ['background', 'backgroundImage', 'textColor', 'fontSize', 'paddingX', 'paddingY', 'radius', 'hidden'];

describe('one way to change a background', () => {
    it('does not offer the style control on a section that has its own editor', () => {
        // The reported case.
        const section = element('<section data-edit-bg="setting:auto:3e5b1b7e" data-background="/hero.jpg"></section>');

        expect(stylePropsFor(section, EVERY_PROP)).not.toContain('backgroundImage');
    });

    it('keeps every other style control on that same section', () => {
        /*
         * The duplicate is one control too many, not a reason to take the
         * Style section away from a section that still needs its padding and
         * its background colour.
         */
        const section = element('<section data-edit-bg="setting:auto:3e5b1b7e" data-background="/hero.jpg"></section>');

        expect(stylePropsFor(section, EVERY_PROP))
            .toEqual(['background', 'paddingX', 'paddingY', 'radius', 'hidden']);
    });

    it('does not offer to replace a background that is not there', () => {
        /*
         * Reported looking at a Group on a real page: the heading BACKGROUND
         * IMAGE, a Replace background button, and under it the words "No image
         * set". A panel that asks about things that do not exist is a panel
         * somebody stops reading.
         */
        const group = element('<div><p>5+</p><p>Artists on the platform</p></div>');

        expect(stylePropsFor(group, EVERY_PROP)).not.toContain('backgroundImage');
    });

    it('offers it on a picture nothing else is already changing', () => {
        // A background that exists and was never keyed: here the style control
        // is not a duplicate, it is the only way in.
        const section = element('<section data-background="/hero.jpg"></section>');

        expect(stylePropsFor(section, EVERY_PROP)).toContain('backgroundImage');
    });

    it('offers a heading what suits a heading', () => {
        const heading = element('<h1>Glad to see you again</h1>');

        expect(stylePropsFor(heading, EVERY_PROP)).toEqual(['textColor', 'fontSize', 'hidden']);
    });

    it('offers a picture only what can be done to a picture', () => {
        const picture = element('<img src="/hero.jpg" alt="">');

        expect(stylePropsFor(picture, EVERY_PROP)).toEqual(['radius', 'hidden']);
    });

    it('offers a button its own colours', () => {
        const link = element('<a href="/pricing">Sign in</a>');

        expect(stylePropsFor(link, EVERY_PROP))
            .toEqual(['background', 'textColor', 'fontSize', 'radius', 'hidden']);
    });

    it('narrows to what was declared rather than inventing controls', () => {
        // A site that publishes a short vocabulary gets a short panel.
        const section = element('<section></section>');

        expect(stylePropsFor(section, ['background', 'fontSize'])).toEqual(['background']);
    });
});
