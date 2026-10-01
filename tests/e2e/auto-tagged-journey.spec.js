import { expect, test } from '@playwright/test';

/*
 * A Laravel site nobody annotated, edited in place.
 *
 * Every other journey here runs against a site whose templates carry
 * data-edit attributes somebody wrote. That is the good case and it was also
 * the ONLY case: the runtime acts on tagged elements, and until the tagging
 * middleware existed the only things that produced tags were the API — which
 * is how WordPress and the bought templates work — and a developer editing
 * Blade. So "install the editor" quietly meant "annotate your site first",
 * which is the work the product exists to remove and which nobody can do to a
 * site they bought.
 *
 * This drives a host with no attributes anywhere in its templates. What it is
 * really asserting is the sales claim: composer require, one line, and the
 * words on the page can be changed by the person who owns them.
 *
 *   AUTO_BASE=https://shipfast.test AUTO_EMAIL=… AUTO_PASSWORD=… \
 *   npx playwright test tests/e2e/auto-tagged-journey.spec.js --project=chromium-desktop
 */

const BASE = process.env.AUTO_BASE;
const EMAIL = process.env.AUTO_EMAIL;
const PASSWORD = process.env.AUTO_PASSWORD;
const PAGE = process.env.AUTO_PAGE || '/faq';

test.skip(!BASE || !EMAIL || !PASSWORD, 'Set AUTO_BASE, AUTO_EMAIL and AUTO_PASSWORD to walk an untagged host.');

// One worker: these edit one shared site and put the words back afterwards.
test.describe.configure({ mode: 'serial' });

// A local host is served with a certificate nothing trusts, and this suite is
// pointed at one by design.
test.use({ ignoreHTTPSErrors: true });

const panel = (page) => page.locator('.le-drawer');

/**
 * The box holding the words.
 *
 * `:visible` matters: the drawer carries hidden style inputs — a background
 * image URL among them — and the first plain text field in DOM order is one
 * of those, so an unfiltered locator waits thirty seconds to fill something
 * nobody can see.
 */
const theWordsField = (page) => panel(page).locator('textarea:visible, input[type=text]:visible').first();

const settled = async (page) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
};

const signIn = async (page) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type=email]').first().fill(EMAIL);
    await page.locator('input[type=password]').first().fill(PASSWORD);
    await page.locator('button[type=submit]').first().click();
    await settled(page);
};

const startEditing = async (page) => {
    await page.goto(BASE + PAGE);
    await settled(page);

    const toggle = page.getByRole('button', { name: /^(Edit site|Done editing)$/ });
    await expect(toggle, 'the editor never appeared on an untagged page').toBeVisible({ timeout: 15000 });

    if ((await toggle.textContent()) === 'Edit site') {
        await toggle.click();
    }

    await expect
        .poll(() => page.evaluate(() => document.body.classList.contains('editing')), { timeout: 15000 })
        .toBe(true);
};

/**
 * Put the drawer on one element.
 *
 * dispatchEvent rather than click(), and the difference is not cosmetic: a
 * normal click lands at the element's centre, where the editor's own hover
 * overlay sits, so the selection resolves to the nearest ancestor — the
 * drawer opens on Section > Card in style mode and there is no words field
 * at all. Dispatching on the element selects the element.
 */
const selectForEditing = async (page, selector) => {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await element.dispatchEvent('click');
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
    await expect(theWordsField(page)).toBeVisible();
};

const shown = (page, selector) =>
    page.evaluate((sel) => (document.querySelector(sel)?.textContent ?? '').replace(/\s+/g, ' ').trim(), selector);

/**
 * Something with enough words in it to be unmistakably real copy.
 *
 * Derived keys are spelled `setting:auto:<hash>` rather than `auto:<hash>` —
 * the prefix says which store the value belongs in, and matching on the bare
 * form finds nothing at all while looking like the feature is broken.
 */
const anAutoKey = (page) =>
    page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-edit*="auto:"]')) {
            const text = (el.textContent ?? '').trim();
            if (text.length > 20 && text.length < 400 && el.children.length === 0) {
                return el.getAttribute('data-edit');
            }
        }
        return null;
    });

test('a page with no data-edit in its templates is still editable', async ({ page }) => {
    await signIn(page);

    // The host's own source says nothing about live-edit beyond one line in
    // the layout. If attributes are present, they were derived here.
    await page.goto(BASE + PAGE);
    const tagged = await page.evaluate(() => document.querySelectorAll('[data-edit*="auto:"]').length);
    expect(tagged, 'nothing was tagged, so nothing could be edited').toBeGreaterThan(5);

    await startEditing(page);
    await expect(panel(page).or(page.locator('.le-toolbar')).first()).toBeAttached();
});

test('words changed on an untagged host are on the page after a reload', async ({ page }) => {
    await signIn(page);
    await startEditing(page);

    const key = await anAutoKey(page);
    expect(key, 'found no derived key worth editing').not.toBeNull();

    const selector = `[data-edit="${key}"]`;
    const before = await shown(page, selector);
    const words = `Edited by the journey ${Date.now().toString(36)}`;

    await selectForEditing(page, selector);

    await theWordsField(page).fill(words);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await settled(page);

    // After a reload, not before. The panel previews as you type, so asserting
    // early passes on the preview while nothing was stored — the fault that
    // hid a broken save route for a whole session once.
    await page.reload();
    await settled(page);

    expect(await shown(page, selector)).toContain(words);
    expect(await shown(page, selector)).not.toBe(before);

    // Put the site back. This is somebody's real marketing copy.
    await startEditing(page);
    await selectForEditing(page, selector);
    await theWordsField(page).fill(before);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await settled(page);

    await page.reload();
    await settled(page);
    expect(await shown(page, selector)).toBe(before);
});

test('a visitor is served none of it', async ({ browser }) => {
    /*
     * A context made by hand, so the config's own options do not reach it.
     *
     * `use` in playwright.config.js applies to the page and context fixtures and
     * not to browser.newContext(), which takes the defaults. Against a site behind
     * a development certificate that means the visitor's page cannot load the
     * runtime at all - and the test reports that a published change never reached
     * a visitor, which is a fault in the harness wearing the costume of a fault in
     * the product.
     */
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    try {
        await page.goto(BASE + PAGE);
        const html = await page.content();

        // Not merely "the toolbar is hidden". A visitor's page should carry no
        // editor, no derived attributes and no sign that this site is
        // editable at all — the parsing cost falls only on the editor, and
        // the markup a visitor gets is the markup the host wrote.
        expect(html).not.toContain('live-edit/runtime.js');
        expect(await page.evaluate(() => document.querySelectorAll('[data-edit]').length)).toBe(0);
        expect(await page.evaluate(() => document.body.hasAttribute('data-admin'))).toBe(false);
    } finally {
        await context.close();
    }
});
