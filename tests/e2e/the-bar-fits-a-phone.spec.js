import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * Owner, 2 Nov 2026: "live edit plugin cuts off on mobile, i just tested on 375px" ("Published" ran 5px past the
 * screen and its count was hidden). At every common phone width nothing of the editor's own runs past the screen,
 * with More closed or open.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/the-bar-fits-a-phone.spec.js
 */
test.use({ ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}) });

const pastTheEdge = (page) => page.evaluate(() => {
    const root = document.querySelector('#live-edit-ui').shadowRoot;
    return [...root.querySelectorAll('*')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(e).visibility !== 'hidden';
    }).map((e) => `${e.tagName.toLowerCase()}.${e.className} "${(e.textContent || '').trim().slice(0, 20)}"`);
});

for (const width of [320, 360, 375, 390, 414]) {
    test(`the bar fits a ${width}px phone`, async ({ page }) => {
        const site = await serveFakeHost();
        try {
            await page.setViewportSize({ width, height: 760 });
            await page.goto(`${site.url}/edit/shop?edit`);
            await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
            const ui = page.locator('#live-edit-ui');
            const end = ui.locator('.le-walkthrough-end');
            if (await end.isVisible().catch(() => false)) await end.click();

            expect(await pastTheEdge(page)).toEqual([]);
            await expect(ui.locator('.le-publish')).toBeInViewport({ ratio: 1 });

            await ui.getByRole('button', { name: 'More' }).click();
            expect(await pastTheEdge(page)).toEqual([]);
            // Undo and Redo are there, under More
            await expect(ui.locator('.le-toolbar .le-round').first()).toBeVisible();
        } finally {
            await site.close();
        }
    });
}
