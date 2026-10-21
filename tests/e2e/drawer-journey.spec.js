import { expect, test } from '@playwright/test';

/*
 * Every way of changing something, done the way a client does it.
 *
 * The journey that already existed drives the API directly. That is why it
 * caught nothing on the day nine faults surfaced: every one of them lived
 * between the drawer and the page. The drawer offered to paste an image URL
 * and the endpoint only read a file. It offered alt text and read it from an
 * attribute nothing set, so saving wiped the description. It offered a
 * background and there was no endpoint at all. In each case the request the
 * test made was not the request the editor makes.
 *
 * So these click. Open the panel on a real element, change it the way the
 * person would, save, and look at the page afterwards — because "the page
 * shows it" is the only definition of working that a client recognises, and
 * every fault today reported success while failing it.
 *
 *   KB_API=… KB_SITE=… KB_SECRET=kbs_… BASE_URL=http://… \
 *   npx playwright test tests/e2e/drawer-journey.spec.js
 */

const API = process.env.KB_API;
const SITE = process.env.KB_SITE;
const SECRET = process.env.KB_SECRET;

test.skip(!API || !SITE || !SECRET, 'Set KB_API, KB_SITE and KB_SECRET to walk the journey.');

/* --------------------------------- arriving -------------------------------- */

const session = async (request) => {
    const response = await request.post(`${API}/${SITE}/sessions`, {
        headers: { Authorization: `Bearer ${SECRET}` },
        data: {},
    });
    expect(response.ok(), 'could not mint an edit session').toBeTruthy();

    return (await response.json()).token;
};

/** Arrive as somebody who followed the link in their inbox, and start editing. */
const asEditor = async (page, request, path = '/') => {
    const token = await session(request);
    await page.goto(`${path}#kb_session=${token}`);
    await settled(page);

    // Editing is a mode, and a client turns it on from the toolbar.
    if (!(await page.evaluate(() => document.body.classList.contains('editing')))) {
        await page.getByRole('button', { name: 'Edit site' }).click();
    }

    await expect.poll(() => page.evaluate(() => document.body.classList.contains('editing'))).toBe(true);
};

const settled = async (page) => {
    // Templates can keep a carousel/media request open indefinitely; the
    // editor's own state is what matters here, not network quiescence.
    await page.waitForLoadState('domcontentloaded');
    // The applier runs after the document is ready and one fetch has returned.
    await page.waitForTimeout(1200);
};

/**
 * The panel, and only the panel.
 *
 * The host page has its own textareas and colour inputs — a contact form, a
 * newsletter box — and an unscoped locator picks whichever comes first in the
 * document. The first version of this test filled the site's own newsletter
 * field, saved nothing, and reported a fault in the editor.
 */
const panel = (page) => page.locator('.le-drawer');

/** Open the panel on an element, the way a client does: by clicking it. */
const openDrawer = async (page, selector) => {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await element.click({ force: true });
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
};

/**
 * Save, then load the page again before looking at it.
 *
 * The panel previews a change as you make it, so the page can show the new
 * colour while nothing has been stored at all — which is how a broken save
 * passes for a working one. Removing the style route entirely still passed
 * this suite until the reload was added: the request threw, the alert was
 * dismissed, and the preview was still on screen.
 *
 * After a reload only what was actually stored can be showing.
 */
const save = async (page) => {
    await page.getByRole('button', { name: 'Save changes' }).click();
    await settled(page);
    await page.reload();
    await settled(page);
};

/** Whatever the page is showing for a marked element, after it has settled. */
const shown = (page, selector, attribute = null) => page.evaluate(
    ([sel, attr]) => {
        const el = document.querySelector(sel);
        if (!el) return null;

        return attr ? el.getAttribute(attr) : (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    },
    [selector, attribute],
);

/* ---------------------------------- words ---------------------------------- */

test('words changed in the panel are on the page afterwards', async ({ page, request }) => {
    await asEditor(page, request);

    const key = await page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-edit^="setting:"]')) {
            if ((el.textContent ?? '').trim().length > 8) return el.getAttribute('data-edit');
        }

        return null;
    });
    expect(key, 'no editable words on this page').not.toBeNull();

    const words = `Checked by the journey ${Date.now()}`;
    await openDrawer(page, `[data-edit="${key}"]`);
    await panel(page).locator('textarea').first().fill(words);
    await save(page);

    expect(await shown(page, `[data-edit="${key}"]`)).toContain(words);
});

