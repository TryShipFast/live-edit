import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * Found by the Live Edit walk on Maren Salon at 390: the editor's own bar sat over the site's fixed
 * things at the foot of a phone screen (the Book and Call bar, a cookie notice), where no scrolling
 * reaches, and the drawing in the phone's menu button opened the menu, never its own panel.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/the-editor-leaves-the-site-reachable.spec.js
 */

test.use({
    viewport: { width: 390, height: 844 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

let site;
test.beforeEach(async () => { site = await serveFakeHost(); });
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');

const openAsEditor = async (page) => {
    await page.goto(`${site.url}/edit/shop?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
};

/** What a phone template puts at the foot of the screen, and its menu button. */
const addPhoneThings = (page) => page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', `
        <div class="mbar" style="position:fixed;left:0;right:0;bottom:0;height:56px;display:flex;gap:12px;align-items:center;padding:0 16px;background:#fff">
          <a href="#book" data-edit="setting:mbar-book">Book</a>
        </div>
        <button type="button" class="menu-open" aria-label="Open menu" aria-controls="phone-menu" data-menu-open
          style="position:fixed;top:8px;right:8px;width:44px;height:44px">
          <svg data-edit-svg="setting:menu-drawing" width="24" height="24" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="#000"/></svg>
        </button>
        <dialog id="phone-menu"><a href="#a">A link in the menu</a></dialog>`);
    document.querySelector('.menu-open').addEventListener('click', () => document.getElementById('phone-menu').showModal());
});

test('the site’s own bar at the foot of a phone screen is lifted clear of the editor’s bar', async ({ page }) => {
    await openAsEditor(page);
    await addPhoneThings(page);
    const book = page.locator('.mbar a');
    await expect.poll(async () => {
        const box = await book.boundingBox();
        return page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.textContent, [box.x + box.width / 2, box.y + box.height / 2]);
    }).toBe('Book');
    await book.click();
    await expect(ui(page).locator('.le-drawer textarea').first()).toHaveValue('Book');

    // Put back exactly as it was once editing stops: a visitor never sees it moved.
    await page.evaluate(() => document.body.classList.remove('editing'));
    await expect.poll(() => page.evaluate(() => document.querySelector('.mbar').style.translate)).toBe('');
});

test('the drawing in a phone’s menu button opens its own panel, which offers the menu', async ({ page }) => {
    await openAsEditor(page);
    await addPhoneThings(page);
    await page.locator('.menu-open svg').click();
    await expect(page.locator('#phone-menu')).not.toHaveAttribute('open', '');
    await expect(ui(page).locator('.le-drawer.is-open')).toBeVisible();
    await ui(page).getByRole('button', { name: 'Press “Open menu”' }).click();
    await expect(page.locator('#phone-menu')).toHaveAttribute('open', '');
});
