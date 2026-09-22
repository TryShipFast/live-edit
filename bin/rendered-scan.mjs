#!/usr/bin/env node
/**
 * Renders a page in headless Chromium and reports it back as JSON:
 *   { target, html, backgrounds }
 *
 * `html` is the fully rendered DOM (so the PHP scanner sees real @foreach rows
 * and clean text, not Blade source), and `backgrounds` is every computed
 * background image — inline, utility class, or stylesheet rule alike.
 *
 * Usage: node rendered-scan.mjs <url|file>
 *
 * Requires Playwright (`@playwright/test` or `playwright`) in the host project.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { detectBackgrounds } from './detect-backgrounds.mjs';

const target = process.argv[2];
if (!target) {
    process.stderr.write('Usage: rendered-scan <url|file>\n');
    process.exit(2);
}

const { chromium } = await import('@playwright/test').catch(() => import('playwright'));

const browser = await chromium.launch();
const page = await browser.newPage();
try {
    if (/^https?:\/\//.test(target)) {
        await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
    } else {
        // Load a local file so relative stylesheets/assets resolve.
        await page.goto(pathToFileURL(target).href, { waitUntil: 'load', timeout: 30000 });
    }

    const backgrounds = await page.evaluate(detectBackgrounds);
    const html = await page.content();

    process.stdout.write(JSON.stringify({ target, html, backgrounds }));
} finally {
    await browser.close();
}
