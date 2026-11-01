/**
 * Import products (the Shop tab): a shop's own products from a file, drawn as the design draws its own.
 *
 * The owner downloads a sample file made from this shop (its columns, its category names, two or
 * three of its own products as examples), fills it in like a form, and uploads it. Every row is
 * checked before anything is saved: a missing name, a price without a figure, a photo that is not a
 * web address, a category the shop does not have. The good rows are saved as one setting, the
 * catalogue (`config.catalogue.key`, an array of products), and each product is added to the
 * categories its row names, and to the pages that hold them all (All products), by the categories'
 * own `productsKey`. The host draws each one as a page made like one of the design's product pages,
 * with its card in each category (the website's LIVE-EDIT-STRUCTURE.md, "A shop's catalogue").
 *
 * The last import can be taken back: what the catalogue and each category held before is kept in
 * this browser until the next import.
 */

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

export const COLUMNS = ['name', 'price', 'photo', 'categories', 'looks like'];
export const UNDO_KEY = 'le-last-import';

/** A CSV cell, quoted where it must be. */
const cell = (value) => {
    const text = String(value ?? '');

    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Rows of cells from CSV text: commas or semicolons, quoted cells, line breaks inside quotes. */
export function parseCsv(text) {
    const source = String(text ?? '').replace(/^﻿/, '');
    const firstLine = source.split(/\r?\n/, 1)[0] ?? '';
    const separator = (firstLine.match(/;/g) ?? []).length > (firstLine.match(/,/g) ?? []).length ? ';' : ',';
    const rows = [];
    let row = [];
    let value = '';
    let quoted = false;

    for (let i = 0; i < source.length; i += 1) {
        const char = source[i];
        if (quoted) {
            if (char === '"' && source[i + 1] === '"') { value += '"'; i += 1; }
            else if (char === '"') quoted = false;
            else value += char;
        } else if (char === '"') quoted = true;
        else if (char === separator) { row.push(value); value = ''; }
        else if (char === '\n' || char === '\r') {
            if (char === '\r' && source[i + 1] === '\n') i += 1;
            row.push(value); rows.push(row); row = []; value = '';
        } else value += char;
    }
    if (value !== '' || row.length) { row.push(value); rows.push(row); }

    return rows.filter((cells) => cells.some((c) => c.trim() !== ''));
}

const slug = (words) => String(words).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '') || 'product';

/** The sample file: this shop's columns, a line on what each takes, and some of its own products. */
export function sampleFile({ categories = [], likes = [], products = [] }) {
    const leafs = categories.filter((one) => !categories.some((other) => other !== one && String(other.id).startsWith(`${one.id}/`)));
    const examples = [];
    for (const category of leafs) {
        const product = products.find((p) => (category.has ?? []).includes(p.id) && !examples.some((e) => e.product === p));
        if (product) examples.push({ product, category });
        if (examples.length === 3) break;
    }
    const lines = [COLUMNS.map(cell).join(',')];
    for (const { product, category } of examples) {
        const like = likes.find((l) => l.product === product.id);
        lines.push([`${product.name} (example)`, like?.price || product.price || '', '', category.title, like?.title ?? ''].map(cell).join(','));
    }

    return `${lines.join('\r\n')}\r\n`;
}

/**
 * The rows of an uploaded file, each checked: what will be imported, and what needs a fix first.
 *
 * @returns {{ ready: Array<object>, problems: Array<{ row: number, name: string, says: string }> }}
 */
