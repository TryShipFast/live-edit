/**
 * Settings a card's words do not show: the categories a filter sorts it by.
 *
 * Most filters can read a card's own words ("Guide · 18 Aug 2026" is a Guide),
 * and a site should prefer that. Some cannot: a gallery photo has no caption
 * that says "Exterior", a course card does not print its start month. The card
 * then carries the category in an attribute the visitor never sees, and an
 * owner who adds or copies a card has no way to say where it belongs, so the
 * copy is filed under its original's category for ever.
 *
 * The site declares them on the list, as JSON in data-edit-choices: for each,
 * the attribute the items carry (attr), the owner's name for it (label), the
 * filter controls whose values are the choices (from, a selector), the
 * attribute on each control holding its value (value, `value` when absent, so
 * radios and options work as they are), and whether an item may hold several
 * (many: a space-separated list). So the choices are the filter's, in its order
 * and its words, and a chip the owner renames is renamed here too.
 *
 * Each item carries one key (data-edit-choice); its value is a JSON object of
 * the item's settings, {"data-faculty": "se", "data-modes": "full part"}.
 */

const ALL = /^(all|\*|)$/i;
const ATTR = /^data-[a-z0-9-]+$/;

/** What a control says, without the count some filters show beside it ("Guides (4)"). */
export const choiceLabel = (control) => {
    let source = control;
    if (control.tagName === 'INPUT') source = control.closest('label') ?? (control.id ? control.ownerDocument.querySelector(`label[for="${CSS.escape(control.id)}"]`) : null) ?? control;
    const copy = source.cloneNode(true);
    for (const inner of copy.querySelectorAll('input, svg, [aria-hidden="true"]')) inner.remove();
    for (const inner of copy.querySelectorAll('*')) {
        if (/^\(?\s*\d+\s*\)?$/.test(inner.textContent.trim())) inner.remove();
    }
    const words = copy.textContent.replace(/\s+/g, ' ').trim().replace(/\s*\(\s*\d+\s*\)$/, '').trim();

    return words || (control.getAttribute('aria-label') ?? '').trim();
};

/** The list's declarations: [{ attr, label, from, value, many }], empty when it has none. */
export const choicesOf = (list) => {
    let declared = [];
    try {
        declared = JSON.parse(list?.getAttribute?.('data-edit-choices') || '[]');
    } catch {
        return [];
    }

    return (Array.isArray(declared) ? declared : [])
        .filter((choice) => ATTR.test(choice?.attr ?? '') && typeof choice.from === 'string' && choice.from !== '')
        .map((choice) => ({
            attr: choice.attr,
            label: String(choice.label ?? '').trim() || 'Category',
            from: choice.from,
            value: choice.value || 'value',
            many: Boolean(choice.many),
        }));
};

/** The choices on offer for one setting, in the filter's order: [{ value, label }]. */
export const optionsFor = (choice, root = document) => {
    let controls = [];
    try {
        controls = [...root.querySelectorAll(choice.from)];
    } catch {
        return [];
    }
    const seen = new Set();
    const out = [];
    for (const control of controls) {
        const value = (choice.value === 'value' && 'value' in control ? control.value : control.getAttribute(choice.value)) ?? '';
        if (ALL.test(value.trim()) || seen.has(value)) continue;
        seen.add(value);
        out.push({ value, label: choiceLabel(control) || value });
    }

    return out;
};

/** What the item holds now for one setting, as a list of values. */
export const chosen = (item, choice) => {
    const now = item.getAttribute(choice.attr) ?? '';

    return choice.many ? now.split(/\s+/).filter(Boolean) : (now ? [now] : []);
};

/** The key an item's settings are saved under, or '' when it has none. */
export const choiceKey = (item) => {
    const marker = item?.getAttribute?.('data-edit-choice') ?? '';

    return marker.startsWith('setting:') ? marker.slice('setting:'.length) : '';
};

/** The saved object, or null when it is not one. */
const parsed = (value) => {
    try {
        const object = JSON.parse(String(value));
        return object && typeof object === 'object' && !Array.isArray(object) ? object : null;
    } catch {
        return null;
    }
};

