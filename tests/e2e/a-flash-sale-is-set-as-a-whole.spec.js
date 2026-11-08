import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';
import { keyOf } from '../support/fake-host.js';

/*
 * A flash sale, set as a whole (owner, 8 Nov 2026: "sales card must be editable at once, not each being editable one
 * by one"; "just like we can edit tables, cards"; on a countdown, "it should open so that it can be edited"; "live
 * edit should be sufficient to setup their store"). A product's sale line, a card's sale and a countdown each open
 * one grid of every product (the table's grid): tick, price, sale price, % off, In stock, one Starts and one Ends.
 * Saving writes the words the shop already reads on each product page; one Undo takes the whole sale back.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/a-flash-sale-is-set-as-a-whole.spec.js
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

test.setTimeout(120000);

const STOCK = [
    { product: 'products/aster-veil', name: 'Aster Veil', size: '50ml', quantity: 4 },
    { product: 'products/aster-veil', name: 'Aster Veil', size: '100ml', quantity: null },
    { product: 'products/blue-hour', name: 'Blue Hour', size: '', quantity: 0 },
];

let site;
test.beforeEach(async ({ page }) => {
    site = await serveFakeHost({ sale: { stock: STOCK } });
    page.on('dialog', (dialog) => dialog.accept());
});
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const drawer = (page) => ui(page).locator('.le-drawer');
const sheet = (page) => drawer(page).locator('.le-figures');
const cell = (page, r, c) => sheet(page).locator(`[data-row="${r}"][data-col="${c}"]`);
const saveSheet = (page) => drawer(page).locator('.le-figures-foot').getByRole('button', { name: 'Save changes' }).click();

const openAsEditor = async (page, path) => {
    await page.goto(`${site.url}/edit/${path}?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
};
const saved = (page_, selector) => site.host.settings[keyOf(site.host.draw(page_), selector)];

test('a product\'s sale price opens the whole sale as a grid; saved, the page says the new words', async ({ page }) => {
    await openAsEditor(page, 'products/aster-veil');
    await page.locator('[data-kit-sale-price]').click();

    await expect(drawer(page).locator('.le-title')).toHaveText('Sale and stock');
    // One row a product; Aster Veil's sizes folded under it, its stock in a few words; Blue Hour counted on its row.
    await expect(sheet(page).locator('tbody tr')).toHaveCount(2);
    await expect(sheet(page).locator('tr.is-picked')).toContainText('Aster Veil');
    await expect(cell(page, 0, 3)).toBeFocused();
    await expect(cell(page, 1, 5)).toHaveValue('0');
    await expect(sheet(page).locator('td.is-sold-out')).toHaveCount(1);
    const sizes = sheet(page).locator('[data-summary-row="0"]');
    await expect(sizes).toHaveText(/4 in 1 of 2 sizes/);
    await expect(sizes).toHaveAttribute('aria-expanded', 'false');

    // A % off fills the sale price and ticks it; a stock count for one size.
    await cell(page, 0, 4).fill('25');
    await expect(cell(page, 0, 3)).toHaveValue('$89');
    await expect(cell(page, 0, 0)).toBeChecked();
    await cell(page, 0, 3).fill('90');
    await expect(cell(page, 0, 4)).toHaveValue('24');
    await sizes.click();
    await expect(sheet(page).locator('.le-sale-size-name')).toHaveText(['50ml', '100ml']);
    await sheet(page).getByLabel('Aster Veil, 50ml, in stock').fill('2');
    await expect(sizes).toHaveText(/2 in 1 of 2 sizes/);
    await drawer(page).locator('input[name="ends"]').fill('2026-12-31');
    await expect(drawer(page).locator('.le-sale-ends')).toContainText('Ends 31 Dec 2026');
    await saveSheet(page);

    await expect.poll(() => saved('products/aster-veil', '[data-kit-sale-until]')).toBe('31 Dec 2026');
    expect(saved('products/aster-veil', '[data-kit-sale-price]')).toBe('$90');
    // With nothing on sale, the sale starts today, written as a day.
    const today = new Date();
    expect(saved('products/aster-veil', '[data-kit-sale-from]')).toBe(`${today.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][today.getUTCMonth()]} ${today.getUTCFullYear()}`);
    expect(saved('products/blue-hour', '[data-kit-sale-price]')).toBeUndefined();
    expect(site.stock().find((row) => row.size === '50ml').quantity).toBe(2);
    await expect(page.locator('[data-kit-sale-price]')).toHaveText('$90');
    await expect(page.locator('[data-kit-sale-until]')).toHaveText('31 Dec 2026');

    // Unticked, it is "No sale".
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    await page.locator('[data-kit-sale-price]').click();
    await expect(cell(page, 0, 0)).toBeChecked();
    await cell(page, 0, 0).uncheck();
    await saveSheet(page);
    await expect.poll(() => saved('products/aster-veil', '[data-kit-sale-price]')).toBe('No sale');
    await expect(page.locator('[data-kit-sale-price]')).toHaveText('No sale');
});

test('a card\'s sale and a countdown open the same grid, never "Counted for you"', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const cardSale = page.locator('[data-kit-product="blue"] [data-card-sale]');
    await cardSale.hover();
    await expect(ui(page).locator('.le-hover-label')).toHaveText('Sale: press to change the sale');
    await cardSale.click();
    await expect(sheet(page).locator('tr.is-picked')).toContainText('Blue Hour');
    await expect(drawer(page)).not.toContainText('Counted for you');

    // Two products at once, at one % off, with one end day.
    await cell(page, 0, 0).check();
    await cell(page, 1, 0).check();
    await cell(page, 1, 3).fill('80');
    // One % off for all: asked before changing a product that has its own sale price.
    await drawer(page).locator('#le-sale-all-box').fill('20');
    await drawer(page).getByRole('button', { name: 'Apply to ticked' }).click();
    await expect(cell(page, 0, 3)).toHaveValue('$94');
    await expect(drawer(page).locator('.le-sale-ask')).toContainText('1 ticked product has its own sale price. Change it to 20% off too?');
    await drawer(page).getByRole('button', { name: 'Keep their prices' }).click();
    await expect(cell(page, 1, 3)).toHaveValue('$80');
    await drawer(page).getByRole('button', { name: 'Apply to ticked' }).click();
    await drawer(page).getByRole('button', { name: 'Change them too' }).click();
    await expect(cell(page, 1, 3)).toHaveValue('$77');
    await drawer(page).locator('input[name="ends"]').fill('2026-11-15');
    await Promise.all([page.waitForNavigation(), saveSheet(page)]);
    await expect.poll(() => saved('products/blue-hour', '[data-kit-sale-until]')).toBe('15 Nov 2026');
    expect(saved('products/blue-hour', '[data-kit-sale-price]')).toBe('$77');
    expect(saved('products/aster-veil', '[data-kit-sale-price]')).toBe('$94');
    expect(saved('products/aster-veil', '[data-kit-sale-until]')).toBe('15 Nov 2026');

    // The countdown opens it too, with Ends ready to change and the product ending last picked.
    await openAsEditor(page, 'shop');
    await page.locator('[data-cd]').hover();
    await expect(ui(page).locator('.le-hover-label')).toHaveText('Countdown: press to change the sale');
    await page.locator('[data-cd]').click();
    await expect(drawer(page).locator('input[name="ends"]')).toBeFocused();
    await expect(drawer(page).locator('input[name="ends"]')).toHaveValue('2026-11-15');

    // Each card on sale wears the editor's label; pressing it opens the sale on that product.
    await expect(ui(page).locator('.le-sale-label')).toHaveCount(2);
    await expect(ui(page).locator('.le-sale-label').first()).toContainText(/On sale · \$9[4] · ends 15 Nov|Sale ended/);
});

test('one Undo takes the whole sale back', async ({ page }) => {
    await openAsEditor(page, 'products/blue-hour');
    await page.locator('[data-kit-sale-price]').click();
    await cell(page, 1, 4).fill('50');
    await drawer(page).locator('input[name="ends"]').fill('2026-12-01');
    await saveSheet(page);
    await expect.poll(() => saved('products/blue-hour', '[data-kit-sale-price]')).toBe('$48');
    await expect(page.locator('[data-kit-sale-price]')).toHaveText('$48');

    await ui(page).getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('[data-kit-sale-price]')).toHaveText('No sale');
    await expect(page.locator('[data-kit-sale-until]')).toHaveText('No end date');
});

test('the Shop tab opens the same grid, with every product and its stock', async ({ page }) => {
    await openAsEditor(page, 'journal/first-light');
    await page.locator('main h1').first().click();
    await ui(page).locator('.le-tab', { hasText: 'Shop' }).first().click();
    await drawer(page).getByRole('button', { name: 'Edit sale and stock' }).click();
    await expect(drawer(page).locator('.le-title')).toHaveText('Sale and stock');
    await expect(sheet(page).locator('tbody tr')).toHaveCount(2);
    await expect(sheet(page).locator('tr.is-picked')).toHaveCount(0);
    await expect(drawer(page)).toContainText('Leave In stock empty if you do not count it.');
});

test('the grid opens at once and fills in as the product pages arrive', async ({ page }) => {
    await site.close();
    site = await serveFakeHost({ sale: { stock: STOCK, slow: 3000 } });
    await openAsEditor(page, 'shop');
    await page.locator('[data-cd]').click();
    await expect(sheet(page).locator('tbody tr')).toHaveCount(2);
    await expect(drawer(page).locator('.le-sale-reading')).toContainText('Still loading 2 of 2 products. You can start now');
    await expect(sheet(page).locator('tbody tr').first()).toContainText('Loading…');
    await expect(drawer(page).locator('.le-sale-reading')).toBeHidden({ timeout: 15000 });
    await expect(sheet(page).locator('tbody tr').first()).toContainText('$118');
    await expect(drawer(page).locator('input[name="starts"]')).not.toHaveValue('');
});

test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('each product reads as a small card: name, then its prices, then its stock, with no sideways scroll', async ({ page }) => {
        await openAsEditor(page, 'products/aster-veil');
        await page.locator('[data-kit-sale-price]').click();
        const row = sheet(page).locator('tbody > tr').first();
        await expect(row).toContainText('Aster Veil');
        const scroll = await sheet(page).evaluate((table) => { const s = table.closest('.le-figures-scroll'); return s.scrollWidth - s.clientWidth; });
        expect(scroll).toBeLessThanOrEqual(0);
        const [name, price, sale, stock] = await Promise.all([2, 3, 4, 6].map((n) => row.locator(`td:nth-child(${n})`).boundingBox()));
        expect(price.y).toBeGreaterThan(name.y + name.height - 2);
        expect(Math.abs(sale.y - price.y)).toBeLessThan(12);
        expect(stock.y).toBeGreaterThan(sale.y + sale.height - 2);
        await expect(row.locator('td:nth-child(4)')).toHaveAttribute('data-th', 'Sale price');
    });
});

/*
 * Nothing overlaps, nothing runs out of its card or the drawer, nothing scrolls sideways (owner, 8 Nov 2026: "make sure
 * nothing is overlapping"; "all list items are properly spaced"): measured on every text, box and button of the grid,
 * with a product's sizes open and with rows still loading, at a small phone, a phone, a tablet and a laptop.
 */
