/**
 * Forms the owner shapes: what a form holds, and what may change once visitors have answered it.
 *
 * A form is a Kit instance of its own (data-component="form.<purpose>") with a <form> that posts.
 * Its definition is one setting, {"fields":[{key,label,type,required,help,retired,options}]}, which
 * the host draws in the template's own form kit (the website's LIVE-EDIT-STRUCTURE.md, "Forms the
 * owner shapes"). The host hands the editor each form as saved or as its markup has it, with which
 * fields its workflow owns and how many answers each has (window.liveEditForms). Where it hands
 * nothing for a form, seedForm reads it from the markup here, by the same rules as the host's
 * AFormInTheMarkup.
 *
 * Everything here is pure: the builder (form-builder.js) calls these on a working copy and saves it.
 */

export const TYPES = ['text', 'email', 'phone', 'number', 'date', 'time', 'choice', 'radios', 'checkbox', 'checkboxes', 'longtext', 'file'];

/** What each kind of field is called, to an owner. */
export const TYPE_NAMES = {
    text: 'Short answer',
    email: 'Email',
    phone: 'Phone',
    number: 'Number',
    date: 'Date',
    time: 'Time',
    choice: 'Dropdown',
    radios: 'One choice',
    checkbox: 'Tick box',
    checkboxes: 'Several choices',
    longtext: 'Long answer',
    file: 'File',
};

export const HAS_OPTIONS = new Set(['choice', 'radios', 'checkboxes']);

const PRESET_LABEL = {
    text: 'New question',
    email: 'Email',
    phone: 'Phone',
    number: 'How many?',
    date: 'Date',
    time: 'Time',
    choice: 'Choose one',
    radios: 'Choose one',
    checkbox: 'Yes, please',
    checkboxes: 'Choose any',
    longtext: 'Tell us more',
    file: 'Attach a file',
};

/* --------------------------------------------------------------------------- reading the markup */

const keyOf = (control) => (control.getAttribute('name') ?? '').replace(/\[\]$/, '');

