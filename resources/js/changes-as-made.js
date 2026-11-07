/**
 * Changes said the way the owner made them (owner, 7 Nov 2026: "Our promise to people is easy of use").
 *
 * The store keeps one row per value, so choosing the "Forest" palette is seven rows (brand.ink, brand.accent...)
 * and a font pairing two. The publish review read "Publish 18 changes" for six things done, seven of them
 * "Text #0F2A43". Here a palette is one change, "Colours: Forest", and a pairing one, "Type: Classic"; the
 * server counts the same way (ChangesAsMade.php), so the number on Publish and in its window agree.
 */
export const COLOUR_KEYS = ['brand.ink', 'brand.accent', 'brand.surface', 'brand.raised', 'brand.body', 'brand.muted', 'brand.line'];
export const TYPE_KEYS = ['brand.font.display', 'brand.font.body'];

/** The brand's own fields, by the names the Brand panel gives them. */
export const BRAND_NAMES = {
    'brand.name': 'Business name',
    'brand.logo': 'Logo',
    'brand.phone': 'Phone',
    'brand.phone-2': 'Second phone',
    'brand.whatsapp': 'WhatsApp',
    'brand.email': 'Email',
    'brand.address': 'Address',
    'brand.privacy-email': 'Email for privacy requests',
};

const groupOf = (key) => (COLOUR_KEYS.includes(key) ? 'colours' : TYPE_KEYS.includes(key) ? 'type' : null);

/** The changes in the order given, a palette's colours and a pairing's faces each gathered into one. */
export const asMade = (changes = []) => {
    const out = [];
    const groups = new Map();
    for (const change of changes) {
        const group = groupOf(change?.key);
        if (!group) {
            out.push({ kind: 'one', change });
            continue;
        }
        if (!groups.has(group)) {
            const entry = { kind: group, changes: [] };
            groups.set(group, entry);
            out.push(entry);
        }
        groups.get(group).changes.push(change);
    }

    return out;
};

/** How many changes the owner made, by key: a palette's colours count once, a pairing's faces once. */
export const countAsMade = (keys = []) => asMade(keys.map((key) => ({ key }))).length;

const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

/** The palette the new colours are, by name, or null when they are the owner's own mix. */
export const paletteNamed = (colourChanges = [], palettes = []) => {
    const now = Object.fromEntries(colourChanges.map((c) => [String(c.key).slice('brand.'.length), c.after]));
    const found = palettes.find((palette) => palette.colours
        && Object.entries(now).every(([role, value]) => same(palette.colours[role], value)));

    return found?.name ?? null;
};

/** The pairing the new faces are, by name, or null. */
export const pairingNamed = (typeChanges = [], pairings = []) => {
    const now = Object.fromEntries(typeChanges.map((c) => [String(c.key).slice('brand.font.'.length), c.after]));
    const found = pairings.find((pair) => Object.entries(now).every(([role, value]) => same(pair[role], value)));

    return found?.name ?? null;
};
