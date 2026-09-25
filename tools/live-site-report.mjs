/**
 * What this site would actually do with an editor on it — measured in a
 * browser, on the page as it really renders.
 *
 * Fetching the HTML and reading it is measuring the wrong page. On the sites
 * that matter — a bought theme, a page builder, anything with a slider — most
 * of what a visitor sees does not exist until scripts have run, images have
 * been swapped in on scroll, and the builder has finished assembling its
 * markup. An editor lives in that page, not in the one the server sent, so
 * that is the page to ask about.
 *
 * Three questions, in the order they cost money:
 *
 *   how much could a client change            — visible immediately if wrong
 *   will their edits stay attached            — invisible until weeks later
 *   what else on this page fights the editor  — the reason for workarounds
 *
 * The middle one is the one to care about. A missed heading is a complaint.
 * A key that moves is a client's work quietly reverting to the theme's own
 * words, long after anybody connects it to a change they made.
 *
 *   node tools/live-site-report.mjs https://example.com
 *   node tools/live-site-report.mjs https://example.com --save=report.json
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const [, , target, ...rest] = process.argv;

if (!target) {
    console.error('Usage: node tools/live-site-report.mjs <url> [--save=report.json]');
    process.exit(1);
}

const options = Object.fromEntries(
    rest.map((a) => a.replace(/^--/, '').split('=')).map(([k, v = true]) => [k, v]),
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

/*
 * Watching before the page settles, not after.
 *
 * A theme that writes its own text on load is the single most common reason a
 * saved edit does not stick: we put the client's words in, and something else
 * puts the theme's back a moment later. That can only be seen by being there
 * when it happens.
 */
await page.addInitScript(() => {
    window.__rewrites = { text: 0, images: 0, examples: [] };

    const record = (kind, note) => {
        window.__rewrites[kind]++;
        if (window.__rewrites.examples.length < 6) window.__rewrites.examples.push(note);
    };

    new MutationObserver((records) => {
        for (const r of records) {
            if (r.type === 'characterData') {
                record('text', (r.target.textContent ?? '').trim().slice(0, 40));
            }
            if (r.type === 'attributes' && (r.attributeName === 'src' || r.attributeName === 'srcset')) {
                record('images', `${r.attributeName} on <${r.target.tagName.toLowerCase()}>`);
            }
        }
    }).observe(document.documentElement, {
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['src', 'srcset', 'style'],
    });
});

console.log(`\n${target}\n${'='.repeat(Math.min(target.length, 72))}\n`);

await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForLoadState('networkidle').catch(() => {});

// Everything a visitor would cause: reveal animations, lazy images, anything
// that waits for the viewport.
await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
});
await page.waitForTimeout(1500);

const rendered = await page.content();
const runtime = await page.evaluate(() => {
    const visible = (el) => {
        const s = getComputedStyle(el);

        return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().width > 0;
    };

    const images = [...document.querySelectorAll('img')];

    return {
        rewrites: window.__rewrites,
        images: {
            total: images.length,
            unresolved: images.filter((i) => !i.currentSrc && !i.getAttribute('src')).length,
            background: [...document.querySelectorAll('*')].filter((el) => {
                const bg = getComputedStyle(el).backgroundImage;

                return bg && bg !== 'none' && bg.includes('url(');
            }).length,
        },
        // A page can hold markup nothing can reach: inside a shadow root, or
        // in another document entirely.
        shadowRoots: [...document.querySelectorAll('*')].filter((e) => e.shadowRoot).length,
        iframes: document.querySelectorAll('iframe').length,
        hidden: [...document.querySelectorAll('h1,h2,h3,p,span,a,button')].filter((el) => !visible(el)).length,
        words: document.body.innerText.replace(/\s+/g, ' ').trim().length,
    };
});

await browser.close();

/* The scanner's own opinion, on the page as it renders. */
const analysis = JSON.parse(execFileSync('php', ['tools/site-report.php', '-', '--json'], {
    input: rendered,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
}));

/* --------------------------------- saying it -------------------------------- */

const pct = analysis.reachable.percent;
console.log('REACHABLE');
console.log(`  ${pct}% of the words on the rendered page could be changed`);
console.log(`  ${analysis.found.text ?? 0} text, ${analysis.images.marked} of ${analysis.images.onPage} images, `
    + `${analysis.found.link ?? 0} links, ${analysis.found.icon ?? 0} icons`);
if (runtime.hidden > 0) {
    console.log(`  ${runtime.hidden} element(s) are in the markup but not visible — menus, modals, tabs`);
}

console.log('\nWILL THE CONTENT STAY ATTACHED');
console.log("  Edits are saved against a name derived from where the element sits.");
console.log('  If the page changes shape, the name changes and the words come loose.\n');
for (const [label, r] of Object.entries(analysis.stability)) {
    const mark = r.percent >= 95 ? 'ok  ' : r.percent >= 70 ? 'some' : 'BAD ';
    console.log(`  [${mark}] ${label.padEnd(34)} ${String(r.percent).padStart(3)}% of ${r.of} keys survive`);
}

console.log('\nWHAT FIGHTS THE EDITOR');
const { rewrites } = runtime;
if (rewrites.text > 0 || rewrites.images > 0) {
    console.log(`  the page rewrites itself after load: ${rewrites.text} text change(s), ${rewrites.images} image swap(s)`);
    console.log('    our content is applied once; whatever runs after it wins');
    for (const e of rewrites.examples) console.log(`    e.g. ${e}`);
} else {
    console.log('  nothing rewrites the page after load');
}
if (runtime.images.background > 0) {
    console.log(`  ${runtime.images.background} element(s) draw a picture from CSS rather than an <img>`);
}
if (runtime.images.unresolved > 0) {
    console.log(`  ${runtime.images.unresolved} image(s) never resolved a source, even after scrolling`);
}
if (runtime.shadowRoots > 0) {
    console.log(`  ${runtime.shadowRoots} shadow root(s) — markup the scanner cannot see into`);
}
if (runtime.iframes > 0) {
    console.log(`  ${runtime.iframes} iframe(s) — a separate document, not editable from here`);
}
if (analysis.risks?.builder) {
    console.log(`  built with ${analysis.risks.builder.join(', ')}`);
    console.log('    the builder regenerates this markup from its own store, so an edit');
    console.log('    made here and one made there are two answers to the same question');
}

console.log('');

if (options.save) {
    writeFileSync(String(options.save), JSON.stringify({ target, ...analysis, runtime }, null, 2));
    console.log(`written to ${options.save}\n`);
}
