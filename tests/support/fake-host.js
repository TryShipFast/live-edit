/*
 * A hosted site in miniature: a design with a shop, two products and a
 * journal, drawn the way the hosting app draws it for the editor.
 *
 * The real host is a Laravel app (TheDesignersMarkersBecomeKeys and
 * ThePagesTheOwnerArranged). What matters to the engine is reproduced here,
 * and nothing else:
 *
 *   - a field's key is a hash of where it sits in its design file, under the
 *     page's name ("page:<page>/<path>"), so the same markup on two pages has
 *     two keys and nothing in the key says which element it is;
 *   - a page the owner made is the site's shell with the sections they added,
 *     each cut from its design file and keyed as its own copy
 *     ("added:<page>/<added id>"), renamed "<page>.<added id>";
 *   - lists, items and sections are named from the page, the instance and the
 *     list (listsTheKitNames, sectionsTheKitNames);
 *   - the owner's saved words and orders are laid over the page before it is
 *     served (PrepareMarkup), with drafts, because this is the editor.
 *
 * `makeDocument(html)` parses markup into a Document, so this runs under
 * happy-dom in the unit tests and in Node behind the browser journey.
 */

import { applyContent, applyStyles } from '../../resources/js/content.js';

/* ------------------------------ the design ------------------------------ */

const header = `
<header data-instance="site.header" data-component="core.header">
  <a class="logo" href="../../shop/" data-key="nav.logo" data-edit="link">Vellum</a>
  <nav><a href="../../shop/" data-key="nav.shop" data-edit="link">Shop</a> <a href="../../journal/" data-key="nav.journal" data-edit="link">Journal</a></nav>
</header>`;

const footer = `
<footer data-instance="site.footer" data-component="core.footer"><p data-edit="text">Made in small batches.</p></footer>`;

const product = (slug, name, price, story) => `
<main>
  <section data-instance="${slug}.detail" data-component="shop.detail" data-label="Product">
    <div class="gallery"><img data-edit="image" src="https://img.test/${slug}.jpg" alt="${name}"></div>
    <div class="buy">
      <h1 data-edit="text" data-field="name">${name}</h1>
      <p class="price"><span data-edit="text" data-field="price" data-price-out>${price}</span></p>
      <p data-edit="text" data-field="notes">Top notes of ${slug} and cedar.</p>
      <div class="sizes" data-list="sizes" data-label="Sizes" data-max="4">
        <label data-item="s50" data-kit-variant="50ml"><span data-edit="text" data-field="size">50 ml</span> <span data-edit="text" data-field="price">${price}</span></label>
        <label data-item="s100" data-kit-variant="100ml"><span data-edit="text" data-field="size">100 ml</span> <span data-edit="text" data-field="price">$180</span></label>
      </div>
      <div class="colours" data-list="colours" data-label="Bottle">
        <button data-item="amber"><span data-edit="text">Amber glass</span></button>
        <button data-item="clear"><span data-edit="text">Clear glass</span></button>
      </div>
    </div>
  </section>
  <section data-instance="${slug}.story" data-component="shop.details" data-label="Story">
    <h2 data-edit="text">The story</h2>
    <p data-edit="text">${story}</p>
  </section>
  <section data-instance="${slug}.related" data-component="shop.product-grid" data-label="You may also like">
    <h2 data-edit="text">You may also like</h2>
    <a href="../other/" data-edit="link">Another scent</a>
  </section>
</main>`;

const post = (slug, title) => `
<main>
  <article data-instance="${slug}.article" data-component="journal.article" data-label="Post">
    <p class="kicker" data-edit="text">Field notes</p>
    <h1 data-edit="text" data-field="title">${title}</h1>
    <img data-edit="image" src="https://img.test/${slug}.jpg" alt="">
    <p data-edit="text" data-field="lead">A short walk at first light.</p>
    <div class="body"><p data-edit="text">The first paragraph of ${title}.</p><p data-edit="text">The second paragraph.</p></div>
    <ul class="gallery" data-list="pictures" data-label="Pictures">
      <li data-item="p1"><img data-edit="image" src="https://img.test/${slug}-1.jpg" alt=""><span data-edit="text">Morning</span></li>
      <li data-item="p2"><img data-edit="image" src="https://img.test/${slug}-2.jpg" alt=""><span data-edit="text">Noon</span></li>
    </ul>
  </article>
  <section data-instance="${slug}.related" data-component="journal.related" data-label="More posts">
    <h2 data-edit="text">More from the journal</h2>
  </section>
</main>`;

