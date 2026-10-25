/**
 * Components belonging to the record opened from a card.
 *
 * Templates may put related cards, recommendations and sticky buy bars on the
 * same URL. Prefer the marked article/product component and its detail
 * siblings, with the whole page as a compatibility fallback for older markup.
 */
export const linkedDetailComponents = (pageRoot) => {
    const components = [...pageRoot.querySelectorAll('[data-component][data-instance]')];
    const primary = components.find(({ dataset }) =>
        /(?:\.article|\.detail|\.products-pdp-title|\.products-title)$/.test(dataset.component ?? '')
    );

    if (!primary) return [pageRoot];

    const instance = primary.dataset.instance ?? '';
    const prefix = instance.replace(/\.[^.]+$/, '');
    const roots = components.filter(({ dataset }) => {
        const componentInstance = dataset.instance ?? '';
        const component = dataset.component ?? '';
        const excluded = /(?:\.related|\.rel|\.sticky|\.mbar|\.reviews|\.product-grid)$/;

        return componentInstance === instance
            || (prefix && componentInstance.startsWith(`${prefix}.`)
                && !excluded.test(componentInstance)
                && !excluded.test(component));
    });

    return roots.length ? roots : [primary];
};

export const elementsInComponents = (components, selector) => components.flatMap((component) => [
    ...(component.matches?.(selector) ? [component] : []),
    ...component.querySelectorAll(selector),
]);
