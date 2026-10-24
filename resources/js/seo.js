/**
 * Page title, search description and share image for hosted sites. `pickImage`
 * opens the editor's own picture chooser (upload, free photos, or generate with
 * credits) and resolves to the chosen picture's address, or null.
 */
export const renderSeoPanel = ({ container, config, save, done, notify, pickImage = null, doc = document }) => {
    const titleConfig = config?.title ?? {};
    const initial = {
        title: titleConfig.title ?? doc.title,
        description: config?.description ?? doc.querySelector('meta[name="description"]')?.content ?? '',
        image: config?.image ?? doc.querySelector('meta[property="og:image"]')?.content ?? '',
    };
    const pending = { ...initial };
    const originals = {
        title: doc.title,
        metas: ['meta[property="og:title"]', 'meta[name="twitter:title"]', 'meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]', 'meta[property="og:image"]', 'meta[name="twitter:image"]']
            .map((selector) => [selector, doc.querySelector(selector)?.getAttribute('content') ?? null]),
    };
    const el = (tag, className, text) => {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const setMeta = (selector, attr, key, content) => {
        let node = doc.querySelector(selector);
        if (!node) {
            node = doc.createElement('meta');
            node.setAttribute(attr, key);
            doc.head.append(node);
        }
        node.setAttribute('content', content);
    };
    const preview = el('div', 'le-seo-preview');
    const previewTitle = el('strong', 'le-seo-preview-title');
    const previewAddress = el('span', 'le-seo-preview-address', doc.defaultView?.location?.host ?? 'Your website');
    const previewDescription = el('span', 'le-seo-preview-description');
    preview.append(previewTitle, previewAddress, previewDescription);
    const titleInput = el('input', 'le-input');
    titleInput.maxLength = 120;
    titleInput.value = initial.title;
    titleInput.setAttribute('aria-label', 'Page title');
    const descriptionInput = el('textarea', 'le-input');
    descriptionInput.rows = 4;
    descriptionInput.maxLength = 320;
    descriptionInput.value = initial.description;
    descriptionInput.setAttribute('aria-label', 'Search description');
    const titleField = el('label', 'le-field', 'Page title');
    titleField.append(titleInput, el('span', 'le-hint', 'Browser tabs, search results and link previews. Up to 120 characters.'));
    const descriptionField = el('label', 'le-field', 'Search description');
    descriptionField.append(descriptionInput, el('span', 'le-hint', 'A short summary shown in search results and link previews. Up to 320 characters.'));
    // The picture a shared link shows, previewed the way a chat or a feed shows it.
    const share = el('div', 'le-seo-share');
    const shareShot = el('div', 'le-seo-share-shot');
    const shareImg = el('img');
    shareImg.alt = '';
    shareShot.append(shareImg);
    const shareWords = el('div', 'le-seo-share-words');
    const shareHost = el('span', 'le-seo-share-host', doc.defaultView?.location?.host ?? 'Your website');
    const shareTitle = el('strong', 'le-seo-share-title');
    const shareDescription = el('span', 'le-seo-share-description');
    shareWords.append(shareHost, shareTitle, shareDescription);
    share.append(shareShot, shareWords);
    const imageRow = el('div', 'le-row');
    const chooseImage = el('button', 'le-chip-btn', 'Choose a share image');
    chooseImage.type = 'button';
    const ownImage = el('button', 'le-link-btn', "Use the design's own");
    ownImage.type = 'button';
    imageRow.append(chooseImage, ownImage);
    chooseImage.hidden = !pickImage || !config?.imageKey;
    chooseImage.addEventListener('click', async () => {
        try {
            const url = await pickImage();
            if (url) { pending.image = url; update(); }
        } catch (error) {
            notify(error?.message || 'That picture could not be used.');
        }
    });
    ownImage.addEventListener('click', () => { pending.image = ''; update(); });
    const actions = el('div', 'le-row le-seo-actions');
    const cancel = el('button', 'le-btn-outline', 'Cancel');
    cancel.type = 'button';
    const saveButton = el('button', 'le-btn', 'Save SEO');
    saveButton.type = 'button';
    saveButton.disabled = true;
    actions.append(cancel, saveButton);
    container.replaceChildren(
        el('p', 'le-hint', 'Set how this page appears in browser tabs, search results and social shares. Changes stay in drafts until you publish.'),
        titleField, descriptionField, el('div', 'le-section-heading', 'Search preview'), preview,
        el('div', 'le-section-heading', 'When it is shared'), share,
        el('p', 'le-hint', 'The picture shown when someone shares this page in a chat or a post. Upload one, pick a free photo, or make one with credits. Wide pictures (1200 by 630) fill the card best.'),
        imageRow, actions,
    );
    const update = () => {
        const title = pending.title.trim() || titleConfig.defaultTitle || originals.title;
        const description = pending.description.trim() || config?.defaultDescription || '';
        doc.title = title;
        setMeta('meta[property="og:title"]', 'property', 'og:title', title);
        setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
        setMeta('meta[name="description"]', 'name', 'description', description);
        setMeta('meta[property="og:description"]', 'property', 'og:description', description);
        setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
        previewTitle.textContent = title || 'Your page title';
        previewDescription.textContent = description || 'Add a short description of this page.';
        const image = pending.image || config?.defaultImage || '';
        if (pending.image) {
            setMeta('meta[property="og:image"]', 'property', 'og:image', pending.image);
            setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', pending.image);
        }
        shareShot.classList.toggle('is-empty', !image);
        if (image) shareImg.src = image; else shareImg.removeAttribute('src');
        shareTitle.textContent = previewTitle.textContent;
        shareDescription.textContent = previewDescription.textContent;
        ownImage.hidden = !config?.imageKey || pending.image === '' || pending.image === (config?.defaultImage ?? '');
        saveButton.disabled = pending.title === initial.title && pending.description === initial.description && pending.image === initial.image;
    };
    const restore = () => {
        doc.title = originals.title;
        for (const [selector, value] of originals.metas) {
            const node = doc.querySelector(selector);
            if (value === null) node?.remove();
            else if (node) node.setAttribute('content', value);
        }
    };
    titleInput.addEventListener('input', () => { pending.title = titleInput.value; update(); });
    descriptionInput.addEventListener('input', () => { pending.description = descriptionInput.value; update(); });
    cancel.addEventListener('click', () => { restore(); done(''); });
    saveButton.addEventListener('click', async () => {
        const fields = [];
        if (titleConfig.key && pending.title !== initial.title) fields.push([titleConfig.key, pending.title]);
        if (config?.descriptionKey && pending.description !== initial.description) fields.push([config.descriptionKey, pending.description]);
        if (config?.imageKey && pending.image !== initial.image) fields.push([config.imageKey, pending.image === (config?.defaultImage ?? '') ? '' : pending.image]);
        if (!fields.length) return;
        saveButton.disabled = true;
        saveButton.textContent = 'Saving…';
        try {
            for (const [key, value] of fields) await save(key, value);
            done('SEO saved ✓. Publish to put it on your website.');
        } catch (error) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save SEO';
            notify(error?.message || 'Your SEO details could not be saved.');
        }
    });
    update();
    return { unpreview: restore };
};
