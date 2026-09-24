/**
 * Proves, against a real Next app, the thing that blocked the React adapter.
 *
 * Measured before any of this existed: a value written into the DOM is undone
 * by the next render and lost completely on a client-side navigation. A test
 * under a simulated DOM can show the provider holds state, but only a real
 * browser driving a real router can show that the edit is still there after
 * the page that rendered it has been unmounted and rebuilt.
 *
 *   cd kb-next-probe && npx next build && npx next start -p 8501
 *   node tools/react-nav-proof.mjs
 */
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://127.0.0.1:8501', { waitUntil: 'networkidle' });

const before = await page.textContent('h2[data-edit]');
console.log('1. rendered          :', before);

// The editor overlay would do exactly this.
const bridged = await page.evaluate(() => Boolean(window.__liveEditReact));
console.log('2. bridge present    :', bridged);

await page.evaluate(() => window.__liveEditReact.set('auto:e23b1bd8f86a', 'EDITED IN THE BROWSER'));
await page.waitForTimeout(100);
console.log('3. after edit        :', await page.textContent('h2[data-edit]'));

// A real client-side navigation: the page unmounts, the provider does not.
await page.click('a[href="/services"]');
await page.waitForSelector('h1');
console.log('4. navigated to      :', await page.textContent('h1'));
console.log('   full reload?      :', await page.evaluate(() => performance.getEntriesByType('navigation').length > 1 ? 'yes' : 'no'));

await page.click('a[href="/"]');
await page.waitForSelector('h2[data-edit]');
const after = await page.textContent('h2[data-edit]');
console.log('5. back home         :', after);

// And an untouched element is still its original self.
console.log('6. untouched element :', await page.textContent('p[data-edit]'));
console.log('7. page errors       :', errors.length === 0 ? 'none' : errors.join(' | '));

console.log(after === 'EDITED IN THE BROWSER' ? '\nPASS — the edit survived a client-side navigation' : '\nFAIL — the edit was lost');

await browser.close();
