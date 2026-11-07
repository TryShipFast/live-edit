import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';
import { keyOf } from '../support/fake-host.js';

/*
 * The owner's words: "charts... are also ways to show data, same as tables... if you can add them,
 * instead of making them a future feature."
 *
 * A chart, chosen by its kind, and a table, added from the library on a page the design came with,
 * then edited the way each kind is edited (data-kit.js, data-panel.js): a donut's slices, a funnel's
 * stages, a bar chart filled from pasted rows and drawn across instead of up, a table's columns
 * added, moved and deleted in every row at once. Driven on the stand-in host, which serves the
 * host's own markup for them (tests/support/data-components.json) and the script that draws them:
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/charts-and-tables.spec.js
 *
 * Every check is made against what was stored and what the host draws next.
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

test.setTimeout(120000);

let site;
test.beforeEach(async ({ page }) => {
    site = await serveFakeHost({ library: true, data: true });
    page.on('dialog', (dialog) => dialog.accept());
});
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const drawer = (page) => ui(page).locator('.le-drawer');

const openAsEditor = async (page, path) => {
    await page.goto(`${site.url}/edit/${path}?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
};

/** "+ Add a section" at the end of the page, a kind chosen from the library, added. */
const addAtTheEnd = async (page, label) => {
    await page.mouse.move(400, 300);
    await ui(page).locator('.le-insert-end.is-visible .le-insert-btn').click();
    const window_ = ui(page).locator('.le-modal');
    await expect(window_.locator('.le-library-page', { hasText: 'Charts and tables' })).toBeVisible();
    await window_.getByRole('button', { name: label, exact: true }).click();
    await Promise.all([page.waitForNavigation(), window_.getByRole('button', { name: 'Add this section' }).click()]);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const [id] = Object.keys(site.host.builderFor(path(page), '').added).slice(-1);

    return id;
};
const path = (page) => new URL(page.url()).pathname.replace(/^\/edit\//, '').replace(/\/$/, '');

/** The rows of an added component as the host draws the page now: each row's cells' words. */
const rowsDrawn = (page_, id) => [...site.host.draw(page_).querySelectorAll(`[data-instance="${page_}.${id}"] tbody tr`)]
    .map((tr) => [...tr.children].map((cell) => cell.textContent.trim()));

/*
 * Charts and tables are edited as a grid (owner, 7 Nov 2026: "It should be easy to update the components. Table,
 * charts, etc. They are being used by novice"): a press anywhere on one opens its figures or cells as a small
 * spreadsheet, on what was pressed; typed in, rows and columns added and removed, pasted into; one Save changes.
 */
const sheet = (page) => drawer(page).locator('.le-figures');
const box = (page, r, c) => sheet(page).locator(`input[data-row="${r}"][data-col="${c}"]`);
const saveSheet = (page) => drawer(page).locator('.le-figures-foot').getByRole('button', { name: 'Save changes' }).click();
const pasteInto = (locator, text) => locator.evaluate((input, rows) => {
    const data = new DataTransfer();
    data.setData('text/plain', rows);
    input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
}, text);

test('a donut, chosen by its kind, is added and edited in its grid with its rules kept', async ({ page }) => {
    await openAsEditor(page, 'shop');
    await page.mouse.move(400, 300);
    await ui(page).locator('.le-insert-end.is-visible .le-insert-btn').click();
    const window_ = ui(page).locator('.le-modal');
    await window_.getByRole('button', { name: 'Chart: a donut of shares', exact: true }).click();
    // Chosen knowing what it holds: the kind's items, fields and rules.
    await expect(window_.getByText(/six slices at most/)).toBeVisible();
    await Promise.all([page.waitForNavigation(), window_.getByRole('button', { name: 'Add this section' }).click()]);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const [id] = Object.keys(site.host.builderFor('shop', '').added);
    expect(site.host.builderFor('shop', '').added[id]).toBe('kit.chart.donut');

    // Drawn from its table, in the site's colours: four slices.
    const chart = page.locator(`[data-instance="shop.${id}"]`);
    await expect(chart.locator('[data-chart-plot] svg .kit-chart__mark')).toHaveCount(4);

    // A slice pressed on the drawing opens the donut's grid, that slice's share ready to type in.
    await chart.locator('[data-chart-plot] .kit-chart__mark').first().dispatchEvent('click');
    await expect(sheet(page).locator('tbody tr')).toHaveCount(4);
    await expect(sheet(page).locator('thead input')).toHaveCount(2);
    await expect(box(page, 0, 1)).toBeFocused();

    // A share that stops the whole adding up is saved, and said.
    await box(page, 0, 1).fill('46');
    await saveSheet(page);
    const shareKey = keyOf(site.host.draw('shop'), `[data-instance="shop.${id}"] tbody tr td`);
    await expect.poll(() => site.host.settings[shareKey]).toBe('46');
    await expect(page.locator('#live-edit-ui')).toContainText(/Shares now add to 104%, not 100%/);
    await expect.poll(() => chart.locator('svg[role="img"]').getAttribute('aria-label')).toContain('46%');

    // A word where a figure goes is refused, said in the panel, and nothing is saved.
    await chart.locator('[data-chart-plot] .kit-chart__mark').first().dispatchEvent('click');
    await box(page, 0, 1).fill('lots');
    await saveSheet(page);
    await expect(drawer(page).getByRole('alert')).toContainText('“lots” is not a figure');
    expect(site.host.settings[shareKey]).toBe('46');

    // Two more slices make six; a seventh is not offered.
    await box(page, 0, 1).fill('40');
    for (const [r, name] of [[4, 'Podcasts'], [5, 'Events']]) {
        await drawer(page).getByRole('button', { name: '+ Add a slice' }).click();
        await box(page, r, 0).fill(name);
        await box(page, r, 1).fill('2');
    }
    await expect(drawer(page).getByRole('button', { name: '+ Add a slice' })).toBeDisabled();
    await expect(drawer(page).locator('.le-figures-count')).toHaveText('6 slices of at most 6');
    await saveSheet(page);
    await expect.poll(() => rowsDrawn('shop', id).length).toBe(6);
    await expect.poll(() => rowsDrawn('shop', id).at(-1)).toEqual(['Events', '2']);
});

test('a funnel refuses a stage larger than the one before it, said in its grid', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const id = await addAtTheEnd(page, 'Chart: a funnel of stages');
    const chart = page.locator(`[data-instance="shop.${id}"]`);
    await chart.locator('[data-chart-plot] .kit-chart__mark').nth(2).dispatchEvent('click');
    await expect(box(page, 2, 1)).toBeFocused();

    await box(page, 2, 1).fill('2,500');
    await saveSheet(page);
    await expect(drawer(page).getByRole('alert')).toContainText('can’t be more than the stage before it, “Viewed a product” (2,100)');
    expect(rowsDrawn('shop', id)[2][1]).toBe('640');

    await box(page, 2, 1).fill('900');
    await saveSheet(page);
    await expect.poll(() => rowsDrawn('shop', id)[2][1]).toBe('900');
});

