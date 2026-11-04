/**
 * The form builder's window: a form's questions, as the owner shapes them.
 *
 * Works on a copy of the form (forms.js) and saves it once, as the form's setting, when the owner
 * presses Save; the host then draws it in the template's own form kit and the page is opened again
 * with the builder where it was. Every rule is said where it applies, in plain words: a question a
 * workflow needs stays, a question with answers keeps its kind, a question taken off keeps its answers.
 */

import {
    HAS_OPTIONS, TYPE_NAMES, addField, addOption, copyOf, definitionOf, limitsSaid, moveField, removeOption, rename,
    renameOption, requiredLockedBecause, restoreField, retireField, setHelp, setRequired, setType, startBlank, staysBecause,
    typeLockedBecause,
} from './forms.js';

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;

    return node;
};

const button = (label, className = 'le-btn-outline', onClick = null) => {
    const b = el('button', className, label);
    b.type = 'button';
    if (onClick) b.addEventListener('click', onClick);

    return b;
};

/**
 * @param {object} deps
 * @param {object} deps.ui        a modal handle (chrome.js ui.modal)
 * @param {object} deps.form      the form as handed over (window.liveEditForms.forms[key]) or seeded
 * @param {string[]} deps.types   the kinds of field this website may add
 * @param {(definition: object) => Promise<void>} deps.save
 * @param {() => void} deps.saved after a save: the page is drawn again
 * @param {string|null} deps.open the question to open first
 */
