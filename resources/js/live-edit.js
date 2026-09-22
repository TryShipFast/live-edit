/* ------------------------------- login modal ------------------------------- */

const loginModal = document.querySelector('[data-login-modal]');

if (loginModal) {
    const openModal = () => {
        loginModal.classList.remove('hidden');
        loginModal.classList.add('flex');
        loginModal.querySelector('input[type=email]')?.focus();
    };
    const closeModal = () => {
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
    };

    document.querySelectorAll('[data-login-open]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            openModal();
        });
    });
    loginModal.querySelector('[data-login-close]')?.addEventListener('click', closeModal);
    loginModal.addEventListener('click', (event) => {
        if (event.target === loginModal) closeModal();
    });

    if (loginModal.dataset.error === '1') openModal();
}

/* --------------------------------- live edit -------------------------------- */

if (document.body.hasAttribute('data-admin')) {
    const csrf = document.body.dataset.csrf;

    // Saves reload the page; keep the editor where they were working.
    const reloadPreservingScroll = () => {
        sessionStorage.setItem('tb_scroll', String(window.scrollY));
        window.location.reload();
    };
    const savedScroll = sessionStorage.getItem('tb_scroll');
    if (savedScroll !== null) {
        sessionStorage.removeItem('tb_scroll');
        window.scrollTo(0, Number(savedScroll));
    }

    const toastMessage = sessionStorage.getItem('tb_toast');
    if (toastMessage) {
        sessionStorage.removeItem('tb_toast');
        const toast = document.createElement('div');
        toast.textContent = toastMessage;
        toast.className =
            'fixed bottom-20 left-1/2 z-[99] -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg transition-opacity duration-500';
        document.body.append(toast);
        setTimeout(() => (toast.style.opacity = '0'), 1800);
        setTimeout(() => toast.remove(), 2400);
    }

    const reloadWithToast = (message) => {
        sessionStorage.setItem('tb_toast', message);
        reloadPreservingScroll();
    };
    const drawer = document.querySelector('[data-drawer]');
    const drawerTitle = document.querySelector('[data-drawer-title]');
    const drawerTrail = document.querySelector('[data-drawer-trail]');
    const drawerFields = document.querySelector('[data-drawer-fields]');
    const drawerDelete = document.querySelector('[data-drawer-delete]');
    const toggleButton = document.querySelector('[data-edit-toggle]');
    const statusText = document.querySelector('[data-edit-status]');
    const statusDot = document.querySelector('[data-edit-dot]');

    let current = null;

    const fieldInput = (name, label, value, rows, rich = false) => {
        const wrap = document.createElement('label');
        wrap.className = 'flex flex-col gap-1.5 text-[13px] font-semibold text-navy';
        wrap.append(label);
        const options = name === 'icon' ? window.liveEditIcons : (window.liveEditSelects ?? {})[name];
        const iconTemplates = document.querySelector('[data-icon-templates]');
        if (name === 'icon' && Array.isArray(options) && iconTemplates) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = name;
            hidden.value = value ?? '';
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-6 gap-1.5';
            options.forEach((icon) => {
                const cell = document.createElement('button');
                cell.type = 'button';
                cell.title = icon;
                cell.dataset.iconChoice = icon;
                cell.className =
                    'flex h-10 cursor-pointer items-center justify-center rounded-[10px] border text-navy transition-colors ' +
                    (icon === hidden.value ? 'border-brand bg-brand text-white' : 'border-field bg-white hover:bg-soft');
                const template = iconTemplates.querySelector(`template[data-icon="${icon}"]`);
                if (template) cell.append(template.content.cloneNode(true));
                else cell.textContent = icon;
                cell.addEventListener('click', () => {
                    hidden.value = icon;
                    grid.querySelectorAll('[data-icon-choice]').forEach((other) => {
                        const active = other.dataset.iconChoice === icon;
                        other.className =
                            'flex h-10 cursor-pointer items-center justify-center rounded-[10px] border text-navy transition-colors ' +
                            (active ? 'border-brand bg-brand text-white' : 'border-field bg-white hover:bg-soft');
                    });
                    hidden.dispatchEvent(new Event('input', { bubbles: true }));
                });
                grid.append(cell);
            });
            wrap.append(hidden, grid);
            return wrap;
        }
        let input;
        if (Array.isArray(options)) {
            input = document.createElement('select');
            options.forEach((choice) => {
                const option = document.createElement('option');
                option.value = choice;
                option.textContent = choice;
                option.selected = choice === value;
                input.append(option);
            });
        } else {
            input = document.createElement('textarea');
            input.rows = rows;
            input.value = value ?? '';
        }
        input.name = name;
        input.className =
            'w-full resize-y rounded-[10px] border border-field bg-white px-3.5 py-3 text-sm font-normal leading-normal text-navy outline-none focus:border-brand';

        if (rich && input.tagName === 'TEXTAREA') {
            const bar = document.createElement('div');
            bar.className = 'flex items-center gap-1';
            const wrapSelection = (before, after) => {
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const selected = input.value.slice(start, end) || 'text';
                input.setRangeText(before + selected + after, start, end, 'select');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
            };
            const tool = (text, title, action, cls = '') => {
                const button = document.createElement('button');
                button.type = 'button';
                button.title = title;
                button.textContent = text;
                button.className = 'h-7 min-w-7 cursor-pointer rounded-md border border-field bg-white px-1.5 text-xs text-navy hover:bg-soft ' + cls;
                button.addEventListener('click', action);
                return button;
            };
            bar.append(
                tool('B', 'Bold', () => wrapSelection('**', '**'), 'font-bold'),
                tool('I', 'Italic', () => wrapSelection('*', '*'), 'italic'),
                tool('Link', 'Insert link', () => {
                    const url = window.prompt('Link URL (https://\u2026 or /page):');
                    if (!url) return;
                    const start = input.selectionStart;
                    const end = input.selectionEnd;
                    const selected = input.value.slice(start, end) || 'link text';
                    input.setRangeText('[' + selected + '](' + url + ')', start, end, 'select');
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.focus();
                })
            );
            const hint = document.createElement('span');
            hint.className = 'ml-1 text-[11px] font-normal text-ink-500';
            hint.textContent = '**bold** \u00b7 *italic* \u00b7 [text](url)';
            bar.append(hint);
            wrap.append(bar);
        }

        wrap.append(input);
        return wrap;
    };

    const styleField = (name, type, value) => {
        const wrap = document.createElement('label');
        wrap.className = 'flex flex-col gap-1.5 text-[13px] font-semibold text-navy';
        const title = name.replace(/([A-Z])/g, ' $1').toLowerCase();
        const label = title.charAt(0).toUpperCase() + title.slice(1);
        wrap.append(type === 'px' ? `${label} (px)` : label);

        if (type === 'toggle') {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-2';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value === '1';
            input.dataset.styleProp = name;
            const hint = document.createElement('span');
            hint.className = 'text-xs font-normal text-ink-500';
            hint.textContent = 'Hidden from visitors; shown dimmed while editing.';
            row.append(input, hint);
            wrap.replaceChildren('Hide this section', row);
            wrap.className = 'flex flex-col gap-1.5 border-t border-line pt-4 text-[13px] font-semibold text-danger';
            return wrap;
        }
        if (type === 'color') {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-3';
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value || '#ffffff';
            input.dataset.styleProp = name;
            input.className = 'h-10 w-16 cursor-pointer rounded-lg border border-field bg-white';
            const defaultLabel = document.createElement('label');
            defaultLabel.className = 'flex cursor-pointer items-center gap-1.5 text-xs font-normal text-ink-500';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = !value;
            // Touching the picker opts out of the default automatically.
            input.addEventListener('input', () => (checkbox.checked = false));
            defaultLabel.append(checkbox, 'Use default');
            row.append(input, defaultLabel);
            wrap.append(row);
        } else {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = 0;
            input.max = 400;
            input.value = value ?? '';
            input.placeholder = 'default';
            input.dataset.styleProp = name;
            input.className =
                'w-full rounded-[10px] border border-field bg-white px-3.5 py-3 text-sm font-normal text-navy outline-none focus:border-brand';
            wrap.append(input);
        }
        return wrap;
    };

    const addStyleFields = (styleKey, propNames) => {
        current.styleKey = styleKey;
        const values = (window.liveEditStyles ?? {})[styleKey] ?? {};
        const heading = document.createElement('div');
        heading.className = 'mt-2 border-t border-line pt-4 text-[11px] font-semibold uppercase tracking-[.14em] text-ink-500';
        heading.textContent = 'Style';
        drawerFields.append(heading);
        propNames.forEach((name) => {
            const type = (window.liveEditStyleProps ?? {})[name];
            if (type) drawerFields.append(styleField(name, type, values[name]));
        });
    };

    // Live preview: mirror the server's CSS emission for the key being edited.
    const previewStyleTag = document.createElement('style');
    document.head.append(previewStyleTag);

    const styleCssFor = (key, props) => {
        const selector = `[data-style="${key}"]`;
        let rules = '';
        let css = '';
        for (const [prop, value] of Object.entries(props)) {
            if (!value) continue;
            rules +=
                {
                    hidden: 'opacity:.45 !important;',
                    background: `background:${value} !important;`,
                    textColor: `color:${value} !important;`,
                    fontSize: `font-size:${value}px !important;`,
                    radius: `border-radius:${value}px !important;`,
                    paddingX: `padding-left:${value}px !important;padding-right:${value}px !important;`,
                    paddingY: `padding-top:${value}px !important;padding-bottom:${value}px !important;`,
                }[prop] ?? '';
            if (prop === 'paddingY') css += `section${selector}>div{padding-top:0 !important;padding-bottom:0 !important}`;
        }
        return rules ? css + `${selector}{${rules}}` : css;
    };

    const applyStylePreview = () => {
        if (!current?.styleKey) return;
        // A cleared prop must override the persisted stylesheet back to the
        // design default, so emit explicit reverts for empty values too.
        const props = collectStyleProps();
        const key = current.styleKey;
        let css = styleCssFor(key, props);
        const reverts = { background: 'background', textColor: 'color', fontSize: 'font-size', radius: 'border-radius' };
        for (const [prop, value] of Object.entries(props)) {
            if (value) continue;
            if (prop === 'hidden') css += `body.editing [data-style="${key}"]{opacity:1 !important}`;
            if (reverts[prop]) css += `[data-style="${key}"]{${reverts[prop]}:revert-layer !important}`;
            if (prop === 'paddingY') css += `[data-style="${key}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${key}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`;
            if (prop === 'paddingX') css += `[data-style="${key}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`;
        }
        previewStyleTag.textContent = css;
    };

    const clearStylePreview = () => {
        previewStyleTag.textContent = '';
    };

    drawerFields.addEventListener('input', () => {
        if (current) current.dirty = true;
        applyStylePreview();
    });
    drawerFields.addEventListener('change', () => {
        if (current) current.dirty = true;
        applyStylePreview();
    });

    const collectStyleProps = () => {
        const props = {};
        drawerFields.querySelectorAll('[data-style-prop]').forEach((input) => {
            if (input.type === 'checkbox') {
                props[input.dataset.styleProp] = input.checked ? '1' : '';
            } else if (input.type === 'color') {
                const useDefault = input.closest('div').querySelector('input[type=checkbox]').checked;
                props[input.dataset.styleProp] = useDefault ? '' : input.value;
            } else {
                props[input.dataset.styleProp] = input.value;
            }
        });
        return props;
    };

    // Ancestor trail: jump from an element's editor to any tagged container
    // it sits in (card, section) without hunting for its chip.
    const labelForNode = (node) => {
        if (node.dataset.editLabel) return node.dataset.editLabel;
        const chip = node.querySelector(':scope > [data-style-edit]');
        return chip?.dataset.editLabel ?? 'Section';
    };

    const openNode = (node) => {
        if (node.dataset.editImg !== undefined) editImage(node);
        else if (node.dataset.edit !== undefined) editText(node);
        else if (node.dataset.style !== undefined) {
            const chip = node.querySelector(':scope > [data-style-edit]');
            if (chip) editStyle(chip);
        }
    };

    const switchToNode = (node) => {
        if (current?.dirty && !window.confirm('Discard unsaved changes?')) return;
        clearStylePreview();
        openNode(node);
    };

    const setTrail = (selfNode) => {
        const items = [];
        let node = selfNode?.parentElement;
        while (node && node !== document.body) {
            if (node.dataset && (node.dataset.edit !== undefined || node.dataset.style !== undefined)) {
                items.unshift(node);
            }
            node = node.parentElement;
        }
        drawerTrail.replaceChildren();
        drawerTrail.classList.toggle('hidden', items.length === 0);
        drawerTrail.classList.toggle('flex', items.length > 0);
        items.forEach((ancestor, index) => {
            if (index > 0) drawerTrail.append('\u203A');
            const crumb = document.createElement('button');
            crumb.type = 'button';
            crumb.textContent = labelForNode(ancestor);
            crumb.className = 'cursor-pointer rounded-full bg-soft px-2 py-0.5 font-semibold text-brand hover:bg-brand hover:text-white';
            crumb.addEventListener('click', () => switchToNode(ancestor));
            drawerTrail.append(crumb);
        });
    };

    const openDrawer = () => {
        drawer.classList.remove('hidden');
        drawer.classList.add('flex');
        drawerFields.querySelector('textarea, input:not([type=checkbox]), select')?.focus();
    };
    const closeDrawer = (force = false) => {
        if (!force && current?.dirty && !window.confirm('Discard unsaved changes?')) return;
        clearStylePreview();
        drawer.classList.add('hidden');
        drawer.classList.remove('flex');
        current = null;
    };

    const editables = () => document.querySelectorAll('[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href]');

    const setEditing = (on) => {
        document.body.classList.toggle('editing', on);
        editables().forEach((el) => {
            if (on) el.setAttribute('tabindex', '0');
            else el.removeAttribute('tabindex');
        });
        sessionStorage.setItem('tb_editing', on ? '1' : '0');
        statusText.textContent = on ? 'Editing mode: click any outlined text or image' : 'Viewing as visitor';
        if (!on && typeof hideHandle === 'function') hideHandle();
        statusDot.classList.toggle('bg-live', on);
        statusDot.classList.toggle('bg-sky', !on);
        toggleButton.textContent = on ? 'Done editing' : 'Edit site';
        toggleButton.classList.toggle('bg-white', on);
        toggleButton.classList.toggle('text-brand', on);
        toggleButton.classList.toggle('bg-brand', !on);
        toggleButton.classList.toggle('text-white', !on);
        if (!on) closeDrawer(true);
    };

    const request = async (url, options) => {
        const response = await fetch(url, {
            headers: { 'X-CSRF-TOKEN': csrf, Accept: 'application/json', ...(options.headers ?? {}) },
            ...options,
        });
        if (response.status === 419 || response.status === 401) {
            window.alert('Your session expired. The page will reload — sign in and try again.');
            window.location.reload();
            throw new Error('Session expired.');
        }
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message ?? 'Could not save. Try again.');
        }
        return response;
    };

    const save = async () => {
        if (!current) return;
        const saveButton = drawer.querySelector('[data-drawer-save]');
        saveButton.disabled = true;
        saveButton.textContent = 'Saving\u2026';
        const restoreButton = () => {
            saveButton.disabled = false;
            saveButton.textContent = 'Save changes';
        };
        try {
            if (current.kind === 'setting') {
                await request('/live-edit/setting', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: current.key, value: drawerFields.querySelector('textarea').value, locale: window.liveEditLocale }),
                });
            } else if (current.kind === 'record') {
                const fields = {};
                drawerFields.querySelectorAll('textarea, select, input[type=hidden][name]').forEach((input) => (fields[input.name] = input.value));
                await request('/live-edit/record', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: current.type, id: current.id, fields }),
                });
            } else if (current.kind === 'image') {
                const formData = new FormData();
                formData.append('target', current.target);
                const file = drawerFields.querySelector('input[type=file]').files[0];
                const url = drawerFields.querySelector('input[type=url]').value.trim();
                const attrInputs = [...drawerFields.querySelectorAll('[data-img-attr]')];
                if (file) formData.append('file', file);
                else if (url) formData.append('url', url.startsWith('http') ? url : `https://${url}`);
                attrInputs.forEach((input) => formData.append(input.dataset.imgAttr, input.value));
                if (!file && !url && attrInputs.length === 0) {
                    restoreButton();
                    window.alert('Choose a file from your computer or paste an image URL first.');
                    return;
                }
                await request('/live-edit/image', { method: 'POST', body: formData });
            }
            if (current.hrefKey) {
                const hrefValue = drawerFields.querySelector('[data-link-field=href]').value.trim();
                const newTab = drawerFields.querySelector('[data-link-field=target]').checked;
                await request('/live-edit/setting', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: current.hrefKey, value: hrefValue }),
                });
                if (current.targetKey) {
                    await request('/live-edit/setting', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: current.targetKey, value: newTab ? '_blank' : '' }),
                    });
                }
            }
            if (current.styleKey) {
                await request('/live-edit/style', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: current.styleKey, props: collectStyleProps() }),
                });
            }
            reloadWithToast('Saved \u2713');
        } catch (error) {
            restoreButton();
            window.alert(error.message);
        }
    };

    const appendLinkFields = (element) => {
        current.hrefKey = element.dataset.editHref;
        current.targetKey = element.dataset.editTarget;
        const group = document.createElement('div');
        group.className = 'flex flex-col gap-1.5 border-t border-line pt-4 text-[13px] font-semibold text-navy';
        group.append('Link');
        const hrefInput = document.createElement('input');
        hrefInput.type = 'text';
        hrefInput.dataset.linkField = 'href';
        const currentHref = element.getAttribute('href') ?? '';
        hrefInput.value = currentHref === '#' ? '' : currentHref;
        hrefInput.placeholder = '/contact or https://...';
        hrefInput.className =
            'w-full rounded-[10px] border border-field bg-white px-3.5 py-3 text-sm font-normal text-navy outline-none focus:border-brand';
        const targetWrap = document.createElement('label');
        targetWrap.className = 'flex cursor-pointer items-center gap-2 text-xs font-normal text-ink-500';
        const targetInput = document.createElement('input');
        targetInput.type = 'checkbox';
        targetInput.dataset.linkField = 'target';
        targetInput.checked = element.getAttribute('target') === '_blank';
        targetWrap.append(targetInput, 'Open in a new tab');
        group.append(hrefInput, targetWrap);
        drawerFields.append(group);
    };

    const editLink = (element) => {
        current = { kind: 'link' };
        drawerTitle.textContent = element.dataset.editLabel ?? 'Link';
        drawerFields.replaceChildren();
        drawerDelete.classList.add('hidden');
        appendLinkFields(element);
        setTrail(element);
        openDrawer();
    };

    const editText = (element) => {
        const [kind, ...rest] = element.dataset.edit.split(':');
        drawerFields.replaceChildren();
        drawerDelete.classList.add('hidden');

        if (kind === 'setting') {
            current = { kind, key: rest[0] };
            drawerTitle.textContent = element.dataset.editLabel ?? 'Text';
            const richSetting = (window.liveEditRich?.settings ?? []).includes(rest[0]);
            drawerFields.append(fieldInput('value', 'Text', element.dataset.editValue ?? element.textContent.trim(), 6, richSetting));
        } else {
            const [type, id] = rest;
            current = { kind: 'record', type, id: Number(id) };
            const label = element.dataset.editLabel ?? 'Item';
            const values = JSON.parse(element.dataset.editValues ?? '{}');
            const identifier = values.title ?? values.question ?? values.label ?? values.number;
            drawerTitle.textContent = identifier ? `${label}: ${identifier.slice(0, 40)}` : label;
            Object.entries(values).forEach(([name, value]) => {
                const words = name.replace(/_/g, ' ');
                const fieldLabel = words.charAt(0).toUpperCase() + words.slice(1);
                const richField = (window.liveEditRich?.fields ?? []).includes(`${type}.${name}`);
                drawerFields.append(fieldInput(name, fieldLabel, value, name === 'detail' || name === 'answer' ? 6 : 3, richField));
            });
            if (element.hasAttribute('data-edit-deletable')) {
                drawerDelete.textContent = `Delete this ${label.toLowerCase()}`;
                drawerDelete.classList.remove('hidden');
            }

            const moveRow = document.createElement('div');
            moveRow.className = 'flex items-center gap-2';
            const moveLabel = document.createElement('span');
            moveLabel.className = 'text-[13px] font-semibold text-navy';
            moveLabel.textContent = 'Order';
            const moveButton = (direction, text) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = text;
                button.className =
                    'cursor-pointer rounded-full border border-field bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-soft';
                button.addEventListener('click', async () => {
                    const res = await request('/live-edit/record/move', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: current.type, id: current.id, direction }),
                    });
                    const data = await res.json();
                    if (data.moved) reloadWithToast('Reordered \u2713');
                    else window.alert(direction === 'up' ? 'Already first.' : 'Already last.');
                });
                return button;
            };
            moveRow.append(moveLabel, moveButton('up', '\u2191 Move up'), moveButton('down', '\u2193 Move down'));
            drawerFields.prepend(moveRow);
        }
        if (element.dataset.editHref) {
            appendLinkFields(element);
        }
        if (element.dataset.style && element.dataset.styleProps) {
            addStyleFields(element.dataset.style, element.dataset.styleProps.split(','));
        }
        setTrail(element);
        openDrawer();
    };

    const editStyle = (element) => {
        current = { kind: 'style' };
        drawerTitle.textContent = element.dataset.editLabel ?? 'Section';
        drawerFields.replaceChildren();
        drawerDelete.classList.add('hidden');
        addStyleFields(element.dataset.styleEdit, (element.dataset.styleProps ?? '').split(','));
        setTrail(element.closest('[data-style]') ?? element.parentElement);
        openDrawer();
    };

    const editImage = (element) => {
        // A background reuses the image endpoint — it's a setting holding a URL,
        // rendered as a CSS background rather than an <img>. It skips the alt/
        // title fields (a background isn't a content image).
        const isBackground = element.dataset.editKind === 'background';
        current = { kind: 'image', target: element.dataset.editImg ?? element.dataset.editBg };
        drawerTitle.textContent = element.dataset.editLabel ?? (isBackground ? 'Background image' : 'Image');
        drawerFields.replaceChildren();
        drawerDelete.classList.add('hidden');

        const preview = document.createElement('div');
        preview.className = 'flex h-[200px] items-center justify-center overflow-hidden rounded-xl bg-soft';
        const previewImg = document.createElement('img');
        previewImg.alt = '';
        previewImg.className = 'size-full object-cover';
        const currentSrc = element.dataset.editPreview;
        if (currentSrc) {
            previewImg.src = currentSrc;
            preview.append(previewImg);
        } else {
            preview.textContent = 'No image yet';
            preview.classList.add('text-[13px]', 'text-ink-500');
        }
        const showPreview = (src) => {
            preview.replaceChildren(previewImg);
            previewImg.src = src;
        };

        const fileWrap = document.createElement('label');
        fileWrap.className =
            'flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed border-field bg-soft px-4 py-4 text-[13px] font-semibold text-navy transition-colors hover:border-brand hover:bg-brand/5';
        const fileWrapTitle = document.createElement('span');
        fileWrapTitle.textContent = 'Upload from your computer';
        fileWrap.append(fileWrapTitle);
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.className =
            'cursor-pointer text-[13px] font-normal text-ink-500 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-white hover:file:bg-navy';
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) showPreview(URL.createObjectURL(file));
        });
        fileWrap.append(fileInput);

        const urlWrap = document.createElement('label');
        urlWrap.className = 'flex flex-col gap-1.5 text-[13px] font-semibold text-navy';
        urlWrap.append('Or paste an image URL');
        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.placeholder = 'https://...';
        urlInput.className =
            'w-full rounded-[10px] border border-field bg-white px-3.5 py-3 text-sm font-normal text-navy outline-none focus:border-brand';
        urlInput.addEventListener('change', () => {
            const value = urlInput.value.trim();
            if (value) showPreview(value.startsWith('http') ? value : `https://${value}`);
        });
        urlWrap.append(urlInput);

        const note = document.createElement('div');
        note.className = 'text-xs leading-normal text-ink-500';
        note.textContent = 'Uploads are stored on the server and replace the current image.';

        const textInput = (name, label, value, hint) => {
            const w = document.createElement('label');
            w.className = 'flex flex-col gap-1.5 border-t border-line pt-4 text-[13px] font-semibold text-navy';
            w.append(label);
            const input = document.createElement('input');
            input.type = 'text';
            input.dataset.imgAttr = name;
            input.value = value ?? '';
            input.className =
                'w-full rounded-[10px] border border-field bg-white px-3.5 py-3 text-sm font-normal text-navy outline-none focus:border-brand';
            w.append(input);
            if (hint) {
                const h = document.createElement('span');
                h.className = 'text-xs font-normal text-ink-500';
                h.textContent = hint;
                w.append(h);
            }
            return w;
        };

        drawerFields.append(preview, fileWrap, urlWrap, note);

        if (current.target.startsWith('setting:') && !isBackground) {
            drawerFields.append(
                textInput('alt', 'Alt text', element.dataset.editAlt, 'Describes the image for search engines and screen readers.'),
                textInput('imgTitle', 'Title attribute', element.dataset.editTitle, 'Optional tooltip shown on hover.')
            );
        }

        if (current.target.startsWith('setting:')) {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.textContent = isBackground ? 'Remove background' : 'Remove image';
            removeButton.className =
                'mt-2 cursor-pointer self-start rounded-full border-[1.5px] border-[#F0C4C0] bg-transparent px-4 py-[9px] text-[13px] font-semibold text-danger';
            removeButton.addEventListener('click', async () => {
                const prompt = isBackground
                    ? 'Remove this background image? The section keeps its layout and colour.'
                    : 'Remove this image? The section keeps its layout; you can add a new image any time.';
                if (!window.confirm(prompt)) return;
                const f = new FormData();
                f.append('target', current.target);
                f.append('remove', '1');
                await request('/live-edit/image', { method: 'POST', body: f });
                reloadWithToast('Removed \u2713');
            });
            drawerFields.append(removeButton);
        }
        setTrail(element);
        openDrawer();
    };

    // A floating pencil handle edits links without hijacking their click:
    // in edit mode a link still navigates (so you browse the whole site while
    // editing — edit mode persists across the page load), and this handle,
    // shown on hover, opens the link's editor instead.
    const editableAnchor = (target) => target?.closest?.('a[data-edit], a[data-edit-href]') ?? null;
    const navigable = (anchor) => {
        const href = anchor?.getAttribute('href') ?? '';
        return href !== '' && href !== '#' && !href.startsWith('javascript:');
    };

    const linkHandle = document.createElement('button');
    linkHandle.type = 'button';
    linkHandle.setAttribute('aria-label', 'Edit this link');
    linkHandle.innerHTML = '&#9998;';
    linkHandle.className =
        'fixed z-[96] hidden size-6 items-center justify-center rounded-full border border-brand bg-white text-xs leading-none text-brand shadow-md';
    document.body.append(linkHandle);
    let handleTarget = null;
    let overHandle = false;
    let hideTimer = null;

    const cancelHide = () => {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    };
    const scheduleHide = () => {
        cancelHide();
        hideTimer = setTimeout(() => {
            if (!overHandle) hideHandle();
        }, 140);
    };

    const positionHandle = (anchor) => {
        // Already parked on this link and visible — don't re-show, or the
        // handle flickers as the pointer crosses the link's own children.
        if (anchor === handleTarget && !linkHandle.classList.contains('hidden')) return;
        handleTarget = anchor;
        const rect = anchor.getBoundingClientRect();
        linkHandle.style.top = `${rect.top + window.scrollY - 10}px`;
        linkHandle.style.left = `${rect.right + window.scrollX - 10}px`;
        linkHandle.classList.remove('hidden');
        linkHandle.classList.add('flex');
    };
    const hideHandle = () => {
        linkHandle.classList.add('hidden');
        linkHandle.classList.remove('flex');
        handleTarget = null;
    };

    document.addEventListener('pointerover', (event) => {
        if (!document.body.classList.contains('editing')) return;
        const anchor = editableAnchor(event.target);
        if (anchor && navigable(anchor)) {
            cancelHide();
            positionHandle(anchor);
        }
    });
    document.addEventListener('pointerout', (event) => {
        if (!document.body.classList.contains('editing')) return;
        // Staying on the same link (crossing its children) or moving onto the
        // handle itself is not a leave — keep it up.
        if (event.relatedTarget === linkHandle) return;
        if (editableAnchor(event.relatedTarget) === handleTarget && handleTarget) return;
        scheduleHide();
    });
    // Track the handle's own hover explicitly instead of racing :hover.
    linkHandle.addEventListener('pointerenter', () => {
        overHandle = true;
        cancelHide();
    });
    linkHandle.addEventListener('pointerleave', () => {
        overHandle = false;
        scheduleHide();
    });
    linkHandle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!handleTarget) return;
        const target = handleTarget;
        if (target.dataset.edit !== undefined) editText(target);
        else editLink(target);
        hideHandle();
    });

    document.addEventListener(
        'click',
        (event) => {
            if (!document.body.classList.contains('editing')) return;
            if (event.target === linkHandle || linkHandle.contains(event.target)) return;
            if (drawer.contains(event.target) || event.target.closest('[data-edit-toggle],[data-live-create]')) return;

            // Editable links keep navigating; edit them via the hover handle.
            const anchor = editableAnchor(event.target);
            if (anchor && navigable(anchor)) return;

            const styleChip = event.target.closest('[data-style-edit]');
            const image = event.target.closest('[data-edit-img], [data-edit-bg]');
            const text = event.target.closest('[data-edit]');
            const linkOnly = event.target.closest('[data-edit-href]:not([data-edit])');
            if (!styleChip && !image && !text && !linkOnly) return;
            event.preventDefault();
            event.stopPropagation();
            if (styleChip) editStyle(styleChip);
            else if (image) editImage(image);
            else if (text) editText(text);
            else editLink(linkOnly);
        },
        true
    );

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !drawer.classList.contains('hidden')) closeDrawer();
        if (!document.body.classList.contains('editing')) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (drawer.contains(document.activeElement)) return;
        const focused = document.activeElement;
        if (focused?.matches('[data-edit-img], [data-edit-bg]')) {
            event.preventDefault();
            editImage(focused);
        } else if (focused?.matches('[data-edit]') && !focused.matches('button, a')) {
            event.preventDefault();
            editText(focused);
        }
    });

    toggleButton?.addEventListener('click', () => setEditing(!document.body.classList.contains('editing')));

    document.querySelector('[data-undo]')?.addEventListener('click', async () => {
        const res = await request('/live-edit/undo', { method: 'POST' });
        const data = await res.json();
        if (data.undone) reloadWithToast('Undone \u21a9');
        else window.alert('Nothing to undo.');
    });
    drawer?.querySelector('[data-drawer-close]')?.addEventListener('click', () => closeDrawer());
    drawer?.querySelector('[data-drawer-cancel]')?.addEventListener('click', () => closeDrawer());
    drawer?.querySelector('[data-drawer-save]')?.addEventListener('click', save);

    drawerDelete?.addEventListener('click', async () => {
        if (!current || current.kind !== 'record') return;
        if (!window.confirm('Delete this item?')) return;
        await request(`/live-edit/record/${current.type}/${current.id}`, { method: 'DELETE' });
        reloadWithToast('Deleted \u2713');
    });

    document.querySelectorAll('[data-live-create]').forEach((button) => {
        button.addEventListener('click', async () => {
            await request('/live-edit/record/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: button.dataset.liveCreate }),
            });
            reloadWithToast('Added \u2713 \u2014 click it to edit');
        });
    });

    const params = new URLSearchParams(window.location.search);
    if (params.has('edit')) {
        params.delete('edit');
        const query = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
        setEditing(true);
    } else {
        setEditing(sessionStorage.getItem('tb_editing') === '1');
    }
}
