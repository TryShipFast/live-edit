import { expect, test } from '@playwright/test';

/*
 * What every live-edit site has to be true about itself.
 *
 * These are deliberately not about any one theme. Each case is an invariant
 * that broke on a real site and could not have been caught by testing the
 * runtime's functions on their own: a stylesheet that could not be read, a font
 * the browser refused, the host application's CSS landing on a bought template.
 * Point BASE_URL at a site running the editor and they apply.
 */

const LOGIN_PATH = process.env.LIVE_EDIT_LOGIN ?? '/dev-login';

/**
 * Open the panel on a piece of editable text, returning its key.
 *
 * Which element counts has to follow the same precedence the editor uses when
 * deciding what a click means: an image or a background inside the element
 * wins over its words, so the logo link opens the image panel rather than a
 * text box. Picking blindly tests the wrong thing.
 */
const openEditableText = async (page) => {
    const candidates = await page.evaluate(() =>
        [...document.querySelectorAll('[data-edit^="setting:"]')]
            .filter((element) => {
                if (element.closest('[data-style-edit], [data-edit-img], [data-edit-bg]')) return false;
                if (element.querySelector('[data-edit-img], [data-edit-bg]')) return false;

                return element.textContent.trim() !== '';
            })
            .map((element) => element.dataset.edit)
            .slice(0, 25)
    );

    // Themes fade sections in as you scroll, and lay headers over the things
    // beneath them, so plenty of these cannot actually be clicked. Rather than
    // reason about which, try them: the first that takes a real click is one a
    // client could have reached too.
    for (const key of candidates) {
        const target = page.locator(`[data-edit="${key}"]`).first();
        await target.scrollIntoViewIfNeeded().catch(() => {});
        if (!(await target.isVisible())) continue;

        try {
            await target.click({ timeout: 2500 });
        } catch {
            continue;
        }

        await expect(page.locator('.le-drawer.is-open')).toBeAttached();

        return key;
    }

    throw new Error('No editable text on this page was reachable.');
};

/** Sign in and switch editing on, the way a client does. */
const startEditing = async (page) => {
    await page.goto(LOGIN_PATH);
    await page.evaluate(() => sessionStorage.setItem('tb_editing', '1'));
    await page.goto('/');
    await page.waitForFunction(() => document.body.classList.contains('editing'), null, { timeout: 15000 });
};

