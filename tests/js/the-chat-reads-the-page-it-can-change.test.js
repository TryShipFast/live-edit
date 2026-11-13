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
            <header><a href="/"><img src="/a/oxbow.svg" alt="Oxbow & Hem" data-edit-img="setting:tpl:logo"></a></header>
            <section data-edit-section="hero" data-edit-section-label="Hero" data-style="shero">
                <h1 data-edit="setting:tpl:h1">Cut to fit.   Made to last.</h1>
                <a href="/women" data-edit-href="setting:tpl:cta">Shop women</a>
                <a href="/sale" data-edit="setting:tpl:sale.text" data-edit-href="setting:tpl:sale.href">See the sale</a>
                <img src="/a/jean-worn.jpg" alt="A woman laughing" data-edit-img="setting:tpl:photo">
                <p data-edit="auto:abc123">A guessed key the chat does not offer</p>
                <p data-edit="setting:tpl:lede">Free delivery over <strong data-edit="setting:tpl:over">₦50,000</strong> and 30-day returns.</p>
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
        // named with where it is, as an owner would say it ("Hero" is the designer's word for the top)
        expect(fields).toContainEqual({ key: 'tpl:h1', kind: 'text', value: 'Cut to fit. Made to last.', label: 'Heading at the top', section: 'Hero' });
        expect(fields).toContainEqual({ key: 'tpl:cta', kind: 'link', value: '/women', label: 'Shop women', section: 'Hero' });
        expect(fields).toContainEqual({ key: 'tpl:photo', kind: 'image', value: 'alt: A woman laughing', label: 'Photo at the top', section: 'Hero' });
    });

    it('gives a button its words and where it goes as two fields, each under its own key', () => {
        const { fields } = pageForTheChat(document);
        expect(fields).toContainEqual({ key: 'tpl:sale.text', kind: 'text', value: 'See the sale', label: '\u201CSee the sale\u201D button', section: 'Hero' });
        expect(fields).toContainEqual({ key: 'tpl:sale.href', kind: 'link', value: '/sale', label: 'See the sale', section: 'Hero' });
    });

    it('names the parts at the top as owners say them, and a clicked button as one part', () => {
        document.body.insertAdjacentHTML('afterbegin', `
            <section data-edit-section="top" data-edit-section-label="Jordan Reese">
                <h1 data-hero="headline" data-edit="setting:tpl:name">Jordan Reese</h1>
                <p data-hero="intro" data-field="lead" data-edit="setting:tpl:intro">Keynotes for sales kick-offs.</p>
                <p data-hero="intro" data-field="avail" data-edit="setting:tpl:avail">Booking January to September 2027</p>
            </section>`);
        const fields = pageForTheChat(document).fields;
        expect(fields.find((f) => f.key === 'tpl:name').label).toBe('Heading at the top');
        expect(fields.find((f) => f.key === 'tpl:intro').label).toBe('Paragraph at the top');
        expect(fields.find((f) => f.key === 'tpl:avail').label).toBe('Line under the paragraph at the top');
        expect(tappedForTheChat(document.querySelector('[data-edit="setting:tpl:intro"]'))).toEqual({ key: 'tpl:intro', kind: 'text', label: 'Paragraph at the top' });
        expect(tappedForTheChat(document.querySelector('[data-edit="setting:tpl:sale.text"]'))).toEqual({ key: 'tpl:sale.text', kind: 'text', label: '\u201CSee the sale\u201D button' });
    });

    it('tells the chat how each part may look, from the same list its panel offers', () => {
        window.liveEditStyleProps = { textColor: 'color', fontSize: 'px', paddingY: 'px', backgroundImage: 'url', hidden: 'toggle' };
        try {
            document.body.insertAdjacentHTML('beforeend', '<p data-edit="setting:tpl:styled" data-style="sstyled" data-style-props="textColor,fontSize,backgroundImage,radius">Big words</p>');
            const field = pageForTheChat(document).fields.find((f) => f.key === 'tpl:styled');
            // narrowed to what the site offers (radius is not), and never a picture or hiding
            expect(field.style_key).toBe('sstyled');
            expect(field.style).toEqual(['textColor', 'fontSize']);
        } finally {
            delete window.liveEditStyleProps;
        }
    });

    it('gives words around a formatted part as the panel holds them, the part on its own', () => {
        const { fields } = pageForTheChat(document);
        expect(fields.find((field) => field.key === 'tpl:lede').value).toBe('Free delivery over and 30-day returns.');
        expect(fields.find((field) => field.key === 'tpl:over').value).toBe('₦50,000');
    });

    it('calls the brand’s mark the logo, so the main photo is not mistaken for it', () => {
        const { fields } = pageForTheChat(document);
        expect(fields.find((field) => field.key === 'tpl:logo').label).toBe('Logo');
        expect(fields.find((field) => field.key === 'tpl:photo').label).toBe('Photo at the top');
    });

    it('leaves out locked parts, the editor itself and keys the engine guessed', () => {
        const keys = pageForTheChat(document).fields.map((field) => field.key);

        expect(keys).not.toContain('tpl:legal');
        expect(keys).not.toContain('tpl:ui');
        expect(keys.some((key) => key.startsWith('auto:'))).toBe(false);
        expect(pageForTheChat(document).sections.map((section) => section.id)).toEqual(['hero', 'faq']);
    });

    it('offers the page’s sections as a list, so a section is taken away with Delete as in the panel', () => {
        document.body.insertAdjacentHTML('beforeend', `
            <main data-edit-list="structure:page:home" data-edit-list-kind="sections">
                <div data-edit-item="s1" data-edit-section-label="Reviews"><p>Loved it</p></div>
                <div data-edit-item="s2"><section data-edit-section-label="Visit us"><p>Lagos</p></section></div>
            </main>`);
        const read = pageForTheChat(document);
        expect(read.sectionsList).toBe('structure:page:home');
        expect(read.lists.find((list) => list.key === 'structure:page:home')).toEqual({
            key: 'structure:page:home', label: 'Page sections', max: null,
            items: [{ id: 's1', label: 'Reviews' }, { id: 's2', label: 'Visit us' }],
        });
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

describe('links on the Kit templates', () => {
    it('offers a link whose address is marked by its bare key, as the editor saves it', () => {
        // owner, 13 Nov 2026, the coverage walk on The Speaker: no link was offered (1,127), marked data-edit-href="tpl:…"
        document.body.innerHTML = `
            <section data-edit-section="hero" data-edit-section-label="Hero">
                <a href="/booking/" data-edit-href="tpl:book" data-edit="setting:tpl:book.text">Check a date</a>
                <a href="/x/" data-edit-href="auto:guess">A guess</a>
            </section>`;
        const { fields } = pageForTheChat(document);

        expect(fields.find((f) => f.key === 'tpl:book')).toMatchObject({ kind: 'link', value: '/booking/' });
        expect(fields.find((f) => f.key === 'auto:guess')).toBeUndefined();
    });
});

describe('business details', () => {
    it('offers the business name and contacts as Brand has them, never one copy on the page', () => {
        // owner, 13 Nov 2026, the coverage walk: 181 business details on The Speaker would have changed one copy only
        window.liveEditBrand = { identity: { nameKey: 'brand.name', name: 'Jordan Reese', contacts: [
            { key: 'brand.phone', label: 'Phone', marker: 'data-brand-phone', value: '' },
            { key: 'brand.whatsapp', label: 'WhatsApp', marker: 'data-brand-whatsapp', value: '' },
        ] } };
        document.body.innerHTML = `
            <header><a href="/" data-brand-name data-edit="setting:tpl:name">Jordan Reese</a></header>
            <footer>
                <a href="tel:+2348030000137" data-brand-phone data-edit="setting:tpl:phone" data-edit-href="tpl:phone.href">+234 803 000 0137</a>
                <a href="tel:+2348030000137" data-brand-phone="link" data-edit="setting:tpl:call" data-edit-href="tpl:call.href">Call us</a>
            </footer>`;
        const { fields, business } = pageForTheChat(document);

        expect(fields.map((f) => f.key)).toEqual(['tpl:call']);
        expect(business).toEqual([
            { key: 'brand.name', label: 'Business name', value: 'Jordan Reese' },
            { key: 'brand.phone', label: 'Phone', value: '+234 803 000 0137' },
        ]);
        delete window.liveEditBrand;
    });
});
