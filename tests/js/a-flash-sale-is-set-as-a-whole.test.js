// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
    amountOf, dayOf, endSaid, flashSalePlan, keepRowInStep, ownPricesAmong, percentOff, priceStyleOf, readSale, saleFor,
    saleLabel, saleLineOf, saleRow, saleWrites, sizeKey, sizesSummary, stockFor, stockPlan, wordsForDay, writePrice, ownPriceOf,
} from '../../resources/js/sale.js';
import { renderDataGrid } from '../../resources/js/data-panel.js';

/*
 * A flash sale, set as a whole (owner, 8 Nov 2026: "sales card must be editable at once, not each being editable one
 * by one"; "just like we can edit tables, cards"). The grid writes the words the shop already reads on each product
 * page (the website's TheSaleOnAProduct::fromWords and TheShopASiteSells::amountOf), so these are held to them.
 */

const productPage = ({ price = '₦74,950', sale = '₦54,950', from = '8 Nov 2026', until = '31 Dec 2026' } = {}) => {
    document.body.innerHTML = `
      <main><section data-kit-product="kemi">
        <h1>Kemi gingham dress</h1>
        <p><span data-kit-price data-edit="setting:tpl:kemi.price">${price}</span></p>
        <p data-kit-sale hidden><span data-edit="setting:tpl:kemi.word">Flash sale</span>
          <span data-kit-sale-price data-edit="setting:tpl:kemi.sale">${sale}</span>
          <span data-edit="setting:tpl:kemi.from-word"> from <span data-kit-sale-from data-edit="setting:tpl:kemi.from">${from}</span></span>
          <span data-kit-sale-until data-edit="setting:tpl:kemi.until">${until}</span></p>
        <div data-options data-list="szs"><label data-item="t1"><span data-kit-variant>4–5 years</span><span data-kit-price data-edit="setting:tpl:kemi.p1">₦74,950</span></label></div>
      </section></main>`;

    return document.querySelector('[data-kit-sale]');
};

describe('a price, read and written as the shop reads it', () => {
    it('reads an amount the way the server does', () => {
        expect(amountOf('₦49,950')).toBe(4995000);
        expect(amountOf('49950')).toBe(4995000);
        expect(amountOf('49,950')).toBe(4995000);
        expect(amountOf('$118.50')).toBe(11850);
        expect(amountOf('No sale')).toBeNull();
        expect(amountOf('')).toBeNull();
    });

    it('writes an amount like the page writes its prices', () => {
        expect(writePrice(4995000, '₦74,950')).toBe('₦49,950');
        expect(writePrice(1800, '£24')).toBe('£18');
        expect(writePrice(11850, '$96')).toBe('$118.50');
        expect(writePrice(4995000, 'NGN 74950')).toBe('NGN 49950');
        expect(writePrice(9000, '€90.00')).toBe('€90.00');
        expect(priceStyleOf('₦74,950').before).toBe('₦');
    });

    it('works out the share off as the templates show it, and a price from a share', () => {
        expect(percentOff(4995000, 7495000)).toBe(33);
        expect(percentOff(7495000, 7495000)).toBe(0);
        expect(saleFor(7495000, 20)).toBe(5996000);
    });
});

describe('a day, read and written as the shop reads it', () => {
    it('reads the days the server reads, and nothing else', () => {
        expect(dayOf('8 Nov 2026')).toBe('2026-11-08');
        expect(dayOf('8 November 2026')).toBe('2026-11-08');
        expect(dayOf('2026-11-08')).toBe('2026-11-08');
        expect(dayOf(' 31  Dec 2026 ')).toBe('2026-12-31');
        expect(dayOf('Today')).toBeNull();
        expect(dayOf('No end date')).toBeNull();
        expect(dayOf('31 Feb 2026')).toBeNull();
    });

    it('writes a day as "8 Nov 2026", and no day as the words that mean none', () => {
        expect(wordsForDay('2026-11-08')).toBe('8 Nov 2026');
        expect(wordsForDay('', 'Today')).toBe('Today');
        expect(wordsForDay(null, 'No end date')).toBe('No end date');
    });

    it('says when the sale ends, in days', () => {
        expect(endSaid('2026-12-31', '2026-11-08')).toBe('Ends 31 Dec 2026, in 53 days.');
        expect(endSaid('2026-11-09', '2026-11-08')).toBe('Ends 9 Nov 2026, in 1 day.');
        expect(endSaid('2026-11-08', '2026-11-08')).toBe('Ends today, 8 Nov 2026.');
        expect(endSaid('2026-11-01', '2026-11-08')).toMatch(/^Ended 1 Nov 2026\./);
        expect(endSaid(null, '2026-11-08')).toMatch(/^No end day/);
    });
});