test('returns to the selected text field after checking Changes', async ({ page, request }) => {
    await asEditor(page, request);

    const key = await page.evaluate(() => {
        const element = [...document.querySelectorAll('[data-edit^="setting:"]')]
            .find((candidate) => (candidate.textContent ?? '').trim().length > 8);

        return element?.getAttribute('data-edit') ?? null;
    });
    expect(key, 'no editable words on this page').not.toBeNull();

    await openDrawer(page, `[data-edit="${key}"]`);
    const input = panel(page).locator('textarea').first();
    const original = await input.inputValue();
    await panel(page).locator('.le-tab[data-tab="Changes"]').click();
    await panel(page).locator('.le-tab[data-tab="Edit"]').click();

    await expect(panel(page).locator('textarea').first()).toHaveValue(original);
});

test('history shows twenty recent versions and pages older ones', async ({ page, request }) => {
    await asEditor(page, request);

    const key = await page.evaluate(() => document.querySelector('[data-edit^="setting:"]')?.getAttribute('data-edit') ?? null);
    expect(key).not.toBeNull();
    await openDrawer(page, `[data-edit="${key}"]`);

    await page.route('**/api/live-edit/v1/*/versions*', (route) => {
        const pageNumber = Number(new URL(route.request().url()).searchParams.get('page') ?? 1);
        const allVersions = Array.from({ length: 25 }, (_, index) => ({
            number: 25 - index,
            changes: 1,
            published_at: new Date(Date.now() - index * 60_000).toISOString(),
            url: `/v${25 - index}.json`,
        }));
        const versions = allVersions.slice((pageNumber - 1) * 20, pageNumber * 20);

        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                current: 25,
                pointer: '/current.json',
                pagination: { page: pageNumber, per_page: 20, total: 25, last_page: 2 },
                versions,
            }),
        });
    });

    await panel(page).locator('.le-tab[data-tab="History"]').click();
    await expect(panel(page).locator('.le-version')).toHaveCount(20);
    await expect(panel(page).locator('.le-pagination')).toContainText('Page 1 of 2');
    await panel(page).locator('.le-pagination button', { hasText: 'Older' }).click();
    await expect(panel(page).locator('.le-version')).toHaveCount(5);
    await expect(panel(page).locator('.le-pagination')).toContainText('Page 2 of 2');
});

test('an edit does not take the picture beside it', async ({ page, request }) => {
    // Replacing an element's whole contents to change its words destroyed a
    // picture floated inside a paragraph, and the markup that held it was gone
    // from the page afterwards — nothing to recover it from.
    await asEditor(page, request);

    const key = await page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-edit^="setting:"]')) {
            if (el.querySelector('img, svg')) return el.getAttribute('data-edit');
        }

        return null;
    });
    test.skip(!key, 'no editable words wrap a picture on this page');

    await openDrawer(page, `[data-edit="${key}"]`);
    await panel(page).locator('textarea').first().fill(`Words around a picture ${Date.now()}`);
    await save(page);

    expect(await page.locator(`[data-edit="${key}"] img, [data-edit="${key}"] svg`).count()).toBeGreaterThan(0);
});

/* --------------------------------- pictures -------------------------------- */

