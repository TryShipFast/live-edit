/**
 * A list drawn from the owner's own API, set up from the list's panel (LIVE-EDIT-STRUCTURE.md "A list from a link";
 * owner, 14 Nov 2026: pricing "can be gotten from the api url and the structure can be mapped").
 *
 * Only where the host hands it over (window.liveEditLists: our hosted templates). The owner gives the link and, if it
 * needs one, an access key (a novice "might just know the api access key and url"), presses Check the link, and is
 * shown each part of their first item in their own words ("Club", "₦4,500") with a choice of the fields the link
 * answered with, one pre-selected ("we don't know their structure but we can ask them to map"). Saving keeps only
 * the link, the key and those choices; the rows are cached by the host and drawn on the published page, never stored.
 */

const MONEY = /^\s*([₦$€£₵¥₹]|NGN|USD|GHS|KES|ZAR|EUR|GBP)?\s*[\d][\d,.\s]*\s*$|[₦$€£₵¥₹]\s*\d/;
const SYMBOL = /([₦$€£₵¥₹])/;
const MONTHS = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';

/** The way a design writes a date, as PHP's date format the host fills it in with ("14 October 2026" is "j F Y"). */
export function dateFormatOf(words) {
    const w = String(words ?? '').trim();
    if (new RegExp(`^\\d{1,2} (${MONTHS}) \\d{4}$`).test(w)) return /^\d{1,2} [A-Za-z]{3} \d{4}$/.test(w) ? 'j M Y' : 'j F Y';
    if (new RegExp(`^(${MONTHS}) \\d{1,2}, \\d{4}$`).test(w)) return /^[A-Za-z]{3} /.test(w) ? 'M j, Y' : 'F j, Y';
    if (/^\d{4}-\d{2}-\d{2}$/.test(w)) return 'Y-m-d';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(w)) return 'd/m/Y';

    return null;
}

const PERIODS = { day: 'a day', daily: 'a day', week: 'a week', weekly: 'a week', month: 'a month', monthly: 'a month', mo: 'a month', quarter: 'every 3 months', quarterly: 'every 3 months', year: 'a year', yearly: 'a year', annually: 'a year', annual: 'a year', yr: 'a year', once: 'once' };

const valueAt = (row, path) => path.split('.').reduce((node, key) => (node && typeof node === 'object' ? node[key] : undefined), row);

const plainWords = (value) => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map((one) => (one && typeof one === 'object' ? (one.name ?? one.title ?? one.label ?? one.text ?? '') : one)).filter(Boolean).join(', ');
    const box = document.createElement('div');
    box.innerHTML = String(value);

    return (box.textContent ?? '').replace(/\s+/g, ' ').trim();
};

/** A part as the page will show it, the way the host words it (TheRowsAListShows): what the owner checks before saving. */
export function shownAs(value, as, { symbol = '', smallest = false, format = null } = {}) {
    if (as === 'price') {
        const plain = typeof value === 'string' ? value.replace(/[,\s]/g, '') : value;
        if (typeof plain === 'string' && !/^-?\d+(\.\d+)?$/.test(plain)) return plainWords(value);
        const amount = Number(plain) / (smallest ? 100 : 1);
        if (!Number.isFinite(amount)) return '';
        const whole = Math.abs(amount - Math.round(amount)) < 0.005;

        return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
    }
    if (as === 'period') {
        const words = plainWords(value);

        return PERIODS[words.toLowerCase().replace(/^(?:(?:per|every|a|an)\s+|\/\s*)/, '')] ?? words;
    }
    if (as === 'link') return '';
    if (as === 'date') {
        const when = new Date(String(value ?? ''));
        if (Number.isNaN(when.getTime())) return plainWords(value);
        const long = when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        return format?.startsWith('M') || format?.startsWith('F') ? when.toLocaleDateString('en-US', { month: format.startsWith('M') ? 'short' : 'long', day: 'numeric', year: 'numeric' })
            : format === 'j M Y' ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : format === 'Y-m-d' ? when.toISOString().slice(0, 10) : long;
    }

    return plainWords(value);
}

