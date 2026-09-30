import { describe, expect, it, beforeEach } from 'vitest';

/**
 * A card that is itself a link, with words inside it.
 *
 * The commonest card on a catalogue page: the whole tile is clickable, and
 * inside it are a couple of paragraphs and a button that is also a link.
 *
 * The mapper handles it correctly - the paragraphs get their own keys, and
 * the wrapping link gets an href key and no text key, because it has no words
 * of its own. What broke was reaching them: every click inside the card lands
 * inside the anchor, and a host with its own click listeners took the page
 * away before the drawer could open.
 *
 * Reported from a live site as "you detect the link but there is no way to
 * edit the text", which is exactly what that looks like from the outside.
 */
describe('clicking words inside a link-wrapped card', () => {
    let navigated;

    beforeEach(() => {
        navigated = [];
        document.body.innerHTML = `
            <a href="/courses/welding" data-edit-href="auto:card" id="card">
              <div>
                <p data-edit="setting:auto:one" id="words">Learn to weld</p>
                <a href="/enrol" data-edit="setting:auto:two" data-edit-href="auto:btn" id="btn">Enrol now</a>
              </div>
            </a>`;
    });

    /** The editor's rule: nearest editable wins, text before link. */
    const resolve = (node) =>
        node.closest('[data-edit]') ?? node.closest('[data-edit-href]:not([data-edit])');

    it('resolves a paragraph inside the card to the paragraph, not the card', () => {
        expect(resolve(document.getElementById('words')).id).toBe('words');
    });

    it('resolves the inner button to itself rather than the card', () => {
        expect(resolve(document.getElementById('btn')).id).toBe('btn');
    });

    it('resolves a click on the card itself to the card link', () => {
        expect(resolve(document.getElementById('card')).id).toBe('card');
    });

    it('stops a host listener navigating before the drawer opens', () => {
        /*
         * The fault, and why stopPropagation was not enough. It stops the
         * event reaching other NODES and leaves listeners already bound to
         * this one to run anyway. Livewire's wire:navigate binds to the
         * document exactly as the editor does, so the page went while the
         * editor was opening the paragraph.
         */
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest?.('a[href]');
            if (anchor) navigated.push(anchor.getAttribute('href'));
        });

        // The editor's own handler, registered after, on capture.
        document.addEventListener('click', (e) => {
            if (!resolve(e.target)) return;
            e.preventDefault();
            e.stopImmediatePropagation();
        }, true);

        document.getElementById('words').dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true })
        );

        expect(navigated).toEqual([]);
    });
})
