import { uploadWidget } from './upload.js';

/**
 * The Brand tab: a customer's colours and type, set on their own website while
 * they watch it change.
 *
 * Drawn only when the host hands the editor a brand (window.liveEditBrand):
 * the tokens it may set, each with the CSS custom property it drives, the
 * faces on offer, what this customer has chosen so far, and the id of the
 * style block that carries their choice. The design's own values are read off
 * the page by switching that block off for a moment, so "the design's own" is
 * always the template's real colour and never a guess.
 *
 * Every change previews at once by setting the property on <html>, which wins
 * over any :root rule. Saving writes each changed token as a setting, the same
 * way every other edit is saved, so it is a draft until published and appears
 * under Changes.
 *
 * Before saving, the page is checked for text a change has made hard to read:
 * every visible piece of text that read clearly in the design (4.5:1, or 3:1
 * when large) and no longer does. A brand that turns the buttons' words to
 * plum on teal is the kind of thing a customer only notices after publishing.
 */

// ---- colour arithmetic (pure, tested) ---------------------------------------

/** "#abc", "#aabbcc", "rgb(…)", "rgba(…)" → [r, g, b, a], or null. */
export const parseColour = (value) => {
    const s = String(value ?? '').trim().toLowerCase();
    let m = s.match(/^#([0-9a-f]{3,8})$/);
    if (m) {
        let h = m[1];
        if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
        if (h.length !== 6 && h.length !== 8) return null;
        const n = (i) => parseInt(h.slice(i, i + 2), 16);
        return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
    }
    m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
    if (m) {
        const a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
        return [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3]), a];
    }
    // color(srgb r g b / a), as computed colour-mix() results are reported
    m = s.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/);
    if (m) return [Math.round(m[1] * 255), Math.round(m[2] * 255), Math.round(m[3] * 255), m[4] === undefined ? 1 : +m[4]];

    return null;
};

export const toHex = (rgb) => '#' + rgb.slice(0, 3).map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();

const channel = (v) => {
    const c = v / 255;

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** WCAG contrast ratio of two opaque colours. */
export const contrast = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)];

    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** A foreground laid over a background, for a colour with transparency. */
export const over = (fg, bg) => {
    const a = fg[3] ?? 1;

    return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a))).concat(1);
};

/** The contrast text of this size needs to read: 3:1 when large, 4.5:1 otherwise. */
export const needs = (fontSizePx, fontWeight) => (fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700) ? 3 : 4.5);

// ---- reading the page --------------------------------------------------------

/**
 * Every visible element with words of its own, and the contrast it has now.
 * Elements over a picture are left out: their background is the photo, which
 * no colour arithmetic can read.
 */
export const readability = (doc = document) => {
    const win = doc.defaultView;
    const out = new Map();
    const opaqueBehind = (el) => {
        let layers = [];
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
            const cs = win.getComputedStyle(n);
            if (cs.backgroundImage && cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('linear-gradient')) return null;
            if (n.tagName === 'IMG' || n.tagName === 'VIDEO') return null;
            const c = parseColour(cs.backgroundColor);
            if (c && c[3] > 0) {
                layers.push(c);
                if (c[3] >= 1) break;
            }
        }
        let base = [255, 255, 255, 1];
        for (const layer of layers.reverse()) base = over(layer, base);

        return base;
    };
    for (const el of doc.body.querySelectorAll('*')) {
        if (el.closest('[data-live-edit-ui], .le-root') || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(el.tagName)) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!own) continue;
        const r = el.getBoundingClientRect();
        const cs = win.getComputedStyle(el);
        if (!r.width || !r.height || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        // a photo under the words, anywhere in the stack, e.g. a hero
        const bg = opaqueBehind(el);
        if (!bg) continue;
        const fg = parseColour(cs.color);
        if (!fg) continue;
        out.set(el, { ratio: contrast(over(fg, bg), bg), needs: needs(parseFloat(cs.fontSize), +cs.fontWeight || 400) });
    }

    return out;
};

