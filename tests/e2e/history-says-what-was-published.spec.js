import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * History said the way people already read it (owner, 8 Nov 2026: "published changes needs to be fixed too, it's
 * confusing"): each publish one entry with when, who and what by page and section, words before and after; a
 * publish of nothing left out; two changes shown, the rest one press away; one undo, worded for what it does;
 * "Show older" at the foot.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/history-says-what-was-published.spec.js
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

let site;
test.beforeEach(async () => { site = await serveFakeHost(); });
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const drawer = (page) => ui(page).locator('.le-drawer');
const hour = 3600000;

const VERSIONS = (page) => {
    const at = (ago) => new Date(Date.now() - ago).toISOString();
    const first = [
        {
            number: 30, changes: 5, published_at: at(26 * hour), published_by: 'Walk Owner', published_by_id: null,
            lines: [
                { unit: 'section:shop.grid', label: 'Products', what: 'the price', before: '$118', after: '$128' },
                { unit: 'section:shop.grid', label: 'Products', what: 'the notes', before: 'Neroli and cedar', after: 'Neroli, cedar and rain' },
                { unit: 'arrangement:shop', label: 'Page layout', list: '1 item removed, leaving 2 items' },
                { unit: 'sale:aster', label: 'Aster Veil', what: 'the sale price', before: 'No sale', after: '$99' },
                { unit: 'sale:aster', label: 'Aster Veil', what: 'the sale end day', before: 'No end date', after: '15 Nov 2026' },
            ],
        },
        { number: 29, changes: 0, published_at: at(30 * hour), lines: [] },
        ...Array.from({ length: 18 }, (_, i) => ({ number: 28 - i, changes: 1, published_at: at((40 + i) * hour), lines: [{ unit: 'section:shop.grid', label: 'Products', what: 'the notes', before: 'a', after: `b${i}` }] })),
    ];
    const second = Array.from({ length: 5 }, (_, i) => ({ number: 10 - i, changes: 1, published_at: at((90 + i) * hour), lines: [{ what: 'the text', before: 'x', after: `y${i}` }] }));

    return page.route('**/api/demo/versions*', (route) => {
        const n = Number(new URL(route.request().url()).searchParams.get('page') ?? 1);

        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ current: 30, pagination: { page: n, per_page: 20, total: 25, last_page: 2 }, versions: n === 1 ? first : second }) });
    });
};

test('a publish reads as when, who and what by page and section, and can be undone', async ({ page }) => {
    await VERSIONS(page);
    await page.goto(`${site.url}/edit/shop?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    await page.locator('main h1').first().click();
    await ui(page).locator('.le-tab[data-tab="Changes"]').click();
    await ui(page).locator('.le-subtab[data-tab="History"]').click();

    const entries = drawer(page).locator('.le-history');
    // the publish of nothing is not there: 19 of the 20
    await expect(entries).toHaveCount(19);
    const latest = entries.first();
    await expect(latest.locator('.le-history-head')).toContainText('Walk Owner published 5 changes · 1 day ago');
    await expect(latest.locator('time')).toHaveAttribute('title', /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d+ [A-Z][a-z]{2}, \d+:\d\d(am|pm)$/);
    // two changes shown, the rest one press away
    await expect(latest.locator('.le-history-what')).toHaveText(['Price: “$118” → “$128”', 'Notes: “Neroli and cedar” → “Neroli, cedar and rain”']);
    await expect(latest.locator('.le-history-where').first()).toHaveText('Shop · Products');
    await latest.getByRole('button', { name: 'Show all 4 changes' }).click();
    await expect(latest.locator('.le-history-what')).toHaveText(['Price: “$118” → “$128”', 'Notes: “Neroli and cedar” → “Neroli, cedar and rain”', 'Removed a section', 'On sale at $99 until 15 Nov']);
    await expect(drawer(page)).not.toContainText('Other changes');
    await expect(drawer(page)).not.toContainText('Page layout');
    await expect(drawer(page)).not.toContainText('some words');
    await expect(drawer(page)).not.toContainText('1 days');
    // one undo, worded for what it does, asked first
    await latest.getByRole('button', { name: 'Undo these 5 changes' }).click();
    const confirm = ui(page).locator('.le-modal');
    await expect(confirm).toContainText('Undo these 5 changes?');
    await expect(confirm).toContainText('goes back to how it was before, and your site shows that straight away. Anything changed again since then is kept as it is.');
    await confirm.getByRole('button', { name: 'Keep them' }).click();
    // older ones added below
    await drawer(page).getByRole('button', { name: 'Show older' }).click();
    await expect(entries).toHaveCount(24);
    await expect(drawer(page).getByRole('button', { name: 'Show older' })).toHaveCount(0);
    await expect(entries.last()).toContainText('Text: “x” → “y4”');
});
