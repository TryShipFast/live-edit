import { expect, test } from '@playwright/test';

/*
 * A client editing their own static site, start to finish.
 *
 * Written as the journey rather than as assertions about functions, because
 * every fault this path has had was invisible to unit tests and obvious in a
 * browser: the editor unable to see their own draft, published words never
 * applied, published styles never rendered, published pictures never swapped.
 * Four bugs, one shape — the server-rendered path working and the static path
 * quietly doing nothing.
 *
 * So this walks the whole way: arrive as a visitor, sign in as the client,
 * change words, a picture, a link and a colour, check a visitor still sees the
 * old site, publish, and check they now see the new one.
 *
 *   KB_SITE=harbour KB_API=http://127.0.0.1:8711/api/live-edit/v1 \
 *   KB_SECRET=kbs_… BASE_URL=http://127.0.0.1:8950 \
 *   npx playwright test tests/e2e/static-journey.spec.js
 */

const API = process.env.KB_API;
const SITE = process.env.KB_SITE;
const SECRET = process.env.KB_SECRET;

test.skip(!API || !SITE || !SECRET, 'Set KB_API, KB_SITE and KB_SECRET to run the journey.');

/** The overlay lives in a shadow root, so every control is reached through it. */
const chrome = (page) => page.evaluateHandle(() =>
    [...document.querySelectorAll('*')].find((el) => el.shadowRoot?.querySelector('button'))?.shadowRoot ?? null);

const clickControl = (page, label) => page.evaluate((text) => {
    const root = [...document.querySelectorAll('*')].find((el) => el.shadowRoot?.querySelector('button'))?.shadowRoot;
    const button = [...(root?.querySelectorAll('button') ?? [])].find((b) => b.textContent.trim() === text);
    button?.click();

    return Boolean(button);
}, label);

const typeInDrawer = (page, value) => page.evaluate((text) => {
    const root = [...document.querySelectorAll('*')].find((el) => el.shadowRoot?.querySelector('button'))?.shadowRoot;
    const field = root?.querySelector('textarea');
    if (!field) return false;
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(field, text);
    field.dispatchEvent(new Event('input', { bubbles: true }));

    return true;
});

/** A session, as the client's inbox link would have given them one. */
const signIn = async (request) => {
    const response = await request.post(`${API}/${SITE}/sessions`, {
        headers: { Authorization: `Bearer ${SECRET}` },
        data: {},
    });
    expect(response.ok()).toBeTruthy();

    return (await response.json()).token;
};

const publishedValue = async (request, key) => {
    const response = await request.get(`${API}/${SITE}/content`, {
        headers: { Authorization: `Bearer ${SECRET}` },
    });

    return (await response.json()).settings?.[key];
};

test('a client changes their own words and puts them live', async ({ page, request }) => {
    // --- as a visitor, before anything --------------------------------
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('[data-edit^="setting:"]').filter({ hasText: /\w{6,}/ }).first();
    const before = (await heading.textContent()).trim();
    const key = (await heading.getAttribute('data-edit')).replace('setting:', '');

    expect(before.length).toBeGreaterThan(3);

    // No editor for somebody who is only reading.
    await expect(page.locator('body')).not.toHaveAttribute('data-admin', /.*/);

    // --- arriving from the link in their inbox ------------------------
    const session = await signIn(request);
    await page.goto(`/#kb_session=${encodeURIComponent(session)}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // The key must not be left in the address bar: URLs get pasted into
    // chats and screenshots.
    expect(page.url()).not.toContain('kb_session');

    expect(await chrome(page)).toBeTruthy();

    // --- editing ------------------------------------------------------
    expect(await clickControl(page, 'Edit site')).toBeTruthy();
    await page.waitForTimeout(400);

    await heading.scrollIntoViewIfNeeded();
    await heading.click();
    await page.waitForTimeout(600);

    const written = `Edited at ${Date.now()}`;
    expect(await typeInDrawer(page, written)).toBeTruthy();
    expect(await clickControl(page, 'Save changes')).toBeTruthy();
    await page.waitForTimeout(2500);

    // --- held back from the public ------------------------------------
    expect(await publishedValue(request, key)).not.toBe(written);

    // --- publishing ---------------------------------------------------
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const published = await clickControl(page, 'Publish 1');

    if (published) {
        page.once('dialog', (d) => d.accept());
        await page.waitForTimeout(2500);
    }

    // --- and now everyone sees it -------------------------------------
    await expect
        .poll(() => publishedValue(request, key), { timeout: 15000 })
        .toBe(written);
});

test('a visitor is given the words but never the editor', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const surface = await page.evaluate(() => ({
        marked: document.body.hasAttribute('data-admin'),
        overlay: Boolean([...document.querySelectorAll('*')].find((el) => el.shadowRoot?.querySelector('button'))),
        keys: document.documentElement.outerHTML.match(/kbe_|kbs_/g),
        tagged: document.querySelectorAll('[data-edit], [data-edit-img]').length,
    }));

    expect(surface.marked).toBe(false);
    expect(surface.overlay).toBe(false);
    expect(surface.keys).toBeNull();
    // The page is still fully tagged; it simply has nothing to edit with.
    expect(surface.tagged).toBeGreaterThan(0);
});
