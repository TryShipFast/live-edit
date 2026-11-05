import { expect, test } from '@playwright/test';
import { serveFakeHost } from '../support/fake-host-server.js';

/*
 * "Set up your shop" (help, 1 Nov 2026): a guide from how customers pay to where orders arrive.
 * Each step rings the real thing: a part of the Shop tab, a product card, the bar's dashboard mark.
 * On a phone the card stays on screen above the drawer's sheet, and moves to the top when it points
 * at the bar.
 *
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test tests/e2e/the-shop-guide-walks-setting-up-a-shop.spec.js
 */

test.use({ ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}) });

let site;
test.afterEach(async () => site?.close());

const ui = (page) => page.locator('#live-edit-ui');
const guide = (page) => ui(page).locator('.le-walkthrough:not(.le-help-menu)');
const ringed = (page) => page.evaluate(() => {
    const inShadow = document.querySelector('#live-edit-ui')?.shadowRoot?.querySelector('[data-live-edit-tour-focus]');
    const node = inShadow ?? document.querySelector('[data-live-edit-tour-focus]');
    return node ? { inEditor: Boolean(inShadow), text: node.textContent.trim().slice(0, 40), className: node.className, product: node.hasAttribute('data-kit-product') } : null;
});

const open = async (page, width) => {
    site = await serveFakeHost();
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.addInitScript(() => {
        window.liveEditShop = {
            checkout: { modes: [{ label: 'Pay online by card' }, { label: 'Order on WhatsApp', needs: ['a WhatsApp number'] }] },
            fields: [
                { kind: 'whatsapp', label: 'WhatsApp number', key: 'shop.whatsapp', value: 'https://wa.me/15550100' },
                { kind: 'rate', label: 'Delivery', key: 'shop.rate', value: '$8' },
            ],
            products: [{ name: 'Aster Veil', href: '/products/aster-veil/' }],
        };
        window.liveEditEditor = Object.assign(window.liveEditEditor ?? {}, { console: '/dashboard' });
    });
    await page.goto(`${site.url}/edit/shop?edit`);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
    const end = ui(page).locator('.le-walkthrough-end');
    if (await end.isVisible().catch(() => false)) await end.click();
    // on a phone, Help is in the More sheet
    if (width < 700) {
        await ui(page).getByRole('button', { name: 'More' }).click();
        await ui(page).locator('#le-more-sheet').getByRole('button', { name: 'Help', exact: true }).click();
    } else {
        await ui(page).getByRole('button', { name: 'Help with Live Edit' }).click();
    }
};
const next = (page) => guide(page).locator('.le-walkthrough-actions .le-btn').click();

test('a shop’s help starts with setting it up, and each step rings the real thing', async ({ page }) => {
    await open(page, 1400);
    const first = ui(page).locator('.le-help-group').first();
    await expect(first.locator('.le-help-option').first()).toContainText('Set up your shop');
    await first.locator('.le-help-option').first().click();

    await expect(guide(page)).toContainText('Step 1 of 10');
    await expect(guide(page)).toContainText('how customers pay');
    expect(await ringed(page)).toMatchObject({ inEditor: true, className: expect.stringContaining('le-shop-section'), text: expect.stringContaining('How customers pay') });

    await next(page);
    expect((await ringed(page)).text).toContain('WhatsApp number');
    await next(page);
    expect((await ringed(page)).text).toContain('Delivery');
    await next(page);
    await expect(guide(page)).toContainText('Make your first product yours');
    expect((await ringed(page)).product).toBe(true);

    for (let i = 0; i < 6; i += 1) await next(page);
    await expect(guide(page)).toContainText('Where your orders arrive');
    expect((await ringed(page)).className).toContain('le-mark');
    await expect(guide(page).locator('.le-walkthrough-actions .le-btn')).toHaveText('Done');
});

test('on a phone the guide stays on screen over the Shop tab, and gives way to the page', async ({ page }) => {
    await open(page, 390);
    await ui(page).locator('.le-help-option', { hasText: 'Set up your shop' }).click();
    await expect(guide(page)).toBeVisible();
    await expect(guide(page)).toBeInViewport();
    expect(await guide(page).evaluate((card) => card.getBoundingClientRect().top)).toBeLessThan(100);

    for (let i = 0; i < 3; i += 1) await next(page);
    await expect(guide(page)).toContainText('Make your first product yours');
    await expect(ui(page).locator('.le-drawer')).not.toHaveClass(/is-open/);
    expect((await ringed(page)).product).toBe(true);
});
