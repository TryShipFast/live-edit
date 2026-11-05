import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * CONVENTIONS.md section 5, changes 4 and 5 (owner, 5 Nov 2026: "start them in the order"):
 *
 *   4. Unsaved changes are asked about before they are lost: leaving from the editor ("You have unsaved
 *      changes. Leave without saving?", Leave or Stay), finishing editing, closing the tab or reloading
 *      (the browser's own question). Nothing is asked when nothing is unsaved. The panel's Cancel is Discard.
 *   5. Pages, as Wix's "Pages & Menu": every page in menu order; open, rename, show in the menu or not,
 *      reorder (drag, and up/down from a keyboard), duplicate, delete, Add page at the top. A checkout, a
 *      brand sheet, a notice are apart and never offered by New page.
 *   And: no stray ", home" under the logo while editing.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx playwright test tests/e2e/pages-and-unsaved-changes.spec.js
 */
test.use({ ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}) });

const axeSource = (() => {
    const candidates = [process.env.AXE_CORE];
    try { candidates.push(createRequire(import.meta.url).resolve('axe-core/axe.min.js')); } catch { /* not installed here */ }
    candidates.push('/home/user/website/node_modules/axe-core/axe.min.js');
    const found = candidates.find((path) => path && existsSync(path));

    return found ? readFileSync(found, 'utf8') : null;
})();

const ui = (page) => page.locator('#live-edit-ui');
const bar = (page) => ui(page).locator('.le-toolbar');
const dialog = (page) => ui(page).locator('.le-scrim .le-modal');
const pagesPanel = (page) => ui(page).locator('.le-modal[aria-label="Pages"]');
const row = (page, id) => pagesPanel(page).locator(`.le-page-row[data-page="${id}"]`);

