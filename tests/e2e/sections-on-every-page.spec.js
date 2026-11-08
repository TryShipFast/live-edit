import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/** The editor's own question (in its dialog, not the browser's), answered yes when it is asked. */
const yes = async (page) => {
    const ask = page.locator('#live-edit-ui .le-modal .le-btn-danger').first();
    if (await ask.isVisible({ timeout: 3000 }).catch(() => false)) await ask.click();
    else await ask.waitFor({ timeout: 3000 }).then(() => ask.click()).catch(() => {});
};
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

/** A section opened the way an owner opens it: pressing its words on the page; its panel has the section's tools. */
const openSection = async (page, item) => {
    await page.keyboard.press('Escape');
    const words = page.locator(`[data-edit-item="${item}"] [data-edit]`).first();
    await words.scrollIntoViewIfNeeded();
    // the line for adding between sections can sit over a heading at the top of a section
    await words.dispatchEvent('click');
    // Opened from something inside it, the section's tools are folded into one line (first-time owner walk): opened.
    const fold = ui(page).locator('.le-drawer .le-fold > summary');
    await expect(fold).toContainText('This section');
    await fold.click();
    await expect(ui(page).locator('.le-drawer .le-fold')).toHaveAttribute('open', '');
};

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
    // Where it goes starts where they pointed, said in the window's "Put it".
    await expect(ui(page).locator('.le-browser-where-pick option:checked')).toHaveText(/Below “Product”/);
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
    // Where it goes is said, and chosen, in the window: the end, from the line after the last section.
    await expect(ui(page).locator('.le-browser-where-pick option:checked')).toHaveText(/^At the end, below/);
    await addFromLibrary(page, 'Story');

    const [id] = Object.keys(site.host.builderFor('shop', '').added);
    expect(sectionsOf('shop')).toEqual(['s-grid=Products', 's-journal=Journal', `s-${id}=Story`]);
    await expect(page.locator(`[data-edit-item="s-${id}"] p`)).toHaveText('Neroli picked at dawn, laid over cedar.');
});

test('the bar\'s + Section opens the add window at the end of the page; an added one can be taken off again', async ({ page }) => {
    await openAsEditor(page, 'journal/salt-air');
    // First-time owner walk, 7 Nov 2026: "+ Section" opened a list of the page's sections, and adding was one more press.
    await ui(page).getByRole('button', { name: '+ Section' }).click();
    await addFromLibrary(page, 'Story');
    const [id] = Object.keys(site.host.builderFor('journal/salt-air', '').added);
    expect(sectionsOf('journal/salt-air')).toEqual(['s-article=Post', 's-related=More posts', `s-${id}=Story`]);

    // Opened on the page, the added section can go again ("Remove this section").
    await openSection(page, `s-${id}`);
    const drawer = ui(page).locator('.le-drawer');
    await drawer.getByRole('button', { name: 'Remove this section' }).click();
    await yes(page);
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
    await expect(ui(page).getByRole('button', { name: 'Pages', exact: true })).toBeHidden();

    // A section's own panel offers moving it, but no adding from a library.
    await page.locator('[data-edit-item="s-story"] h2').click();
    await expect(ui(page).locator('.le-drawer')).toBeVisible();
    await expect(ui(page).getByRole('button', { name: /Add a section/ })).toHaveCount(0);
});

/*
 * Owner, 7 Nov 2026: "Adding the form is confusing, and where to add it is not specified." + Add a form is beside
 * + Add a section on the line and in the page's sections panel; it opens on the forms alone, shows the form itself,
 * and the form goes where "Put it" says, here the top of the page.
 */
