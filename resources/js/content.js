import { cleanSvg } from './svg.js';
import { ownTextOf, retrying } from './support.js';

/**
 * An error that remembers what the server said.
 *
 * Whether a request is worth repeating depends entirely on the status, and a
 * message with the number inside it is not something to parse back out.
 */
const failure = (message, status) => Object.assign(new Error(message), { status });

/**
 * Puts published content into a static page.
 *
 * A server-rendered site has something that can substitute words before the
 * page is sent. A file on a CDN does not — so without this, a static site can
 * be tagged, edited and published, and still show its original words forever.
 * The save works, the API holds the change, and the visitor sees nothing. That
 * was the gap that made "static sites are supported" untrue in the only way
 * that matters.
 *
 * Kept separate from the editor and deliberately small: every visitor loads
 * this, and almost none of them will ever edit anything.
 *
 *   <script>window.liveEditContent = { snapshot: 'https://cdn.example.com/content/sites/acme' }</script>
 *   <script type="module" src="/editor/content.js"></script>
 *
 * The snapshot is preferred over the API and needs no key, because published
 * content is what every visitor is being shown anyway. That is the whole point
 * of publishing to files: a busy site is served from an edge and never reaches
 * the application, so traffic costs its owner nothing and costs us nothing.
 * Reading through the API instead would have put every page view of every
 * customer back through one server.
 */

const PREFIX = 'setting:';

/**
 * What a value means depends on what is holding it.
 *
 * `keepRuns` is for the editor previewing a value as somebody types. A
 * half-typed sentence shares almost nothing with the one on the page, so the
 * rewrite path would collapse a sentence's runs of text on the very first
 * keystroke — and every keystroke after it would then be editing a sentence
 * that had already lost its shape. Keeping the empty runs in place means the
 * caller can put the original back and re-apply, so the preview is computed
 * from what the page said rather than from what the last keystroke left.
 */
/**
 * Swap a picture so it reads as a change rather than as a glitch.
 *
 * The page paints the picture in its own markup, then this applies the stored
 * one, so for a moment a visitor sees the old photograph and then the new one.
 * A customer reported it as "it loads old image then new one, especially when
 * you just replaced it" - which is exactly when the two differ most, and
 * exactly when somebody is looking.
 *
 * The source is still set in the same breath, because a save is checked by
 * reading this attribute straight afterwards and a deferred swap would be
 * reported as the page refusing to update. What is deferred is only the
 * opacity, so the browser cross-fades between two frames it already has.
 *
 * Only where a picture was already showing something else. On a first paint
 * there is nothing to fade from, and fading in from nothing would invent a
 * flicker on every page load to hide one that was not there.
 */
const swapPicture = (element, value) => {
    const showing = element.currentSrc || element.getAttribute('src') || '';
    const same = showing !== '' && new URL(showing, document.baseURI).href
        === new URL(value, document.baseURI).href;

    if (same) {
        return;
    }

    const wasShowing = showing !== '' && element.complete;

    element.setAttribute('src', value);

    if (!wasShowing) {
        return;
    }

    element.style.transition = 'opacity 120ms ease-out';
    element.style.opacity = '0';

    const settle = () => {
        element.style.opacity = '1';
        // Left behind, the inline transition would apply to anything the
        // theme later does with this element's opacity.
        setTimeout(() => {
            element.style.removeProperty('transition');
            element.style.removeProperty('opacity');
        }, 160);
    };

    // decode() rather than the load event: it resolves when the frame is ready
    // to paint, which is the moment the fade should end. Either way it settles
    // - a picture stuck invisible because its file 404s is the worst outcome
    // here, and far worse than the flash this replaces.
    if (element.decode) {
        element.decode().then(settle, settle);

        return;
    }

    element.addEventListener('load', settle, { once: true });
    element.addEventListener('error', settle, { once: true });
};

/**
 * Ask the browser for the pictures that are about to be applied.
 *
 * The gap this closes: the stored picture is not requested until its source is
 * set, so the fade above would be waiting on a network round trip. Warming
 * them as soon as the content arrives means the file is usually decoded by the
 * time anything is swapped, and the change is one frame rather than a wait.
 */