describe('a product page\'s sale line', () => {
    it('is found from any of its words, and from the product\'s own price, never a size\'s', () => {
        const line = productPage();
        expect(saleLineOf(line.querySelector('[data-kit-sale-until]'))).toBe(line);
        expect(saleLineOf(document.querySelector('[data-kit-price]'))).toBe(line);
        expect(saleLineOf(document.querySelector('[data-options] [data-kit-price]'))).toBeNull();
        expect(ownPriceOf(line).textContent).toBe('₦74,950');
    });

    it('is read with the key each part is saved under', () => {
        const read = readSale(productPage());
        expect(read.own).toBe(7495000);
        expect(read.onSale).toBe(true);
        expect(read.sale.key).toBe('setting:tpl:kemi.sale');
        expect(read.from.words).toBe('8 Nov 2026');
        expect(saleRow({ name: 'Kemi', read })).toEqual(['1', 'Kemi', '₦74,950', '₦54,950', '27']);
    });

    it('writes only what changed, in the shop\'s own words', () => {
        const read = readSale(productPage());
        expect(saleWrites(read, { on: true, price: null, sale: 4995000, from: '2026-11-08', until: '2026-12-31' }))
            .toEqual([{ key: 'setting:tpl:kemi.sale', node: read.sale.node, value: '₦49,950' }]);
        expect(saleWrites(read, { on: true, price: null, sale: 5495000, from: null, until: null }).map((w) => w.value))
            .toEqual(['Today', 'No end date']);
        expect(saleWrites(read, { on: false, price: null, sale: null }).map((w) => w.value)).toEqual(['No sale']);
    });

    it('is labelled for the owner: on sale, starting, or ended', () => {
        expect(saleLabel(readSale(productPage()), '2026-11-08')).toBe('On sale · ₦54,950 · ends 31 Dec');
        expect(saleLabel(readSale(productPage({ from: '12 Nov 2026' })), '2026-11-08')).toBe('Sale starts 12 Nov');
        expect(saleLabel(readSale(productPage({ until: '1 Nov 2026', from: 'Today' })), '2026-11-08')).toBe('Sale ended');
        expect(saleLabel(readSale(productPage({ sale: 'No sale' })), '2026-11-08')).toBeNull();
        // not below the price: no sale, as the server says
        expect(saleLabel(readSale(productPage({ sale: '₦80,000' })), '2026-11-08')).toBeNull();
    });
});

