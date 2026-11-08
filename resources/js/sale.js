/**
 * A shop's flash sale, edited as a whole (owner, 8 Nov 2026: "Dead simple is the promise"; "sales card must be
 * editable at once, not each being editable one by one"; "just like we can edit tables, cards").
 *
 * A sale is words on the product page, in its buy box (LIVE-EDIT-STRUCTURE.md, "Flash sales"):
 *
 *   [data-kit-sale]
 *     [data-kit-sale-price]   "₦49,950"; anything that is not a price ("No sale") is no sale
 *     [data-kit-sale-from]    "8 Nov 2026", or "Today": the sale starts at the start of that day
 *     [data-kit-sale-until]   "31 Dec 2026", or "No end date": the sale ends at the end of that day
 *
 * The owner pressed those words one at a time, each opening a box called "Text", with dates typed as words, and a
 * card's sale or a countdown said only "Counted for you". Now each of them opens one grid, "Flash sale" (the same
 * grid as a table or a chart): every product, a tick for those on sale, its price, its sale price and % off (typing
 * either fills the other), and one Starts and one Ends for the whole sale. Saving writes the same words the pages
 * always held, so the shop reads them exactly as before (the website's TheSaleOnAProduct::fromWords and amountOf).
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const NO_SALE = 'No sale';
export const FROM_TODAY = 'Today';
export const NO_END = 'No end date';

const wordsOf = (node) => String(node?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** The amount in written words, in minor units ("₦49,950" is 4995000), or null when there is none ("No sale"). */
export const amountOf = (text) => {
    const found = String(text ?? '').match(/\d[\d,]*(?:\.\d{1,2})?/);

    return found ? Math.round(Number(found[0].replace(/,/g, '')) * 100) : null;
};

/** How a page writes its prices: what comes before and after the figure, grouped in thousands, and with pence. */
export const priceStyleOf = (text) => {
    const found = String(text ?? '').match(/^([^\d]*?)(\d[\d,]*)(?:\.(\d{1,2}))?(.*)$/s);
    if (!found) return { before: '', after: '', grouped: true, decimals: 0 };
    return {
        before: found[1].replace(/\s+$/, ' '),
        after: found[4].replace(/\s+/g, ' ').trimEnd(),
        // "₦950" says nothing about thousands; grouped is the commoner way and what the templates write
        grouped: found[2].includes(',') || found[2].length <= 3,
        decimals: found[3] ? 2 : 0,
    };
};

/** An amount (minor units) written the way the page writes its prices: 4995000 beside "₦74,950" is "₦49,950". */
export const writePrice = (minor, like) => {
    const style = typeof like === 'string' ? priceStyleOf(like) : (like ?? priceStyleOf(''));
    const pence = Math.abs(minor) % 100;
    const decimals = style.decimals || pence !== 0 ? 2 : 0;
    const whole = Math.floor(Math.abs(minor) / 100);
    const figure = style.grouped ? String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(whole);

    return `${style.before}${figure}${decimals ? `.${String(pence).padStart(2, '0')}` : ''}${style.after}`;
};

