/**
 * The Shop tab: running a shop, in the order a shop owner sets one up.
 *
 *   1. Your products: each one with Edit (its page), the owner's own with Remove, and Add a product.
 *   2. Categories: each one with Choose products (which products it shows), Copy and Open.
 *   Catalogue layout: the template's layouts as drawings (filters on top, at the side; more on paid plans).
 *   Currency: what every price is shown and charged in, Naira by default.
 *   3. Delivery: every delivery choice with the name and price customers see, both the owner's, and
 *      the free-delivery threshold.
 *   4. How customers pay: the checkout's ways, and the WhatsApp number orders go to.
 *   5. Offers: the code on offer and its discount.
 *
 * Owner, 2 Nov 2026: "this is a total confusing, are they editing product, add new category or removing
 * products from categories"; "it need to be explicit and correct so that it's easy to manage the shop by a
 * novice". So every button says what it does to what ("Edit", "Remove", "Choose products"), every part says
 * what it is for in one line, and every example is in naira.
 *
 * A shop's facts are words on its pages: the delivery prices in the bag and checkout, the threshold in the
 * footer, the WhatsApp number behind the checkout's second button. The host gathers them (window.liveEditShop)
 * with the key each is saved under, so this edits the same content the page shows.
 *
 * config = {
 *   products: [{ id, name, href }],          // the design's products, each with its page in the editor
 *   checkout: { href, modes: [{ id, label, needs: [..] }] },
 *   currency: { key, value, options: [{ value, label }] },   // what the shop sells in (naira by default)
 *   layouts:  { key, value, paid?, options: [{ id, label, hint, plan: 'all' | 'paid' }] },  // the catalogue's layouts
 *   pageSize: { key, value, options: [8, 12, ..] },     // products a shop page shows before Show more products
 *   delivery: { listKey, ids, max, copyOf, source: { nameKeys, priceKeys }, choices: [{ id, standard, name, nameKeys, price, priceKeys }] },
 *             // delivery choices the owner adds and removes, where the checkout's choices are a list
 *   fields:   [{ keys: [..], label, kind: 'rate' | 'text' | 'whatsapp', value, name?, nameKeys? }],
 *             // a term written on several pages (the bag's delivery price and the checkout's) is one field
 *             // saved to every copy; a delivery choice's name (`name`, saved under `nameKeys`) is the words
 *             // the checkout shows beside its price
 * }
 * catalogue = window.liveEditPages.catalogue: the owner's own products ({ key, items, drawn, likes }), where
 * the shop can hold them. Adding and removing one is the same write Import products makes (catalogue.js).
 */
import { readRows } from './catalogue.js';
import { uploadWidget } from './upload.js';

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

/**
 * An example amount for a placeholder or a hint, always in naira: ShipFast starts in Nigeria, and a template's
 * sample prices (pounds, dollars) are never the example a novice copies (owner, 2 Nov 2026: "any default currency
 * should be Naira"; "remove pounds symbol from the placeholders").
 */
const example = (naira) => `₦${naira.toLocaleString('en-NG')}`;

/** Free delivery, the code and its discount are terms; any other priced term is a delivery choice. */
const kindOf = (field) => {
    if (field.kind === 'whatsapp' || field.kind === 'rate') return field.kind;
    if (field.label === 'Free delivery over') return 'free';
    if (field.label === 'Promo code' || field.label === 'Promo discount') return 'offer';

    return 'rate';
};

/*
 * `categories` (window.liveEditPages.categories, from the host) and `newCategory(from)` give the tab its
 * Categories: each one opens its page, Copy copies it, and New category makes one (pages.js
 * renderNewCategory). Without them the tab has no Categories part.
 */
