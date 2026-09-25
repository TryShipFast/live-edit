import { expect, test } from '@playwright/test';

/*
 * The journey, in a browser, on a site nobody server-renders.
 *
 * Seven faults have now come from static being built last: each capability was
 * wired on the server side first, and the other path quietly did nothing. The
 * parity test catches a divergence in how content is APPLIED. It did not catch
 * the seventh, because that one was about which key the page fetches with —
 * configuration, a level above what parity looks at.
 *
 * These cases walk what actually happens to people. Two of them are the ones
 * that matter and neither can be checked without a browser:
 *
 *   an editor must see their own unpublished work
 *   a visitor must not
 *
 *   KB_API=… KB_SITE=… KB_SECRET=kbs_… BASE_URL=http://… \
 *   npx playwright test tests/e2e/static-journey.spec.js
 */

const API = process.env.KB_API;
const SITE = process.env.KB_SITE;
const SECRET = process.env.KB_SECRET;

test.skip(!API || !SITE || !SECRET, 'Set KB_API, KB_SITE and KB_SECRET to walk the journey.');

const settled = async (page) => {
    await page.waitForLoadState('networkidle');
    // The applier runs after the document is ready and one fetch has returned.
    await page.waitForTimeout(1200);
};

const session = async (request) => {
    const response = await request.post(`${API}/${SITE}/sessions`, {
        headers: { Authorization: `Bearer ${SECRET}` },
        data: {},
    });
    expect(response.ok(), 'could not mint an edit session').toBeTruthy();

    return (await response.json()).token;
};

const write = async (request, token, key, value) => {
    const response = await request.post(`${API}/${SITE}/content`, {
        headers: { Authorization: `Bearer ${token}`, Origin: new URL(process.env.BASE_URL).origin },
        data: { key, value },
    });
    expect(response.ok(), 'the save was refused').toBeTruthy();

    return await response.json();
};

const publish = (request) => request.post(`${API}/${SITE}/publish`, {
    headers: { Authorization: `Bearer ${SECRET}` },
});

/** A key that is on the page and holds enough words to recognise. */
const someKey = async (page) => page.evaluate(() => {
    for (const el of document.querySelectorAll('[data-edit^="setting:"]')) {
        if ((el.textContent ?? '').trim().length > 8) {
            return el.getAttribute('data-edit').replace('setting:', '');
        }
    }

    return null;
});

test('a visitor gets the site and none of the editor', async ({ page }) => {
    await page.goto('/');
    await settled(page);

    const surface = await page.evaluate(() => ({
        marked: document.body.hasAttribute('data-admin'),
        overlay: Boolean([...document.querySelectorAll('*')].find((el) => el.shadowRoot?.querySelector('button'))),
        keys: /kbe_|kbs_/.test(document.documentElement.outerHTML),
        editable: document.querySelectorAll('[data-edit], [data-edit-img]').length,
    }));

    expect(surface.marked).toBe(false);
    expect(surface.overlay).toBe(false);
    expect(surface.keys, 'a key that can write reached a visitor').toBe(false);
    // Still fully marked: it simply has nothing to edit with.
    expect(surface.editable).toBeGreaterThan(0);
});

test('an editor arriving from their inbox can edit, and the key leaves the address bar', async ({ page, request }) => {
    const token = await session(request);

    await page.goto(`/#kb_session=${encodeURIComponent(token)}`);
    await settled(page);

    // URLs get pasted into chats and screenshots.
    expect(page.url()).not.toContain('kb_session');

    expect(await page.evaluate(() => document.body.hasAttribute('data-admin'))).toBe(true);
    expect(await page.evaluate(() =>
        Boolean([...document.querySelectorAll('*')].find((el) => el.shadowRoot?.querySelector('button'))))).toBe(true);
});

test('an editor sees their own unpublished work, and a visitor does not', async ({ page, browser, request }) => {
    // The seventh fault, and the one no unit test could see: the page read
    // with the publishable key, so the person who had just saved was handed
    // the same page every visitor gets.
    const token = await session(request);

    await page.goto('/');
    await settled(page);

    const key = await someKey(page);
    expect(key, 'no editable text found on this page').not.toBeNull();

    const words = `Held back ${Date.now()}`;
    const saved = await write(request, token, key, words);

    // With publishing on this is a draft; without it, it is already live and
    // there is nothing here to prove.
    test.skip(!saved.held, 'this site publishes on save, so nothing is held back');

    const editor = await browser.newPage();
    await editor.goto(`${process.env.BASE_URL}/#kb_session=${encodeURIComponent(token)}`);
    await settled(editor);
    await expect(editor.locator('body')).toContainText(words);
    await editor.close();

    const visitor = await browser.newPage();
    await visitor.goto(process.env.BASE_URL);
    await settled(visitor);
    await expect(visitor.locator('body')).not.toContainText(words);
    await visitor.close();
});

test('publishing shows it to everyone', async ({ page, browser, request }) => {
    const token = await session(request);

    await page.goto('/');
    await settled(page);

    const key = await someKey(page);
    const words = `Published ${Date.now()}`;

    await write(request, token, key, words);
    expect((await publish(request)).ok()).toBeTruthy();

    const visitor = await browser.newPage();
    await visitor.goto(process.env.BASE_URL);
    await settled(visitor);
    await expect(visitor.locator('body')).toContainText(words);
    await visitor.close();
});

test('the page keeps its own words when the service cannot be reached', async ({ page, context }) => {
    // The site belongs to its owner. A page must never depend on us being up.
    await page.goto('/');
    await settled(page);
    const before = await page.textContent('body');

    await context.route('**/api/live-edit/**', (route) => route.abort());
    await context.route('**/current.json', (route) => route.abort());

    const offline = await context.newPage();
    await offline.goto(process.env.BASE_URL);
    await offline.waitForTimeout(1500);

    expect((await offline.textContent('body')).length).toBeGreaterThan(before.length / 2);
    expect(await offline.evaluate(() => document.querySelectorAll('img').length)).toBeGreaterThan(0);
    await offline.close();
});
