import { expect, test } from '@playwright/test';

/**
 * Replacing a picture, in a browser, all the way to the stored file.
 *
 * The arithmetic either side of this is covered: eight PHP tests compare actual
 * pixels out of the fitter, eleven JS tests cover the measuring and the
 * conversion. What neither can reach is the part a client touches - the panel
 * opening, the frame being dragged, the numbers surviving the trip - and that
 * was asserted by grepping the built bundle for a string, which is not a test.
 *
 * So this drives it. The page is deliberately the awkward case: a 1600x900
 * file laid out in an 800x450 box. Measuring the box would store 800 wide and
 * the client's own photograph would come out softer than the one it replaced,
 * which is the fault this feature exists to prevent and the one nobody notices
 * until they look.
 *
 *   KB_API=… KB_SITE=… KB_SECRET=kbs_… BASE_URL=http://127.0.0.1:8401 \
 *     npx playwright test tests/e2e/choosing-the-crop.spec.js
 */

const API = process.env.KB_API;
const SITE = process.env.KB_SITE;
const SECRET = process.env.KB_SECRET;

test.skip(!API || !SITE || !SECRET, 'Set KB_API, KB_SITE and KB_SECRET to walk this.');

// The console runs behind a development certificate locally.
test.use({ ignoreHTTPSErrors: true });

const session = async (request) => {
    const response = await request.post(`${API}/${SITE}/sessions`, {
        headers: { Authorization: `Bearer ${SECRET}` },
        data: {},
    });
    expect(response.ok(), 'could not mint an edit session').toBeTruthy();

    return (await response.json()).token;
};

const settled = async (page) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);
};

const asEditor = async (page, request) => {
    const token = await session(request);
    await page.goto(`/#kb_session=${token}`);
    await settled(page);

    if (!(await page.evaluate(() => document.body.classList.contains('editing')))) {
        await page.getByRole('button', { name: 'Edit site' }).click();
    }

    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
};

/** The intrinsic size of whatever the hero is showing now. */
const heroPixels = (page) => page.evaluate(async () => {
    const hero = document.querySelector('img.hero');
    if (!hero) return null;

    // Measured from a fresh load of the current address, so a cached decode of
    // the previous picture cannot answer for the new one.
    const shot = new Image();
    shot.src = `${hero.currentSrc || hero.src}${(hero.src.includes('?') ? '&' : '?')}measure=${Date.now()}`;
    await shot.decode().catch(() => {});

    return { width: shot.naturalWidth, height: shot.naturalHeight, src: hero.src };
});

test('the picture on the page is bigger than the box it sits in', async ({ page, request }) => {
    /*
     * The premise, checked rather than assumed. If the fixture ever stops
     * being the awkward case, every assertion below still passes and proves
     * nothing.
     */
    await asEditor(page, request);

    // Waited for rather than measured straight away: the applier swaps the
    // address after the page settles, and an image that has not finished
    // decoding reports a natural width of zero - which reads as a broken
    // picture rather than an unfinished one.
    await expect
        .poll(() => page.evaluate(() => document.querySelector('img.hero')?.naturalWidth ?? 0), { timeout: 15000 })
        .toBeGreaterThan(0);

    const laidOut = await page.evaluate(() => {
        const hero = document.querySelector('img.hero');

        return { box: hero.getBoundingClientRect().width, natural: hero.naturalWidth };
    });

    // The relationship rather than the number, because these tests leave the
    // site edited: a second run opens on the replacement, which is also wider
    // than its box, and the premise still holds.
    expect(laidOut.natural).toBeGreaterThan(0);
    expect(laidOut.box).toBeLessThan(laidOut.natural);
});

test('a replacement is stored at the size of the picture it replaced', async ({ page, request }) => {
    await asEditor(page, request);

    await page.locator('img.hero').click();
    await expect(page.locator('.le-drawer')).toBeVisible();

    await page.getByRole('button', { name: /Replace/ }).first().click();
    await page.getByRole('button', { name: 'Upload' }).click();

    // 2000x1200 going into a 16:9 spot, so the shape has to change and
    // something has to be cut.
    await page.locator('.le-scrim input[type=file]').setInputFiles('tests/e2e/fixtures/replacement.png');

    // The crop panel, which is the thing that had never been opened by a test.
    await expect(page.getByRole('button', { name: 'Use this part' })).toBeVisible();

    const frame = page.locator('.le-crop-frame');
    await expect(frame).toBeVisible();

    const started = await frame.boundingBox();

    /*
     * Dragged up, not sideways.
     *
     * The spot is 16:9 and the uploaded picture is 5:3, so the frame is as
     * wide as the picture and the only room it has is vertical. The first
     * version of this dragged horizontally against a frame that could not move
     * and reported the editor broken - which is the test being wrong about the
     * geometry, and worth leaving written down because the next person will
     * reach for a sideways drag too.
     */
    await page.mouse.move(started.x + started.width / 2, started.y + started.height / 2);
    await page.mouse.down();
    await page.mouse.move(started.x + started.width / 2, started.y + started.height / 2 - 120, { steps: 10 });
    await page.mouse.up();

    const moved = await frame.boundingBox();
    expect(moved.y, 'the frame did not move with the drag').toBeLessThan(started.y);

    await page.getByRole('button', { name: 'Use this part' }).click();

    // Staged, not saved. Said out loud since the page has already repainted.
    await expect(page.locator('.le-staged')).toHaveText(/preview/i);

    await page.getByRole('button', { name: 'Save changes' }).click();

    // The editor reloads the page after a save it cannot apply in place, so
    // anything measured here has to wait for that rather than race it.
    await page.waitForLoadState('load').catch(() => {});
    await settled(page);

    await expect
        .poll(async () => (await heroPixels(page))?.src ?? '', { timeout: 20000 })
        .not.toContain('hero.png');

    const stored = await heroPixels(page);

    /*
     * 1600x900: the size of the picture it replaced, not the 800x450 box and
     * not the 2000x1200 that was uploaded. Which is three things at once -
     * the measurement, the exact flag that stops it being doubled again, and
     * the crop taking the spot's shape.
     */
    expect(stored).toMatchObject({ width: 1600, height: 900 });
});

test('a visitor holding nothing sees the stored picture', async ({ browser, request }) => {
    /*
     * The other half of every save: a published picture reaching somebody with
     * no session, no cookie and no editor.
     *
     * Published first, deliberately. A save is held back until somebody says
     * it is ready, so a visitor seeing the new picture before that would be
     * the fault rather than the proof.
     */
    const published = await request.post(`${API}/${SITE}/publish`, {
        headers: { Authorization: `Bearer ${SECRET}` },
    });
    expect(published.ok(), 'could not publish').toBeTruthy();

    const visitor = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await visitor.newPage();

    await page.goto('/');
    await settled(page);

    const seen = await heroPixels(page);

    expect(seen.src).not.toContain('hero.png');
    expect(seen).toMatchObject({ width: 1600, height: 900 });

    await visitor.close();
});