const warmPictures = (root, settings) => {
    for (const element of root.querySelectorAll('[data-edit-img]')) {
        const key = (element.getAttribute('data-edit-img') ?? '').replace(/^setting:/, '');
        const value = settings[key];

        if (typeof value !== 'string' || value === '') {
            continue;
        }

        const showing = element.currentSrc || element.getAttribute('src') || '';

        if (showing !== '' && new URL(showing, document.baseURI).href === new URL(value, document.baseURI).href) {
            continue;
        }

        // An Image rather than <link rel=preload>: it needs no cleanup, warms
        // the same cache, and cannot be left in the head of somebody's page.
        const warm = new Image();
        warm.decoding = 'async';
        warm.src = value;
    }
};

export const applyValue = (element, value, { keepRuns = false } = {}) => {
    const tag = element.tagName?.toLowerCase();

    if (tag === 'img') {
        swapPicture(element, value);
        clearTheSourcesAround(element);

        return;
    }

    if (tag === 'source') {
        element.setAttribute('srcset', value);

        return;
    }

    applyWords(element, value, keepRuns);
};

/**
 * Take away the responsive sources that would outrank a replaced picture.
 *
 * src is the last thing a browser consults: a srcset on the image beats it,
 * and a <source> in a surrounding <picture> beats both. Replacing a picture
 * and leaving those behind shows the client their new photograph in the
 * editor and the theme's original on the live site.
 *
 * The same rule, and the same removal, as the scanner applies server-side.
 * The repair path below has always known it; the two appliers did not, and a
 * rule one of them follows is a picture that changes on a static page and not
 * on a rendered one.
 */
const clearTheSourcesAround = (element) => {
    element.removeAttribute('srcset');
    // A description of an arrangement that no longer exists.
    element.removeAttribute('sizes');

    if (element.parentElement?.tagName !== 'PICTURE') {
        return;
    }

    // The children directly, rather than a ":scope >" query: the sources that
    // outrank this picture are its own siblings, and asking for them that way
    // keeps this the same walk the scanner does server-side.
    for (const child of [...element.parentElement.children]) {
        if (child.tagName === 'SOURCE') child.remove();
    }
};

/**
 * Put new words where the old ones were, leaving alone whatever else the
 * element holds.
 *
 * textContent, which this used to be, replaces the element's entire contents —
 * so a paragraph with a picture floated inside it lost the picture the first
 * time anybody corrected a typo, and a button written as
 * "<a data-edit><span>Book</span></a>" lost the span that carried its icon and
 * its classes. Neither is recoverable from the page afterwards.
 *
 * The server's applier has done it this way for a while. The two disagreeing
 * is worse than either: the same edit destroyed the picture in the browser and
 * kept it in an export.
 *
 * Text nodes only, never markup: published values come from an API, and
 * writing markup from a network response into a page is how a content service
 * becomes a way to run scripts on every visitor's browser.
 */
const applyWords = (element, value, keepRuns = false) => {
    const runs = [...element.childNodes].filter((node) => node.nodeType === TEXT_NODE);

    if (runs.length === 0) {
        // No words of its own. A wrapper around a single element that holds
        // them — the button above — is the one case where where they go is not
        // a guess; anything else is left alone rather than rearranged.
        const children = [...element.children];

        if (children.length === 1 && children[0].children.length === 0) {
            applyWords(children[0], value);

            return;
        }

        element.append(value);

        return;
    }

    if (runs.length === 1) {
        writeRun(runs[0], value);

        return;
    }

    /*
     * Words on both sides of something else.
     *
     * "We design for the <strong>street it stands on</strong>, not for a
     * photograph" is two runs of text with an element between them. Writing
     * the whole sentence into the first run and deleting the rest — which is
     * what this did — destroyed every word after the bold phrase and left the
     * phrase itself trailing the sentence. Silently: the page still read as a
     * sentence, just not theirs.
     *
     * So work out what actually changed, by matching the unchanged start and
     * the unchanged end against what was there, and write that back into
     * whichever run it belongs to. Correcting a typo or rewording a clause
     * leaves the bold phrase exactly where the designer put it, which is
     * nearly every edit anybody makes.
     */
    const olds = runs.map((node) => node.nodeValue);
    const before = olds.join('');

    let start = 0;

    while (start < before.length && start < value.length && before[start] === value[start]) {
        start += 1;
    }

    let end = 0;

    while (
        end < before.length - start
        && end < value.length - start
        && before[before.length - 1 - end] === value[value.length - 1 - end]
    ) {
        end += 1;
    }

    const from = start;
    const to = before.length - end;
    const replacement = value.slice(start, value.length - end);

    let at = 0;
    let placed = false;

    const next = olds.map((text) => {
        const runStart = at;
        const runEnd = at + text.length;
        at = runEnd;

        // Only when the whole change sits inside this one run. A change that
        // straddles two runs says nothing about which side of the element
        // between them the new words belong on, and guessing is how the words
        // got lost in the first place.
        if (placed || from < runStart || to > runEnd) {
            return text;
        }

        placed = true;

        return text.slice(0, from - runStart) + replacement + text.slice(to - runStart);
    });

    if (placed) {
        runs.forEach((node, index) => {
            node.nodeValue = next[index];
        });

        return;
    }

    /*
     * The change touched more than one run: words were altered on both sides
     * of the element between them. One contiguous replacement cannot say which
     * side the new words belong on, but the boundary itself can often still be
     * found, because the words immediately touching it did not change.
     */
    const shares = splitAcrossRuns(olds, value);

    if (shares !== null) {
        runs.forEach((node, index) => {
            node.nodeValue = shares[index];
        });

        return;
    }

    // A rewrite rather than an edit. Nothing can be inferred about where the
    // elements between the runs belong, so the sentence becomes one run,
    // which loses the arrangement but never a word the person typed.
    writeRun(runs[0], value);
    runs.slice(1).forEach((node) => {
        if (keepRuns) {
            node.nodeValue = '';

            return;
        }

        node.remove();
    });
};