test('a bar chart is filled from pasted rows, and drawn across instead of up', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const id = await addAtTheEnd(page, 'Chart: bars or columns');
    const chart = page.locator(`[data-instance="shop.${id}"]`);

    // The drawing itself, away from any bar, is the chart: its grid, its settings.
    await chart.locator('[data-chart-plot]').scrollIntoViewIfNeeded();
    const plot = await chart.locator('[data-chart-plot]').boundingBox();
    await page.mouse.click(plot.x + 4, plot.y + 4);
    await expect(drawer(page).getByText('How it is drawn', { exact: true })).toBeVisible();
    // Rows copied from a spreadsheet, pasted into the grid's first cell: the headings and seven bars.
    await pasteInto(box(page, -1, 0), 'Month\tSales\nJul\t210\nAug\t190\nSep\t230\nOct\t260\nNov\t300\nDec\t340\nJan\t280');
    await expect(sheet(page).locator('tbody tr')).toHaveCount(7);
    await saveSheet(page);
    await expect.poll(() => rowsDrawn('shop', id)).toEqual([['Jul', '210'], ['Aug', '190'], ['Sep', '230'], ['Oct', '260'], ['Nov', '300'], ['Dec', '340'], ['Jan', '280']]);
    expect(site.host.draw('shop').querySelector(`[data-instance="shop.${id}"] thead th:nth-child(2)`).textContent.trim()).toBe('Sales');
    await page.reload();
    await expect(page.locator(`[data-instance="shop.${id}"] [data-chart-plot] .kit-chart__mark`)).toHaveCount(7);
    // Every key in the chart is its own.
    const keys = [...site.host.draw('shop').querySelectorAll(`[data-instance="shop.${id}"] [data-edit^="setting:"]`)].map((n) => n.getAttribute('data-edit'));
    expect(new Set(keys).size).toBe(keys.length);

    // Drawn as bars across: a setting the bar kind offers, saved and on the page.
    await page.locator(`[data-instance="shop.${id}"] [data-chart-plot]`).scrollIntoViewIfNeeded();
    const again = await page.locator(`[data-instance="shop.${id}"] [data-chart-plot]`).boundingBox();
    await page.mouse.click(again.x + 4, again.y + 4);
    await drawer(page).locator('.le-card-setting select').first().selectOption('bars');
    const settingsKey = keyOf(site.host.draw('shop'), `[data-instance="shop.${id}"] [data-chart-settings]`, 'data-edit-choice');
    await expect.poll(() => site.host.settings[settingsKey]).toContain('"data-chart-variant":"bars"');
    await expect.poll(() => page.locator(`[data-instance="shop.${id}"] [data-chart-settings]`).getAttribute('data-chart-variant')).toBe('bars');
});

