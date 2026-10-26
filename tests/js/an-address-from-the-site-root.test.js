import { describe, expect, it } from 'vitest';
import { applyContent } from '../../resources/js/content.js';
import { addressFromTheRoot, addressHere } from '../../resources/js/site-address.js';

/*
 * A link a host keys once for every page (a shared header's "Fees", a named
 * menu entry) is "fees/" on the home page and "../fees/" one folder down, so
 * no address relative to one page can be stored for all of them. The host
 * marks the element with the way up to the site's root (data-edit-href-root),
 * the editor saves what the owner chose from the root ("~/fees/"), and each
 * page writes it out for itself. The server does the same (SiteRootAddress).
 */
describe('an address saved from the site root', () => {
    const home = 'https://site.test/sites/imole/';
    const about = 'https://site.test/sites/imole/about/';
    const deeper = 'https://site.test/sites/imole/classrooms/creche/';

    it('is saved from the root, whichever page the owner chose it on', () => {
        expect(addressFromTheRoot('fees/#w1-2', '', home)).toBe('~/fees/#w1-2');
        expect(addressFromTheRoot('../fees/#w1-2', '../', about)).toBe('~/fees/#w1-2');
        expect(addressFromTheRoot('../../fees/', '../../', deeper)).toBe('~/fees/');
        expect(addressFromTheRoot('./', '', home)).toBe('~/');
        expect(addressFromTheRoot('../', '../', about)).toBe('~/');
        expect(addressFromTheRoot('team/', '../', about)).toBe('~/about/team/');
        expect(addressFromTheRoot('../visit/?day=mon#book', '../', about)).toBe('~/visit/?day=mon#book');
    });

    it('is not used where the address already means the same thing on every page', () => {
        for (const typed of ['https://example.com/fees', 'mailto:office@imole.test', 'tel:+2348000000', '/fees', '#top', '//cdn.test/x', '', '~/fees/']) {
            expect(addressFromTheRoot(typed, '../', about)).toBe(typed);
        }
        // Above the site's root: not this site's to rewrite.
        expect(addressFromTheRoot('../../elsewhere/', '../', about)).toBe('../../elsewhere/');
    });

    it('is not used for a link the host keys per page (no root marked)', () => {
        expect(addressFromTheRoot('../fees/', undefined, about)).toBe('../fees/');
        expect(addressFromTheRoot('../fees/', null, about)).toBe('../fees/');
    });

    it('is written out for the page it is applied on', () => {
        expect(addressHere('~/fees/#w1-2', '')).toBe('fees/#w1-2');
        expect(addressHere('~/fees/#w1-2', '../')).toBe('../fees/#w1-2');
        expect(addressHere('~/', '')).toBe('./');
        expect(addressHere('../fees/', '../')).toBe('../fees/');
        expect(addressHere('https://example.com/', '../')).toBe('https://example.com/');
    });

    it('reaches the link on every page when content is applied', () => {
        const settings = { 'tpl:fees': '~/fees/#w1-2', 'tpl:visit': '../visit/#book' };
        const pageAt = (root) => {
            const holder = document.createElement('div');
            holder.innerHTML = `<header><a href="${root}fees/" data-edit-href="tpl:fees" data-edit-href-root="${root}">Fees</a>`
                + `<a href="${root}visit/" data-edit-href="tpl:visit">Visit</a></header>`;
            applyContent(holder, settings);

            return holder;
        };

        expect(pageAt('').querySelector('[data-edit-href="tpl:fees"]').getAttribute('href')).toBe('fees/#w1-2');
        expect(pageAt('../').querySelector('[data-edit-href="tpl:fees"]').getAttribute('href')).toBe('../fees/#w1-2');
        // A link the host keys per page keeps what was saved for it, as it always did.
        expect(pageAt('../').querySelector('[data-edit-href="tpl:visit"]').getAttribute('href')).toBe('../visit/#book');
    });
});
