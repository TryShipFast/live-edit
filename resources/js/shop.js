/**
 * The Shop tab: what a shop owner looks for, in one place.
 *
 * A shop's facts are scattered across its pages as words the owner can already
 * edit: the delivery prices in the bag, the free-delivery threshold in the
 * footer, the code on offer, the WhatsApp number behind the checkout's second
 * button, and a product per page. Finding each one meant knowing which page
 * holds it. The host gathers them (window.liveEditShop) with the key each is
 * saved under, so this panel edits the same content the page shows: change a
 * delivery price here and the bag's words, and its total, change with it.
 *
 * config = {
 *   products: [{ name, href }],            // each product's page in the editor
 *   checkout: { href, modes: [{ id, label, needs: [..] }] },
 *   fields:   [{ keys: [..], label, kind: 'text' | 'whatsapp', value, hint }],  // a term written on
 *             several pages (the bag's delivery price and the checkout's) is one field saved to every copy
 * }
 */

/** The number in a WhatsApp link, as digits ("https://wa.me/447700900123?text=Hi" gives "447700900123"). */
export const whatsappNumber = (href) => (String(href ?? '').match(/wa\.me\/(\d+)/) ?? String(href ?? '').match(/phone=(\d+)/) ?? [])[1] ?? '';

/** The same link with another number, keeping anything after it (the message it starts with). */
export const withWhatsappNumber = (href, typed) => {
    const digits = String(typed ?? '').replace(/\D+/g, '');
    const was = String(href ?? '');
    if (/wa\.me\/\d+/.test(was)) return was.replace(/wa\.me\/\d+/, `wa.me/${digits}`);
    if (/phone=\d+/.test(was)) return was.replace(/phone=\d+/, `phone=${digits}`);

    return `https://wa.me/${digits}`;
};

export const renderShopPanel = ({ container, config, save, done, notify = () => {}, doc = document }) => {
    const el = (tag, className, text) => {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const section = (title, hint) => {
        const box = el('section', 'le-shop-section');
        box.append(el('h3', 'le-shop-heading', title));
        if (hint) box.append(el('p', 'le-hint', hint));
        return box;
    };
    const fields = config?.fields ?? [];
    const inputs = [];
    const field = (spec) => {
        const wrap = el('div', 'le-field');
        const label = el('label', 'le-label', spec.label);
        const input = el('input', 'le-input');
        input.id = `le-shop-${inputs.length}`;
        label.htmlFor = input.id;
        if (spec.kind === 'whatsapp') {
            input.type = 'tel';
            input.inputMode = 'tel';
            input.autocomplete = 'tel';
            input.placeholder = 'Country code and number, digits only';
            input.value = whatsappNumber(spec.value);
        } else {
            input.type = 'text';
            input.value = spec.value ?? '';
        }
        inputs.push({ spec, input, start: input.value });
        wrap.append(label, input);
        if (spec.hint) wrap.append(el('p', 'le-hint', spec.hint));
        return wrap;
    };

    container.replaceChildren();
    const intro = el('p', 'le-hint', 'Everything here is also on your pages, in the same words. Changing it here changes it there, and the bag and checkout work it out from those words.');

    const pay = section('How customers pay', 'Your own checkout: the customer fills in their details, then chooses one of these.');
    const modes = el('ul', 'le-shop-list');
    for (const mode of config?.checkout?.modes ?? []) {
        const row = el('li', 'le-shop-row');
        row.append(el('strong', null, mode.label));
        if (mode.needs?.length) row.append(el('span', 'le-hint', `Needs ${mode.needs.join(' and ')}.`));
        modes.append(row);
    }
    pay.append(modes);
    fields.filter((f) => f.kind === 'whatsapp').forEach((f) => pay.append(field(f)));
    if (config?.checkout?.href) {
        const open = el('a', 'le-chip-btn', 'Open the checkout page →');
        open.href = config.checkout.href;
        pay.append(open);
    }

    const terms = fields.filter((f) => f.kind !== 'whatsapp');
    const offers = section('Delivery and offers', terms.length ? 'Write them the way a customer reads them ("$8", "$150"): the bag reads the figure from your words.' : null);
    terms.forEach((f) => offers.append(field(f)));

    const products = config?.products ?? [];
    const list = section(`Products (${products.length})`, 'Each has its own page for its photos, sizes, price and story. Click a product card in the shop and press Edit all details to change its page there. To add one, duplicate a card and press Give it its own page: it starts as a full copy.');
    const ul = el('ul', 'le-shop-list');
    for (const product of products) {
        const row = el('li', 'le-shop-row le-shop-product');
        const link = el('a', null, product.name);
        link.href = product.href;
        row.append(link);
        ul.append(row);
    }
    list.append(ul);

    const actions = el('div', 'le-row');
    const saveButton = el('button', 'le-btn', 'Save shop details');
    saveButton.type = 'button';
    actions.append(saveButton);

    container.append(intro, pay, ...(terms.length ? [offers] : []), ...(products.length ? [list] : []), ...(inputs.length ? [actions] : []));

    saveButton.addEventListener('click', async () => {
        const changed = inputs.filter(({ input, start }) => input.value.trim() !== start.trim());
        if (!changed.length) {
            notify('Nothing has changed.');
            return;
        }
        for (const { spec, input } of changed) {
            if (spec.kind === 'whatsapp' && input.value.replace(/\D+/g, '').length < 7) {
                notify('That WhatsApp number looks too short. Use the country code and number, digits only.');
                input.focus();
                return;
            }
        }
        saveButton.disabled = true;
        saveButton.textContent = 'Saving…';
        try {
            for (const { spec, input } of changed) {
                for (const key of spec.keys ?? [spec.key]) {
                    await save(key, spec.kind === 'whatsapp' ? withWhatsappNumber(spec.value, input.value) : input.value.trim());
                }
            }
            done?.('Shop details saved ✓');
        } catch (error) {
            notify(error.message);
            saveButton.disabled = false;
            saveButton.textContent = 'Save shop details';
        }
    });

    return { inputs };
};
