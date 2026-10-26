// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { insertionAtEnd, insertionNear, sectionName, sectionUnder, shownSectionLists, shownSections } from '../../resources/js/section-inserter.js';

/*
 * "Adding more sections to the page: we currently have that on the new page and
 * not the existing ones." The page says "+ Add a section" where one would go:
 * on the line between the two sections nearest the pointer, and after the last.
 * These are where that line is, worked out from what the page draws, on any
 * page with a list of sections, the design's own as much as the owner's.
 *
 * happy-dom lays nothing out, so each element is given the box a browser
 * would give it.
 */

const box = (element, { top, height, left = 0, width = 1200, shown = true }) => {
    element.getBoundingClientRect = () => ({ top, bottom: top + height, left, right: left + width, width, height, x: left, y: top });
    element.getClientRects = () => (shown ? [element.getBoundingClientRect()] : []);
};

/** A home page holding two layouts (data-home shows one), the second one hidden. */
const page = () => {
    document.body.innerHTML = `
        <main>
          <div data-layout="1" data-edit-list="tpl:aaa" data-edit-list-kind="sections">
            <section data-edit-item="s-hero" data-edit-section-label="Welcome"><h1>Hello</h1></section>
            <section data-edit-item="s-fees" data-edit-section-label="What a term costs"><h2>Fees</h2><p id="inside">Words</p></section>
            <section data-edit-item="s-hidden" data-edit-section-label="Hidden by the owner"></section>
            <section data-edit-item="s-visit"><h2>  Come and   see us </h2></section>
          </div>
          <div data-layout="2" data-edit-list="tpl:bbb" data-edit-list-kind="sections">
            <section data-edit-item="s-other"></section>
          </div>
        </main>`;
    const [one, two] = document.querySelectorAll('[data-edit-list]');
    box(one, { top: 0, height: 1500 });
    box(two, { top: 0, height: 0, shown: false });
    box(two.firstElementChild, { top: 0, height: 0, shown: false });
    const [hero, fees, hidden, visit] = one.children;
    box(hero, { top: 0, height: 600 });
    box(fees, { top: 640, height: 400 });          // a 40px gap above it
    box(hidden, { top: 1040, height: 0, shown: false });
    box(visit, { top: 1040, height: 460 });

    return { one, two, hero, fees, hidden, visit };
};

describe('the line a section is added on', () => {
    let at;
    beforeEach(() => { at = page(); });

    it('finds the lists of sections a visitor can see, and only those', () => {
        expect(shownSectionLists()).toEqual([at.one]);
        expect(shownSections(at.one)).toEqual([at.hero, at.fees, at.visit]);
    });

    it('offers the line below a section from its lower half, halfway across any gap', () => {
        const line = insertionNear(at.one, at.hero, 500);
        expect(line).toMatchObject({ list: at.one, after: 's-hero', top: 620, last: false });
    });

    it('offers the line above a section from its upper half, which is after the one before it', () => {
        expect(insertionNear(at.one, at.fees, 650)).toMatchObject({ after: 's-hero', top: 620 });
        // Hidden sections are passed over: the line above "Come and see us" is below the fees.
        expect(insertionNear(at.one, at.visit, 1050)).toMatchObject({ after: 's-fees', top: 1040 });
    });

    it('has no line above the first section, so its upper half offers the line below it', () => {
        expect(insertionNear(at.one, at.hero, 10)).toMatchObject({ after: 's-hero' });
    });

    it('works from anything inside a section', () => {
        const under = sectionUnder(document.getElementById('inside'));
        expect(under).toEqual({ list: at.one, section: at.fees });
        expect(insertionNear(under.list, document.getElementById('inside'), 1000)).toMatchObject({ after: 's-fees', last: false });
    });

    it('ends the page after its last shown section', () => {
        expect(insertionAtEnd(at.one)).toMatchObject({ after: 's-visit', top: 1500, last: true });
        expect(insertionNear(at.one, at.visit, 1400)).toMatchObject({ after: 's-visit', last: true });
    });

    it('still has somewhere to add the first section of a page with none', () => {
        document.body.innerHTML = '<main data-edit-list="tpl:new" data-edit-list-kind="sections"><h1 data-kit-page-heading>Open days</h1></main>';
        const main = document.querySelector('main');
        box(main, { top: 80, height: 0 });
        main.getClientRects = () => [main.getBoundingClientRect()];
        expect(shownSectionLists()).toEqual([main]);
        expect(insertionAtEnd(main)).toMatchObject({ list: main, after: null, top: 80, last: true });
    });

    it('is not offered inside what the developer locked', () => {
        at.one.setAttribute('data-live-lock', '');
        expect(shownSectionLists()).toEqual([]);
    });

    it('names the section it goes below', () => {
        expect(sectionName(at.fees)).toBe('What a term costs');
        expect(sectionName(at.visit)).toBe('Come and see us');
        expect(sectionName(null)).toBe('this section');
    });
});