test('a table takes columns and rows added and deleted in its grid, every row kept in step', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const id = await addAtTheEnd(page, 'Table');
    const table = page.locator(`[data-instance="shop.${id}"] table`);
    const shape = () => rowsDrawn('shop', id).map((r) => r.length);
    const heads = () => [...site.host.draw('shop').querySelectorAll(`[data-instance="shop.${id}"] thead th`)].map((th) => th.textContent.trim());
    const openTable = async () => {
        await page.keyboard.press('Escape');
        await table.locator('tbody tr').first().locator('td').first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
        await table.locator('tbody tr').first().locator('td').first().click();
        await expect(sheet(page)).toBeVisible();
    };

    await openTable();
    await expect(sheet(page).locator('thead input')).toHaveCount(4);
    // A column added and named, filled in every row.
    await drawer(page).getByRole('button', { name: '+ Add a column' }).click();
    await box(page, -1, 4).fill('Storage');
    for (const r of [0, 1, 2]) await box(page, r, 4).fill(`${r + 1} GB`);
    // A row added, with every column, the new one included.
    await drawer(page).getByRole('button', { name: '+ Add a row' }).click();
    for (const [c, value] of ['Agency', '$99', '50', 'A named contact', '1 TB'].entries()) await box(page, 3, c).fill(value);
    await saveSheet(page);
    await expect.poll(heads).toEqual(['Plan', 'Price a month', 'People included', 'Support', 'Storage']);
    await expect.poll(shape).toEqual([5, 5, 5, 5]);
    await expect.poll(() => rowsDrawn('shop', id)[3]).toEqual(['Agency', '$99', '50', 'A named contact', '1 TB']);
    await page.reload();
    const keys = [...site.host.draw('shop').querySelectorAll(`[data-instance="shop.${id}"] table [data-edit^="setting:"]`)].map((n) => n.getAttribute('data-edit'));
    expect(keys).toHaveLength(25);
    expect(new Set(keys).size).toBe(25);

    // A column and a row deleted, in every row at once.
    await openTable();
    await drawer(page).getByRole('button', { name: 'Delete column 2 “Price a month”' }).click();
    await drawer(page).getByRole('button', { name: 'Delete row 4' }).click();
    await saveSheet(page);
    await expect.poll(heads).toEqual(['Plan', 'People included', 'Support', 'Storage']);
    await expect.poll(shape).toEqual([4, 4, 4]);

    // Rows copied from a spreadsheet, pasted into a cell, fill from there.
    await openTable();
    await pasteInto(box(page, 0, 0), 'Small\t1\tEmail\t1 GB\nLarge\t9\tPhone\t9 GB');
    await saveSheet(page);
    await expect.poll(() => rowsDrawn('shop', id).slice(0, 2)).toEqual([['Small', '1', 'Email', '1 GB'], ['Large', '9', 'Phone', '9 GB']]);
});

