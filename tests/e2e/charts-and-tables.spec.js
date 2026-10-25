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
    await expect(window_.getByText('Charts and tables')).toBeVisible();
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

test('a donut, chosen by its kind, is added and edited slice by slice with its rules kept', async ({ page }) => {
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

    // A slice, clicked on the drawing, opens as a slice with the donut's own fields.
    await chart.locator('[data-chart-plot] .kit-chart__mark').first().dispatchEvent('click');
    await expect(drawer(page).getByText('Slice 1 of 4 · Recommended by a friend')).toBeVisible();
    await expect(drawer(page).locator('.le-data-fields .le-label')).toHaveText(['Source', 'Share']);
    await expect(drawer(page).getByRole('button', { name: '+ Add a slice after' })).toBeVisible();

    // A share that stops the whole adding up is saved, and said.
    const share = drawer(page).locator('input[data-data-column="1"]');
    await share.fill('46');
    await share.press('Enter');
    const shareKey = keyOf(site.host.draw('shop'), `[data-instance="shop.${id}"] tbody tr td`);
    await expect.poll(() => site.host.settings[shareKey]).toBe('46');
    await expect(drawer(page).getByText(/Shares now add to 104%, not 100%\. Take 4 off one of them/)).toBeVisible();
    await expect.poll(() => chart.locator('svg[role="img"]').getAttribute('aria-label')).toContain('46%');

    // A word where a figure goes is refused, and nothing is saved.
    await share.fill('lots');
    await share.press('Enter');
    await expect(drawer(page).getByRole('alert')).toContainText('“lots” is not a figure');
    expect(site.host.settings[shareKey]).toBe('46');

    // Two more slices make six; a seventh is not offered, and the panel says why.
    for (const _ of [1, 2]) {
        await chart.locator('[data-chart-plot] .kit-chart__mark').first().dispatchEvent('click');
        await drawer(page).getByRole('button', { name: '+ Add a slice after' }).click();
        await expect(page.locator('.le-toast, #live-edit-ui').first()).toBeAttached();
        await expect.poll(() => rowsDrawn('shop', id).length).toBe(4 + _);
    }
    await chart.locator('[data-chart-plot] .kit-chart__mark').first().dispatchEvent('click');
    await expect(drawer(page).getByRole('button', { name: '+ Add a slice after' })).toBeDisabled();
    await expect(drawer(page).getByText(/A donut reads at 6 slices at most/)).toBeVisible();
});

test('a funnel refuses a stage larger than the one before it, and a move that would make one', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const id = await addAtTheEnd(page, 'Chart: a funnel of stages');
    const chart = page.locator(`[data-instance="shop.${id}"]`);
    await chart.locator('[data-chart-plot] .kit-chart__mark').nth(2).dispatchEvent('click');
    await expect(drawer(page).getByText('Stage 3 of 4 · Added to the bag')).toBeVisible();

    const count = drawer(page).locator('input[data-data-column="1"]');
    await count.fill('2,500');
    await count.press('Enter');
    await expect(drawer(page).getByRole('alert')).toContainText('can’t be more than the stage before it, “Viewed a product” (2,100)');
    expect(rowsDrawn('shop', id)[2][1]).toBe('640');

    await drawer(page).getByRole('button', { name: '↑ Move up' }).click();
    await expect(drawer(page).getByRole('alert').first()).toContainText('can’t be more than the stage before it');
    expect(rowsDrawn('shop', id).map((r) => r[0])).toEqual(['Visited the site', 'Viewed a product', 'Added to the bag', 'Ordered']);

    await count.fill('900');
    await count.press('Enter');
    await expect.poll(() => rowsDrawn('shop', id)[2][1]).toBe('900');
});