/** The connection the host knows for a list, or null. */
export function connectionOf(listKey, lists = window.liveEditLists) {
    return (lists?.lists ?? []).find((one) => one.list === listKey) ?? null;
}

/** A setting key as the design item carries it, without the copy's `@id`. */
const baseKey = (key) => String(key ?? '').replace(/^setting:/, '').split('@')[0];

/**
 * The parts of a list's first item a field can fill, in the order they are drawn, each named by its own words and
 * given what it most likely is: its heading the name, a sum of money the price, the words beside the price its period,
 * the first line of a list inside it the features, its button's address the link.
 *
 * @returns {{ key: string, as: string, role: string, words: string, symbol?: string }[]}
 */
export function partsOf(item) {
    if (!item) return [];
    const parts = [];
    const lists = new Set();
    let priceAt = null;
    for (const el of item.querySelectorAll('[data-edit], [data-edit-href]')) {
        const href = el.getAttribute('data-edit-href');
        if (href && /^tpl:[0-9a-f]{12}/.test(baseKey(href))) {
            parts.push({ key: baseKey(href), as: 'link', role: 'link', words: el.getAttribute('href') ?? '' });
        }
        const edit = el.getAttribute('data-edit') ?? '';
        if (!edit.startsWith('setting:') || el.hasAttribute('data-edit-img')) continue;
        const key = baseKey(edit);
        if (!/^tpl:[0-9a-f]{12}(\.text)?$/.test(key)) continue;
        const words = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
        // A line of a list inside the item (a plan's features): the first stands for all of them.
        const group = el.parentElement;
        const lines = group ? [...group.children].filter((child) => child.tagName === el.tagName && child.matches('[data-edit^="setting:"]')) : [];
        if (lines.length >= 2 && el.tagName === 'LI') {
            if (lists.has(group)) continue;
            lists.add(group);
            parts.push({ key, as: 'list', role: 'features', words: lines.map((line) => line.textContent.trim()).join(', ') });
            continue;
        }
        // Its button's words: short words in a link or button, never a heading that is also the card's link.
        if (key.endsWith('.text') && el.closest('a, button') && !/^H[1-6]$/.test(el.tagName) && !el.querySelector('h1, h2, h3, h4, h5, h6') && words.split(' ').length <= 5) {
            parts.push({ key, as: 'words', role: 'button', words });
            continue;
        }
        if (MONEY.test(words) && /\d/.test(words)) {
            priceAt = el;
            parts.push({ key, as: 'price', role: 'price', words, symbol: (words.match(SYMBOL) ?? [])[1] ?? '' });
            continue;
        }
        const format = el.tagName === 'TIME' || dateFormatOf(words) ? (dateFormatOf(words) ?? 'j F Y') : null;
        if (format) {
            parts.push({ key, as: 'date', role: 'date', words, format });
            continue;
        }
        const nextToPrice = priceAt && (priceAt.nextElementSibling === el || priceAt.parentElement === el.parentElement);
        if (nextToPrice) {
            parts.push({ key, as: 'period', role: 'period', words });
            continue;
        }
        parts.push({ key, as: 'words', role: /^H[1-6]$/.test(el.tagName) ? 'name' : 'words', words, heading: /^H[1-6]$/.test(el.tagName) });
    }

    // Its heading is its name; without one, its first words are. The rest are its description.
    const named = parts.find((p) => p.heading) ?? parts.find((p) => p.role === 'words');
    for (const part of parts) {
        if (part.role === 'name' || part.role === 'words') part.role = part === named ? 'name' : 'description';
    }

    return parts;
}

/** A field's choice in words: its name and an example from the owner's own rows. */
const choiceLabel = (field) => `${field.field}${field.example ? ` (${field.example})` : ''}`;

async function send(url, body, token) {
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token ?? '', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(body),
    });
    const answer = await response.json().catch(() => ({}));
    if (!response.ok && !answer.error) {
        throw new Error(answer.message || 'That did not work. Please try again.');
    }

    return answer;
}

const el = (tag, className = '', text = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;

    return node;
};

