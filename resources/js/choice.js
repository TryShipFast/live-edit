/**
 * A card's setting that its words do not show: the category a filter sorts it by.
 *
 * Most filters can read a card's own words ("Guide · 18 Aug 2026" is a Guide),
 * and a site should prefer that. Some cannot: a gallery photo has no caption
 * that says "Exterior", a project card names its client and not its sector. The
 * card then carries the category in an attribute the visitor never sees, and an
 * owner who adds or copies a card has no way to say which filter it belongs to,
 * so the copy is filed under its original's category for ever.
 *
 * The site declares it on the list (data-edit-choice-attr names the attribute
 * the items carry), and where its choices come from: the filter's own controls
 * (data-edit-choice-from, a selector; data-edit-choice-value, the attribute on
 * each control holding its value, `value` when absent). So the choices are the
 * filter's, in the filter's order and words, and a chip the owner renames is
 * renamed here too. data-edit-choice-many says an item may belong to several
 * (a space-separated list). Each item carries its own key (data-edit-choice).
 */

const ALL = /^(all|\*|)$/i;

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

/** The list's declaration, or null when its items carry no such setting. */
export const choiceOf = (list) => {
    const attr = list?.dataset?.editChoiceAttr ?? '';
    if (!/^data-[a-z0-9-]+$/.test(attr)) return null;

    return {
        attr,
        label: (list.dataset.editChoiceLabel ?? '').trim() || 'Category',
        from: list.dataset.editChoiceFrom ?? '',
        value: list.dataset.editChoiceValue || 'value',
        many: list.hasAttribute('data-edit-choice-many'),
    };
};

/** The choices on offer, in the filter's order: [{ value, label }]. */
export const choicesFor = (choice, root = document) => {
    if (!choice?.from) return [];
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

/** What the item holds now, as a list of values. */
export const chosen = (item, choice) => {
    const now = item.getAttribute(choice.attr) ?? '';

    return choice.many ? now.split(/\s+/).filter(Boolean) : (now ? [now] : []);
};

/** The key an item's choice is saved under, or '' when it has none. */
export const choiceKey = (item) => {
    const marker = item?.getAttribute?.('data-edit-choice') ?? '';

    return marker.startsWith('setting:') ? marker.slice('setting:'.length) : '';
};

/**
 * Put a saved choice on the page: the attribute the site's filter reads.
 * The list may sit anywhere above the item (a list of groups of items).
 */
export const applyChoices = (root, settings) => {
    let applied = 0;
    for (const item of root.querySelectorAll('[data-edit-choice]')) {
        const key = choiceKey(item);
        if (!key || !Object.hasOwn(settings, key)) continue;
        const choice = choiceOf(item.closest('[data-edit-choice-attr]'));
        if (!choice) continue;
        item.setAttribute(choice.attr, String(settings[key]));
        applied++;
    }

    return applied;
};

/**
 * The control in the item's panel: a select for one choice, boxes for several.
 * `save(value)` stores it; the page is updated at once so the owner can try the
 * filter straight away.
 */
export const renderChoice = ({ item, list, save, notify = () => {} }) => {
    const choice = choiceOf(item.closest('[data-edit-choice-attr]') ?? list);
    const key = choiceKey(item);
    if (!choice || !key) return null;
    const options = choicesFor(choice, item.ownerDocument);
    if (!options.length) return null;
    const current = chosen(item, choice);

    const wrap = document.createElement('div');
    wrap.className = 'le-field le-choice';
    const name = document.createElement(choice.many ? 'p' : 'label');
    name.className = 'le-label';
    name.textContent = choice.label;
    wrap.append(name);

    const store = async (value, was) => {
        item.setAttribute(choice.attr, value);
        try {
            await save(key, value);
            notify(`${choice.label} saved ✓`);
        } catch (error) {
            item.setAttribute(choice.attr, was);
            notify(error.message);
        }
    };

    if (choice.many) {
        const boxes = document.createElement('div');
        boxes.className = 'le-choice-boxes';
        for (const option of options) {
            const row = document.createElement('label');
            row.className = 'le-check';
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.value = option.value;
            box.checked = current.includes(option.value);
            box.addEventListener('change', () => {
                const was = item.getAttribute(choice.attr) ?? '';
                const picked = [...boxes.querySelectorAll('input:checked')].map((b) => b.value);
                store(picked.join(' '), was);
            });
            row.append(box, document.createTextNode(` ${option.label}`));
            boxes.append(row);
        }
        wrap.append(boxes);
    } else {
        const select = document.createElement('select');
        select.className = 'le-input';
        const id = `le-choice-${Math.random().toString(36).slice(2, 8)}`;
        select.id = id;
        name.htmlFor = id;
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
        select.addEventListener('change', () => store(select.value, current[0] ?? ''));
        wrap.append(select);
    }

    const hint = document.createElement('p');
    hint.className = 'le-hint';
    hint.textContent = `Where the filter on this page shows it. Visitors see the result, not this setting.`;
    wrap.append(hint);

    return wrap;
};
