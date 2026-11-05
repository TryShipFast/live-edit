import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * Owner, 5 Nov 2026: "you can see the live edit, dashboard can change to icon to create less space same as ads and
 * tracking"; "they are not responsive on mobile".
 *
 * At every width from a 320px phone to a 1440px desktop: nothing scrolls sideways, every control on the bar can be
 * reached and does what it says (directly, or from the More sheet when the bar is folded), the icon links show
 * their label as a tooltip and go where they point, the sheet works from a keyboard, and axe finds nothing wrong
 * with the bar or the sheet.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx playwright test tests/e2e/the-bar-folds-into-more.spec.js
 *
 * axe-core is read from this package's node_modules, or AXE_CORE (a path to axe.min.js).
 */
test.use({ ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}) });

const axeSource = (() => {
    const candidates = [process.env.AXE_CORE];
    try { candidates.push(createRequire(import.meta.url).resolve('axe-core/axe.min.js')); } catch { /* not installed here */ }
    candidates.push('/home/user/website/node_modules/axe-core/axe.min.js');
    const found = candidates.find((path) => path && existsSync(path));

    return found ? readFileSync(found, 'utf8') : null;
})();

const LINKS = [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Tracking and ads', href: '/sites/demo/website#tracking', icon: 'tracking' },
];

const ui = (page) => page.locator('#live-edit-ui');
const bar = (page) => ui(page).locator('.le-toolbar');
const sheet = (page) => ui(page).locator('#le-more-sheet');
const folded = (page) => bar(page).evaluate((node) => node.classList.contains('is-folded'));

/** What runs past either edge of the screen, of the editor's own, and whether the page scrolls sideways. */
const overflow = (page) => page.evaluate(() => {
    const root = document.querySelector('#live-edit-ui').shadowRoot;
    const out = [...root.querySelectorAll('*')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(e).visibility !== 'hidden';
    }).map((e) => `${e.tagName.toLowerCase()}.${e.className}`);
    const toolbar = root.querySelector('.le-toolbar');
    // nothing on the bar cut short ("Publi...")
    toolbar.querySelectorAll('button, a, button > span').forEach((e) => {
        if (e.getClientRects().length && e.scrollWidth > e.clientWidth + 1) out.push(`clipped ${e.className} "${e.textContent.trim()}"`);
    });
    if (toolbar.scrollWidth > toolbar.clientWidth + 1) out.push(`toolbar scrolls ${toolbar.scrollWidth} > ${toolbar.clientWidth}`);
    // the editor adds no sideways scroll to the page (the page's own content may have some of its own)
    const withUs = document.documentElement.scrollWidth;
    const host = document.querySelector('#live-edit-ui');
    host.style.display = 'none';
    const without = document.documentElement.scrollWidth;
    host.style.display = '';
    if (withUs > Math.max(innerWidth, without)) out.push(`page scrolls ${withUs} > ${Math.max(innerWidth, without)}`);

    return out;
});

/** Every visible control of the bar and the sheet is a 44px target, at least, on a phone. */
const smallTargets = (page) => page.evaluate(() => {
    const root = document.querySelector('#live-edit-ui').shadowRoot;
    return [...root.querySelectorAll('.le-toolbar :is(button, a, select), .le-sheet :is(button, a, select)')]
        .filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
        .filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; })
        .map((e) => `${e.className} ${e.getAttribute('aria-label') ?? e.textContent.trim()} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
});

const axe = async (page) => {
    await page.addScriptTag({ content: axeSource });
    return page.evaluate(async () => {
        const result = await window.axe.run(document, { resultTypes: ['violations'] });
        const ours = (target) => JSON.stringify(target).includes('#live-edit-ui');
        return result.violations
            .map((v) => ({ id: v.id, nodes: v.nodes.filter((n) => ours(n.target)).map((n) => JSON.stringify(n.target)) }))
            .filter((v) => v.nodes.length);
    });
};

/** Press a control: on the bar when it is there, from the More sheet when the bar has folded it away. */
const press = async (page, onBar, inSheet) => {
    const direct = bar(page).getByRole('button', { name: onBar, exact: true });
    if (await direct.isVisible()) {
        await direct.click();
        return;
    }
    await ui(page).getByRole('button', { name: 'More' }).click();
    await expect(sheet(page)).toBeVisible();
    await sheet(page).getByRole('button', { name: inSheet, exact: true }).click();
    await expect(sheet(page)).toBeHidden();
};

const arrive = async (page, width) => {
    const site = await serveFakeHost({ search: true, library: true });
    await page.setViewportSize({ width, height: width < 700 ? 760 : 900 });
    await page.addInitScript((links) => {
        window.liveEditToolbar = { links, logout: { href: '/logout', method: 'post' } };
        window.liveEditBrand = { tokens: [{ key: 'brand.color', label: 'Main colour', value: '#1b6ef3', kind: 'color' }] };
        // three changes waiting, so Publish carries a count and opens its dialog
        let publishing;
        Object.defineProperty(window, 'liveEditPublishing', { configurable: true, get: () => publishing, set: (value) => { publishing = { ...value, pending: 3 }; } });
    }, LINKS);
    await page.route(/\/(dashboard|sites\/demo\/website)$/, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Dashboard</title><h1>Dashboard</h1>' }));
    await page.goto(`${site.url}/edit/shop?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const end = ui(page).locator('.le-walkthrough-end');
    if (await end.isVisible().catch(() => false)) await end.click();
    await expect(ui(page).locator('.le-publish')).toContainText('3');

    return site;
};

