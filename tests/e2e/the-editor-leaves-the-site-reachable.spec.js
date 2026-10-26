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
        <dialog id="phone-menu" style="width:100%;height:100%;max-width:none;max-height:none;margin:0"><a href="#a" data-edit="setting:menu-services">Services</a></dialog>`);
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
    // A map with its street names drawn in: not a drawing to put in the menu button's place.
    await page.evaluate(() => document.querySelector('main').insertAdjacentHTML('afterbegin',
        '<svg class="map" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="#eee"/><text x="20" y="40">Mill Lane</text></svg>'));
    await page.locator('.menu-open svg').click();
    await expect(page.locator('#phone-menu')).not.toHaveAttribute('open', '');
    await expect(ui(page).locator('.le-drawer.is-open')).toBeVisible();
    await expect(ui(page).locator('.le-icon-grid .le-icon-choice').first()).toBeVisible();
    expect((await ui(page).locator('.le-icon-grid').allInnerTexts()).join(' ') + (await ui(page).locator('.le-icon-grid').evaluateAll((grids) => grids.map((g) => g.innerHTML).join('')))).not.toContain('Mill Lane');
    await ui(page).getByRole('button', { name: 'Press “Open menu”' }).click();
    await expect(page.locator('#phone-menu')).toHaveAttribute('open', '');
});

test('a phone menu the site opens as a modal dialog can be edited and saved', async ({ page }) => {
    // A modal dialog sits above the editor and makes it inert: the menu opened, and nothing in it could be saved.
    await openAsEditor(page);
    await addPhoneThings(page);
    await page.evaluate(() => document.getElementById('phone-menu').showModal());
    await expect(page.locator('#phone-menu')).toHaveAttribute('open', '');
    await page.locator('#phone-menu a').click();
    const words = ui(page).locator('.le-drawer textarea').first();
    await words.click();
    await words.fill('What we do');
    await ui(page).getByRole('button', { name: 'Save changes' }).click();
    await expect.poll(() => site.host.settings['menu-services']).toBe('What we do');
    // Nothing is left modal, so the bar is usable over the menu too, even with editing turned off.
    expect(await page.evaluate(() => document.querySelector('dialog:modal'))).toBeNull();
});
