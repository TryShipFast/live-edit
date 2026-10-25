import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { commonQuestions, listGuides, listName, profileFor } from '../../resources/js/help.js';

/*
 * Help leads with what this kind of website is for (a shop starts in its Shop tab, a school with its
 * dates and news), and turns every list the site really has into a guide of its own. jsdom lays
 * nothing out, so the cards are given a size here the way a browser would.
 */
const shown = { getClientRects: () => [{}], getBoundingClientRect: () => ({ width: 200, height: 100, top: 900 }) };
let restore = [];
beforeEach(() => {
    for (const [name, fn] of Object.entries(shown)) {
        const before = HTMLElement.prototype[name];
        HTMLElement.prototype[name] = fn;
        restore.push(() => { HTMLElement.prototype[name] = before; });
    }
});
afterEach(() => { restore.forEach((undo) => undo()); restore = []; document.body.innerHTML = ''; });

const page = (html) => { document.body.innerHTML = `<main>${html}</main>`; return document; };
const cards = (n, inner) => Array.from({ length: n }, (_, i) => `<li data-edit-item="i${i}">${inner(i)}</li>`).join('');

describe('help for every kind of site', () => {
    it('knows a shop, a school and a portfolio by what the host says they are', () => {
        expect(profileFor({ category: '11-ecommerce', kind: 'shop' }).title).toBe('Help with your shop');
        expect(profileFor({ category: '06-education-training', kind: 'school' }).key).toBe('school');
        expect(profileFor({ category: '06-education-training', kind: 'university' }).key).toBe('university');
        expect(profileFor({ category: '01-personal-portfolios', kind: 'default' }).key).toBe('portfolio');
        expect(profileFor({ category: '05-beauty-wellness', kind: 'salon' }).key).toBe('beauty');
    });

    it('falls back to the shop when only the shop says so, and to general help when nothing does', () => {
        expect(profileFor(undefined, { hasShop: true }).key).toBe('shop');
        expect(profileFor(undefined).key).toBe('general');
        expect(profileFor({ category: 'something new', kind: 'unheard of' }).key).toBe('general');
    });

    it('leads a shop owner to the Shop tab first and answers where orders go', () => {
        const shop = profileFor({ kind: 'shop' });
        expect(shop.start[0]).toBe('shop');
        expect(shop.questions.map((q) => q.q)).toContain('Where do orders go?');
    });

    it('only answers questions about what this editor has', () => {
        const without = commonQuestions({ hasPublish: false, hasPages: false, hasBrand: false }).map((q) => q.q);
        expect(without.join(' ')).not.toMatch(/publish|add a page|colours/i);
        const all = commonQuestions({ hasPublish: true, hasPages: true, hasBrand: true }).map((q) => q.q);
        expect(all).toContain('How do I add a page?');
        expect(all).toContain('How do I change the colours or fonts?');
    });

    it('makes a guide for each list the site has, named by the list', () => {
        page(`<ul data-edit-list="l1" data-edit-list-label="Courses" data-edit-list-max="24">${cards(3, (i) => `<h3>Course ${i}</h3>`)}</ul>`);
        const [guide] = listGuides(document);

        expect(guide.title).toBe('Add to Courses');
        expect(guide.steps.map((s) => s.title)).toEqual(['These are your Courses', 'Copy one to add another', 'Make the copy its own']);
        expect(guide.steps[0].point()).toBe(document.querySelector('[data-edit-item]'));
    });

    it('mentions a card\'s setting only where the list declares one, and its own page only where pages can be made', () => {
        page(`<ul data-edit-list="p" data-edit-list-label="Products" data-edit-list-max="24"
                   data-edit-choices='[{"attr":"data-category","label":"Category"}]'>
                ${cards(3, (i) => `<a href="/products/p${i}/"><h3>P${i}</h3></a>`)}
              </ul>`);

        const titles = (opts) => listGuides(document, opts)[0].steps.map((s) => s.title);
        expect(titles({ canMakePages: true })).toEqual(expect.arrayContaining(['Choose its category', 'Change its page from the card', 'Give it its own page']));
        expect(titles({ canMakePages: false })).not.toContain('Give it its own page');
        expect(titles({ canMakePages: false })).not.toContain('Change its page from the card');
    });

    it('leaves out sections, menus, a pair of buttons and lists of another layout', () => {
        page(`<div data-edit-list="s" data-edit-list-kind="sections" data-edit-list-label="Page sections">${cards(2, () => '<h2>S</h2>')}</div>
              <nav><ul data-edit-list="n" data-edit-list-label="Menu">${cards(3, () => '<a href="/">x</a>')}</ul></nav>
              <div data-edit-list="b" data-edit-list-label="Buttons" data-edit-list-max="2">${cards(2, () => '<a href="/a">Go</a>')}</div>
              <ul data-edit-list="h" data-edit-list-label="Hidden layout" data-edit-list-max="24">${cards(2, () => '<h3>H</h3>')}</ul>`);
        document.querySelector('[data-edit-list="h"]').querySelectorAll('li').forEach((li) => { li.getClientRects = () => []; });

        expect(listGuides(document)).toEqual([]);
    });

    it('puts the lists an owner adds to before the rest', () => {
        page(`<ul data-edit-list="f" data-edit-list-label="Facts" data-edit-list-max="6">${cards(3, () => '<p>A fact</p>')}</ul>
              <ul data-edit-list="n" data-edit-list-label="News" data-edit-list-max="24">${cards(3, (i) => `<a href="/news/${i}/"><img alt=""><h3>Story ${i}</h3></a>`)}</ul>
              <ul data-edit-list="c" data-edit-list-label="Contact" data-edit-list-max="24">${cards(3, (i) => `<a href="tel:+1555000${i}"><h3>Call</h3></a>`)}</ul>`);

        expect(listGuides(document).map((g) => g.title)).toEqual(['Add to News', 'Add to Contact', 'Add to Facts']);
    });

    it('names a list whose label is a whole sentence by its first words', () => {
        const list = document.createElement('div');
        list.dataset.editListLabel = 'I need help with buying or selling a company, raising investment, a contract to draft';
        expect(listName(list)).toBe('I need help with buying or selling a…');
    });
});