for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    test.describe(`at ${width}px`, () => {
        test('the bar fits, folds where it must and keeps its essentials in view', async ({ page }) => {
            const site = await arrive(page, width);
            try {
                expect(await overflow(page)).toEqual([]);
                if (width <= 760) expect(await folded(page)).toBe(true);
                if (width >= 1440) expect(await folded(page)).toBe(false);
                for (const name of ['Done editing', 'Undo', /^Publish/]) {
                    await expect(bar(page).getByRole('button', { name })).toBeInViewport({ ratio: 1 });
                }
                if (await folded(page)) await expect(ui(page).getByRole('button', { name: 'More' })).toBeInViewport({ ratio: 1 });
                if (width <= 760) expect(await smallTargets(page)).toEqual([]);

                // the toggle turns editing off and on again
                await bar(page).getByRole('button', { name: 'Done editing' }).click();
                await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(false);
                expect(await overflow(page)).toEqual([]);
                await bar(page).getByRole('button', { name: 'Edit site' }).click();
                await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);

                // A site's own call bar at the foot of a phone screen is lifted clear of the bar, so both can be pressed.
                if (width <= 760) {
                    await page.evaluate(() => {
                        const callBar = document.createElement('div');
                        callBar.id = 'call-bar';
                        callBar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:56px;display:flex;align-items:center;justify-content:center;background:#ffd400;z-index:50';
                        callBar.innerHTML = '<a href="tel:+2348030001234" style="padding:12px 24px">Call us</a>';
                        document.body.append(callBar);
                    });
                    await expect.poll(() => page.evaluate(() => {
                        const link = document.querySelector('#call-bar a').getBoundingClientRect();
                        const hit = document.elementFromPoint(link.left + link.width / 2, link.top + link.height / 2);
                        return hit?.closest('#call-bar') ? 'pressable' : `covered by ${hit?.id || hit?.tagName}`;
                    })).toBe('pressable');
                    for (const name of ['Done editing', 'Undo', /^Publish/, 'More']) {
                        await expect(bar(page).getByRole('button', { name })).toBeInViewport({ ratio: 1 });
                    }
                }

                // Publish opens its dialog
                await bar(page).getByRole('button', { name: /^Publish/ }).click();
                await expect(ui(page).getByRole('button', { name: 'Publish now' })).toBeVisible();
                await ui(page).getByRole('button', { name: 'Keep editing' }).click();
            } finally {
                await site.close();
            }
        });

        test('every other control is reachable and opens what it says', async ({ page }) => {
            const site = await arrive(page, width);
            try {
                const tabOn = (name) => expect(ui(page).locator(`.le-drawer.is-open .le-tab.is-on[data-tab="${name}"]`)).toBeVisible();
                const closeDrawer = async () => {
                    await ui(page).locator('.le-drawer .le-close').click();
                    await expect(ui(page).locator('.le-drawer')).not.toHaveClass(/is-open/);
                };

                await press(page, 'Changes', 'Changes');
                await tabOn('Changes');
                // on a phone the drawer's own buttons are not under the bar
                const covered = await page.evaluate(() => {
                    const root = document.querySelector('#live-edit-ui').shadowRoot;
                    return [...root.querySelectorAll('.le-drawer.is-open button')].filter((b) => b.getClientRects().length).filter((b) => {
                        const r = b.getBoundingClientRect();
                        const x = r.left + r.width / 2; const y = r.top + r.height / 2;
                        if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) return false;
                        const hit = root.elementFromPoint(x, y);
                        return hit && !b.contains(hit) && Boolean(hit.closest('.le-toolbar'));
                    }).map((b) => b.textContent.trim());
                });
                expect(covered).toEqual([]);
                await closeDrawer();

                await press(page, 'Brand', 'Brand');
                await tabOn('Brand');
                await closeDrawer();

                await press(page, 'Search', 'Search');
                await tabOn('Search');
                await closeDrawer();

                await press(page, '+ Section', 'Sections');
                await expect(ui(page).locator('.le-drawer.is-open')).toBeVisible();
                await closeDrawer();

                await press(page, '+ New page', 'New page');
                await expect(ui(page).locator('.le-scrim')).toBeVisible();
                await page.keyboard.press('Escape');
                await expect(ui(page).locator('.le-scrim')).toHaveCount(0);

                await press(page, 'Help with Live Edit', 'Help');
                await expect(ui(page).locator('.le-help-menu')).toBeVisible();
                await page.keyboard.press('Escape');

                expect(await overflow(page)).toEqual([]);
            } finally {
                await site.close();
            }
        });

        test('the icon links show their label, are named, and go where they point', async ({ page }) => {
            const site = await arrive(page, width);
            try {
                const tip = ui(page).locator('.le-tip');
                if (await folded(page)) {
                    await ui(page).getByRole('button', { name: 'More' }).hover();
                    await expect(tip).toHaveText('More');
                    await bar(page).getByRole('button', { name: 'Undo' }).focus();
                    await expect(tip).toHaveText('Undo');
                    await expect(tip).toBeInViewport({ ratio: 1 });
                    await page.keyboard.press('Escape');
                    await expect(tip).toBeHidden();
                }
                // each link and Log out: an icon on the bar with its label as tooltip, or a labelled item in the sheet
                const checked = [];
                for (const { label, href } of [...LINKS, { label: 'Log out' }]) {
                    const onBar = bar(page).getByRole(href ? 'link' : 'button', { name: label });
                    if (!(await onBar.isVisible())) continue;
                    if (href) await expect(onBar).toHaveAttribute('href', href);
                    await onBar.hover();
                    await expect(tip).toHaveText(label);
                    await expect(tip).toBeInViewport({ ratio: 1 });
                    const box = await onBar.boundingBox();
                    expect(box.width).toBeGreaterThanOrEqual(44);
                    expect(box.height).toBeGreaterThanOrEqual(44);
                    checked.push(label);
                }
                await page.mouse.move(width / 2, 10);
                if (checked.length < 3) {
                    await ui(page).getByRole('button', { name: 'More' }).click();
                    for (const { label, href } of [...LINKS, { label: 'Log out' }]) {
                        if (checked.includes(label)) continue;
                        const item = sheet(page).getByRole(href ? 'link' : 'button', { name: label, exact: true });
                        await expect(item).toBeVisible();
                        if (href) await expect(item).toHaveAttribute('href', href);
                    }
                    expect(await overflow(page)).toEqual([]);
                }
                const dashboard = (await sheet(page).isVisible()) && !checked.includes('Dashboard')
                    ? sheet(page).getByRole('link', { name: 'Dashboard' })
                    : bar(page).getByRole('link', { name: 'Dashboard' });
                await dashboard.click();
                await expect(page).toHaveURL(/\/dashboard$/);
            } finally {
                await site.close();
            }
        });

        test('the More sheet works from a keyboard and Back, and axe finds nothing on the bar or the sheet', async ({ page }) => {
            test.skip(!axeSource, 'axe-core is not installed; set AXE_CORE');
            const site = await arrive(page, width);
            try {
                expect(await axe(page)).toEqual([]);
                if (!(await folded(page))) {
                    // Nothing is folded away at this width: More is not on the bar.
                    await expect(ui(page).getByRole('button', { name: 'More' })).toBeHidden();
                    return;
                }
                const more = ui(page).getByRole('button', { name: 'More' });
                await more.focus();
                await page.keyboard.press('Enter');
                await expect(sheet(page)).toBeVisible();
                await expect(more).toHaveAttribute('aria-expanded', 'true');
                if (width <= 760) expect(await smallTargets(page)).toEqual([]);
                expect(await overflow(page)).toEqual([]);
                expect(await axe(page)).toEqual([]);

                // the keyboard stays in the sheet
                const inSheet = () => page.evaluate(() => {
                    const root = document.querySelector('#live-edit-ui').shadowRoot;
                    return Boolean(root.activeElement?.closest('.le-sheet'));
                });
                expect(await inSheet()).toBe(true);
                for (let i = 0; i < 14; i += 1) {
                    await page.keyboard.press('Tab');
                    expect(await inSheet()).toBe(true);
                }
                await page.keyboard.press('Shift+Tab');
                expect(await inSheet()).toBe(true);

                // Escape closes it and the keyboard is back on More
                await page.keyboard.press('Escape');
                await expect(sheet(page)).toBeHidden();
                await expect(more).toBeFocused();
                await expect(more).toHaveAttribute('aria-expanded', 'false');

                // Back closes it, and the editor stays where it was
                const before = page.url();
                await more.click();
                await expect(sheet(page)).toBeVisible();
                await page.goBack();
                await expect(sheet(page)).toBeHidden();
                expect(page.url()).toBe(before);

                // a tap on the page behind closes it
                await more.click();
                await page.mouse.click(width / 2, 20);
                await expect(sheet(page)).toBeHidden();
                expect(page.url()).toBe(before);
            } finally {
                await site.close();
            }
        });
    });
}