test('a bar chart is filled from pasted rows, and drawn across instead of up', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const id = await addAtTheEnd(page, 'Chart: bars or columns');
    const chart = page.locator(`[data-instance="shop.${id}"]`);

    // The drawing itself, away from any bar, is the chart: its settings, its bars, pasting.
    await chart.locator('[data-chart-plot]').scrollIntoViewIfNeeded();
    const plot = await chart.locator('[data-chart-plot]').boundingBox();
    await page.mouse.click(plot.x + 4, plot.y + 4);
    await expect(drawer(page).getByText('How it is drawn', { exact: true })).toBeVisible();
    await drawer(page).locator('textarea').fill('Month\tSales\nJul\t210\nAug\t190\nSep\t230\nOct\t260\nNov\t300\nDec\t340\nJan\t280');
    await drawer(page).getByRole('button', { name: 'Fill the chart' }).click();
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

test('a table takes columns added, moved and deleted in every row, and rows with every column', async ({ page }) => {
    await openAsEditor(page, 'shop');
    const id = await addAtTheEnd(page, 'Table');
    const table = page.locator(`[data-instance="shop.${id}"] table`);
    const shape = () => rowsDrawn('shop', id).map((r) => r.length);
    const heads = () => [...site.host.draw('shop').querySelectorAll(`[data-instance="shop.${id}"] thead th`)].map((th) => th.textContent.trim());

    await table.locator('tbody tr').first().locator('td').first().locator('span').click();
    await expect(drawer(page).getByText('Row 1 of 3 · Starter · Column 2 of 4 · Price a month')).toBeVisible();
    await drawer(page).getByRole('button', { name: '+ Add a column after' }).click();
    await expect.poll(shape).toEqual([5, 5, 5]);
    expect(heads()).toEqual(['Plan', 'Price a month', 'Price a month', 'People included', 'Support']);

    // Name it in the heading, a field of its own.
    await page.locator(`[data-instance="shop.${id}"] thead th`).nth(2).locator('span').click();
    await expect(drawer(page).getByText('Heading · Column 3 of 5')).toBeVisible();
    await drawer(page).locator('textarea').first().fill('Storage');
    await ui(page).getByRole('button', { name: 'Save changes' }).click();
    await expect.poll(heads).toEqual(['Plan', 'Price a month', 'Storage', 'People included', 'Support']);
    expect(heads()[1]).toBe('Price a month');

    // A row added has every column, the new one included, each cell with its own key.
    await table.locator('tbody tr').nth(2).locator('th span').click();
    await drawer(page).getByRole('button', { name: '+ Add a row after' }).click();
    await expect.poll(shape).toEqual([5, 5, 5, 5]);
    await page.reload();
    const keys = [...site.host.draw('shop').querySelectorAll(`[data-instance="shop.${id}"] table [data-edit^="setting:"]`)].map((n) => n.getAttribute('data-edit'));
    expect(keys).toHaveLength(25);
    expect(new Set(keys).size).toBe(25);

    // Moved left, then deleted, in every row at once.
    await page.locator(`[data-instance="shop.${id}"] thead th`).nth(2).locator('span').click();
    await drawer(page).getByRole('button', { name: '← Move left' }).click();
    await expect.poll(heads).toEqual(['Plan', 'Storage', 'Price a month', 'People included', 'Support']);
    await page.locator(`[data-instance="shop.${id}"] thead th`).nth(1).locator('span').click();
    await drawer(page).getByRole('button', { name: 'Delete this column' }).click();
    await expect.poll(heads).toEqual(['Plan', 'Price a month', 'People included', 'Support']);
    expect(shape()).toEqual([4, 4, 4, 4]);

    // Filled from pasted rows: as many columns as the rows have.
    await page.locator(`[data-instance="shop.${id}"] tbody tr`).first().locator('th span').click();
    await drawer(page).getByLabel('Rows to paste into the table').fill('Size,Price,Weight\nSmall,$40,1 kg\nLarge,$70,2 kg');
    await drawer(page).getByRole('button', { name: 'Fill the table' }).click();
    await expect.poll(heads).toEqual(['Size', 'Price', 'Weight']);
    expect(rowsDrawn('shop', id)).toEqual([['Small', '$40', '1 kg'], ['Large', '$70', '2 kg']]);
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
