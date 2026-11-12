import { describe, expect, it, beforeEach } from 'vitest';
import { pageForTheChat, tappedForTheChat } from '../../resources/js/chat-page.js';

/*
 * The editor chat (LIVE-EDIT-STRUCTURE.md section 13) tells the assistant what the owner can change on the page in
 * front of them, read from the editor's own markers, so it works on every adapter. A locked part is never offered.
 */
describe('the page the chat sends', () => {
    beforeEach(() => {
        document.title = 'Oxbow & Hem';
        document.body.innerHTML = `
            <section data-edit-section="hero" data-edit-section-label="Hero" data-style="shero">
                <h1 data-edit="setting:tpl:h1">Cut to fit.   Made to last.</h1>
                <a href="/women" data-edit-href="setting:tpl:cta">Shop women</a>
                <img src="/a/jean-worn.jpg" alt="A woman laughing" data-edit-img="setting:tpl:photo">
                <p data-edit="auto:abc123">A guessed key the chat does not offer</p>
            </section>
            <section data-edit-section="faq" data-edit-section-label="Questions" data-style="sfaq">
                <ul data-edit-list="tpl:faq" data-edit-list-label="Questions" data-edit-list-max="6">
                    <li data-edit-item="q1"><span data-edit="setting:tpl:q1">Do you deliver?</span></li>
                    <li data-edit-item="q2"><span data-edit="setting:tpl:q2">Can I return?</span></li>
                </ul>
            </section>
            <footer data-live-lock>
                <p data-edit="setting:tpl:legal">Company number 123</p>
                <section data-edit-section="lockedsec" data-edit-section-label="Legal"></section>
            </footer>
            <div id="live-edit-ui"><span data-edit="setting:tpl:ui">The editor's own words</span></div>
        `;
    });

    it('lists the words, links and photos with what they are and where they sit', () => {
        const { page, fields } = pageForTheChat(document);

        expect(page.title).toBe('Oxbow & Hem');
        expect(fields).toContainEqual({ key: 'tpl:h1', kind: 'text', value: 'Cut to fit. Made to last.', label: 'Heading', section: 'Hero' });
        expect(fields).toContainEqual({ key: 'tpl:cta', kind: 'link', value: '/women', label: 'Shop women', section: 'Hero' });
        expect(fields).toContainEqual({ key: 'tpl:photo', kind: 'image', value: 'alt: A woman laughing', label: 'Photo', section: 'Hero' });
    });

    it('leaves out locked parts, the editor itself and keys the engine guessed', () => {
        const keys = pageForTheChat(document).fields.map((field) => field.key);

        expect(keys).not.toContain('tpl:legal');
        expect(keys).not.toContain('tpl:ui');
        expect(keys.some((key) => key.startsWith('auto:'))).toBe(false);
        expect(pageForTheChat(document).sections.map((section) => section.id)).toEqual(['hero', 'faq']);
    });

    it('gives each list its items and the most its design holds', () => {
        expect(pageForTheChat(document).lists).toEqual([{
            key: 'tpl:faq', label: 'Questions', max: 6,
            items: [{ id: 'q1', label: 'Do you deliver?' }, { id: 'q2', label: 'Can I return?' }],
        }]);
    });

    it('says what was tapped, and nothing for a locked part', () => {
        expect(tappedForTheChat(document.querySelector('h1'))).toEqual({ key: 'tpl:h1', kind: 'text', label: 'Heading' });
        expect(tappedForTheChat(document.querySelector('[data-live-lock] p'))).toBeNull();
    });
});
