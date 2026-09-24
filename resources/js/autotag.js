/**
 * Making a page editable that nobody prepared.
 *
 * A site built on a framework is tagged while it renders, and one we sold was
 * tagged before it shipped. Somebody who bought a template elsewhere has
 * neither — and telling them to install PHP and run a command is the
 * difference between a product and a favour.
 *
 * So the page sends what it has and is told which of its own elements are
 * editable. Nothing is written to their files and there is no build step. The
 * scanner stays on the server, which is where the work worth paying for is.
 */

const CACHE_PREFIX = 'kb_tags_';

/** Cheap, stable, and enough to notice a page that has changed. */
export const fingerprint = (html) => {
    let h = 0x811c9dc5;

    for (let i = 0; i < html.length; i++) {
        h ^= html.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }

    return (h >>> 0).toString(16);
};

/**
 * Follow a path of child indices from the document root.
 *
 * Positions rather than selectors, because the server computed them from the
 * very markup this page sent — so the two agree by construction, where a
 * generated selector can still match the wrong thing on a page nobody wrote
 * carefully.
 */
export const elementAt = (root, path) => {
    let node = root.documentElement;

    for (const index of path) {
        const children = [...(node?.children ?? [])];
        node = children[index];

        if (!node) {
            return null;
        }
    }

    return node;
};

/** @param {Array<{at: number[], attributes: Record<string,string>}>} elements */
export const applyTags = (root, elements) => {
    let applied = 0;

    for (const { at, attributes } of elements ?? []) {
        const node = elementAt(root, at);

        if (!node) {
            continue;
        }

        for (const [name, value] of Object.entries(attributes)) {
            // Never overwrite a marker already in the markup: a site that was
            // properly prepared keeps the keys it shipped with, and a client's
            // saved words stay attached to them.
            if (!node.hasAttribute(name)) {
                node.setAttribute(name, value);
            }
        }

        applied++;
    }

    return applied;
};

const cached = (key) => {
    try {
        return JSON.parse(window.sessionStorage?.getItem(key) ?? 'null');
    } catch {
        return null;
    }
};

const remember = (key, value) => {
    try {
        window.sessionStorage?.setItem(key, JSON.stringify(value));
    } catch {
        // Storage refused. It costs one request per page view, which is worse
        // than caching and better than not working.
    }
};

/**
 * Ask what is editable here, and mark it.
 *
 * Asked once per version of a page: the answer is kept against a fingerprint
 * of the markup, so a redeploy asks again and an unchanged page does not.
 */
export const autoTag = async ({ base, site, key, page }, doc = document) => {
    if (doc.querySelector('[data-edit], [data-edit-img]')) {
        // Already prepared — by the CLI, by a framework, or by whoever sold it.
        return 0;
    }

    const html = doc.documentElement.outerHTML;
    const id = CACHE_PREFIX + fingerprint(html);
    const known = cached(id);

    if (known) {
        return applyTags(doc, known);
    }

    const response = await fetch(`${String(base).replace(/\/$/, '')}/${site}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ html, page: page ?? doc.location?.pathname ?? '' }),
    });

    if (!response.ok) {
        throw new Error(`Tagging answered ${response.status}`);
    }

    const { elements } = await response.json();
    remember(id, elements);

    return applyTags(doc, elements);
};
