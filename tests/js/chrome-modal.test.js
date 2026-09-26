import { beforeEach, describe, expect, it } from 'vitest';
import { createChrome } from '../../resources/js/chrome.js';

/**
 * A dialog over somebody else's website.
 *
 * The things that are easy to forget here are the same every time, and each
 * one is the difference between a dialog and a trap: Escape closes it, the
 * darkened page behind closes it, and the keyboard lands inside it rather than
 * staying on whatever was behind. They are only worth writing once, which is
 * why there is one of these and not three, and this is what holds it to that.
 */
const chrome = () => {
    document.body.innerHTML = '';

    return createChrome({ api: {}, links: [] });
};

const openDialogs = (ui) => ui.shadow.querySelectorAll('.le-scrim');

describe('a dialog over the page', () => {
    let ui;

    beforeEach(() => {
        ui = chrome();
    });

    it('closes when Escape is pressed', () => {
        ui.modal({ title: 'Replace image' });

        expect(openDialogs(ui)).toHaveLength(1);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(openDialogs(ui)).toHaveLength(0);
    });

    it('closes when the darkened page behind it is clicked', () => {
        ui.modal({ title: 'Replace image' });

        ui.shadow.querySelector('.le-scrim').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

        expect(openDialogs(ui)).toHaveLength(0);
    });

    it('stays open when the click lands inside it', () => {
        // Otherwise choosing a photograph closes the thing you are choosing
        // it in.
        ui.modal({ title: 'Replace image' });

        ui.shadow.querySelector('.le-modal-body').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

        expect(openDialogs(ui)).toHaveLength(1);
    });

    it('refuses to be dismissed while something is in flight', () => {
        // A translation running, a publish in progress. Closing those halfway
        // is how somebody pays for something they never received.
        const sheet = ui.modal({ title: 'Translate', dismissable: false });

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        ui.shadow.querySelector('.le-scrim').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

        expect(openDialogs(ui)).toHaveLength(1);

        sheet.allowDismiss(true);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(openDialogs(ui)).toHaveLength(0);
    });

    it('stops listening once it has gone', () => {
        // A dialog that keeps a key handler after closing swallows the next
        // Escape, which is the one meant for the drawer behind it.
        const sheet = ui.modal({ title: 'Replace image' });
        sheet.close();
        sheet.close();

        ui.modal({ title: 'Publish' });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(openDialogs(ui)).toHaveLength(0);
    });

    it('carries a title and an optional subtitle', () => {
        const sheet = ui.modal({ title: 'Replace image', subtitle: 'Hero' });

        expect(ui.shadow.querySelector('.le-modal-title').textContent).toBe('Replace image');
        expect(ui.shadow.querySelector('.le-modal-sub').hidden).toBe(false);

        sheet.subtitle('');

        expect(ui.shadow.querySelector('.le-modal-sub').hidden).toBe(true);
    });
});
