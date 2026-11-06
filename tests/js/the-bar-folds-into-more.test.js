import { afterEach, describe, expect, it } from 'vitest';
import { createChrome } from '../../resources/js/chrome.js';
import { LINK_ICONS, linkIcon, sheetEntries, toolbarIcon } from '../../resources/js/toolbar-icons.js';

/*
 * Owner, 5 Nov 2026: "dashboard can change to icon to create less space same as ads and tracking"; "they are not
 * responsive on mobile". A host link that names an icon is a round icon button with its label as its name and
 * tooltip; one that does not keeps its words. Folded, the bar keeps Edit or Done, Undo, Publish and More, and More
 * opens a sheet that offers the rest and presses the real controls.
 */
const chrome = (toolbar = {}) => {
    document.body.innerHTML = '';
    document.querySelectorAll('#live-edit-ui, [data-live-edit-ui]').forEach((node) => node.remove());
    window.liveEditToolbar = toolbar;

    return createChrome();
};

afterEach(() => {
    delete window.liveEditToolbar;
});

describe('which icon a host link gets', () => {
    it('draws the built-in names and keeps words for anything else', () => {
        expect(LINK_ICONS).toEqual(['dashboard', 'tracking', 'settings', 'help', 'external', 'logout']);
        expect(linkIcon({ icon: 'dashboard' })).toBe('dashboard');
        expect(linkIcon({ icon: ' Tracking ' })).toBe('tracking');
        expect(linkIcon({ icon: 'rocket' })).toBeNull();
        expect(linkIcon({ label: 'Dashboard' })).toBeNull();
        expect(linkIcon(null)).toBeNull();
    });

    it('draws each as an SVG hidden from screen readers', () => {
        LINK_ICONS.forEach((name) => {
            expect(toolbarIcon(name)).toMatch(/^<svg [^>]*aria-hidden="true"/);
        });
        expect(toolbarIcon('nothing')).toBe('');
    });

    it('offers only the controls this site has', () => {
        const shown = { hidden: false };
        const absent = { hidden: true };
        expect(sheetEntries([{ control: shown, label: 'A' }, { control: absent, label: 'B' }, null, { label: 'C' }]))
            .toEqual([{ control: shown, label: 'A' }]);
    });
});