export function readRows(rows, { categories = [], likes = [], catalogue = [], taken = [], products = [] }) {
    const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
    const at = (name) => header.indexOf(name);
    const problems = [];
    const ready = [];
    if (at('name') < 0 || at('price') < 0) {
        problems.push({ row: 1, name: '', says: 'The first row must name the columns, with at least "name" and "price". Start from the sample file.' });

        return { ready, problems };
    }
    const byName = new Map(categories.flatMap((c) => [[c.title.toLowerCase(), c], [String(c.id).toLowerCase(), c]]));
    const likeByName = new Map(likes.flatMap((l) => [[l.title.toLowerCase(), l], [String(l.product).toLowerCase(), l], [String(l.id).toLowerCase(), l]]));
    const used = new Set([...catalogue.map((p) => p.id), ...likes.map((l) => l.product), ...likes.map((l) => String(l.id).split('/').pop()), ...taken.map((t) => String(t).split('/').pop())]);

    rows.slice(1).forEach((cells, index) => {
        const value = (column) => (at(column) >= 0 ? (cells[at(column)] ?? '').trim() : '');
        const name = value('name');
        const price = value('price');
        const photo = value('photo');
        const says = [];
        if (!name) says.push('it has no name');
        else if (name.length > 120) says.push('its name is longer than 120 characters');
        if (!/\d/.test(price)) says.push(price ? `its price "${price}" has no figure` : 'it has no price');
        if (photo && !/^https:\/\/\S+$/.test(photo)) says.push('its photo is not a web address starting https://');

        const named = value('categories').split(/[|;\n]/).map((c) => c.trim()).filter(Boolean);
        const inCategories = [];
        for (const wanted of named) {
            const category = byName.get(wanted.toLowerCase());
            if (category) inCategories.push(category.id);
            else says.push(`the shop has no category "${wanted}"`);
        }

        // Made like the product its row names, or one already in its first category, or the shop's first.
        const likeName = value('looks like');
        let like = likeName ? likeByName.get(likeName.toLowerCase()) : null;
        if (likeName && !like) says.push(`the shop has no product "${likeName}" to make it like`);
        const first = categories.find((c) => c.id === inCategories[0]);
        like ??= likes.find((l) => (first?.has ?? []).includes(l.product)) ?? likes[0];
        if (!like) says.push('the shop has no product page to make it like');

        if (says.length) {
            problems.push({ row: index + 2, name, says: `Row ${index + 2}${name ? ` (${name})` : ''}: ${says.join(', ')}.` });

            return;
        }

        let id = slug(name);
        for (let n = 2; used.has(id); n += 1) id = `${slug(name).slice(0, 56)}-${n}`;
        used.add(id);
        ready.push({ id, name, price, photo, categories: [...new Set(inCategories)], like: like.id });
    });

    return { ready, problems };
}

/**
 * What saving an import writes: the catalogue with the new products, and each category's products
 * with those that belong in it (the categories their rows name, and the pages that hold them all).
 */
export function whatAnImportSaves({ ready, catalogue = [], categories = [], products = [] }) {
    const writes = [];
    const parents = categories.filter((one) => categories.some((other) => other !== one && String(other.id).startsWith(`${one.id}/`)));
    for (const category of categories) {
        if (!category.productsKey || !Array.isArray(category.has)) continue;
        const joining = ready.filter((p) => p.categories.includes(category.id) || parents.includes(category)).map((p) => p.id);
        if (joining.length) writes.push({ key: category.productsKey, before: category.chosen ?? null, value: [...category.has, ...joining.filter((id) => !category.has.includes(id))] });
    }

    return { catalogue: [...catalogue, ...ready], writes };
}