const arrive = async (page, width, made = [{ id: 'open-days', title: 'Open days', menu: true }, { id: 'visit', title: 'Visit us', menu: true }]) => {
    const site = await serveFakeHost({ library: true, removable: true, pagesList: true });
    if (made.length) site.host.save('structure:pages', JSON.stringify(made));
    for (const { id } of made) site.host.save(`structure:page:${id}`, JSON.stringify({ added: { 'add-aaaaaaaa': 'about.story' } }));
    await page.setViewportSize({ width, height: width < 700 ? 760 : 900 });
    await page.addInitScript(() => {
        window.liveEditToolbar = { links: [{ label: 'Dashboard', href: '/dashboard', icon: 'dashboard' }] };
        try { localStorage.setItem('live-edit:walkthrough:demo', '1'); } catch { /* fine */ }
    });
    await page.route(/\/dashboard$/, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Dashboard</title><h1>Dashboard</h1>' }));
    await page.goto(`${site.url}/edit/shop?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);

    return site;
};

/** Press a bar control, from the More sheet when the bar folded it away. */
const press = async (page, onBar, inSheet = onBar) => {
    const direct = bar(page).getByRole('button', { name: onBar, exact: true });
    if (await direct.isVisible()) {
        await direct.click();

        return true;
    }
    const more = ui(page).getByRole('button', { name: 'More' });
    // With a panel open the bar shrinks to its essentials: then there is no way to it.
    if (!(await more.isVisible())) return false;
    await more.click();
    await ui(page).locator('#le-more-sheet').getByRole('button', { name: inSheet, exact: true }).click();

    return true;
};

/** Type into the heading's panel, leaving it unsaved. */
const typeSomething = async (page) => {
    await page.locator('main h1').first().click();
    const field = ui(page).locator('.le-drawer.is-open .le-fields textarea, .le-drawer.is-open .le-fields input[type="text"]').first();
    await field.fill('Shop all');
    await expect(ui(page).locator('.le-foot-status')).toHaveText('Unsaved changes');
};

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

const overflow = (page) => page.evaluate(() => {
    const root = document.querySelector('#live-edit-ui').shadowRoot;
    return [...root.querySelectorAll('.le-modal *')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
    }).map((e) => `${e.tagName.toLowerCase()}.${e.className}`);
});

for (const width of [390, 768, 1440]) {
    test.describe(`at ${width}px`, () => {
        test('unsaved words are asked about before leaving, finishing or reloading; Discard, not Cancel', async ({ page }) => {
            const site = await arrive(page, width);
            try {
                // Nothing typed: nothing asked. The Dashboard link goes straight there.
                await page.locator('main h1').first().click();
                await expect(ui(page).locator('.le-drawer.is-open')).toBeVisible();
                await expect(ui(page).locator('.le-drawer .le-foot').getByRole('button', { name: 'Discard', exact: true })).toBeVisible();
                await expect(ui(page).locator('.le-drawer .le-foot').getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0);
                await ui(page).locator('.le-drawer .le-close').click();

                await typeSomething(page);

                // Reloading gets the browser's own question.
                let asked = null;
                page.once('dialog', async (question) => { asked = question.type(); await question.dismiss(); });
                await page.evaluate(() => { window.__stayed = true; });
                await page.reload({ timeout: 3000 }).catch(() => {});
                expect(asked).toBe('beforeunload');
                expect(await page.evaluate(() => window.__stayed)).toBe(true);

                // Closing the panel asks too (Discard or Keep editing).
                await ui(page).locator('.le-drawer .le-close').click();
                await expect(dialog(page)).toContainText('Discard what you typed?');
                await dialog(page).getByRole('button', { name: 'Keep editing' }).click();
                await expect(ui(page).locator('.le-foot-status')).toHaveText('Unsaved changes');

                // On a phone the open panel covers the bar: the ways out are the browser's, asked above.
                if (width < 700) return;

                // Finishing editing asks; Stay keeps the words in the panel.
                await bar(page).getByRole('button', { name: 'Done editing' }).click();
                await expect(dialog(page)).toContainText('You have unsaved changes');
                await expect(dialog(page)).toContainText('Leave without saving?');
                await dialog(page).getByRole('button', { name: 'Stay' }).click();
                await expect(dialog(page)).toHaveCount(0);
                await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
                await expect(ui(page).locator('.le-foot-status')).toHaveText('Unsaved changes');

                // Opening a page from Pages asks too; Stay keeps everything.
                if (await press(page, 'Pages')) {
                    await expect(dialog(page)).toContainText('Leave without saving?');
                    await dialog(page).getByRole('button', { name: 'Stay' }).click();
                    await expect(ui(page).locator('.le-foot-status')).toHaveText('Unsaved changes');
                }

                // A link out of the editor asks; Leave goes, without the browser asking again.
                // (From the keyboard: at 768 the open panel lies over that end of the bar.)
                const dashboard = bar(page).getByRole('link', { name: 'Dashboard' });
                if (await dashboard.isVisible()) {
                    await dashboard.focus();
                    await page.keyboard.press('Enter');
                } else {
                    await ui(page).getByRole('button', { name: 'More' }).click();
                    await ui(page).locator('#le-more-sheet').getByRole('link', { name: 'Dashboard' }).click();
                }
                await expect(dialog(page)).toContainText('You have unsaved changes');
                let secondQuestion = false;
                page.once('dialog', async (question) => { secondQuestion = true; await question.accept(); });
                await dialog(page).getByRole('button', { name: 'Leave' }).click();
                await expect(page).toHaveURL(/\/dashboard$/);
                expect(secondQuestion).toBe(false);
            } finally {
                await site.close();
            }
        });

        test('saved words leave without a question; Discard asks once and puts the words back', async ({ page }) => {
            const site = await arrive(page, width);
            try {
                await typeSomething(page);
                await ui(page).locator('.le-drawer .le-foot').getByRole('button', { name: 'Discard', exact: true }).click();
                await expect(dialog(page)).toContainText('Discard what you typed?');
                await dialog(page).getByRole('button', { name: 'Discard' }).click();
                await expect(page.locator('main h1').first()).toHaveText('Shop');

                // Nothing unsaved now: a reload is not questioned, and Done editing just finishes.
                let asked = false;
                page.on('dialog', async (question) => { asked = true; await question.accept(); });
                await bar(page).getByRole('button', { name: 'Done editing' }).click();
                await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(false);
                await page.reload();
                expect(asked).toBe(false);
            } finally {
                await site.close();
            }
        });

        test('no ", home" under the logo while editing; it is offered in the logo’s panel', async ({ page }) => {
            const site = await arrive(page, width);
            try {
                const spoken = page.locator('header .visually-hidden');
                await expect(spoken).toHaveText(', home');
                const box = await spoken.boundingBox();
                expect(box.width).toBeLessThanOrEqual(1);
                expect(box.height).toBeLessThanOrEqual(1);
                // Nothing of it is drawn: the logo link is exactly as tall as its own name.
                const drawn = await page.locator('header a.logo').evaluate((a) => [...a.getClientRects()].length);
                expect(drawn).toBe(1);

                await page.locator('header a.logo').click();
                const heard = ui(page).locator('.le-drawer.is-open').getByRole('button', { name: /screen readers say: , home/ });
                await expect(heard).toBeVisible();
                await heard.click();
                await expect(ui(page).locator('.le-drawer.is-open .le-fields textarea, .le-drawer.is-open .le-fields input[type="text"]').first()).toHaveValue(', home');
            } finally {
                await site.close();
            }
        });

        test('Pages lists every page in menu order, and New page offers no checkout, brand sheet or notice', async ({ page }) => {
            const site = await arrive(page, width);
            try {
                await press(page, 'Pages');
                await expect(pagesPanel(page)).toBeVisible();
                const inMenu = pagesPanel(page).locator('.le-pages-group').first();
                await expect(inMenu.locator('.le-section-heading')).toHaveText('In your menu');
                await expect(inMenu.locator('.le-page-title')).toHaveText(['Shop', 'About', 'Open days', 'Visit us']);
                await expect(row(page, 'shop')).toContainText('You are here');
                // The ones a website needs, apart and folded away.
                const needed = pagesPanel(page).locator('.le-pages-needed');
                await expect(needed.locator('summary')).toContainText('Pages your website uses');
                await needed.locator('summary').click();
                for (const id of ['checkout', 'brand', 'privacy']) await expect(row(page, id)).toContainText('Not in menu');
                await expect(row(page, 'checkout').locator('.le-page-delete')).toHaveCount(0);
                expect(await overflow(page)).toEqual([]);
                if (axeSource) expect(await axe(page)).toEqual([]);

                // Add page opens New page, which offers no internal page to start from.
                await pagesPanel(page).getByRole('button', { name: '+ Add page' }).click();
                await expect(ui(page).locator('.le-modal[aria-label="New page"]')).toBeVisible();
                const names = await ui(page).locator('.le-start .le-start-name').allTextContents();
                expect(names.length).toBeGreaterThan(0);
                for (const internal of ['Checkout', 'brand', 'Privacy', 'Aster Veil', 'First light']) expect(names).not.toContain(internal);
                expect(names).toContain('About');

                // and makes the page
                await ui(page).locator('.le-start', { hasText: 'About' }).first().click();
                await ui(page).locator('.le-name-title').fill('Team');
                await ui(page).getByRole('button', { name: 'Create page' }).click();
                await expect(page).toHaveURL(/\/edit\/team$/);
                await expect(page.locator('header nav')).toContainText('Team');
            } finally {
                await site.close();
            }
        });

        test('Pages renames, hides, reorders (keys and drag), duplicates and deletes', async ({ page }) => {
            const site = await arrive(page, width);
            try {
                await press(page, 'Pages');

                // rename
                await row(page, 'visit').getByRole('button', { name: 'Rename Visit us' }).click();
                await row(page, 'visit').locator('.le-page-rename').fill('Find us');
                await row(page, 'visit').locator('.le-page-rename').press('Enter');
                await expect(row(page, 'visit').locator('.le-page-title')).toHaveText('Find us');
                await expect(pagesPanel(page).locator('.le-pages-status')).toHaveText('Renamed to Find us.');

                // up and down from the keyboard
                await row(page, 'visit').getByRole('button', { name: 'Move Find us up' }).focus();
                await page.keyboard.press('Enter');
                const menuTitles = () => pagesPanel(page).locator('.le-pages-group').first().locator('.le-page-title');
                await expect(menuTitles()).toHaveText(['Shop', 'About', 'Find us', 'Open days']);
                await row(page, 'visit').getByRole('button', { name: 'Move Find us down' }).click();
                await expect(menuTitles()).toHaveText(['Shop', 'About', 'Open days', 'Find us']);

                // drag
                await row(page, 'visit').dragTo(row(page, 'open-days'));
                await expect(menuTitles()).toHaveText(['Shop', 'About', 'Find us', 'Open days']);
                expect(JSON.parse(site.host.settings['structure:pages']).map((p) => [p.id, p.title, p.menu])).toEqual([['visit', 'Find us', true], ['open-days', 'Open days', true]]);

                // out of the menu
                await expect(row(page, 'open-days').getByRole('checkbox', { name: 'Show Open days in the menu' })).toBeChecked();
                await row(page, 'open-days').locator('.le-page-menu').click();
                await expect(row(page, 'open-days')).toContainText('Not in menu');
                await expect(pagesPanel(page).locator('.le-pages-group').nth(1).locator('.le-section-heading')).toHaveText('Not in your menu');

                // duplicate
                await row(page, 'about').getByRole('button', { name: 'Duplicate About' }).click();
                await expect(row(page, 'about-copy')).toContainText('About (copy)');
                expect(JSON.parse(site.host.settings['structure:page:about-copy']).added).toBeTruthy();

                // delete: one of the owner's, then one of the design's
                await row(page, 'about-copy').getByRole('button', { name: 'Delete About (copy)' }).click();
                await expect(dialog(page).last()).toContainText('Delete About (copy)?');
                await dialog(page).last().getByRole('button', { name: 'Delete page' }).click();
                await expect(row(page, 'about-copy')).toHaveCount(0);
                await row(page, 'about').getByRole('button', { name: 'Delete About' }).click();
                await dialog(page).last().getByRole('button', { name: 'Delete page' }).click();
                await expect(row(page, 'about')).toHaveCount(0);
                expect(JSON.parse(site.host.settings['structure:removed'])).toEqual(['about']);
                if (axeSource) expect(await axe(page)).toEqual([]);

                // Reload to see it: the menu then shows the new order, and the list opens again.
                await pagesPanel(page).getByRole('button', { name: 'Reload to see it' }).click();
                await expect(pagesPanel(page)).toBeVisible();
                await expect(page.locator('header nav')).toContainText('Find us');
                await expect(page.locator('header nav')).not.toContainText('Open days');

                // open
                await row(page, 'visit').getByRole('button', { name: 'Open Find us' }).click();
                await expect(page).toHaveURL(/\/edit\/visit$/);
            } finally {
                await site.close();
            }
        });
    });
}
