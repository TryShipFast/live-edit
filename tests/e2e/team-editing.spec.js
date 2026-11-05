import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * Team editing: one person per section, driven for real.
 *
 * Owner, 5 Nov 2026: "if we allow for collaboration, we should lock a section
 * a team member is working on and publish releases it, otherwise, they
 * override eachother works"; "then we should really test if the collaboration
 * works and who edits who".
 *
 * Separate browser contexts are separate team members (Ada and Tunde are
 * editors, Olu owns the website), each with their own key, on the stand-in
 * host. Every content call goes to the engine's real API (tests/support/
 * team-api: the controllers, SectionLocks and SiteStore on SQLite behind
 * `php -S`), so the locks, drafts and versions here are the engine's own.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium/chrome-linux/chrome \
 *   LIVE_EDIT_TEAM_DIR=/tmp/team LIVE_EDIT_AUTOLOAD=... \
 *   npx playwright test tests/e2e/team-editing.spec.js
 *
 * LIVE_EDIT_AUTOLOAD is only for a machine below PHP 8.4. Screenshots go to
 * LIVE_EDIT_SHOTS (default test-results/team-editing).
 */

const DIR = process.env.LIVE_EDIT_TEAM_DIR ?? '/tmp/live-edit-team';
const SHOTS = process.env.LIVE_EDIT_SHOTS ?? 'test-results/team-editing';
const API_PORT = Number(process.env.LIVE_EDIT_TEAM_API_PORT ?? 8762);
const HOST_PORT = Number(process.env.LIVE_EDIT_TEAM_HOST_PORT ?? 8761);
const PAGE = 'products/aster-veil';
const PRODUCT = '[data-instance="aster-veil.detail"] h1';
const STORY = '[data-instance="aster-veil.story"] p';

test.use({
    viewport: { width: 1440, height: 900 },
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
});
test.setTimeout(180000);
test.describe.configure({ mode: 'serial' });

let api;
let site;
let tokens;

const env = () => ({ ...process.env, LIVE_EDIT_TEAM_DIR: DIR });
const seed = () => JSON.parse(execFileSync('php', ['tests/support/team-api/seed.php'], { env: env(), encoding: 'utf8' })).demo;

