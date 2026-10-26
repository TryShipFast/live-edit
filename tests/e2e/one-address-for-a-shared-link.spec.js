import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * The owner changed where the header's "Journal" goes, on one page, and only
 * the pages at that depth followed: the header links relatively ("../journal/"
 * one folder down, "../../journal/" two), and its address was keyed per depth.
 * Now the host keys it once for every page and marks the way up to the site's
 * root (data-edit-href-root), the editor saves it from the root ("~/journal/"),
 * and every page writes it out for itself. On the stand-in host:
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/one-address-for-a-shared-link.spec.js
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

test.setTimeout(60000);

let site;
test.beforeEach(async () => { site = await serveFakeHost(); });
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const journal = (doc) => doc.querySelector('header nav a[data-key="nav.journal"]');

test('a header link pointed somewhere on one page points there from every page', async ({ page }) => {
    const key = journal(site.host.draw('products/aster-veil')).getAttribute('data-edit-href');
    expect(journal(site.host.draw('shop')).getAttribute('data-edit-href')).toBe(key);

    await page.goto(`${site.url}/edit/products/aster-veil?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();

    await page.locator('header nav a[data-key="nav.journal"]').click();
    const address = ui(page).locator('[data-link-field=href]');
    await expect(address).toHaveValue('../../journal/');
    await address.fill('../../journal/#latest');
    await ui(page).getByRole('button', { name: 'Save changes' }).click();

    await expect.poll(() => site.host.settings[key]).toBe('~/journal/#latest');
    expect(journal(site.host.draw('products/aster-veil')).getAttribute('href')).toBe('../../journal/#latest');
    expect(journal(site.host.draw('journal/salt-air')).getAttribute('href')).toBe('../../journal/#latest');
    expect(journal(site.host.draw('shop')).getAttribute('href')).toBe('../journal/#latest');
});

test('an address that means the same on every page is saved as typed', async ({ page }) => {
    const key = journal(site.host.draw('shop')).getAttribute('data-edit-href');

    await page.goto(`${site.url}/edit/shop?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();

    await page.locator('header nav a[data-key="nav.journal"]').click();
    await ui(page).locator('[data-link-field=href]').fill('https://journal.example.com/');
    await ui(page).getByRole('button', { name: 'Save changes' }).click();

    await expect.poll(() => site.host.settings[key]).toBe('https://journal.example.com/');
    expect(journal(site.host.draw('products/blue-hour')).getAttribute('href')).toBe('https://journal.example.com/');
});