/**
 * Every character the old words and the new ones still have in common, as
 * pairs of positions: a longest common subsequence, backtracked.
 *
 * Only ever reached when the cheap path has already failed, which is the
 * uncommon case, so the table it builds is paid for rarely. It is bounded
 * anyway by the caller, because this is quadratic and a page can carry a
 * paragraph far longer than a sentence.
 */
const matchedPairs = (before, value) => {
    const n = before.length;
    const m = value.length;
    const width = m + 1;
    const table = new Int32Array((n + 1) * width);

    for (let i = n - 1; i >= 0; i -= 1) {
        for (let j = m - 1; j >= 0; j -= 1) {
            table[i * width + j] = before[i] === value[j]
                ? table[(i + 1) * width + j + 1] + 1
                : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
        }
    }

    const pairs = [];

    for (let i = 0, j = 0; i < n && j < m;) {
        if (before[i] === value[j]) {
            pairs.push([i, j]);
            i += 1;
            j += 1;
        } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
            i += 1;
        } else {
            j += 1;
        }
    }

    return pairs;
};

/** Unchanged characters touching a boundary, counted without a break on either side. */
const anchorAt = (pairs, boundary) => {
    const byOld = new Map(pairs.map(([bi, vj]) => [bi, vj]));

    const runLength = (step) => {
        let length = 0;

        for (let i = step < 0 ? boundary - 1 : boundary; byOld.has(i); i += step) {
            // Contiguous in the new words too. Scattered letters that happen to
            // survive are not an anchor, they are a coincidence.
            const next = byOld.get(i + step);

            length += 1;

            if (next === undefined || Math.abs(next - byOld.get(i)) !== 1) {
                break;
            }
        }

        return length;
    };

    return Math.max(runLength(-1), runLength(1));
};

/**
 * Each run's share of the new words, or null when it cannot be known.
 *
 * The runs of a sentence are separated by something else on the page, and that
 * something has no position in a plain string of words. Editing on both sides
 * of a bold phrase in one go used to collapse the sentence into a single run
 * and leave the phrase trailing it, because the only question that was asked
 * was whether the whole change fitted inside one run.
 *
 * The better question is where each boundary went, and unchanged words
 * touching it answer that: in "We design for the <b>...</b>, not a
 * photograph", rewording the first word and the last leaves "for the " and
 * ", not a " untouched on either side of the phrase, which is more than enough
 * to say where the phrase still belongs.
 *
 * One thing has to hold before a split is trusted: every boundary is touched
 * by unchanged words, contiguous in both the old string and the new. Letters
 * that happen to survive a rewrite scattered about are not an anchor, and
 * requiring them to run on unbroken in both is what tells the two apart.
 *
 * A guard on how much of the sentence survived overall was tried first and
 * thrown away: it rejected "Call <a>us</a> or <a>write</a> today" becoming
 * "Ring ... now", where both words changed and both boundaries were still
 * sitting in untouched text. How much of a short sentence survives says very
 * little; what is touching the boundary says everything, and it is the
 * question actually being asked.
 *
 * When it fails the caller falls back to collapsing, which costs the
 * arrangement. Whichever path is taken, the shares tile the new words exactly,
 * so no word can be lost either way.
 */