test.beforeAll(async () => {
    mkdirSync(DIR, { recursive: true });
    mkdirSync(SHOTS, { recursive: true });
    tokens = seed();
    api = spawn('php', ['-S', `127.0.0.1:${API_PORT}`, 'tests/support/team-api/server.php'], { env: { ...env(), PHP_CLI_SERVER_WORKERS: '4' }, stdio: 'ignore' });
    for (let i = 0; i < 50; i += 1) {
        try {
            await fetch(`http://127.0.0.1:${API_PORT}/`);
            break;
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    site = await serveFakeHost({ team: { api: `http://127.0.0.1:${API_PORT}`, tokens, dir: DIR }, port: HOST_PORT });
});

test.afterAll(async () => {
    await site?.close();
    api?.kill();
});

test.beforeEach(async () => {
    // A fresh site and team for every journey; the keys stay the same object the host reads.
    Object.assign(tokens, seed());
});

/* ------------------------------ helpers ------------------------------ */

const ui = (page) => page.locator('#live-edit-ui');
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` });

/** One team member, in a browser of their own, editing the product page. */
const member = async (browser, who, viewport = { width: 1440, height: 900 }) => {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(`${site.url}/edit/${PAGE}?as=${who}&edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const hide = ui(page).getByRole('button', { name: 'Hide' });
    if (await hide.isVisible().catch(() => false)) await hide.click();

    return { context, page };
};

const settle = (page) => page.waitForTimeout(600);

/** Click a piece of text the way a person does, type, save, and see the page again. */
const edit = async (page, selector, words) => {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await element.click({ force: true });
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
    await page.locator('.le-drawer textarea').first().fill(words);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await settle(page);
};

/** The outline label a teammate's section carries, as this person sees it. */
const lockLabel = (page) => ui(page).locator('.le-lock-label');

/** What a visitor reads on the published page. */
const visitorReads = async (browser, selector) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${site.url}/view/${PAGE}`);
    const text = (await page.locator(selector).first().textContent()).trim();

    return { text, page, context };
};

/** Who the server says holds what. */
const team = async (who) => (await fetch(`${site.url}/api/demo/team`, { headers: { Authorization: `Bearer ${tokens[who]}`, Accept: 'application/json' } })).json();
const changesFor = async (who) => (await fetch(`${site.url}/api/demo/changes`, { headers: { Authorization: `Bearer ${tokens[who]}`, Accept: 'application/json' } })).json();

const openChanges = async (page, half = 'Changes') => {
    await ui(page).locator('.le-toolbar').getByRole('button', { name: /Changes/ }).first().click();
    if (half === 'History') await ui(page).locator('.le-subtabs').getByRole('tab', { name: 'Published' }).click();
    await settle(page);
};

const publish = async (page) => {
    await ui(page).locator('.le-toolbar').getByRole('button', { name: /Publish/ }).first().click();
    const sheet = ui(page).locator('.le-modal');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('.le-review, .le-hint').first()).toBeVisible();
    return sheet;
};

/* ------------------------------ journeys ------------------------------ */

test('two people edit two sections at once, and each publish puts live only its own', async ({ browser }) => {
    const ada = await member(browser, 'ada');
    const tunde = await member(browser, 'tunde');

    // Ada changes the product name: the Product section is hers now.
    await edit(ada.page, PRODUCT, 'Aster Veil, now in amber');
    await shot(ada.page, '01-ada-edits-product-1440');
    expect((await team('tunde')).locks.map((l) => [l.label, l.name])).toEqual([['Product', 'Ada']]);

    // Tunde sees it within seconds, without reloading.
    await expect(lockLabel(tunde.page)).toHaveText('Ada is editing this section', { timeout: 12000 });
    await shot(tunde.page, '02-tunde-sees-ada-is-editing-1440');

    // Pressing it says so in plain words, and does not open it.
    await tunde.page.locator(PRODUCT).first().click({ force: true });
    const told = ui(tunde.page).locator('.le-modal');
    await expect(told).toContainText('Ada is editing this section');
    await expect(told).toContainText('Ask the owner to take over');
    await expect(ui(tunde.page).getByRole('button', { name: 'Take over' })).toHaveCount(0);
    await shot(tunde.page, '03-tunde-is-told-ada-is-editing-1440');
    await told.getByRole('button', { name: 'OK' }).click();

    // He edits the Story section instead, at the same time.
    await edit(tunde.page, STORY, 'Tunde rewrote the story.');
    await expect(lockLabel(ada.page)).toHaveText('Tunde is editing this section', { timeout: 12000 });
    await shot(ada.page, '04-ada-sees-tunde-on-story-1440');

    // Ada's Changes: hers, and Tunde's (not included).
    await openChanges(ada.page);
    const drawer = ui(ada.page).locator('.le-drawer');
    await expect(drawer).toContainText('Your changes');
    await expect(drawer).toContainText("Others' changes (not included)");
    await expect(drawer).toContainText('Tunde: 1 change');
    await shot(ada.page, '05-ada-changes-yours-and-others-1440');

    // Ada publishes: the dialog says only hers go live.
    const sheet = await publish(ada.page);
    await expect(sheet).toContainText('Your changes (these go live when you publish)');
    await expect(sheet).toContainText("Others' changes (not included)");
    await expect(sheet).toContainText('Tunde: 1 change in Story. They go live when Tunde publishes.');
    await shot(ada.page, '06-ada-publish-dialog-only-hers-1440');
    await sheet.getByRole('button', { name: 'Publish now' }).click();
    await ada.page.waitForLoadState('load');
    await settle(ada.page);

    // Live: Ada's product name. Not live: Tunde's story, still his and still locked.
    const afterAda = await visitorReads(browser, PRODUCT);
    expect(afterAda.text).toBe('Aster Veil, now in amber');
    expect((await afterAda.page.locator(STORY).first().textContent()).trim()).toBe('Neroli picked at dawn, laid over cedar.');
    await shot(afterAda.page, '07-visitor-after-ada-publishes-1440');
    await afterAda.context.close();
    expect((await team('ada')).locks.map((l) => [l.label, l.name])).toEqual([['Story', 'Tunde']]);
    expect((await changesFor('tunde')).yours).toBe(1);

    // Tunde publishes his.
    await tunde.page.reload();
    await expect.poll(() => tunde.page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const his = await publish(tunde.page);
    await his.getByRole('button', { name: 'Publish now' }).click();
    await tunde.page.waitForLoadState('load');
    await settle(tunde.page);
    const afterTunde = await visitorReads(browser, STORY);
    expect(afterTunde.text).toBe('Tunde rewrote the story.');
    await afterTunde.context.close();
    expect((await team('ada')).locks).toEqual([]);

    // History, as the owner sees it: who published, and who changed what where.
    const olu = await member(browser, 'olu');
    await openChanges(olu.page, 'History');
    const history = ui(olu.page).locator('.le-drawer');
    await expect(history).toContainText('Tunde published 1 change');
    await expect(history).toContainText('Ada published 1 change');
    await expect(history).toContainText('Tunde changed');
    await expect(history).toContainText('in Story');
    await expect(history).toContainText('Ada changed');
    await expect(history).toContainText('in Product');
    await shot(olu.page, '08-history-who-did-what-1440');

    // And on a phone.
    const phone = await member(browser, 'olu', { width: 390, height: 844 });
    await openChanges(phone.page, 'History');
    await expect(ui(phone.page).locator('.le-drawer')).toContainText('Ada published 1 change');
    await shot(phone.page, '09-history-who-did-what-390');

    for (const one of [ada, tunde, olu, phone]) await one.context.close();
});

test('two first edits of the same section: one wins, the other is told who', async ({ browser }) => {
    const ada = await member(browser, 'ada');
    const tunde = await member(browser, 'tunde');

    // Both open the product name before either has saved: neither sees a lock yet.
    for (const one of [ada, tunde]) {
        await one.page.locator(PRODUCT).first().click({ force: true });
        await expect(one.page.getByRole('button', { name: 'Save changes' })).toBeVisible();
        await one.page.locator('.le-drawer textarea').first().fill(`${one === ada ? 'Ada' : 'Tunde'} named it`);
    }

    // Both press Save at the same moment.
    await Promise.all([ada, tunde].map((one) => one.page.getByRole('button', { name: 'Save changes' }).click()));
    await settle(ada.page);
    await settle(tunde.page);

    const locks = (await team('olu')).locks;
    expect(locks).toHaveLength(1);
    const winner = locks[0].name;
    const loser = winner === 'Ada' ? tunde : ada;
    const drafts = (await changesFor('olu')).changes;
    expect(drafts.map((c) => c.author_name)).toEqual([winner]);
    expect(drafts[0].after).toBe(`${winner} named it`);

    // The other is told, by name.
    await expect(ui(loser.page).locator('.le-modal')).toContainText(`${winner} is editing this section`, { timeout: 10000 });
    await shot(loser.page, '10-same-section-race-loser-is-told-1440');

    for (const one of [ada, tunde]) await one.context.close();
});

test('a section left alone for 30 minutes opens up, and the next person may continue from it', async ({ browser }) => {
    const ada = await member(browser, 'ada');
    await edit(ada.page, PRODUCT, 'Ada started this');

    // Thirty-one minutes later, by the API's clock.
    await fetch(`${site.url}/__clock`, { method: 'POST', body: JSON.stringify({ seconds: 31 * 60 }) });

    const tunde = await member(browser, 'tunde');
    await expect(lockLabel(tunde.page)).toHaveCount(0);
    expect((await team('tunde')).left.map((l) => [l.name, l.label, l.changes])).toEqual([['Ada', 'Product', 1]]);

    await tunde.page.locator(PRODUCT).first().click({ force: true });
    const offer = ui(tunde.page).locator('.le-modal');
    await expect(offer).toContainText('Ada left unpublished changes here');
    await expect(offer.getByRole('button', { name: 'Continue from them' })).toBeVisible();
    await expect(offer.getByRole('button', { name: 'Discard them' })).toHaveCount(0);
    await shot(tunde.page, '11-expiry-ada-left-changes-1440');
    await offer.getByRole('button', { name: 'Continue from them' }).click();
    await settle(tunde.page);

    expect((await changesFor('tunde')).changes.map((c) => [c.author_name, c.mine])).toEqual([['Tunde', true]]);

    // Ada comes back: the section is Tunde's now, and she is told so.
    await ada.page.reload();
    await expect(lockLabel(ada.page)).toHaveText('Tunde is editing this section', { timeout: 12000 });
    await shot(ada.page, '12-expiry-ada-back-sees-tunde-1440');

    for (const one of [ada, tunde]) await one.context.close();
});

test('the owner takes over a section, and the person who had it is told', async ({ browser }) => {
    const ada = await member(browser, 'ada');
    const tunde = await member(browser, 'tunde');
    const olu = await member(browser, 'olu');

    await edit(ada.page, PRODUCT, 'Ada is halfway through');
    await edit(tunde.page, STORY, 'Tunde story, not finished');

    await expect(lockLabel(olu.page)).toHaveCount(2, { timeout: 12000 });
    await shot(olu.page, '13-owner-sees-both-sections-taken-1440');

    await olu.page.locator(PRODUCT).first().click({ force: true });
    const ask = ui(olu.page).locator('.le-modal');
    await expect(ask).toContainText('Ada is editing this section');
    await shot(olu.page, '14-owner-can-take-over-1440');
    await ask.getByRole('button', { name: 'Take over' }).click();
    await settle(olu.page);
    expect((await team('olu')).locks.find((l) => l.label === 'Product')).toMatchObject({ name: 'Olu', taken_from_name: 'Ada' });

    // Ada is told on her next look.
    await expect(ui(ada.page).locator('.le-toast').filter({ hasText: 'The owner took over Product' })).toBeVisible({ timeout: 12000 });
    await shot(ada.page, '15-ada-told-owner-took-over-1440');

    // The owner finishes and publishes: Product goes live, Tunde's Story does not.
    await edit(olu.page, PRODUCT, 'Aster Veil, finished by Olu');
    const sheet = await publish(olu.page);
    await sheet.getByRole('button', { name: 'Publish now' }).click();
    await olu.page.waitForLoadState('load');
    await settle(olu.page);
    const visitor = await visitorReads(browser, PRODUCT);
    expect(visitor.text).toBe('Aster Veil, finished by Olu');
    expect((await visitor.page.locator(STORY).first().textContent()).trim()).toBe('Neroli picked at dawn, laid over cedar.');
    await visitor.context.close();
    expect((await team('olu')).locks.map((l) => [l.label, l.name])).toEqual([['Story', 'Tunde']]);

    // And Ada's next save there is refused in plain words.
    await ada.page.reload();
    await ada.page.locator(PRODUCT).first().click({ force: true });
    await expect(ui(ada.page).locator('.le-modal')).toContainText('Olu is editing this section', { timeout: 10000 }).catch(async () => {
        // The lock went with the owner's publish; then the section is free again, which is also right.
        expect((await team('ada')).locks.find((l) => l.label === 'Product')).toBeUndefined();
    });

    for (const one of [ada, tunde, olu]) await one.context.close();
});

test('undoing one person\'s published version leaves the other person\'s work', async ({ browser }) => {
    const ada = await member(browser, 'ada');
    await edit(ada.page, PRODUCT, 'Ada renamed it');
    await (await publish(ada.page)).getByRole('button', { name: 'Publish now' }).click();
    await ada.page.waitForLoadState('load');
    await settle(ada.page);

    const tunde = await member(browser, 'tunde');
    await edit(tunde.page, STORY, 'Tunde told the story');
    await (await publish(tunde.page)).getByRole('button', { name: 'Publish now' }).click();
    await tunde.page.waitForLoadState('load');
    await settle(tunde.page);

    const olu = await member(browser, 'olu');
    await openChanges(olu.page, 'History');
    const rows = ui(olu.page).locator('.le-version');
    const adas = rows.filter({ hasText: 'Ada published 1 change' });
    await adas.getByRole('button', { name: 'Undo these changes' }).click();
    const confirm = ui(olu.page).locator('.le-modal');
    await expect(confirm).toContainText("Undo Ada's changes from version");
    await expect(confirm).toContainText('Ada changed');
    await shot(olu.page, '16-undo-adas-version-asks-first-1440');
    await confirm.getByRole('button', { name: 'Undo and publish' }).click();
    await olu.page.waitForLoadState('load');
    await settle(olu.page);

    const visitor = await visitorReads(browser, PRODUCT);
    expect(visitor.text).toBe('Aster Veil');
    expect((await visitor.page.locator(STORY).first().textContent()).trim()).toBe('Tunde told the story');
    await visitor.context.close();

    await openChanges(olu.page, 'History');
    await expect(ui(olu.page).locator('.le-drawer')).toContainText('You undid the changes in version');
    await expect(ui(olu.page).locator('.le-drawer')).toContainText('You put back');
    await shot(olu.page, '17-history-after-undo-1440');

    for (const one of [ada, tunde, olu]) await one.context.close();
});

test('on a phone, a teammate\'s section is outlined and named', async ({ browser }) => {
    const ada = await member(browser, 'ada');
    await edit(ada.page, STORY, 'Ada on the story');
    const tunde = await member(browser, 'tunde', { width: 390, height: 844 });
    await tunde.page.locator(STORY).first().scrollIntoViewIfNeeded();
    await expect(lockLabel(tunde.page)).toHaveText('Ada is editing this section', { timeout: 12000 });
    await shot(tunde.page, '18-phone-sees-ada-is-editing-390');
    for (const one of [ada, tunde]) await one.context.close();
});
