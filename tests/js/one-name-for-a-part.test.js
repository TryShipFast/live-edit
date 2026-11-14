// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { partName } from '../../resources/js/part-name.js';
import { pageForTheChat } from '../../resources/js/chat-page.js';

/*
 * Owner, 13 Nov 2026: "how come we are using another nomenclature"; "why not ai ask and voice follow same pattern".
 * The panel had called The Speaker's hero paragraph "Introduction" while Ask AI called it "Paragraph at the top".
 * One name, from part-name.js, for the panel, the page's label, Ask AI and voice.
 */
describe('one name for a part, wherever the owner meets it', () => {
    document.body.innerHTML = `<main><section data-label="Hero">
        <h1 data-hero="headline" data-edit="setting:h" data-field="display">Jordan Reese</h1>
        <p data-hero="intro" data-edit="setting:p" data-field="lead">Keynotes for sales kick-offs.</p>
        <a class="btn" href="/book"><span data-edit="setting:b" data-field="text">Book Jordan</span></a>
        <p data-edit="setting:price" data-field="price">N22,000</p>
        <p data-edit="setting:body" data-field="body">Signed to the name you give.</p>
        <h2 data-edit="setting:h2" data-field="title">Talks</h2>
        <img data-edit-img="setting:img" data-field="photo" src="a.jpg" alt="On stage">
    </section></main>`;

    it('names each part by what it is, never the designer\'s word for how it reads', () => {
        const name = (key) => partName(document.querySelector(`[data-edit="setting:${key}"], [data-edit-img="setting:${key}"]`));
        expect(name('p')).toBe('Paragraph at the top');
        expect(name('h')).toBe('Heading at the top');
        expect(name('b')).toBe('“Book Jordan” button');
        expect(name('price')).toBe('Price');
        expect(name('body')).toBe('Paragraph');
        expect(name('h2')).toBe('Heading');
        expect(name('img')).toBe('Photo');
    });

    it('calls a link drawn as words a link, and one drawn as a button a button', () => {
        // owner, 14 Nov 2026: a keynote's name in The Speaker's table was called a "button" in its link panel
        const host = document.createElement('div');
        host.innerHTML = '<a href="/k"><span data-edit="setting:k">Hard Rooms</span></a><a class="btn" href="/b"><span data-edit="setting:b">Book now</span></a>';
        expect(partName(host.querySelector('[data-edit="setting:k"]'))).toBe('\u201CHard Rooms\u201D link');
        expect(partName(host.querySelector('[data-edit="setting:b"]'))).toBe('\u201CBook now\u201D button');
    });

    it('gives Ask AI and voice the same name the editor shows', () => {
        const fields = pageForTheChat(document).fields;
        for (const [key, said] of [['p', 'Paragraph at the top'], ['h', 'Heading at the top'], ['b', '“Book Jordan” button'], ['price', 'Price']]) {
            expect(fields.find((field) => field.key === key)?.label).toBe(said);
        }
    });
});

describe('Ask AI is told the name a click shows', () => {
    // owner, 14 Nov 2026: "the ai ask only needs to learn how the live edit gets the labels when click and replicate
    // same when texted": the panel's title (clickedName) is where every label Ask AI is told starts
    it('names every part on a page as its panel does', async () => {
        const { clickedName } = await import('../../resources/js/part-name.js');
        document.body.innerHTML = `<main><section data-edit-section="s1" data-edit-section-label="Fees"><h2 data-edit="setting:a">Fees</h2>
            <p data-edit="setting:b" data-field="lead">From ₦8,000,000</p><span data-edit="setting:c">Sample line</span>
            <ul data-edit-list="tpl:r" data-edit-list-label="Reviews"><li data-edit-item="t1"><p data-edit="setting:d">Loved it</p></li></ul>
            <a href="/x" data-edit="setting:e">All fees</a><a class="btn" href="/y"><span data-edit="setting:f">Book</span></a>
            <img data-edit-img="setting:g" src="a.jpg" alt="Stage"></section></main>`;
        for (const field of pageForTheChat(document).fields) {
            const element = document.querySelector(`[data-edit="setting:${field.key}"], [data-edit-img="setting:${field.key}"]`);
            if (!element || field.kind === 'link') continue;
            expect(field.label.startsWith(clickedName(element))).toBe(true);
        }
    });
});
