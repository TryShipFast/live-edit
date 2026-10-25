import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';
import { keyOf } from '../support/fake-host.js';

/*
 * The owner's words: "Also adding more sections to the page: we currently have
 * that on the new page and not the existing ones."
 *
 * A page the design came with takes a section from the design's library just as
 * a page the owner made does, and finding where to do it is as plain: on the
 * line between two sections, at the end of the page, and in the page's sections
 * panel from the bar. Driven on the stand-in host (tests/support/fake-host.js):
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/sections-on-every-page.spec.js
 *
 * Every check is made against what was stored and what the host draws next,
 * never against what the window shows while it is open.
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

test.setTimeout(90000);

let site;
test.beforeEach(async ({ page }) => {
    site = await serveFakeHost({ library: true });
    page.on('dialog', (dialog) => dialog.accept());
});
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');

const openAsEditor = async (page, path) => {
    await page.goto(`${site.url}/edit/${path}?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
};

/** The sections of the page's list, in order, as the host draws the page now. */
const sectionsOf = (path) => [...site.host.draw(path).querySelectorAll('[data-edit-list-kind="sections"] > [data-edit-item]')]
    .map((section) => `${section.getAttribute('data-edit-item')}=${section.getAttribute('data-edit-section-label')}`);

/** Where every section sits on the page, so nothing can be seen to move. */
const positions = (page) => page.evaluate(() => [...document.querySelectorAll('[data-edit-item]')].map((el) => Math.round(el.getBoundingClientRect().top + window.scrollY)));

/** Choose one from the library window and add it; the page loads again to draw it. */
const addFromLibrary = async (page, label) => {
    const window_ = ui(page).locator('.le-modal');
    await expect(window_).toBeVisible();
    await window_.getByRole('button', { name: label, exact: true }).click();
    await Promise.all([
        page.waitForNavigation(),
        window_.getByRole('button', { name: 'Add this section' }).click(),
    ]);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
};

test('between two sections of a page the design came with, a section is added where the line is', async ({ page }) => {
    await openAsEditor(page, 'products/aster-veil');
    const before = await positions(page);

    // Pointing at the lower half of the product puts the line between it and its story.
    const product = page.locator('[data-edit-item="s-detail"]');
    const at = await product.boundingBox();
    await page.mouse.move(at.x + 20, at.y + at.height - 10);
    const insert = ui(page).locator('.le-insert:not(.le-insert-end).is-visible .le-insert-btn');
    await expect(insert).toBeVisible();
    const pill = await insert.boundingBox();
    expect(Math.abs(pill.y + pill.height / 2 - (at.y + at.height))).toBeLessThan(30);
    // Drawn over the page, not in it: nothing moved to make room.
    expect(await positions(page)).toEqual(before);

    await page.mouse.move(pill.x + pill.width / 2, pill.y + pill.height / 2);
    await insert.click();
    await expect(ui(page).locator('.le-modal-sub')).toHaveText(/below “Product”/);
    await addFromLibrary(page, 'More posts');

    const added = Object.keys(site.host.builderFor('products/aster-veil', '').added);
    expect(added).toHaveLength(1);
    expect(sectionsOf('products/aster-veil')).toEqual(['s-detail=Product', `s-${added[0]}=More posts`, 's-story=Story', 's-related=You may also like']);
    // Drawn as itself straight away (the page was loaded again), not as a copy of the section above it.
    await expect(page.locator(`[data-edit-item="s-${added[0]}"] h2`)).toHaveText('More from the journal');

    // Its own copy: its heading has a key of its own, so editing it never edits the journal post.
    const copyKey = keyOf(site.host.draw('products/aster-veil'), `[data-edit-item="s-${added[0]}"] h2`);
    expect(copyKey).not.toBe(keyOf(site.host.draw('journal/first-light'), '[data-instance="first-light.related"] h2'));
    await page.locator(`[data-edit-item="s-${added[0]}"] h2`).click();
    await ui(page).locator('.le-drawer textarea').first().fill('Read the journal');
    await ui(page).getByRole('button', { name: 'Save changes' }).click();
    await expect.poll(() => site.host.settings[copyKey]).toBe('Read the journal');
    expect(site.host.draw('journal/first-light').querySelector('[data-instance="first-light.related"] h2').textContent).toBe('More from the journal');
});