const splitAcrossRuns = (olds, value) => {
    const before = olds.join('');

    // Quadratic, and only worth it on the scale of a sentence.
    if (before.length === 0 || value.length === 0 || before.length * value.length > 250000) {
        return null;
    }

    const pairs = matchedPairs(before, value);

    const byOld = new Map(pairs.map(([bi, vj]) => [bi, vj]));
    const shares = [];
    let taken = 0;
    let at = 0;

    for (const text of olds.slice(0, -1)) {
        at += text.length;

        if (anchorAt(pairs, at) < 3) {
            return null;
        }

        // The boundary sits after the last surviving character that came from
        // before it.
        let mapped = taken;

        for (let i = at - 1; i >= 0; i -= 1) {
            if (byOld.has(i)) {
                mapped = Math.max(taken, byOld.get(i) + 1);
                break;
            }
        }

        shares.push(value.slice(taken, mapped));
        taken = mapped;
    }

    shares.push(value.slice(taken));

    return shares;
};

/**
 * Put words into one run of text, keeping the spaces that held it apart.
 *
 * A published value arrives trimmed, and the space that separated these words
 * from a neighbouring icon or link is not part of the words. Without this an
 * icon ends up wearing the sentence: "→Book a call". The space is only added
 * back when the value does not already carry one, so a value that came
 * straight from the page round-trips unchanged.
 */
const writeRun = (node, value) => {
    const had = node.nodeValue;
    const lead = /^\s/.test(had) && !/^\s/.test(value) ? ' ' : '';
    const trail = /\s$/.test(had) && !/\s$/.test(value) ? ' ' : '';

    node.nodeValue = lead + value + trail;
};

const TEXT_NODE = 3;

/**
 * Replace an inline drawing, keeping the sizing the theme gave it.
 *
 * The theme's own class, width, height and style stay on the element and only
 * the drawing inside changes — swapping the whole element would drop the
 * sizing with it and leave an icon rendering at its natural size, which for a
 * 24px glyph in a 1000-unit viewBox is the width of the page.
 *
 * Rebuilt from an allowed list first. This is the only stored value that is
 * markup, and it arrives over the network.
 */
export const applySvg = (element, value) => {
    const clean = cleanSvg(value);

    if (!clean) {
        return false;
    }

    const replacement = document.importNode(clean, true);

    for (const keep of ['class', 'width', 'height', 'style', 'data-edit-svg', 'data-edit-label']) {
        if (element.hasAttribute(keep)) {
            replacement.setAttribute(keep, element.getAttribute(keep));
        }
    }

    element.replaceWith(replacement);

    return true;
};

/**
 * Swap an icon's class for another, leaving the theme's own classes alone.
 *
 * One name replaces the one that is there. Several mean the editor moved this
 * icon to a different variant of the theme's own set, which takes a different
 * list — so the list stands in for the whole attribute.
 */
export const applyIcon = (element, value) => {
    // Class names land in an attribute, so nothing but class names goes in.
    const chosen = String(value).replace(/[^A-Za-z0-9_\- ]/g, '').split(/\s+/).filter(Boolean);
    const was = element.getAttribute('data-edit-icon-current');

    if (chosen.length === 0 || !was) {
        return false;
    }

    const classes = chosen.length === 1
        ? (element.getAttribute('class') ?? '').trim().split(/\s+/).map((c) => (c === was ? chosen[0] : c))
        : chosen;

    element.setAttribute('class', classes.join(' '));
    element.setAttribute('data-edit-icon-current', chosen.length === 1 ? chosen[0] : chosen[chosen.length - 1]);

    return true;
};

/**
 * Point a background at a new picture.
 *
 * Both the theme's own lazy-loading attributes and an inline style, because a
 * theme that reads one on load will otherwise put the old picture back.
 */
export const applyBackground = (element, url) => {
    for (const attribute of ['data-background', 'data-bg', 'data-background-image']) {
        if (element.hasAttribute(attribute)) {
            element.setAttribute(attribute, url);
        }
    }

    const style = (element.getAttribute('style') ?? '').replace(/background-image\s*:[^;]*;?/gi, '').trim();

    element.setAttribute('style', `${style ? style.replace(/;?$/, ';') : ''}background-image:url('${url}')`);
};

