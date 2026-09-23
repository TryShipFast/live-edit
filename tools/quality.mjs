/**
 * Scores a live-edit site against the quality model.
 *
 * The headline is the page-level one: a page counts as sound only if nothing
 * about it blocks a client from working. The per-dimension figures say where to
 * spend effort; the page rate says whether the engine is usable at all. A page
 * can be perfect on every dimension and still be broken — a stylesheet
 * collision that hides the navigation leaves every element detected, reachable,
 * truthful and persistent on a site nobody can use.
 */
import { chromium } from '../node_modules/playwright/index.mjs';

const SITES = JSON.parse(process.env.SITES);
const STILL = `*,*::before,*::after{animation:none!important;transition:none!important}`;

const measurePage = async (page, url) => {
    const thrown = [];
    const onError = (e) => thrown.push(String(e).slice(0, 120));
    page.on('pageerror', onError);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => document.body.classList.contains('editing'), null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1200);

    const m = await page.evaluate(() => {
        const editable = [...document.querySelectorAll('[data-edit],[data-edit-img],[data-edit-href],[data-edit-icon]')];
        const onScreen = editable.filter((e) => {
            const b = e.getBoundingClientRect();
            return b.width >= 2 && b.height >= 2 && getComputedStyle(e).visibility !== 'hidden';
        });

        // Reachable: a click at the element's middle has to land on it, not on
        // something laid over it.
        let reachable = 0;
        for (const e of onScreen) {
            const b = e.getBoundingClientRect();
            const x = b.x + b.width / 2, y = b.y + b.height / 2;
            if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { reachable++; continue; }
            const at = document.elementFromPoint(x, y);
            if (at && (e.contains(at) || at.contains(e))) reachable++;
        }

        // Truthful: what the panel would show for text that displays words.
        const texts = editable.filter((e) => e.matches('[data-edit^="setting:"]') && e.textContent.trim() !== '');
        const truthful = typeof window.liveEditDisplayedValue === 'function'
            ? texts.filter((e) => window.liveEditDisplayedValue(e).trim() !== '').length
            : null;

        const hostCss = [...document.styleSheets].filter((s) => /\/build\/assets\/.*\.css/.test(s.href ?? '')).length;
        const unreadable = [...document.styleSheets].filter((s) => { try { return s.cssRules === null } catch { return true } }).length;
        const badFonts = [...document.fonts].filter((f) => f.status === 'error').length;

        return {
            editable: editable.length, onScreen: onScreen.length, reachable,
            texts: texts.length, truthful, hostCss, unreadable, badFonts,
            links: [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
                .filter((h) => /^[A-Za-z0-9._-]+\.html$/.test(h ?? '')))].slice(0, 12),
        };
    });

    page.off('pageerror', onError);
    return { ...m, thrown };
};

const browser = await chromium.launch();
const report = [];

for (const site of SITES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript((css) => {
        const stop = () => { const s = document.createElement('style'); s.textContent = css; document.head?.append(s); };
        if (document.head) stop(); else document.addEventListener('DOMContentLoaded', stop, { once: true });
    }, STILL);
    const page = await context.newPage();

    await page.goto(site.base + site.login, { timeout: 30000 }).catch(() => {});
    await page.evaluate(() => sessionStorage.setItem('tb_editing', '1'));

    for (const path of site.pages) {
        try {
            const m = await measurePage(page, site.base + path);
            const broken = [];
            for (const link of m.links) {
                const r = await page.request.get(site.base + '/' + link).catch(() => null);
                if (!r || r.status() !== 200) broken.push(link);
            }
            report.push({ site: site.name, path, ...m, broken });
            process.stdout.write('.');
        } catch (e) {
            report.push({ site: site.name, path, failed: String(e).split('\n')[0].slice(0, 60) });
            process.stdout.write('x');
        }
    }
    await context.close();
}
await browser.close();
console.log('');
console.log(JSON.stringify(report));