test('a picture pasted as a URL is the one the page shows', async ({ page, request }) => {
    // The panel offered "or paste an image URL" and the endpoint read only a
    // file, so this answered "the file field is required".
    await asEditor(page, request);

    const marker = await page.evaluate(() => document.querySelector('[data-edit-img]')?.getAttribute('data-edit-img') ?? null);
    test.skip(!marker, 'no editable picture on this page');

    const picture = `[data-edit-img="${marker}"]`;
    const read = () => page.evaluate((sel) => {
        const marked = document.querySelector(sel);
        const img = marked.tagName.toLowerCase() === 'img'
            ? marked
            : marked.querySelector('img') ?? marked.parentElement.querySelector('img');

        return { src: img?.getAttribute('src') ?? null, loaded: img?.naturalWidth > 0 };
    }, picture);

    const before = await read();

    // A picture the site already serves, so the test needs nothing outside it
    // — and one it is not already showing, or a save that does nothing would
    // pass. These cases share one site's stored content, so a second run
    // starts where the first left off.
    const replacement = await page.evaluate((current) => {
        const sources = [...document.querySelectorAll('img')]
            .map((img) => img.src)
            .filter((src) => src && !src.endsWith(String(current ?? '')));

        return sources[sources.length - 1] ?? null;
    }, before.src);
    test.skip(!replacement, 'the page has no second picture to swap in');

    await openDrawer(page, picture);
    await panel(page).locator('input[type=url]').first().fill(replacement);
    await save(page);

    const after = await read();

    expect(after.src, 'the picture on the page did not change').not.toBe(before.src);
    expect(after.src).toContain(replacement.split('/').pop());
    expect(after.loaded, 'the page points at a picture that does not load').toBe(true);
});

test('a description is saved, shown back, and not wiped by the next save', async ({ page, request }) => {
    // The fields read an attribute only one kind of host ever set, so they
    // opened empty everywhere else — and an empty field is sent on save, which
    // silently erased the description of the picture being edited.
    await asEditor(page, request);

    const marker = await page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-edit-img^="setting:"]')) {
            return el.getAttribute('data-edit-img');
        }

        return null;
    });
    test.skip(!marker, 'no editable picture with a description on this page');

    const description = `A picture described at ${Date.now()}`;
    await openDrawer(page, `[data-edit-img="${marker}"]`);
    await panel(page).locator('input[data-img-attr=alt]').first().fill(description);
    await save(page);

    const picture = `[data-edit-img="${marker}"]`;
    expect(await page.evaluate((sel) => {
        const marked = document.querySelector(sel);
        const img = marked.tagName.toLowerCase() === 'img' ? marked : marked.querySelector('img') ?? marked.parentElement.querySelector('img');

        return img?.getAttribute('alt');
    }, picture)).toBe(description);

    // Reopening must show it back, or the next save sends an empty field over
    // the top of it.
    await openDrawer(page, picture);
    await expect(panel(page).locator('input[data-img-attr=alt]').first()).toHaveValue(description);
});

/* ---------------------------------- icons ---------------------------------- */

test('an icon swapped in the panel is the one on the page', async ({ page, request }) => {
    await asEditor(page, request);

    const marker = await page.evaluate(() => document.querySelector('[data-edit-icon]')?.getAttribute('data-edit-icon') ?? null);
    test.skip(!marker, 'no editable icon on this page');

    const before = await shown(page, `[data-edit-icon="${marker}"]`, 'class');

    await openDrawer(page, `[data-edit-icon="${marker}"]`);
    const choices = panel(page).locator('.le-icon');
    test.skip(await choices.count() < 2, 'the theme offers no other icon');
    await choices.nth(1).click();
    await save(page);

    expect(await shown(page, `[data-edit-icon="${marker}"]`, 'class')).not.toBe(before);
});

/* --------------------------------- styling --------------------------------- */

test('a colour chosen in the panel is the colour on the page', async ({ page, request }) => {
    // There was no endpoint for this at all: the reading half had been built,
    // so a style set on a server-rendered page reached a static site perfectly
    // well and somebody editing that static site could not set one.
    await asEditor(page, request);

    // The style controls live in the panel of the element you click, and what
    // they offer depends on the element — a heading is given its text colour,
    // a section its background. So the test takes whichever colour it is
    // offered and checks the property that colour drives.
    const key = await page.evaluate(() => document.querySelector('[data-edit][data-style][data-style-props]')?.getAttribute('data-style') ?? null);
    test.skip(!key, 'nothing clickable on this page is styleable');

    await openDrawer(page, `[data-style="${key}"]`);

    const colour = panel(page).locator('input[type=color][data-style-prop]').first();
    test.skip(await colour.count() === 0, 'the panel offers no colour for this element');

    const prop = await colour.getAttribute('data-style-prop');
    const drives = { textColor: 'color', background: 'backgroundColor' }[prop];
    test.skip(!drives, `no rule for what ${prop} should change`);

    // Each colour is paired with a "use the theme's own" checkbox, which has
    // to be off for the choice to count.
    const useDefault = panel(page).locator(`input[type=checkbox][data-style-prop="${prop}"], input[type=color][data-style-prop="${prop}"] ~ input[type=checkbox]`).first();
    if (await useDefault.count() && await useDefault.isChecked()) await useDefault.uncheck();

    await colour.fill('#0a1f44');
    await save(page);

    expect(await page.evaluate(
        ([sel, css]) => getComputedStyle(document.querySelector(sel))[css],
        [`[data-style="${key}"]`, drives],
    )).toBe('rgb(10, 31, 68)');
});