/**
 * Put a list back in the order somebody chose.
 *
 * The server does this first, before filling anything in, because an item
 * moved or added changes what the content underneath has to land on. Same
 * order here, for the same reason.
 *
 * An item named in the order but missing from the page is copied from the
 * first one — that is how an item added in the editor appears on a page whose
 * markup only ever had the originals.
 */
export const applyOrder = (root, settings) => {
    let moved = 0;

    for (const container of root.querySelectorAll('[data-edit-list]')) {
        const key = container.getAttribute('data-edit-list');

        if (!Object.hasOwn(settings, key)) {
            continue;
        }

        let order;

        try {
            order = JSON.parse(settings[key]);
        } catch {
            continue;
        }

        if (!Array.isArray(order) || order.length === 0) {
            continue;
        }

        const items = new Map();

        for (const child of [...container.children]) {
            if (child.hasAttribute('data-edit-item')) {
                items.set(child.getAttribute('data-edit-item'), child);
                container.removeChild(child);
            }
        }

        if (items.size === 0) {
            continue;
        }

        const template = items.values().next().value;

        for (const id of order) {
            const existing = items.get(String(id));

            if (existing) {
                container.appendChild(existing);
                continue;
            }

            // Added in the editor: copy the first and give the copy its own
            // identity, so editing it cannot disturb the original.
            const clone = template.cloneNode(true);
            clone.setAttribute('data-edit-item', String(id));
            container.appendChild(clone);
        }

        moved++;
    }

    return moved;
};

/** @param {Record<string, string>} settings */
export const applyContent = (root, settings) => {
    let applied = 0;

    // Lists first: an item moved or added changes what everything below has
    // to land on.
    applyOrder(root, settings);

    // Before anything is applied, so the files are in flight while the words
    // are being written into the page.
    warmPictures(root, settings);

    for (const element of root.querySelectorAll('[data-edit]')) {
        const declared = element.getAttribute('data-edit') ?? '';

        if (!declared.startsWith(PREFIX)) {
            continue;
        }

        const key = declared.slice(PREFIX.length);

        // An empty string is a real edit — somebody cleared the field — but an
        // absent key is not, and treating them alike would make a cleared
        // heading spring back to the words in the file.
        if (!Object.hasOwn(settings, key)) {
            continue;
        }

        applyValue(element, settings[key]);
        applied++;
    }

    // A picture is marked differently from words, because replacing it means
    // setting a source rather than writing text. Missing this meant a client
    // could change an image, publish it, and go on seeing the old one.
    for (const element of root.querySelectorAll('[data-edit-img]')) {
        const key = (element.getAttribute('data-edit-img') ?? '').replace(/^setting:/, '');

        if (Object.hasOwn(settings, key)) {
            applyValue(element, settings[key]);

            /*
             * Keep what the drawer shows in step with what the page shows.
             *
             * `data-edit-preview` is written by the mapper from the element's
             * source at the moment the page was tagged, and nothing ever
             * updated it. So a client replaced a picture, saw the new one on
             * the page, opened the drawer again to write its description - and
             * was shown the picture they had just replaced. It reads as a save
             * that did not take, and the natural response is to replace it
             * again, and again.
             *
             * Reported from a real site. The attribute exists because a
             * lazily-loaded image's own `src` can be a placeholder at the
             * moment somebody clicks, so it is still the thing the drawer
             * reads - it just has to be told when the picture changes.
             */
            if (settings[key]) {
                element.dataset.editPreview = settings[key];
            } else {
                delete element.dataset.editPreview;
            }

            applied++;
        }

        // The description is stored beside the picture. A page rendered by a
        // server puts it in the markup; a static page has only this, so
        // without it the alt text the drawer collects is written down, kept,
        // and never reaches a screen reader or a search engine — which is the
        // whole reason for asking somebody to write one.
        //
        // Srcset is here rather than beside src because it is written the same
        // way: stored against the picture, applied after it. Order matters and
        // is not incidental - applyValue above clears the source list that
        // came with the theme, and this puts back the one belonging to the
        // picture that replaced it, if there is one.
        for (const [suffix, attribute] of [['Alt', 'alt'], ['Title', 'title'], ['Srcset', 'srcset']]) {
            if (Object.hasOwn(settings, key + suffix)) {
                const value = settings[key + suffix];
                // An empty description is a decorative image, which is a
                // meaningful answer: alt="" says "skip me". Nothing else here
                // has a meaningful empty: an empty title is a tooltip nobody
                // wanted, and an empty source list is no source list.
                if (value === '' && attribute !== 'alt') {
                    element.removeAttribute(attribute);
                } else {
                    element.setAttribute(attribute, value);
                }
                applied++;
            }
        }
    }

    // An inline drawing, which a theme uses where another would use an icon
    // font. The scanner marks these and the drawer edits them, and nothing
    // here applied them: the change was stored, the export showed it, and the
    // live page never did.
    for (const element of root.querySelectorAll('[data-edit-svg]')) {
        const key = (element.getAttribute('data-edit-svg') ?? '').replace(/^setting:/, '');
        const value = settings[key];

        if (!Object.hasOwn(settings, key) || String(value ?? '').trim() === '') {
            continue;
        }

        if (applySvg(element, value)) {
            applied++;
        }
    }

    // An icon is a set of class names, not words. The server swaps them the
    // same way; two implementations of one rule is how an icon ends up
    // different depending on which kind of site it is on.
    for (const element of root.querySelectorAll('[data-edit-icon]')) {
        const key = (element.getAttribute('data-edit-icon') ?? '').replace(/^setting:/, '');
        const value = settings[key];

        if (!Object.hasOwn(settings, key) || value === '') {
            continue;
        }

        if (applyIcon(element, value)) {
            applied++;
        }
    }

    // A background set by the theme's own CSS or by its lazy-loading
    // attributes, rather than by an <img>.
    for (const element of root.querySelectorAll('[data-edit-bg]')) {
        const key = (element.getAttribute('data-edit-bg') ?? '').replace(/^setting:/, '');
        const value = settings[key];

        if (!Object.hasOwn(settings, key) || value === '') {
            continue;
        }

        applyBackground(element, value);
        applied++;
    }

    // A link's target carries its own key alongside the element's.
    for (const element of root.querySelectorAll('[data-edit-href]')) {
        const key = element.getAttribute('data-edit-href');
        if (Object.hasOwn(settings, key)) {
            element.setAttribute('href', settings[key]);
            applied++;
        }
    }

    return applied;
};

