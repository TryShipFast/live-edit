import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * Owner, 2 Nov 2026, on "Delivery across Nigeria ₦4,500, free when products come to ₦40,000 or more": "if some words
 * are shop settings bound, should they be editable or asked to edit it via the shop". A delivery price is written on
 * many pages; the Shop tab saves every copy, the page saved one. So pressing it opens the Shop tab at its field, and
 * the words around it stay editable on the page.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/a-shop-term-opens-the-shop-tab.spec.js
 */
test.use({ ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}) });

test('a delivery price opens the Shop tab at its field; the words beside it are edited on the page', async ({ page }) => {
    const site = await serveFakeHost();
    try {
        await page.setViewportSize({ width: 1280, height: 860 });
        await page.route(/\/edit\/shop(\?.*)?$/, async (route) => {
            const response = await route.fetch();
            const html = (await response.text()).replace('</main>', '<p data-kit-terms><span data-edit="setting:terms.words">Delivery across Nigeria</span> <span class="rate" data-kit-rate="std" data-edit="setting:terms.rate">₦4,500</span></p></main>');
            await route.fulfill({ response, body: html });
        });
        await page.addInitScript(() => {
            window.liveEditShop = { products: [], checkout: { modes: [] }, fields: [
                { keys: ['terms.rate', 'bag.rate', 'checkout.rate'], label: 'Doorstep delivery', kind: 'rate', value: '₦4,500' },
            ] };
        });
        await page.goto(`${site.url}/edit/shop?edit`);
        await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
        const ui = page.locator('#live-edit-ui');
        const end = ui.locator('.le-walkthrough-end');
        if (await end.isVisible().catch(() => false)) await end.click();

        await page.locator('.rate').click();
        const focused = () => page.evaluate(() => document.querySelector('#live-edit-ui').shadowRoot.activeElement?.dataset.shopKeys ?? '');
        await expect.poll(focused).toContain('terms.rate');
        await expect(ui.locator('[data-shop-part="delivery"]')).toBeVisible();

        // The words beside it are still the page's own to edit.
        await page.keyboard.press('Escape');
        await page.getByText('Delivery across Nigeria').click();
        await expect(ui.locator('.le-drawer textarea, .le-drawer [contenteditable], .le-drawer input[type="text"]').first()).toBeVisible();
    } finally {
        await site.close();
    }
});
