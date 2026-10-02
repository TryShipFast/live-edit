/**
 * Pieces of the editor that are pure enough to test on their own.
 *
 * Everything here was extracted after a bug shipped in it. The editor is one
 * long closure over the DOM, which is hard to get under test, and the faults
 * that reached a client were not in the DOM parts at all: a key parsed wrongly,
 * headers dropped, a response believed. Those are plain functions, so they live
 * here where a test can reach them.
 */

/**
 * Split a data-edit value into what it addresses.
 *
 * The value is "<kind>:<rest>", and rest may itself contain colons:
 * "setting:auto:1a2b3c" is an auto key called "auto:1a2b3c", not "auto".
 * Keeping only the first piece saved every edit on an auto-keyed theme against
 * a key named "auto", and the client's words went nowhere.
 */
export const parseEditKey = (value) => {
    const [kind, ...parts] = String(value ?? '').split(':');

    return { kind, key: parts.join(':'), parts };
};

/**
 * Build the options for a request to the editor's endpoints.
 *
 * The caller's options are spread FIRST so its headers cannot replace these
 * wholesale: a call that set Content-Type used to take the CSRF token and the
 * Accept header out with it. Without Accept, Laravel answers a validation
 * failure with a redirect to a page rather than a 422.
 */
export const requestInit = (csrf, options = {}) => ({
    ...options,
    headers: {
        'X-CSRF-TOKEN': csrf,
        Accept: 'application/json',
        ...(options.headers ?? {}),
    },
});

/**
 * Whether a response is the JSON the endpoints promise.
 *
 * A redirect followed to a page still arrives as 200. Believing that is worse
 * than failing outright: the editor says "Saved", reloads, and the words are
 * gone.
 */
export const isJsonResponse = (response) =>
    (response?.headers?.get?.('content-type') ?? '').includes('json');

const ICON_NAME =
    /\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi;

/**
 * The icon names a stylesheet defines glyphs for, with the glyph itself.
 *
 * Only rules that actually set a `content` count: a name class with no glyph
 * behind it is a layout helper, and offering it would hand the client an empty
 * square.
 */
