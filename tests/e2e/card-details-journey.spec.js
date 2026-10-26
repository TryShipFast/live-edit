import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';
import { keyOf } from '../support/fake-host.js';

/*
 * The owner's scenario, clicked through: "I bought a template with products
 * and journal posts. I can edit each one into my own without opening each
 * page, a copied card gets the whole page with it, and deleting a card can
 * delete its page."
 *
 * Driven on a stand-in for the hosting app (tests/support/fake-host.js),
 * which draws pages and keys them the way the host does, so this runs
 * anywhere with no site to point at:
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/card-details-journey.spec.js
 *
 * Every check is made against what was stored and what a page shows after
 * being drawn again, never against what the window shows while it is open.
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

// Each journey edits, saves and reads back several pages; the copy alone is dozens of saves.
test.setTimeout(120000);

let site;
test.beforeEach(async ({ page }, info) => {
    site = await serveFakeHost({ removable: info.title.includes('design came with') });
    page.on('dialog', (dialog) => dialog.accept());
});
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const detail = (page) => page.frameLocator('iframe.le-detail-frame');

const openAsEditor = async (page, path = 'shop') => {
    await page.goto(`${site.url}/edit/${path}?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    // The guide offers itself on a first visit; it is not what this is about.
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
};

/** Choose an element the way the owner does: by clicking it. */
const choose = async (where, selector) => {
    await where.locator(selector).first().click();
};

/** Change the words in the open panel and save them. */
const typeAndSave = async (where, words) => {
    await where.locator('.le-drawer textarea').first().fill(words);
    await where.getByRole('button', { name: 'Save changes' }).click();
};

const openItsPage = async (page, card, button = 'Edit all details') => {
    await choose(page, `[data-edit-item="${card}"] [data-edit]:not(a)`);
    await ui(page).getByRole('button', { name: button }).click();
    await expect(detail(page).locator('h1')).toBeVisible({ timeout: 20000 });
    // Its own editor is ready, not only its page: a press before then reached nothing.
    await expect(detail(page).locator('body.editing')).toHaveCount(1, { timeout: 20000 });
};

const done = async (page) => {
    await ui(page).getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.locator('#live-edit-ui').locator('iframe.le-detail-frame')).toHaveCount(0);
};

