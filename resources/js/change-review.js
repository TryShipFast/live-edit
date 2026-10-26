const parseItemOrder = (value) => {
    try {
        const ids = Array.isArray(value) ? value : JSON.parse(String(value ?? ''));

        return Array.isArray(ids) && ids.length > 0 && ids.every((id) => typeof id === 'string')
            ? ids
            : null;
    } catch {
        return null;
    }
};

const isItemOrder = (ids) => ids?.every((id) => /^(?:i\d+|n[0-9a-z]+|s-[a-z0-9-]+)$/i.test(id));

/** Turn the opaque id array for a reordered list into the words on the page. */
export const describeListChange = (change, root = document) => {
    const beforeIds = parseItemOrder(change.before);
    const afterIds = parseItemOrder(change.after);

    if (!isItemOrder(beforeIds) && !isItemOrder(afterIds)) return null;

    const lists = [...root.querySelectorAll('[data-edit-list]')];
    const key = String(change.key ?? '').replace(/^setting:/, '');
    const sameKey = lists.find((candidate) => candidate.dataset.editList === key);
    const order = afterIds ?? beforeIds ?? [];
    const score = (candidate) => {
        const ids = new Set([...candidate.children]
            .filter((child) => child.dataset.editItem)
            .map((child) => child.dataset.editItem));

        return order.reduce((total, id) => total + Number(ids.has(id)), 0);
    };
    // A migrated setting key can differ from the markup key. Item IDs are the
    // stable link; prefer a nav list when multiple lists share the same IDs.
    const list = sameKey ?? lists
        .map((candidate) => ({ candidate, matches: score(candidate), nav: Number(Boolean(candidate.closest('nav'))) }))
        .filter(({ matches }) => matches > 0)
        .sort((a, b) => b.matches - a.matches || b.nav - a.nav)[0]?.candidate;

    if (!list) {
        return { label: 'Navigation order', before: beforeIds ? 'Previous menu order' : null, after: 'Menu order updated' };
    }

    const items = new Map([...list.children]
        .filter((child) => child.dataset.editItem)
        .map((child) => {
            const control = child.querySelector('a, button, [data-edit="text"], h1, h2, h3, h4, h5, h6, img');
            const label = control?.textContent || control?.getAttribute('aria-label')
                || child.querySelector('img')?.alt || child.textContent;

            return [child.dataset.editItem, String(label ?? '').replace(/\s+/g, ' ').trim() || 'Menu item'];
        }));
    const readOrder = (ids) => ids?.map((id) => items.get(id) || 'Menu item').join(' · ') ?? null;
    const nav = list.closest('nav');
    const name = list.dataset.editListLabel || nav?.getAttribute('aria-label');
    const label = nav
        ? `${name && !/^(main|primary|navigation)$/i.test(name) ? `${name} ` : ''}navigation order`
        : name ? `${name} order` : 'List order';

    return { label, before: readOrder(beforeIds), after: readOrder(afterIds) || 'Menu order updated' };
};