const layoutProblems = (page) => page.evaluate(() => {
    const root = document.getElementById('live-edit-ui').shadowRoot;
    const drawerBox = root.querySelector('.le-drawer').getBoundingClientRect();
    const grid = root.querySelector('.le-sale-grid');
    const shown = (node) => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(node).visibility !== 'hidden';
    };
    const name = (node) => `${node.tagName.toLowerCase()}.${String(node.className).split(' ')[0]}${node.getAttribute('aria-label') ? `[${node.getAttribute('aria-label')}]` : ''} “${(node.value ?? node.textContent ?? '').trim().slice(0, 24)}”`;
    const foot = grid.querySelector('.le-figures-foot');
    const parts = [...grid.querySelectorAll('input, button, .le-figures-read, .le-figures-th, .le-sale-size-name')]
        .filter((node) => !foot.contains(node) && shown(node));
    const problems = [];
    const inside = (a, b) => a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5;
    for (let i = 0; i < parts.length; i += 1) {
        const a = parts[i].getBoundingClientRect();
        for (let j = i + 1; j < parts.length; j += 1) {
            if (parts[i].contains(parts[j]) || parts[j].contains(parts[i])) continue;
            const b = parts[j].getBoundingClientRect();
            const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (w > 1 && h > 1) problems.push(`${name(parts[i])} overlaps ${name(parts[j])}`);
        }
        const card = parts[i].closest('tr');
        if (card && !inside(a, card.getBoundingClientRect())) problems.push(`${name(parts[i])} runs outside its row`);
        if (a.left < drawerBox.left - 0.5 || a.right > drawerBox.right + 0.5) problems.push(`${name(parts[i])} runs outside the drawer`);
    }
    // nothing past the panel's own padding
    const fields = root.querySelector('.le-fields');
    const fieldsBox = fields.getBoundingClientRect();
    const pad = getComputedStyle(fields);
    const left = fieldsBox.left + parseFloat(pad.paddingLeft) - 0.5;
    const right = fieldsBox.right - parseFloat(pad.paddingRight) + 0.5;
    for (const node of parts) {
        const r = node.getBoundingClientRect();
        if (r.left < left || r.right > right) problems.push(`${name(node)} runs past the panel's padding`);
    }
    // a product's sizes are inside its card: the same width, straight under it
    for (const sizes of grid.querySelectorAll('tr.le-sale-sizes')) {
        const s = sizes.getBoundingClientRect();
        const p = sizes.previousElementSibling.getBoundingClientRect();
        if (Math.abs(s.left - p.left) > 1 || Math.abs(s.right - p.right) > 1 || Math.abs(s.top - p.bottom) > 1) problems.push('a product\'s sizes sit outside its card');
    }
    // in a row: the column names on one line, the values on one line
    for (const tr of grid.querySelectorAll('tbody > tr:not(.le-sale-sizes)')) {
        const cells = [3, 4, 5].map((n) => tr.querySelector(`td:nth-child(${n})`)).filter((td) => td && shown(td));
        const tops = (pick) => cells.map(pick).filter((node) => node && shown(node)).map((node) => node.getBoundingClientRect().top);
        const spread = (list) => (list.length ? Math.max(...list) - Math.min(...list) : 0);
        if (spread(tops((td) => td.querySelector('.le-figures-th'))) > 1) problems.push(`${tr.textContent.trim().slice(0, 20)}: its column names are not on one line`);
        if (spread(tops((td) => td.querySelector('input, .le-figures-read'))) > 1) problems.push(`${tr.textContent.trim().slice(0, 20)}: its values are not on one line`);
    }
    for (const scroller of [root.querySelector('.le-fields'), grid.querySelector('.le-figures-scroll')]) {
        if (scroller.scrollWidth > scroller.clientWidth + 1) problems.push(`${scroller.className} scrolls sideways (${scroller.scrollWidth} in ${scroller.clientWidth})`);
    }
    // a box typed in is never under the Save bar
    const typing = root.activeElement;
    if (typing?.matches?.('input') && grid.contains(typing)) {
        const t = typing.getBoundingClientRect();
        const f = foot.getBoundingClientRect();
        if (t.bottom > f.top + 1 && t.top < f.bottom) problems.push(`${name(typing)} is under the Save bar`);
    }

    return problems;
});

for (const [width, height] of [[320, 640], [390, 844], [768, 1024], [1440, 900]]) {
    test(`at ${width}px nothing in the grid overlaps or runs out, loading or with sizes open`, async ({ page }) => {
        await site.close();
        site = await serveFakeHost({ sale: { stock: STOCK, slow: 4000 } });
        await page.setViewportSize({ width, height });
        await openAsEditor(page, 'products/aster-veil');
        await page.locator('[data-kit-sale-price]').click();
        await expect(drawer(page).locator('.le-sale-reading')).toBeVisible();
        await sheet(page).locator('[data-summary-row="0"]').click();
        await expect(sheet(page).locator('.le-sale-size')).toHaveCount(2);
        expect(await layoutProblems(page)).toEqual([]);
        // every row loaded
        await expect(drawer(page).locator('.le-sale-reading')).toBeHidden({ timeout: 15000 });
        expect(await layoutProblems(page)).toEqual([]);
        // typing in the last box: brought clear of the Save bar
        await sheet(page).getByLabel('Aster Veil, 100ml, in stock').fill('3');
        await sheet(page).locator('[data-row="1"][data-col="5"]').focus();
        await page.waitForTimeout(300);
        expect(await layoutProblems(page)).toEqual([]);
    });
}
