// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { pageForTheChat } from '../../resources/js/chat-page.js';

/*
 * Found by the comprehensive audit on The Speaker's real pages (owner, 13 Nov 2026: "that's why i said you need a
 * comprehensive audit"): the menu bar's and the footer's parts said no place, the hidden home layouts' lists were sent,
 * and list items ran their words together.
 */
describe('Ask AI knows where the shared parts are', () => {
    document.body.innerHTML = `
        <header data-instance="site.header" data-label="Header"><a class="btn" href="/b" data-edit-href="setting:mh"><span data-edit="setting:m">Check a date</span></a></header>
        <dialog data-instance="site.menu" data-label="Menu" open><a href="/b"><span data-edit="setting:pm">Check a date and fees</span></a></dialog>
        <main>
          <div data-edit-list="sections" data-edit-list-kind="sections"><section data-edit-item="hero" data-edit-section="hero" data-edit-section-label="Jordan Reese"><h1 data-hero="headline" data-edit="setting:h">Jordan Reese</h1>
            <ul data-edit-list="fees" data-edit-list-label="Fees"><li data-edit-item="t1"><span>Virtual keynote</span><span>from</span></li></ul></section></div>
          <div data-edit-list="sections-2" data-edit-list-kind="sections" style="display:none"><section data-edit-item="hero2" data-edit-section="hero2" data-edit-section-label="Two minutes"><ul data-edit-list="btns2"><li data-edit-item="t1"><a href="/r">Play</a></li></ul></section></div>
        </main>
        <footer data-instance="site.footer" data-label="Footer"><p data-edit="setting:f">© 2026</p></footer>`;
    // jsdom draws nothing: what is "shown" is what has a box
    for (const el of document.querySelectorAll('[data-edit-list-kind="sections"]')) el.getClientRects = () => (el.style.display === 'none' ? [] : [{}]);

    it('names the menu bar, the phone menu and the footer as every page\'s', () => {
        const where = (key) => pageForTheChat(document).fields.find((f) => f.key === key)?.section;
        expect(where('m')).toBe('Menu bar at the top of every page');
        expect(where('pm')).toBe('Phone menu, on every page');
        expect(where('f')).toBe('Footer of every page');
    });

    it('sends no list of a layout not shown, and an item\'s words spaced', () => {
        const lists = pageForTheChat(document).lists;
        expect(lists.map((l) => l.key)).not.toContain('btns2');
        expect(lists.find((l) => l.key === 'fees').items[0].label).toBe('Virtual keynote from');
    });

    it('tells Ask AI an empty notice the design names, so it can be written', () => {
        // Adeola Crest School's closure notice: empty, so visitors do not see it, until the owner writes one
        const host = document.createElement('div');
        host.innerHTML = '<p class="notice" data-edit="setting:tpl:notice" data-label="Closure notice" data-instance="site.notice"></p><p data-edit="setting:tpl:blank"></p>';
        const fields = pageForTheChat(host).fields;
        expect(fields.find((f) => f.key === 'tpl:notice')).toMatchObject({ value: '', label: 'Closure notice' });
        expect(fields.some((f) => f.key === 'tpl:blank')).toBe(false);
    });
});