export const iconNamesIn = (css) => {
    const found = [];

    for (const block of String(css ?? '').split('}')) {
        const brace = block.indexOf('{');
        if (brace === -1) continue;

        const declared = block.slice(brace + 1).match(/content\s*:\s*(["'])(.*?)\1/);
        if (!declared) continue;

        // A codepoint may arrive escaped ("\f3a5") or already decoded,
        // depending on whether it was parsed or fetched as text.
        const escaped = declared[2].match(/^\\([0-9a-f]{1,6})\s*$/i);
        const glyph = escaped ? String.fromCodePoint(parseInt(escaped[1], 16)) : declared[2];
        if ([...glyph].length !== 1) continue;

        for (const match of block.slice(0, brace).matchAll(ICON_NAME)) {
            found.push({ name: match[1], glyph });
        }
    }

    return found;
};

/**
 * The class list that puts an icon name on an element using another variant's
 * face: the element's own face classes give way to theirs, and everything the
 * theme used for decoration stays.
 *
 * Which classes choose the face is decided by the caller, because answering
 * that needs a browser; arranging them is just a list operation.
 */
export const classListWith = (classes, name, replacing, ownFaceClasses, otherFaceClasses) => {
    const kept = classes.filter((cls) => cls !== replacing && !ownFaceClasses.includes(cls));

    otherFaceClasses.forEach((cls) => kept.includes(cls) || kept.push(cls));
    kept.push(name);

    return kept.join(' ');
};

/**
 * What the panel shows for a piece of editable text.
 *
 * Three sources, in order. A recorded value wins: a counter's words are a
 * placeholder ("00") that the theme's script replaces, so the markup cannot be
 * asked. Otherwise the element's own words, which is what keeps replacing them
 * from swallowing a nested link or button. And if it has none of its own — a
 * button written as "<a data-edit><span>Request a Quote</span></a>" — the words
 * it wraps, because there is nothing else in there to swallow.
 */
export const displayedValue = ({ editValue, ownText, fullText }) => {
    if ((editValue ?? '') !== '') return editValue;
    if ((ownText ?? '').trim() !== '') return ownText;

    return fullText ?? '';
};

/**
 * The words an element contributes itself, ignoring its children.
 *
 * Joined with nothing, not with a space. A sentence broken by a bold phrase
 * is two runs of text, and putting a space between them added one the page
 * never had — visible as a gap before the comma in "the , not for a
 * photograph". It also meant the string the editor showed was not quite the
 * string the page held, so writing it back could not be exact.
 */
/*
 * An element's OWN words: its direct text, never a descendant's.
 *
 * Reading through to a single child was tried on 2026-09-29, to reach a
 * heading whose text sits inside a router link - which is how every React app
 * writes a card title, and the one shape the list work still cannot tag.
 *
 * It cannot be done from the DOM alone, and the case that proves it is
 * ordinary: a client who CLEARS a sentence leaves `<p><strong>the
 * phrase</strong></p>`, which is structurally identical to a wrapper whose
 * words live in its child. Reading through makes the cleared words reappear,
 * so the editor shows text the page no longer has and the next save writes it
 * back. A test caught it immediately.
 *
 * Both shapes have one element child and whitespace-only text of their own.
 * Nothing in the markup tells them apart, so any fix has to be told rather
 * than deduced - which means an attribute written by whatever tagged the
 * element, and both halves landing together.
 *
 * Worth knowing: the applier DOES write through this shape, recursing into a
 * single childless element. So reading and writing disagree for a pure
 * wrapper. That is narrow and long-standing, and it is not worth trading a
 * correct clear for.
 */
export const ownTextOf = (element) =>
    element.children.length
        ? [...element.childNodes]
            .filter((node) => node.nodeType === 3)
            .map((node) => node.textContent)
            .join('')
        : element.textContent;

/**
 * One ordered list of icons from the faces a theme uses.
 *
 * Groups are given in preference order, the element's own face first, so a name
 * it can already draw needs no change of classes. The result is ordered by
 * name, not by face: collected face by face it came out in blocks — every
 * regular icon, then every solid one, then the brands — so a screenful was a
 * wall of one style and the last face never appeared at all.
 */
export const orderedIcons = (groups) => {
    const seen = new Set();
    const merged = [];

    for (const group of groups) {
        for (const icon of group.icons) {
            if (seen.has(icon.name)) continue;
            seen.add(icon.name);
            merged.push({ ...icon, face: group.face, variant: group.variant });
        }
    }

    return merged.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Which style controls an element asks for.
 *
 * "data-style-props" narrows the set; leaving it off used to mean none at all,
 * so a section tagged as styleable opened a panel with nothing in it. An author
 * who tagged the element meant it to be styleable, so the absence of a
 * narrowing means everything the site offers.
 */
export const declaredStyleProps = (attribute, configured) => {
    const offered = Object.keys(configured ?? {});
    const declared = String(attribute ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

    if (declared.length === 0) {
        return offered;
    }

    // Nothing known about what the site supports. That is not the same as
    // "it supports none of these", and treating it that way emptied the panel
    // on every site that does not publish its vocabulary — no controls at all,
    // which is a worse answer than a control that might not apply.
    if (offered.length === 0) {
        return declared;
    }

    // Narrowed to what the site actually supports. An element can name a prop
    // the site does not offer — markup outlives a config, and a theme marks up
    // everything it might ever allow — and the panel drew a control for it
    // anyway. The server drops a prop it does not recognise, so that control
    // did nothing at all: the client picked a background image, saved, was
    // told it saved, and nothing changed, with no way to tell why. Better not
    // to offer it.
    return declared.filter((name) => offered.includes(name));
};

/**
 * Where a save should go when the editor is not running inside the site.
 *
 * On a Laravel page the overlay posts to same-origin routes and the session
 * cookie carries who you are. A React or WordPress page has neither: it is a
 * different origin and there is no session, so the same action becomes a call
 * to the content API with a bearer key.
 *
 * Only the endpoints the API actually has are mapped. An unmapped one throws
 * by name rather than quietly posting to a URL that does not exist and
 * reporting success.
 */
export const apiRequestFor = (url, options = {}, api) => {
    const base = String(api?.base ?? '').replace(/\/$/, '');

    // A search carries its terms in the address, so the name of the route and
    // the address asked for are not the same string. Looked up by path and
    // handed back with the query still attached: matching the whole thing
    // meant every search missed the map and was reported as an endpoint the
    // API does not have.
    const [path, query] = String(url).split('?');

    const routes = {
        '/live-edit/setting': `${base}/${api?.site}/content`,
        '/live-edit/style': `${base}/${api?.site}/styles`,
        '/live-edit/publish': `${base}/${api?.site}/publish`,
        '/live-edit/image': `${base}/${api?.site}/media`,
        '/live-edit/upload': `${base}/${api?.site}/media`,
        '/live-edit/changes': `${base}/${api?.site}/changes`,
        '/live-edit/versions': `${base}/${api?.site}/versions`,
        '/live-edit/content': `${base}/${api?.site}/content`,
        '/live-edit/translations': `${base}/${api?.site}/translations`,
        '/live-edit/credits': `${base}/${api?.site}/credits`,
        '/live-edit/assist': `${base}/${api?.site}/assist`,
        '/live-edit/photos': `${base}/${api?.site}/photos`,
        '/live-edit/photos/used': `${base}/${api?.site}/photos/used`,
        '/live-edit/imagine': `${base}/${api?.site}/imagine`,
    };

    /*
     * A route the host has claimed for itself.
     *
     * Publishing was the first: it decides what the public sees, so the
     * content API asks for a secret key, which a browser must never hold. A
     * host with its own idea of who may publish — WordPress knows, from its
     * own users — points it at one of its own routes and publishes from its
     * server, where the secret already lives.
     *
     * The same door is how a host takes ownership of its content. WordPress
     * keeps its customers' words in their own database, so it claims the
     * routes that read and write them, and the content API never sees them.
     * Anything it does not claim still goes to the service: the licence, the
     * sign-in, the AI, the stock photos. Those are services, not the
     * customer's content.
     *
     * Same origin, so the host's own session says who this is.
     */
    const claimed = api?.routes?.[path] ?? (path === '/live-edit/publish' ? api?.publishUrl : null);

    if (claimed) {
        return {
            url: query ? `${claimed}?${query}` : claimed,
            init: {
                ...options,
                headers: { ...(options.headers ?? {}), ...(api.routeHeaders ?? api.publishHeaders ?? {}), Accept: 'application/json' },
                credentials: 'same-origin',
            },
        };
    }

    const target = routes[path];

    if (!base || !api?.site || !api?.token) {
        throw new Error('The content API is not configured on this page.');
    }

    if (!target) {
        throw new Error(`Editing that is not available over the content API yet (${path}).`);
    }

    return {
        url: query ? `${target}?${query}` : target,
        init: {
            ...options,
            headers: {
                // Ours last, so a caller cannot drop the key and turn the save
                // into an anonymous request.
                ...(options.headers ?? {}),
                Authorization: `Bearer ${api.token}`,
                Accept: 'application/json',
            },
            // An upload is FormData, and setting Content-Type by hand strips
            // the boundary the browser generated — the server then reads an
            // empty body and the picture silently never arrives.
        },
    };
};

/**
 * What an element says for one of its attributes, preferring the page over a
 * host's bookkeeping.
 *
 * A Blade host renders the stored value into a data attribute; nothing else
 * does, so reading only that opened every field empty on every other kind of
 * site — and an empty field is sent on save, which quietly wiped whatever was
 * there. The attribute itself is what the picture actually says, including the
 * empty string, which for alt is a real answer rather than a missing one.
 */
export const attributeOf = (element, attribute, datasetKey) => {
    if (element.hasAttribute(attribute)) {
        return element.getAttribute(attribute);
    }

    return element.dataset?.[datasetKey] ?? '';
};

/**
 * Whether a stored value is a picture rather than something to read.
 *
 * The list of pending changes renders every value as text, which for a picture
 * is a hundred-character address truncated to seventy. A customer asked how to
 * undo replacing a picture and the honest answer was that the row was there,
 * it just could not be recognised - two unreadable URLs, one struck through.
 *
 * Asked of the value rather than guessed from the key, because keys are
 * `auto:4d90041f39e2` and say nothing. The page is the better authority when
 * the element is on it and the caller checks that first; this is for a change
 * made on a page somebody has since navigated away from, where the value is
 * all that is left.
 *
 * Extensions are not enough on their own: stored pictures are served from a
 * media path with a generated name and often no extension at all, and a data
 * URI has neither. So three ways, any of which is good enough.
 */
export const looksLikeAPicture = (value) => {
    const said = String(value ?? '').trim();

    if (said === '') {
        return false;
    }

    if (/^data:image\//i.test(said)) {
        return true;
    }

    // A path this runtime itself stores pictures under.
    if (/\/live-edit\/(sites|media)\//i.test(said)) {
        return true;
    }

    // An ordinary picture address, ignoring any query string hung off it.
    return /\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(said);
};

/**
 * Ask again, because the first answer was probably not the real one.
 *
 * A single failed request shows the theme's own words for that page view. To
 * anybody reading it that is indistinguishable from their work having been
 * lost — and the first thing a person does about lost work is type it again,
 * which is how one dropped connection turns into a client who no longer
 * believes the product keeps anything.
 *
 * Only what is worth asking again about. A 401 or a 403 is a wrong key and a
 * 404 is a wrong address: neither improves by being asked twice, and hammering
 * a rejected key is how a site gets itself throttled. A dropped connection, a
 * server error, a rate limit and a gateway timeout are all conditions that
 * pass.
 *
 * Short waits, because somebody is looking at the page while this happens. Two
 * retries at a fifth and half a second cost less than a second in the worst
 * case and cover the overwhelming majority of blips.
 */
export const worthAskingAgain = (error, status) => {
    if (status === undefined || status === null) {
        // No status at all is a connection that never arrived.
        return true;
    }

    return status === 408 || status === 425 || status === 429 || status >= 500;
};

export const retrying = async (attempt, { tries = 3, waits = [200, 500], sleep = null } = {}) => {
    const wait = sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    let last = null;

    for (let i = 0; i < tries; i++) {
        try {
            return await attempt();
        } catch (error) {
            last = error;

            const isLast = i === tries - 1;

            if (isLast || !worthAskingAgain(error, error.status)) {
                throw error;
            }

            await wait(waits[Math.min(i, waits.length - 1)]);
        }
    }

    throw last;
};

/**
 * The picture an element is showing as its background, or was.
 *
 * Three sources, in the order they deserve to be believed.
 *
 * An author's own attribute first - data-background and its spellings are a
 * builder saying outright what the picture is, and it does not go stale.
 *
 * Then what the browser is drawing now, which is the only way to see a
 * background that lives in a stylesheet.
 *
 * Then what we wrote down when we last looked. That last one is the fix: a
 * builder applies a background when a section arrives and takes it away again
 * when it leaves, so asking the computed style later is not the same question
 * as asking it then. The panel asked late, got "none", and told somebody "No
 * image set" about a section they could plainly see had a picture - reported
 * exactly that way, as discovering the background and never showing it.
 *
 * A data: URI is not a picture anybody replaces, and it is megabytes of markup
 * if it is sent anywhere, so it is not offered as one.
 */
export const backgroundImageOf = (element, view = null) => {
    if (!element) {
        return '';
    }

    const declared = element.dataset?.background
        || element.dataset?.bg
        || element.dataset?.backgroundImage;

    if (declared) {
        return declared;
    }

    const styles = view ?? element.ownerDocument?.defaultView ?? (typeof window === 'undefined' ? null : window);
    const computed = styles?.getComputedStyle ? (styles.getComputedStyle(element).backgroundImage || '') : '';
    const match = computed.match(/url\((['"]?)(.*?)\1\)/);

    if (match && !match[2].startsWith('data:')) {
        return match[2];
    }

    const recorded = element.dataset?.kbBg || '';

    return recorded.startsWith('data:') ? '' : recorded;
};

/**
 * Controls that reveal something rather than navigate somewhere.
 *
 * Editing swallows every click - it has to, or clicking a heading inside a
 * card would follow the card's link instead of opening the heading. The cost
 * is that whatever a control would have revealed can never be reached, so the
 * panel offers to run the control explicitly.
 *
 * This used to list only the ways a menu announces itself: aria-controls,
 * aria-expanded, data-toggle, role=button. A testimonial slider announces
 * nothing - it is a plain <button aria-label="Next testimonial"> - so no offer
 * was made, the click was eaten, and four of the five testimonials could not
 * be brought on screen at all, let alone edited. Reported as "it can't detect
 * testimonials on slides", and detection was never the problem.
 *
 * A plain button almost always acts on the page it is in. The exception is one
 * that submits a form, which does not reveal anything - it posts somebody's
 * half-filled sign-in and leaves.
 */
export const interactiveTarget = (element) => {
    const control = element?.closest?.(
        'a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"], [role="tab"], summary, button'
    ) ?? null;

    if (!control) {
        return null;
    }

    if (control.tagName === 'BUTTON' && control.form) {
        const kind = (control.getAttribute('type') || 'submit').toLowerCase();

        if (kind !== 'button') {
            return null;
        }
    }

    return control;
};

/**
 * What to call the button that runs a control.
 *
 * "Open this menu" over a carousel arrow is a small lie, and somebody who
 * cannot predict what a button does does not press it. The control already
 * says what it is, for the same reason a screen reader needs it to.
 */
export const nameOfControl = (control) => {
    const said = (
        control?.getAttribute?.('aria-label')
        || control?.getAttribute?.('title')
        || control?.textContent
        || ''
    ).replace(/\s+/g, ' ').trim();

    /*
     * Past this it is prose, not a label - a role=button on a whole card
     * carries the card. Quoting it back is worse than saying nothing.
     */
    if (said === '' || said.length > 80) {
        return '';
    }

    // An FAQ question is a sentence and still the best name this control has.
    // Shortened rather than discarded: "Run this control" over the one that
    // opens the answer somebody is looking for says less than three quarters
    // of the question does.
    return said.length > 32 ? `${said.slice(0, 31).trimEnd()}…` : said;
};

/**
 * Which style controls suit the thing that was clicked.
 *
 * A heading does not need padding and a corner radius; a section does not need
 * a font size. A panel offering every property to every element is a panel
 * nobody reads.
 */
export const stylePropsFor = (element, declared) => {
    const tag = element.tagName;
    let allowed;

    if (tag === 'IMG') {
        allowed = ['radius', 'hidden'];
    } else if (tag === 'A' || tag === 'BUTTON') {
        allowed = ['background', 'textColor', 'fontSize', 'radius', 'hidden'];
    } else if (/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(tag)) {
        allowed = ['textColor', 'fontSize', 'hidden'];
    } else {
        allowed = ['background', 'backgroundImage', 'paddingY', 'paddingX', 'radius', 'hidden'];
    }

    /*
     * Replace background, offered about a background that is there.
     *
     * Two faults, one control. On a section keyed for its background the panel
     * already carries a Background image editor of its own - preview, credit,
     * Remove - so this was a second "Replace background" button in the same
     * panel, and not the same button either: this one writes an !important
     * override that outranks whatever the editor above stores. Use them in
     * that order and the picture does not change, with nothing on screen
     * saying why.
     *
     * And on a group with no background at all it offered to replace nothing,
     * under the heading BACKGROUND IMAGE, above the words "No image set". A
     * panel that asks about things that do not exist is a panel somebody stops
     * reading.
     *
     * So: only where there is a picture to change, and only where nothing
     * better is already changing it.
     */
    const hasOne = backgroundImageOf(element) !== '';
    const ownEditor = element.hasAttribute?.('data-edit-bg') === true;

    if (!hasOne || ownEditor) {
        allowed = allowed.filter((name) => name !== 'backgroundImage');
    }

    return declared.filter((name) => allowed.includes(name.trim()));
};
