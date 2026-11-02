import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * Owner, 2 Nov 2026: "on live edit, add new product create a scroll". Opening + Add a product in the Shop tab must
 * not widen the drawer past a phone's screen: nothing of the editor's own runs past the edge, and the drawer does not
 * scroll sideways.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/adding-a-product-fits-a-phone.spec.js
 */
test.use({ ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}) });

const sideways = (page) => page.evaluate(() => {
    const root = document.querySelector('#live-edit-ui').shadowRoot;
    const past = [...root.querySelectorAll('*')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(e).visibility !== 'hidden';
    }).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`);
    const scrolls = [...root.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 1
        && /(auto|scroll)/.test(getComputedStyle(e).overflowX)).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} scrolls sideways`);
    return [...new Set([...past, ...scrolls])];
});

for (const width of [320, 375, 390]) {
    test(`adding a product fits a ${width}px phone`, async ({ page }) => {
        const site = await serveFakeHost();
        try {
            await page.setViewportSize({ width, height: 760 });
            await page.addInitScript(() => {
                window.liveEditShop = { products: [{ id: 'wax', name: 'Carnauba paste wax', href: '/products/wax/' }], checkout: { modes: [] }, fields: [] };
                // Merged into what the page itself sets, as the host's ThePagesTheOwnerArranged would send it.
                const shop = {
                    catalogue: { key: 'shop.catalogue', likes: [{ id: 'wax', name: 'Carnauba paste wax' }], items: [] },
                    categories: [
                        { id: 'care', title: 'Paint and bodywork protection products', productsKey: 'shop.care', has: ['wax'] },
                        { id: 'glass', title: 'Glass', productsKey: 'shop.glass', has: [] },
                    ],
                    taken: [],
                };
                let pages;
                Object.defineProperty(window, 'liveEditPages', { configurable: true, get: () => pages, set: (v) => { pages = { ...v, ...shop }; } });
                window.liveEditPages = {};
            });
            await page.goto(`${site.url}/edit/shop?edit`);
            await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
            const ui = page.locator('#live-edit-ui');
            const end = ui.locator('.le-walkthrough-end');
            if (await end.isVisible().catch(() => false)) await end.click();

            await page.locator('main h1').first().click();
            await ui.locator('.le-drawer').getByText('Shop', { exact: true }).first().click();
            await ui.locator('.le-shop-add-product').click();
            await expect(ui.locator('.le-shop-new-product')).toBeVisible();

            expect(await sideways(page)).toEqual([]);
        } finally {
            await site.close();
        }
    });
}
