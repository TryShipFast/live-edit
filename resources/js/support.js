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