test('a press anywhere in a table cell opens its grid on that cell, ready to type (owner, 7 Nov 2026)', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const id = await addAtTheEnd(page, 'Table');
    const cell = page.locator(`[data-instance="shop.${id}"] tbody tr`).first().locator('td').first();
    // the panel the add opened is closed first, so the press reaches the page
    await page.keyboard.press('Escape');
    await expect(drawer(page)).not.toHaveClass(/is-open/);
    await cell.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(300);
    // beside its words, not on them: the left edge of the cell, where a right-aligned price leaves empty space
    const at = await cell.boundingBox();
    await page.mouse.click(at.x + 6, at.y + at.height / 2);
    await expect(box(page, 0, 1)).toBeFocused();
    await expect(box(page, 0, 1)).toHaveValue(await cell.locator('span').innerText());
    await box(page, 0, 1).fill('₦25,000');
    await saveSheet(page);
    await expect.poll(() => rowsDrawn('shop', id)[0][1]).toBe('₦25,000');
});

test('an outside site is offered no chart and no table', async ({ page }) => {
    await site.close();
    site = await serveFakeHost({ outside: true, data: true });
    await openAsEditor(page, 'shop');
    expect(await page.evaluate(() => window.liveEditPages)).toBeUndefined();
    await page.mouse.move(400, 300);
    await expect(ui(page).locator('.le-insert.is-visible')).toHaveCount(0);
    await expect(ui(page).getByRole('button', { name: '+ Section' })).toBeHidden();
    await expect(ui(page).getByText('Charts and tables')).toHaveCount(0);
});

/*
 * "The charts and other others only have above and below. But no left of or right of" (owner, 7 Nov 2026): a table
 * put on the right of a chart added before is saved beside it and placed just after it; the choice is not offered
 * for a section that is not a chart or a table.
 */
test('a table can be put on the right of a chart added before', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const chart = await addAtTheEnd(page, 'Chart: bars or columns');

    // The page is longer with the chart on it: the end's "+ Add a section" is pressed where it is.
    await page.mouse.move(400, 300);
    await ui(page).locator('.le-insert-end.is-visible .le-insert-btn').evaluate((button) => button.click());
    const window_ = ui(page).locator('.le-modal');
    const where = window_.locator('.le-browser-where-pick');
    const right = where.locator(`option[value="beside:right:s-${chart}"]`);
    await window_.getByRole('button', { name: 'Table', exact: true }).click();
    await expect(right).toBeEnabled();
    await expect(right).toHaveText(/^On the right of “/);
    await where.selectOption(`beside:right:s-${chart}`);
    await Promise.all([page.waitForNavigation(), window_.getByRole('button', { name: 'Add this section' }).click()]);

    const saved = JSON.parse(site.host.settings['structure:page:shop']);
    const [table] = Object.keys(saved.added).filter((id) => id !== chart);
    expect(saved.beside).toEqual({ [table]: { of: chart, side: 'right' } });
    const order = JSON.parse(Object.entries(site.host.settings).find(([key, value]) => key !== 'structure:page:shop' && String(value).includes(`s-${chart}`))[1]);
    expect(order.indexOf(`s-${table}`)).toBe(order.indexOf(`s-${chart}`) + 1);
});

