import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * An editor whose grant does not include "Can publish" (the team invites work, 5 Nov 2026). The server
 * refuses their publish, so a Publish button only led to "Could not publish that… try again in a moment".
 * As WordPress's Contributor ("Submit for review") and Google Docs' suggesting: their bar says Ask to
 * publish, pressing it says in one line that the changes are saved and an admin puts them live, and no
 * publish is ever asked for. An editor who may publish sees Publish as before.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx playwright test tests/e2e/an-editor-who-may-not-publish.spec.js
 */
test.use({ ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}) });

const ui = (page) => page.locator('#live-edit-ui');
const bar = (page) => ui(page).locator('.le-toolbar');

const arrive = async (page, width, mayPublish) => {
    const site = await serveFakeHost({ mayPublish });
    await page.setViewportSize({ width, height: width < 700 ? 760 : 900 });
    await page.addInitScript(() => {
        try { localStorage.setItem('live-edit:walkthrough:demo', '1'); } catch { /* fine */ }
        let publishing;
        Object.defineProperty(window, 'liveEditPublishing', { configurable: true, get: () => publishing, set: (value) => { publishing = { ...value, pending: 2 }; } });
    });
    await page.goto(`${site.url}/edit/shop?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);

    return site;
};

const fitsTheScreen = (page) => page.evaluate(() => {
    const toolbar = document.querySelector('#live-edit-ui').shadowRoot.querySelector('.le-toolbar');
    const out = [];
    toolbar.querySelectorAll('button, a, button > span').forEach((e) => {
        if (e.getClientRects().length && e.scrollWidth > e.clientWidth + 1) out.push(`clipped "${e.textContent.trim()}"`);
        const r = e.getBoundingClientRect();
        if (r.width && (r.right > innerWidth + 1 || r.left < -1)) out.push(`off screen "${e.textContent.trim()}"`);
    });
    return out;
});

for (const width of [320, 390, 768, 1440]) {
    test.describe(`at ${width}px`, () => {
        test('an editor without "Can publish" is offered Ask to publish, never a publish that fails', async ({ page }) => {
            const site = await arrive(page, width, false);
            try {
                const button = bar(page).getByRole('button', { name: /^Ask to publish/ });
                await expect(button).toBeVisible();
                await expect(button).toContainText('2');
                await expect(button).toHaveAttribute('aria-label', 'Ask to publish, 2 changes saved');
                await expect(bar(page).getByRole('button', { name: /^Publish/ })).toHaveCount(0);
                expect(await fitsTheScreen(page)).toEqual([]);

                await button.click();
                const sheet = ui(page).locator('.le-modal[aria-label="Ask an admin to publish"]');
                await expect(sheet).toBeVisible();
                await expect(sheet).toContainText('Your 2 changes are saved.');
                await expect(sheet).not.toContainText('Could not publish');
                await expect(ui(page).getByRole('button', { name: 'Publish now' })).toHaveCount(0);
                await sheet.getByRole('button', { name: 'OK' }).click();
                await expect(sheet).toHaveCount(0);
                expect(site.publishAsked()).toBe(0);
                await expect(ui(page)).not.toContainText('Could not publish');
            } finally {
                await site.close();
            }
        });

        test('an editor with "Can publish" sees Publish and its dialog, as before', async ({ page }) => {
            const site = await arrive(page, width, true);
            try {
                const button = bar(page).getByRole('button', { name: /^Publish/ });
                await expect(button).toBeVisible();
                await expect(bar(page).getByRole('button', { name: /^Ask to publish/ })).toHaveCount(0);
                await button.click();
                await expect(ui(page).getByRole('button', { name: 'Publish now' })).toBeVisible();
                await expect(ui(page).locator('.le-modal[aria-label="Ask an admin to publish"]')).toHaveCount(0);
            } finally {
                await site.close();
            }
        });
    });
}