test('the panel never offers a control the site cannot honour', async ({ page, request }) => {
    // An element names every prop it might allow and the site decides which of
    // those it supports. The panel drew a control for each name regardless, so
    // a client could pick a background image, be told it saved, and see
    // nothing change with no way to tell why.
    await asEditor(page, request);

    const key = await page.evaluate(() => document.querySelector('[data-edit][data-style-props]')?.getAttribute('data-style') ?? null);
    test.skip(!key, 'nothing clickable on this page is styleable');

    await openDrawer(page, `[data-style="${key}"]`);

    const offered = await panel(page).locator('[data-style-prop]').evaluateAll((nodes) => nodes.map((n) => n.dataset.styleProp));
    const supported = await page.evaluate(() => Object.keys(window.liveEditStyleProps ?? {}));

    test.skip(supported.length === 0, 'this site does not publish what it supports');
    expect(offered.filter((prop) => !supported.includes(prop))).toEqual([]);
});

/* ------------------------- when a save does not land ------------------------ */

test('the client is told when a save does not reach the page', async ({ page, request }) => {
    // The failure every fault today had in common: the request succeeded, the
    // value really was stored, and the page showed the old version. Nobody
    // files a bug for that — they stop believing the tool.
    await asEditor(page, request);

    const key = await page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-edit^="setting:"]')) {
            if ((el.textContent ?? '').trim().length > 8) return el.getAttribute('data-edit');
        }

        return null;
    });
    expect(key).not.toBeNull();

    // A server that accepts the write and drops it, which is what a policy
    // refusal, a mis-scoped key and a stale cache all looked like from here.
    await page.route(`${API}/${SITE}/content`, async (route) => {
        if (route.request().method() !== 'POST') return route.continue();

        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ saved: true, key: 'ignored', held: true }),
        });
    });

    await openDrawer(page, `[data-edit="${key}"]`);
    await panel(page).locator('textarea').first().fill(`This will be dropped ${Date.now()}`);
    await page.getByRole('button', { name: 'Save changes' }).click();

    // Two appear: the save's own "Saved", then the check disagreeing with it.
    await expect(page.locator('.le-toast', { hasText: /still showing the old version/i }))
        .toBeVisible({ timeout: 15000 });
});


/* -------------------------- making it live, and lists ------------------------- */