const shop = `
<main>
  <section data-instance="shop.grid" data-component="shop.grid" data-label="Products">
    <h1 data-edit="text">Shop</h1>
    <ul class="cards" data-list="products" data-label="Products" data-max="12">
      <li data-item="aster" data-kit-product="aster">
        <img data-edit="image" src="https://img.test/aster-veil.jpg" alt="">
        <h3><a data-edit="link" data-link-page="products/aster-veil" href="../products/aster-veil/">Aster Veil</a></h3>
        <p data-edit="text" data-field="notes">Neroli and cedar</p>
        <span data-edit="text" data-kit-price data-field="price">$118</span>
      </li>
      <li data-item="blue" data-kit-product="blue">
        <img data-edit="image" src="https://img.test/blue-hour.jpg" alt="">
        <h3><a data-edit="link" data-link-page="products/blue-hour" href="../products/blue-hour/">Blue Hour</a></h3>
        <p data-edit="text" data-field="notes">Iris and rain</p>
        <span data-edit="text" data-kit-price data-field="price">$96</span>
      </li>
    </ul>
  </section>
  <section data-instance="shop.journal" data-component="journal.list" data-label="Journal">
    <ul class="posts" data-list="posts" data-label="Journal">
      <li data-item="first">
        <h3><a data-edit="link" data-link-page="journal/first-light" href="../journal/first-light/">First light</a></h3>
        <p data-edit="text" data-field="lead">A short walk at first light.</p>
      </li>
      <li data-item="second">
        <h3><a data-edit="link" data-link-page="journal/salt-air" href="../journal/salt-air/">Salt air</a></h3>
        <p data-edit="text" data-field="lead">The coast in winter.</p>
      </li>
    </ul>
  </section>
</main>`;