export function renderFormBuilder({ ui, form: handed, types, save, saved, open = null }) {
    const form = copyOf(handed);
    let opened = open;
    let said = '';
    let changed = false;

    const error = el('p', 'le-fb-error');
    error.setAttribute('role', 'alert');

    const tell = (message) => {
        said = message ?? '';
        error.textContent = said;
        error.hidden = !said;
    };
    const apply = (refusal) => {
        if (refusal) {
            tell(refusal);

            return false;
        }
        tell('');
        changed = true;
        draw();

        return true;
    };

    const typeSelect = (field) => {
        const select = el('select', 'le-input');
        select.setAttribute('aria-label', 'Kind of answer');
        const offered = new Set([...types, field.type]);
        for (const type of Object.keys(TYPE_NAMES)) {
            if (!offered.has(type)) continue;
            const option = el('option', null, TYPE_NAMES[type]);
            option.value = type;
            option.selected = type === field.type;
            select.append(option);
        }
        const locked = typeLockedBecause(field);
        if (locked) select.disabled = true;
        select.addEventListener('change', () => apply(setType(form, field.key, select.value)));

        return { select, locked };
    };

    const editorFor = (field) => {
        const box = el('div', 'le-fb-edit');

        const question = el('label', 'le-field', 'Question');
        const words = el('input', 'le-input');
        words.value = field.label;
        words.maxLength = 200;
        words.addEventListener('change', () => apply(rename(form, field.key, words.value)) || (words.value = field.label));
        question.append(words);

        const helpField = el('label', 'le-field', 'Help text (optional)');
        const help = el('input', 'le-input');
        help.value = field.help ?? '';
        help.maxLength = 300;
        help.placeholder = 'A line under the question, such as “We only call to confirm.”';
        help.addEventListener('change', () => apply(setHelp(form, field.key, help.value)));
        helpField.append(help);

        const kind = el('label', 'le-field', 'Kind of answer');
        const { select, locked } = typeSelect(field);
        kind.append(select);
        if (locked) kind.append(el('span', 'le-hint', locked));

        const must = el('label', 'le-check');
        const tick = el('input');
        tick.type = 'checkbox';
        tick.checked = Boolean(field.required);
        const requiredWhy = requiredLockedBecause(field);
        tick.disabled = Boolean(requiredWhy);
        tick.addEventListener('change', () => apply(setRequired(form, field.key, tick.checked)));
        must.append(tick, document.createTextNode(' Must be filled in'));

        box.append(question, helpField, kind, must);
        if (requiredWhy) box.append(el('p', 'le-hint', requiredWhy));
        else if (form.submissions > 0) box.append(el('p', 'le-hint', 'Required or not applies to new answers only.'));

        if (HAS_OPTIONS.has(field.type)) {
            const choices = el('div', 'le-fb-choices');
            choices.append(el('span', 'le-fb-sub', 'Choices'));
            if (field.choices === 'template') {
                choices.append(el('p', 'le-hint', 'These choices are words on your page. Close this and press the dropdown on the page to change, add or remove one.'));
                const list = el('ul', 'le-fb-option-list');
                for (const option of field.options.filter((o) => !o.retired)) list.append(el('li', null, option.label));
                choices.append(list);
            } else {
                for (const option of field.options.filter((o) => !o.retired)) {
                    const row = el('div', 'le-fb-option');
                    const input = el('input', 'le-input');
                    input.value = option.label;
                    input.setAttribute('aria-label', 'Choice');
                    input.addEventListener('change', () => apply(renameOption(form, field.key, option.value, input.value)));
                    row.append(input, button('Remove', 'le-btn-outline le-fb-small', () => apply(removeOption(form, field.key, option.value))));
                    choices.append(row);
                }
                const adding = el('div', 'le-fb-option');
                const input = el('input', 'le-input');
                input.placeholder = 'Another choice';
                input.setAttribute('aria-label', 'Another choice');
                const add = button('Add', 'le-btn-outline le-fb-small', () => apply(addOption(form, field.key, input.value)));
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        add.click();
                    }
                });
                adding.append(input, add);
                choices.append(adding);
                const gone = field.options.filter((o) => o.retired);
                if (gone.length) choices.append(el('p', 'le-hint', `Taken off the list, kept for earlier answers: ${gone.map((o) => o.label).join(', ')}.`));
            }
            box.append(choices);
        }

        const stays = staysBecause(field);
        if (stays) {
            box.append(el('p', 'le-hint', stays));
        } else {
            box.append(button('Take it off the form', 'le-btn-outline le-fb-off', () => {
                const had = field.answers > 0 || field.seeded || form.saved;
                if (apply(retireField(form, field.key)) && had) tell('');
                opened = null;
                draw();
            }));
            if (field.answers > 0) box.append(el('p', 'le-hint', 'Its answers stay in your enquiries and the spreadsheet.'));
        }

        return box;
    };

    const rowFor = (field, at, count) => {
        const row = el('li', 'le-fb-field');
        row.dataset.field = field.key;
        const head = el('div', 'le-fb-head');
        const name = el('button', 'le-fb-name');
        name.type = 'button';
        name.setAttribute('aria-expanded', opened === field.key ? 'true' : 'false');
        name.append(el('span', 'le-fb-label', field.label));
        const about = [TYPE_NAMES[field.type] ?? field.type, field.required ? 'must be filled in' : 'optional'];
        if (field.answers > 0) about.push(field.answers === 1 ? '1 answer' : `${field.answers} answers`);
        name.append(el('span', 'le-fb-about', about.join(' · ')));
        if (field.protected) name.append(el('span', 'le-fb-badge', field.protected));
        name.addEventListener('click', () => {
            opened = opened === field.key ? null : field.key;
            draw();
        });
        const up = button('↑', 'le-btn-outline le-fb-move', () => apply(moveField(form, field.key, -1) ? null : 'It is first already.'));
        up.setAttribute('aria-label', `Move “${field.label}” up`);
        up.disabled = at === 0;
        const down = button('↓', 'le-btn-outline le-fb-move', () => apply(moveField(form, field.key, 1) ? null : 'It is last already.'));
        down.setAttribute('aria-label', `Move “${field.label}” down`);
        down.disabled = at === count - 1;
        head.append(name, up, down);
        row.append(head);
        if (opened === field.key) row.append(editorFor(field));

        return row;
    };

    const draw = () => {
        const shown = form.fields.filter((f) => !f.retired);
        const off = form.fields.filter((f) => f.retired);
        const body = [];

        for (const line of limitsSaid(form)) body.push(el('p', 'le-fb-notice', line));
        if (!handed.saved && form.fields.length) body.push(el('p', 'le-hint', 'These are the questions your form asks now. Change any of them, add your own, then press Save.'));

        const list = el('ol', 'le-fb-list');
        shown.forEach((field, at) => list.append(rowFor(field, at, shown.length)));
        if (!shown.length) body.push(el('p', 'le-hint', 'This form asks nothing yet. Add a question below.'));
        body.push(list);

        const adder = el('div', 'le-fb-add');
        const kind = el('select', 'le-input');
        kind.setAttribute('aria-label', 'Kind of question to add');
        for (const type of types) {
            const option = el('option', null, TYPE_NAMES[type] ?? type);
            option.value = type;
            kind.append(option);
        }
        adder.append(kind, button('+ Add a question', 'le-btn', () => {
            const key = addField(form, kind.value);
            opened = key;
            changed = true;
            tell('');
            draw();
            ui.body.querySelector(`[data-field="${key}"] input`)?.focus();
        }));
        body.push(adder);

        if (off.length) {
            const gone = el('div', 'le-fb-off-list');
            gone.append(el('span', 'le-fb-sub', 'Taken off the form'));
            gone.append(el('p', 'le-hint', 'Not shown to visitors. Answers already sent to them stay in your enquiries and the spreadsheet.'));
            for (const field of off) {
                const row = el('div', 'le-fb-option');
                row.append(el('span', 'le-fb-label', field.label), button('Put it back', 'le-btn-outline le-fb-small', () => {
                    restoreField(form, field.key);
                    changed = true;
                    draw();
                }));
                gone.append(row);
            }
            body.push(gone);
        }

        body.push(error);
        error.hidden = !said;
        ui.body.replaceChildren(...body);
    };

    // The foot: start blank, cancel, save.
    ui.foot.hidden = false;
    const blank = button('Start blank', 'le-btn-outline', () => {
        startBlank(form);
        opened = null;
        changed = true;
        tell(form.fields.some((f) => f.protected && !f.retired) ? 'The questions your website needs are kept. Add your own below.' : '');
        draw();
    });
    const cancel = button('Cancel', 'le-btn-outline', () => ui.close());
    const keep = button('Save the form', 'le-btn le-btn-publish', async () => {
        if (!changed && handed.saved) {
            ui.close();

            return;
        }
        keep.disabled = true;
        keep.textContent = 'Saving…';
        ui.allowDismiss?.(false);
        try {
            await save(definitionOf(form));
            saved();
        } catch (failure) {
            tell(failure?.message || 'That did not save. Try again.');
            keep.disabled = false;
            keep.textContent = 'Save the form';
            ui.allowDismiss?.(true);
        }
    });
    ui.foot.replaceChildren(blank, el('span', 'le-fb-gap'), cancel, keep);

    draw();

    return { form, draw };
}
