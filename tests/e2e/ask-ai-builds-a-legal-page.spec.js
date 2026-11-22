import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

test('Ask AI builds a legal page from the template and its copied words stay editable', async ({ page }) => {
    const site = await serveFakeHost({ library: true, pagesList: true });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    try {
        await page.addInitScript(() => { window.__liveEditWalk = true; });
        await page.goto(`${site.url}/edit/shop?edit`);
        await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);

        // Simulate a template whose authored privacy source exists, but its route was removed from this website.
        await page.evaluate(() => {
            window.liveEditPages.pages = window.liveEditPages.pages.filter((one) => one.id !== 'privacy');
        });

        const action = await page.evaluate(() => window.__liveEditChat.act({
            type: 'page',
            do: 'add',
            kind: 'Privacy',
            title: 'Privacy Policy',
            label: 'Privacy Policy',
        }));

        expect(action).toMatchObject({ ok: true, goTo: expect.stringContaining('/edit/privacy-policy') });
        await page.goto(action.goTo);

        const editable = page.locator('main [data-edit^="setting:"]');
        await expect(editable.first()).toBeVisible();
        await expect(page.locator('main')).toContainText(/privacy/i);
        await page.screenshot({ path: '/private/tmp/live-edit-privacy-policy-page.png', fullPage: true });

        const original = await editable.first().textContent();
        await editable.first().click();
        const editor = page.locator('#live-edit-ui .le-drawer.is-open textarea[name="value"]');
        await expect(editor).toBeVisible();
        await editor.fill('Browser verification: this copied legal text is editable.');
        await page.locator('#live-edit-ui .le-drawer.is-open .le-foot').getByRole('button', { name: 'Save changes' }).click();
        await expect(page.locator('main')).toContainText('Browser verification: this copied legal text is editable.');
        expect(original).not.toContain('Browser verification');
        expect(errors).toEqual([]);
    } finally {
        await site.close();
    }
});