/** Text that read in the design and no longer does, worst first. */
export const madeHardToRead = (before, after) => {
    const worse = [];
    for (const [el, now] of after) {
        const was = before.get(el);
        if (was && was.ratio >= was.needs && now.ratio < now.needs) worse.push({ el, ratio: now.ratio, needs: now.needs });
    }

    return worse.sort((a, b) => a.ratio - b.ratio);
};

// ---- ready-made choices -------------------------------------------------------

/**
 * Palettes an owner can try in one press. Each fills all seven colour roles and
 * keeps body text, captions and buttons readable on its own ground (the same
 * check as any colour runs before saving). Plain, field-tested combinations,
 * not trends: an ink, one accent, a light ground and its quiet partners.
 */
export const PALETTES = [
    { id: 'paper', name: 'Paper and ink', colours: { ink: '#15171A', accent: '#A8432A', surface: '#FAF8F4', raised: '#F0ECE4', body: '#2A2C30', muted: '#5F6268', line: '#DCD6CB' } },
    { id: 'forest', name: 'Forest', colours: { ink: '#17301F', accent: '#8F5A24', surface: '#F6F5EF', raised: '#E7EBDF', body: '#26312A', muted: '#5A655C', line: '#CFD6C7' } },
    { id: 'harbour', name: 'Harbour', colours: { ink: '#0F2A43', accent: '#1D63A3', surface: '#F6F8FB', raised: '#E6EEF5', body: '#1F2D3A', muted: '#526272', line: '#CBD7E2' } },
    { id: 'rose', name: 'Rose', colours: { ink: '#3A1D28', accent: '#B0435E', surface: '#FBF6F5', raised: '#F3E6E6', body: '#3A2A2E', muted: '#6E5C63', line: '#E3CFD2' } },
    { id: 'sand', name: 'Sand', colours: { ink: '#2E2418', accent: '#85622A', surface: '#F8F4EC', raised: '#EEE5D3', body: '#3A3126', muted: '#675D4F', line: '#DDD1BC' } },
    { id: 'terracotta', name: 'Terracotta', colours: { ink: '#2B1A14', accent: '#A84B24', surface: '#FBF7F2', raised: '#F2E8DE', body: '#33261F', muted: '#665549', line: '#E2D3C4' } },
    { id: 'graphite', name: 'Graphite', colours: { ink: '#141414', accent: '#454545', surface: '#FFFFFF', raised: '#F2F2F2', body: '#222222', muted: '#5E5E5E', line: '#DCDCDC' } },
];

/** A colour role's name short enough for one cell of the strip. */
const SHORT = { ink: 'Headings', accent: 'Links', surface: 'Page', raised: 'Cards', body: 'Text', muted: 'Captions', line: 'Borders' };

/** Heading and body faces that sit well together, by the ids the host offers. */
export const PAIRINGS = [
    { id: 'classic', name: 'Classic', display: 'fraunces', body: 'inter' },
    { id: 'editorial', name: 'Editorial', display: 'playfair', body: 'dmsans' },
    { id: 'modern', name: 'Modern', display: 'spacegrotesk', body: 'inter' },
    { id: 'clean', name: 'Clean', display: 'inter', body: 'inter' },
    { id: 'warm', name: 'Warm', display: 'georgia', body: 'system' },
];

// ---- the panel ---------------------------------------------------------------

/**
 * Draws the Brand tab into `container`.
 *
 * @param {{ container: HTMLElement, config: object, save: (key: string, value: string) => Promise<void>, done: (message: string) => void, notify: (message: string) => void, doc?: Document }} options
 */
