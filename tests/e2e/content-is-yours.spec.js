import { expect, test } from '@playwright/test';

/*
 * Getting your content back, and getting an earlier version back.
 *
 * These are the two promises that decide whether a client can afford to depend
 * on this. Their words live on somebody else's server, so "what happens if you
 * disappear?" is the first serious question anybody asks, and "what happens if
 * I publish something wrong?" is the second.
 *
 * Both are checked against what a browser actually renders rather than against
 * the response: an export is only an export if the file opens and reads
 * correctly with nothing of ours left in it, and a restore is only a restore
 * if the page shows the old words again.
 *
 *   KB_API=… KB_SITE=… KB_SECRET=kbs_… BASE_URL=http://… \
 *   npx playwright test tests/e2e/content-is-yours.spec.js
 */

const API = process.env.KB_API;
const SITE = process.env.KB_SITE;
const SECRET = process.env.KB_SECRET;

test.skip(!API || !SITE || !SECRET, 'Set KB_API, KB_SITE and KB_SECRET to walk these.');

const asOwner = { Authorization: `Bearer ${SECRET}` };

const session = async (request) => (await (await request.post(`${API}/${SITE}/sessions`, { headers: asOwner, data: {} })).json()).token;

const write = async (request, token, key, value) => {
    const response = await request.post(`${API}/${SITE}/content`, {
        headers: { Authorization: `Bearer ${token}`, Origin: new URL(process.env.BASE_URL).origin },
        data: { key, value },
    });
    expect(response.ok(), 'the save was refused').toBeTruthy();
};

const publish = async (request) => {
    const response = await request.post(`${API}/${SITE}/publish`, { headers: asOwner });
    expect(response.ok(), 'publishing was refused').toBeTruthy();

    return await response.json();
};

const settled = async (page) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);
};

/**
 * What somebody arriving now would see.
 *
 * A fresh context rather than a reload, because published content is served
 * with a short max-age and a long stale window — deliberately, so a busy site
 * answers from its own cache and never waits on us. Reloading the same page
 * therefore reads what it already had, and a test doing that is measuring the
 * cache policy while believing it is measuring a publish.
 */
const asANewVisitor = async (browser, key) => {
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
    const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
    await page.goto('/');
    await settled(page);
    const words = await page.evaluate((k) => document.querySelector(`[data-edit="setting:${k}"]`)?.textContent.trim(), key);
    await page.context().close();

    return words;
};

/** A key on the page holding enough words to recognise. */
const someKey = (page) => page.evaluate(() => {
    for (const el of document.querySelectorAll('[data-edit^="setting:"]')) {
        if ((el.textContent ?? '').trim().length > 8) return el.getAttribute('data-edit').replace('setting:', '');
    }

    return null;
});

test('a client can take their content away in files that need nothing from us', async ({ page, request }) => {
    await page.goto('/');
    await settled(page);

    const key = await someKey(page);
    expect(key).not.toBeNull();

    const words = `Mine to take ${Date.now()}`;
    await write(request, await session(request), key, words);
    await publish(request);

    // Their own markup goes in; their words come back baked into it.
    const markup = await page.content();
    const response = await request.post(`${API}/${SITE}/export`, {
        headers: asOwner,
        data: { html: markup, page: 'index' },
    });
    expect(response.ok(), 'the export was refused').toBeTruthy();

    const exported = (await response.json()).html;

    // Opened as a file, with no service to call: this is the page after we are
    // gone, so nothing may depend on us being here.
    const offline = await page.context().newPage();
    await offline.route('**/*', (route) => (
        route.request().url().startsWith('data:') ? route.continue() : route.abort()
    ));
    await offline.setContent(exported, { waitUntil: 'domcontentloaded' });

    expect(await offline.evaluate(() => document.body.innerText)).toContain(words);

    // And nothing of ours left in it — no markers to explain, no script
    // pointing at a host that may no longer answer.
    expect(await offline.evaluate(() => ({
        markers: document.querySelectorAll('[data-edit], [data-edit-img], [data-style], [data-edit-list]').length,
        ours: [...document.querySelectorAll('script[src]')].filter((s) => /live-edit|\/s\//.test(s.getAttribute('src'))).length,
    }))).toEqual({ markers: 0, ours: 0 });
});

test('a client can put an earlier version back', async ({ page, browser, request }) => {
    await page.goto('/');
    await settled(page);

    const key = await someKey(page);
    expect(key).not.toBeNull();

    const first = `The version to come back to ${Date.now()}`;
    await write(request, await session(request), key, first);
    const keep = (await publish(request)).version;

    const second = `The version somebody regrets ${Date.now()}`;
    await write(request, await session(request), key, second);
    await publish(request);

    // What a visitor sees now, before anything is undone.
    expect(await asANewVisitor(browser, key)).toContain(second);

    const restored = await request.post(`${API}/${SITE}/restore`, { headers: asOwner, data: { version: keep } });
    expect(restored.ok(), 'the restore was refused').toBeTruthy();

    // Going back has to be visible to everyone, not merely recorded.
    expect(await asANewVisitor(browser, key)).toContain(first);
});
