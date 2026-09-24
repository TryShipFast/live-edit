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

/** The words an element contributes itself, ignoring its children. */
export const ownTextOf = (element) =>
    element.children.length
        ? [...element.childNodes]
            .filter((node) => node.nodeType === 3)
            .map((node) => node.textContent)
            .join(' ')
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
    const declared = String(attribute ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

    return declared.length ? declared : Object.keys(configured ?? {});
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
    const routes = {
        '/live-edit/setting': `${base}/${api?.site}/content`,
        '/live-edit/publish': `${base}/${api?.site}/publish`,
        '/live-edit/image': `${base}/${api?.site}/media`,
        '/live-edit/upload': `${base}/${api?.site}/media`,
    };

    // Publishing decides what the public sees, so the content API asks for a
    // secret key — which a browser must never hold. A host that has its own
    // idea of who may publish (WordPress knows, from its own users) points
    // this at one of its own routes instead, and does the publishing from its
    // server where the secret already lives.
    if (url === '/live-edit/publish' && api?.publishUrl) {
        return {
            url: api.publishUrl,
            init: {
                ...options,
                headers: { ...(options.headers ?? {}), ...(api.publishHeaders ?? {}), Accept: 'application/json' },
                // Same origin, so the host's own session says who this is.
                credentials: 'same-origin',
            },
        };
    }

    const target = routes[url];

    if (!base || !api?.site || !api?.token) {
        throw new Error('The content API is not configured on this page.');
    }

    if (!target) {
        throw new Error(`Editing that is not available over the content API yet (${url}).`);
    }

    return {
        url: target,
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
