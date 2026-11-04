import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { serveFakeHost } from '../support/fake-host-server.js';
import { writesFor } from '../../resources/js/collections.js';

/*
 * Search over a collection (the website's LIVE-EDIT-STRUCTURE.md; the owner, 4 Nov 2026: "let's build first").
 * An aviation parts supplier keeps its parts as a collection and visitors search it. On the stand-in host, which
 * serves the host's own markup for a search (tests/support/search-component.json) and the built kit-search.js:
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/search-over-a-collection.spec.js
 *
 * A collection is made from a spreadsheet in the Search tab, edited as a table, a search over it is added from
 * the library, a filter switched off, and the search answers a part number with and without its dashes. An
 * outside site is never shown any of it. Every check is made against what was stored.
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});
test.setTimeout(120000);

const CSV = fileURLToPath(new URL('../support/aircraft-parts.csv', import.meta.url));
let site;
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const openAsEditor = async (page, path) => {
    await page.goto(`${site.url}/edit/${path}?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
};
const parts = [
    { id: 'r1', part_number: '2-1586-3', name: 'Main wheel brake assembly', aircraft: 'B737-800', condition: 'SV', quantity: 2, certificate: true },
    { id: 'r2', part_number: '3214552-4', name: 'Starter generator', aircraft: 'ATR 72', condition: 'OH', quantity: 1, certificate: true },
    { id: 'r3', part_number: '2-1586-30', name: 'Brake wear pin', aircraft: 'B737-800', condition: 'NE', quantity: 40, certificate: false },
];

test('a collection is made from a spreadsheet in the Search tab and edited as a table', async ({ page }) => {
    site = await serveFakeHost({ library: true, search: true });
    page.on('dialog', (dialog) => dialog.accept());
    await openAsEditor(page, 'shop');

    await ui(page).locator('.le-bar-search').click();
    await expect(ui(page).getByText('What visitors can search')).toBeVisible();
    await ui(page).locator('.le-collection-new').click();
    await ui(page).locator('.le-new-from-csv').click();
    await ui(page).locator('.le-modal input[type=file]').setInputFiles(CSV);
    await ui(page).locator('.le-import-name').fill('Aircraft parts');
    await ui(page).locator('.le-import-one').fill('part');
    await expect(ui(page).locator('.le-import-summary')).toHaveText('40 rows are ready.');
    await Promise.all([page.waitForNavigation(), ui(page).locator('.le-import-go').click()]);

    const schema = JSON.parse(site.host.settings['collection:aircraft-parts']);
    expect(schema).toMatchObject({ name: 'Aircraft parts', one: 'part', many: 'parts', pages: 1 });
    expect(schema.fields.find((f) => f.key === 'part_number').code).toBe(true);
    expect(JSON.parse(site.host.settings['collection:aircraft-parts:rows:1'])).toHaveLength(40);

    // Back in the Search tab, then the table: a quantity changed and saved.
    await expect(ui(page).locator('.le-collection')).toContainText('40 parts');
    await ui(page).locator('.le-collection-open').click();
    await expect(ui(page).locator('.le-table tbody tr')).toHaveCount(40);
    await ui(page).locator('.le-table tbody tr').first().locator('input[aria-label^="Quantity of"]').fill('12');
    await expect(ui(page).locator('.le-table-status')).toHaveText('1 change not saved yet');
    await Promise.all([page.waitForNavigation(), ui(page).locator('.le-table-save').click()]);
    expect(JSON.parse(site.host.settings['collection:aircraft-parts:rows:1'])[0].quantity).toBe(12);
});

test('a search is added from the library, a filter switched off, and a part number found with or without dashes', async ({ page }) => {
    site = await serveFakeHost({ library: true, search: true });
    for (const write of writesFor('parts', { name: 'Aircraft parts', one: 'part', many: 'parts', title: 'name', fields: (await import('../support/search-component.json', { with: { type: 'json' } })).default.collection.fields }, parts)) site.host.save(write.key, write.value);
    page.on('dialog', (dialog) => dialog.accept());
    await openAsEditor(page, 'shop');

    await page.mouse.move(400, 300);
    await ui(page).locator('.le-insert-end.is-visible .le-insert-btn').click();
    const library = ui(page).locator('.le-modal');
    await library.getByRole('button', { name: 'Search: Aircraft parts', exact: true }).click();
    await expect(library.getByText(/found with or without dashes and spaces/)).toBeVisible();
    await Promise.all([page.waitForNavigation(), library.getByRole('button', { name: 'Add this section' }).click()]);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const [id] = Object.keys(site.host.builderFor('shop', '').added);
    expect(site.host.builderFor('shop', '').added[id]).toBe('kit.search.parts');

    const search = page.locator('[data-search]');
    await expect(search.locator('[data-search-hit]')).toHaveCount(3);

    // Pressing the search opens its own panel: the filters visitors see, and its table.
    await search.locator('.kit-search__input').click();
    await expect(ui(page).getByText('Filters visitors see')).toBeVisible();
    await ui(page).locator('.le-drawer .le-card-setting-boxes label', { hasText: 'Condition' }).locator('input').uncheck();
    await expect(search.locator('.kit-search__filter legend', { hasText: 'Condition' })).toHaveCount(0);
    const settingsKey = (await search.locator('[data-search-settings]').getAttribute('data-edit-choice')).replace(/^setting:/, '');
    expect(JSON.parse(site.host.settings[settingsKey])['data-search-filters']).toBe('aircraft quantity certificate');

    // The words are the owner's.
    await search.locator('.kit-search__title').click();
    await ui(page).locator('.le-drawer textarea').first().fill('Find an aircraft part');
    await ui(page).getByRole('button', { name: 'Save changes' }).click();
    await expect.poll(() => Object.values(site.host.settings).includes('Find an aircraft part')).toBe(true);

    // Previewed as a visitor: a part number with and without its dashes.
    await page.reload();
    await page.evaluate(() => document.body.classList.remove('editing'));
    await search.locator('.kit-search__input').fill('215863');
    await expect(search.locator('[data-search-hit]').first()).toHaveAttribute('data-search-hit', 'r1');
    await search.locator('.kit-search__input').fill('2-1586-3');
    await expect(search.locator('[data-search-hit]')).toHaveCount(2);
    await expect(search.locator('.kit-search__filter legend', { hasText: 'Condition' })).toHaveCount(0);
});

test('an outside site is never shown search', async ({ page }) => {
    site = await serveFakeHost({ outside: true, search: true });
    await openAsEditor(page, 'shop');
    await expect(ui(page).locator('.le-bar-search')).toBeHidden();
    await expect(ui(page).locator('.le-tab', { hasText: 'Search' })).toHaveCount(0);
});
