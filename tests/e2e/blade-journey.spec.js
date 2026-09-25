import { expect, test } from '@playwright/test';

/*
 * The same journey on a site this application renders itself.
 *
 * Everything here has a second implementation — the server substitutes words
 * before the page is sent, where a static site substitutes them afterwards —
 * and a divergence between the two has now caused more faults than anything
 * else in this codebase. The parity tests compare the two appliers directly,
 * which catches a difference in how content is APPLIED and nothing about how
 * it is REACHED: which endpoint the panel calls, which key it uses, whether
 * the control is even offered.
 *
 * So the drawer journey is walked again, here, against the other host.
 *
 * Credentials come from the environment and never from this file. Without
 * them these skip, because a suite that needs a password in the repository to
 * run is a suite nobody can run.
 *
 *   BLADE_URL=http://… BLADE_EMAIL=… BLADE_PASSWORD=… \
 *   npx playwright test tests/e2e/blade-journey.spec.js
 */

const SITE = process.env.BLADE_URL;
const EMAIL = process.env.BLADE_EMAIL;
const PASSWORD = process.env.BLADE_PASSWORD;

test.skip(!SITE || !EMAIL || !PASSWORD, 'Set BLADE_URL, BLADE_EMAIL and BLADE_PASSWORD to walk the server-rendered host.');

test.use({ baseURL: SITE });

const settled = async (page) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
};

/** The panel, and only the panel: the site has its own fields. */
const panel = (page) => page.locator('.le-drawer');

const asEditor = async (page, path = '/') => {
    await page.goto(path);
    await settled(page);

    // The host's own sign-in, because on this kind of site the host decides
    // who may edit — that is the whole difference between the two. It sits
    // behind a link rather than on the page, so it is opened the way a person
    // opens it.
    const open = page.locator('[data-login-open]').first();

    if (await open.count()) {
        // It lives in the footer, which this theme fades in as you reach it,
        // so it has to be scrolled to before it can be clicked at all.
        await open.scrollIntoViewIfNeeded();
        await open.click({ force: true });
    }

    await expect(page.locator('[data-login-modal]')).toBeVisible();

    await page.locator('input[name=email]').first().fill(EMAIL);
    await page.locator('input[name=password]').first().fill(PASSWORD);
    // The submit button specifically. A selector list resolves in document
    // order rather than in the order written, and Cancel comes first in this
    // form — so "any button" quietly closed the panel instead of signing in.
    await page.locator('form[action*="login"] button[type=submit]').first().click();
    await settled(page);

    // The toolbar is mounted once the host page has finished its own setup,
    // so it is waited for rather than assumed. This host signs you in and
    // returns you with editing already on, which the other does not — hence
    // asking the toolbar what state it is in instead of deciding in advance.
    const toggle = page.getByRole('button', { name: /^(Edit site|Done editing)$/ });
    await expect(toggle).toBeVisible({ timeout: 15000 });

    if (await toggle.textContent() === 'Edit site') {
        await toggle.click();
    }

    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing')), { timeout: 15000 }).toBe(true);
};

const openDrawer = async (page, selector) => {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await element.click({ force: true });
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
};

/**
 * Save, then load the page again before looking at it — the panel previews a
 * change as you make it, so asserting before a reload passes on the preview
 * while nothing was stored.
 */
const save = async (page) => {
    await page.getByRole('button', { name: 'Save changes' }).click();
    await settled(page);
    await page.reload();
    await settled(page);
};

const shown = (page, selector) => page.evaluate(
    (sel) => (document.querySelector(sel)?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    selector,
);

test('words changed in the panel are on the page afterwards', async ({ page }) => {
    await asEditor(page);

    const key = await page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-edit^="setting:"]')) {
            if ((el.textContent ?? '').trim().length > 8) return el.getAttribute('data-edit');
        }

        return null;
    });
    expect(key, 'no editable words on this page').not.toBeNull();

    const before = await shown(page, `[data-edit="${key}"]`);
    const words = `Checked on the server-rendered host ${Date.now()}`;

    await openDrawer(page, `[data-edit="${key}"]`);
    await panel(page).locator('textarea').first().fill(words);
    await save(page);

    expect(await shown(page, `[data-edit="${key}"]`)).toContain(words);

    // Put it back: this runs against a real site.
    await openDrawer(page, `[data-edit="${key}"]`);
    await panel(page).locator('textarea').first().fill(before);
    await save(page);
});

