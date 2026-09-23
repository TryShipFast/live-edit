import { createChrome } from './chrome.js';

/**
 * Start only once the host page has finished loading.
 *
 * A bought theme runs its own setup: jQuery plugins, preload fades, scroll
 * reveals. Mounting the editor and toggling the `editing` class while that is
 * still in flight raced with it and left the page blank. The editor is a guest
 * here, so it waits for the host to finish before touching anything.
 */
const bootLiveEdit = () => {

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

        // The editor's UI is the package's own overlay in a shadow root, so the
        // host theme's CSS can neither style it nor be broken by it.
        const ui = createChrome();

        const toastMessage = sessionStorage.getItem('tb_toast');
        if (toastMessage) {
            sessionStorage.removeItem('tb_toast');
            ui.toast(toastMessage);
        }

        const reloadWithToast = (message) => {
            sessionStorage.setItem('tb_toast', message);
            reloadPreservingScroll();
        };
        const { drawer, drawerTitle, drawerTrail, drawerFields, drawerDelete, toggleButton, statusText, linkHandle, bgHandle } = ui;

        let current = null;

        const fieldInput = (name, label, value, rows, rich = false) => {
            const wrap = document.createElement('label');
            wrap.className = 'le-field';
            wrap.append(label);
            const options = name === 'icon' ? window.liveEditIcons : (window.liveEditSelects ?? {})[name];
            const iconTemplates = document.querySelector('[data-icon-templates]');
            if (name === 'icon' && Array.isArray(options) && iconTemplates) {
                const hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = name;
                hidden.value = value ?? '';
                const grid = document.createElement('div');
                grid.className = 'le-icons';
                options.forEach((icon) => {
                    const cell = document.createElement('button');
                    cell.type = 'button';
                    cell.title = icon;
                    cell.dataset.iconChoice = icon;
                    cell.className = 'le-icon' + (icon === hidden.value ? ' is-active' : '');
                    const template = iconTemplates.querySelector(`template[data-icon="${icon}"]`);
                    if (template) cell.append(template.content.cloneNode(true));
                    else cell.textContent = icon;
                    cell.addEventListener('click', () => {
                        hidden.value = icon;
                        grid.querySelectorAll('[data-icon-choice]').forEach((other) => {
                            const active = other.dataset.iconChoice === icon;
                            other.className = 'le-icon' + (active ? ' is-active' : '');
                        });
                        hidden.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                    grid.append(cell);
                });
                wrap.append(hidden, grid);
                return wrap;
            }
            if (Array.isArray(options) && options.length <= 6) {
                const hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = name;
                hidden.value = value ?? options[0];

                const choices = document.createElement('div');
                choices.className = 'le-choices';
                options.forEach((choice) => {
                    const pill = document.createElement('label');
                    pill.className = 'le-choice' + (choice === hidden.value ? ' is-selected' : '');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = 'le-choice-' + name;
                    radio.checked = choice === hidden.value;
                    radio.addEventListener('change', () => {
                        hidden.value = choice;
                        choices.querySelectorAll('.le-choice').forEach((other) => other.classList.remove('is-selected'));
                        pill.classList.add('is-selected');
                        hidden.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                    pill.append(radio, document.createTextNode(choice));
                    choices.append(pill);
                });

                wrap.append(hidden, choices);
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
            input.className = 'le-input';

            if (input.tagName === 'TEXTAREA') {
                // Words, not a form field: give them room and let the box grow
                // with what is being written, so nobody edits a paragraph
                // through a three-line slot.
                input.classList.add('le-prose');
                const grow = () => {
                    input.style.height = 'auto';
                    input.style.height = Math.min(input.scrollHeight + 2, 420) + 'px';
                };
                input.addEventListener('input', grow);
                requestAnimationFrame(grow);
            }

            if (rich && input.tagName === 'TEXTAREA') {
                const bar = document.createElement('div');
                bar.className = 'le-tools';
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
                    button.className = 'le-tool ' + cls;
                    button.addEventListener('click', action);
                    return button;
                };
                bar.append(
                    tool('B', 'Bold', () => wrapSelection('**', '**'), 'is-bold'),
                    tool('I', 'Italic', () => wrapSelection('*', '*'), 'is-italic'),
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
                hint.className = 'le-hint';
                hint.textContent = '**bold** \u00b7 *italic* \u00b7 [text](url)';
                bar.append(hint);
                wrap.append(bar);
            }

            wrap.append(input);
            return wrap;
        };

        /** What this element is, in words a non-technical editor recognises. */
        const describeElement = (element) => {
            const tag = element.tagName;
            if (tag === 'IMG') return 'Image';
            if (tag === 'BUTTON') return 'Button';
            if (tag === 'A') return /\b(btn|button)\b/i.test(String(element.className)) ? 'Button' : 'Link';
            if (/^H[1-6]$/.test(tag)) return 'Heading';
            if (tag === 'P') return 'Paragraph';
            if (tag === 'LI') return 'List item';
            if (tag === 'UL' || tag === 'OL') return 'List';
            if (tag === 'NAV') return 'Menu';
            if (tag === 'HEADER') return 'Header';
            if (tag === 'FOOTER') return 'Footer';
            if (tag === 'FORM') return 'Form';
            if (element.dataset.editRegion) return element.dataset.editRegion;
            if (element.hasAttribute('data-edit-item')) return 'Card';
            if (element.hasAttribute('data-edit-icon')) return 'Icon';
            if (element.hasAttribute('data-edit')) return 'Text';
            if (element.hasAttribute('data-has-bg') || element.hasAttribute('data-edit-bg')) return 'Background';
            if (tag === 'SECTION' || tag === 'MAIN' || tag === 'ARTICLE') return 'Section';
            const rect = element.getBoundingClientRect();
            return rect.width > window.innerWidth * 0.6 && rect.height > 180 ? 'Section' : 'Group';
        };

        /**
         * A heading does not need padding and corner radius; a section does not
         * need a font size. Show only what suits the thing that was clicked.
         */
        const stylePropsFor = (element, declared) => {
            const tag = element.tagName;
            let allowed;
            if (tag === 'IMG') {
                allowed = ['radius', 'hidden'];
            } else if (tag === 'A' || tag === 'BUTTON') {
                allowed = ['background', 'textColor', 'fontSize', 'radius', 'hidden'];
            } else if (/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(tag)) {
                allowed = ['textColor', 'fontSize', 'hidden'];
            } else {
                allowed = ['background', 'backgroundImage', 'paddingY', 'paddingX', 'radius', 'hidden'];
            }

            return declared.filter((name) => allowed.includes(name.trim()));
        };

        /** A styled file picker: click or drop, with the chosen name echoed back. */
        const uploadWidget = ({ hint = 'PNG, JPG or WEBP, or drag one here', onFile } = {}) => {
            const wrap = document.createElement('label');
            wrap.className = 'le-upload';

            const inner = document.createElement('div');
            inner.className = 'le-upload-inner';
            const icon = document.createElement('span');
            icon.className = 'le-upload-icon';
            icon.textContent = '\u2191';
            const text = document.createElement('span');
            text.className = 'le-upload-text';
            const title = document.createElement('span');
            title.className = 'le-upload-title';
            title.textContent = 'Upload from your computer';
            const hintEl = document.createElement('span');
            hintEl.className = 'le-upload-hint';
            hintEl.textContent = hint;
            text.append(title, hintEl);
            const button = document.createElement('span');
            button.className = 'le-upload-btn';
            button.textContent = 'Choose file';
            inner.append(icon, text, button);

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';

            const accept = (file) => {
                if (!file) return;
                hintEl.textContent = file.name;
                onFile?.(file);
            };
            input.addEventListener('change', () => accept(input.files[0]));

            ['dragenter', 'dragover'].forEach((type) =>
                wrap.addEventListener(type, (event) => {
                    event.preventDefault();
                    wrap.classList.add('is-dragover');
                })
            );
            ['dragleave', 'drop'].forEach((type) =>
                wrap.addEventListener(type, (event) => {
                    event.preventDefault();
                    wrap.classList.remove('is-dragover');
                })
            );
            wrap.addEventListener('drop', (event) => {
                const file = event.dataTransfer?.files?.[0];
                if (!file) return;
                const transfer = new DataTransfer();
                transfer.items.add(file);
                input.files = transfer.files; // keep save() reading one place
                accept(file);
            });

            wrap.append(inner, input);
            return wrap;
        };

        /** A computed colour as a hex the picker understands; '' when transparent. */
        const rgbToHex = (value) => {
            const parts = String(value).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
            if (!parts || (parts[4] !== undefined && Number(parts[4]) === 0)) return '';

            return '#' + [1, 2, 3].map((i) => Number(parts[i]).toString(16).padStart(2, '0')).join('');
        };

        /** The image an element is actually showing right now, theme or override. */
        const currentImageOf = (element) => {
            if (!element) return '';
            const attr = element.dataset.background || element.dataset.bg || element.dataset.backgroundImage;
            if (attr) return attr;
            const computed = getComputedStyle(element).backgroundImage || '';
            const match = computed.match(/url\((['"]?)(.*?)\1\)/);
            return match && !match[2].startsWith('data:') ? match[2] : '';
        };

        const STYLE_LABELS = {
            background: 'Background colour',
            backgroundImage: 'Background image',
            textColor: 'Text colour',
            fontSize: 'Text size',
            paddingY: 'Space above and below',
            paddingX: 'Space left and right',
            radius: 'Corner rounding',
        };

        const styleField = (name, type, value, element) => {
            const wrap = document.createElement('label');
            wrap.className = 'le-field';
            const fallback = name.replace(/([A-Z])/g, ' $1').toLowerCase();
            const label = STYLE_LABELS[name] ?? fallback.charAt(0).toUpperCase() + fallback.slice(1);
            wrap.append(label);

            if (type === 'toggle') {
                const row = document.createElement('div');
                row.className = 'le-row';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value === '1';
                input.dataset.styleProp = name;
                const hint = document.createElement('span');
                hint.className = 'le-hint';
                hint.textContent = 'Hidden from visitors. You still see it, dimmed, while editing.';
                row.append(input, hint);
                const thing = element ? describeElement(element).toLowerCase() : 'section';
                wrap.replaceChildren(`Hide this ${thing}`, row);
                wrap.className = 'le-field le-divided';
                return wrap;
            }
            if (type === 'color') {
                const row = document.createElement('div');
                row.className = 'le-row';
                const input = document.createElement('input');
                input.type = 'color';
                // With no override stored, show the colour the element is actually
                // painted, rather than a white swatch that tells the editor nothing.
                const painted = element ? rgbToHex(getComputedStyle(element)[name === 'textColor' ? 'color' : 'backgroundColor']) : '';
                input.value = value || painted || '#ffffff';
                input.dataset.styleProp = name;
                input.className = 'le-color';
                const defaultLabel = document.createElement('label');
                defaultLabel.className = 'le-default';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = !value;
                // Touching the picker opts out of the default automatically.
                input.addEventListener('input', () => (checkbox.checked = false));
                defaultLabel.append(checkbox, 'Use default');
                row.append(input, defaultLabel);
                wrap.append(row);
            } else if (type === 'url') {
                // Any URL-valued field (a background image, say — as opposed to a
                // link) accepts either an uploaded file or a pasted address.
                const input = document.createElement('input');
                input.type = 'text';
                input.value = value ?? '';
                input.placeholder = 'Paste an image URL, or upload below';
                input.dataset.styleProp = name;
                input.className = 'le-input';

                const thumb = document.createElement('img');
                thumb.className = 'le-thumb';
                thumb.alt = '';
                const showThumb = (src) => {
                    thumb.src = src || '';
                    thumb.style.display = src ? '' : 'none';
                };
                // With no override stored, show what the theme is displaying, so
                // the editor can see what they are about to replace.
                const inherited = value ? '' : currentImageOf(element);
                const caption = document.createElement('span');
                caption.className = 'le-hint';
                const describe = (src, fromTheme) => {
                    caption.textContent = src
                        ? (fromTheme ? 'Current image (from the theme) — upload or paste a link to replace it' : 'Replacing with this image')
                        : 'No image set';
                    caption.title = src || '';
                };
                showThumb(value || inherited);
                describe(value || inherited, !value && Boolean(inherited));
                input.addEventListener('input', () => {
                    const next = input.value.trim();
                    showThumb(next || inherited);
                    describe(next || inherited, !next && Boolean(inherited));
                });

                const upload = uploadWidget({
                    onFile: async (chosen) => {
                        showThumb(URL.createObjectURL(chosen)); // instant feedback
                        const body = new FormData();
                        body.append('file', chosen);
                        try {
                            const response = await request('/live-edit/upload', { method: 'POST', body });
                            const data = await response.json();
                            input.value = data.url;
                            showThumb(data.url);
                            describe(data.url, false);
                            // Repaint the live preview with the stored URL.
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        } catch (error) {
                            window.alert(error.message);
                        }
                    },
                });

                wrap.append(input, upload, thumb, caption);
            } else {
                const input = document.createElement('input');
                input.type = 'number';
                input.min = 0;
                input.max = 400;
                input.value = value ?? '';
                input.placeholder = 'default';
                input.dataset.styleProp = name;
                input.className = 'le-input';
                wrap.append(input);
            }
            return wrap;
        };

        const addStyleFields = (styleKey, propNames, element) => {
            current.styleKey = styleKey;
            const values = (window.liveEditStyles ?? {})[styleKey] ?? {};
            const heading = document.createElement('div');
            heading.className = 'le-section-heading';
            heading.textContent = 'Style';
            drawerFields.append(heading);
            (element ? stylePropsFor(element, propNames) : propNames).forEach((name) => {
                const type = (window.liveEditStyleProps ?? {})[name];
                if (type) drawerFields.append(styleField(name, type, values[name], element));
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
                        backgroundImage: `background-image:url('${value}') !important;background-size:cover !important;background-position:center !important;`,
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
            const reverts = { background: 'background', textColor: 'color', fontSize: 'font-size', radius: 'border-radius', backgroundImage: 'background-image' };
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
            // A band the model understood ("Hero", "FAQ") beats a generic role.
            if (node.dataset.editRegion) return node.dataset.editRegion;
            if (node.dataset.editLabel) return node.dataset.editLabel;
            const chip = node.querySelector(':scope > [data-style-edit]');

            return chip?.dataset.editLabel ?? describeElement(node);
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
            // "Section > Section > Section" is noise: keep only the nearest few
            // ancestors, and never repeat the same name twice in a row.
            const trail = [];
            items.forEach((node) => {
                const label = labelForNode(node);
                if (trail.length && trail[trail.length - 1].label === label) {
                    trail[trail.length - 1].node = node;

                    return;
                }
                trail.push({ node, label });
            });
            const shown = trail.slice(-3);

            drawerTrail.replaceChildren();
            drawerTrail.classList.toggle('is-visible', shown.length > 0);
            shown.forEach((entry, index) => {
                const ancestor = entry.node;
                if (index > 0) drawerTrail.append('\u203A');
                const crumb = document.createElement('button');
                crumb.type = 'button';
                crumb.textContent = entry.label;
                crumb.className = 'le-crumb';
                crumb.addEventListener('click', () => switchToNode(ancestor));
                drawerTrail.append(crumb);
            });
        };

        const openDrawer = () => {
            drawer.classList.add('is-open');
            drawerFields.querySelector('textarea, input:not([type=checkbox]), select')?.focus();
        };
        const closeDrawer = (force = false) => {
            if (!force && current?.dirty && !window.confirm('Discard unsaved changes?')) return;
            current?.restore?.();
            clearStylePreview();
            drawer.classList.remove('is-open');
            current = null;
        };

        const editables = () => document.querySelectorAll('[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon]');

        /**
         * Every icon name the theme's own stylesheets define.
         *
         * An icon font declares each glyph as a rule like `.fa-gem::before {
         * content: "\f3a5" }`, so the theme is its own catalogue: whatever icons
         * it shipped with are exactly the ones that will render. Nothing needs
         * configuring per theme, and a theme using a different icon font than the
         * last one just yields a different list.
         *
         * Returns the names plus the stylesheets they came from, because the
         * picker lives in a shadow root and has to adopt those sheets to draw the
         * glyphs.
         */
        const ICON_NAME = /\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi;

        /**
         * The icon names a stylesheet defines glyphs for.
         *
         * Only rules that actually set a `content` count: a name class with no
         * glyph behind it is a layout helper, and offering it would hand the
         * client an empty square.
         */
        const iconNamesIn = (css) => {
            const found = [];
            for (const block of css.split('}')) {
                const brace = block.indexOf('{');
                if (brace === -1) continue;
                const declared = block.slice(brace + 1).match(/content\s*:\s*(["'])(.*?)\1/);
                if (!declared || declared[2] === '') continue;
                // A codepoint may arrive escaped ("\\f3a5") or already decoded,
                // depending on whether it was parsed or fetched as text.
                const escaped = declared[2].match(/^\\([0-9a-f]{1,6})\s*$/i);
                const glyph = escaped ? String.fromCodePoint(parseInt(escaped[1], 16)) : declared[2];
                if ([...glyph].length !== 1) continue;
                for (const match of block.slice(0, brace).matchAll(ICON_NAME)) found.push({ name: match[1], glyph });
            }

            return found;
        };

        /**
         * A stylesheet's source text.
         *
         * A sheet served from another origin cannot be read through the CSSOM,
         * and that is the normal case for a bought template: its icon font comes
         * off a CDN. Such a sheet can almost always still be fetched, so falling
         * back to the network is what makes the picker work on real themes
         * rather than only on self-hosted ones.
         */
        const cssTextOf = async (sheet, depth = 0) => {
            try {
                if (sheet.cssRules) {
                    const parts = [];
                    for (const rule of sheet.cssRules) {
                        // An @import rule: its own rules are what matter, and a
                        // theme routinely keeps its icon font in one.
                        if (rule.styleSheet && depth < 4) parts.push(await cssTextOf(rule.styleSheet, depth + 1));
                        else parts.push(rule.cssText);
                    }

                    return parts.join('');
                }
            } catch {
                // Cross-origin; fall through to fetching it.
            }
            if (!sheet.href) return '';
            try {
                const response = await fetch(sheet.href);
                if (!response.ok) return '';
                const css = await response.text();
                if (depth >= 4) return css;
                // Fetched text is just text, so its imports have to be followed
                // by hand as well.
                const imports = [...css.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)]
                    .map((match) => match[2] || match[4])
                    .filter(Boolean);
                const nested = await Promise.all(imports.map((href) =>
                    cssTextOf({ href: new URL(href, sheet.href).href }, depth + 1)));

                return css + nested.join('');
            } catch {
                return '';
            }
        };

        let iconCataloguePromise = null;
        const buildIconCatalogue = async () => {
            const byName = new Map();
            const sheets = await Promise.all([...document.styleSheets].map((sheet) => cssTextOf(sheet)));
            sheets.forEach((css) => iconNamesIn(css).forEach((icon) => byName.set(icon.name, icon.glyph)));

            return [...byName].map(([name, glyph]) => ({ name, glyph })).sort((a, b) => a.name.localeCompare(b.name));
        };
        const iconCatalogue = () => (iconCataloguePromise ??= buildIconCatalogue());

        /**
         * Drop the icon affordance from elements that are not showing an icon.
         *
         * The scanner only sees markup, so a class that merely looks like an
         * icon name reads as one: Bootstrap's "icon-bar" navbar stripes are
         * classic false positives. The browser knows better, because an icon
         * font puts a glyph in ::before and a layout class does not.
         */
        const markRealIcons = () => {
            document.querySelectorAll('[data-edit-icon]').forEach((element) => {
                const drawn = getComputedStyle(element, '::before').content;
                if (drawn === 'none' || drawn === 'normal' || drawn === '""' || drawn === '') {
                    element.removeAttribute('data-edit-icon');
                }
            });
        };

        const setEditing = (on) => {
            // Before anything counts an element as editable, since this decides
            // which of them are icons at all.
            if (on) markRealIcons();
            document.body.classList.toggle('editing', on);
            editables().forEach((el) => {
                if (on) el.setAttribute('tabindex', '0');
                else el.removeAttribute('tabindex');
            });
            sessionStorage.setItem('tb_editing', on ? '1' : '0');
            statusText.textContent = on ? 'Editing mode: click any outlined text or image' : 'Viewing as visitor';
            if (!on && typeof hideHandle === 'function') hideHandle();
            ui.toolbar.classList.toggle('is-editing', on);
            toggleButton.textContent = on ? 'Done editing' : 'Edit site';
            if (on) {
                markLiveBackgrounds();
                // Read the theme's icons now, so the picker opens instantly later.
                if (document.querySelector('[data-edit-icon]')) void iconCatalogue();
            }
            else {
                hideBgHandle();
                hideHover();
            }
            if (!on) closeDrawer(true);
        };

        const request = async (url, options) => {
            const response = await fetch(url, {
                ...options,
                // After the spread, or the caller's own headers replace these
                // wholesale and the request goes out with no CSRF token and no
                // Accept, which Laravel answers with a redirect to a page.
                headers: { 'X-CSRF-TOKEN': csrf, Accept: 'application/json', ...(options.headers ?? {}) },
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
            // A redirect answered with a page still arrives as 200. Treating
            // that as success is worse than failing: the editor says "Saved"
            // and the client's words are gone.
            if (!(response.headers.get('content-type') ?? '').includes('json')) {
                throw new Error('That did not save. Reload the page and try again.');
            }

            return response;
        };

        const save = async () => {
            if (!current) return;
            const saveButton = ui.saveButton;
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
                } else if (current.kind === 'icon') {
                    await request('/live-edit/setting', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: current.key, value: current.value }),
                    });
                } else if (current.kind === 'image') {
                    const formData = new FormData();
                    formData.append('target', current.target);
                    const file = drawerFields.querySelector('input[type=file]').files[0];
                    const url = drawerFields.querySelector('input[type=url]').value.trim();
                    // The size the theme designed this image to occupy: the
                // replacement is fitted to it so the layout still holds.
                const box = current.element?.getBoundingClientRect?.();
                if (box && box.width >= 1 && box.height >= 1) {
                    formData.append('fitWidth', String(Math.round(box.width)));
                    formData.append('fitHeight', String(Math.round(box.height)));
                }
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
            group.className = 'le-field le-divided';
            group.append('Link');
            const hrefInput = document.createElement('input');
            hrefInput.type = 'text';
            hrefInput.dataset.linkField = 'href';
            const currentHref = element.getAttribute('href') ?? '';
            hrefInput.value = currentHref === '#' ? '' : currentHref;
            hrefInput.placeholder = '/contact or https://...';
            // These were utility classes from before the editor moved into a
            // shadow root, where the page's stylesheet cannot reach: the field
            // had been rendering unstyled next to a text box that was not.
            hrefInput.className = 'le-input le-link';
            const targetWrap = document.createElement('label');
            targetWrap.className = 'le-default';
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
            drawerDelete.classList.add('le-hidden');
            appendLinkFields(element);
            setTrail(element);
            openDrawer();
        };

        const editText = (element) => {
            const [kind, ...rest] = element.dataset.edit.split(':');
            drawerFields.replaceChildren();
            drawerDelete.classList.add('le-hidden');

            if (kind === 'setting') {
                // An auto key is "setting:auto:<hash>", so everything after the
                // kind is the key. Taking one segment threw the hash away and
                // saved every edit against a key called "auto".
                current = { kind, key: rest.join(':') };
                drawerTitle.textContent = element.dataset.editLabel ?? describeElement(element);
                const richSetting = (window.liveEditRich?.settings ?? []).includes(rest[0]);
                // Theme markup is full of tabs and newlines; collapse them so the
                // field shows the sentence the editor actually sees on the page.
                // Show only the element's own words when it wraps a child element,
            // so replacing them cannot swallow a nested link or button.
            const ownText = element.children.length
                ? [...element.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ')
                : element.textContent;
            const raw = element.dataset.editValue ?? ownText ?? '';
                const text = richSetting ? raw.trim() : raw.replace(/\s+/g, ' ').trim();
                drawerFields.append(fieldInput('value', 'Text', text, 6, richSetting));
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
                    drawerDelete.classList.remove('le-hidden');
                }

                const moveRow = document.createElement('div');
                moveRow.className = 'le-row';
                const moveLabel = document.createElement('span');
                moveLabel.className = 'le-label';
                moveLabel.textContent = 'Order';
                const moveButton = (direction, text) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.textContent = text;
                    button.className = 'le-chip-btn';
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
            appendVisitLink(element);
            if (element.dataset.style && element.dataset.styleProps) {
                addStyleFields(element.dataset.style, element.dataset.styleProps.split(','), element);
            }
            appendListControls(element);
            setTrail(element);
            openDrawer();
        };

        /**
         * Add / remove for a repeated block (FAQs, cards, list rows). The order of
         * item ids is the stored value; the server rebuilds the list from it.
         */
        const appendListControls = (element) => {
            const item = element.closest?.('[data-edit-item]');
            // Either an item was clicked, or the list itself was.
            const list = item?.parentElement?.dataset?.editList ? item.parentElement : element.closest?.('[data-edit-list]');
            if (!list?.dataset?.editList) return;

            const currentOrder = () =>
                [...list.children].filter((child) => child.dataset.editItem).map((child) => child.dataset.editItem);

            const saveOrder = async (ids, message) => {
                try {
                    await request('/live-edit/setting', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: list.dataset.editList, value: JSON.stringify(ids) }),
                    });
                    reloadWithToast(message);
                } catch (error) {
                    window.alert(error.message);
                }
            };

            const heading = document.createElement('div');
            heading.className = 'le-section-heading';
            heading.textContent = 'List';

            const row = document.createElement('div');
            row.className = 'le-row';

            const add = document.createElement('button');
            add.type = 'button';
            add.className = 'le-chip-btn';
            add.textContent = item ? '+ Add another' : '+ Add item';
            add.addEventListener('click', () => {
                const ids = currentOrder();
                const at = item ? ids.indexOf(item.dataset.editItem) : ids.length - 1;
                ids.splice(at + 1, 0, 'n' + Date.now().toString(36));
                saveOrder(ids, 'Added \u2713');
            });
            row.append(add);

            if (item) {
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'le-btn-danger';
                remove.textContent = 'Delete this item';
                remove.addEventListener('click', () => {
                    if (!window.confirm('Delete this item?')) return;
                    saveOrder(currentOrder().filter((id) => id !== item.dataset.editItem), 'Deleted \u2713');
                });
                row.append(remove);
            }
            drawerFields.append(heading, row);
        };

        /**
         * Run an element's own click with editing suspended for that moment.
         * A "Menu" toggle opens a panel; while every click edits, whatever it
         * reveals can never be reached. This lets the control do its job.
         */
        let passingThrough = false;
        const passThroughClick = (element) => {
            passingThrough = true;
            element.click();
            window.setTimeout(() => {
                passingThrough = false;
            }, 0);
        };

        /** Controls that reveal something rather than navigate somewhere. */
        const interactiveTarget = (element) =>
            element.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"]') ?? null;
        /** Editing swallows the click, so offer the trip explicitly. */
        const appendVisitLink = (element) => {
            // A control that reveals something gets a way to run itself, so the
            // editor can reach what it opens.
            const control = interactiveTarget(element);
            if (control) {
                const row = document.createElement('div');
                row.className = 'le-row';
                const open = document.createElement('button');
                open.type = 'button';
                open.className = 'le-chip-btn';
                open.textContent = 'Open this menu';
                open.title = 'Runs the control so you can edit what it reveals';
                open.addEventListener('click', () => {
                    closeDrawer(true);
                    passThroughClick(control);
                });
                row.append(open);
                drawerFields.append(row);
            }

            const anchor = element.closest?.('a[href]');
            const href = anchor?.getAttribute('href');
            if (!href || href === '#' || href.startsWith('javascript:')) return;

            const row = document.createElement('div');
            row.className = 'le-row';
            const visit = document.createElement('button');
            visit.type = 'button';
            visit.className = 'le-chip-btn';
            visit.textContent = 'Open this link \u2192';
            visit.addEventListener('click', () => {
                window.location.href = anchor.href;
            });
            row.append(visit);
            drawerFields.append(row);
        };

        const editStyle = (element) => {
            current = { kind: 'style' };
            // A chip carries data-style-edit; a styleable element carries data-style.
            const styleKey = element.dataset.styleEdit ?? element.dataset.style;
            drawerTitle.textContent = element.dataset.editLabel ?? describeElement(element);
            drawerFields.replaceChildren();
            drawerDelete.classList.add('le-hidden');
            addStyleFields(styleKey, (element.dataset.styleProps ?? '').split(','), element);
            appendListControls(element);
            setTrail(element.dataset.styleEdit ? (element.closest('[data-style]') ?? element.parentElement) : element);
            openDrawer();
        };

        /**
         * Pick a new icon by looking at icons, not by typing a class name.
         *
         * Each choice is drawn with the element's own classes and only the name
         * swapped, so what the grid shows is exactly what the page will show.
         */
        /**
         * Which of the theme's icons this element's font can actually draw.
         *
         * A theme usually pins one face of an icon font to a class ("Font
         * Awesome 5 Free" at weight 400, say), and that face holds only some of
         * the names the stylesheet defines. Offering the rest would fill the
         * picker with blank squares that stay blank once chosen, so each glyph
         * is measured first and only those that actually put ink down are
         * offered.
         */
        /** The face an element's ::before actually draws with. */
        const iconFontOf = (element) => {
            const before = getComputedStyle(element, '::before');

            return `${before.fontStyle} ${before.fontWeight} 20px ${before.fontFamily}`;
        };

        /**
         * Which of an element's classes decide the face it draws with.
         *
         * Found by experiment rather than by knowing the theme: each class is
         * taken off a hidden copy in turn, and the ones that change the face are
         * the ones that chose it. That is what lets an icon be moved between a
         * theme's own variants without naming any of them.
         */
        const faceClassesOf = (element, nameToken) => {
            const probe = element.cloneNode(false);
            probe.removeAttribute('data-edit-icon');
            Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', pointerEvents: 'none' });
            (element.parentNode ?? document.body).append(probe);

            const face = iconFontOf(probe);
            const responsible = [];
            [...probe.classList].forEach((name) => {
                if (name === nameToken) return;
                probe.classList.remove(name);
                if (iconFontOf(probe) !== face) responsible.push(name);
                probe.classList.add(name);
            });
            probe.remove();

            return responsible;
        };

        /**
         * The class list that puts `name` on this element using another
         * variant's face: the element's own face classes give way to theirs,
         * and everything the theme used for decoration stays.
         */
        const classListUsing = (element, variant, name, was) => {
            const mine = faceClassesOf(element, was);
            const theirs = faceClassesOf(variant, variant.dataset.editIconCurrent);
            const kept = [...element.classList].filter((cls) => cls !== was && !mine.includes(cls));
            theirs.forEach((cls) => kept.includes(cls) || kept.push(cls));
            kept.push(name);

            return kept.join(' ');
        };

        const drawableIn = (icons, font) => {
            const context = document.createElement('canvas').getContext('2d');
            context.font = font;

            return icons.filter(({ glyph }) => {
                const measured = context.measureText(glyph);
                // A name the face does not draw still has an advance width, so
                // only the ink the glyph actually puts down settles it.
                return (measured.actualBoundingBoxAscent || 0) + (measured.actualBoundingBoxDescent || 0) > 0;
            });
        };

        /**
         * Pick a new icon by looking at icons, not by typing a class name.
         *
         * The glyphs are drawn with the element's own icon font rather than by
         * borrowing the theme's stylesheet, which would drag the theme's
         * styling into this panel along with it.
         */
        const editIcon = async (element) => {
            const was = element.dataset.editIconCurrent;
            current = { kind: 'icon', key: element.dataset.editIcon.replace(/^setting:/, ''), value: was, element };
            drawerTitle.textContent = 'Icon';
            drawerFields.replaceChildren();
            drawerDelete.classList.add('le-hidden');

            const font = iconFontOf(element);
            const catalogue = await iconCatalogue();
            // The drawer may have moved on while the stylesheets were read.
            if (current?.element !== element) return;

            // A theme often pins one face of its icon font to each class it
            // uses, so the page itself shows what else is reachable: every
            // distinct face among its icons is offered, and choosing from one
            // brings that variant's classes along.
            const faces = new Map([[font, null]]);
            document.querySelectorAll('[data-edit-icon]').forEach((other) => {
                const face = iconFontOf(other);
                if (!faces.has(face)) faces.set(face, other);
            });

            const icons = [];
            const seen = new Set();
            faces.forEach((variant, face) => {
                drawableIn(catalogue, face).forEach((icon) => {
                    if (seen.has(icon.name)) return;
                    seen.add(icon.name);
                    icons.push({ ...icon, face, variant });
                });
            });

            if (icons.length === 0) {
                const hint = document.createElement('div');
                hint.className = 'le-hint';
                hint.textContent = 'This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.';
                const field = document.createElement('label');
                field.className = 'le-field';
                field.append('Icon name');
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'le-input';
                input.value = was ?? '';
                input.addEventListener('input', () => {
                    current.value = input.value.trim();
                    current.dirty = true;
                });
                field.append(input, hint);
                drawerFields.append(field);
                setTrail(element);
                openDrawer();

                return;
            }

            // What the theme had here, to rebuild from on every pick and to put
            // back if the panel is closed without saving.
            const untouched = element.className;
            current.restore = () => {
                element.className = untouched;
                element.dataset.editIconCurrent = was;
            };

            const search = document.createElement('input');
            search.type = 'search';
            search.className = 'le-input';
            search.placeholder = `Search ${icons.length} icons\u2026`;

            const grid = document.createElement('div');
            grid.className = 'le-icon-grid';

            const draw = (filter) => {
                const term = filter.trim().toLowerCase().replace(/\s+/g, '-');
                const shown = term ? icons.filter(({ name }) => name.includes(term)) : icons;
                grid.replaceChildren();
                shown.slice(0, 400).forEach(({ name, glyph, face, variant }) => {
                    const choice = document.createElement('button');
                    choice.type = 'button';
                    choice.className = 'le-icon-choice';
                    choice.title = name.replace(/^[a-z]+-/, '').replace(/-/g, ' ');
                    choice.classList.toggle('is-current', name === was);
                    choice.style.font = face;
                    choice.textContent = glyph;
                    choice.addEventListener('click', () => {
                        // Always build from the theme's own classes, so picking
                        // twice does not stack one variant on top of another.
                        element.className = untouched;
                        element.dataset.editIconCurrent = was;
                        // Show the change on the page straight away.
                        const value = variant ? classListUsing(element, variant, name, was) : name;
                        if (variant) element.className = value;
                        else element.classList.replace(was, name);
                        element.dataset.editIconCurrent = name;
                        current.value = value;
                        current.dirty = true;
                        grid.querySelectorAll('.le-icon-choice').forEach((other) => other.classList.remove('is-current'));
                        choice.classList.add('is-current');
                    });
                    grid.append(choice);
                });
                if (shown.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'le-hint';
                    empty.textContent = 'No icon matches that name.';
                    grid.append(empty);
                }
            };

            search.addEventListener('input', () => draw(search.value));
            draw('');
            drawerFields.append(search, grid);
            setTrail(element);
            openDrawer();
        };

        const editImage = (element) => {
            // A background reuses the image endpoint — it's a setting holding a URL,
            // rendered as a CSS background rather than an <img>. It skips the alt/
            // title fields (a background isn't a content image).
            const isBackground = element.dataset.editKind === 'background';
            current = { kind: 'image', target: element.dataset.editImg ?? element.dataset.editBg, element };
            drawerTitle.textContent = element.dataset.editLabel ?? (isBackground ? 'Background image' : 'Image');
            drawerFields.replaceChildren();
            drawerDelete.classList.add('le-hidden');

            const preview = document.createElement('div');
            preview.className = 'le-preview';
            const previewImg = document.createElement('img');
            previewImg.alt = '';
            previewImg.className = '';
            const currentSrc = element.dataset.editPreview;
            if (currentSrc) {
                previewImg.src = currentSrc;
                preview.append(previewImg);
            } else {
                preview.textContent = 'No image yet';
            
            }
            const showPreview = (src) => {
                preview.replaceChildren(previewImg);
                previewImg.src = src;
            };

            const fileWrap = uploadWidget({
                onFile: (file) => showPreview(URL.createObjectURL(file)),
            });

            const urlWrap = document.createElement('label');
            urlWrap.className = 'le-field';
            urlWrap.append('Or paste an image URL');
            const urlInput = document.createElement('input');
            urlInput.type = 'url';
            urlInput.placeholder = 'https://...';
            urlInput.className = 'le-input';
            urlInput.addEventListener('change', () => {
                const value = urlInput.value.trim();
                if (value) showPreview(value.startsWith('http') ? value : `https://${value}`);
            });
            urlWrap.append(urlInput);

            const note = document.createElement('div');
            note.className = 'le-hint';
            note.textContent = 'Uploads are stored on the server and replace the current image.';

            const textInput = (name, label, value, hint) => {
                const w = document.createElement('label');
                w.className = 'le-field le-divided';
                w.append(label);
                const input = document.createElement('input');
                input.type = 'text';
                input.dataset.imgAttr = name;
                input.value = value ?? '';
                input.className = 'le-input';
                w.append(input);
                if (hint) {
                    const h = document.createElement('span');
                    h.className = 'le-hint';
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
                removeButton.className = 'le-btn-danger';
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
            linkHandle.classList.add('is-visible');
        };
        const hideHandle = () => {
            linkHandle.classList.remove('is-visible');
            handleTarget = null;
        };

        /**
         * What a click here will actually edit. The hover preview calls the same
         * function, so the box it draws is exactly what you get when you click.
         */
        const resolveTarget = (node) => {
            if (!node?.closest) return null;
            const chip = node.closest('[data-style-edit]');
            if (chip) return { element: chip, kind: 'style' };
            const image = node.closest('[data-edit-img], [data-edit-bg]');
            if (image) return { element: image, kind: 'image' };
            const icon = node.closest('[data-edit-icon]');
            if (icon) return { element: icon, kind: 'icon' };
            const text = node.closest('[data-edit]');
            if (text) return { element: text, kind: 'text' };
            const link = node.closest('[data-edit-href]:not([data-edit])');
            if (link) return { element: link, kind: 'link' };
            // Any styleable box, checked last so content wins over its container.
            const box = node.closest('[data-style]:not([data-style-edit])');
            if (box) return { element: box, kind: 'style' };

            return null;
        };

        const openTarget = ({ element, kind }) => {
            if (kind === 'image') editImage(element);
            else if (kind === 'icon') void editIcon(element);
            else if (kind === 'text') editText(element);
            else if (kind === 'link') editLink(element);
            else editStyle(element);
        };

        // Outline what is under the pointer and name it, so choosing the right
        // element is not guesswork.
        let hoverFrame = null;
        const hideHover = () => ui.hoverBox.classList.remove('is-visible');
        const showHover = (element) => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 4 || rect.height < 4) {
                hideHover();

                return;
            }
            Object.assign(ui.hoverBox.style, {
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
            });
            ui.hoverBox.classList.toggle('is-flipped', rect.top < 26);
            ui.hoverLabel.textContent = element.dataset.editLabel ?? describeElement(element);
            ui.hoverBox.classList.add('is-visible');
        };

        document.addEventListener('pointermove', (event) => {
            if (!document.body.classList.contains('editing')) {
                hideHover();

                return;
            }
            if (event.target === ui.root || ui.root.contains(event.target)) {
                hideHover();

                return;
            }
            if (hoverFrame) return;
            hoverFrame = requestAnimationFrame(() => {
                hoverFrame = null;
                const target = resolveTarget(event.target);
                if (target) showHover(target.element);
                else hideHover();
            });
        });
        document.addEventListener('scroll', hideHover, true);
        document.addEventListener('pointerleave', hideHover);

        let bgTarget = null;
        const hideBgHandle = () => {
            bgHandle.classList.remove('is-visible');
            bgTarget = null;
        };
        const showBgHandle = (element) => {
            bgTarget = element;
            const rect = element.getBoundingClientRect();
            bgHandle.style.top = `${Math.max(rect.top, 8) + 8}px`;
            bgHandle.style.left = `${rect.left + 8}px`;
            bgHandle.classList.add('is-visible');
        };
        bgHandle.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (bgTarget) editStyle(bgTarget);
            hideBgHandle();
        });

        document.addEventListener('pointerover', (event) => {
            if (!document.body.classList.contains('editing')) return;
            const withBackground = event.target.closest?.('[data-has-bg]');
            if (withBackground) showBgHandle(withBackground);
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
                // A control was asked to run itself; leave this click alone.
                if (passingThrough) return;
                // Clicks inside the overlay retarget to its shadow host.
                if (event.target === ui.root || ui.root.contains(event.target)) return;
                if (event.target.closest('[data-live-create]')) return;

                const target = resolveTarget(event.target);
                if (!target) return;
                event.preventDefault();
                event.stopPropagation();
                openTarget(target);
            },
            true
        );

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
            if (!document.body.classList.contains('editing')) return;
            if (event.key !== 'Enter' && event.key !== ' ') return;
            if (ui.shadow.activeElement) return;
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

        ui.undoButton.addEventListener('click', async () => {
            const res = await request('/live-edit/undo', { method: 'POST' });
            const data = await res.json();
            if (data.undone) reloadWithToast('Undone \u21a9');
            else window.alert('Nothing to undo.');
        });
        ui.closeButton.addEventListener('click', () => closeDrawer());
        ui.cancelButton.addEventListener('click', () => closeDrawer());
        ui.saveButton.addEventListener('click', save);

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

};

/**
 * Give the host theme a moment to run its own setup before the editor touches
 * anything, but never wait on it indefinitely. Themes fade content in on load,
 * and a single hanging request (an analytics beacon, a slow font) can stop that
 * event firing at all. Waiting for it outright left the editor absent on a page
 * that was otherwise usable, so this yields, then starts regardless.
 */
const startLiveEdit = (() => {
    let started = false;

    return () => {
        if (started) return;
        started = true;
        bootLiveEdit();
    };
})();

if (document.readyState === 'complete') {
    startLiveEdit();
} else {
    window.addEventListener('load', startLiveEdit, { once: true });
    // Fallback: the host had its chance, carry on without it.
    window.setTimeout(startLiveEdit, 2000);
}