export const renderBrandPanel = ({ container, config, save, upload, done, notify, doc = document }) => {
    const html = doc.documentElement;
    const win = doc.defaultView;
    const block = doc.getElementById(config.styleId);
    const chosen = { ...(config.chosen ?? {}) };
    const faces = new Map((config.faces ?? []).map((face) => [face.id, face]));

    // The design's own, with the customer's block switched off for a moment: its
    // colours, and how readable its words are, which is what any brand is judged
    // against (a brand saved last week is not the baseline for this week's).
    const design = {};
    if (block) block.disabled = true;
    const computed = win.getComputedStyle(html);
    for (const token of config.tokens) design[token.key] = computed.getPropertyValue(token.property).trim();
    const baseline = readability(doc);
    if (block) block.disabled = false;
    const pending = {}; // key -> value ('' = back to the design's own)
    const identity = config.identity ?? {};
    const identityOriginal = new Map();
    doc.querySelectorAll('[data-brand-name], [data-logo]').forEach((node) => identityOriginal.set(node, {
        text: node.textContent, src: node.getAttribute('src'), alt: node.getAttribute('alt'), aria: node.getAttribute('aria-label'),
    }));
    const brandHeaderNodes = () => {
        const nodes = new Set(doc.querySelectorAll('[data-brand-header]'));
        doc.querySelectorAll('header').forEach((header) => {
            const link = header.querySelector('a');
            if (link) nodes.add(link);
        });
        return [...nodes];
    };
    const brandHeaderOriginal = new Map(brandHeaderNodes().map((node) => [node, [...node.childNodes].map((child) => child.cloneNode(true))]));
    const identityValue = (key) => key in pending ? pending[key] : (key === identity.nameKey ? identity.name : identity.logo) || '';
    const previewIdentity = () => {
        const name = identity.nameKey ? identityValue(identity.nameKey) : '';
        const logo = identity.logoKey ? identityValue(identity.logoKey) : '';
        brandHeaderOriginal.forEach((children, node) => node.replaceChildren(...children.map((child) => child.cloneNode(true))));
        identityOriginal.forEach((original, node) => {
            if (node.hasAttribute('data-brand-name')) node.textContent = original.text;
            for (const [attr, value] of [['src', original.src], ['alt', original.alt], ['aria-label', original.aria]]) {
                if (value === null) node.removeAttribute(attr); else node.setAttribute(attr, value);
            }
        });
        if (name || logo) brandHeaderNodes().forEach((node) => {
            if (logo) {
                const image = doc.createElement('img');
                image.src = logo;
                image.alt = name || 'Business logo';
                image.style.cssText = 'height:32px;width:auto;max-width:180px;object-fit:contain;display:block';
                node.replaceChildren(image);
            } else {
                node.textContent = name;
            }
        });
        if (name) {
            doc.querySelectorAll('[data-brand-name]').forEach((node) => { node.textContent = name; });
            doc.querySelectorAll('[data-logo]').forEach((node) => { node.setAttribute('aria-label', name); if (node.tagName === 'IMG') node.alt = name; });
        }
        if (logo) doc.querySelectorAll('img[data-logo]').forEach((node) => { node.src = logo; });
    };

    const current = (token) => (token.key in pending ? pending[token.key] : (chosen[token.key] ?? ''));
    const colourShown = (token) => {
        const value = current(token);
        const parsed = parseColour(value || design[token.key]);

        return parsed ? toHex(parsed) : '#000000';
    };

    const fontLink = (face) => {
        if (!face?.webfont || doc.querySelector(`link[data-le-brand-font="${face.id}"]`)) return;
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${face.webfont}&display=swap`;
        link.dataset.leBrandFont = face.id;
        doc.head.append(link);
    };

    const preview = () => {
        for (const token of config.tokens) {
            const value = current(token);
            if (value === '') {
                // the design's own: drop the customer's override for this token too
                html.style.setProperty(token.property, design[token.key]);
            } else if (token.kind === 'face') {
                const face = faces.get(value);
                if (face) {
                    fontLink(face);
                    html.style.setProperty(token.property, face.stack);
                }
            } else {
                html.style.setProperty(token.property, value);
            }
        }
        previewIdentity();
        check();
    };

    const unpreview = () => {
        config.tokens.forEach((token) => html.style.removeProperty(token.property));
        identityOriginal.forEach((original, node) => {
            if (node.hasAttribute('data-brand-name')) node.textContent = original.text;
            for (const [attr, value] of [['src', original.src], ['alt', original.alt], ['aria-label', original.aria]]) {
                if (value === null) node.removeAttribute(attr); else node.setAttribute(attr, value);
            }
        });
        brandHeaderOriginal.forEach((children, node) => node.replaceChildren(...children.map((child) => child.cloneNode(true))));
    };

    const el = (tag, className, text) => {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;

        return node;
    };

    container.replaceChildren();

    const colourTokens = config.tokens.filter((t) => t.kind === 'colour');
    const faceTokens = config.tokens.filter((t) => t.kind === 'face');
    const tokenByRole = (role) => config.tokens.find((t) => t.key.endsWith(`.${role}`));
    const shownFor = (key) => colourShown(config.tokens.find((t) => t.key === key));

    // ---- who you are: the name and logo first, because they are the brand a
    //      visitor reads before any colour
    if (identity.nameKey || identity.logoKey) {
        container.append(el('div', 'le-section-heading', 'Name and logo'));
        const fields = el('div', 'le-brand-type');
        if (identity.nameKey) {
            const row = el('label', 'le-brand-face');
            row.append(el('span', 'le-brand-label', 'Business name'));
            const input = el('input', 'le-input'); input.maxLength = 120; input.value = identityValue(identity.nameKey); input.placeholder = 'Business name';
            input.addEventListener('input', () => { pending[identity.nameKey] = input.value; changed(); });
            row.append(input); fields.append(row);
        }
        if (identity.logoKey) {
            const row = el('div', 'le-brand-face'); row.append(el('span', 'le-brand-label', 'Logo'));
            const logoFields = el('div', 'le-brand-logo-fields');
            const input = el('input', 'le-input'); input.type = 'url'; input.value = identityValue(identity.logoKey); input.placeholder = 'Paste a logo URL';
            input.addEventListener('input', () => { pending[identity.logoKey] = input.value.trim(); changed(); });
            logoFields.append(input);
            if (upload) {
                const picker = uploadWidget({
                    hint: 'Choose an image file',
                    compact: true,
                    onFile: async (file) => {
                        try { input.value = await upload(file); pending[identity.logoKey] = input.value; changed(); }
                        catch (error) { notify(error?.message || 'Your logo could not be uploaded.'); }
                    },
                });
                picker.setAttribute('aria-label', 'Upload logo');
                logoFields.append(picker);
            }
            row.append(logoFields);
            fields.append(row);
        }
        container.append(fields);
    }

    // ---- colours: whole palettes first, chosen by how they look; then the
    //      palette in use, one strip, each colour pressable
    const palettes = [{ id: 'own', name: "The design's own", colours: null }, ...PALETTES]
        .filter((palette) => palette.colours === null || colourTokens.every((t) => palette.colours[t.key.split('.').pop()]));
    const paletteValue = (palette, token) => (palette.colours ? palette.colours[token.key.split('.').pop()] : '');
    const onPalette = (palette) => colourTokens.every((t) => {
        const now = current(t);

        return palette.colours === null ? now === '' : String(now).toUpperCase() === paletteValue(palette, t).toUpperCase();
    });

    container.append(el('div', 'le-section-heading', 'Colours'));
    container.append(el('p', 'le-hint le-brand-intro', 'Try a palette on your site, then adjust any colour. Nothing goes live until you publish.'));
    const paletteGrid = el('div', 'le-palettes');
    const paletteButtons = palettes.map((palette) => {
        const button = el('button', 'le-palette');
        button.type = 'button';
        const strip = el('span', 'le-palette-strip');
        for (const t of colourTokens) {
            const chip = el('span', 'le-palette-chip');
            chip.style.background = palette.colours ? paletteValue(palette, t) : design[t.key];
            strip.append(chip);
        }
        // the palette's own words on its own ground: what a page in it reads like
        const sample = el('span', 'le-palette-sample', 'Aa');
        const ground = palette.colours ? palette.colours.surface : design[tokenByRole('surface')?.key];
        const ink = palette.colours ? palette.colours.ink : design[tokenByRole('ink')?.key];
        sample.style.background = ground;
        sample.style.color = ink;
        const row = el('span', 'le-palette-top');
        row.append(sample, strip);
        button.append(row, el('span', 'le-palette-name', palette.name));
        button.setAttribute('aria-label', `Try the ${palette.name} palette`);
        button.addEventListener('click', () => {
            for (const t of colourTokens) pending[t.key] = paletteValue(palette, t);
            changed();
        });
        paletteGrid.append(button);

        return [palette, button];
    });
    container.append(paletteGrid);

    // the palette in use, as one strip: press a colour to change it
    const inUse = el('div', 'le-brand-strip');
    const stripInputs = new Map();
    for (const token of colourTokens) {
        const cell = el('label', 'le-brand-strip-cell');
        cell.title = `${token.label}: ${token.hint}`;
        const input = el('input', 'le-brand-strip-input');
        input.type = 'color';
        input.setAttribute('aria-label', token.label);
        input.addEventListener('input', () => { pending[token.key] = input.value.toUpperCase(); changed(); });
        cell.append(input, el('span', 'le-brand-strip-name', SHORT[token.key.split('.').pop()] ?? token.label));
        stripInputs.set(token.key, [cell, input]);
        inUse.append(cell);
    }
    container.append(el('p', 'le-brand-label le-brand-strip-head', 'Your colours'), inUse);

    // ---- type: pairs of faces, each shown in itself
    const pairings = [{ id: 'own', name: "The design's own", display: '', body: '' }, ...PAIRINGS]
        .filter((pair) => pair.id === 'own' || (faces.has(pair.display) && faces.has(pair.body)));
    const displayToken = faceTokens.find((t) => t.key.endsWith('display')) ?? faceTokens[0];
    const bodyToken = faceTokens.find((t) => t.key.endsWith('body')) ?? faceTokens[1];
    const pairButtons = [];
    if (displayToken && bodyToken) {
        container.append(el('div', 'le-section-heading', 'Type'));
        const pairGrid = el('div', 'le-pairs');
        for (const pair of pairings) {
            const button = el('button', 'le-pair');
            button.type = 'button';
            const head = faces.get(pair.display);
            const body = faces.get(pair.body);
            fontLink(head); fontLink(body);
            const big = el('span', 'le-pair-big', 'Aa');
            big.style.fontFamily = head ? head.stack : computed.getPropertyValue(displayToken.property);
            const line = el('span', 'le-pair-line', head && body ? `${head.name} and ${body.name}` : 'As your template was designed');
            line.style.fontFamily = body ? body.stack : computed.getPropertyValue(bodyToken.property);
            button.append(big, el('span', 'le-pair-name', pair.name), line);
            button.addEventListener('click', () => { pending[displayToken.key] = pair.display; pending[bodyToken.key] = pair.body; changed(); });
            pairGrid.append(button);
            pairButtons.push([pair, button]);
        }
        container.append(pairGrid);
    }

    // ---- every colour and face one by one, for whoever wants that much control
    const fine = el('details', 'le-style-group le-brand-fine');
    fine.append(el('summary', 'le-section-heading', 'Fine-tune each colour and face'));
    const swatches = el('div', 'le-brand-grid');
    const rowInputs = new Map();
    for (const token of colourTokens) {
        const row = el('label', 'le-brand-row');
        const input = el('input', 'le-brand-swatch');
        input.type = 'color';
        input.setAttribute('aria-label', token.label);
        const words = el('span', 'le-brand-words');
        words.append(el('span', 'le-brand-label', token.label), el('span', 'le-brand-hint', token.hint));
        const reset = el('button', 'le-link-btn', "Design's own");
        reset.type = 'button';
        reset.addEventListener('click', (event) => { event.preventDefault(); pending[token.key] = ''; changed(); });
        input.addEventListener('input', () => { pending[token.key] = input.value.toUpperCase(); changed(); });
        row.append(input, words, reset);
        rowInputs.set(token.key, [input, reset]);
        swatches.append(row);
    }
    const type = el('div', 'le-brand-type');
    const selects = new Map();
    for (const token of faceTokens) {
        const row = el('label', 'le-brand-face');
        row.append(el('span', 'le-brand-label', token.label));
        const select = el('select', 'le-input');
        const own = el('option', null, "The design's own");
        own.value = '';
        select.append(own);
        for (const face of faces.values()) {
            const option = el('option', null, face.name);
            option.value = face.id;
            option.style.fontFamily = face.stack;
            select.append(option);
        }
        select.addEventListener('change', () => { pending[token.key] = select.value; changed(); });
        row.append(select);
        selects.set(token.key, select);
        type.append(row);
    }
    fine.append(swatches, type);
    container.append(fine);

    // Everything above shows the same choice, wherever it was made.
    const paint = () => {
        for (const token of colourTokens) {
            const hex = colourShown(token);
            const [cell, input] = stripInputs.get(token.key);
            input.value = hex;
            cell.style.background = hex;
            cell.classList.toggle('is-dark', luminance(parseColour(hex)) < 0.25);
            const [rowInput, reset] = rowInputs.get(token.key);
            rowInput.value = hex;
            reset.hidden = current(token) === '';
        }
        selects.forEach((select, key) => { select.value = current(config.tokens.find((t) => t.key === key)); });
        paletteButtons.forEach(([palette, button]) => button.classList.toggle('is-on', onPalette(palette)));
        pairButtons.forEach(([pair, button]) => button.classList.toggle('is-on', current(displayToken) === pair.display && current(bodyToken) === pair.body));
    };
    paint();

    // The verdict and the buttons stay in view however long the list gets.
    const dock = el('div', 'le-brand-dock');
    const warning = el('div', 'le-brand-warning');
    warning.hidden = true;
    dock.append(warning);

    const actions = el('div', 'le-row le-brand-actions');
    const cancel = el('button', 'le-btn-outline', 'Cancel');
    cancel.type = 'button';
    const apply = el('button', 'le-btn', 'Save brand');
    apply.type = 'button';
    apply.disabled = true;
    actions.append(cancel, apply);
    dock.append(actions);
    container.append(dock);

    let checking = 0;
    const check = () => {
        win.clearTimeout(checking);
        checking = win.setTimeout(() => {
            const worse = madeHardToRead(baseline, readability(doc));
            warning.replaceChildren();
            warning.hidden = worse.length === 0;
            if (!worse.length) return;
            const first = worse[0];
            const words = (first.el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
            warning.append(el('strong', null, worse.length === 1 ? 'One place on this page becomes hard to read' : `${worse.length} places on this page become hard to read`));
            warning.append(el('span', null, `. “${words}” is ${first.ratio.toFixed(1)}:1 and needs ${first.needs}:1.`));
            const show = el('button', 'le-link-btn', 'Show me');
            show.type = 'button';
            show.addEventListener('click', () => {
                first.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                first.el.animate?.([{ outline: '3px solid #E5484D', outlineOffset: '3px' }, { outline: '3px solid transparent', outlineOffset: '3px' }], { duration: 1600 });
            });
            warning.append(show);
        }, 120);
    };

    const changed = () => {
        paint();
        apply.disabled = Object.keys(pending).every((key) => pending[key] === (chosen[key] ?? (key === identity.nameKey ? identity.name : key === identity.logoKey ? identity.logo : '')));
        preview();
    };

    cancel.addEventListener('click', () => {
        Object.keys(pending).forEach((key) => delete pending[key]);
        unpreview();
        done('');
    });

    apply.addEventListener('click', async () => {
        const keys = Object.keys(pending).filter((key) => pending[key] !== (chosen[key] ?? (key === identity.nameKey ? identity.name : key === identity.logoKey ? identity.logo : '')));
        if (!keys.length) return;
        apply.disabled = true;
        apply.textContent = 'Saving…';
        try {
            for (const key of keys) await save(key, pending[key]);
            done('Brand saved ✓ Publish to put it on your website');
        } catch (error) {
            notify(error?.message || 'Your brand could not be saved.');
            apply.disabled = false;
            apply.textContent = 'Save brand';
        }
    });

    // A brand already chosen is checked as soon as the tab opens.
    if (Object.keys(chosen).length) check();

    return { unpreview };
};
