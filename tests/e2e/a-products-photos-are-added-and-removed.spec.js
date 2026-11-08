import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * Owner, 2 Nov 2026, on a product with three photos: "i see no where to add more or remove any"; "should have CTA that
 * leads there, not just give info"; "if a novice can't know how to add more images or remove from it then the info is
 * useless". Pressing a thumbnail opens the product's photos: each one to replace, move or remove, and + Add a photo.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/a-products-photos-are-added-and-removed.spec.js
 */
test.use({ ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}) });

const PX = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22/%3E';
// In the editor's own markers, as the host writes them (the page has been keyed before this is added to it).
const slide = (n, shown) => `<div class="gal-slide" data-item="t${n}" data-edit-item="t${n}"><img data-shot="${n - 1}" alt="Photo ${n}" src="${PX}#${n}" data-edit-img="setting:gallery.photo-${n}" width="40" height="40"${shown ? '' : ' hidden'}/>`
    + `<button class="gal-thumb" type="button" aria-label="Photo ${n} of 3" data-shot-btn="${n - 1}"><img data-kit-computed="gallery" src="${PX}#${n}" width="40" height="40" alt=""/></button></div>`;
const GALLERY = `<figure class="product-media" data-gallery><div class="gal" data-edit-list="tpl:gallery" data-edit-list-label="Product photos" data-edit-list-max="12" data-edit-list-min="1">${slide(1, true)}${slide(2)}${slide(3)}</div></figure>`;

test('a thumbnail opens the product’s photos, to add one or open each to replace, move or remove it', async ({ page }) => {
    const site = await serveFakeHost();
    try {
        await page.setViewportSize({ width: 1280, height: 860 });
        await page.route(/\/edit\/shop(\?.*)?$/, async (route) => {
            const response = await route.fetch();
            await route.fulfill({ response, body: (await response.text()).replace('</main>', `${GALLERY}</main>`) });
        });
        await page.goto(`${site.url}/edit/shop?edit`);
        await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
        const ui = page.locator('#live-edit-ui');
        const end = ui.locator('.le-walkthrough-end');
        if (await end.isVisible().catch(() => false)) await end.click();

        await page.locator('.gal-thumb').nth(1).click();
        const drawer = ui.locator('.le-drawer');
        await expect(drawer).toContainText('Product photos');
        await expect(drawer.locator('.le-gallery-photo')).toHaveCount(3);
        await expect(drawer.getByRole('button', { name: '+ Add a photo' })).toBeVisible();

        // A hidden photo (the third) is reached from here, with its own Duplicate and Delete, and the way back.
        await drawer.getByRole('button', { name: 'Photo 3 of 3' }).click();
        await expect(drawer.getByRole('button', { name: /Delete/ }).first()).toBeVisible();
        await expect(drawer.getByRole('button', { name: /Duplicate/ }).first()).toBeVisible();
        await drawer.getByRole('button', { name: 'All the photos' }).click();
        await expect(drawer.locator('.le-gallery-photo')).toHaveCount(3);

        // The photo on show leads to the same panel, with the way back to all of them.
        await page.keyboard.press('Escape');
        await page.locator('.gal-slide img[data-shot="0"]').click();
        await expect(drawer.getByRole('button', { name: 'All the photos' })).toBeVisible();
    } finally {
        await site.close();
    }
});
