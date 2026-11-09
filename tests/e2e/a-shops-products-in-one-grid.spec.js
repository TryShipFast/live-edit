import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * A shop's products in one grid (owner, 8 Nov 2026: "live edit should be sufficient to setup their store"; "they only go
 * to the dashboard for orders"). The Shop tab's Edit products opens every product and each of its sizes as rows: Photo,
 * Name, Price, SKU, Collections, Featured, Stock, with a Columns menu. Saving writes the words each product page already
 * holds and the lists each collection and the home page already keep; one Undo takes it all back.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/a-shops-products-in-one-grid.spec.js
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

test.setTimeout(120000);

const STOCK = [
    { product: 'products/aster-veil', name: 'Aster Veil', size: '50 ml', quantity: 4, sku: 'VLM-1001-50' },
    { product: 'products/aster-veil', name: 'Aster Veil', size: '100 ml', quantity: null, sku: 'VLM-1001-100' },
    { product: 'products/blue-hour', name: 'Blue Hour', size: '50 ml', quantity: 0, sku: 'VLM-1002-50' },
    { product: 'products/blue-hour', name: 'Blue Hour', size: '100 ml', quantity: 2, sku: 'VLM-1002-100' },
];

let site;
test.beforeEach(async ({ page }) => {
    site = await serveFakeHost({ sale: { stock: STOCK, products: true } });
    page.on('dialog', (dialog) => dialog.accept());
});
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const drawer = (page) => ui(page).locator('.le-drawer');
const sheet = (page) => drawer(page).locator('.le-products-grid .le-figures');
const cell = (page, r, c) => sheet(page).locator(`[data-row="${r}"][data-col="${c}"]`);
const row = (page, r) => sheet(page).locator('tbody tr').nth(r);
const saved = (page_, selector, n = 0) => site.host.settings[(site.host.draw(page_).querySelectorAll(selector)[n]?.getAttribute('data-edit') ?? '').replace(/^setting:/, '')];

const openProducts = async (page) => {
    await page.goto(`${site.url}/edit/journal/first-light?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
    await page.locator('main h1').first().click();
    await ui(page).locator('.le-tab', { hasText: 'Shop' }).first().click();
    await drawer(page).getByRole('button', { name: 'Edit products' }).click();
    await expect(drawer(page).locator('.le-title')).toHaveText('Products');
    await expect(sheet(page).locator('tbody tr')).toHaveCount(6);
};

test('every product and size in one grid: a price, an SKU, a collection, Featured and stock, saved once', async ({ page }) => {
    await openProducts(page);
    // Aster Veil, its two sizes, then Blue Hour and its two.
    await expect(cell(page, 0, 1)).toHaveValue('Aster Veil');
    await expect(row(page, 1)).toContainText('50 ml');
    await expect(row(page, 1)).toHaveClass(/is-size/);
    await expect(cell(page, 0, 3)).toHaveValue('VLM-1001');
    await expect(cell(page, 1, 3)).toHaveValue('VLM-1001-50');
    await expect(cell(page, 1, 6)).toHaveValue('4');
    await expect(row(page, 0).locator('.le-product-collections-said')).toHaveText('Shop');
    await expect(cell(page, 0, 5)).toBeChecked();
    await expect(cell(page, 3, 5)).not.toBeChecked();

    // A price typed as a figure is written as the shop writes it; the size priced like it follows.
    await cell(page, 0, 2).fill('99');
    await cell(page, 0, 2).press('Tab');
    await expect(cell(page, 0, 2)).toHaveValue('$99');
    await expect(cell(page, 1, 2)).toHaveValue('$99');
    await expect(cell(page, 2, 2)).toHaveValue('$180');

    // An SKU another product has is red, said in the cell, and never refused.
    await cell(page, 3, 3).fill('vlm-1001');
    await expect(row(page, 3).locator('.le-sku-taken')).toHaveText('Another product has this SKU');
    await expect(row(page, 0).locator('.le-sku-taken')).toHaveText('Another product has this SKU');
    await cell(page, 3, 3).fill('VLM-2002');
    await expect(sheet(page).locator('.le-sku-taken')).toHaveCount(0);

    // Aster Veil into Gifts, Blue Hour into Featured; a size's stock.
    await expect(row(page, 3).locator('.le-product-collections-said')).toHaveText('Shop, Gifts');
    await row(page, 0).locator('.le-product-collections-toggle').click();
    await row(page, 0).getByRole('checkbox', { name: 'Gifts' }).check();
    await expect(row(page, 0).locator('.le-product-collections-said')).toHaveText('Shop, Gifts');
    await expect(row(page, 0).locator('.le-product-collections-toggle')).toHaveAttribute('aria-label', /Shop, Gifts\. Hide/);
    await cell(page, 3, 5).check();
    await cell(page, 4, 6).fill('7');

    // The Columns menu hides one, kept in this browser.
    await drawer(page).getByRole('button', { name: 'Columns' }).click();
    await drawer(page).locator('.le-products-columns').getByLabel('Photo').uncheck();
    await expect(sheet(page).locator('thead th').first()).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('live-edit:product-columns'))).not.toContain('photo');

    await Promise.all([page.waitForNavigation(), drawer(page).locator('.le-figures-foot').getByRole('button', { name: 'Save changes' }).click()]);
    await expect.poll(() => saved('products/aster-veil', '[data-kit-price]')).toBe('$99');
    expect(saved('products/aster-veil', '[data-kit-price]', 1)).toBe('$99');
    expect(saved('products/blue-hour', '[data-kit-sku]')).toBe('VLM-2002');
    expect(JSON.parse(site.host.settings['structure:products:gifts'])).toEqual(['blue', 'aster']);
    expect(JSON.parse(site.host.settings['structure:products:home'])).toEqual(['aster', 'blue']);
    expect(site.host.settings['structure:products:shop']).toBeUndefined();
    expect(site.stock().find((r) => r.product === 'products/blue-hour' && r.size === '50 ml').quantity).toBe(7);

    // Opened again, it says what was saved, with the photo column still hidden.
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    await page.locator('main h1').first().click();
    await ui(page).locator('.le-tab', { hasText: 'Shop' }).first().click();
    await drawer(page).getByRole('button', { name: 'Edit products' }).click();
    await expect(cell(page, 0, 2)).toHaveValue('$99');
    await expect(cell(page, 3, 5)).toBeChecked();
    await expect(sheet(page).locator('thead th').first()).toBeHidden();
});

test('a phone shows each product as a small card, every value named', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProducts(page);
    const first = row(page, 0);
    await expect(first.locator('td').nth(2).locator('.le-figures-th')).toHaveText('Price');
    const box = await first.boundingBox();
    expect(box.width).toBeLessThanOrEqual(390);
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scroll).toBeLessThanOrEqual(390);
});
