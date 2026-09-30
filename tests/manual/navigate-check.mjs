import { chromium } from 'playwright';

/**
 * The navigate step, which the scope flags as the one most likely to fail.
 *
 * A client-side navigation does not reload the document. React unmounts the
 * tree and builds another, so anything derived at render time is derived again
 * from nothing - which is where an identity taken from a position, or held in
 * a variable, quietly becomes a different identity and somebody's edits land
 * on the wrong row.
 *
 * Asserted rather than assumed: a marker is set on `window` before navigating
 * and read afterwards. If it survives, the document was never reloaded and
 * this really was a client-side navigation. Without that check the whole test
 * passes trivially on a full page load, which is the failure mode of every
 * naive version of it.
 */
const EDITED = 'THE CLIENT EDITED THIS EXCERPT';
const ok = [];
const bad = [];
const check = (name, pass) => (pass ? ok : bad).push(name);

const browser = await chromium.launch();
const page = await browser.newPage();

try {
    await page.goto('http://localhost:4488/', { waitUntil: 'networkidle' });

    check('the edited words are on the first page', (await page.content()).includes(EDITED));

    // Survives a client-side navigation; does not survive a document load.
    await page.evaluate(() => { window.__stillTheSameDocument = true; });

    const link = page.locator('a[href^="/posts/"]').first();
    const href = await link.getAttribute('href');
    await link.click();
    await page.waitForURL(`**${href}`);
    await page.waitForLoadState('networkidle');

    check('the navigation was client-side, not a reload',
        await page.evaluate(() => window.__stillTheSameDocument === true));

    await page.goBack();
    await page.waitForLoadState('networkidle');

    check('it was still client-side coming back',
        await page.evaluate(() => window.__stillTheSameDocument === true));

    const after = await page.content();
    check('the edited words are still there after navigating away and back', after.includes(EDITED));

    // The one that would catch an identity derived afresh: the edited element
    // itself must not have reverted. Scoped to that element rather than to the
    // page - the hero post's excerpt is a different key that was never edited,
    // and a page-wide search for its words fails for the wrong reason.
    check('the edited element did not revert to its template copy',
        await page.locator('[data-edit="setting:auto:e736693bccf9"]').first().textContent() === EDITED);

    // And the marker must still name the same key, not a re-derived one.
    check('the key on the element did not move',
        after.includes('data-edit="setting:auto:e736693bccf9"'));
} catch (error) {
    bad.push(`threw: ${error.message.split('\n')[0]}`);
} finally {
    await browser.close();
}

ok.forEach((n) => console.log(`  PASS  ${n}`));
bad.forEach((n) => console.log(`  FAIL  ${n}`));
console.log(`\n${ok.length} passed, ${bad.length} failed`);
process.exit(bad.length ? 1 : 0);
