import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';

import { elementsInComponents, linkedDetailComponents } from '../../resources/js/linked-detail-scope.js';

describe('linked detail component scope', () => {
    it('collects an article and product detail fields without recommendation cards or sticky controls', () => {
        const window = new Window();
        window.document.body.innerHTML = `
            <main id="article">
                <article data-component="vellumair.article" data-instance="blog-post.article">
                    <h1 data-edit="setting:title">Post title</h1>
                </article>
            </main>
            <main id="product">
                <section data-component="product.detail" data-instance="product-blue-hour.detail">
                    <h1 data-edit="setting:title">Blue Hour</h1>
                    <div data-edit-list="variants" data-edit-list-label="Sizes">
                        <label data-edit-item="50ml"><span data-edit="setting:variant-name">50 ml</span></label>
                    </div>
                </section>
                <section data-component="product.details" data-instance="product-blue-hour.details">
                    <p data-edit="setting:story">Scent story</p>
                </section>
                <section data-component="shop.product-grid" data-instance="product-blue-hour.related">
                    <h3 data-edit="setting:related-title">Related item</h3>
                </section>
                <div data-component="product.sticky" data-instance="product-blue-hour.sticky">
                    <b data-edit="setting:sticky-title">Buy Blue Hour</b>
                </div>
            </main>`;
        const main = window.document.querySelector('#product');
        const roots = linkedDetailComponents(main);
        const fieldNames = elementsInComponents(roots, '[data-edit]').map((node) => node.textContent.trim());
        const listLabels = elementsInComponents(roots, '[data-edit-list]').map((node) => node.dataset.editListLabel);

        expect(roots.map((node) => node.dataset.component)).toEqual(['product.detail', 'product.details']);
        expect(fieldNames).toEqual(['Blue Hour', '50 ml', 'Scent story']);
        expect(listLabels).toEqual(['Sizes']);

        window.happyDOM.abort();
    });

    it('falls back to the full page for older templates without component identities', () => {
        const window = new Window();
        window.document.body.innerHTML = '<main><article><h1 data-edit="setting:title">Legacy post</h1></article></main>';
        const main = window.document.querySelector('main');

        expect(linkedDetailComponents(main)).toEqual([main]);
        expect(elementsInComponents([main], '[data-edit]').map((node) => node.textContent)).toEqual(['Legacy post']);

        window.happyDOM.abort();
    });
});