/**
 * Put the client's words back when the theme puts its own back.
 *
 * Content is applied once, as the page finishes loading. Anything that runs
 * afterwards wins — and a bought theme is full of things that run afterwards:
 * a typing effect that rewrites a headline character by character, a slider
 * swapping the picture in a panel, a lazy loader replacing a source it decides
 * is stale. The client's sentence appears, then the theme's sentence replaces
 * it a second later, and the page settles on the words they thought they had
 * changed. Nothing errors. They save it again, and it happens again.
 *
 * So the elements we wrote to are watched, and if something else writes over
 * one, everything is applied again. Applying is idempotent, so there is no
 * need to work out which element was hit — and working it out would mean a
 * second copy of the rules for what each kind of marker means.
 *
 * Three things keep this a guard rather than a war:
 *
 *   Our own writes are consumed before the observer can see them, so a repair
 *   cannot trigger another repair.
 *
 *   Repairs are capped. A slider that rewrites its caption on every rotation
 *   would otherwise be fought forever, at a cost paid by every visitor. After
 *   the cap it is left alone and said out loud, because "we gave up" is a
 *   thing somebody needs to be able to find out.
 *
 *   Nothing is repaired while somebody is editing. The value being defended is
 *   the one that was published; the value in the page is the one they are
 *   typing. Putting the published one back over their sentence as they write
 *   it would be far worse than the problem this solves.
 *
 * Only the attributes we actually write are watched. Class and style are not:
 * a theme changes those constantly for animations and scroll reveals, and
 * treating that as damage would mean repairing the page all the way down a
 * scroll for no reason at all.
 */
