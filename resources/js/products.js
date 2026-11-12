/**
 * A shop's products, edited as a whole (owner, 8 Nov 2026: "live edit should be sufficient to setup their store"; "they
 * only go to the dashboard for orders"; customer case "do we have product categories, featured products, etc").
 *
 * The Products grid is Shopify's Products list and bulk editor, in the editor's one grid (the same as tables, charts
 * and the flash sale): a row for each product and, under it, a row for each of its sizes, with Photo, Name, Price, SKU,
 * Collections, Featured and Stock. Every cell is words the shop already reads on the product's own page, or a list the
 * shop already keeps, so nothing here or on the server reads anything new:
 *
 *   Name        the product page's [data-kit-name] (its h1), the same key a click on it saves
 *   Price       its own [data-kit-price] in the buy box; a size's, the [data-kit-price] in the size's row
 *   SKU         its [data-kit-sku] under the title; a size's, the [data-kit-sku] in the size's row
 *   Collections the shop's collection pages (window.liveEditPages.categories), each a list of product ids saved under
 *               its `productsKey` (structure:products:<page>)
 *   Featured    the home page's row of products (window.liveEditPages.featured), the same list for the home page
 *               (structure:products:home)
 *   Stock       the host's (KeepsShopStock), as in the flash sale grid
 *
 * LIVE-EDIT-STRUCTURE.md, "The Products grid".
 */
import { amountOf, priceStyleOf, sizeKey, stockFor, writePrice } from './sale.js';

const wordsOf = (node) => String(node?.textContent ?? '').replace(/\s+/g, ' ').trim();
const keyOf = (node) => (String(node?.dataset?.edit ?? node?.getAttribute?.('data-edit') ?? '').startsWith('setting:') ? (node.dataset?.edit ?? node.getAttribute('data-edit')) : null);
const part = (node) => ({ node: node ?? null, words: wordsOf(node), key: keyOf(node) });
const ITEM = '[data-item], [data-edit-item]';

/** The product's buy box on its own page: the [data-kit-product] that is not a card, a button or a link. */
export const buyBoxIn = (doc) => {
    const main = doc.querySelector('main') ?? doc.body ?? doc;
    // a card is a list's item ([data-item]); the buy box never is
    const boxes = [...main.querySelectorAll('[data-kit-product]:not(button):not(a)')]
        .filter((box) => !box.closest('[data-item]') && box.querySelector('[data-kit-price]'));

    return boxes.find((box) => box.querySelector('[data-kit-sku], [data-kit-name]')) ?? boxes[0] ?? null;
};

/** The row of a size: the list item that holds (or is) a [data-kit-variant], inside the buy box. */
const sizeRowOf = (node, box) => {
    const row = node.closest(ITEM);

    return row && box.contains(row) && row !== box && (row.matches('[data-kit-variant]') || row.querySelector('[data-kit-variant]')) ? row : null;
};

/** The product's own price in its buy box: the first outside its sizes, its sale line and other cards. */
export const ownPriceIn = (box) => [...box.querySelectorAll('[data-kit-price]')].find((price) => {
    if (price.closest('[data-options], [data-kit-sale]')) return false;
    if (price.parentElement?.querySelector(':scope > [data-kit-variant]')) return false;
    if (sizeRowOf(price, box)) return false;
    const item = price.closest(ITEM);

    return !(item && item !== box && box.contains(item));
}) ?? null;

/**
 * A product page read for the grid: its name, price, SKU and first photo, and its sizes with theirs. Each word is
 * { node, words, key }, `key` the setting it is saved under (null where the owner cannot change it). Null for a page
 * that is not a product's.
 */
export const readProduct = (doc, href = '') => {
    const box = buyBoxIn(doc);
    if (!box) return null;
    const main = doc.querySelector('main') ?? doc.body;
    const name = box.querySelector('[data-kit-name]') ?? main.querySelector('h1');
    const own = (selector) => [...box.querySelectorAll(selector)].find((node) => !sizeRowOf(node, box) && !(node.closest(ITEM) && node.closest(ITEM) !== box && box.contains(node.closest(ITEM)))) ?? null;
    const sku = own('[data-kit-sku]');
    const price = ownPriceIn(box);
    // the product's first photo: in its buy box, else in the section that holds it (a gallery beside it)
    const img = box.querySelector('img') ?? box.closest('section')?.querySelector('img') ?? main.querySelector('img');
    let photo = img?.getAttribute('src') ?? '';
    try { if (photo && href) photo = new URL(photo, href).href; } catch { /* as written */ }
    const rows = [];
    for (const variant of box.querySelectorAll('[data-kit-variant]')) {
        const row = sizeRowOf(variant, box);
        if (!row || rows.some((one) => one.row === row)) continue;
        rows.push({ row, variant });
    }
    // a size's name: its [data-kit-variant]'s words, or, where the row is the variant, the row's without its price or SKU
    const labelOf = (row, variant) => {
        if (variant !== row) return wordsOf(variant);
        const bare = row.cloneNode(true);
        bare.querySelectorAll('[data-kit-price], [data-kit-sku], [data-kit-computed], input').forEach((node) => node.remove());

        return wordsOf(bare);
    };
    const sizes = rows.map(({ row, variant }) => ({
        label: labelOf(row, variant),
        price: part(row.querySelector('[data-kit-price]')),
        sku: part(row.querySelector('[data-kit-sku]')),
    }));

    return {
        name: part(name),
        price: part(price),
        sku: part(sku),
        photo,
        gift: box.hasAttribute('data-gift') || Boolean(main.querySelector('[data-gift][data-kit-product], [data-giftcard]')),
        sizes,
    };
};