test.describe('a site running the editor', () => {
    test.beforeEach(async ({ page }) => {
        // Themes animate: sections fade in, heroes drift. A click waits for its
        // target to hold still, and on a page that never stops moving it waits
        // forever. This is about the runner, not the site, so it is installed
        // for every navigation rather than written into any one case.
        await page.addInitScript(() => {
            const stop = () => {
                const style = document.createElement('style');
                style.textContent = '*,*::before,*::after{animation:none !important;transition:none !important}';
                document.head?.append(style);
            };
            if (document.head) stop();
            else document.addEventListener('DOMContentLoaded', stop, { once: true });
        });
    });

    /**
     * Whether this site is a scanned third-party theme rather than a bespoke
     * application. Auto keys say so: they are what the scanner writes when
     * nobody hand-authored the markup.
     */
    const isBoughtTheme = async (page) =>
        (await page.locator('[data-edit^="setting:auto:"]').count()) > 0;

    test('does not load the host application stylesheet over its theme', async ({ page }) => {
        // Tailwind's .collapse is visibility:collapse, and it landed on
        // Bootstrap's .collapse: the entire navigation disappeared. A theme
        // brings its own stylesheet; the editor styles itself at runtime.
        //
        // A bespoke application is the opposite case: its own stylesheet IS the
        // design, and it is supposed to be there.
        await page.goto('/');
        test.skip(!(await isBoughtTheme(page)), 'bespoke app: its stylesheet is its design');

        const hostSheets = await page.evaluate(() =>
            [...document.styleSheets].map((sheet) => sheet.href).filter((href) => /\/build\/assets\/.*\.css/.test(href ?? ''))
        );

        expect(hostSheets, 'the host app CSS must not be served onto a theme page').toEqual([]);
    });

    test('can read every stylesheet it loads', async ({ page }) => {
        // A sheet left on the vendor's server cannot be read, and the icon
        // picker takes its list from the theme's own CSS.
        await page.goto('/');
        test.skip(!(await isBoughtTheme(page)), 'bespoke app: it serves its own stylesheets');

        const unreadable = await page.evaluate(() =>
            [...document.styleSheets]
                .filter((sheet) => {
                    try {
                        return sheet.cssRules === null;
                    } catch {
                        return true;
                    }
                })
                .map((sheet) => sheet.href)
        );

        expect(unreadable, 'stylesheets must be served from this site').toEqual([]);
    });

    test('loads every font it asks for', async ({ page }) => {
        // A browser refuses a webfont from an origin that has not opted in, so
        // a hot-linked icon font renders as empty boxes however correct
        // everything else is.
        // Wait for the site to go quiet first: a single-process dev server
        // under a burst of asset requests can drop one, and a font that never
        // arrived is not the same finding as a font that was refused.
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);

        const failed = await page.evaluate(() =>
            [...document.fonts].filter((face) => face.status === 'error').map((face) => face.family)
        );

        expect(failed, 'fonts must be served from this site').toEqual([]);
    });

    test('serves every page its own navigation links to', async ({ page, request }) => {
        // A bought template is a set of pages. One that 404s on About is not a
        // site, whatever else works.
        await page.goto('/');

        const links = await page.evaluate(() =>
            [...new Set(
                [...document.querySelectorAll('a[href]')]
                    .map((a) => a.getAttribute('href'))
                    .filter((href) => /^[A-Za-z0-9._-]+\.html$/.test(href ?? ''))
            )].slice(0, 20)
        );

        for (const link of links) {
            const response = await request.get('/' + link);
            expect(response.status(), `${link} should be served`).toBe(200);
        }
    });

    test('keeps the editor panel free of the theme styling', async ({ page }) => {
        // The panel lives in a shadow root for this reason. Borrowing the
        // theme's stylesheet to render icons once dragged its uppercase,
        // letter-spaced buttons in with it.
        await startEditing(page);
        await openEditableText(page);

        const save = page.getByRole('button', { name: /save changes/i });
        const transform = await save.evaluate((node) => getComputedStyle(node).textTransform);

        expect(transform).toBe('none');
    });

    test('saves an edit and serves it back', async ({ page }) => {
        await startEditing(page);
        const key = await openEditableText(page);

        // Scoped to the panel: a theme has its own textareas (a contact form),
        // and an unscoped locator finds one of those first.
        const field = page.locator('.le-drawer textarea').first();
        await expect(field).toBeVisible();
        const original = await field.inputValue();
        const edited = `${original} (smoke)`;

        await field.fill(edited);
        await page.getByRole('button', { name: /save changes/i }).click();

        // The page reloads itself once the edit is stored.
        await expect(page.locator('body')).toContainText(edited, { timeout: 15000 });

        // Serve it fresh: the point is that it was stored, not that the DOM
        // still holds what was typed into it.
        await page.goto('/');
        await expect(page.locator('body')).toContainText(edited);

        // Put the theme's own words back, so running this leaves no trace.
        // By key, not by position: the edit may have changed what comes first.
        await startEditing(page);
        await page.locator(`[data-edit="${key}"]`).first().click();
        await page.locator('.le-drawer textarea').first().fill(original);
        await page.getByRole('button', { name: /save changes/i }).click();
        await expect(page.locator('body')).not.toContainText(edited, { timeout: 15000 });

        // Where the site holds edits back, both the change and the change back
        // are drafts. Leaving them would show a client a pile of pending work
        // that is only the test's, so they are thrown away; the published site
        // was never touched.
        await page.evaluate(async () => {
            if (!window.liveEditPublishing) return;
            await fetch('/live-edit/draft/discard', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.body.dataset.csrf, Accept: 'application/json' },
            });
        });
    });

    test('throws nothing while the client edits', async ({ page }) => {
        // A function was deleted by a careless edit and its caller left behind.
        // Editing carried on well enough to look fine, while backgrounds set in
        // the theme's stylesheet quietly stopped being editable at all. Nothing
        // asserted that the page was not throwing, so nothing said so.
        const thrown = [];
        page.on('pageerror', (error) => thrown.push(String(error).slice(0, 160)));

        await startEditing(page);
        await openEditableText(page);

        expect(thrown).toEqual([]);
    });

    test('never opens an empty box on words the page is showing', async ({ page }) => {
        // A counter shows a number the markup does not contain: its text is a
        // placeholder the theme's script replaces, so the panel offered an
        // empty box for a figure plainly on the page.
        //
        // Every element is checked rather than a handful, so this asks what the
        // panel WOULD show, by the same rule it uses, instead of opening each
        // one. The case above already opens one for real.
        await startEditing(page);

        const empties = await page.evaluate(() =>
            [...document.querySelectorAll('[data-edit^="setting:"]')]
                .filter((element) => {
                    if (element.closest('[data-style-edit], [data-edit-img], [data-edit-bg]')) return false;
                    if (element.querySelector('[data-edit-img], [data-edit-bg]')) return false;

                    // What the page DISPLAYS, not what the markup holds. A
                    // counter's own words are emptied by the script that draws
                    // it, so asking the markup skips the very case that broke.
                    const box = element.getBoundingClientRect();
                    if (element.textContent.trim() === '' || box.width < 2 || box.height < 2) return false;

                    // Ask the editor what it would show, rather than keeping a
                    // copy of its rule here and drifting from it.
                    return window.liveEditDisplayedValue(element).trim() === '';
                })
                .map((element) => ({
                    key: element.dataset.edit,
                    showing: element.textContent.replace(/\s+/g, ' ').trim().slice(0, 30),
                }))
        );

        expect(empties, 'these show words but would open an empty box').toEqual([]);
    });
});