test('a colour chosen in the panel is the colour on the page', async ({ page }) => {
    await asEditor(page);

    const key = await page.evaluate(() => document.querySelector('[data-edit][data-style][data-style-props]')?.getAttribute('data-style') ?? null);
    test.skip(!key, 'nothing clickable on this page is styleable');

    await openDrawer(page, `[data-style="${key}"]`);

    const colour = panel(page).locator('input[type=color][data-style-prop]').first();
    test.skip(await colour.count() === 0, 'the panel offers no colour for this element');

    const prop = await colour.getAttribute('data-style-prop');
    const drives = { textColor: 'color', background: 'backgroundColor' }[prop];
    test.skip(!drives, `no rule for what ${prop} should change`);

    const useDefault = panel(page).locator(`input[type=checkbox][data-style-prop="${prop}"]`).first();
    if (await useDefault.count() && await useDefault.isChecked()) await useDefault.uncheck();

    await colour.fill('#0a1f44');
    await save(page);

    expect(await page.evaluate(
        ([sel, css]) => getComputedStyle(document.querySelector(sel))[css],
        [`[data-style="${key}"]`, drives],
    )).toBe('rgb(10, 31, 68)');

    // Back to the theme's own, so the site is left as it was found.
    await openDrawer(page, `[data-style="${key}"]`);
    const restore = panel(page).locator(`input[type=checkbox][data-style-prop="${prop}"]`).first();
    if (await restore.count()) await restore.check();
    await save(page);
});

test('the panel never offers a control the site cannot honour', async ({ page }) => {
    await asEditor(page);

    const key = await page.evaluate(() => document.querySelector('[data-edit][data-style-props]')?.getAttribute('data-style') ?? null);
    test.skip(!key, 'nothing clickable on this page is styleable');

    await openDrawer(page, `[data-style="${key}"]`);

    const offered = await panel(page).locator('[data-style-prop]').evaluateAll((nodes) => nodes.map((n) => n.dataset.styleProp));
    const supported = await page.evaluate(() => Object.keys(window.liveEditStyleProps ?? {}));

    expect(supported.length, 'this host does not declare what it supports').toBeGreaterThan(0);
    expect(offered.filter((prop) => !supported.includes(prop))).toEqual([]);
});

test('the client is told when a save does not reach the page', async ({ page }) => {
    await asEditor(page);

    const key = await page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-edit^="setting:"]')) {
            if ((el.textContent ?? '').trim().length > 8) return el.getAttribute('data-edit');
        }

        return null;
    });
    expect(key).not.toBeNull();

    // A host that accepts the write and drops it, which is what a policy
    // refusal and a mis-scoped key both looked like from here.
    await page.route('**/live-edit/setting', (route) => (
        route.request().method() === 'POST'
            ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
            : route.continue()
    ));

    await openDrawer(page, `[data-edit="${key}"]`);
    await panel(page).locator('textarea').first().fill(`This will be dropped ${Date.now()}`);
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.locator('.le-toast', { hasText: /still showing the old version/i }))
        .toBeVisible({ timeout: 15000 });
});

test('a visitor is shown the site and none of the editing', async ({ browser }) => {
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(SITE);
    await settled(visitor);

    expect(await visitor.evaluate(() => ({
        editor: document.body.hasAttribute('data-admin'),
        editing: document.body.classList.contains('editing'),
        panel: !!document.querySelector('.le-drawer'),
    }))).toEqual({ editor: false, editing: false, panel: false });
});