/**
 * What a kept product read depends on, so it is read again only when one of them changed (owner, 12 Nov 2026: "It
 * should only make round trip if new products are added"; "don't forget the invalidating strategies"): the keys of its
 * name, price, SKU and each size's price and SKU, its photo's, and the list its sizes are in (a size added or removed).
 * Each with the value the site held for it when it was read, from the saved content (drafts included), so a change by
 * anyone, on any device, shows as a different value.
 *
 * @returns {Record<string, string|null>}
 */
export const watchedBy = (doc, read, settings = {}) => {
    if (!read) return {};
    const bare = (key) => String(key ?? '').replace(/^setting:/, '');
    const keys = [read.name?.key, read.price?.key, read.sku?.key, ...(read.sizes ?? []).flatMap((size) => [size.price?.key, size.sku?.key])];
    const box = doc ? buyBoxIn(doc) : null;
    if (box) {
        const main = doc.querySelector('main') ?? doc.body;
        const img = box.querySelector('img') ?? box.closest('section')?.querySelector('img') ?? main?.querySelector('img');
        keys.push(img?.getAttribute('data-edit-img'));
        const sized = box.querySelector('[data-kit-variant]')?.closest('[data-edit-list]');
        keys.push(sized?.getAttribute('data-edit-list'));
    }
    const watch = {};
    for (const key of keys.map(bare).filter(Boolean)) watch[key] = Object.prototype.hasOwnProperty.call(settings, key) ? String(settings[key]) : null;

    return watch;
};

/** Whether a kept read still holds: every value it was read with is the site's value now. */
export const stillHolds = (watch, settings = {}) => Object.entries(watch ?? {}).every(([key, was]) => (Object.prototype.hasOwnProperty.call(settings, key) ? String(settings[key]) : null) === was);

/** A product as it can be kept between page loads: its words and keys, without the page's elements. */
export const keptRead = (read) => {
    if (!read) return read;
    const bare = ({ words, key }) => ({ node: null, words, key });

    return { ...read, name: bare(read.name), price: bare(read.price), sku: bare(read.sku), sizes: read.sizes.map((size) => ({ label: size.label, price: bare(size.price), sku: bare(size.sku) })) };
};

/* ---------------------------------------------------------------- the grid ----------------------------------------- */

export const COLUMNS = [
    { id: 'photo', head: 'Photo', kind: 'read' },
    { id: 'name', head: 'Name', kind: 'text', always: true },
    { id: 'price', head: 'Price', kind: 'text' },
    { id: 'sku', head: 'SKU', kind: 'text' },
    { id: 'collections', head: 'Collections', kind: 'read' },
    { id: 'featured', head: 'Featured', kind: 'tick' },
    { id: 'stock', head: 'Stock', kind: 'count' },
];
export const COL = Object.fromEntries(COLUMNS.map((column, i) => [column.id, i]));

/** Columns chosen in the Columns menu, as kept in this browser: the ids shown. Name always is. */
export const shownColumns = (kept, offered = COLUMNS.map((c) => c.id)) => {
    const ids = Array.isArray(kept) ? kept.filter((id) => offered.includes(id)) : offered;

    return offered.filter((id) => id === 'name' || ids.includes(id));
};

/** The collections a product can be put in by a tick: those with a list the shop keeps, and not the page of them all. */
export const choosableCollections = (categories = []) => categories.filter((c) => c.productsKey && Array.isArray(c.has)
    && !categories.some((other) => other !== c && c.id !== '' && String(other.id).startsWith(`${c.id}/`)));

/** A collection's id list as a cell: ids joined by "|"; and back. */
export const collectionsCell = (ids) => ids.join('|');
export const collectionsOfCell = (cell) => String(cell ?? '').split('|').filter(Boolean);

/** The names of the collections a cell holds, for its button: "Girls, New in", or "None". */
export const collectionsSaid = (cell, collections) => {
    const names = collectionsOfCell(cell).map((id) => collections.find((c) => c.id === id)?.title).filter(Boolean);

    return names.length ? names.join(', ') : 'None';
};

