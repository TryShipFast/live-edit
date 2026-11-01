import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * The drawer's order and states (UI/UX pass, 1 Nov 2026): what was clicked comes first and the
 * page shows it changing; the footer says when there are unsaved changes and Cancel puts the words
 * back; a price says when it has no amount; a link's page is chosen by name.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/the-drawer-puts-what-you-clicked-first.spec.js
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

let site;
test.beforeEach(async ({ page }) => {
    site = await serveFakeHost();
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(`${site.url}/edit/shop?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
});
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const fields = (page) => ui(page).locator('.le-fields');

test('the field that was clicked comes before the card’s actions', async ({ page }) => {
    await page.locator('[data-edit-item="aster"] p[data-edit]').click();
    const order = await fields(page).evaluate((box) => [...box.children].map((child) => child.matches('.le-group') ? 'card' : child.querySelector('textarea') ? 'field' : 'other'));
    expect(order.indexOf('field')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('field')).toBeLessThan(order.indexOf('card'));
});

test('typed words show on the page, the footer says they are unsaved, and Cancel puts them back', async ({ page }) => {
    const notes = page.locator('[data-edit-item="aster"] p[data-edit]');
    await notes.click();
    await ui(page).locator('.le-drawer textarea').first().fill('Neroli, cedar and rain');
    await expect(notes).toHaveText('Neroli, cedar and rain');
    await expect(ui(page).locator('.le-foot-status')).toHaveText('Unsaved changes');
    await ui(page).getByRole('button', { name: 'Cancel' }).click();
    const discard = ui(page).locator('.le-modal').getByRole('button').filter({ hasText: /discard|leave|close/i }).first();
    if (await discard.isVisible().catch(() => false)) await discard.click();
    await expect(notes).toHaveText('Neroli and cedar');
});

test('a price without an amount is called out before it is saved', async ({ page }) => {
    await page.locator('[data-edit-item="aster"] [data-kit-price]').click();
    const field = ui(page).locator('.le-price-field');
    await expect(field).toContainText('Price');
    await field.locator('textarea').fill('Ask us');
    await expect(field.locator('.le-hint--warn')).toContainText('without one this product has no price');
});

test('a link’s page is chosen by name and writes its address', async ({ page }) => {
    await page.locator('[data-edit-item="aster"] h3 a').click();
    const picker = ui(page).locator('.le-page-pick');
    await expect(picker).toHaveValue('products/aster-veil');
    await picker.selectOption('products/blue-hour');
    await expect(ui(page).locator('[data-link-field=href]')).toHaveValue('../products/blue-hour/');
});