test('+ Add a form opens on the forms, shows the form, and puts it where the owner chose', async ({ page }) => {
    await site.close();
    site = await serveFakeHost({ library: true, libraryForms: true });
    await openAsEditor(page, 'shop');
    await page.mouse.move(400, 300);
    const end = ui(page).locator('.le-insert-end.is-visible');
    await expect(end.locator('.le-insert-btn')).toHaveText('+ Add a section');
    await end.locator('.le-insert-form').click();

    const window_ = ui(page).locator('.le-modal');
    await expect(window_.locator('.le-modal-title, h2').first()).toHaveText('Add a form');
    await expect(window_.locator('.le-library-item')).toHaveText(['Form: contact']);
    await expect(window_.locator('.le-library-kinds .le-subtab.is-on')).toHaveText('Forms');
    // The form itself, as it will look.
    await expect.poll(() => window_.locator('.le-browser-frame').evaluate((frame) => frame.srcdoc)).toContain('Get in touch');
    // Put it at the top of the page.
    await window_.locator('.le-browser-where-pick').selectOption({ label: 'At the top of the page' });
    await Promise.all([page.waitForNavigation(), window_.getByRole('button', { name: 'Add this form' }).click()]);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);

    const [id] = Object.keys(site.host.builderFor('shop', '').added);
    expect(site.host.builderFor('shop', '').added[id]).toBe('kit.form.contact');
    expect(sectionsOf('shop')[0]).toMatch(new RegExp(`^s-${id}=`));

    // The bar's + Section offers forms too, in the add window.
    await ui(page).getByRole('button', { name: /^\+ Section$|^Sections$/ }).first().click();
    await expect(ui(page).locator('.le-modal').getByRole('button', { name: 'Forms', exact: true })).toBeVisible();
});

test('the bar has + Form, which opens the add window on the forms (owner, 8 Nov 2026: "why is there no create a new form")', async ({ page }) => {
    await site.close();
    site = await serveFakeHost({ library: true, libraryForms: true });
    await openAsEditor(page, 'shop');
    const form = ui(page).getByRole('button', { name: /^\+ Form$|^Add a form$/ }).first();
    // On a narrow bar it sits under More, as Sections does.
    if (!(await form.isVisible().catch(() => false))) await ui(page).getByRole('button', { name: 'More' }).click();
    await form.click();
    const window_ = ui(page).locator('.le-modal');
    await expect(window_.locator('.le-modal-title, h2').first()).toHaveText('Add a form');
    await expect(window_.locator('.le-library-item')).toHaveText(['Form: contact']);
});

test('a website with no forms to add shows no + Form on the bar', async ({ page }) => {
    await openAsEditor(page, 'shop');
    await expect(ui(page).locator('.le-toolbar').getByRole('button', { name: '+ Form' })).toBeHidden();
});

test('a section the design came with can be deleted too, and is gone from the page (owner, 7 Nov 2026)', async ({ page }) => {
    await openAsEditor(page, 'journal/salt-air');
    await openSection(page, 's-related');
    const drawer = ui(page).locator('.le-drawer');
    // the design's own section offers Delete as well as Hide; an added one says "Remove this section"
    await expect(drawer.getByRole('button', { name: 'Remove this section' })).toHaveCount(0);
    await drawer.getByRole('button', { name: 'Delete this section' }).click();
    await yes(page);
    await expect.poll(() => sectionsOf('journal/salt-air')).toEqual(['s-article=Post']);
});

test('after a section is deleted, Undo is ready at once (owner, 8 Nov 2026: delete, not hide)', async ({ page }) => {
    await openAsEditor(page, 'journal/salt-air');
    const before = await sectionsOf('journal/salt-air');
    await openSection(page, 's-related');
    const drawer = ui(page).locator('.le-drawer');
    await expect(drawer).not.toContainText('Hide this');
    await drawer.getByRole('button', { name: 'Delete this section' }).click();
    await yes(page);
    await expect.poll(() => sectionsOf('journal/salt-air')).toEqual(['s-article=Post']);
    await page.keyboard.press('Escape');
    const undo = ui(page).getByRole('button', { name: 'Undo' });
    // Undo is ready at once (it waited for a reload before). Putting the section back is the content API's
    // (DELETE /changes), which this stand-in host does not run; the website's editor walk proves that part.
    await expect(undo).toBeEnabled();
    expect(before).toContain('s-related=More posts');
});

test('the last section of a page cannot be deleted', async ({ page }) => {
    await openAsEditor(page, 'journal/salt-air');
    await openSection(page, 's-related');
    const drawer = ui(page).locator('.le-drawer');
    await drawer.getByRole('button', { name: 'Delete this section' }).click();
    await yes(page);
    await expect.poll(() => sectionsOf('journal/salt-air')).toEqual(['s-article=Post']);
    await page.reload();
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    await openSection(page, 's-article');
    await expect(drawer.getByRole('button', { name: 'Delete this section' })).toBeDisabled();
});