/**
 * Put saved settings on the page: the attributes the site's filter reads. Only
 * attributes the list declares are written, so a saved value cannot reach any
 * other attribute. The list may sit anywhere above the item.
 */
export const applyChoices = (root, settings) => {
    let applied = 0;
    for (const item of root.querySelectorAll('[data-edit-choice]')) {
        const key = choiceKey(item);
        if (!key || !Object.hasOwn(settings, key)) continue;
        const saved = parsed(settings[key]);
        if (!saved) continue;
        for (const choice of choicesOf(item.closest('[data-edit-choices]'))) {
            if (Object.hasOwn(saved, choice.attr) && ['string', 'number'].includes(typeof saved[choice.attr])) {
                item.setAttribute(choice.attr, String(saved[choice.attr]));
                applied++;
            }
        }
    }

    return applied;
};

/**
 * The controls in the item's panel: a select for one choice, boxes for several,
 * one per declared setting. `save(key, json)` stores all of the item's settings
 * together; the page is updated at once so the owner can try the filter.
 */
export const renderChoice = ({ item, list, save, notify = () => {} }) => {
    const choices = choicesOf(item.closest('[data-edit-choices]') ?? list);
    const key = choiceKey(item);
    if (!choices.length || !key) return null;

    const wrap = document.createElement('div');
    wrap.className = 'le-card-settings';

    const store = async (choice, value) => {
        const was = item.getAttribute(choice.attr) ?? '';
        item.setAttribute(choice.attr, value);
        const all = Object.fromEntries(choices.map((c) => [c.attr, item.getAttribute(c.attr) ?? '']));
        try {
            await save(key, JSON.stringify(all));
            notify(`${choice.label} saved ✓`);
        } catch (error) {
            item.setAttribute(choice.attr, was);
            notify(error.message);
        }
    };

    for (const choice of choices) {
        const options = optionsFor(choice, item.ownerDocument);
        if (!options.length) continue;
        const current = chosen(item, choice);
        const field = document.createElement('div');
        field.className = 'le-field le-card-setting';
        const name = document.createElement(choice.many ? 'p' : 'label');
        name.className = 'le-label';
        name.textContent = choice.label;
        field.append(name);

        if (choice.many) {
            const boxes = document.createElement('div');
            boxes.className = 'le-card-setting-boxes';
            for (const option of options) {
                const row = document.createElement('label');
                row.className = 'le-check';
                const box = document.createElement('input');
                box.type = 'checkbox';
                box.value = option.value;
                box.checked = current.includes(option.value);
                box.addEventListener('change', () => {
                    store(choice, [...boxes.querySelectorAll('input:checked')].map((b) => b.value).join(' '));
                });
                row.append(box, document.createTextNode(` ${option.label}`));
                boxes.append(row);
            }
            field.append(boxes);
        } else {
            const select = document.createElement('select');
            select.className = 'le-input';
            select.id = `le-choice-${Math.random().toString(36).slice(2, 8)}`;
            name.htmlFor = select.id;
            // A value the filter no longer offers stays visible rather than being silently replaced.
            const known = new Set(options.map((o) => o.value));
            for (const option of [...options, ...current.filter((v) => !known.has(v)).map((v) => ({ value: v, label: v }))]) {
                const element = document.createElement('option');
                element.value = option.value;
                element.textContent = option.label;
                element.selected = current[0] === option.value;
                select.append(element);
            }
            if (!current.length) {
                const none = document.createElement('option');
                none.value = '';
                none.textContent = 'Choose…';
                none.selected = true;
                select.prepend(none);
            }
            select.addEventListener('change', () => store(choice, select.value));
            field.append(select);
        }
        wrap.append(field);
    }
    if (!wrap.children.length) return null;

    const hint = document.createElement('p');
    hint.className = 'le-hint';
    hint.textContent = 'Where the filter on this page shows it. Visitors see the result, not these settings.';
    wrap.append(hint);

    return wrap;
};
