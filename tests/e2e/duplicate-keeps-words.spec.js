import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';
import { keyOf } from '../support/fake-host.js';

/*
 * Found on a hosted site (Imole Montessori, "What we hold to"): an item's words
 * edited, the item duplicated, and every copy showed the edited words until the
 * page was drawn again. Then each copy showed the design's sample words, because
 * nothing had been stored under the copy's own keys. A copy is stored with every
 * word, link and picture its item had, so a reload or a publish shows the same.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/duplicate-keeps-words.spec.js
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});
test.setTimeout(120000);

let site;
test.beforeEach(async ({ page }) => {
    site = await serveFakeHost();
    page.on('dialog', (dialog) => dialog.accept());
});
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const cards = '[data-list="products"] [data-edit-item]';

const openAsEditor = async (page, path = 'shop') => {
    await page.goto(`${site.url}/edit/${path}?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
};

const choose = async (page, selector) => {
    await page.locator(selector).first().click();
};

const typeAndSave = async (page, words) => {
    await page.locator('.le-drawer textarea').first().fill(words);
    await ui(page).getByRole('button', { name: 'Save changes' }).click();
};

const drawn = (path = 'shop') => site.host.draw(path);
const words = (doc, selector) => (doc.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
const idsIn = (doc) => [...doc.querySelectorAll(cards)].map((item) => item.getAttribute('data-edit-item'));

/** What a card shows once the page is drawn again from what was stored. */
const card = (doc, id) => ({
    notes: words(doc, `[data-edit-item="${id}"] [data-field="notes"]`),
    name: words(doc, `[data-edit-item="${id}"] h3 a`),
    href: doc.querySelector(`[data-edit-item="${id}"] h3 a`)?.getAttribute('href'),
});

test('a duplicated item keeps the words it was copied with, after the page is drawn again and with its original gone', async ({ page }) => {
    // A link address the owner had already given the card. (A saved picture is copied the same
    // way, but the stand-in host cannot draw one outside a browser.)
    site.host.save(keyOf(drawn(), '[data-edit-item="blue"] h3 a', 'data-edit-href'), 'https://example.test/our-blue');

    await openAsEditor(page);
    await choose(page, '[data-edit-item="blue"] [data-field="notes"]');
    await typeAndSave(page, 'Rain on the iris, our way');
    await expect.poll(() => card(drawn(), 'blue').notes).toBe('Rain on the iris, our way');
    await choose(page, '[data-edit-item="blue"] h3 a');
    await typeAndSave(page, 'Our Blue Hour');
    await expect.poll(() => card(drawn(), 'blue').name).toBe('Our Blue Hour');
    const edited = card(drawn(), 'blue');
    expect(edited).toEqual({
        notes: 'Rain on the iris, our way',
        name: 'Our Blue Hour',
        href: 'https://example.test/our-blue',
    });

    // Duplicated: the copy carries the edited words when the page is drawn again.
    await choose(page, '[data-edit-item="blue"] [data-field="notes"]');
    await ui(page).getByRole('button', { name: 'Duplicate' }).click();
    await expect(page.locator(cards)).toHaveCount(3);
    const copy = idsIn(drawn()).find((id) => !['aster', 'blue'].includes(id));
    expect(card(drawn(), copy)).toEqual(edited);
    // Named for the design's item it is drawn from, so its keys hold when that item is deleted.
    expect(copy).toMatch(/^n[0-9a-z]+_blue$/);

    // A copy of the copy, too.
    await choose(page, `[data-edit-item="${copy}"] [data-field="notes"]`);
    await ui(page).getByRole('button', { name: 'Duplicate' }).click();
    await expect(page.locator(cards)).toHaveCount(4);
    const second = idsIn(drawn()).find((id) => !['aster', 'blue', copy].includes(id));
    expect(card(drawn(), second)).toEqual(edited);
    // Named for the design's item it is drawn from, so its keys hold when that item is deleted.
    expect(second).toMatch(/^n[0-9a-z]+_blue$/);

    // The original and the design's first card deleted: the copies keep their words.
    for (const gone of ['blue', 'aster']) {
        await choose(page, `[data-edit-item="${gone}"] [data-field="notes"]`);
        await ui(page).getByRole('button', { name: 'Delete this item' }).click();
        const ask = ui(page).locator('.le-modal');
        if (await ask.isVisible().catch(() => false)) await ask.getByRole('button', { name: 'Delete the card', exact: true }).click();
        await expect(page.locator(`[data-edit-item="${gone}"]`)).toHaveCount(0);
    }
    expect(idsIn(drawn())).toEqual([copy, second]);
    expect(card(drawn(), copy)).toEqual(edited);
    expect(card(drawn(), second)).toEqual(edited);

    // And the editor, opened again, shows the same.
    await openAsEditor(page);
    await expect(page.locator(`[data-edit-item="${second}"] [data-field="notes"]`)).toHaveText('Rain on the iris, our way');
    await expect(page.locator(`[data-edit-item="${second}"] h3 a`)).toHaveText('Our Blue Hour');
});