const field = (label, input) => {
    const wrap = el('label', 'le-field');
    wrap.append(label, input);

    return wrap;
};

/**
 * The block on a list's panel: "Get these from a link", the steps that connect it, or where a connected list comes
 * from with Check now, Change and Stop using the link. Null where the host offers no such thing.
 */
export function renderConnectedList({ list, label = 'This list', notify = () => {}, askTo = async () => true, settle = async () => {}, config = window.liveEditLists }) {
    if (!config || !list?.dataset?.editList || list.dataset.editListKind === 'sections') return null;
    const key = list.dataset.editList;
    const first = list.querySelector(':scope > [data-edit-item]');
    const parts = partsOf(first);
    if (!parts.length) return null;

    const block = el('div', 'le-connected');
    // Its choices are saved by its own Save, never by the panel's Save changes: a change in here must not light that
    // one up as unsaved words (two Saves side by side is the one thing a first-time owner cannot tell apart).
    for (const kind of ['input', 'change', 'keydown']) {
        block.addEventListener(kind, (event) => { if (kind !== 'keydown' || event.key !== 'Escape') event.stopPropagation(); });
    }
    const remember = (described) => {
        const lists = (config.lists ?? []).filter((one) => one.list !== key);
        if (described) lists.push(described);
        config.lists = lists;
    };

    const showConnected = (one) => {
        block.replaceChildren();
        block.append(el('div', 'le-section-heading', `${label} from a link`));
        block.append(el('p', 'le-hint', `From ${one.from}, checked every 5 minutes. Change them there, and your website shows the change.`));
        if (one.rows?.length) {
            const nameKey = parts.find((p) => p.role === 'name')?.key;
            const priceKey = parts.find((p) => p.role === 'price')?.key;
            const said = one.rows.slice(0, 6).map((row) => [row[nameKey], row[priceKey]].filter(Boolean).join(' ')).filter(Boolean);
            if (said.length) block.append(el('p', 'le-hint', `Now showing: ${said.join(' · ')}${one.rows.length > 6 ? ` and ${one.rows.length - 6} more` : ''}.`));
        }
        if (one.problem) block.append(el('p', 'le-hint le-problem', `${one.problem} Your website keeps showing the last ones it had.`));
        const row = el('div', 'le-row');
        const check = el('button', 'le-chip-btn', 'Check now');
        check.type = 'button';
        check.dataset.act = 'connected-check';
        check.addEventListener('click', check.leRun = async () => {
            check.disabled = true;
            try {
                const answer = await send(config.check, { list: key }, config.token);
                if (answer.list) { remember(answer.list); showConnected(answer.list); }
                notify(answer.list?.problem ? answer.list.problem : 'Checked ✓');
            } catch (error) { notify(error.message); check.disabled = false; }
        });
        const change = el('button', 'le-chip-btn', 'Change the link or what fills what');
        change.type = 'button';
        change.addEventListener('click', () => showSteps(one));
        const stop = el('button', 'le-btn-danger', 'Stop using the link');
        stop.type = 'button';
        stop.dataset.act = 'connected-stop';
        stop.addEventListener('click', stop.leRun = async () => {
            if (!await askTo({ title: 'Stop using the link?', subtitle: `${label} shows your own words again once you publish.`, yes: 'Stop using it', no: 'Keep it' })) return 'kept';
            try {
                await send(config.stop, { list: key, label }, config.token);
                remember(null);
                await settle(`${label}: your own words again. Publish to show them ✓`);
                showStart();
            } catch (error) { notify(error.message); }

            return true;
        });
        row.append(check, change, stop);
        block.append(row);
    };

    const showStart = () => {
        block.replaceChildren();
        const open = el('button', 'le-chip-btn', 'Get these from a link');
        open.type = 'button';
        open.title = 'Show this list from your own system (an API link), kept up to date';
        open.dataset.act = 'connected-open';
        open.addEventListener('click', () => showSteps(null));
        block.append(open);
    };

    const showSteps = (one) => {
        block.replaceChildren();
        block.append(el('div', 'le-section-heading', `Get ${label.toLowerCase()} from a link`));
        block.append(el('p', 'le-hint', 'Paste the link your system gives for this list. Only the link and its key are kept; your list is read from it each time.'));
        const url = el('input', 'le-input');
        url.type = 'url';
        url.placeholder = 'https://';
        url.value = one?.url ?? '';
        url.dataset.connected = 'url';
        const keyBox = el('input', 'le-input');
        keyBox.type = 'password';
        keyBox.autocomplete = 'off';
        keyBox.placeholder = one?.hasKey ? 'Kept. Type a new one to change it' : '';
        keyBox.dataset.connected = 'key';
        const user = el('input', 'le-input');
        user.autocomplete = 'off';
        user.dataset.connected = 'user';
        const keyLabel = document.createTextNode('Access key, if it needs one');
        const userField = field('Username', user);
        userField.hidden = !one?.user;
        if (one?.user) keyLabel.textContent = 'Password';
        const both = el('button', 'le-link-btn', 'It asks for a username and password');
        both.type = 'button';
        both.hidden = Boolean(one?.user);
        both.addEventListener('click', () => { userField.hidden = false; both.hidden = true; keyLabel.textContent = 'Password'; user.focus(); });
        const keyField = el('label', 'le-field');
        keyField.append(keyLabel, keyBox);
        const said = el('p', 'le-hint');
        said.setAttribute('role', 'status');
        const look = el('button', 'le-btn', 'Check the link');
        look.type = 'button';
        look.dataset.act = 'connected-look';
        const matching = el('div', 'le-connected-matches');
        const cancel = el('button', 'le-chip-btn', 'Cancel');
        cancel.type = 'button';
        cancel.addEventListener('click', () => (one ? showConnected(one) : showStart()));
        const actions = el('div', 'le-row');
        actions.append(look, cancel);
        block.append(field('Link', url), userField, keyField, both, actions, said, matching);

        const asked = () => ({ url: url.value.trim(), key: keyBox.value, user: userField.hidden ? '' : user.value.trim(), list: key });
        look.addEventListener('click', look.leRun = async (at = null) => {
            if (!/^https:\/\//i.test(url.value.trim())) { said.textContent = 'Use the full link, starting with https://'; url.focus(); return false; }
            look.disabled = true;
            said.textContent = 'Checking the link…';
            matching.replaceChildren();
            try {
                const answer = await send(config.look, { ...asked(), ...(typeof at === 'string' ? { at } : {}) }, config.token);
                look.disabled = false;
                if (!answer.ok) { said.textContent = answer.error; return false; }
                said.textContent = `Found ${answer.count} at ${answer.host}. Choose what fills each part of your first one.`;
                drawMatches(answer, one);

                return true;
            } catch (error) {
                look.disabled = false;
                said.textContent = error.message;

                return false;
            }
        });

        const drawMatches = (answer, was) => {
            matching.replaceChildren();
            if (answer.choices.length > 1) {
                const which = el('select', 'le-input');
                which.dataset.connected = 'at';
                for (const choice of answer.choices) {
                    const option = el('option', '', `${choice.at || 'The whole answer'}: ${choice.count}${choice.example ? `, first "${choice.example}"` : ''}`);
                    option.value = choice.at;
                    option.selected = choice.at === answer.at;
                    which.append(option);
                }
                which.addEventListener('change', () => look.leRun(which.value));
                matching.append(field('Which list', which));
            }
            const dateField = answer.fields.find((f) => /(^|\.)(date|published(_at)?|created(_at)?|posted(_at)?|start(s|_at|_date)?|when)$/i.test(f.field))?.field;
            const guessFor = { date: dateField, name: answer.guess.name, price: answer.guess.price, period: answer.guess.period, description: answer.guess.description, features: answer.guess.features, button: answer.guess.button, link: answer.guess.link };
            const picks = [];
            for (const part of parts) {
                const pick = el('select', 'le-input');
                pick.dataset.connected = `part:${part.key}`;
                pick.append(Object.assign(el('option', '', 'Keep my words'), { value: '' }));
                for (const one of answer.fields) {
                    if (part.as === 'list' && one.kind !== 'list' && one.kind !== 'words') continue;
                    if (part.as === 'link' && one.kind !== 'link') continue;
                    const option = el('option', '', choiceLabel(one));
                    option.value = one.field;
                    pick.append(option);
                }
                pick.value = was?.matches?.[part.key]?.field ?? guessFor[part.role] ?? '';
                if (pick.selectedIndex < 0) pick.value = '';
                const named = part.as === 'link' ? 'Where its button goes' : `“${part.words.length > 40 ? `${part.words.slice(0, 40)}…` : part.words}”`;
                matching.append(field(named, pick));
                picks.push([part, pick]);
            }
            const priceField = answer.fields.find((f) => f.field === (picks.find(([p]) => p.role === 'price')?.[1].value));
            const smallest = el('input');
            smallest.type = 'checkbox';
            smallest.checked = was ? Boolean(was.smallest) : Boolean(answer.smallest);
            smallest.dataset.connected = 'smallest';
            const smallestField = el('label', 'le-default');
            smallestField.append(smallest, ' Prices are in kobo or cents (450000 is ₦4,500)');
            smallestField.hidden = !priceField || priceField.kind !== 'number';
            matching.append(smallestField);

            // The first ones as they will read, redrawn as the owner changes a choice: a price in kobo shown as
            // naira a hundred times too big is seen here, before anything is saved.
            const preview = el('div', 'le-connected-preview');
            preview.setAttribute('aria-live', 'polite');
            const drawPreview = () => {
                const price = picks.find(([p]) => p.role === 'price');
                const priceKind = answer.fields.find((f) => f.field === price?.[1].value)?.kind;
                smallestField.hidden = priceKind !== 'number';
                const lines = (answer.rows ?? []).slice(0, 3).map((row) => picks
                    .filter(([part, pick]) => pick.value && part.as !== 'link' && part.role !== 'features' && part.role !== 'button')
                    .map(([part, pick]) => shownAs(valueAt(row, pick.value), part.as, { symbol: part.symbol, smallest: smallest.checked, format: part.format }))
                    .map((words) => (words.length > 70 ? `${words.slice(0, 70).replace(/\s+\S*$/, '')}\u2026` : words))
                    .filter(Boolean)
                    .join(', '));
                preview.replaceChildren(el('div', 'le-section-heading', 'They will read'), ...lines.filter(Boolean).map((line) => el('p', 'le-hint', line)));
            };
            for (const [, pick] of picks) pick.addEventListener('change', drawPreview);
            smallest.addEventListener('change', drawPreview);
            drawPreview();
            matching.append(preview);

            const save = el('button', 'le-btn', 'Save');
            save.type = 'button';
            save.dataset.act = 'connected-save';
            const saveRow = el('div', 'le-row');
            saveRow.append(save);
            matching.append(saveRow);
            save.addEventListener('click', save.leRun = async () => {
                const matches = {};
                for (const [part, pick] of picks) {
                    if (pick.value) matches[part.key] = { field: pick.value, as: part.as, ...(part.symbol ? { symbol: part.symbol } : {}), ...(part.format ? { format: part.format } : {}) };
                }
                if (!Object.keys(matches).length) { said.textContent = 'Choose what fills at least one part, or press Cancel.'; return false; }
                save.disabled = true;
                said.textContent = 'Saving…';
                try {
                    const answered = await send(config.save, { ...asked(), at: answer.at, label, smallest: smallest.checked, matches, page: location.pathname }, config.token);
                    save.disabled = false;
                    if (!answered.ok) { said.textContent = answered.error; return false; }
                    remember(answered.list);
                    await settle(`${label} now come from ${answered.list.from}. Publish to show them on your website ✓`);
                    showConnected(answered.list);

                    return true;
                } catch (error) {
                    save.disabled = false;
                    said.textContent = error.message;

                    return false;
                }
            });
        };
    };

    const kept = connectionOf(key, config);
    if (kept) showConnected(kept); else showStart();

    return block;
}