describe('the grid', () => {
    const products = () => {
        const kemi = { id: 'kemi', name: 'Kemi', path: '/edit/products/kemi', read: readSale(productPage()) };
        const bag = { id: 'bag', name: 'Bag', path: '/edit/products/bag', read: readSale(productPage({ price: '₦20,000', sale: 'No sale', from: 'Today', until: 'No end date' })) };

        return [kemi, bag];
    };

    it('keeps a sale price and its % off in step, and ticks the product', () => {
        const [, bag] = products();
        const cells = ['', 'Bag', '₦20,000', '', ''];
        expect(keepRowInStep(bag, 4, cells)).toEqual(['', 'Bag', '₦20,000', '', '']);
        cells[4] = '25';
        expect(keepRowInStep(bag, 4, cells)).toEqual(['1', 'Bag', '₦20,000', '₦15,000', '25']);
        cells[3] = '16000';
        expect(keepRowInStep(bag, 3, cells)[4]).toBe('20');
        // left, it reads as the shop writes its prices
        expect(keepRowInStep(bag, 3, cells, true)[3]).toBe('₦16,000');
    });

    it('saves every product at once: ticked on sale between the days, unticked "No sale"', () => {
        const list = products();
        const plan = flashSalePlan(list, [['', 'Kemi', '', '', ''], ['1', 'Bag', '', '₦15,000', '25']], { from: null, until: '2026-12-31', daysChanged: true });
        expect(plan.refused).toEqual([]);
        expect(plan.writes.map(({ key, value }) => [key, value])).toEqual([
            ['setting:tpl:kemi.sale', 'No sale'],
            ['setting:tpl:kemi.sale', '₦15,000'],
            ['setting:tpl:kemi.until', '31 Dec 2026'],
        ]);
    });

    it('keeps each product\'s own days when the sale\'s days were not changed', () => {
        const list = products();
        const plan = flashSalePlan(list, [['1', 'Kemi', '', '₦49,950', '33'], ['', 'Bag', '', '', '']], { from: null, until: '2027-01-31' });
        expect(plan.writes.map(({ value }) => value)).toEqual(['₦49,950']);
    });

    it('refuses a sale with no price, or not below the price, saying which product', () => {
        const list = products();
        expect(flashSalePlan(list, [['1', 'Kemi', '', '', ''], ['', 'Bag', '', '', '']]).refused[0]).toBe('Kemi has no sale price. Type a sale price or a % off, or untick it.');
        expect(flashSalePlan(list, [['1', 'Kemi', '', '₦90,000', ''], ['', 'Bag', '', '', '']]).refused[0]).toBe('The sale price for Kemi must be less than its price, ₦74,950.');
        expect(flashSalePlan(list, [['', 'Kemi', '', '', ''], ['', 'Bag', '', '', '']], { from: '2026-12-01', until: '2026-11-30', daysChanged: true }).refused)
            .toContain('The end day is before the start day. Choose an end day on or after it.');
    });

    it('carries stock: a product\'s own count, or its sizes folded under it, and sends only what changed', () => {
        const list = products();
        const stock = [
            { product: 'products/kemi', name: 'Kemi', size: '4–5 years', quantity: 3 },
            { product: 'products/kemi', name: 'Kemi', size: '5–6 years', quantity: null },
            { product: 'products/bag', name: 'Bag', size: '', quantity: 0 },
        ];
        const kemi = stockFor(list[0], stock);
        const bag = stockFor(list[1], stock);
        expect(kemi.own).toBeNull();
        expect(kemi.sizes.map((row) => row.size)).toEqual(['4–5 years', '5–6 years']);
        expect(bag.own.quantity).toBe(0);
        expect(sizesSummary(kemi.sizes)).toBe('3 in 1 of 2 sizes');
        expect(sizesSummary(kemi.sizes, { [sizeKey(kemi.sizes[1])]: '9' })).toBe('12 in 2 sizes');
        expect(sizesSummary(kemi.sizes, { [sizeKey(kemi.sizes[0])]: '0' })).toBe('1 size sold out');
        expect(sizesSummary(kemi.sizes, { [sizeKey(kemi.sizes[0])]: '' })).toBe('Not counted');
        const items = [
            { row: kemi.sizes[0], typed: undefined, label: 'Kemi, 4–5 years' },
            { row: kemi.sizes[1], typed: '7', label: 'Kemi, 5–6 years' },
            { row: bag.own, typed: '', label: 'Bag' },
        ];
        expect(stockPlan(items).changes).toEqual([
            { product: 'products/kemi', size: '5–6 years', quantity: 7 },
            { product: 'products/bag', size: '', quantity: null },
        ]);
        items[1].typed = 'lots';
        expect(stockPlan(items).refused).toEqual(['In stock for Kemi, 5–6 years must be a whole number, like 12, or empty.']);
    });

    it('counts the ticked products that already have their own sale price, before one % off changes them', () => {
        expect(ownPricesAmong([['1', 'A', '', '₦10', '10'], ['1', 'B', '', '', ''], ['', 'C', '', '₦5', '']])).toBe(1);
    });

    it('draws as the table grid: ticks, words that are read, a size\'s row with no sale of its own, and Sold out', async () => {
        const grid = renderDataGrid({
            heads: ['On sale', 'Product', 'Price', 'Sale price', '% off', 'In stock'],
            rows: [['1', 'Kemi', '₦74,950', '₦54,950', '27', ''], ['', 'Kemi · 4–5 years', '', '', '', '0']],
            fixedColumns: true,
            fixedRows: true,
            numbered: false,
            kinds: ['tick', 'read', 'read', 'text', 'text', 'count'],
            kindOf: (r, c) => (r === 1 && [0, 3, 4].includes(c) ? 'blank' : null),
            picked: 0,
            onSave: async () => [],
        });
        document.body.replaceChildren(grid);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        expect(grid.querySelectorAll('input[type=checkbox]')).toHaveLength(1);
        expect(grid.querySelector('tr.is-picked .le-figures-read').textContent).toBe('Kemi');
        expect(grid.querySelector('.le-figures-tools').hidden).toBe(true);
        expect(grid.querySelectorAll('thead input')).toHaveLength(0);
        expect(grid.querySelector('td.is-sold-out')).not.toBeNull();
        expect(grid.querySelector('button.le-btn-primary').disabled).toBe(true);
        grid.querySelector('input[type=checkbox]').click();
        expect(grid.querySelector('button.le-btn-primary').disabled).toBe(false);
    });
});