export const defendContent = (doc, { limit = 12, debounce = 60 } = {}) => {
    const view = doc.defaultView ?? (typeof window === 'undefined' ? null : window);

    if (!view?.MutationObserver) {
        return null;
    }

    const watched = doc.querySelectorAll('[data-edit], [data-edit-img], [data-edit-href]');

    if (watched.length === 0) {
        return null;
    }

    /*
     * What the page said when it was handed over, rather than what the
     * settings say.
     *
     * The same guard has to work from both ways in, and they know different
     * things. A static page fetches its content and applies it here, so the
     * settings are in hand. A WordPress page arrives with the client's words
     * already baked in by the server and never fetches anything — there are no
     * settings on that side at all.
     *
     * What both have is a correct page, at the moment just after it was made
     * correct. So that is what is remembered, and anything that writes over it
     * afterwards is the theme.
     */
    const delivered = new Map();

    for (const element of watched) {
        delivered.set(element, {
            words: element.hasAttribute('data-edit') ? ownTextOf(element) : null,
            src: element.getAttribute('src'),
            href: element.hasAttribute('data-edit-href') ? element.getAttribute('href') : null,
        });
    }

    let repairs = 0;
    let writing = false;
    let pending = null;

    const restore = () => {
        pending = null;

        if (doc.body?.classList?.contains('editing')) {
            return;
        }

        repairs++;
        writing = true;

        for (const [element, was] of delivered) {
            if (!element.isConnected) {
                continue;
            }

            if (was.words !== null && ownTextOf(element) !== was.words) {
                applyWords(element, was.words);
            }

            if (was.src !== null && element.getAttribute('src') !== was.src) {
                element.setAttribute('src', was.src);
                // A responsive source list outranks src, so a picture put back
                // without clearing it snaps straight to the theme's again.
                element.removeAttribute('srcset');
            }

            if (was.href !== null && element.getAttribute('href') !== was.href) {
                element.setAttribute('href', was.href);
            }
        }

        // Consume the records our own writing just produced, so they are never
        // delivered and cannot be mistaken for the theme writing again.
        observer.takeRecords();
        writing = false;

        if (repairs >= limit) {
            observer.disconnect();
            console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${repairs} times and is now being left alone.`);
        }
    };

    const observer = new view.MutationObserver(() => {
        if (writing || pending || repairs >= limit) {
            return;
        }

        pending = view.setTimeout(restore, debounce);
    });

    for (const element of watched) {
        observer.observe(element, {
            characterData: true,
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'srcset', 'href'],
        });
    }

    return observer;
};

/**
 * Published content from the files, without troubling the application.
 *
 * Two requests, both cacheable and neither of them ours to serve: the pointer,
 * which moves on each publish and is cached for seconds, and the version,
 * which never changes and is cached forever.
 */
/**
 * The same rules the server writes, written here instead.
 *
 * A server-rendered page gets these as a stylesheet before it is sent. A
 * static page has nobody to do that — so without this, a client can change a
 * button's colour, watch it save, and see nothing happen. The save was fine.
 * There was simply nothing rendering it.
 *
 * Kept deliberately in step with the server's version: two implementations of
 * one mapping is how a button ends up a different colour depending on which
 * kind of site it is on.
 */
export const styleRules = (key, props) => {
    const selector = `[data-style="${key}"]`;
    let css = '';
    let rules = '';

    for (const [prop, value] of Object.entries(props ?? {})) {
        if (value === '' || value === null || value === undefined) {
            continue;
        }

        if (prop === 'hidden') {
            css += `body:not(.editing) ${selector}{display:none !important}`;
            css += `body.editing ${selector}{opacity:.45}`;
            continue;
        }

        // !important, because a saved value has to beat the theme's own
        // stylesheet — that is the entire point of being able to restyle
        // something a class already coloured.
        rules += {
            backgroundImage: `background-image:url('${value}') !important;background-size:cover !important;background-position:center !important;`,
            background: `background:${value} !important;`,
            textColor: `color:${value} !important;`,
            fontSize: `font-size:${value}px !important;`,
            radius: `border-radius:${value}px !important;`,
            paddingX: `padding-left:${value}px !important;padding-right:${value}px !important;`,
            paddingY: `padding-top:${value}px !important;padding-bottom:${value}px !important;`,
        }[prop] ?? '';
    }

    return rules === '' ? css : css + `${selector}{${rules}}`;
};

/** @param {Record<string, Record<string, string>>} styles */
export const applyStyles = (root, styles) => {
    const css = Object.entries(styles ?? {})
        .map(([key, props]) => styleRules(key, props))
        .join('');

    if (css === '') {
        return 0;
    }

    // One tag, reused: applying content twice — a locale change, a refresh
    // after publishing — must not stack another sheet on the page.
    const id = 'live-edit-styles';
    const tag = root.getElementById?.(id) ?? root.querySelector?.(`#${id}`) ?? null;
    const style = tag ?? root.createElement('style');

    style.id = id;
    style.textContent = css;

    if (!tag) {
        (root.head ?? root.body)?.appendChild(style);
    }

    return Object.keys(styles).length;
};

export const fetchSnapshot = async ({ snapshot, locale }) => {
    const base = String(snapshot).replace(/\/$/, '');
    const pointer = await retrying(() => fetch(`${base}/current.json`).then((r) => {
        if (!r.ok) {
            throw failure(`Pointer answered ${r.status}`, r.status);
        }

        return r.json();
    }));

    // A site that has published nothing has a pointer saying so. Its words
    // are the ones already in the file, which is exactly right.
    if (!pointer.version) {
        return { settings: {}, styles: {} };
    }

    const language = locale ?? 'en';
    return retrying(async () => {
        const response = await fetch(`${base}/v${pointer.version}/${language}.json`);

        if (!response.ok) {
            throw failure(`Version answered ${response.status}`, response.status);
        }

        return response.json();
    });
};

export const fetchContent = async ({ base, site, key, locale }) => {
    const url = `${String(base).replace(/\/$/, '')}/${site}/content${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`;

    return retrying(async () => {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });

        if (!response.ok) {
            // A page must not break because the content service is briefly
            // unreachable: the words already in the file are perfectly good.
            // But it is asked again first — see retrying().
            throw failure(`Content service answered ${response.status}`, response.status);
        }

        return response.json();
    });
};