const isAField = (control) => {
    const type = (control.getAttribute('type') ?? '').toLowerCase();
    const name = control.getAttribute('name') ?? '';
    if (control.tagName === 'INPUT' && ['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) return false;
    if (name === '' || name.startsWith('_')) return false;

    return !control.closest('[aria-hidden="true"]');
};

export const typeOf = (controls) => {
    const first = controls[0];
    if (first.tagName === 'SELECT') return first.multiple ? 'checkboxes' : 'choice';
    if (first.tagName === 'TEXTAREA') return 'longtext';
    const type = (first.getAttribute('type') || 'text').toLowerCase();

    return ({
        email: 'email', tel: 'phone', number: 'number', range: 'number', date: 'date', 'datetime-local': 'date', month: 'date', week: 'date',
        time: 'time', radio: 'radios', file: 'file',
        checkbox: controls.length > 1 || (first.getAttribute('name') ?? '').endsWith('[]') ? 'checkboxes' : 'checkbox',
    })[type] ?? 'text';
};

const isMark = (element, which) => [...element.classList].some((c) => new RegExp(`(^|__|-)(${which === 'req' ? 'req|required' : 'opt|optl|optional'})$`).test(c.toLowerCase()));
const isAnError = (element) => /(^|[\s_-])(err|error|errors|invalid)([\s_-]|$)/.test((element.getAttribute('class') ?? '').toLowerCase()) || element.getAttribute('role') === 'alert';
const isAHelp = (element) => element.hasAttribute('data-kit-help') || /(^|[\s_-])(hint|help|helper|note)([\s_-]|$)/.test((element.getAttribute('class') ?? '').toLowerCase());
const notWords = (element) => ['INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'svg', 'SVG', 'BUTTON'].includes(element.tagName)
    || isAnError(element) || isAHelp(element) || element.getAttribute('aria-hidden') === 'true' || isMark(element, 'req') || isMark(element, 'opt');

/** The words of a label or legend, without its control, choices, errors, help or required marks. */
export const wordsOf = (element) => {
    let words = '';
    for (const child of element.childNodes) {
        if (child.nodeType === 3) words += child.nodeValue;
        else if (child.nodeType === 1 && !notWords(child)) words += ` ${wordsOf(child)} `;
    }

    return words.replace(/\s+/g, ' ').trim();
};

const headline = (name) => {
    const words = name.replace(/[\s_\-[\].]+/g, ' ').trim();

    return words ? words.charAt(0).toUpperCase() + words.slice(1).toLowerCase() : name;
};

const holdsAnotherField = (element, key) => [...element.querySelectorAll('input, select, textarea')].some((c) => isAField(c) && keyOf(c) !== key);

const wrapperOf = (form, controls, key) => {
    let node = controls[0];
    if (controls.length > 1) {
        while (node.parentElement && node !== form && !controls.every((c) => node.contains(c))) node = node.parentElement;
    }
    for (;;) {
        const parent = node.parentElement;
        if (!parent || parent === form || parent.hasAttribute('data-step') || parent.tagName === 'FORM') break;
        if (holdsAnotherField(parent, key) || parent.querySelector('button, input[type="submit"], h1, h2, h3, h4, h5, h6, [data-step]')) break;
        node = parent;
    }

    return node;
};

const labelHolder = (form, controls, wrapper) => {
    const first = controls[0];
    const grouped = controls.length > 1 || (first.getAttribute('type') ?? '').toLowerCase() === 'radio';
    if (grouped) {
        const legend = wrapper.querySelector('legend');
        if (legend) return legend;
        const fieldset = wrapper.parentElement?.closest('fieldset');
        if (fieldset && form.contains(fieldset)) {
            const own = [...fieldset.children].find((child) => child.tagName === 'LEGEND');
            if (own) return own;
        }
        if (wrapper.tagName === 'FIELDSET') return null;
        for (const candidate of wrapper.querySelectorAll('p, span, div, label, strong')) {
            if (!candidate.querySelector('input, select, textarea') && (candidate.compareDocumentPosition(first) & 4) && /\p{L}/u.test(candidate.textContent) && !isAnError(candidate)) return candidate;
        }

        return null;
    }
    if (first.id) {
        const label = form.querySelector(`label[for="${CSS.escape(first.id)}"]`);
        if (label) return label;
    }

    return first.closest('label') ?? wrapper.querySelector('label, legend');
};

const helpOf = (form, controls, wrapper) => {
    for (const control of controls) {
        for (const id of (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)) {
            const found = form.querySelector(`#${CSS.escape(id)}`);
            if (found && !isAnError(found) && !found.hidden) return found;
        }
    }

    return [...wrapper.querySelectorAll('*')].find((e) => (isAHelp(e) || (e.tagName === 'SMALL' && !isAnError(e))) && !e.querySelector('input, select, textarea')) ?? null;
};

const OURS = /^data-(edit|field|style|item|list|max|min|label|kit-reached|err|kit-form|kit-help|kit-required)/;

/** The form that sends, in a form instance: the instance itself or the first form inside it that posts. */
export const sendingForm = (instance) => {
    const candidates = instance.tagName === 'FORM' ? [instance] : [...instance.querySelectorAll('form')];

    return candidates.find((form) => {
        if ((form.getAttribute('method') ?? '').toLowerCase() === 'get' || form.getAttribute('role') === 'search') return false;
        const action = `${form.getAttribute('action') ?? ''} ${form.getAttribute('data-endpoint') ?? ''}`;

        return action.includes('your-form-id') || /\/forms\/[A-Za-z0-9]{20,64}/.test(action);
    }) ?? null;
};

/** What a form's purpose says it feeds: checkout, quote, application, booking, or null for a message. */
export const workflowOf = (purpose = '') => {
    const p = purpose.toLowerCase();
    if (/checkout|(^|-)bag$|order($|-)|top-up|voucher|gift-card/.test(p)) return 'checkout';
    if (/quote|rfq|estimate/.test(p)) return 'quote';
    if (/admission|apply|application|enrol|registration/.test(p)) return 'application';
    if (/book|reserv|appointment|seat|walk-in/.test(p)) return 'booking';

    return null;
};

export const PROTECTED_SAYS = {
    checkout: 'Needed for the checkout',
    quote: 'Filled in from your pages',
    application: 'Needed for applications',
    booking: 'Needed for bookings',
};

/**
 * A form's fields as its markup has them: names as keys, words as labels, types, required and help,
 * and which ones its workflow owns.
 */
export function seedForm(instance) {
    const form = sendingForm(instance);
    if (!form) return null;
    const groups = new Map();
    for (const control of form.querySelectorAll('input, select, textarea')) {
        if (!isAField(control)) continue;
        const key = keyOf(control);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(control);
    }
    const purpose = (instance.getAttribute('data-component') ?? '').replace(/^form\./, '');
    const workflow = instance.hasAttribute('data-kit-form-preset') ? null : workflowOf(purpose);
    const why = PROTECTED_SAYS[workflow] ?? 'Your website uses this field';
    const fields = [];
    for (const [key, controls] of groups) {
        const wrapper = wrapperOf(form, controls, key);
        const holder = labelHolder(form, controls, wrapper);
        const type = typeOf(controls);
        const help = helpOf(form, controls, wrapper);
        const role = controls.map((c) => c.getAttribute('data-kit-field-role')).find(Boolean) ?? null;
        const hooked = controls.some((c) => [...c.attributes].some((a) => a.name.startsWith('data-') && a.name !== 'data-kit-field-role' && !OURS.test(a.name)));
        let options = [];
        let choices = null;
        if (HAS_OPTIONS.has(type)) {
            let template = false;
            if (controls[0].tagName === 'SELECT') {
                const select = controls[0];
                template = select.hasAttribute('data-list') || select.hasAttribute('data-edit-list');
                for (const option of select.querySelectorAll('option')) {
                    template = template || option.hasAttribute('data-edit') || option.hasAttribute('data-field');
                    if (option.hasAttribute('value') && option.getAttribute('value').trim() === '') continue;
                    options.push({ value: option.hasAttribute('value') ? option.getAttribute('value') : option.textContent.trim(), label: option.textContent.replace(/\s+/g, ' ').trim() });
                }
            } else {
                options = controls.map((control) => {
                    const label = control.closest('label');
                    template = template || Boolean(label?.matches('[data-edit], [data-item]') || label?.querySelector('[data-edit]'));
                    const words = label ? wordsOf(label) : '';

                    return { value: control.value || words || 'on', label: words || control.value };
                });
            }
            choices = template ? 'template' : 'own';
        }
        fields.push({
            key,
            label: (holder ? wordsOf(holder) : '') || controls[0].getAttribute('aria-label') || controls[0].getAttribute('placeholder') || headline(key),
            type,
            required: controls.some((c) => c.required || c.getAttribute('aria-required') === 'true') || wrapper.hasAttribute('data-group-req') || wrapper.hasAttribute('data-kit-required'),
            help: help ? wordsOf(help) : '',
            retired: false,
            options: options.map((o) => ({ ...o, retired: false })),
            seeded: true,
            choices,
            protected: null,
            role,
            hooked,
        });
    }

    // Which fields the workflow owns: marked, read by the page's script, or needed by name.
    if (!instance.hasAttribute('data-kit-form-preset')) {
        const hasEmail = fields.some((f) => f.type === 'email' || /email/i.test(f.key));
        let emailSeen = false;
        let nameSeen = false;
        for (const field of fields) {
            const key = field.key.toLowerCase();
            let reason = null;
            if ((workflow === 'checkout' && /(^|[_.-])(price|total|amount|qty|quantity|subtotal)([_.-]|$)/.test(key)) || ['order.amount', 'order.total', 'voucher.amount', 'giftcard.amount'].includes(field.role)) reason = 'Worked out by your shop';
            else if (field.role || field.hooked) reason = why;
            else if (workflow) {
                const isEmail = field.type === 'email' || key.includes('email');
                const isName = /(^|_)(full_?|your_?|parent_?|applicant_?|checkout_?)?name$/.test(key) && !/child|company|business|org/.test(key);
                if (isEmail && !emailSeen) { reason = why; emailSeen = true; }
                else if (isName && !nameSeen) { reason = why; nameSeen = true; }
                else if ((field.type === 'phone' || /phone|mobile|(^|_)tel($|_)/.test(key)) && !hasEmail) reason = why;
                else if (workflow === 'booking' && (['date', 'time'].includes(field.type) || /date|time|slot|session/.test(key))) reason = why;
                else if (workflow === 'application' && field.choices === 'template' && /stage|entry|programme|program|course|class|year|intake|level|grade|role/.test(key)) reason = why;
                else if (workflow === 'checkout' && /addr|address|town|city|postcode|post_code|zip|ship|delivery/.test(key)) reason = why;
                else if (workflow === 'quote' && field.choices === 'template') reason = why;
            }
            field.protected = reason;
        }
    }

    return {
        key: null,
        label: instance.getAttribute('data-label') || headline(purpose),
        purpose,
        workflow,
        submissions: 0,
        fields: fields.map(({ role, hooked, ...field }) => ({ ...field, answers: 0, answeredAs: null })),
    };
}

/* --------------------------------------------------------------------------- what may change */

/** Why a field cannot become another kind, or null when it can. */
export const typeLockedBecause = (field) => {
    if (field.protected) return `${field.protected}, so it stays the kind of field it is.`;
    if (field.answers > 0) return `It already has ${field.answers === 1 ? '1 answer' : `${field.answers} answers`}, so it stays a ${(TYPE_NAMES[field.answeredAs ?? field.type] ?? field.type).toLowerCase()} field. To ask in another way, take it off the form and add a new field.`;
    if (field.seeded && field.choices === 'template') return 'Its choices are words on your page, so it stays a dropdown. Press the dropdown on the page to change its choices.';

    return null;
};

/** Why a field cannot be taken off the form, or null when it can. */
export const staysBecause = (field) => (field.protected ? `${field.protected}. You can rename it or move it.` : null);

/** Why a field cannot be made required or optional, or null when it can. */
export const requiredLockedBecause = (field) => (field.protected ? `${field.protected}, so whether it must be filled in stays as it is.` : null);

/* --------------------------------------------------------------------------- changing it */

/** A key for a new field, never one the form has had: "f" and letters, the shape the host admits. */
export const newFieldKey = (fields, random = Math.random) => {
    const taken = new Set(fields.map((f) => f.key));
    for (;;) {
        const key = `f${random().toString(36).slice(2, 9).replace(/[^a-z0-9]/g, '')}`;
        if (key.length >= 4 && !taken.has(key)) return key;
    }
};

export const copyOf = (form) => JSON.parse(JSON.stringify(form));

/** Why this form takes no new questions, or null. A checkout's own questions wait: its script sends only the fields it knows. */
export const CHECKOUT_WAITS = 'Questions of your own on the checkout are coming. For now its questions can be renamed and moved.';
export const addingWaitsBecause = (form) => (form.workflow === 'checkout' ? CHECKOUT_WAITS : null);

/** Add a field of a kind at the end of what is on the form, and return its key (null when the form takes none). */
export function addField(form, type, random = Math.random) {
    if (addingWaitsBecause(form)) return null;
    const key = newFieldKey(form.fields, random);
    const field = {
        key, label: PRESET_LABEL[type] ?? 'New question', type, required: false, help: '', retired: false,
        options: [],
        seeded: false, choices: HAS_OPTIONS.has(type) ? 'own' : null, protected: null, answers: 0, answeredAs: null,
    };
    const lastShown = form.fields.map((f) => !f.retired).lastIndexOf(true);
    form.fields.splice(lastShown + 1, 0, field);

    return key;
}

const find = (form, key) => form.fields.find((f) => f.key === key);

/** Move a field up (-1) or down (+1) among the ones on the form. */
export function moveField(form, key, by) {
    const shown = form.fields.filter((f) => !f.retired);
    const at = shown.findIndex((f) => f.key === key);
    const to = at + by;
    if (at < 0 || to < 0 || to >= shown.length) return false;
    const other = shown[to];
    const a = form.fields.indexOf(shown[at]);
    const b = form.fields.indexOf(other);
    [form.fields[a], form.fields[b]] = [form.fields[b], form.fields[a]];

    return true;
}

/** Take a field off the form: kept (retired) so its answers stay readable. Refused for a workflow's field. */
export function retireField(form, key) {
    const field = find(form, key);
    if (!field) return 'That field is not on this form.';
    const why = staysBecause(field);
    if (why) return why;
    // A field nobody has answered and the builder made is simply gone; anything else is kept, hidden.
    if (!field.seeded && field.answers === 0 && !form.saved) {
        form.fields.splice(form.fields.indexOf(field), 1);

        return null;
    }
    field.retired = true;

    return null;
}

export function restoreField(form, key) {
    const field = find(form, key);
    if (field) field.retired = false;
}

/** Change a field's kind, or say why not. */
export function setType(form, key, type) {
    const field = find(form, key);
    if (!field) return 'That field is not on this form.';
    if (field.type === type) return null;
    const why = typeLockedBecause(field);
    if (why) return why;
    field.type = type;
    if (HAS_OPTIONS.has(type)) field.choices = field.choices ?? 'own';

    return null;
}

export function setRequired(form, key, required) {
    const field = find(form, key);
    if (!field) return 'That field is not on this form.';
    const why = requiredLockedBecause(field);
    if (why && field.required !== required) return why;
    field.required = Boolean(required);

    return null;
}

export function rename(form, key, label) {
    const field = find(form, key);
    const words = String(label ?? '').replace(/\s+/g, ' ').trim();
    if (!field) return 'That field is not on this form.';
    if (!words) return 'A question needs some words.';
    if (/[<>]/.test(words)) return 'A question cannot have < or > in it.';
    if (words.length > 200) return 'Keep a question to 200 characters or fewer.';
    field.label = words;

    return null;
}

export function setHelp(form, key, help) {
    const field = find(form, key);
    const words = String(help ?? '').replace(/\s+/g, ' ').trim();
    if (!field) return 'That field is not on this form.';
    if (/[<>]/.test(words)) return 'Help text cannot have < or > in it.';
    if (words.length > 300) return 'Keep help text to 300 characters or fewer.';
    field.help = words;

    return null;
}

/** Add a choice to a field whose choices the builder owns. */
export function addOption(form, key, label) {
    const field = find(form, key);
    const words = String(label ?? '').replace(/\s+/g, ' ').trim();
    if (!field || !HAS_OPTIONS.has(field.type)) return 'That field has no choices.';
    if (field.choices === 'template') return 'These choices are words on your page. Press the dropdown on the page to add one.';
    if (!words) return 'A choice needs some words.';
    if (/[<>]/.test(words) || words.length > 120) return 'Keep a choice to 120 characters, without < or >.';
    const was = field.options.find((o) => o.value === words);
    if (was && !was.retired) return 'That choice is there already.';
    if (was) was.retired = false;
    else field.options.push({ value: words, label: words, retired: false });

    return null;
}

/** Take a choice off: retired once the form has answers, so answers keep their value. */
export function removeOption(form, key, value) {
    const field = find(form, key);
    if (!field) return 'That field is not on this form.';
    const option = field.options.find((o) => o.value === value);
    if (!option) return null;
    if (field.options.filter((o) => !o.retired).length <= 1) return 'A field of choices keeps at least one choice.';
    if (form.submissions > 0 || form.saved) option.retired = true;
    else field.options.splice(field.options.indexOf(option), 1);

    return null;
}

export function renameOption(form, key, value, label) {
    const field = find(form, key);
    const option = field?.options.find((o) => o.value === value);
    const words = String(label ?? '').replace(/\s+/g, ' ').trim();
    if (!option) return 'That choice is not there.';
    if (!words || /[<>]/.test(words) || words.length > 120) return 'Keep a choice to 120 characters, without < or >.';
    option.label = words;

    return null;
}

/** Start again with no questions of the owner's: everything the workflow does not own is taken off. */
export function startBlank(form) {
    for (const field of [...form.fields]) {
        if (!field.protected && !field.retired) retireField(form, field.key);
    }
}

/** Why the form cannot be saved as it is, or null: a field of choices on the form needs at least one. */
export const unfinished = (form) => {
    const empty = form.fields.find((f) => !f.retired && HAS_OPTIONS.has(f.type) && f.choices !== 'template' && !f.options.some((o) => !o.retired));

    return empty ? `“${empty.label}” needs at least one choice. Type one under it and press Add.` : null;
};

/**
 * Changes said in words (Ask AI), made with the builder's own functions and its rules, all or nothing: the form after
 * them, or the first reason one cannot be made, said as the builder says it (owner, 13 Nov 2026: chat does what a click
 * does; the coverage walk on The Speaker: 105 form parts could not be changed by chat).
 *
 * @returns {{ form: object } | { refused: string }}
 */
export function changeForm(handed, changes) {
    const form = copyOf(handed);
    const valueOf = (field, label) => field?.options?.find((o) => !o.retired && (o.label === label || o.value === label))?.value;
    for (const change of changes ?? []) {
        const field = form.fields.find((f) => f.key === change.question);
        let why = null;
        switch (change.do) {
            case 'rename': why = rename(form, change.question, change.label); break;
            case 'help': why = setHelp(form, change.question, change.help); break;
            case 'required': why = setRequired(form, change.question, Boolean(change.required)); break;
            case 'type': why = TYPES.includes(change.type) ? setType(form, change.question, change.type) : 'That kind of answer is not offered.'; break;
            case 'remove': why = retireField(form, change.question); break;
            case 'restore': restoreField(form, change.question); break;
            case 'move': why = moveField(form, change.question, change.by < 0 ? -1 : 1) ? null : 'That question cannot move further that way.'; break;
            case 'add': {
                if (!TYPES.includes(change.type)) { why = 'That kind of answer is not offered.'; break; }
                const key = addField(form, change.type);
                if (key === null) { why = addingWaitsBecause(form); break; }
                if (change.label) why = rename(form, key, change.label);
                if (!why && change.required) why = setRequired(form, key, true);
                if (!why && change.help) why = setHelp(form, key, change.help);
                for (const choice of change.choices ?? []) why = why ?? addOption(form, key, choice);
                break;
            }
            case 'add_choice': why = addOption(form, change.question, change.choice); break;
            case 'remove_choice': why = valueOf(field, change.choice) === undefined ? 'That choice is not there.' : removeOption(form, change.question, valueOf(field, change.choice)); break;
            case 'rename_choice': why = valueOf(field, change.choice) === undefined ? 'That choice is not there.' : renameOption(form, change.question, valueOf(field, change.choice), change.to); break;
            default: why = 'That change cannot be made to a form.';
        }
        if (why) return { refused: why };
    }
    const unfinishedBecause = unfinished(form);

    return unfinishedBecause ? { refused: unfinishedBecause } : { form };
}

/** What is saved: only the definition, never the reasons and counts the host works out again. */
export const definitionOf = (form) => ({
    fields: form.fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: Boolean(f.required),
        help: f.help ?? '',
        retired: Boolean(f.retired),
        options: (f.options ?? []).map((o) => ({ value: o.value, label: o.label, retired: Boolean(o.retired) })),
    })),
});

/** What the owner is told about a form before they change it. */
export function limitsSaid(form) {
    const said = [];
    if (form.submissions > 0) {
        said.push(`This form has ${form.submissions === 1 ? '1 answer' : `${form.submissions} answers`} so far. To keep them readable: you can rename, move, add and take off questions, but a question with answers keeps its kind, and one you take off keeps its answers in your enquiries and the spreadsheet. Making a question required applies to new answers only.`);
    }
    if (form.workflow && form.fields.some((f) => f.protected)) {
        const what = { checkout: 'checkout', quote: 'quote request', application: 'application form', booking: 'booking form' }[form.workflow];
        said.push(`This is a ${what}. The questions marked “${PROTECTED_SAYS[form.workflow]}” can be renamed and moved, but stay on the form as they are.`);
    }

    return said;
}