test('the end of a page the design came with offers a section, and it goes last', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const end = ui(page).locator('.le-insert-end.is-visible .le-insert-btn');
    await expect(end).toBeVisible();
    const last = await page.locator('[data-edit-item="s-journal"]').boundingBox();
    const pill = await end.boundingBox();
    expect(Math.abs(pill.y + pill.height / 2 - (last.y + last.height))).toBeLessThan(30);

    await end.click();
    await expect(ui(page).locator('.le-modal-sub')).toHaveText(/at the end of this page/);
    await addFromLibrary(page, 'Story');

    const [id] = Object.keys(site.host.builderFor('shop', '').added);
    expect(sectionsOf('shop')).toEqual(['s-grid=Products', 's-journal=Journal', `s-${id}=Story`]);
    await expect(page.locator(`[data-edit-item="s-${id}"] p`)).toHaveText('Neroli picked at dawn, laid over cedar.');
});

test('the bar opens the page sections panel: add one, open one, and take an added one off again', async ({ page }) => {
    await openAsEditor(page, 'journal/salt-air');
    await ui(page).getByRole('button', { name: '+ Section' }).click();
    const drawer = ui(page).locator('.le-drawer');
    await expect(drawer.getByText('On this page')).toBeVisible();
    await expect(drawer.getByRole('button', { name: '1. Post' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: '2. More posts' })).toBeVisible();

    await drawer.getByRole('button', { name: '+ Add a section' }).click();
    await addFromLibrary(page, 'Story');
    const [id] = Object.keys(site.host.builderFor('journal/salt-air', '').added);
    expect(sectionsOf('journal/salt-air')).toEqual(['s-article=Post', 's-related=More posts', `s-${id}=Story`]);

    // Opened from the list, the added section can go again ("Remove this section").
    await ui(page).getByRole('button', { name: '+ Section' }).click();
    await drawer.getByRole('button', { name: '3. Story' }).click();
    await expect(drawer.getByText('This section', { exact: true })).toBeVisible();
    await drawer.getByRole('button', { name: 'Remove this section' }).click();
    await expect.poll(() => sectionsOf('journal/salt-air')).toEqual(['s-article=Post', 's-related=More posts']);
    expect(site.host.builderFor('journal/salt-air', '').added).toEqual({});
});

test('a page the owner made works the same way (the baseline)', async ({ page }) => {
    site.host.save('structure:pages', JSON.stringify([{ id: 'open-days', title: 'Open days' }]));
    site.host.save('structure:page:open-days', JSON.stringify({ added: { 'add-first001': 'shop.journal' } }));
    await openAsEditor(page, 'open-days');

    await ui(page).locator('.le-insert-end.is-visible .le-insert-btn').click();
    await addFromLibrary(page, 'Story');

    const ids = Object.keys(site.host.builderFor('open-days', '').added);
    expect(ids).toHaveLength(2);
    expect(sectionsOf('open-days')).toEqual(['s-add-first001=Journal', `s-${ids[1]}=Story`]);
});

test('nothing is offered when the design has no library, or when not editing', async ({ page }) => {
    await site.close();
    site = await serveFakeHost({ library: false });
    await openAsEditor(page, 'shop');
    await page.mouse.move(300, 200);
    await expect(ui(page).locator('.le-insert.is-visible')).toHaveCount(0);
    await expect(ui(page).getByRole('button', { name: '+ Section' })).toBeHidden();

    await site.close();
    site = await serveFakeHost({ library: true });
    await page.goto(`${site.url}/edit/shop`);
    await page.evaluate(() => sessionStorage.setItem('tb_editing', '0'));
    await page.reload();
    await page.mouse.move(300, 200);
    await expect(ui(page).locator('.le-insert.is-visible')).toHaveCount(0);
});

test('an outside site (no page builder handed over) never shows an add-section control', async ({ page }) => {
    // Outside sites get in-place editing only (LIVE-EDIT-STRUCTURE.md section 7): adding sections is for hosted templates.
    await site.close();
    site = await serveFakeHost({ outside: true });
    await openAsEditor(page, 'products/aster-veil');
    expect(await page.evaluate(() => window.liveEditPages)).toBeUndefined();

    const product = await page.locator('[data-edit-item="s-detail"]').boundingBox();
    await page.mouse.move(product.x + 20, product.y + product.height - 10);
    await expect(ui(page).locator('.le-insert.is-visible')).toHaveCount(0);
    await expect(ui(page).getByRole('button', { name: '+ Section' })).toBeHidden();
    await expect(ui(page).getByRole('button', { name: '+ New page' })).toBeHidden();

    // A section's own panel offers moving it, but no adding from a library.
    await page.locator('[data-edit-item="s-story"] h2').click();
    await expect(ui(page).locator('.le-drawer')).toBeVisible();
    await expect(ui(page).getByRole('button', { name: /Add a section/ })).toHaveCount(0);
});