test('a client can put their own work live, and a visitor sees it', async ({ page, browser, request }) => {
    // The whole point of holding edits back. If the person who made the
    // change cannot release it, the draft is a trap rather than a safety net —
    // and on a site this application does not render there was no button and
    // no ability behind it, so a client could edit for ever and never go live.
    await asEditor(page, request);

    const key = await page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-edit^="setting:"]')) {
            if ((el.textContent ?? '').trim().length > 8) return el.getAttribute('data-edit');
        }

        return null;
    });
    expect(key).not.toBeNull();

    const words = `Live for everyone ${Date.now()}`;
    await openDrawer(page, `[data-edit="${key}"]`);
    await panel(page).locator('textarea').first().fill(words);
    await save(page);

    // Whether there is a step between saving and being live is the site's
    // choice; that a client can get there without one is not.
    const waiting = await page.evaluate(() => window.liveEditPublishing?.pending ?? 0);
    const publish = page.getByRole('button', { name: /^Publish/ });

    if (waiting > 0) {
        await expect(publish, 'work is waiting and there is no way to release it').toBeVisible();
        await expect(publish).toBeEnabled();
        /*
         * Putting work live asks first, as it should - and what it asks with
         * is a list of what is about to become public, not a confirm box.
         *
         * This waited for a window.confirm, which the editor stopped using
         * when the question changed from "publish 3 changes?" to "publish
         * these three?". Nobody can answer a number. So the test sat waiting
         * for a dialog that was never coming, published nothing, and reported
         * that a client's work never reached a visitor - a stale test wearing
         * the costume of a broken product.
         */
        await publish.click();
        await page.getByRole('button', { name: 'Publish now' }).click();

        /*
         * Waited for, not timed. A fixed pause raced the publish and the
         * visitor opened on the previous run's words, which the test read as a
         * publish that never reached anybody.
         *
         * UNRESOLVED, and left failing rather than quietly relaxed. Driven by
         * hand the same sequence publishes correctly - POST /publish answers
         * 200, the pending count falls to zero and the new words are in the
         * published content a moment later - so the product path is covered.
         * What this cannot do is get there after saving first, and the
         * difference between the two is not yet understood.
         *
         * A test that is failing for a reason nobody has found is worth more
         * than one adjusted until it passes.
         */
        await expect
            .poll(() => page.evaluate(() => window.liveEditPublishing?.pending ?? -1), { timeout: 20000 })
            .toBe(0);

        await settled(page);
    }

    // A visitor, who reads the published files and holds no key at all.
    /*
     * A context made by hand, so the config's own options do not reach it.
     *
     * `use` in playwright.config.js applies to the page and context fixtures and
     * not to browser.newContext(), which takes the defaults. Against a site behind
     * a development certificate that means the visitor's page cannot load the
     * runtime at all - and the test reports that a published change never reached
     * a visitor, which is a fault in the harness wearing the costume of a fault in
     * the product.
     */
    const visitor = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
    await visitor.goto('/');
    await settled(visitor);

    expect(await shown(visitor, `[data-edit="${key}"]`)).toContain(words);
});

test('an item added to a list is on the page, and can be taken off again', async ({ page, request }) => {
    await asEditor(page, request);

    // A list a client can actually reach. The controls live in the panel of an
    // item, so something inside one has to open on a click. Links open their
    // text and destination fields in edit mode; dropdown triggers keep opening
    // their menus so those items remain reachable too.
    const list = await page.evaluate(() => {
        const opens = (el) => el && el.tagName !== 'A';
        const visible = (el) => {
            const rect = el.getBoundingClientRect();

            return rect.width > 0 && rect.height > 0 && el.getClientRects().length > 0;
        };

        for (const candidate of document.querySelectorAll('[data-edit-list]')) {
            const items = [...candidate.children].filter((child) => child.dataset.editItem);
            const openable = items.some((item) => visible(item) && (
                (item.matches('[data-edit]') && opens(item))
                || opens(item.querySelector('[data-edit], [data-edit-icon], [data-edit-img]'))
            ));

            // Exercise a visible page collection whose empty state can be
            // reached from its surrounding styleable section. Navigation
            // menus contain collections too, but they are a separate UI path.
            if (items.length > 0 && openable
                && !candidate.closest('header, nav, footer, .mega, .menu')
                && candidate.parentElement?.closest('[data-style]')) {
                return candidate.getAttribute('data-edit-list');
            }
        }

        return null;
    });
    test.skip(!list, 'no list on this page has an item a client can open');

    const items = `[data-edit-list="${list}"] > [data-edit-item]`;
    const count = () => page.locator(items).count();
    const before = await count();
    console.log(`Collection journey: ${list}; starting items: ${before}`);

    const openItem = async (which) => {
        const item = page.locator(which).first();
        const inner = item.locator(':is([data-edit], [data-edit-icon], [data-edit-img]):not(a)').first();
        const target = await inner.count() ? inner : item;
        await target.scrollIntoViewIfNeeded();
        await target.click({ force: true });
        await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
    };

    await openItem(items);
    await panel(page).getByRole('button', { name: /Add another|Add item/ }).click();
    await settled(page);
    await page.reload();
    await settled(page);

    const afterAdd = await count();
    console.log(`Collection journey: ${list}; items after add: ${afterAdd}`);
    expect(afterAdd, 'the new item is not on the page').toBe(before + 1);

    // And off again, so the suite leaves the site as it found it.
    await openItem(`${items}:last-child`);
    page.once('dialog', (d) => d.accept());
    await panel(page).getByRole('button', { name: /Delete this item/ }).click();
    await settled(page);
    await page.reload();
    await settled(page);

    expect(await count(), 'the item could not be taken off again').toBe(before);

    // A customer may remove the final row. It should leave an empty list they
    // can still manage from the surrounding section, and the source markup
    // should provide the seed when they add the first row back.
    while (await count() > 0) {
        await openItem(`${items}:first-child`);
        page.once('dialog', (d) => d.accept());
        await panel(page).getByRole('button', { name: /Delete this item/ }).click();
        await settled(page);
        await page.reload();
        await settled(page);
    }

    expect(await count(), 'the final item could not be removed').toBe(0);

    const managerKey = await page.locator(`[data-edit-list="${list}"]`).evaluate((node) => {
        const manager = node.parentElement?.closest('[data-style]');

        return manager ? [...document.querySelectorAll('[data-style]')].indexOf(manager) : null;
    });
    expect(managerKey, 'no surrounding content can open the empty list manager').not.toBeNull();
    await page.locator('[data-style]').nth(managerKey).click({ force: true });
    await panel(page).getByRole('button', { name: /Manage .*\(0\)/ }).click();
    await panel(page).getByRole('button', { name: /Add item/ }).click();
    await settled(page);
    await page.reload();
    await settled(page);

    expect(await count(), 'an empty collection could not be rebuilt from its template').toBe(1);
});