/** A page as the host draws it now, read the way a visitor's page would be. */
const drawn = (path) => site.host.draw(path);
const words = (doc, selector) => (doc.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();

test('a product is edited on its own page, inside the window over the shop, options included', async ({ page }) => {
    await openAsEditor(page);
    await openItsPage(page, 'aster');

    // The page itself, not a form: its header, footer and related products are put away,
    // and its own heading, photo and sizes are what is shown.
    await expect(detail(page).locator('header')).toBeHidden();
    await expect(detail(page).locator('[data-component="shop.product-grid"]')).toBeHidden();
    await expect(detail(page).locator('[data-list="sizes"] [data-edit-item]')).toHaveCount(2);
    await expect(ui(page).locator('.le-modal input.le-input, .le-modal .le-field')).toHaveCount(0);

    await choose(detail(page), 'h1');
    await typeAndSave(detail(page), 'Aster Veil Intense');
    await expect.poll(() => words(drawn('products/aster-veil'), 'h1')).toBe('Aster Veil Intense');

    // A size added from the size itself, with the same panel as anywhere else.
    await choose(detail(page), '[data-item="s100"] [data-field="size"]');
    await detail(page).getByRole('button', { name: 'Duplicate' }).click();
    await expect(detail(page).locator('[data-list="sizes"] [data-edit-item]')).toHaveCount(3);
    await done(page);

    // Stored, and on the product page when it is drawn again.
    const product = drawn('products/aster-veil');
    expect(product.querySelectorAll('[data-list="sizes"] [data-edit-item]')).toHaveLength(3);
    // The shop's own card was not touched: it has words of its own.
    expect(words(drawn('shop'), '[data-edit-item="aster"] h3')).toBe('Aster Veil');

    // Reopened, it shows what was saved.
    await openItsPage(page, 'aster');
    await expect(detail(page).locator('h1')).toHaveText('Aster Veil Intense');
    await expect(detail(page).locator('[data-list="sizes"] [data-edit-item]')).toHaveCount(3);
});

test('a journal post is edited in place: its body and its pictures', async ({ page }) => {
    await openAsEditor(page);
    await openItsPage(page, 'first');
    await expect(detail(page).locator('[data-component="journal.related"]')).toBeHidden();

    await choose(detail(page), '.body p');
    await typeAndSave(detail(page), 'We walked before the town woke.');
    await expect.poll(() => words(drawn('journal/first-light'), '.body p')).toBe('We walked before the town woke.');

    await choose(detail(page), '[data-item="p2"] span');
    await detail(page).getByRole('button', { name: '↑ Move up' }).click();
    await expect(detail(page).locator('[data-list="pictures"] [data-edit-item]').first()).toHaveAttribute('data-edit-item', 'p2');
    await done(page);

    const post = drawn('journal/first-light');
    expect([...post.querySelectorAll('[data-list="pictures"] [data-edit-item]')].map((item) => item.getAttribute('data-edit-item'))).toEqual(['p2', 'p1']);
    expect(words(post, '.body p')).toBe('We walked before the town woke.');
});

test('a copied card gets its own page, a full copy, and the two never change each other', async ({ page }) => {
    // A full copy is one save per edited field, made one after another (and paced by the content
    // API's write limit on a real host), so this journey does many times the work of the others.
    // On a loaded machine it ran past the 30-second default while every step was still succeeding.
    test.setTimeout(120_000);
    // What the owner had already made of Aster Veil's page.
    const aster = drawn('products/aster-veil');
    site.host.save(keyOf(aster, '[data-component="shop.details"] p'), 'Our own story, in our own words.');
    site.host.save(aster.querySelector('[data-list="sizes"]').getAttribute('data-edit-list'), JSON.stringify(['s50', 's100', 'nbig']));
    site.host.save(keyOf(drawn('products/aster-veil'), '[data-edit-item="nbig"] [data-field="size"]'), '200 ml refill');

    await openAsEditor(page);
    await choose(page, '[data-edit-item="aster"] [data-kit-price]');
    await ui(page).getByRole('button', { name: 'Duplicate' }).click();
    await expect(page.locator('[data-list="products"] [data-edit-item]')).toHaveCount(3);
    const copy = await page.locator('[data-list="products"] [data-edit-item]').nth(1).getAttribute('data-edit-item');
    expect(copy).toMatch(/^n[0-9a-z]+(?:_[A-Za-z0-9-]+)?$/);

    await choose(page, `[data-edit-item="${copy}"] h3 a`);
    await typeAndSave(page, 'Fig Archive');
    await expect(page.locator(`[data-edit-item="${copy}"] h3 a`)).toHaveText('Fig Archive');

    // Until it has a page of its own, the copy offers one before anything on it is edited.
    await openItsPage(page, copy, 'Give it its own page');
    await expect(detail(page).locator('h1')).toHaveText('Fig Archive');
    await expect(detail(page).locator('[data-component="shop.details"] p')).toHaveText('Our own story, in our own words.');
    await expect(detail(page).locator('[data-list="sizes"] [data-field="size"]')).toHaveText(['50 ml', '100 ml', '200 ml refill']);

    await choose(detail(page), '[data-component="shop.details"] p');
    await typeAndSave(detail(page), 'Only Fig Archive says this.');
    await expect.poll(() => words(drawn('fig-archive'), '[data-component="shop.details"] p')).toBe('Only Fig Archive says this.');
    await done(page);

    // The copy opens its own page; the original card still opens the original.
    await expect(page.locator(`[data-edit-item="${copy}"] h3 a`)).toHaveAttribute('href', '../fig-archive/');
    await expect(page.locator('[data-edit-item="aster"] h3 a')).toHaveAttribute('href', '../products/aster-veil/');
    expect(words(drawn('products/aster-veil'), '[data-component="shop.details"] p')).toBe('Our own story, in our own words.');

    // And the other way: the original edited from its card leaves the copy alone.
    await openItsPage(page, 'aster');
    await choose(detail(page), '[data-component="shop.details"] p');
    await typeAndSave(detail(page), 'Only Aster Veil says this.');
    await expect.poll(() => words(drawn('products/aster-veil'), '[data-component="shop.details"] p')).toBe('Only Aster Veil says this.');
    await done(page);
    expect(words(drawn('fig-archive'), '[data-component="shop.details"] p')).toBe('Only Fig Archive says this.');
    expect(words(drawn('fig-archive'), 'h1')).toBe('Fig Archive');
});

test('a design card named apart from its page stays the original when another card opens that page', async ({ page }) => {
    // Design cards are often named apart from the page they open ("Unwanted hair" opens "Laser hair
    // removal"), and owners rename cards; only an id the editor minted makes a card a copy.
    await openAsEditor(page);
    await choose(page, '[data-edit-item="aster"] h3 a');
    await typeAndSave(page, 'The grey one');
    await choose(page, '[data-edit-item="aster"] [data-kit-price]');
    await ui(page).getByRole('button', { name: 'Duplicate' }).click();
    await expect(page.locator('[data-list="products"] [data-edit-item]')).toHaveCount(3);

    await choose(page, '[data-edit-item="aster"] [data-edit]:not(a)');
    await expect(ui(page).getByRole('button', { name: 'Edit all details' })).toBeVisible();
    await expect(ui(page).getByRole('button', { name: 'Give it its own page' })).toHaveCount(0);
});

test('a copied card’s own page is opened by its name, not by another link on the card', async ({ page }) => {
    // Found on Third Chair: a barber's card holds his name (his page) and booking slots (the booking page).
    // "Give it its own page" re-addressed the first slot, so the name still opened the original page.
    await openAsEditor(page);
    await choose(page, '[data-edit-item="second"] p[data-edit]');
    await ui(page).getByRole('button', { name: 'Duplicate' }).click();
    await expect(page.locator('[data-list="posts"] [data-edit-item]')).toHaveCount(3);
    const copy = await page.locator('[data-list="posts"] [data-edit-item]').nth(2).getAttribute('data-edit-item');
    expect(copy).toMatch(/^n[0-9a-z]+(?:_[A-Za-z0-9-]+)?$/);

    await choose(page, `[data-edit-item="${copy}"] p[data-edit]`);
    await ui(page).getByRole('button', { name: 'Give it its own page' }).click();
    await expect(detail(page).locator('h1')).toBeVisible();
    await done(page);

    const made = site.host.made().map((m) => m.id);
    expect(made).toHaveLength(1);
    await expect(page.locator(`[data-edit-item="${copy}"] h3 a`)).toHaveAttribute('href', `../${made[0]}/`);
    await expect(page.locator(`[data-edit-item="${copy}"] a.also`)).toHaveAttribute('href', '../products/blue-hour/');
    // The original still opens the original.
    await expect(page.locator('[data-edit-item="second"] h3 a')).toHaveAttribute('href', '../journal/salt-air/');
});

test('deleting a card that has its own page offers to delete the page too', async ({ page }) => {
    await openAsEditor(page);
    await choose(page, '[data-edit-item="aster"] [data-kit-price]');
    await ui(page).getByRole('button', { name: 'Duplicate' }).click();
    await expect(page.locator('[data-list="products"] [data-edit-item]')).toHaveCount(3);
    const copy = await page.locator('[data-list="products"] [data-edit-item]').nth(1).getAttribute('data-edit-item');
    await choose(page, `[data-edit-item="${copy}"] h3 a`);
    await typeAndSave(page, 'Fig Archive');
    await openItsPage(page, copy, 'Give it its own page');
    await done(page);
    expect(site.host.made().map((made) => made.id)).toEqual(['fig-archive']);

    await choose(page, `[data-edit-item="${copy}"] [data-kit-price]`);
    await ui(page).getByRole('button', { name: 'Delete this item' }).click();
    const ask = ui(page).locator('.le-modal');
    await expect(ask).toContainText('opens its own page, “Fig Archive”');
    await expect(ask).toContainText('Nothing else on your site links to it.');
    await ask.getByRole('button', { name: 'Delete the card and its page' }).click();

    await expect(page.locator('[data-list="products"] [data-edit-item]')).toHaveCount(2);
    expect(site.host.made()).toEqual([]);
    expect(site.host.settings['structure:page:fig-archive']).toBe('');
    expect(drawn('fig-archive')).toBeNull();

    // A sample product's page came with the design; without the host's say-so it stays.
    await choose(page, '[data-edit-item="aster"] [data-kit-price]');
    await ui(page).getByRole('button', { name: 'Delete this item' }).click();
    await expect(ask).toContainText('cannot be deleted here yet');
    await expect(ask.getByRole('button', { name: 'Delete the card and its page' })).toHaveCount(0);
    await ask.getByRole('button', { name: 'Delete the card' }).click();
    await expect(page.locator('[data-list="products"] [data-edit-item]')).toHaveCount(1);
    expect(drawn('products/aster-veil')).not.toBeNull();
});

test('a sample page the design came with is deleted with its card where the host allows it', async ({ page }) => {
    await openAsEditor(page);
    await choose(page, '[data-edit-item="blue"] [data-kit-price]');
    await ui(page).getByRole('button', { name: 'Delete this item' }).click();
    const ask = ui(page).locator('.le-modal');
    await expect(ask).toContainText('opens its own page, “Blue Hour”');
    await ask.getByRole('button', { name: 'Delete the card and its page' }).click();

    await expect(page.locator('[data-list="products"] [data-edit-item]')).toHaveCount(1);
    expect(site.host.removed()).toEqual(['products/blue-hour']);
    expect(drawn('products/blue-hour')).toBeNull();
});