/**
 * The grid's rows: one for each product, then one for each of its sizes. `products`: [{ id, name, read }] where read is
 * readProduct's (undefined while its page is read, null where it has none).
 */
export const gridRows = (products) => {
    const rows = [];
    products.forEach((product, p) => {
        rows.push({ kind: 'product', p });
        (product.read?.sizes ?? []).forEach((size, s) => rows.push({ kind: 'size', p, s }));
    });

    return rows;
};

/** The host's stock row for a size of a product, by its name as the page writes it. */
const same = (a, b) => String(a ?? '').replace(/\s+/g, ' ').trim().toLowerCase() === String(b ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
export const stockOfSize = (product, size, stock) => stockFor(product, stock ?? []).sizes.find((row) => same(row.size, size.label)) ?? null;

/** The cells of a row, as the grid shows them first. */
export const rowCells = (row, products, { collections = [], featured = null, stock = null }) => {
    const product = products[row.p];
    const read = product.read;
    const cells = Array(COLUMNS.length).fill('');
    if (row.kind === 'size') {
        const size = read.sizes[row.s];
        cells[COL.name] = size.label;
        cells[COL.price] = size.price.words;
        cells[COL.sku] = size.sku.words;
        const counted = stockOfSize(product, size, stock);
        cells[COL.stock] = counted && counted.quantity !== null && counted.quantity !== undefined ? String(counted.quantity) : '';

        return cells;
    }
    cells[COL.photo] = read?.photo ?? '';
    cells[COL.name] = read?.name?.words || product.name;
    if (read === undefined) cells[COL.price] = 'Loading…';
    else if (read) {
        cells[COL.price] = read.price.words;
        cells[COL.sku] = read.sku.words;
    }
    cells[COL.collections] = collectionsCell(collections.filter((c) => (c.has ?? []).includes(product.id)).map((c) => c.id));
    cells[COL.featured] = featured && (featured.has ?? []).includes(product.id) ? '1' : '';
    const own = stock ? stockFor(product, stock).own : null;
    cells[COL.stock] = own && own.quantity !== null && own.quantity !== undefined ? String(own.quantity) : '';

    return cells;
};

/** The rows (indexes) whose SKU another row also has, ignoring case and spaces at the ends. Empty is never shared. */
export const sharedSkus = (rows) => {
    const by = new Map();
    rows.forEach((said, i) => {
        const sku = String(said ?? '').trim().toUpperCase();
        if (!sku) return;
        by.set(sku, [...(by.get(sku) ?? []), i]);
    });

    return new Set([...by.values()].filter((at) => at.length > 1).flat());
};

export const SKU_TAKEN = 'Another product has this SKU';

/**
 * A price typed in the grid, written the way the page writes its prices ("49950" beside "₦74,950" is "₦49,950"), or
 * null when it has no figure.
 */
export const priceAsWritten = (typed, like) => {
    const minor = amountOf(typed);

    return minor === null ? null : writePrice(minor, priceStyleOf(like || typed));
};

/**
 * A product's price typed in its row keeps its sizes in step: a size priced as the product was is priced as it is now
 * (Kemi's nine sizes at ₦74,950 all follow it to ₦69,950); a size with its own price keeps it.
 */
export const keepSizesInStep = (rows, cellsOf, r, before, after) => {
    const row = rows[r];
    if (row?.kind !== 'product') return [];
    const was = amountOf(before);
    const now = amountOf(after);
    if (was === null || now === null || was === now) return [];
    const changed = [];
    rows.forEach((other, i) => {
        if (other.kind !== 'size' || other.p !== row.p) return;
        const cells = cellsOf(i);
        if (amountOf(cells[COL.price]) === was) {
            cells[COL.price] = writePrice(now, priceStyleOf(cells[COL.price]));
            changed.push(i);
        }
    });

    return changed;
};

/**
 * What saving the grid writes: { refused: [why], writes: [{ key, value, name, what }], lists: [{ key, value, title }],
 * stock: [{ row, typed, label }] }. Words only where they differ from the page; a collection's (or the home page's)
 * list only where a product was ticked into it or out of it, keeping the products the grid does not show.
 */
export const productsPlan = (products, rows, cells, { collections = [], featured = null, stock = null } = {}) => {
    const refused = [];
    const writes = [];
    const stockItems = [];
    const put = (word, value, name, what) => {
        if (word?.key && value !== word.words) writes.push({ key: word.key, value, name, what });
    };
    rows.forEach((row, i) => {
        const product = products[row.p];
        const read = product.read;
        if (!read) return;
        const typed = cells[i] ?? [];
        if (row.kind === 'size') {
            const size = read.sizes[row.s];
            const label = `${product.name}, ${size.label}`;
            const price = String(typed[COL.price] ?? '').trim();
            if (price !== size.price.words) {
                const written = priceAsWritten(price, size.price.words || read.price.words);
                if (written === null) refused.push(`The price of ${label} needs its figure, like ${read.price.words || '₦15,000'}.`);
                else put(size.price, written, product.name, `the price of ${size.label}`);
            }
            put(size.sku, String(typed[COL.sku] ?? '').trim(), product.name, `the SKU of ${size.label}`);
            const counted = stockOfSize(product, size, stock);
            if (counted) stockItems.push({ row: counted, typed: typed[COL.stock], label });

            return;
        }
        const name = String(typed[COL.name] ?? '').trim();
        if (!name && read.name.key) refused.push(`A product in row ${i + 1} has no name. Give it one, or press Undo changes.`);
        else put(read.name, name, product.name, 'the name');
        const price = String(typed[COL.price] ?? '').trim();
        if (price !== read.price.words) {
            const written = priceAsWritten(price, read.price.words);
            if (written === null) refused.push(`The price of ${product.name} needs its figure, like ${read.price.words || '₦15,000'}.`);
            else put(read.price, written, product.name, 'the price');
        }
        put(read.sku, String(typed[COL.sku] ?? '').trim(), product.name, 'the SKU');
        const own = stock ? stockFor(product, stock).own : null;
        if (own) stockItems.push({ row: own, typed: typed[COL.stock], label: product.name });
    });

    // Which products each collection (and the home page's row) shows, as ticked; the order it had, new ones after.
    const lists = [];
    const listed = (holder, inIt, title) => {
        const has = holder.has ?? [];
        const shown = new Set(products.map((product) => product.id).filter(Boolean));
        const keep = has.filter((id) => !shown.has(id) || inIt(id));
        const add = products.map((product) => product.id).filter((id) => id && inIt(id) && !keep.includes(id));
        const next = [...keep, ...add];
        if (next.length !== has.length || next.some((id, n) => id !== has[n])) lists.push({ key: holder.productsKey ?? holder.key, value: JSON.stringify(next), title, count: next.length });
    };
    const productRow = new Map(rows.map((row, i) => [row, i]).filter(([row]) => row.kind === 'product').map(([row, i]) => [products[row.p].id, i]));
    for (const collection of collections) {
        listed(collection, (id) => collectionsOfCell(cells[productRow.get(id)]?.[COL.collections]).includes(collection.id), collection.title);
    }
    if (featured?.key) listed(featured, (id) => Boolean(cells[productRow.get(id)]?.[COL.featured]), featured.title ?? 'Featured');

    return { refused, writes: refused.length ? [] : writes, lists: refused.length ? [] : lists, stock: stockItems };
};

export { sizeKey };

/* -------------------------------------------- a fresh SKU for a copy ----------------------------------------------- */

/**
 * The SKU a copy of a product starts with: the source's with "-COPY", or the next free number ("-COPY-2") where the
 * shop already has that one (LIVE-EDIT-STRUCTURE.md, "Every product has an SKU": a duplicate does not start out sharing
 * one). Empty stays empty.
 */
export const freshSku = (sku, taken = []) => {
    const said = String(sku ?? '').trim();
    if (!said) return '';
    const known = new Set(taken.map((one) => String(one).trim().toUpperCase()));
    const base = said.replace(/-COPY(?:-\d+)?$/i, '');
    let next = `${base}-COPY`;
    for (let n = 2; known.has(next.toUpperCase()) || next.toUpperCase() === said.toUpperCase(); n += 1) next = `${base}-COPY-${n}`;

    return next;
};

/**
 * The SKUs to save on a product page just copied from another: each [data-kit-sku] of the copy (the product's and
 * each size's, in the same order as the original's) gets its source's SKU made fresh. `settings` are the words the
 * owner saved (drafts over published), so an SKU they changed on the original is the one copied.
 */
export const freshSkuWrites = (original, copy, settings = {}) => {
    const skus = (doc) => [...(doc?.querySelectorAll?.('main [data-kit-sku]') ?? [])].filter((node) => !node.closest('[data-kit-product] [data-item] [data-kit-product], [data-kit-pick]'));
    const from = skus(original);
    const to = skus(copy);
    const said = (node) => {
        const key = String(keyOf(node) ?? '').replace(/^setting:/, '');

        return key && typeof settings[key] === 'string' ? settings[key] : wordsOf(node);
    };
    const taken = from.map(said);
    const writes = [];
    to.forEach((node, i) => {
        const key = String(keyOf(node) ?? '').replace(/^setting:/, '');
        const source = from[i] ? said(from[i]) : '';
        const value = freshSku(source, [...taken, ...writes.map((w) => w.value)]);
        if (key && value && value !== said(node)) writes.push({ key, value });
    });

    return writes;
};