/** "8 Nov 2026", "8 November 2026" or "2026-11-08" as 2026-11-08; anything else ("Today", "No end date") as null. */
export const dayOf = (words) => {
    const said = String(words ?? '').replace(/\s+/g, ' ').trim();
    let year;
    let month;
    let day;
    let found = said.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (found) {
        [year, month, day] = [Number(found[1]), Number(found[2]), Number(found[3])];
    } else if ((found = said.match(/^(\d{1,2}) ([A-Za-z]{3})[A-Za-z]*\.? (\d{4})$/))) {
        const index = MONTHS.findIndex((name) => name.toLowerCase() === found[2].toLowerCase());
        if (index < 0) return null;
        [year, month, day] = [Number(found[3]), index + 1, Number(found[1])];
    } else {
        return null;
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/** 2026-11-08 as "8 Nov 2026"; no day as the words that mean none ("Today", "No end date"). */
export const wordsForDay = (iso, none = '') => {
    const day = dayOf(iso);
    if (!day) return none;
    const [year, month, date] = day.split('-').map(Number);

    return `${date} ${MONTHS[month - 1]} ${year}`;
};

/** The share off, as the templates show it: 74,950 down to 49,950 is 33% off. */
export const percentOff = (sale, own) => (own > 0 && sale > 0 && sale < own ? Math.round(100 - (sale * 100) / own) : 0);

/** Today as a UTC day, the same day the shop's server counts in. */
export const todayIs = (now = new Date()) => now.toISOString().slice(0, 10);

/** The sale line an element belongs to: inside one, or the product's own price beside one. Null otherwise. */
export const saleLineOf = (element) => {
    if (!element?.closest) return null;
    const line = element.closest('[data-kit-sale]');
    if (line) return line;
    if (!element.matches('[data-kit-price]')) return null;
    const box = element.closest('[data-kit-product]') ?? element.closest('section, main');
    const near = box?.querySelector('[data-kit-sale]');

    return near && ownPriceOf(near) === element ? near : null;
};

/** The product's own price beside a sale line: the first in its buy box outside its sizes and cards. */
export const ownPriceOf = (line) => {
    const box = line?.closest?.('[data-kit-product]') ?? line?.closest?.('section, main');
    if (!box) return null;

    return [...box.querySelectorAll('[data-kit-price]')].find((price) => {
        if (price.closest('[data-options], [data-kit-sale]')) return false;
        if (price.parentElement?.querySelector(':scope > [data-kit-variant]')) return false;
        const item = price.closest('[data-edit-item], [data-item]');

        return !(item && item !== box && box.contains(item));
    }) ?? null;
};

/** Each part of a sale line, the words it says, and whether the owner may write it (it has a setting's key). */
export const readSale = (line) => {
    const part = (node) => ({
        node: node ?? null,
        words: wordsOf(node),
        key: String(node?.dataset?.edit ?? '').startsWith('setting:') ? node.dataset.edit : null,
    });
    const price = part(ownPriceOf(line));
    const sale = part(line.querySelector('[data-kit-sale-price]'));
    const from = part(line.querySelector('[data-kit-sale-from]'));
    const until = part(line.querySelector('[data-kit-sale-until]'));

    return { price, sale, from, until, own: amountOf(price.words), onSale: amountOf(sale.words) !== null };
};

/**
 * The words to write for what the panel holds, only where they differ from what the page says:
 * [{ key, node, value }]. A sale switched off writes "No sale" and leaves its days as they were.
 */
export const saleWrites = (read, { on, price, sale, from, until }) => {
    const writes = [];
    const write = (part, value) => { if (part.key && value !== part.words) writes.push({ key: part.key, node: part.node ?? null, value }); };
    const priceStyle = priceStyleOf(read.price.words);
    if (price !== null && price !== read.own) write(read.price, writePrice(price, priceStyle));
    if (!on) {
        if (read.onSale) write(read.sale, NO_SALE);

        return writes;
    }
    // written like the page's own price, with its currency, whatever was typed
    const saleStyle = read.onSale ? priceStyleOf(read.sale.words) : priceStyle;
    if (sale !== null && sale !== amountOf(read.sale.words)) write(read.sale, writePrice(sale, saleStyle));
    if ((from || null) !== dayOf(read.from.words)) write(read.from, wordsForDay(from, FROM_TODAY));
    if ((until || null) !== dayOf(read.until.words)) write(read.until, wordsForDay(until, NO_END));

    return writes;
};

/** A price less a share, to the whole unit (₦74,950 less 33% is ₦50,217). */
export const saleFor = (own, percent) => Math.round((own * (100 - percent)) / 10000) * 100;

const daysBetween = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

/** The end of the sale, said: "Ends 31 Dec 2026, in 53 days." */
export const endSaid = (until, today = todayIs()) => {
    const day = dayOf(until);
    if (!day) return 'No end day: the sale runs until you untick its products.';
    const left = daysBetween(today, day);
    if (left < 0) return `Ended ${wordsForDay(day)}. Choose a later end day to run it again.`;
    if (left === 0) return `Ends today, ${wordsForDay(day)}.`;

    return `Ends ${wordsForDay(day)}, in ${left} day${left === 1 ? '' : 's'}.`;
};

/** How a product's sale stands today: 'on', 'soon', 'ended' or null (no sale). */
export const saleStateOf = (read, today = todayIs()) => {
    const sale = amountOf(read.sale.words);
    if (sale === null || read.own === null || sale <= 0 || sale >= read.own) return null;
    const from = dayOf(read.from.words);
    const until = dayOf(read.until.words);
    if (until && until < today) return 'ended';
    if (from && from > today) return 'soon';

    return 'on';
};

/** The editor's label on a card or a product page on sale: "On sale · ₦49,950 · ends 31 Dec". Null for no sale. */
export const saleLabel = (read, today = todayIs()) => {
    const state = saleStateOf(read, today);
    if (!state) return null;
    const short = (day) => wordsForDay(day).replace(/ \d{4}$/, '');
    if (state === 'ended') return 'Sale ended';
    if (state === 'soon') return `Sale starts ${short(dayOf(read.from.words))}`;
    const until = dayOf(read.until.words);

    return `On sale · ${writePrice(amountOf(read.sale.words), read.sale.words)}${until ? ` · ends ${short(until)}` : ''}`;
};

/** The grid's columns, and a product's row in it: [on sale, product, price, sale price, % off]. */
export const SALE_HEADS = ['On sale', 'Product', 'Price', 'Sale price', '% off'];
export const SALE_KINDS = ['tick', 'read', 'read', 'text', 'text'];
export const saleRow = (product) => {
    const { read } = product;
    const sale = amountOf(read.sale.words);
    const on = read.onSale;

    return [on ? '1' : '', product.name, read.price.words, on ? read.sale.words : '', on ? String(percentOff(sale, read.own ?? 0) || '') : ''];
};

/**
 * A cell typed in keeps its row in step: a sale price works out its % off, a % off its sale price (written like the
 * product's price), and either ticks the product.
 */
export const keepRowInStep = (product, col, cells, done = false) => {
    const own = product.read.own ?? 0;
    const style = product.read.price.words;
    if (col === 3) {
        const sale = amountOf(cells[3]);
        cells[4] = sale && own ? String(percentOff(sale, own) || '') : '';
        // typed "49950", shown "₦49,950" once the box is left: written as the shop writes its prices
        if (done && sale) cells[3] = writePrice(sale, product.read.onSale && amountOf(product.read.sale.words) ? product.read.sale.words : style);
        if (String(cells[3]).trim()) cells[0] = '1';
    } else if (col === 4) {
        const share = Number(String(cells[4]).replace(/[^\d.]/g, ''));
        cells[3] = share > 0 && share < 100 && own ? writePrice(saleFor(own, share), style) : '';
        if (String(cells[4]).trim()) cells[0] = '1';
    }

    return cells;
};

/**
 * What saving the grid writes: { refused: [why], writes: [{ key, value, name }] }. A product ticked is on sale at its
 * sale price, between the sale's days; unticked, "No sale". Days the owner did not change keep each product's own.
 */
export const flashSalePlan = (products, rows, { from = null, until = null, daysChanged = false } = {}) => {
    const refused = [];
    const writes = [];
    if (from && until && until < from) refused.push('The end day is before the start day. Choose an end day on or after it.');
    products.forEach((product, i) => {
        const cells = rows[i] ?? [];
        const on = Boolean(cells[0]);
        const sale = amountOf(cells[3]);
        const { read } = product;
        if (on && (sale === null || sale <= 0)) refused.push(`${product.name} has no sale price. Type a sale price or a % off, or untick it.`);
        else if (on && read.own !== null && sale >= read.own) refused.push(`The sale price for ${product.name} must be less than its price, ${read.price.words}.`);
        if (!on && !read.onSale) return;
        const own = !daysChanged && read.onSale;
        const days = { from: own ? dayOf(read.from.words) : from, until: own ? dayOf(read.until.words) : until };
        saleWrites(read, { on, price: null, sale, ...days }).forEach((write) => writes.push({ ...write, name: product.name }));
    });

    return { refused, writes: refused.length ? [] : writes };
};

/*
 * Stock in the same grid (owner, 8 Nov 2026: "live edit should be sufficient to setup their store"), where the host
 * keeps it (GET and POST /live-edit/stock; the engine's KeepsShopStock): one "In stock" column, a product's own count
 * on its row, or a row for each of its sizes under it, as a shop's inventory list shows them. Empty is not counted.
 */
export const STOCK_HEAD = 'In stock';

/** The host's stock rows for a product: by its shop id, its page's path, or its name. */
export const stockOf = (product, stock = []) => {
    const path = String(product.path ?? '').replace(/^\/+|\/+$/g, '');

    return stock.filter((row) => row.product === product.id || (path && (path === row.product || path.endsWith(`/${row.product}`))) || (!row.product && row.name === product.name));
};

/** A product's stock as the host keeps it: its own count (no sizes), or one count for each size. */
export const stockFor = (product, stock = []) => {
    const rows = stockOf(product, stock);
    const sizes = rows.filter((row) => row.size);

    return { own: sizes.length ? null : (rows.find((row) => !row.size) ?? null), sizes };
};

const countSaid = (value) => (value === null || value === undefined ? '' : String(value));
export const sizeKey = (row) => `${row.product}|${row.size}`;

/**
 * A product's sizes' stock in a few words, for its row while its sizes are folded: "12 in 9 sizes", "12 in 5 of 9
 * sizes", "2 sizes sold out", "Not counted". `typed` holds what was typed for a size, by sizeKey.
 */
export const sizesSummary = (sizes, typed = {}) => {
    const counts = sizes.map((row) => String(typed[sizeKey(row)] ?? countSaid(row.quantity)).trim()).filter((said) => /^\d+$/.test(said)).map(Number);
    if (!counts.length) return 'Not counted';
    const total = counts.reduce((sum, n) => sum + n, 0);
    const out = counts.filter((n) => n === 0).length;
    const where = counts.length === sizes.length ? `${sizes.length} sizes` : `${counts.length} of ${sizes.length} sizes`;
    if (total === 0) return `${out === 1 ? '1 size' : `${out} sizes`} sold out`;

    return `${total} in ${where}${out ? `, ${out} sold out` : ''}`;
};

/**
 * The counts to send: { refused, changes: [{ product, size, quantity }] }, only where what was typed differs from what
 * the host holds. items: [{ row (the host's), typed, label }].
 */
export const stockPlan = (items) => {
    const refused = [];
    const changes = [];
    items.forEach(({ row, typed, label }) => {
        if (!row || typed === undefined) return;
        const said = String(typed ?? '').trim();
        if (said !== '' && !/^\d{1,7}$/.test(said)) {
            refused.push(`In stock for ${label} must be a whole number, like 12, or empty.`);

            return;
        }
        const quantity = said === '' ? null : Number(said);
        if (quantity !== (row.quantity ?? null)) changes.push({ product: row.product, size: row.size ?? '', quantity });
    });

    return { refused, changes: refused.length ? [] : changes };
};

/** Ticked products that already have a sale price of their own: what one % off for all would change. */
export const ownPricesAmong = (rows, isProduct = () => true) => rows.filter((cells, r) => isProduct(r) && cells[0] && String(cells[3] ?? '').trim()).length;

/** A product as it can be kept between page loads: its sale line's words and keys, without the page's elements. */
export const keptProduct = (product) => {
    const part = ({ words, key }) => ({ node: null, words, key });
    const { read } = product;

    return { ...product, here: false, read: { ...read, price: part(read.price), sale: part(read.sale), from: part(read.from), until: part(read.until) } };
};

/** Kept products with the words just saved written in, so the next page load shows them without asking again. */
export const withWrites = (products, writes) => {
    const by = new Map(writes.map(({ key, value }) => [key, value]));

    return products.map((product) => {
        const read = { ...product.read };
        for (const name of ['price', 'sale', 'from', 'until']) {
            if (read[name]?.key && by.has(read[name].key)) read[name] = { ...read[name], words: by.get(read[name].key) };
        }
        read.own = amountOf(read.price.words);
        read.onSale = amountOf(read.sale.words) !== null;

        return { ...product, read };
    });
};
