import { describe, expect, it } from 'vitest';
import { keptRead, readProduct, stillHolds, watchedBy } from '../../resources/js/products.js';

/*
 * The Products grid keeps each product it read (owner, 12 Nov 2026: "It should only make round trip if new products
 * are added"; "don't forget the invalidating strategies"). A kept read holds while every value it was read from is
 * the site's value now: its name, price, SKU, each size's price and SKU, its photo, and its list of sizes.
 */
const productPage = () => new DOMParser().parseFromString(`
    <main>
        <section>
            <img src="/a/puffer.jpg" data-edit-img="setting:tpl:photo">
            <div data-kit-product="puffer">
                <h1 data-kit-name data-edit="setting:tpl:name">Quilted puffer jacket</h1>
                <p data-kit-sku data-edit="setting:tpl:sku">OXH-1010</p>
                <p data-kit-price data-edit="setting:tpl:price">₦98,000</p>
                <ul data-edit-list="tpl:sizes">
                    <li data-edit-item="s"><span data-kit-variant>S</span> <span data-kit-price data-edit="setting:tpl:price-s">₦98,000</span></li>
                    <li data-edit-item="m"><span data-kit-variant>M</span> <span data-kit-price data-edit="setting:tpl:price-m">₦98,000</span></li>
                </ul>
            </div>
        </section>
    </main>`, 'text/html');

describe('a kept product read', () => {
    const doc = productPage();
    const read = keptRead(readProduct(doc, 'https://shop.test/products/puffer'));
    const saved = { 'tpl:price': '₦98,000' };
    const watch = watchedBy(doc, read, saved);

    it('watches its words, its photo and its list of sizes, with the values it was read from', () => {
        expect(watch).toEqual({
            'tpl:name': null,
            'tpl:price': '₦98,000',
            'tpl:sku': null,
            'tpl:price-s': null,
            'tpl:price-m': null,
            'tpl:photo': null,
            'tpl:sizes': null,
        });
    });

    it('holds while nothing it was read from changed, whatever else on the site did', () => {
        expect(stillHolds(watch, { ...saved, 'tpl:footer': 'New footer words' })).toBe(true);
    });

    it('is read again when anyone changes its name, a price, its photo or its sizes', () => {
        expect(stillHolds(watch, { ...saved, 'tpl:name': 'Puffer, the warm one' })).toBe(false);
        expect(stillHolds(watch, { 'tpl:price': '₦89,000' })).toBe(false);
        expect(stillHolds(watch, { ...saved, 'tpl:price-m': '₦90,000' })).toBe(false);
        expect(stillHolds(watch, { ...saved, 'tpl:photo': '/media/new.jpg' })).toBe(false);
        expect(stillHolds(watch, { ...saved, 'tpl:sizes': '["s","m","n1"]' })).toBe(false);
    });

    it('is read again when a word it was read with is taken back to the design’s', () => {
        expect(stillHolds(watch, {})).toBe(false);
    });
});