export const renderShopPanel = ({
    container, config, save, done, notify = () => {}, doc = document,
    categories = [], newCategory = null, categoryProducts = null, importProducts = null, undoImport = null,
    catalogue = null, upload = null, taken = [], flashSale = null, ask = null,
}) => {
    const el = (tag, className, text) => {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const button = (className, text, label) => {
        const node = el('button', className, text);
        node.type = 'button';
        if (label) node.setAttribute('aria-label', label);
        return node;
    };
    const section = (title, hint, name) => {
        const box = el('section', 'le-shop-section');
        if (name) box.dataset.shopPart = name;
        box.append(el('h3', 'le-shop-heading', title));
        if (hint) box.append(el('p', 'le-hint', hint));
        return box;
    };
    const fields = (config?.fields ?? []).map((f) => ({ ...f, part: kindOf(f) }));
    const inputs = [];
    const input = (spec, { label, value, keys, kind = spec.kind, placeholder, hint }) => {
        const wrap = el('div', 'le-field');
        const tag = el('label', 'le-label', label);
        const box = el('input', 'le-input');
        box.id = `le-shop-${inputs.length}`;
        tag.htmlFor = box.id;
        if (kind === 'whatsapp') {
            box.type = 'tel';
            box.inputMode = 'tel';
            box.autocomplete = 'tel';
            box.placeholder = 'Country code and number, digits only: 2348031234567';
            box.value = whatsappNumber(value);
        } else {
            box.type = 'text';
            box.value = value ?? '';
            if (placeholder) box.placeholder = placeholder;
        }
        // Where each is saved, so pressing that term on the page finds its field here (live-edit.js, SHOP_TERMS).
        box.dataset.shopKeys = (keys ?? []).join(' ');
        inputs.push({ spec: { ...spec, keys, kind, value }, input: box, start: box.value });
        wrap.append(tag, box);
        if (hint) wrap.append(el('p', 'le-hint', hint));
        return wrap;
    };

    container.replaceChildren();
    const parts = [];

    // 1. Your products.
    const designed = config?.products ?? [];
    const own = catalogue?.items ?? [];
    const drawn = new Map((catalogue?.drawn ?? []).map((d) => [d.id, d.href]));
    if (designed.length || own.length || catalogue || importProducts) {
        const total = designed.length + own.length;
        const part = section(`Your products (${total})`, 'What your shop sells. Edit opens a product’s page: change its name, price, photos and description there by clicking them.', 'products');
        const ul = el('ul', 'le-shop-list le-shop-products');
        const row = (name, href, extra = []) => {
            const li = el('li', 'le-shop-row le-shop-product');
            li.append(el('span', 'le-shop-name', name));
            if (href) {
                const edit = el('a', 'le-link-btn le-shop-edit', 'Edit');
                edit.href = href;
                edit.setAttribute('aria-label', `Edit ${name}`);
                li.append(edit);
            }
            li.append(...extra);
            ul.append(li);
        };
        for (const product of designed) row(product.name, product.href);
        for (const product of own) {
            const remove = button('le-link-btn le-shop-remove', 'Remove', `Remove ${product.name} from your shop`);
            remove.addEventListener('click', () => removeProduct(product));
            row(product.name, drawn.get(product.id), [remove]);
        }
        if (!total) ul.append(el('li', 'le-hint', 'No products yet.'));
        part.append(ul);

        if (catalogue?.key && (catalogue.likes ?? []).length) {
            const add = button('le-btn-outline le-wide le-shop-add-product', '+ Add a product');
            const form = addProductForm();
            form.hidden = true;
            add.addEventListener('click', () => {
                form.hidden = !form.hidden;
                add.setAttribute('aria-expanded', String(!form.hidden));
                if (!form.hidden) form.querySelector('input')?.focus();
            });
            add.setAttribute('aria-expanded', 'false');
            part.append(add, form);
        } else if (designed.length) {
            part.append(el('p', 'le-hint', 'To add a product, open your shop page, click a product card, press Duplicate, then Give it its own page on the copy.'));
        }
        if (importProducts) {
            const bring = button('le-link-btn le-import-btn', 'Add many products from a spreadsheet');
            bring.addEventListener('click', () => importProducts());
            part.append(bring);
        }
        if (undoImport) {
            const back = button('le-link-btn le-undo-import', 'Undo the last spreadsheet import');
            back.addEventListener('click', () => undoImport());
            part.append(back);
        }
        parts.push(part);
    }

    // 2. Categories.
    let groups = null;
    if (newCategory && categories.length) {
        groups = section('Categories', 'Groups of products, each a page your customers can open. Choose products picks which products a category shows; nothing is deleted.', 'categories');
        const rows = el('ul', 'le-shop-list le-shop-categories');
        for (const category of categories) {
            const li = el('li', 'le-shop-row le-shop-category');
            const name = el('span', 'le-shop-name', category.title);
            const counted = Array.isArray(category.has) ? el('span', 'le-hint le-shop-count', `${category.has.length} ${category.has.length === 1 ? 'product' : 'products'}`) : null;
            li.append(name, ...(counted ? [counted] : []));
            const actions = el('span', 'le-shop-actions');
            if (categoryProducts && category.productsKey && Array.isArray(category.has)) {
                const choose = button('le-link-btn le-category-products', 'Choose products', `Choose the products in ${category.title}`);
                choose.addEventListener('click', () => categoryProducts(category));
                actions.append(choose);
            }
            if ((category.copies ?? []).length) {
                const copy = button('le-link-btn le-category-duplicate', 'Copy', `Make a new category like ${category.title}`);
                copy.addEventListener('click', () => newCategory(category));
                actions.append(copy);
            }
            const open = el('a', 'le-link-btn le-category-open', 'Open');
            open.href = category.href;
            open.setAttribute('aria-label', `Open the ${category.title} page`);
            actions.append(open);
            li.append(actions);
            rows.append(li);
        }
        const add = button('le-btn-outline le-wide le-new-category-btn', '+ New category');
        add.addEventListener('click', () => newCategory(null));
        groups.append(rows, add);
        parts.push(groups);
    }

    // How the catalogue is laid out (the host's TheShopsLayout): the template's own layouts, as small drawings to pick
    // from. A layout for paid plans is shown, and chosen only on one (owner: "for paid account, we can add more").
    if (config?.layouts?.key && (config.layouts.options ?? []).length > 1) {
        const part = section('Catalogue layout', 'How your shop page shows its products and filters. You can change it any time.', 'layout');
        const group = el('div', 'le-shop-layouts');
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-label', 'Catalogue layout');
        const holder = { value: config.layouts.value };
        const spec = { keys: [config.layouts.key], kind: 'layout', value: holder.value };
        for (const option of config.layouts.options) {
            const locked = option.plan === 'paid' && !config.layouts.paid;
            const card = el('label', `le-shop-layout${locked ? ' is-locked' : ''}`);
            const radio = el('input');
            radio.type = 'radio';
            radio.name = 'le-shop-layout';
            radio.value = option.id;
            radio.checked = option.id === holder.value;
            radio.disabled = locked;
            const drawing = el('span', `le-shop-layout-drawing is-${option.id === 'side' ? 'side' : option.id === 'top' ? 'top' : 'other'}`);
            drawing.setAttribute('aria-hidden', 'true');
            drawing.append(el('span', 'le-shop-layout-filters'), el('span', 'le-shop-layout-grid'));
            const words = el('span', 'le-shop-layout-words');
            words.append(el('strong', null, option.label));
            if (option.hint) words.append(el('span', 'le-hint', option.hint));
            if (locked) words.append(el('span', 'le-shop-layout-plan', 'On paid plans'));
            radio.addEventListener('change', () => { if (radio.checked) holder.value = option.id; });
            card.append(radio, drawing, words);
            group.append(card);
        }
        // Saved with the rest: its "input" is the chosen layout.
        inputs.push({ spec, input: { get value() { return holder.value; }, focus() {} }, start: holder.value });
        part.append(group);
        if (config?.pageSize?.key) part.append(pageSizeField());
        parts.push(part);
    } else if (config?.pageSize?.key) {
        const part = section('Catalogue', 'How your shop page shows its products.', 'layout');
        part.append(pageSizeField());
        parts.push(part);
    }

    /* How many products a shop page shows before "Show more products" (the host's TheShopsLayout::PAGE_SIZE). */
    function pageSizeField() {
        const wrap = el('div', 'le-field');
        const tag = el('label', 'le-label', 'Products shown at a time');
        const pick = el('select', 'le-input le-shop-page-size');
        pick.id = `le-shop-${inputs.length}`;
        tag.htmlFor = pick.id;
        for (const n of config.pageSize.options ?? [12]) {
            const option = el('option', null, String(n));
            option.value = String(n);
            pick.append(option);
        }
        pick.value = String(config.pageSize.value ?? 12);
        inputs.push({ spec: { keys: [config.pageSize.key], kind: 'page-size', value: pick.value }, input: pick, start: pick.value });
        wrap.append(tag, pick, el('p', 'le-hint', 'A long list shows this many first, then a Show more products button adds as many again.'));
        return wrap;
    }

    // The currency the shop sells in (the host's TheShopsCurrency): one choice, every price follows.
    if (config?.currency?.key && (config.currency.options ?? []).length) {
        const part = section('Currency', 'What your prices are shown and charged in. Changing it changes the sign on every price, not the amounts: check your prices afterwards.', 'currency');
        const wrap = el('div', 'le-field');
        const tag = el('label', 'le-label', 'Your shop sells in');
        const pick = el('select', 'le-input le-shop-currency');
        pick.id = `le-shop-${inputs.length}`;
        tag.htmlFor = pick.id;
        for (const option of config.currency.options) {
            const choice = el('option', null, option.label);
            choice.value = option.value;
            pick.append(choice);
        }
        pick.value = config.currency.value ?? 'NGN';
        inputs.push({ spec: { keys: [config.currency.key], kind: 'currency', value: pick.value }, input: pick, start: pick.value });
        wrap.append(tag, pick);
        part.append(wrap);
        parts.push(part);
    }

    // 3. Delivery: each choice's name and price are the owner's, as customers see them at checkout.
    const rates = fields.filter((f) => f.part === 'rate');
    const free = fields.filter((f) => f.part === 'free');
    const list = config?.delivery?.listKey ? config.delivery : null;
    if (list) {
        // Choices the owner adds and removes (the host's TheShopTheyRun::deliveryChoices): a list on the checkout
        // page, saved as Live Edit's Duplicate and Delete save it, so the page and this tab never disagree.
        const part = section('Delivery', `The delivery choices customers pick at checkout. Name each the way your customers know it, with its price: “Lagos, 1 to 2 days” ${example(3000)}. The first is your standard delivery, the one free delivery is for.`, 'delivery');
        list.choices.forEach((choice, i) => {
            const box = el('fieldset', 'le-shop-choice');
            box.append(el('legend', 'le-label', choice.standard ? 'Standard delivery' : `Delivery choice ${i + 1}`));
            if (choice.nameKeys?.length) box.append(input({ keys: choice.nameKeys }, { label: 'Name customers see', value: choice.name, keys: choice.nameKeys, kind: 'name', placeholder: 'Lagos, 1 to 2 days' }));
            box.append(input({ keys: choice.priceKeys }, { label: 'Price', value: choice.price, keys: choice.priceKeys, kind: 'rate', placeholder: example(3000) }));
            if (!choice.standard) {
                const remove = button('le-link-btn le-shop-remove le-shop-remove-choice', 'Remove this choice', `Remove ${choice.name || 'this delivery choice'}`);
                remove.addEventListener('click', async () => {
                    const win = doc.defaultView ?? window;
                    if (!(ask ? await ask({ title: `Remove “${choice.name}” from your checkout?`, subtitle: 'Customers no longer see it as a delivery choice.', yes: 'Remove', no: 'Keep it' }) : win.confirm(`Remove “${choice.name}” from your checkout?`))) return;
                    try {
                        await save(list.listKey, JSON.stringify(list.ids.filter((id) => id !== choice.id)));
                        done?.(`“${choice.name}” is removed from your checkout.`);
                    } catch (error) {
                        notify(error.message);
                    }
                });
                box.append(remove);
            }
            part.append(box);
        });
        if (list.ids.length < (list.max ?? 6)) {
            const add = button('le-btn-outline le-wide le-shop-add-choice', '+ Add a delivery choice');
            const form = el('form', 'le-shop-new-product le-shop-new-choice');
            form.noValidate = true;
            form.hidden = true;
            const name = el('input', 'le-input');
            const price = el('input', 'le-input');
            name.id = 'le-shop-new-choice-name';
            price.id = 'le-shop-new-choice-price';
            name.placeholder = 'Lagos express, next day';
            price.placeholder = example(8000);
            for (const [box, words] of [[name, 'Name customers see'], [price, 'Price']]) {
                const wrap = el('div', 'le-field');
                const tag = el('label', 'le-label', words);
                tag.htmlFor = box.id;
                wrap.append(tag, box);
                form.append(wrap);
            }
            const go = el('button', 'le-btn le-shop-new-go', 'Add this choice');
            go.type = 'submit';
            form.append(go);
            add.setAttribute('aria-expanded', 'false');
            add.addEventListener('click', () => {
                form.hidden = !form.hidden;
                add.setAttribute('aria-expanded', String(!form.hidden));
                if (!form.hidden) name.focus();
            });
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (!name.value.trim()) { notify('A delivery choice needs a name customers recognise.'); name.focus(); return; }
                if (!/\d/.test(price.value)) { notify(`Write its price with its figure: ${example(8000)}, or ${example(0)} for free.`); price.focus(); return; }
                go.disabled = true;
                go.textContent = 'Adding…';
                // A copy of the design's first choice, named as Live Edit's Duplicate names one.
                const id = `n${Date.now().toString(36)}_${list.copyOf}`;
                try {
                    for (const key of list.source.nameKeys ?? []) await save(`${key}@${id}`, name.value.trim());
                    for (const key of list.source.priceKeys ?? []) await save(`${key}@${id}`, price.value.trim());
                    await save(list.listKey, JSON.stringify([...list.ids, id]));
                    done?.(`“${name.value.trim()}” is added to your checkout.`);
                } catch (error) {
                    notify(error.message);
                    go.disabled = false;
                    go.textContent = 'Add this choice';
                }
            });
            part.append(add, form);
        }
        free.forEach((f) => part.append(input(f, { label: 'Free delivery on orders over', value: f.value, keys: f.keys, placeholder: example(50000), hint: 'Customers pay no standard delivery when their order reaches this amount.' })));
        parts.push(part);
    } else if (rates.length || free.length) {
        const part = section('Delivery', `The delivery choices customers pick at checkout. Name each the way your customers know it, with its price: “Lagos, 1 to 2 days” ${example(3000)}.`, 'delivery');
        rates.forEach((f, i) => {
            const choice = el('fieldset', 'le-shop-choice');
            choice.append(el('legend', 'le-label', rates.length > 1 ? `Delivery choice ${i + 1}` : 'Delivery choice'));
            if (f.nameKeys?.length) choice.append(input(f, { label: 'Name customers see', value: f.name ?? f.label, keys: f.nameKeys, kind: 'name', placeholder: 'Lagos, 1 to 2 days' }));
            else choice.append(el('p', 'le-shop-choice-name', f.label));
            choice.append(input(f, { label: 'Price', value: f.value, keys: f.keys, placeholder: example(3000) }));
            part.append(choice);
        });
        free.forEach((f) => part.append(input(f, { label: 'Free delivery on orders over', value: f.value, keys: f.keys, placeholder: example(50000), hint: 'Customers pay no delivery when their order reaches this amount.' })));
        parts.push(part);
    }

    // 4. How customers pay.
    const pay = section('How customers pay', 'Your own checkout: customers fill in their details, then choose one of these.', 'pay');
    const modes = el('ul', 'le-shop-list');
    for (const mode of config?.checkout?.modes ?? []) {
        const li = el('li', 'le-shop-row');
        li.append(el('strong', null, mode.label));
        if (mode.needs?.length) li.append(el('span', 'le-hint', `Needs ${mode.needs.join(' and ')}.`));
        modes.append(li);
    }
    pay.append(modes);
    fields.filter((f) => f.part === 'whatsapp').forEach((f) => pay.append(input(f, { label: 'WhatsApp number for orders', value: f.value, keys: f.keys, hint: 'Orders on WhatsApp arrive here as a message listing what the customer chose.' })));
    if (config?.checkout?.href) {
        const open = el('a', 'le-chip-btn', 'Open the checkout page →');
        open.href = config.checkout.href;
        pay.append(open);
    }
    parts.push(pay);

    // A flash sale and stock: every product in one grid (live-edit.js editFlashSale), the same one a sale on the page opens.
    if (flashSale && designed.length) {
        const part = section('Sale and stock', 'Put products on sale and set how many you have, all in one grid.', 'flash-sale');
        const open = button('le-btn le-shop-flash-sale', 'Edit sale and stock');
        open.addEventListener('click', () => flashSale());
        part.append(open);
        parts.push(part);
    }

    // 5. Offers.
    const offers = fields.filter((f) => f.part === 'offer');
    if (offers.length) {
        const part = section('Offers', 'A code customers type at checkout for money off.', 'offers');
        offers.forEach((f) => part.append(input(f, { label: f.label, value: f.value, keys: f.keys, placeholder: f.label === 'Promo code' ? 'WELCOME10' : '10%' })));
        parts.push(part);
    }

    const actions = el('div', 'le-row');
    const saveButton = button('le-btn', 'Save shop details');
    actions.append(saveButton);
    container.append(...parts, ...(inputs.length ? [actions] : []));

    saveButton.addEventListener('click', async () => {
        const changed = inputs.filter(({ input: box, start }) => box.value.trim() !== start.trim());
        if (!changed.length) {
            notify('Nothing has changed.');
            return;
        }
        for (const { spec, input: box } of changed) {
            if (spec.kind === 'whatsapp' && box.value.replace(/\D+/g, '').length < 7) {
                notify('That WhatsApp number looks too short. Use the country code and number, digits only.');
                box.focus();
                return;
            }
            if (spec.kind === 'name' && !box.value.trim()) {
                notify('A delivery choice needs a name customers recognise.');
                box.focus();
                return;
            }
        }
        saveButton.disabled = true;
        saveButton.textContent = 'Saving…';
        try {
            for (const { spec, input: box } of changed) {
                for (const key of spec.keys ?? [spec.key]) {
                    await save(key, spec.kind === 'whatsapp' ? withWhatsappNumber(spec.value, box.value) : box.value.trim());
                }
            }
            done?.('Shop details saved ✓');
        } catch (error) {
            notify(error.message);
            saveButton.disabled = false;
            saveButton.textContent = 'Save shop details';
        }
    });

    /* Add a product: a name, a price, a photo and its categories. Checked and saved as one row of an import. */
    function addProductForm() {
        const form = el('form', 'le-shop-new-product');
        form.noValidate = true;
        const name = el('input', 'le-input');
        const price = el('input', 'le-input');
        name.id = 'le-shop-new-name';
        price.id = 'le-shop-new-price';
        name.type = price.type = 'text';
        name.placeholder = 'Ceramic coating kit';
        price.placeholder = example(15000);
        const labelled = (box, words, hint) => {
            const wrap = el('div', 'le-field');
            const tag = el('label', 'le-label', words);
            tag.htmlFor = box.id;
            wrap.append(tag, box);
            if (hint) wrap.append(el('p', 'le-hint', hint));
            return wrap;
        };
        form.append(labelled(name, 'Product name'), labelled(price, 'Price', `With its figure, as customers read it: ${example(15000)}.`));

        // The editor's one upload box (upload.js), as for every picture.
        let photo = null;
        if (upload) {
            const box = uploadWidget({ compact: true, label: 'Choose its photo', onFile: (file) => { photo = file; } });
            box.classList.add('le-shop-new-photo');
            const wrap = el('div', 'le-field');
            wrap.append(el('span', 'le-label', 'Photo (optional)'), box, el('p', 'le-hint', 'You can add more photos on its page afterwards.'));
            form.append(wrap);
        }

        const choosable = categories.filter((c) => c.productsKey && Array.isArray(c.has)
            && !categories.some((other) => other !== c && String(other.id).startsWith(`${c.id}/`)));
        const ticks = [];
        if (choosable.length) {
            const box = el('fieldset', 'le-shop-new-categories');
            box.append(el('legend', 'le-label', 'Show it in these categories'));
            for (const category of choosable) {
                const tag = el('label', 'le-check');
                const tick = el('input');
                tick.type = 'checkbox';
                tick.value = category.title;
                ticks.push(tick);
                tag.append(tick, doc.createTextNode(` ${category.title}`));
                box.append(tag);
            }
            form.append(box);
        }

        const go = el('button', 'le-btn le-shop-new-go', 'Add this product');
        go.type = 'submit';
        form.append(go);
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const chosen = ticks.filter((t) => t.checked).map((t) => t.value);
            const checked = readRows([['name', 'price', 'categories'], [name.value, price.value, chosen.join('|')]], {
                categories, likes: catalogue.likes, catalogue: own, taken, products: designed,
            });
            if (checked.problems.length) {
                notify(checked.problems[0].says.replace(/^Row 2(?: \([^)]*\))?: /, '').replace(/^./, (c) => c.toUpperCase()));
                return;
            }
            go.disabled = true;
            go.textContent = 'Adding…';
            try {
                const product = checked.ready[0];
                const file = photo;
                if (file) product.photo = await upload(file);
                await save(catalogue.key, JSON.stringify([...own, product]));
                for (const category of categories) {
                    const parent = categories.some((other) => other !== category && String(other.id).startsWith(`${category.id}/`));
                    if (!category.productsKey || !Array.isArray(category.has) || category.has.includes(product.id)) continue;
                    if (product.categories.includes(category.id) || parent) await save(category.productsKey, JSON.stringify([...category.has, product.id]));
                }
                done?.(`${product.name} is added. Press Edit beside it to add its description and more photos.`);
            } catch (error) {
                notify(error.message);
                go.disabled = false;
                go.textContent = 'Add this product';
            }
        });

        return form;
    }

    /* Remove one of the owner's own products: out of the shop and out of every category that shows it. */
    async function removeProduct(product) {
        const win = doc.defaultView ?? window;
        if (!(ask ? await ask({ title: `Remove ${product.name} from your shop?`, subtitle: 'Its page and its place in your categories go too.', yes: 'Remove', no: 'Keep it' }) : win.confirm(`Remove ${product.name} from your shop? Its page and its place in your categories go too.`))) return;
        try {
            await save(catalogue.key, JSON.stringify(own.filter((p) => p.id !== product.id)));
            for (const category of categories) {
                if (category.productsKey && Array.isArray(category.has) && category.has.includes(product.id)) {
                    await save(category.productsKey, JSON.stringify(category.has.filter((id) => id !== product.id)));
                }
            }
            done?.(`${product.name} is removed from your shop.`);
        } catch (error) {
            notify(error.message);
        }
    }

    return { inputs };
};
