import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// From the repository root: under happy-dom import.meta.url is not a file: URL.
const source = (path) => readFileSync(join(process.cwd(), path), 'utf8');
import { describe, expect, it, vi } from 'vitest';
import { LEAVE_QUESTION, guardLeaving, leavesThePage } from '../../resources/js/unsaved.js';
import { heardNotSeen } from '../../resources/js/support.js';

/*
 * Unsaved changes are asked about before they are lost (CONVENTIONS.md section 5, change 4), the way
 * Shopify admin and Google Docs ask: the browser's own question for a closed tab or a reload, the
 * editor's "You have unsaved changes. Leave without saving?" for leaving from inside it, and nothing
 * at all when nothing is unsaved. The panel's Cancel is Discard, as Shopify's save bar says it.
 */

const link = (href, attrs = {}) => {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);

    return a;
};

describe('a link that leaves the page', () => {
    const here = 'http://site.test/edit/shop?x=1';

    it('is another address in this window', () => {
        expect(leavesThePage(link('/dashboard'), {}, here)).toBe(true);
        expect(leavesThePage(link('../about/'), {}, here)).toBe(true);
    });

    it('is not a jump in the page, a new tab, a download, a phone number or a modified press', () => {
        expect(leavesThePage(link('#top'), {}, here)).toBe(false);
        expect(leavesThePage(link('/x', { target: '_blank' }), {}, here)).toBe(false);
        expect(leavesThePage(link('/x', { download: '' }), {}, here)).toBe(false);
        expect(leavesThePage(link('tel:+2348030001234'), {}, here)).toBe(false);
        expect(leavesThePage(link('/x'), { metaKey: true }, here)).toBe(false);
        expect(leavesThePage(link('/x'), { button: 1 }, here)).toBe(false);
        expect(leavesThePage(link('?x=1'), {}, here)).toBe(false);
    });
});

describe('leaving with unsaved changes', () => {
    const fakeWindow = () => {
        const listeners = {};
        return {
            listeners,
            location: { href: 'http://site.test/edit/shop', assign: vi.fn() },
            document,
            addEventListener: (type, fn) => { listeners[type] = fn; },
            removeEventListener: (type) => { delete listeners[type]; },
        };
    };

    it('asks the browser to ask on close and reload only while something is unsaved', () => {
        const win = fakeWindow();
        let unsaved = false;
        guardLeaving({ win, isUnsaved: () => unsaved, ask: async () => true });
        const event = () => ({ preventDefault: vi.fn(), returnValue: undefined });

        const calm = event();
        win.listeners.beforeunload(calm);
        expect(calm.preventDefault).not.toHaveBeenCalled();

        unsaved = true;
        const worried = event();
        win.listeners.beforeunload(worried);
        expect(worried.preventDefault).toHaveBeenCalled();
        expect(worried.returnValue).toBe('');
    });

    it('goes at once when nothing is unsaved, asks when something is, and stays on Stay', async () => {
        const win = fakeWindow();
        let unsaved = false;
        const ask = vi.fn(async () => false);
        const guard = guardLeaving({ win, isUnsaved: () => unsaved, ask });
        const go = vi.fn();

        await guard.leave(go);
        expect(ask).not.toHaveBeenCalled();
        expect(go).toHaveBeenCalledTimes(1);

        unsaved = true;
        await guard.leave(go);
        expect(ask).toHaveBeenCalledTimes(1);
        expect(go).toHaveBeenCalledTimes(1);

        ask.mockResolvedValueOnce(true);
        await guard.leave(go);
        expect(go).toHaveBeenCalledTimes(2);
        // Agreed once: the browser does not ask a second time on the way out.
        const after = { preventDefault: vi.fn() };
        win.listeners.beforeunload(after);
        expect(after.preventDefault).not.toHaveBeenCalled();
    });

    it('holds a pressed link until the answer is Leave', async () => {
        const win = fakeWindow();
        const root = document.createElement('div');
        document.body.replaceChildren(root);
        const ask = vi.fn(async () => true);
        guardLeaving({ win, isUnsaved: () => true, ask, roots: [root] });
        const a = link('http://site.test/dashboard');
        root.append(a);
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });
        a.dispatchEvent(click);
        expect(click.defaultPrevented).toBe(true);
        await Promise.resolve();
        await Promise.resolve();
        expect(ask).toHaveBeenCalled();
        expect(win.location.assign).toHaveBeenCalledWith('http://site.test/dashboard');
    });

    it('says it in the words people know', () => {
        expect(LEAVE_QUESTION).toMatchObject({ title: 'You have unsaved changes', leave: 'Leave', stay: 'Stay' });
        expect(LEAVE_QUESTION.subtitle.startsWith('Leave without saving?')).toBe(true);
    });
});

describe('what ships', () => {
    const built = source('resources/dist/live-edit.js');

    it('has Discard where the panels said Cancel, and the leaving question', () => {
        const chrome = source('resources/js/chrome.js');
        expect(chrome).toContain("el('button', 'le-btn-outline', 'Discard')");
        expect(chrome).not.toContain("el('button', 'le-btn-outline', 'Cancel')");
        for (const file of ['brand.js', 'seo.js']) {
            expect(source(`resources/js/${file}`)).toContain("'Discard'");
        }
        expect(built).toContain('Leave without saving?');
        expect(built).toContain('beforeunload');
    });

    it('keeps words only a screen reader hears off the page while editing', () => {
        const span = document.createElement('span');
        span.className = 'visually-hidden';
        expect(heardNotSeen(span)).toBe(true);
        span.className = 'logo';
        expect(heardNotSeen(span)).toBe(false);
        expect(built).toContain('Read aloud by screen readers');
    });
});