describe('the links on the bar', () => {
    it('keeps the product mark visible at every responsive width', () => {
        const ui = chrome();
        const mark = ui.toolbar.querySelector('.le-mark');
        const css = ui.shadow.querySelector('style').textContent;

        expect(mark.querySelector('svg')).not.toBeNull();
        expect(css).not.toMatch(/\.le-toolbar\.is-folded \.le-mark\s*\{[^}]*display:\s*none/);
    });

    it('uses a solid image-loading placeholder without a horizontal gradient', () => {
        const ui = chrome();
        const css = ui.shadow.querySelector('style').textContent;
        const shimmer = css.match(/\.le-shimmer\s*\{([^}]+)\}/)?.[1] ?? '';

        expect(shimmer).toContain('background: #EEEFF1');
        expect(shimmer).not.toContain('gradient');
        expect(css).not.toContain('@keyframes le-shimmer');
    });

    it('are icon buttons named by their label when they name an icon, and words when they do not', () => {
        const ui = chrome({
            links: [
                { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
                { label: 'Tracking and ads', href: '/sites/demo#tracking', icon: 'tracking' },
                { label: 'Docs', href: '/docs', title: 'Read the docs' },
            ],
        });
        const dashboard = ui.toolbar.querySelector('a[href="/dashboard"]');
        expect(dashboard.classList.contains('le-icon-link')).toBe(true);
        expect(dashboard.getAttribute('aria-label')).toBe('Dashboard');
        expect(dashboard.dataset.tip).toBe('Dashboard');
        expect(dashboard.textContent.trim()).toBe('');
        expect(dashboard.querySelector('svg')).not.toBeNull();
        expect(ui.toolbar.querySelector('a[href="/sites/demo#tracking"]').getAttribute('aria-label')).toBe('Tracking and ads');

        const docs = ui.toolbar.querySelector('a[href="/docs"]');
        expect(docs.classList.contains('le-btn-ghost')).toBe(true);
        expect(docs.textContent).toBe('Docs');
        expect(docs.title).toBe('Read the docs');
    });

    it('logs out with an icon button named Log out', () => {
        const ui = chrome({ logout: { href: '/logout', method: 'post' } });
        const button = ui.toolbar.querySelector('form.le-logout button[type="submit"]');
        expect(button.getAttribute('aria-label')).toBe('Log out');
        expect(button.dataset.tip).toBe('Log out');
        expect(button.closest('form').getAttribute('action')).toBe('/logout');
    });

    it('puts More last, named, and closed', () => {
        const ui = chrome({ links: [{ label: 'Dashboard', href: '/dashboard', icon: 'dashboard' }] });
        expect(ui.toolbar.lastElementChild).toBe(ui.moreButton);
        expect(ui.moreButton.getAttribute('aria-label')).toBe('More');
        expect(ui.moreButton.getAttribute('aria-expanded')).toBe('false');
        expect(ui.moreButton.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('folds the rest, in order, and never Edit, Undo, Publish or More', () => {
        const ui = chrome({ links: [{ label: 'Dashboard', href: '/dashboard', icon: 'dashboard' }], logout: { href: '/logout' } });
        [ui.toggleButton, ui.undoButton, ui.publishButton, ui.moreButton].forEach((node) => expect(ui.foldOrder).not.toContain(node));
        const dashboard = ui.toolbar.querySelector('a[href="/dashboard"]');
        const logout = ui.toolbar.querySelector('a[href="/logout"]');
        expect(ui.foldOrder).toEqual([logout, dashboard, ui.helpButton, ui.searchButton, ui.brandButton, ui.sectionsButton, ui.previewButton, ui.pagesButton, ui.languagePicker, ui.changesButton, ui.redoButton]);
    });
});

describe('the More sheet', () => {
    const open = () => {
        const ui = chrome({
            links: [{ label: 'Dashboard', href: '/dashboard', icon: 'dashboard' }, { label: 'Docs', href: '/docs' }],
            logout: { href: '/logout' },
        });
        ui.changesButton.hidden = false;
        ui.previewButton.hidden = false;
        ui.redoButton.disabled = true;
        // folded, as on a phone: everything that folds is under More
        ui.foldOrder.forEach((node) => node.classList.add('le-out'));
        ui.moreButton.click();

        return ui;
    };
    const labels = (ui) => [...ui.moreSheet.querySelectorAll('.le-sheet-item')].map((item) => item.textContent.trim());

    it('opens as a named modal dialog listing what the bar folded away', () => {
        const ui = open();
        expect(ui.moreSheet.hidden).toBe(false);
        expect(ui.moreSheet.getAttribute('role')).toBe('dialog');
        expect(ui.moreSheet.getAttribute('aria-modal')).toBe('true');
        expect(ui.shadow.getElementById(ui.moreSheet.getAttribute('aria-labelledby')).textContent).toBe('More');
        expect(ui.moreButton.getAttribute('aria-expanded')).toBe('true');
        expect(labels(ui)).toEqual(['Redo', 'Changes', 'Help', 'Preview', 'Dashboard', 'Docs', 'Log out']);
    });

    it('keeps a control that cannot be pressed now disabled', () => {
        const ui = open();
        const redo = [...ui.moreSheet.querySelectorAll('.le-sheet-item')].find((item) => item.textContent.trim() === 'Redo');
        expect(redo.disabled).toBe(true);
    });

    it('presses the real control and closes', () => {
        const ui = open();
        let pressed = 0;
        ui.changesButton.addEventListener('click', () => { pressed += 1; });
        [...ui.moreSheet.querySelectorAll('.le-sheet-item')].find((item) => item.textContent.trim() === 'Changes').click();
        expect(pressed).toBe(1);
        expect(ui.moreSheet.hidden).toBe(true);
        expect(ui.moreButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('links go where the bar links go', () => {
        const ui = open();
        const hrefs = [...ui.moreSheet.querySelectorAll('a.le-sheet-item')].map((a) => a.getAttribute('href'));
        expect(hrefs).toEqual(['/dashboard', '/docs', '/logout']);
    });

    it('closes on Escape, and on the darkened page behind it', () => {
        const ui = open();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(ui.moreSheet.hidden).toBe(true);

        ui.moreButton.click();
        expect(ui.moreSheet.hidden).toBe(false);
        ui.shadow.querySelector('.le-sheet-scrim').click();
        expect(ui.moreSheet.hidden).toBe(true);
    });

    it('offers only what the bar has folded away', () => {
        const ui = chrome({ links: [{ label: 'Dashboard', href: '/dashboard', icon: 'dashboard' }] });
        ui.changesButton.hidden = false;
        ui.helpButton.classList.add('le-out');
        ui.moreButton.click();
        expect(labels(ui)).toEqual(['Help']);
    });

    it('closes on Back', () => {
        const ui = open();
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
        expect(ui.moreSheet.hidden).toBe(true);
    });

    it('passes a language chosen in it to the bar\'s own picker', () => {
        const ui = chrome({});
        ['en', 'fr'].forEach((code) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code.toUpperCase();
            ui.languagePicker.append(option);
        });
        ui.languagePicker.value = 'en';
        ui.languagePicker.hidden = false;
        ui.languagePicker.classList.add('le-out');
        let chosen = null;
        ui.languagePicker.addEventListener('change', () => { chosen = ui.languagePicker.value; });
        ui.moreButton.click();
        const select = ui.moreSheet.querySelector('select');
        select.value = 'fr';
        select.dispatchEvent(new Event('change'));
        expect(chosen).toBe('fr');
        expect(ui.moreSheet.hidden).toBe(true);
    });
});
