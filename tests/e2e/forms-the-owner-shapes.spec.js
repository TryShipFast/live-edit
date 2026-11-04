import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * Forms the owner shapes (the website's LIVE-EDIT-STRUCTURE.md): pressing a form opens its builder,
 * read from the form's markup the first time; the owner adds a phone they require and a dropdown of
 * their own, renames and reorders, and saves; the page is drawn again with the builder open where it
 * was. Once the form has answers, a question with answers keeps its kind, said in plain words, and is
 * taken off rather than deleted. An outside site (the plugin, an adapter) is handed no builder and sees
 * none of it.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/forms-the-owner-shapes.spec.js
 */

test.use({
    viewport: { width: 1400, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});

test.setTimeout(120000);

let site;
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const builder = (page) => ui(page).locator('.le-modal.le-form-builder');
const row = (page, label) => builder(page).locator('.le-fb-field', { has: page.locator('.le-fb-label', { hasText: label }) }).first();
const saved = () => JSON.parse(site.host.settings['form:contact/contact.form'] ?? 'null');

const openAsEditor = async (page) => {
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(`${site.url}/edit/contact?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();
};

const add = async (page, kind, label) => {
    await builder(page).locator('.le-fb-add select').selectOption({ label: kind });
    await builder(page).getByRole('button', { name: '+ Add a question' }).click();
    const words = builder(page).locator('.le-fb-field:has(.le-fb-edit) label.le-field', { hasText: 'Question' }).locator('input');
    await words.fill(label);
    await words.press('Tab');
};

test('a form is shaped in its builder, saved once, and opened again where it was', async ({ page }) => {
    site = await serveFakeHost({ forms: {} });
    await openAsEditor(page);

    // Pressing one of its boxes opens the builder at that question, read from the markup.
    await page.locator('form[data-kit-form] input[name="email"]').click();
    await expect(builder(page)).toBeVisible();
    await expect(builder(page).locator('.le-fb-label')).toHaveText(['Your name', 'Email', 'Message']);
    await expect(builder(page).locator('.le-fb-field:has(.le-fb-edit) input').first()).toHaveValue('Email');

    await add(page, 'Phone', 'Mobile number');
    await builder(page).locator('.le-fb-field:has(.le-fb-edit) .le-check input').check();
    await add(page, 'Dropdown', 'How did you hear about us?');
    const another = builder(page).locator('.le-fb-field:has(.le-fb-edit) input[aria-label="Another choice"]');
    await another.fill('A friend');
    await another.press('Enter');

    // Rename and move the message up.
    await row(page, 'Message').locator('.le-fb-name').click();
    const words = builder(page).locator('.le-fb-field:has(.le-fb-edit) label.le-field', { hasText: 'Question' }).locator('input');
    await words.fill('Anything else?');
    await words.press('Tab');
    await row(page, 'Anything else?').getByRole('button', { name: /up$/ }).click();
    await expect(builder(page).locator('.le-fb-label')).toHaveText(['Your name', 'Anything else?', 'Email', 'Mobile number', 'How did you hear about us?']);

    await Promise.all([page.waitForNavigation(), builder(page).getByRole('button', { name: 'Save the form' }).click()]);

    // Saved once, as the form's setting: only the definition.
    const definition = saved();
    expect(definition.fields.map((f) => f.label)).toEqual(['Your name', 'Anything else?', 'Email', 'Mobile number', 'How did you hear about us?']);
    const phone = definition.fields.find((f) => f.label === 'Mobile number');
    expect(phone).toMatchObject({ type: 'phone', required: true, retired: false });
    expect(phone.key).toMatch(/^f[a-z0-9]{3,}$/);
    expect(definition.fields.find((f) => f.type === 'choice').options.map((o) => o.label)).toEqual(['A friend']);
    expect(Object.keys(definition.fields[0]).sort()).toEqual(['help', 'key', 'label', 'options', 'required', 'retired', 'type']);

    // Drawn again by the host, with the builder open on it.
    await expect(builder(page)).toBeVisible();
    await expect(page.locator(`form[data-kit-form] input[name="${phone.key}"]`)).toHaveAttribute('type', 'tel');
    await expect(builder(page).locator('.le-fb-label')).toHaveText(['Your name', 'Anything else?', 'Email', 'Mobile number', 'How did you hear about us?']);
});

test('once a form has answers, a question with answers keeps its kind and is taken off, never deleted', async ({ page }) => {
    site = await serveFakeHost({ forms: { submissions: 4, answered: { fphone1: 4, email: 4 } } });
    site.host.save('form:contact/contact.form', JSON.stringify({ fields: [
        { key: 'name', label: 'Your name', type: 'text', required: true, help: '', retired: false, options: [] },
        { key: 'email', label: 'Email', type: 'email', required: true, help: '', retired: false, options: [] },
        { key: 'fphone1', label: 'Mobile number', type: 'phone', required: true, help: '', retired: false, options: [] },
    ] }));
    await openAsEditor(page);
    await page.locator('form[data-kit-form] input[name="fphone1"]').click();

    // The limits, said before anything is changed.
    await expect(builder(page).locator('.le-fb-notice')).toContainText('This form has 4 answers so far');
    const kind = builder(page).locator('.le-fb-field:has(.le-fb-edit) label.le-field', { hasText: 'Kind of answer' });
    await expect(kind.locator('select')).toBeDisabled();
    await expect(kind.locator('.le-hint')).toHaveText('It already has 4 answers, so it stays a phone field. To ask in another way, take it off the form and add a new field.');
    await expect(builder(page).locator('.le-fb-field:has(.le-fb-edit)')).toContainText('Required or not applies to new answers only.');

    await builder(page).getByRole('button', { name: 'Take it off the form' }).click();
    await expect(builder(page).locator('.le-fb-off-list')).toContainText('Mobile number');
    await expect(builder(page).locator('.le-fb-off-list')).toContainText('Answers already sent to them stay in your enquiries and the spreadsheet.');
    await Promise.all([page.waitForNavigation(), builder(page).getByRole('button', { name: 'Save the form' }).click()]);

    expect(saved().fields.find((f) => f.key === 'fphone1')).toMatchObject({ retired: true, type: 'phone' });
    await expect(page.locator('form[data-kit-form] input[name="fphone1"]')).toHaveCount(0);
    // Put back from the same place.
    await builder(page).locator('.le-fb-off-list').getByRole('button', { name: 'Put it back' }).click();
    await expect(builder(page).locator('.le-fb-label').filter({ hasText: 'Mobile number' })).toHaveCount(1);
});

test('the builder fits a phone', async ({ page }) => {
    site = await serveFakeHost({ forms: {} });
    await page.setViewportSize({ width: 390, height: 844 });
    await openAsEditor(page);
    await page.locator('form[data-kit-form] textarea[name="message"]').click();
    await expect(builder(page)).toBeVisible();
    await add(page, 'One choice', 'Party size');
    // Saving a set of choices with none is refused, plainly.
    await builder(page).getByRole('button', { name: 'Save the form' }).click();
    await expect(builder(page).locator('.le-fb-error')).toHaveText('“Party size” needs at least one choice. Type one under it and press Add.');
    const wider = await builder(page).evaluate((card) => card.scrollWidth > card.clientWidth + 1 || card.getBoundingClientRect().right > window.innerWidth + 1);
    expect(wider).toBe(false);
});

test('an outside site is handed no builder and sees none of it', async ({ page }) => {
    site = await serveFakeHost({ outside: true });
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(`${site.url}/edit/shop?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    expect(await page.evaluate(() => window.liveEditForms)).toBeUndefined();
    await expect(ui(page).locator('.le-form-handle.is-visible')).toHaveCount(0);
});
