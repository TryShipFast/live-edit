import { expect, test } from '@playwright/test';

/*
 * Signing in to edit a site you have no account on, start to finish.
 *
 * The one journey that crosses both halves of the product: a person lands on
 * the customer's website, is sent to us to prove who they are, and comes back
 * able to edit — with the words still living in the customer's own database
 * and their site never seeing a password.
 *
 * Written because the flow was declared working twice on weaker evidence. A
 * session token was minted, so sign-in "worked"; a POST returned a redirect,
 * so https "worked". Neither showed anybody actually getting back to the site
 * able to edit it, which is the only claim worth making. This starts from a
 * browser with no cookies and ends by checking the site itself.
 *
 *   SIGNIN_SITE=https://learnkasts.test SIGNIN_EMAIL=… SIGNIN_PASSWORD=… \
 *   npx playwright test tests/e2e/signing-in-with-us.spec.js
 */

const SITE = process.env.SIGNIN_SITE;
const EMAIL = process.env.SIGNIN_EMAIL;
const PASSWORD = process.env.SIGNIN_PASSWORD;
const PAGE = process.env.SIGNIN_PAGE || '/about';

test.skip(!SITE || !EMAIL || !PASSWORD, 'Set SIGNIN_SITE, SIGNIN_EMAIL and SIGNIN_PASSWORD to walk the sign-in.');

// Local hosts are served with certificates nothing trusts, and both ends of
// this journey are on one.
test.use({ ignoreHTTPSErrors: true });

test.describe.configure({ mode: 'serial' });

// Two hosts, a form, and a chain of hand-overs between them. That is several
// more round trips than a normal test and needs the room.
test.setTimeout(90_000);

/**
 * What the middleware leaves behind, which only an editor ever sees.
 *
 * Waits for the document first: the hand-over is a chain of navigations, and
 * reading the body in the middle of one finds no body at all.
 */
const editorState = async (page) => {
    await page.waitForLoadState('domcontentloaded');

    return page.evaluate(() => ({
        marked: document.body?.hasAttribute('data-admin') ?? false,
        tagged: document.querySelectorAll('[data-edit]').length,
    }));
};

test('a visitor is sent to us, signs in, and comes back able to edit', async ({ page }) => {
    // No cookies, no session, nobody signed in anywhere.
    await page.goto(`${SITE}/live-edit/enter?to=${encodeURIComponent(PAGE)}`);

    // The doorway sends them to the service. Not to a form on their own site:
    // a password typed there would either cross origins or pass through the
    // customer's server, and it does neither.
    await page.waitForURL(/\/live-edit\/sign-in/, { timeout: 20000 });
    expect(new URL(page.url()).host, 'sign-in must be served by the service').not.toContain(
        new URL(SITE).host,
    );
    await expect(page.getByRole('heading', { name: 'Sign in to edit' })).toBeVisible();

    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    /*
     * Back on the customer's site, at the page they asked for. This is the
     * step that was never actually watched before.
     *
     * Polled rather than waited on: the hand-over is three navigations that
     * complete in well under a second, so waitForURL starts listening after
     * the one it wants has already happened and then waits out its timeout
     * on a page that is already correct.
     */
    await expect.poll(() => page.url(), { timeout: 20000 }).toContain(PAGE);
    expect(new URL(page.url()).host).toBe(new URL(SITE).host);

    // And the session is not left lying in the address bar, where a shared
    // link or a screenshot would carry it.
    expect(page.url()).not.toContain('kb_session');

    const state = await editorState(page);
    expect(state.marked, 'the site does not recognise the editor').toBe(true);
    expect(state.tagged, 'nothing is editable').toBeGreaterThan(5);

    /*
     * And it holds while they move around.
     *
     * Checked here rather than in a test of its own: each test gets a fresh
     * browser context, so a second test would start with no cookies and
     * prove only that a stranger cannot edit — which is a different claim,
     * already covered below. A session that worked on the landing page and
     * nowhere else would have to be re-established on every click.
     */
    await page.goto(`${SITE}/`);
    expect((await editorState(page)).marked, 'the session did not survive a page change').toBe(true);
});

test('the wrong password gets nowhere, and says nothing useful about why', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    try {
        await page.goto(`${SITE}/live-edit/enter`);
        await page.waitForURL(/\/live-edit\/sign-in/, { timeout: 20000 });

        await page.getByLabel('Email').fill(EMAIL);
        await page.getByLabel('Password').fill('not-the-password');
        await page.getByRole('button', { name: 'Sign in' }).click();

        /*
         * Stand down if the limiter has already been spent.
         *
         * Wrong passwords are exactly what the throttle counts, so this test
         * can arrive to find itself locked out by an earlier run. Skipping
         * says that plainly; asserting anyway would produce a failure about
         * rate limiting dressed up as a failure about error messages.
         */
        if ((await page.content()).includes('rate_limit_error')) {
            test.skip(true, 'the sign-in limiter is still cooling down from an earlier run');
        }

        const message = page.getByRole('alert');
        await expect(message).toBeVisible({ timeout: 15000 });

        // One message for every kind of failure. Naming which half was wrong
        // turns this into a way to ask whose addresses are real.
        await expect(message).toHaveText(/do not match an editor of this site/i);

        await page.goto(`${SITE}${PAGE}`);
        expect((await editorState(page)).marked, 'a failed sign-in still let somebody in').toBe(false);
    } finally {
        await context.close();
    }
});

/*
 * Not tested here: the guessing limit.
 *
 * It works — eight wrong passwords in a row get a rate_limit_error — but a
 * test that spends the limit leaves the next run of this file starting
 * throttled, and a suite that fails depending on how recently it last ran is
 * worse than one that leaves a gap. The throttle is middleware on the route;
 * exercise it there rather than through a browser.
 */
