/**
 * A site's dialogs open in place while editing, not as modal ones.
 *
 * Most templates open their phone menu (and a photo lightbox) with
 * `dialog.showModal()`. A modal dialog is drawn in the browser's top layer,
 * above the editor, and makes everything outside it inert, the editor
 * included: the owner could open the menu but not save a word in it, nor use
 * the bar at all until it was closed. Found by the Live Edit walk on 37 of 43
 * templates.
 *
 * Wherever the editor runs, `showModal()` opens the dialog with `show()`
 * instead: it is still open (`open`, the site's own close button and `close`
 * event all work), placed as a modal one would be, but under the editor and not
 * making the page inert. Not only while editing: a menu opened while previewing
 * made the bar inert too, so editing could not even be turned back on. A
 * dialog already open as a modal one is reopened the same way. A visitor never
 * meets any of this: the editor only runs for the site's owner.
 */

export const IN_PLACE = 'data-le-in-place';

/*
 * Where a modal dialog would sit, as the browser's own stylesheet places it, at
 * no specificity: any rule of the site's own (a full-screen menu's width,
 * height and margin) still wins, exactly as it wins over the browser's.
 */
const STYLE = `:where(dialog[${IN_PLACE}][open]) {
  position: fixed; inset: 0; margin: auto; z-index: 2147482000;
  max-width: calc(100% - 6px - 2em); max-height: calc(100% - 6px - 2em); overflow: auto;
}`;

/** Open `dialog` in place: shown, marked so it is placed like a modal one. */
const openInPlace = (dialog) => {
    dialog.setAttribute(IN_PLACE, '');
    if (!dialog.open) dialog.show();
};

/**
 * Patch `showModal` in `win` so it opens in place. Returns `reopen`, which
 * reopens in place any modal dialog already open (one the site opened before
 * the editor arrived); it runs once here.
 */
export const openDialogsInPlace = ({ win = window } = {}) => {
    const proto = win.HTMLDialogElement?.prototype;
    if (!proto || proto.showModal?.inPlace) return () => {};
    const doc = win.document;
    const style = doc.createElement('style');
    style.dataset.liveEdit = 'dialogs-in-place';
    style.textContent = STYLE;
    (doc.head ?? doc.documentElement).append(style);

    const patched = function () {
        // As showModal does: an open non-modal dialog cannot be made modal, and says so.
        if (this.open && !this.hasAttribute(IN_PLACE)) throw new win.DOMException('The dialog is already open.', 'InvalidStateError');
        openInPlace(this);
    };
    patched.inPlace = true;
    proto.showModal = patched;
    // The close event arrives after the fact: a dialog closed and reopened at once (reopen, below) is open again by then.
    doc.addEventListener('close', (event) => { if (!event.target?.open) event.target?.removeAttribute?.(IN_PLACE); }, true);

    const reopen = () => {
        for (const dialog of doc.querySelectorAll('dialog[open]')) {
            if (!dialog.matches(':modal')) continue;
            // Closed and shown again at once, so the site's close handler sees an ordinary close and open.
            dialog.close();
            openInPlace(dialog);
        }
    };
    reopen();

    return reopen;
};