const start = async () => {
    const config = typeof window !== 'undefined' ? window.liveEditContent : null;

    if (!config) {
        return;
    }

    let applied = null;
    let failed = null;

    try {
        const payload = await resolve(config);

        if (payload) {
            // What this site will accept, for the panel that offers it. A
            // server-rendered page is handed this in its layout; a static page
            // has no layout, so without it the panel drew controls the server
            // would silently drop.
            if (payload.styleProps) {
                window.liveEditStyleProps = payload.styleProps;
            }

            // How many changes are waiting, so the toolbar can offer to put
            // them live. A server-rendered page is told this in its layout; a
            // static page has no layout, so the Publish button simply never
            // appeared and the drafts had nowhere to go.
            if (typeof payload.pending === 'number' && payload.styleProps) {
                window.liveEditPublishing = { ...(window.liveEditPublishing ?? {}), pending: payload.pending };
            }

            applied = applyContent(document, payload.settings ?? {});
            applyStyles(document, payload.styles ?? {});

            // Handed to the panel as well as to the page. The style controls
            // read their current values from here; without it they opened
            // reading "use default" on an element that plainly was not, and
            // saving wrote that back.
            window.liveEditStyles = payload.styles ?? {};

            // And keep them. A bought theme runs its own scripts after this
            // one, and several of them write text and swap pictures.
            defendContent(document);
        }
    } catch (error) {
        failed = error;
        // The words already in the file are perfectly good. A page must never
        // break because a content service is briefly unreachable.
        console.warn('[live-edit] serving the words already in the page:', error.message);
    }

    // Say when the page has finished becoming itself.
    //
    // Anything that needs to look at the finished page — the editor checking
    // that a change actually arrived — otherwise has to guess how long to
    // wait, and would read the page mid-flight. The flag is for whoever
    // attaches after this has already run.
    announce({ applied, failed: failed ? failed.message : null });
};

const announce = (detail) => {
    window.liveEditContentDone = detail;
    document.dispatchEvent(new CustomEvent('live-edit:content', { detail }));
};

/**
 * Files first, the application only if there are none.
 *
 * A site that has never published has no snapshot, and one that cannot reach
 * its CDN should still show its words rather than nothing — so the API remains
 * a fallback rather than the usual path.
 */
export const resolve = async (config) => {
    if (config.snapshot) {
        try {
            return await fetchSnapshot(config);
        } catch (error) {
            // A browser reports a blocked cross-origin fetch as an ordinary
            // network failure, so the most likely cause is named here. Without
            // it the page simply shows its original words forever and nothing
            // says why — which is exactly how this was first met.
            const hint = error.message.includes('fetch')
                ? ' (if the files are on another origin, the bucket or CDN must allow cross-origin reads)'
                : '';

            if (!config.base) {
                throw new Error(error.message + hint);
            }

            console.warn('[live-edit] falling back to the content API:', error.message + hint);
        }
    }

    return config.base && config.site && config.key ? fetchContent(config) : null;
};

if (typeof document !== 'undefined') {
    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', start)
        : start();
}
