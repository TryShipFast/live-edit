import { describe, expect, it } from 'vitest';
import { pageForTheChat } from '../../resources/js/chat-page.js';

/*
 * Chat replaces the mouse (owner, 13 Nov 2026: "the moat is chatting to replace mouse control"): "the paragraph under
 * the Book me button", "the one beside the photo" have to point at one part, as a click does. Each part is told what
 * is drawn above, below, left and right of it; two paragraphs in columns are beside each other, not one on the other.
 */
const place = (selector, top, left, width, height) => {
    document.querySelector(selector).getBoundingClientRect = () => ({ top, left, width, height, bottom: top + height, right: left + width, x: left, y: top });
};

describe('what the chat is told sits beside each part', () => {
    it('names the parts above, below, left and right as they are drawn', () => {
        document.body.innerHTML = `
            <section data-edit-section="talks" data-edit-section-label="Talks">
                <h2 data-edit="setting:tpl:h">Four keynotes</h2>
                <p data-edit="setting:tpl:left">Sales kick-offs that people remember on Monday</p>
                <p data-edit="setting:tpl:right">Leadership offsites with one question</p>
                <a href="/book" data-edit="setting:tpl:book" data-edit-href="setting:tpl:book.href">Book me</a>
                <p data-edit="setting:tpl:hidden">In a closed tab</p>
            </section>`;
        place('[data-edit="setting:tpl:h"]', 0, 0, 1000, 60);
        place('[data-edit="setting:tpl:left"]', 100, 0, 480, 80);
        place('[data-edit="setting:tpl:right"]', 100, 520, 480, 80);
        place('[data-edit="setting:tpl:book"]', 220, 0, 160, 44);
        // not drawn: no neighbours, and nobody's neighbour

        const { fields } = pageForTheChat(document);
        const near = (key) => fields.find((f) => f.key === key)?.near;

        expect(near('tpl:left')).toEqual({ above: 'Heading in Talks “Four keynotes”', below: '“Book me” button', right: 'Paragraph in Talks “Leadership offsites with on…”' });
        expect(near('tpl:right')).toEqual({ above: 'Heading in Talks “Four keynotes”', left: 'Paragraph in Talks “Sales kick-offs that people…”' });
        expect(near('tpl:book').above).toBe('Paragraph in Talks “Sales kick-offs that people…”');
        // the button's link is the same part, with the same neighbours
        expect(near('tpl:book.href')).toEqual(near('tpl:book'));
        expect(near('tpl:hidden')).toBeUndefined();
    });
});