/* ------------------------- the editor is a guest here ------------------------ */

test('the panel looks like itself, not like the site it is on', async ({ page, request }) => {
    // A rule in the page that MATCHES the host element beats a :host rule —
    // that is the cascade, not a bug — and almost every bought template ships
    // a reset like "html, body, div, span, … { font: inherit }", which matches
    // the div the shadow root is attached to. Every inheritable property then
    // crossed the boundary, and the panel wore the site's typeface: Merriweather
    // on one theme, something else on the next, none of them ours.
    await asEditor(page, request);

    const key = await page.evaluate(() => document.querySelector('[data-edit^="setting:"]')?.getAttribute('data-edit') ?? null);
    expect(key).not.toBeNull();
    await openDrawer(page, `[data-edit="${key}"]`);

    const seen = await page.evaluate(() => {
        const host = document.getElementById('live-edit-ui');
        const drawer = host.shadowRoot.querySelector('.le-drawer');
        const title = host.shadowRoot.querySelector('.le-title');

        return {
            page: getComputedStyle(document.body).fontFamily,
            drawer: getComputedStyle(drawer).fontFamily,
            title: getComputedStyle(title).fontFamily,
            drawerSize: getComputedStyle(drawer).fontSize,
        };
    });

    // Its own stack, whatever the site is using.
    expect(seen.drawer).toContain('ui-sans-serif');
    expect(seen.title).toContain('ui-sans-serif');
    expect(seen.drawerSize).toBe('14px');

    // And where the site uses something else, the two must not agree — which
    // is the whole point, and is what silently stopped being true.
    if (!seen.page.includes('ui-sans-serif')) {
        expect(seen.drawer, 'the panel is wearing the site\'s typeface').not.toBe(seen.page);
    }
});

/* ------------------------------ and the visitor ----------------------------- */

test('a visitor is shown the published site and none of the editing', async ({ page, browser, request }) => {
    await asEditor(page, request);

    const visitor = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
    await visitor.goto('/');
    await settled(visitor);

    expect(await visitor.evaluate(() => ({
        editor: document.body.hasAttribute('data-admin'),
        panel: !!document.querySelector('.le-toast, .le-drawer'),
        editing: document.body.classList.contains('editing'),
    }))).toEqual({ editor: false, panel: false, editing: false });
});