/** The Import products window. */
export function renderImport({ ui, config, products = [], save, done, notify, storage = window.sessionStorage }) {
    const shop = config.catalogue;
    const categories = config.categories ?? [];
    ui.title('Import products');
    ui.subtitle('Add many products at once from a spreadsheet. Each becomes a product with its own page, in the categories you name.');

    const steps = el('ol', 'le-import-steps');
    const one = el('li');
    const download = el('a', 'le-btn-outline le-import-sample', 'Download the sample file');
    download.href = URL.createObjectURL(new Blob([sampleFile({ categories, likes: shop.likes, products })], { type: 'text/csv' }));
    download.download = 'products-sample.csv';
    one.append(el('strong', null, 'Download the sample file'), el('p', 'le-hint', 'It has the columns this shop needs and some of its own products as examples. Open it in Excel, Numbers or Google Sheets.'), download);

    const two = el('li');
    const columns = el('ul', 'le-import-columns');
    for (const [column, what] of [
        ['name', 'The product’s name. Needed.'],
        ['price', 'As customers read it, with its figure: £24, $189, ₦15,000. Needed.'],
        ['photo', 'A web address of its photo, starting https://. You can change it later in the editor.'],
        ['categories', `Which categories it is in, by name, separated by |. This shop has: ${categories.map((c) => c.title).join(', ') || 'none'}.`],
        ['looks like', 'The name of one of the shop’s products whose page it copies (sizes, details). Leave it empty to use one from its first category.'],
    ]) {
        const row = el('li');
        row.append(el('code', null, column), el('span', null, ` ${what}`));
        columns.append(row);
    }
    two.append(el('strong', null, 'Fill in a row for each product'), columns, el('p', 'le-hint', 'Replace the example rows with your own. Save it as CSV.'));

    const three = el('li');
    const file = el('input', 'le-import-file');
    file.type = 'file';
    file.accept = '.csv,text/csv';
    file.setAttribute('aria-label', 'Choose your products file');
    three.append(el('strong', null, 'Upload it'), el('p', 'le-hint', 'Every row is checked before anything is added.'), file);
    steps.append(one, two, three);

    const report = el('div', 'le-import-report');
    report.setAttribute('aria-live', 'polite');
    ui.body.replaceChildren(steps, report);

    const waiting = el('span', 'le-modal-note');
    const go = el('button', 'le-btn-publish le-import-go', 'Import products');
    go.type = 'button';
    go.disabled = true;
    ui.foot.replaceChildren(waiting, go);
    ui.foot.hidden = false;

    let checked = { ready: [], problems: [] };
    file.addEventListener('change', async () => {
        const chosen = file.files?.[0];
        if (!chosen) return;
        const rows = parseCsv(await chosen.text());
        const room = 500 - (shop.items ?? []).length;
        checked = readRows(rows, { categories, likes: shop.likes, catalogue: shop.items ?? [], taken: config.taken ?? [], products });
        if (checked.ready.length > room) {
            checked.problems.push({ row: 0, name: '', says: `A shop holds 500 imported products; ${checked.ready.length - room} of these are left out.` });
            checked.ready = checked.ready.slice(0, Math.max(0, room));
        }
        report.replaceChildren(
            el('p', 'le-import-summary', `${checked.ready.length} ${checked.ready.length === 1 ? 'product is' : 'products are'} ready${checked.problems.length ? `, ${checked.problems.length} ${checked.problems.length === 1 ? 'row needs' : 'rows need'} a fix first` : ''}.`),
        );
        if (checked.ready.length) {
            const list = el('ul', 'le-import-ready');
            for (const product of checked.ready.slice(0, 50)) {
                const row = el('li');
                row.append(el('span', 'le-import-name', product.name), el('span', 'le-import-price', product.price),
                    el('span', 'le-hint', product.categories.map((id) => categories.find((c) => c.id === id)?.title).filter(Boolean).join(', ') || 'All products'));
                list.append(row);
            }
            if (checked.ready.length > 50) list.append(el('li', 'le-hint', `and ${checked.ready.length - 50} more`));
            report.append(list);
        }
        if (checked.problems.length) {
            const fixes = el('ul', 'le-import-problems');
            for (const problem of checked.problems) fixes.append(el('li', null, problem.says));
            report.append(el('p', 'le-hint', 'Fix these in your file and upload it again, or import the rest now:'), fixes);
        }
        go.disabled = !checked.ready.length;
        go.textContent = checked.ready.length ? `Import ${checked.ready.length} ${checked.ready.length === 1 ? 'product' : 'products'}` : 'Import products';
    });

    go.addEventListener('click', async () => {
        go.disabled = true;
        go.textContent = 'Importing…';
        ui.allowDismiss?.(false);
        const plan = whatAnImportSaves({ ready: checked.ready, catalogue: shop.items ?? [], categories, products });
        try {
            try { storage.setItem(UNDO_KEY, JSON.stringify({ catalogue: shop.items ?? [], writes: plan.writes.map((w) => ({ key: w.key, before: w.before })), count: checked.ready.length })); } catch { /* undo needs this browser's storage */ }
            await save(shop.key, JSON.stringify(plan.catalogue));
            for (const write of plan.writes) await save(write.key, JSON.stringify(write.value));
            done(`${checked.ready.length} ${checked.ready.length === 1 ? 'product imported' : 'products imported'}. Each has its own page, and is in its categories.`);
        } catch (error) {
            ui.allowDismiss?.(true);
            notify(error.message);
            go.disabled = false;
            go.textContent = `Import ${checked.ready.length} products`;
        }
    });

    return { check: (text) => { checked = readRows(parseCsv(text), { categories, likes: shop.likes, catalogue: shop.items ?? [], taken: config.taken ?? [], products }); return checked; } };
}

/** Take the last import back: the catalogue and each category as they were before it. */
export async function undoTheLastImport({ config, save, storage = window.sessionStorage }) {
    const kept = JSON.parse(storage.getItem(UNDO_KEY) ?? 'null');
    if (!kept) return 0;
    await save(config.catalogue.key, JSON.stringify(kept.catalogue ?? []));
    for (const write of kept.writes ?? []) await save(write.key, write.before === null ? '' : JSON.stringify(write.before));
    storage.removeItem(UNDO_KEY);

    return kept.count ?? 0;
}
