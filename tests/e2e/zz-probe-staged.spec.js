import { expect, test } from '@playwright/test';

/**
 * Does a pending change appear without anybody typing?
 *
 * Driven the way a person does it: through the door, through the sign-in form,
 * and then nothing. No element is clicked, no drawer is opened, nothing is
 * typed. Every write to the service is recorded from before the first
 * navigation, so whatever stages a change has to show up here.
 */
test.use({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } });

const EMAIL = process.env.KB_EMAIL;
const PASSWORD = process.env.KB_PASSWORD;

test.skip(!EMAIL || !PASSWORD, 'Set KB_EMAIL and KB_PASSWORD.');

test('what is pending after simply signing in', async ({ page }) => {
    const writes = [];

    page.on('request', (r) => {
        const url = r.url();
        if (r.method() !== 'GET' && /tryshipfast|live-edit/.test(url)) {
            writes.push(`${r.method()} ${url.replace('https://live.tryshipfast.com', '')} :: ${(r.postData() ?? '').slice(0, 160)}`);
        }
    });

    await page.goto('/?kb-enter=1');
    await page.waitForLoadState('load').catch(() => {});

    // The door hands off to the service's sign-in page.
    await page.waitForURL(/live-edit\/sign-in/, { timeout: 60000 });
    console.log(`\nsign-in page: ${page.url().slice(0, 120)}`);

    await page.getByLabel(/email|address/i).first().fill(EMAIL);
    await page.getByLabel(/password/i).first().fill(PASSWORD);
    await Promise.all([
        page.waitForURL((u) => !/live-edit\/sign-in/.test(u.toString()), { timeout: 60000 }),
        page.getByRole('button', { name: /sign in|continue/i }).first().click(),
    ]);

    console.log(`back on: ${page.url().slice(0, 100)}`);

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(15000);

    const state = await page.evaluate(() => {
        const ui = document.getElementById('live-edit-ui')?.shadowRoot;

        return {
            editing: document.body.classList.contains('editing'),
            editorMounted: Boolean(ui),
            tagged: document.querySelectorAll('[data-edit], [data-edit-img], [data-style]').length,
            publishLabel: ui?.querySelector('[data-publish], .le-publish')?.textContent?.trim() ?? null,
            chrome: [...(ui?.querySelectorAll('button') ?? [])].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 12),
        };
    });

    console.log('\n=== state after sign-in, nothing clicked ===');
    console.log(JSON.stringify(state, null, 2));
    console.log('\n=== every non-GET to the service ===');
    console.log(writes.length ? writes.join('\n') : '(none)');

    await page.screenshot({ path: 'test-results/after-signin.png', fullPage: false });

    expect(state.editing).toBe(true);
});