const page = (title, main) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title} | Vellum</title>
<style>body{font-family:sans-serif;margin:0} header,footer{background:#eee;padding:12px} main{padding:24px} .cards,.posts,.gallery{display:flex;gap:16px;list-style:none;padding:0} .cards li,.posts li{border:1px solid #ddd;padding:12px;width:220px} img{width:120px;height:80px;object-fit:cover;background:#ccd}</style>
</head><body>${header}${main}${footer}</body></html>`;

/** The design's own pages, by address, as the design files hold them. */
export const DESIGN = {
    shop: { title: 'Shop', html: page('Shop', shop) },
    'products/aster-veil': { title: 'Aster Veil', html: page('Aster Veil', product('aster-veil', 'Aster Veil', '$118', 'Neroli picked at dawn, laid over cedar.')) },
    'products/blue-hour': { title: 'Blue Hour', html: page('Blue Hour', product('blue-hour', 'Blue Hour', '$96', 'Iris after rain.')) },
    'journal/first-light': { title: 'First light', html: page('First light', post('first-light', 'First light')) },
    'journal/salt-air': { title: 'Salt air', html: page('Salt air', post('salt-air', 'Salt air')) },
};

/** The design's sections an owner can add to any page (TheKit::library), with the page each one is kept on. */
export const LIBRARY = [
    { from: 'aster-veil.story', label: 'Story', page: 'Aster Veil', file: 'products/aster-veil' },
    { from: 'first-light.related', label: 'More posts', page: 'First light', file: 'journal/first-light' },
    { from: 'shop.journal', label: 'Journal', page: 'Shop', file: 'shop' },
];

/* ------------------------------ keys, as the host makes them ------------------------------ */

/** A short, stable hash. The real host uses sha256; any hash that hides the path does the same job here. */
export const hash = (text) => {
    let a = 0x811c9dc5;
    let b = 0x01000193;
    for (let i = 0; i < text.length; i += 1) {
        a = Math.imul(a ^ text.charCodeAt(i), 16777619) >>> 0;
        b = Math.imul(b ^ text.charCodeAt(i), 2246822519) >>> 0;
    }

    return (a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')).slice(0, 12);
};

const whereItSits = (element) => {
    const steps = [];
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
        let at = 0;
        for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
            if (sibling.tagName === node.tagName) at += 1;
        }
        steps.unshift(`${node.tagName.toLowerCase()}:${at}`);
        if (node.tagName === 'BODY') break;
    }

    return steps.join('>');
};

const inABand = (element) => Boolean(element.closest('header, footer, nav'));

/** convertEveryMarker: the designer's shorthand becomes keys, named for `name`. */
const keyMarkers = (doc, name, bandsAreShared = true) => {
    const keyFor = (element, named = true) => {
        const designed = named ? element.getAttribute('data-key') : null;
        if (designed) return `tpl:${hash(`named:${designed}`)}`;
        const identity = bandsAreShared && inABand(element)
            ? `shared/${element.textContent.trim()}`
            : `page:${name}/${whereItSits(element)}`;

        return `tpl:${hash(identity)}`;
    };
    const styleable = (element, key) => {
        if (!element.hasAttribute('data-style')) element.setAttribute('data-style', `t${hash(key)}`);
        element.setAttribute('data-style-props', 'textColor,fontSize,fontWeight,lineHeight,textAlign');
    };
    for (const marker of ['text', 'link', 'image']) {
        for (const element of [...doc.querySelectorAll(`[data-edit="${marker}"]`)]) {
            const key = keyFor(element);
            if (marker === 'image') {
                element.setAttribute('data-edit-img', `setting:${key}`);
                element.removeAttribute('data-edit');
            } else if (marker === 'link') {
                element.setAttribute('data-edit-href', element.hasAttribute('data-key') ? keyFor(element, false) : key);
                element.setAttribute('data-edit', `setting:${key}.text`);
                styleable(element, key);
            } else {
                element.setAttribute('data-edit', `setting:${key}`);
                styleable(element, key);
            }
        }
    }
};

/** listsTheKitNames and sectionsTheKitNames, for the page `page`. */
const nameListsAndSections = (doc, page) => {
    for (const list of doc.querySelectorAll('[data-list]:not([data-edit-list])')) {
        const owner = list.closest('[data-instance]')?.getAttribute('data-instance');
        if (!owner) continue;
        const identity = `${owner.startsWith('site.') ? 'shared' : `page:${page}`}/list:${owner}/${list.getAttribute('data-list')}`;
        list.setAttribute('data-edit-list', `tpl:${hash(identity)}`);
        if (list.hasAttribute('data-label')) list.setAttribute('data-edit-list-label', list.getAttribute('data-label'));
        if (/^\d+$/.test(list.getAttribute('data-max') ?? '')) {
            list.setAttribute('data-edit-list-max', list.getAttribute('data-max'));
            list.setAttribute('data-edit-list-min', '1');
        }
        for (const item of list.children) {
            if (!item.hasAttribute('data-item')) continue;
            item.setAttribute('data-edit-item', item.getAttribute('data-item'));
            if (!item.hasAttribute('data-style')) item.setAttribute('data-style', `i${hash(`${identity}/item:${item.getAttribute('data-item')}`)}`);
        }
    }

    const containers = new Set();
    for (const section of doc.querySelectorAll('[data-instance]:not([data-edit-section])')) {
        const id = section.getAttribute('data-instance');
        if (id.startsWith('site.')) continue;
        section.setAttribute('data-edit-section', id);
        section.setAttribute('data-edit-section-label', section.getAttribute('data-label') || id);
        section.setAttribute('data-edit-section-duplicate', 'true');
        if (!section.hasAttribute('data-style')) section.setAttribute('data-style', `s${hash(`page:${page}/section:${id}`)}`);
        containers.add(section.parentElement);
    }
    [...containers].forEach((container, n) => {
        if (container.hasAttribute('data-edit-list')) return;
        const children = [...container.children].filter((child) => !child.hasAttribute('data-kit-page-heading'));
        if (!children.every((child) => child.hasAttribute('data-edit-section'))) return;
        container.setAttribute('data-edit-list', `tpl:${hash(`page:${page}/sections:${n}`)}`);
        container.setAttribute('data-edit-list-kind', 'sections');
        container.setAttribute('data-edit-list-label', 'Page sections');
        for (const child of children) {
            const section = child.getAttribute('data-edit-section');
            child.setAttribute('data-edit-item', `s-${section.slice(section.indexOf('.') + 1)}`);
        }
    });
};

/* ------------------------------ the host ------------------------------ */

/**
 * A site built from DESIGN, with the owner's saved settings and styles.
 * `removable` lets the owner delete the design's own pages (the host contract
 * this engine asks for: `removedKey` in the page builder). `library` hands the
 * editor the design's sections to add (LIBRARY), as a site with a Kit does.
 * `outside` hands over no page builder at all: an outside site (the plugin or
 * another adapter), which gets in-place editing only.
 */
export function createHost({ makeDocument, serialise = (doc) => `<!doctype html>${doc.documentElement.outerHTML}`, removable = false, library = false, outside = false } = {}) {
    const settings = {};
    const styles = {};
    const saves = [];

    const made = () => {
        try {
            const listed = JSON.parse(settings['structure:pages'] ?? '[]');

            return Array.isArray(listed) ? listed.filter((entry) => entry?.id && !DESIGN[entry.id]) : [];
        } catch {
            return [];
        }
    };
    const removed = () => {
        try { return JSON.parse(settings['structure:removed'] ?? '[]'); } catch { return []; }
    };
    const addedTo = (id) => {
        try { return JSON.parse(settings[`structure:page:${id === '' ? 'home' : id}`] ?? '{}').added ?? {}; } catch { return {}; }
    };
    const fileOf = (instance) => Object.keys(DESIGN).find((id) => DESIGN[id].html.includes(`data-instance="${instance}"`)) ?? null;

    /** One design section, keyed as a copy named `added:<page>/<id>` and renamed for its new page (keysOnly, cut). */
    const sectionAdded = (doc, page, id, from) => {
        const file = fileOf(from);
        if (!file || from.startsWith('site.')) return null;
        const source = makeDocument(DESIGN[file].html);
        keyMarkers(source, `added:${page === '' ? 'home' : page}/${id}`, false);
        const section = source.querySelector(`[data-instance="${from}"]`);
        if (!section) return null;
        section.setAttribute('data-instance', `${page === '' ? 'home' : page}.${id}`);

        return doc.importNode ? doc.importNode(section, true) : section.cloneNode(true);
    };

    /** The page at an address, keyed, arranged and with the owner's words over it, or null. */
    const draw = (id) => {
        if (removed().includes(id)) return null;
        let doc;
        if (DESIGN[id]) {
            doc = makeDocument(DESIGN[id].html);
            keyMarkers(doc, id);
        } else {
            const mine = made().find((entry) => entry.id === id);
            if (!mine) return null;
            // The shell: one of the design's pages with its own sections taken out.
            doc = makeDocument(DESIGN.shop.html);
            keyMarkers(doc, id);
            const main = doc.querySelector('main');
            main.replaceChildren();
            doc.title = `${mine.title} | Vellum`;
        }
        const main = doc.querySelector('main');
        for (const [added, from] of Object.entries(addedTo(id))) {
            const section = sectionAdded(doc, id, added, from);
            if (section) main.append(section);
        }
        nameListsAndSections(doc, id);
        applyContent(doc, settings);
        applyStyles(doc, styles);

        return doc;
    };

    const pages = (editorBase) => [
        ...Object.entries(DESIGN).filter(([id]) => !removed().includes(id)).map(([id, page]) => ({ id, title: page.title, href: `${editorBase}${id}` })),
        ...made().map((entry) => ({ id: entry.id, title: entry.title, href: `${editorBase}${entry.id}`, made: true })),
    ];

    /** window.liveEditPages for a page (ThePagesTheOwnerArranged::forTheEditor). */
    const builderFor = (id, editorBase) => ({
        page: id,
        pagesKey: 'structure:pages',
        made: made(),
        structureKey: `structure:page:${id === '' ? 'home' : id}`,
        added: addedTo(id),
        editorBase,
        pages: pages(editorBase),
        taken: pages(editorBase).map((entry) => entry.id),
        library: library ? LIBRARY.map(({ file, ...section }) => ({ ...section, at: `${editorBase}${file}` })) : [],
        starts: [],
        ...(removable ? { removedKey: 'structure:removed', removed: removed() } : {}),
    });

    return {
        settings,
        styles,
        saves,
        draw,
        builderFor,
        made,
        removed,
        /** The editor's page, as markup, with what the editor is handed. */
        editorPage(id, { editorBase, api, runtime }) {
            const doc = draw(id);
            if (!doc) return null;
            doc.body.setAttribute('data-admin', '');
            const script = (text) => {
                const tag = doc.createElement('script');
                tag.textContent = text;
                doc.body.append(tag);
            };
            script(`window.liveEditApi=${JSON.stringify({ base: api, site: 'demo', token: 'kbs_demo' })};`
                + `window.liveEditContent=${JSON.stringify({ base: api, site: 'demo', key: 'kbs_demo' })};`
                + 'window.liveEditPublishing={pending:0};');
            if (!outside) script(`window.liveEditPages=${JSON.stringify(builderFor(id, editorBase))};`);
            if (runtime) {
                const tag = doc.createElement('script');
                tag.setAttribute('type', 'module');
                tag.setAttribute('src', runtime);
                doc.body.append(tag);
            }

            return serialise(doc);
        },
        save(key, value) {
            saves.push([key, value]);
            if (value === null || value === undefined) delete settings[key];
            else settings[key] = String(value);
        },
        saveStyle(key, props) {
            saves.push([`style:${key}`, props]);
            styles[key] = props;
        },
    };
}

/** The keys a drawn page carries for an element, by selector. */
export const keyOf = (doc, selector, attribute = 'data-edit') => (doc.querySelector(selector)?.getAttribute(attribute) ?? '').replace(/^setting:/, '');
