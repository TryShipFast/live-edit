import { createChrome } from './chrome.js';
import { confirm as confirmChange, expectChange, takeExpected } from './verify.js';
import { apiRequestFor, attributeOf, classListWith, declaredStyleProps, displayedValue, iconNamesIn, isJsonResponse, orderedIcons, ownTextOf, parseEditKey, requestInit } from './support.js';

/**
 * Start only once the host page has finished loading.
 *
 * A bought theme runs its own setup: jQuery plugins, preload fades, scroll
 * reveals. Mounting the editor and toggling the `editing` class while that is
 * still in flight raced with it and left the page blank. The editor is a guest
 * here, so it waits for the host to finish before touching anything.
 */
const bootLiveEdit = () => {

    /* --------------------- the pictures a stylesheet holds --------------------- */

    /*
     * Asked for here as well as in boot.js, because there are two ways in and
     * only one of them went through boot.
     *
     * WordPress loads this file directly: its plugin has already done the
     * tagging on the server and hands us a token, which boot.js would
     * overwrite with a null. So the background pass — written because a page
     * builder keeps its hero in a stylesheet, which is exactly what a bought
     * WordPress template does — ran everywhere except there.
     *
     * The call is idempotent, so a page that did come through boot.js does not
     * pay for it twice, and a failure costs the backgrounds rather than the
     * editor.
     */
    const api = window.liveEditApi;

    if (api?.base && api?.site) {
        import('./autotag.js')
            .then((m) => m.ensureBackgroundsAreFound({ base: api.base, site: api.site, key: api.token }))
            .catch((error) => console.warn('[live-edit] could not look for backgrounds:', error.message));
    }

    /*
     * And keep the words the page arrived with.
     *
     * A page that fetches its content sets this up itself once it has applied
     * it. A page baked by a server never runs that file at all — WordPress
     * loads this one directly — so without asking here, the adapter serving
     * the most theme-heavy sites in the product would be the only one with no
     * defence against a theme rewriting them.
     *
     * Only for somebody editing, which is who this file loads for: a visitor
     * seeing a theme's own words for a moment is a smaller thing than every
     * visitor paying to watch for it.
     */
    if (!window.liveEditContent) {
        import('./content.js')
            .then((m) => m.defendContent(document))
            .catch((error) => console.warn('[live-edit] could not guard this page\'s content:', error.message));
    }

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

        /**
         * Did the last change actually arrive?
         *
         * "Saved" has meant "the request returned 200", and every serious
         * fault this editor has had lived in the gap between the two: the data
         * really was stored, the page really did show the old version, and
         * nothing anywhere said so. This is the editor looking.
         *
         * A page that fetches its words is not itself until that has finished,
         * so this waits for the content applier to say it is done — and gives
         * up waiting rather than holding the editor hostage to it.
         */
        const pageSettled = () => new Promise((resolve) => {
            if (!window.liveEditContent || window.liveEditContentDone) {
                // Server-rendered, or already finished before this attached.
                resolve(window.liveEditContentDone ?? null);

                return;
            }

            const done = (event) => resolve(event?.detail ?? null);
            document.addEventListener('live-edit:content', done, { once: true });
            setTimeout(() => resolve(null), 5000);
        });

        pageSettled().then((content) => {
            const expected = takeExpected();

            // The words on the page are whatever was already in the file: the
            // change may be perfectly saved and simply not fetched. Saying so
            // is the point — this is the case that used to pass in silence.
            if (content?.failed) {
                // Two different things, and saying the wrong one is its own
                // fault. After a save, the save is the thing they are anxious
                // about. On an ordinary load nobody saved anything, and
                // opening with "Saved, but..." describes an action they did
                // not take \u2014 which reads as the editor having done something
                // behind their back.
                ui.toast(expected
                    ? 'Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.'
                    : 'This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.', 9000);

                return;
            }

            const result = expected ? confirmChange(document, expected) : null;

            if (result && !result.ok) {
                console.warn('[live-edit] the change was saved but the page still shows:', result.saw, '\n  expected:', result.wanted);
                ui.toast('Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.', 9000);
            }
        });

        const reloadWithToast = (message) => {
            sessionStorage.setItem('tb_toast', message);
            reloadPreservingScroll();
        };

        /**
         * What to do once a change is stored.
         *
         * A server-rendered page has to be asked again to show new words, so
         * it reloads. A React page must not: the words are state, and handing
         * them to the provider re-renders just that element while the rest of
         * the page — scroll, open menus, whatever the visitor was doing —
         * stays where it was.
         *
         * An element that React does not drive, such as one inside a server
         * component, is not bound to any hook. The provider says so, and then
         * the page is refreshed after all rather than silently keeping the old
         * text on screen.
         */
        const settle = (message, key = null, value = null) => {
            const bridge = window.__liveEditReact;

            if (!bridge) {
                reloadWithToast(message);

                return;
            }

            // apply(), not set(): the change is already stored, and set()
            // would send it a second time.
            const bound = key !== null && (bridge.apply ?? bridge.set)(key, value);

            ui.toast(message);

            if (!bound) {
                bridge.refresh();
            }
        };
        const { drawer, drawerTabs, drawerSubject, drawerTitle, drawerTrail, drawerFields, drawerDelete, toggleButton, statusText, linkHandle, bgHandle } = ui;

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
            if (element.hasAttribute('data-edit-svg')) return 'Drawing';
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
                            window.alert(plainly(error, 'save that'));
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
            let offered = 0;
            (element ? stylePropsFor(element, propNames) : propNames).forEach((name) => {
                const type = (window.liveEditStyleProps ?? {})[name];
                if (!type) return;
                drawerFields.append(styleField(name, type, values[name], element));
                offered++;
            });
            if (offered === 0) {
                // Say so. A panel with nothing in it reads as a fault.
                const none = document.createElement('div');
                none.className = 'le-hint';
                none.textContent = 'Nothing on this element can be restyled.';
                drawerFields.append(none);
            }
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
            else if (node.dataset.svgEdit !== undefined || node.dataset.editSvg !== undefined) editDrawing(node);
            // A link with no words of its own — a social icon is the usual one
            // — has data-edit-href and nothing else this list matched, so it
            // fell through to the style branch. The crumb called it "Link",
            // opened a panel with no address field in it, and the client had
            // no way at all to put their Facebook page in. Naming a thing and
            // then not offering it is worse than never offering it.
            else if (node.dataset.editHref !== undefined) editLink(node);
            else if (node.dataset.style !== undefined) {
                // A chip is how a section offers its styling, but plenty of
                // styleable elements have none. Requiring one made them
                // unreachable from the trail: clicking the crumb did nothing
                // and the panel sat there showing the child it came from.
                const chip = node.querySelector(':scope > [data-style-edit]');
                editStyle(chip ?? node);
            }
        };

        const switchToNode = (node) => {
            if (current?.dirty && !window.confirm('Discard unsaved changes?')) return;
            clearStylePreview();
            openNode(node);
        };

        /**
         * Where the drawer was before this, so "back" means something.
         *
         * The trail is built from the CURRENT element's ancestors, which is
         * not the path anybody walked. Opening a section, jumping to a social
         * link inside it and pressing the first crumb landed on the link's own
         * card — the section was several steps further up and had been trimmed
         * off the end of the trail. There was no way back to where you came
         * from, and the panel you arrived at looked like the one you left with
         * things missing from it.
         */
        let cameFrom = null;

        const setTrail = (selfNode) => {
            const from = cameFrom;
            cameFrom = selfNode ?? null;

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

            // The place you came from, kept at the front when the ancestry
            // does not already lead back to it. Descending into a container's
            // contents and climbing back out is the normal way around this
            // drawer, and it has to be the same two steps in both directions.
            if (from && from !== selfNode && document.contains(from)
                && !shown.some((entry) => entry.node === from)) {
                shown.unshift({ node: from, label: `← ${labelForNode(from)}` });
            }

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

        /*
         * Which tab the panel is showing.
         *
         * Edit is the element in front of somebody. Changes and History are
         * where they go when they are unsure — "did that save", "what have I
         * changed", "what went out last week" — and the whole reason they are
         * tabs rather than another screen is that those questions arrive
         * mid-edit, about the thing being edited.
         */
        let drawerTab = 'Edit';

        const showTab = (name) => {
            drawerTab = name;

            Object.entries(drawerTabs).forEach(([label, tab]) => {
                tab.classList.toggle('is-on', label === name);
                tab.setAttribute('aria-selected', label === name ? 'true' : 'false');
            });

            // The subject line names what is selected, which only the Edit tab
            // is about. Left showing, it labels a list of every change on the
            // site with the name of one element.
            drawerSubject.classList.toggle('le-hidden', name !== 'Edit');

            // And so does the footer. "Save changes" under a list of changes
            // offers to save a list, which is not a thing; each row there has
            // already been saved, which is why it is in the list.
            ui.drawerFoot.classList.toggle('le-hidden', name !== 'Edit');

            if (name === 'Changes') void renderChanges();
            if (name === 'History') void renderHistory();
        };

        Object.entries(drawerTabs).forEach(([name, tab]) => {
            tab.addEventListener('click', () => {
                // Moving away from a half-typed edit would lose it silently.
                if (name !== 'Edit' && current?.dirty && !window.confirm('Discard unsaved changes?')) return;

                showTab(name);

                if (!drawer.classList.contains('is-open')) openDrawer();
            });
        });

        /*
         * What to say when something goes wrong.
         *
         * The person using this bought a website; they did not buy an
         * understanding of what an API is, and "Editing that is not available
         * over the content API yet (/live-edit/versions)" is a sentence
         * written for whoever wrote the code. Shown to a client it reads as
         * the product being broken in a way they have no move against.
         *
         * So: one plain sentence about what did not happen and what is still
         * true, with the technical one kept in the console for whoever is
         * actually debugging.
         */
        const plainly = (error, what) => {
            console.warn(`[live-edit] ${what}:`, error);

            const message = String(error?.message ?? '');

            // Only the ones somebody can act on are told apart. Everything
            // else gets the same honest sentence rather than a guess.
            if (/failed to fetch|networkerror|load failed/i.test(message)) {
                return 'No connection just now. Nothing has been lost; try again in a moment.';
            }

            if (/\b401\b|\b403\b|unauthor|forbidden/i.test(message)) {
                return 'Your editing session has expired. Reload the page to carry on.';
            }

            if (/\b429\b|too many/i.test(message)) {
                return 'That was a lot at once. Give it a few seconds and try again.';
            }

            return `Could not ${what}. Nothing has been lost; try again in a moment.`;
        };

        /* ── Rewriting a sentence ──────────────────────────────────────
         *
         * Deliberately not "write my website for me". The product's argument
         * is that a human designed the page and the client owns the words;
         * this helps with one of them, on request, and hands back something
         * they can then edit like anything else.
         *
         * The balance is read once when the editor starts and kept up to date
         * by the answers themselves, so the panel never shows a number that is
         * one action out of date and never costs a second request to draw.
         */
        let credits = null;

        const loadCredits = async () => {
            try {
                const response = await request('/live-edit/credits', { method: 'GET' });
                credits = await response.json();
            } catch (error) {
                // Not knowing the balance is a reason to leave the buttons
                // out, not a reason to interrupt somebody.
                console.warn('[live-edit] could not read the credit balance:', error);
                credits = null;
            }
        };

        /*
         * What this site will actually accept as styling.
         *
         * Every style control is drawn only for a property the site declares,
         * because the server drops one it does not recognise: a control for an
         * unsupported property saves, reports success and changes nothing,
         * with no way for the client to tell why.
         *
         * The vocabulary reaches a page that FETCHES its content as part of
         * the payload. A page baked by a server never fetches anything, so it
         * had no vocabulary at all — and with none, every property was skipped
         * and every panel said "nothing on this element can be restyled". The
         * whole style panel was dead on WordPress, which is where the bought
         * themes are.
         *
         * So it is asked for, with the editor's own key, which is the only
         * key that is told.
         */
        const loadStyleVocabulary = async () => {
            if (window.liveEditStyleProps && window.liveEditStyles) return;

            try {
                const response = await request('/live-edit/content', { method: 'GET' });
                const payload = await response.json();

                if (payload?.styleProps) window.liveEditStyleProps = payload.styleProps;

                /*
                 * And what is already set, which is a different question the
                 * panel also could not answer. It reads its current values
                 * from here, so with nothing here every control opened reading
                 * "use default" even on an element the client had coloured
                 * themselves — and saving the panel then wrote that back and
                 * took the colour off.
                 */
                if (payload?.styles) window.liveEditStyles = payload.styles;
            } catch (error) {
                console.warn('[live-edit] could not read what this site allows to be styled:', error);
            }
        };

        const appendAssist = (element, box) => {
            // Only where a model is configured and only for words. A row of
            // buttons that answer "not available" is worse than no row.
            if (!credits?.available || !box) return;

            const heading = document.createElement('div');
            heading.className = 'le-assist-head';
            heading.append(sectionHeading('AI assist'), balanceLabel());
            drawerFields.append(heading);

            [['rewrite', 'Rewrite'], ['shorten', 'Shorten']].forEach(([action, label]) => {
                const cost = credits.costs?.[action] ?? 1;
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'le-assist';

                const name = document.createElement('span');
                name.textContent = label;

                const price = document.createElement('span');
                price.className = 'le-assist-cost';
                price.textContent = `${cost} credit${cost === 1 ? '' : 's'}`;

                button.append(name, price);

                if ((credits.balance ?? 0) < cost) {
                    button.disabled = true;
                    price.classList.add('is-short');
                    button.title = 'Not enough credits';
                }

                button.addEventListener('click', () => void runAssist(action, label, element, box, button, name));
                drawerFields.append(button);
            });
        };

        const balanceLabel = () => {
            const span = document.createElement('span');
            span.className = 'le-assist-balance';
            span.textContent = `${credits?.balance ?? 0} credits left`;

            return span;
        };

        const sectionHeading = (text) => {
            const div = document.createElement('div');
            div.className = 'le-section-heading';
            div.textContent = text;

            return div;
        };

        const runAssist = async (action, label, element, box, button, name) => {
            button.disabled = true;
            name.textContent = 'Thinking…';

            let result;

            try {
                const response = await request('/live-edit/assist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action,
                        text: box.value,
                        // Context is what makes the answer fit. "Rewrite this"
                        // on the words "Book now" produces marketing sludge;
                        // told it is a button under a heading about same-day
                        // appointments, it produces something that belongs.
                        heading: nearestHeading(element),
                        role: describeElement(element),
                        page: window.location.pathname,
                    }),
                });
                result = await response.json();
            } catch (error) {
                button.disabled = false;
                name.textContent = label;
                ui.toast(plainly(error, 'rewrite that'));

                return;
            }

            if (typeof result?.balance === 'number' && credits) credits.balance = result.balance;

            if (!result?.text) {
                button.disabled = false;
                name.textContent = label;
                ui.toast(assistExcuse(result?.reason));

                return;
            }

            // Into the box rather than onto the page: it is a suggestion until
            // somebody presses Save, and they can edit it first like any other
            // words they typed themselves.
            box.value = result.text;
            box.dispatchEvent(new Event('input', { bubbles: true }));
            box.focus();

            button.disabled = false;
            name.textContent = label;
            ui.toast(`Rewritten. ${result.balance} credits left.`);
        };

        /* The nearest heading above this element, which is most of what tells
           a model what the page is about. */
        const nearestHeading = (element) => {
            const section = element.closest('section, article, header, div[data-style]') ?? document.body;
            const heading = section.querySelector('h1, h2, h3') ?? document.querySelector('h1');

            return (heading?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
        };

        const assistExcuse = (reason) => ({
            not_enough_credits: 'Not enough credits for that. You can buy more from your account.',
            no_suggestion: 'No suggestion for this one. Your words are unchanged.',
            not_configured: 'Rewriting is not switched on for this site yet.',
            nothing_to_work_with: 'There are no words here to rewrite yet.',
        }[reason] ?? 'Could not rewrite that just now. Your words are unchanged.');

        /* ── Changes ───────────────────────────────────────────────────
         *
         * Everything saved and not yet published, with what the page said
         * before and what it will say after. The count alone was the least
         * useful half of the answer: "3 unpublished changes" invites exactly
         * one question, and nothing here could answer it.
         */
        const renderChanges = async () => {
            drawerFields.replaceChildren(note('Loading…'));

            let payload;

            try {
                const response = await request('/live-edit/changes', { method: 'GET' });
                payload = await response.json();
            } catch (error) {
                drawerFields.replaceChildren(note(plainly(error, 'show your changes')));

                return;
            }

            const changes = payload?.changes ?? [];

            if (changes.length === 0) {
                drawerFields.replaceChildren(note('No unpublished changes.'));

                return;
            }

            drawerFields.replaceChildren();

            changes.forEach((change) => {
                const row = document.createElement('div');
                row.className = 'le-change';

                const head = document.createElement('div');
                head.className = 'le-row le-change-head';
                const label = document.createElement('span');
                label.className = 'le-change-label';
                label.textContent = labelForChange(change);

                const revert = document.createElement('button');
                revert.type = 'button';
                revert.className = 'le-chip-btn';
                revert.textContent = 'Revert';
                revert.addEventListener('click', () => void revertChange(change, revert));

                head.append(label, revert);
                row.append(head);

                // The old words struck through, the new ones under them. A
                // change you cannot read is a change you cannot check.
                if (change.before) {
                    const before = document.createElement('p');
                    before.className = 'le-change-before';
                    before.textContent = trim(change.before);
                    row.append(before);
                }

                const after = document.createElement('p');
                after.className = 'le-change-after';
                after.textContent = trim(change.after) || '(empty)';
                row.append(after);

                drawerFields.append(row);
            });
        };

        const trim = (value) => {
            const text = String(value ?? '').replace(/\s+/g, ' ').trim();

            return text.length > 70 ? `${text.slice(0, 70)}…` : text;
        };

        /* What to call a change in the list.
           The element's own words where the page still has them, because that
           is what somebody remembers changing — not auto:9de57a6dba8b. */
        const labelForChange = (change) => {
            const onPage = document.querySelector(
                `[data-edit="setting:${CSS.escape(change.key)}"], [data-edit-img="setting:${CSS.escape(change.key)}"], [data-style="${CSS.escape(change.key)}"]`
            );

            if (onPage) return describeElement(onPage);

            return change.kind === 'style' ? 'Styling' : 'Text';
        };

        const revertChange = async (change, button) => {
            button.disabled = true;
            button.textContent = 'Reverting…';

            try {
                await request('/live-edit/changes', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: change.key, kind: change.kind }),
                });
            } catch (error) {
                button.disabled = false;
                button.textContent = 'Revert';
                ui.toast(plainly(error, 'put that back'));

                return;
            }

            // Reloading rather than putting the old words back by hand: the
            // page is rendered from the drafts, and guessing what it should
            // now say is how the panel and the page come to disagree.
            reloadWithToast('Reverted \u2713');
        };

        /* ── History ───────────────────────────────────────────────────
         * What has been published, newest first. */
        const renderHistory = async () => {
            drawerFields.replaceChildren(note('Loading…'));

            let payload;

            try {
                const response = await request('/live-edit/versions', { method: 'GET' });
                payload = await response.json();
            } catch (error) {
                drawerFields.replaceChildren(note(plainly(error, 'show what has been published')));

                return;
            }

            const versions = payload?.versions ?? [];

            if (versions.length === 0) {
                drawerFields.replaceChildren(note('Nothing published yet. Your first publish will appear here.'));

                return;
            }

            drawerFields.replaceChildren();

            versions.forEach((version, index) => {
                const row = document.createElement('div');
                row.className = 'le-version';

                const dot = document.createElement('span');
                dot.className = index === 0 ? 'le-version-dot is-latest' : 'le-version-dot';

                const text = document.createElement('div');
                const what = document.createElement('p');
                what.className = 'le-change-after';
                what.textContent = version.restored_from
                    ? `Restored version ${version.restored_from}`
                    : `Published ${version.changes ?? 0} change${version.changes === 1 ? '' : 's'}`;

                const when = document.createElement('p');
                when.className = 'le-change-when';
                when.textContent = ago(version.published_at);

                text.append(what, when);
                row.append(dot, text);
                drawerFields.append(row);
            });
        };

        const note = (message) => {
            const paragraph = document.createElement('p');
            paragraph.className = 'le-hint';
            paragraph.textContent = message;

            return paragraph;
        };

        /* Times a person would say out loud. "3 days ago" is what somebody
           asks about; an ISO timestamp is what a log wants. */
        const ago = (iso) => {
            if (!iso) return '';

            const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

            if (seconds < 90) return 'Just now';
            if (seconds < 3600) return `${Math.round(seconds / 60)} minutes ago`;
            if (seconds < 86400) return `${Math.round(seconds / 3600)} hours ago`;
            if (seconds < 86400 * 8) return `${Math.round(seconds / 86400)} days ago`;

            return new Date(iso).toLocaleDateString();
        };

        const openDrawer = () => {
            // The floating handles point at the page, and the panel is now the
            // subject. On a phone the panel is full width, so a handle left
            // showing sits on top of it and looks like a fault.
            hideHandle();
            hideBgHandle();
            drawer.classList.add('is-open');
            ui.toolbar.classList.add('is-compact');

            if (drawerTab === 'Edit') {
                drawerFields.querySelector('textarea, input:not([type=checkbox]), select')?.focus();
            }
        };
        const closeDrawer = (force = false) => {
            if (!force && current?.dirty && !window.confirm('Discard unsaved changes?')) return;
            current?.restore?.();
            clearStylePreview();
            drawer.classList.remove('is-open');
            ui.toolbar.classList.remove('is-compact');
            current = null;
        };

        const editables = () => document.querySelectorAll('[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]');

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
         * A background set in the theme's stylesheet exists nowhere in the markup,
         * so the scanner cannot tag it. The browser can see it, though: mark such
         * elements when editing starts so they get a hover handle of their own.
         */
        const markLiveBackgrounds = () => {
            document.querySelectorAll('[data-style]').forEach((element) => {
                if (element.hasAttribute('data-edit-bg')) return;
                const computed = getComputedStyle(element).backgroundImage || '';
                const match = computed.match(/url\((['"]?)(.*?)\1\)/);
                const rect = element.getBoundingClientRect();
                const worthEditing = match && !match[2].startsWith('data:') && rect.width >= 120 && rect.height >= 120;
                element.toggleAttribute('data-has-bg', Boolean(worthEditing));
            });
        };

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

                // And look once more for pictures living in a stylesheet. A
                // builder decides for itself when to load a section's
                // background, so at boot some of them are not there yet —
                // pressing this button is the one moment we know the page has
                // finished. Anything found is asked about and appears without
                // a reload; if the answer is "nothing new", it costs a pass
                // and no request at all.
                if (api?.base && api?.site) {
                    import('./autotag.js')
                        .then((m) => m.refreshBackgrounds({ base: api.base, site: api.site, key: api.token }))
                        .then((added) => { if (added) markLiveBackgrounds(); })
                        .catch((error) => console.warn('[live-edit] could not look again for backgrounds:', error.message));
                }
            }
            else {
                hideBgHandle();
                hideHover();
            }
            if (!on) closeDrawer(true);
        };

        /**
         * Stop editing cleanly when the key is no longer good.
         *
         * On a site with its own sign-in a reload is enough — they are still
         * logged in there. On a site that has none, a reload achieves nothing
         * and "sign in again" is advice they cannot act on, so they are asked
         * where to send a new link.
         */
        const endSession = async () => {
            const api = window.liveEditApi;
            const session = await import('./session.js').catch(() => null);

            session?.forget(window);

            if (!api || !session) {
                window.location.reload();

                return;
            }

            const email = window.prompt(
                'Your editing session has ended. Enter your email address and we will send you a new link.'
            );

            if (email) {
                await session.requestLink(api, email, window).catch(() => {});
                window.alert('If that address can edit this site, a link is on its way.');
            }

            // Back to how a visitor sees it, rather than a page that still
            // believes it is being edited.
            window.location.reload();
        };

        const request = async (url, options) => {
            // Same-origin with a session cookie on a Laravel page; the content
            // API with a bearer key when the editor is running inside a site
            // this application does not serve.
            const api = window.liveEditApi;
            const mapped = api ? apiRequestFor(url, options, api) : null;
            const response = mapped
                ? await fetch(mapped.url, mapped.init)
                : await fetch(url, requestInit(csrf, options));
            if (response.status === 419 || response.status === 401) {
                // The key is dead. Left in storage it would put the page back
                // into editing mode on reload, where every save fails the same
                // way and nothing offers a way out.
                await endSession();
                throw new Error('Your editing session has ended.');
            }
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                // The two hosts word a refusal differently: the editor's own
                // controller answers {message}, the content API answers
                // {error: {message}}. Reading only the first threw away every
                // reason the API ever gave and showed "Could not save. Try
                // again." instead — which says nothing, and is the wrong
                // advice when trying again cannot possibly work.
                throw new Error(data.error?.message ?? data.message ?? 'Could not save. Try again.');
            }
            if (!isJsonResponse(response)) {
                throw new Error('That did not save. Reload the page and try again.');
            }

            return response;
        };

        /**
         * What the page should show once this save has been applied.
         *
         * Only the kinds whose value is visible on the page and comparable
         * without guessing. A record writes several fields at once, a style is
         * a computed rule, rich text is markup — checking those would mean
         * deciding what "the same" means, and a check that cries wolf is a
         * check nobody reads.
         */
        const expectationFor = (subject, fields) => {
            if (!subject?.element) {
                return null;
            }

            const marker = (attribute) => {
                const value = subject.element.getAttribute(attribute);

                return value === null ? null : { attr: attribute, marker: value };
            };

            if (subject.kind === 'image') {
                const url = fields.querySelector('input[type=url]')?.value.trim();
                const file = fields.querySelector('input[type=file]')?.files?.[0];
                const where = marker('data-edit-img') ?? marker('data-edit-bg');

                // An upload is stored under a name the server chooses, so
                // there is nothing here to compare it against yet.
                return url && where ? { ...where, kind: 'image', value: url } : null;
            }

            if (subject.kind === 'icon') {
                const where = marker('data-edit-icon');

                return where && subject.value ? { ...where, kind: 'icon', value: subject.value } : null;
            }

            if (subject.kind === 'setting' && typeof subject.savedValue === 'string') {
                const where = marker('data-edit');

                // Markup, not words: comparing it to what the page renders
                // would be comparing two different things.
                if (!where || /<[a-z][\s\S]*>/i.test(subject.savedValue)) {
                    return null;
                }

                // A counter renders from an attribute and its words are a
                // placeholder the theme's own script rewrites.
                if (subject.element.hasAttribute('data-edit-attr')) {
                    return null;
                }

                return { ...where, kind: 'text', value: subject.savedValue };
            }

            return null;
        };

        /**
         * Tell the page builder what just changed, so its copy agrees.
         *
         * A builder does not render from the markup; it renders from its own
         * store. So a page built with one has two answers to "what does this
         * heading say" — ours, which wins on every page view, and the
         * builder's, which wins the moment somebody opens the page in it and
         * presses Update. The client's words are gone, weeks later, done by
         * somebody who was not editing text at all.
         *
         * The store is reachable, so the honest fix is to keep the two in
         * agreement rather than to warn about the disagreement. The element a
         * client clicked sits inside a wrapper carrying the builder's own id
         * for it, which is the same id the store uses.
         *
         * Best effort, deliberately. The save already happened and succeeded;
         * this is reconciliation, and failing it must not turn a save that
         * worked into an error message.
         */
        const tellTheBuilder = async (edit) => {
            const url = window.liveEditApi?.builderUrl;

            if (!url || edit?.kind !== 'setting' || typeof edit.savedValue !== 'string' || !edit.element) {
                return;
            }

            const owner = edit.element.closest('.elementor-element[data-id]');

            if (!owner) {
                return;
            }

            try {
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(window.liveEditApi?.publishHeaders ?? {}) },
                    body: JSON.stringify({
                        page: window.location.href,
                        element: owner.dataset.id,
                        value: edit.savedValue,
                    }),
                });
            } catch (error) {
                // Their words are saved either way; this only decides whether
                // the builder will overwrite them later.
                console.warn('[live-edit] could not tell the page builder about this change:', error.message);
            }
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
                        // Words come from a textarea and an icon from the
                        // picker's hidden field, but a panel that chooses
                        // rather than types carries the value itself — a
                        // drawing picked from the page has no field to read,
                        // and reading one anyway saved nothing.
                        body: JSON.stringify({
                            key: current.key,
                            value: (current.savedValue = current.value ?? drawerFields.querySelector('textarea, input[name=icon]')?.value ?? ''),
                            locale: window.liveEditLocale,
                        }),
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
                await tellTheBuilder(current);
                expectChange(expectationFor(current, drawerFields));
                settle('Saved \u2713', current.key ?? null, current.savedValue ?? null);
            } catch (error) {
                restoreButton();
                window.alert(error.message);
            }
        };

        // Started here, below request(), and not where they are defined.
        // Both of these call it, and a const is not reachable before its own
        // declaration — so from up there each threw into its own catch and
        // logged a warning nobody reads. The style panel then said "nothing on
        // this element can be restyled" on every WordPress site, and the AI
        // row never appeared, both looking exactly like features that were off.
        void loadCredits();
        void loadStyleVocabulary();

        /* ── Finding a picture ─────────────────────────────────────────
         *
         * The commonest thing a client cannot do is produce a good photograph.
         * They have the words; they do not have a photographer. So the three
         * ways of getting one are in the order they should be tried: the file
         * they already have, then a real photograph somebody took and gave
         * away, then — last, and the only one that costs money — inventing one.
         *
         * Every result leaves by the same door as a hand-typed URL: it fills
         * the drawer's own fields and presses its own Save. That keeps one
         * save path, so the picture is fitted to the space the theme designed,
         * the description is kept, and the page builder is told, exactly as
         * before. A second save path is how two of those quietly stop
         * happening for pictures chosen this way.
         */
        const el = (tag, className, text) => {
            const node = document.createElement(tag);
            if (className) node.className = className;
            if (text !== undefined && text !== null) node.textContent = text;

            return node;
        };

        /**
         * The small line above a heading, which is usually the useful one.
         *
         * A hero heading is very often a name — of the person, of the company,
         * of the restaurant — and a name is the worst thing to search a photo
         * library for. The kicker above it is where the category lives:
         * "Guitarist & Musician", "Architecture & Interiors", "Family care".
         * That is what somebody wants a picture of.
         */
        const categoryNear = (element) => {
            // Up until a container that actually holds a heading. The nearest
            // one to an image is often a wrapper the theme put around the
            // picture alone, which contains no words at all — start there and
            // this returns nothing on exactly the pages it is meant for.
            let section = element.closest('section, article, header, div[data-style]');

            while (section && !section.querySelector('h1, h2, h3')) {
                section = section.parentElement?.closest('section, article, header, div[data-style]') ?? null;
            }

            const heading = section?.querySelector('h1, h2, h3');

            if (!section || !heading) return '';

            const before = [...section.querySelectorAll('p, span, div, h4, h5, h6')]
                .filter((node) => node.children.length === 0)
                .filter((node) => heading.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING)
                .map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim())
                // Long enough to mean something, short enough to be a label
                // rather than a paragraph.
                .find((text) => text.length > 3 && text.length < 42);

            return before ?? '';
        };

        // Words that describe nothing on their own, plus whatever the site
        // calls itself — searching a photo library for the client's own name
        // returns strangers who happen to share it.
        const SAYS_NOTHING = /^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/;

        const usefulWords = (text) => {
            const ours = new Set(
                (document.title ?? '').toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean)
            );

            return (text ?? '')
                .toLowerCase()
                .split(/[^a-z0-9]+/i)
                .filter((word) => word.length > 3 && !SAYS_NOTHING.test(word) && !ours.has(word));
        };

        const describeSpot = (element) => {
            // Category first, heading second: the heading may be a name.
            const words = usefulWords(categoryNear(element)).slice(0, 3);

            if (words.length > 0) return words.join(' ');

            const fromHeading = usefulWords(nearestHeading(element)).slice(0, 3);

            return fromHeading.length > 0 ? fromHeading.join(' ') : 'workplace';
        };

        const photoSuggestions = (element) => {
            const from = describeSpot(element);
            const label = (element.dataset.editLabel ?? '').toLowerCase().trim();
            const wide = /hero|banner|header|cover/.test(label);

            return [...new Set([
                from,
                wide ? `${from} wide` : `${from} close up`,
                // Always one that is certain to return something, so a search
                // that finds nothing is never a dead end.
                'workplace',
            ].filter(Boolean))].slice(0, 4);
        };

        /**
         * A description of the picture, written from the page.
         *
         * Somebody who cannot describe what they want can press one button and
         * get something usable. The subject is the kicker where there is one,
         * because a heading is so often a name, and a picture of a name is not
         * a thing anybody can take.
         */
        const imagePrompt = (element) => {
            const subject = categoryNear(element) || nearestHeading(element) || 'This page';

            return `${subject.replace(/[.\s]+$/, '')}. Photographic, natural daylight, calm and`
                + ' editorial, soft neutral tones to match the rest of the site. No text.';
        };

        /**
         * @param {HTMLElement} element the image being replaced
         * @param {(chosen: {url?: string, file?: File, credit?: string}) => void} apply
         * @param {string} startOn which tab to open on
         */
        const openImagePicker = (element, apply, startOn = 'Free photos') => {
            const sheet = ui.modal({
                title: 'Replace image',
                subtitle: element.dataset.editLabel ?? 'Image',
            });

            const panel = document.createElement('div');
            sheet.body.append(panel);
            sheet.tabs.hidden = false;

            const chosen = (what) => {
                sheet.close();
                apply(what);
            };

            const tabs = {
                Upload: () => drawUpload(panel, chosen),
                'Free photos': () => void drawPhotos(panel, element, chosen),
                'Generate with AI': () => drawImagine(panel, element, chosen),
            };

            const buttons = Object.keys(tabs).map((name) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'le-modal-tab';
                button.textContent = name;
                button.addEventListener('click', () => show(name));
                sheet.tabs.append(button);

                return [name, button];
            });

            const show = (name) => {
                buttons.forEach(([label, button]) => button.classList.toggle('is-on', label === name));
                panel.replaceChildren();
                tabs[name]();
            };

            show(tabs[startOn] ? startOn : 'Free photos');

            return sheet;
        };

        const drawUpload = (panel, chosen) => {
            panel.append(uploadWidget({
                hint: 'PNG, JPG or WEBP, or drag one here',
                onFile: (file) => chosen({ file }),
            }));

            // The other way somebody already has a picture: it is on the
            // internet and they have the address. This used to be a box in
            // the panel; it belongs with the rest of the ways in here.
            const link = el('div', 'le-row-tight');
            const address = document.createElement('input');
            address.type = 'url';
            address.className = 'le-search';
            address.placeholder = 'Or paste a link to a picture';

            const use = el('button', 'le-btn-outline', 'Use it');
            use.type = 'button';

            const take = () => {
                const value = address.value.trim();
                if (value) chosen({ url: value.startsWith('http') ? value : `https://${value}` });
            };

            use.addEventListener('click', take);
            address.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                take();
            });

            link.append(address, use);
            panel.append(link);

            const hint = el('p', 'le-hint', 'You can also drag a picture straight onto the image on the page.');
            hint.style.marginTop = '14px';
            panel.append(hint);
        };

        const drawPhotos = async (panel, element, chosen) => {
            const search = document.createElement('input');
            search.type = 'search';
            search.className = 'le-search';
            search.placeholder = 'Search free photographs';

            const chips = document.createElement('div');
            chips.className = 'le-chips';
            const grid = document.createElement('div');
            grid.className = 'le-grid';

            const credit = document.createElement('p');
            credit.className = 'le-hint';
            credit.style.marginTop = '16px';
            credit.textContent = 'Free to use under the Unsplash licence. The photographer is credited automatically.';

            panel.append(search, chips, grid, credit);

            const shimmer = () => {
                grid.replaceChildren();
                for (let i = 0; i < 6; i += 1) grid.append(el('div', 'le-shimmer'));
            };

            const look = async (query) => {
                search.value = query;
                shimmer();

                let payload;

                try {
                    const response = await request(`/live-edit/photos?q=${encodeURIComponent(query)}`, { method: 'GET' });
                    payload = await response.json();
                } catch (error) {
                    grid.replaceChildren(note(plainly(error, 'look for photographs')));

                    return;
                }

                const photos = payload?.photos ?? [];

                if (photos.length === 0) {
                    grid.replaceChildren(note(photoExcuse(payload?.reason, query)));

                    return;
                }

                grid.replaceChildren();

                photos.forEach((photo) => {
                    const pick = document.createElement('button');
                    pick.type = 'button';
                    pick.className = 'le-pick';

                    const shot = document.createElement('img');
                    shot.className = 'le-pick-shot';
                    shot.src = photo.thumb ?? photo.full;
                    shot.alt = photo.alt ?? '';
                    shot.loading = 'lazy';

                    const by = el('span', 'le-pick-by', photo.by ? `Photo by ${photo.by}` : '');

                    pick.append(shot, by);
                    pick.addEventListener('click', () => {
                        // Unsplash asks to be told when a photograph is
                        // actually used — it is how the photographer is
                        // credited with it. Best effort, and never something
                        // the client waits on.
                        if (photo.downloadLocation) {
                            void request('/live-edit/photos/used', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ download_location: photo.downloadLocation }),
                            }).catch(() => {});
                        }

                        chosen({
                            url: photo.full,
                            credit: photo.by ? `Photo by ${photo.by} on Unsplash` : 'Unsplash',
                            alt: photo.alt ?? '',
                        });
                    });

                    grid.append(pick);
                });
            };

            photoSuggestions(element).forEach((suggestion, index) => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'le-chip';
                chip.textContent = suggestion;
                chip.addEventListener('click', () => void look(suggestion));
                chips.append(chip);
                if (index === 0) chip.classList.add('is-on');
            });

            search.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                if (search.value.trim()) void look(search.value.trim());
            });

            await look(photoSuggestions(element)[0]);
        };

        const photoExcuse = (reason, query) => ({
            not_configured: 'Free photographs are not switched on for this site yet.',
            // Not "try again": this one never works until somebody changes a
            // setting, and sending them back to the same button for the rest
            // of the afternoon is worse than saying so.
            not_allowed: 'The photo library would not accept this site’s key. It needs setting up again.',
            unreachable: 'Could not reach the photo library just now. Try again in a moment.',
            nothing_to_search_for: 'Type what the picture should show.',
        }[reason] ?? `Nothing found for "${query}". Try fewer words.`);

        const drawImagine = (panel, element, chosen) => {
            const suggestion = imagePrompt(element);

            const card = el('div', 'le-suggest');
            card.append(
                el('div', 'le-eyebrow', 'Suggested for this spot'),
                el('div', 'le-suggest-text', suggestion),
            );

            const use = document.createElement('button');
            use.type = 'button';
            use.className = 'le-chip';
            use.style.marginTop = '10px';
            use.textContent = 'Use this description';
            card.append(use);

            const box = document.createElement('textarea');
            box.className = 'le-textarea';
            box.placeholder = 'Describe the picture you want';
            use.addEventListener('click', () => {
                box.value = suggestion;
                box.focus();
            });

            const go = document.createElement('button');
            go.type = 'button';
            go.className = 'le-btn-publish';
            go.style.marginTop = '14px';
            go.textContent = 'Make a picture · 5 credits';

            const grid = el('div', 'le-grid is-square');
            grid.style.display = 'none';

            panel.append(card, box, go, grid);

            go.addEventListener('click', async () => {
                const prompt = box.value.trim() || suggestion;

                go.disabled = true;
                go.textContent = 'Making…';
                grid.style.display = '';
                grid.replaceChildren();
                // Four, because one is a verdict and four is a choice.
                for (let i = 0; i < 4; i += 1) grid.append(el('div', 'le-shimmer'));

                let payload;

                try {
                    const response = await request('/live-edit/imagine', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt }),
                    });
                    payload = await response.json();
                } catch (error) {
                    grid.replaceChildren(note(plainly(error, 'make a picture')));
                    go.disabled = false;
                    go.textContent = 'Try again · 5 credits';

                    return;
                }

                const images = payload?.images ?? [];

                if (typeof payload?.balance === 'number') credits = { ...(credits ?? {}), balance: payload.balance };

                if (images.length === 0) {
                    grid.replaceChildren(note(imagineExcuse(payload?.reason)));
                    go.disabled = false;
                    go.textContent = 'Try again · 5 credits';

                    return;
                }

                grid.replaceChildren();

                images.forEach((url) => {
                    const pick = document.createElement('button');
                    pick.type = 'button';
                    pick.className = 'le-pick';

                    const shot = document.createElement('img');
                    shot.className = 'le-pick-shot';
                    shot.src = url;
                    shot.alt = '';

                    pick.append(shot, el('span', 'le-tag', 'MADE'));
                    pick.addEventListener('click', () => chosen({ url, credit: `Made from: ${prompt}` }));
                    grid.append(pick);
                });

                go.disabled = false;
                go.textContent = 'Make four more · 5 credits';
            });
        };

        const imagineExcuse = (reason) => ({
            not_enough_credits: 'Not enough credits to make a picture. You can buy more from your account.',
            not_configured: 'Making pictures is not switched on for this site yet.',
            no_suggestion: 'Nothing usable came back, so you have not been charged. Try describing it differently.',
            nothing_to_work_with: 'Describe the picture you want first.',
        }[reason] ?? 'Could not make a picture just now. You have not been charged.');

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
            finishPanel(element);
        };

        const editText = (element) => {
            const { kind, key, parts: rest } = parseEditKey(element.dataset.edit);
            drawerFields.replaceChildren();
            drawerDelete.classList.add('le-hidden');

            if (kind === 'setting') {
                // The element is carried so the save can be checked against
                // the page afterwards. Without it the check quietly did
                // nothing for words — the commonest edit there is — and
                // "never recorded" is indistinguishable from "checked and
                // fine" from the outside, which is how it went unnoticed.
                current = { kind, key, element };
                drawerTitle.textContent = element.dataset.editLabel ?? describeElement(element);
                const richSetting = (window.liveEditRich?.settings ?? []).includes(rest[0]);
                // Theme markup is full of tabs and newlines; collapse them so the
                // field shows the sentence the editor actually sees on the page.
                const raw = displayedValue({
                    editValue: element.dataset.editValue,
                    ownText: ownTextOf(element),
                    fullText: element.textContent,
                });
                const text = richSetting ? raw.trim() : raw.replace(/\s+/g, ' ').trim();
                // A setting can say its value is an icon name rather than
                // words. The picker already exists for a record's icon field;
                // this lets a plain setting reach it, so an icon that is part
                // of the content rather than the furniture can be chosen the
                // same way.
                const asIcon = element.dataset.editAs === 'icon';
                drawerFields.append(asIcon
                    ? fieldInput('icon', 'Icon', element.dataset.editValue ?? '', 1, false)
                    : fieldInput('value', 'Text', text, 6, richSetting));

                // Offered under the words it would rewrite, and only for
                // words: there is nothing to say about an icon.
                if (!asIcon) appendAssist(element, drawerFields.querySelector('textarea'));
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
                // Drafts cover settings and styling, not records. On a site
                // that holds edits back this is the one panel where Save is
                // immediate, and a client who has learned to press Publish
                // would otherwise assume this waited too.
                if (window.liveEditPublishing) {
                    const immediate = document.createElement('div');
                    immediate.className = 'le-hint le-immediate';
                    immediate.textContent = 'Changes here go live as soon as you save, without publishing.';
                    drawerFields.append(immediate);
                }

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
            finishPanel(element);
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

        /**
         * The rest of what this element offers, whatever brought us here.
         *
         * An element does not have ONE kind. A button is words and a
         * destination; a social icon is a drawing and a destination; a card is
         * a background, a style, and a row in a list. The drawer used to
         * decide what to show by running down a priority list — image, else
         * text, else drawing, else link, else style — and each branch then
         * built its own ending by hand. Seven endings, no two alike.
         *
         * Everything reported while this was being driven on a real template
         * came out of that one decision: a link that opened as a style box and
         * so had no address field, a group that opened with nothing in it at
         * all, a button whose link or whose words went missing depending on
         * which attribute won the race.
         *
         * So the priority list now chooses only ONE thing — which aspect the
         * panel is titled after and which a save writes — and every panel ends
         * here, where each remaining aspect is offered if the element has it.
         * Adding an aspect later means adding it once.
         */
        const finishPanel = (element, { styleKey = null, styleOn = element } = {}) => {
            if (element.dataset.editHref !== undefined) {
                appendLinkFields(element);
            }

            appendVisitLink(element);

            const key = styleKey ?? styleOn.dataset.styleEdit ?? styleOn.dataset.style;
            const props = declaredStyleProps(styleOn.dataset.styleProps, window.liveEditStyleProps);

            if (key && props.length) {
                addStyleFields(key, props, styleOn);
            }

            appendContents(element);
            appendListControls(element);
            setTrail(element.dataset.styleEdit ? (element.closest('[data-style]') ?? element.parentElement) : element);
            showTab('Edit');
            openDrawer();
        };

        /**
         * What to call one thing in that list.
         *
         * The words on the page beat any label we could invent — a client
         * looks for "Book a lesson", not for "Link". A social icon has no
         * words at all, though, and four rows reading "Link" are no more
         * useful than the empty panel they replaced, so the page is asked what
         * it calls the thing: the name it gives a screen reader, then the
         * brand in its own icon class.
         */
        const nameInside = (node) => {
            const words = (ownTextOf(node) || node.textContent || '').replace(/\s+/g, ' ').trim();

            if (words) {
                return words.slice(0, 28);
            }

            const spoken = (node.getAttribute('aria-label') ?? node.getAttribute('title') ?? '').trim();

            if (spoken) {
                return spoken.slice(0, 28);
            }

            // "elementor-social-icon-facebook" / "fab fa-instagram" — the last
            // word of an icon class is the only name these ever carry.
            const brand = node.className.toString()
                .match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]
                ?? [...node.querySelectorAll('[class]')]
                    .map((child) => child.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1])
                    .find(Boolean);

            if (brand) {
                return brand.charAt(0).toUpperCase() + brand.slice(1);
            }

            return labelForNode(node);
        };

        /**
         * What a container holds, so naming it is never a dead end.
         *
         * Clicking a section or a group opens it as a styleable box, and
         * plenty of them have nothing of their own to offer: the panel said
         * "Group", then "Nothing on this element can be restyled", and beneath
         * that a button to delete it. Everything a client actually wanted was
         * inside, one or two elements down, with no way to get there but
         * guessing where to click on the page.
         *
         * So the drawer lists them. Only the outermost editable things — the
         * ones a client would recognise — and each jumps to its own panel. It
         * adds nothing to the page and no affordance the design lacked; it
         * names what the scanner already found.
         */
        const appendContents = (element) => {
            const selector = '[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]';
            const inside = [...element.querySelectorAll(selector)]
                // Outermost only. A heading inside a card inside a group would
                // otherwise be offered three times over.
                .filter((node) => node.parentElement?.closest(selector) === null
                    || !element.contains(node.parentElement.closest(selector)))
                // Something a visitor cannot see is not something a client is
                // looking for: a theme's screen-reader labels and its closed
                // menus would otherwise crowd out the real content.
                .filter((node) => node !== element && node.getBoundingClientRect().width > 0);

            if (inside.length === 0) {
                return;
            }

            // A row of social links is four things; cutting the list at
            // twelve dropped YouTube and said nothing, which reads as "we
            // could not find it" rather than "we did not show it".
            const shown = inside.slice(0, 24);

            const heading = document.createElement('div');
            heading.className = 'le-section-heading';
            heading.textContent = inside.length > shown.length
                ? `Inside this — first ${shown.length} of ${inside.length}`
                : 'Inside this';
            drawerFields.append(heading);

            const row = document.createElement('div');
            row.className = 'le-row';

            shown.forEach((node) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'le-chip-btn';
                button.textContent = nameInside(node);
                button.addEventListener('click', () => switchToNode(node));
                row.append(button);
            });

            drawerFields.append(row);
        };

        const editStyle = (element) => {
            current = { kind: 'style' };
            // A chip carries data-style-edit; a styleable element carries data-style.
            const styleKey = element.dataset.styleEdit ?? element.dataset.style;
            drawerTitle.textContent = element.dataset.editLabel ?? describeElement(element);
            drawerFields.replaceChildren();
            drawerDelete.classList.add('le-hidden');
            finishPanel(element, { styleKey });
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
        const classListUsing = (element, variant, name, was) => classListWith(
            [...element.classList],
            name,
            was,
            faceClassesOf(element, was),
            faceClassesOf(variant, variant.dataset.editIconCurrent)
        );

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

            const icons = orderedIcons(
                [...faces].map(([face, variant]) => ({ face, variant, icons: drawableIn(catalogue, face) }))
            );

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
                finishPanel(element);

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

            const more = document.createElement('div');
            more.className = 'le-hint';

            const LIMIT = 400;
            const draw = (filter) => {
                const term = filter.trim().toLowerCase().replace(/\s+/g, '-');
                const shown = term ? icons.filter(({ name }) => name.includes(term)) : icons;
                grid.replaceChildren();
                shown.slice(0, LIMIT).forEach(({ name, glyph, face, variant }) => {
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
                // Say so rather than stopping silently, which reads as "that is
                // all there is".
                more.textContent = shown.length > LIMIT
                    ? `Showing ${LIMIT} of ${shown.length}. Type to narrow it down.`
                    : '';
            };

            search.addEventListener('input', () => draw(search.value));
            draw('');
            drawerFields.append(search, grid, more);
            finishPanel(element);
        };

        /**
         * Swap an inline drawing.
         *
         * The page is the catalogue, as it is for an icon font: whatever
         * drawings the theme already uses are the ones that will look right in
         * it. Pasting one is there for anything else, and the server rebuilds
         * whatever arrives from an allowed list before it reaches a page.
         */
        const editDrawing = (element) => {
            const was = element.outerHTML;
            current = { kind: 'setting', key: element.dataset.editSvg.replace(/^setting:/, ''), element };
            drawerTitle.textContent = element.dataset.editLabel ?? 'Drawing';
            drawerFields.replaceChildren();
            drawerDelete.classList.add('le-hidden');

            const restore = () => { element.outerHTML = was; };
            current.restore = restore;

            // One of each distinct drawing on the page, the current one first.
            const seen = new Set();
            const drawings = [];
            document.querySelectorAll('svg').forEach((svg) => {
                const markup = svg.outerHTML;
                const shape = markup.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g, '');
                if (seen.has(shape) || svg.getBoundingClientRect().width < 4) return;
                seen.add(shape);
                drawings.push(markup);
            });

            const grid = document.createElement('div');
            grid.className = 'le-icon-grid';
            let chosen = null;

            drawings.slice(0, 120).forEach((markup) => {
                const choice = document.createElement('button');
                choice.type = 'button';
                choice.className = 'le-icon-choice';
                choice.innerHTML = markup;
                const drawn = choice.firstElementChild;
                if (drawn) {
                    drawn.removeAttribute('class');
                    drawn.setAttribute('width', '20');
                    drawn.setAttribute('height', '20');
                }
                choice.classList.toggle('is-current', markup === was);
                choice.addEventListener('click', () => {
                    chosen = markup;
                    current.value = markup;
                    current.dirty = true;
                    // Show it in place, keeping whatever sized it.
                    const live = document.querySelector(`[data-edit-svg="${element.dataset.editSvg}"]`) ?? element;
                    const next = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
                    ['class', 'width', 'height', 'style', 'data-edit-svg', 'data-edit-label'].forEach((name) => {
                        if (live.hasAttribute(name)) next.setAttribute(name, live.getAttribute(name));
                    });
                    live.replaceWith(next);
                    grid.querySelectorAll('.le-icon-choice').forEach((other) => other.classList.remove('is-current'));
                    choice.classList.add('is-current');
                });
                grid.append(choice);
            });

            const pasteWrap = document.createElement('label');
            pasteWrap.className = 'le-field le-divided';
            pasteWrap.append('Or paste an SVG');
            const paste = document.createElement('textarea');
            paste.className = 'le-input le-prose';
            paste.placeholder = '<svg viewBox="0 0 24 24">…</svg>';
            paste.addEventListener('input', () => {
                if (paste.value.trim() === '') return;
                current.value = paste.value.trim();
                current.dirty = true;
            });
            const note = document.createElement('div');
            note.className = 'le-hint';
            note.textContent = 'Anything that could run or fetch is stripped before it is saved.';
            pasteWrap.append(paste, note);

            const heading = document.createElement('div');
            heading.className = 'le-section-heading';
            heading.textContent = drawings.length ? 'Drawings on this site' : 'No other drawings here';

            drawerFields.append(heading, grid, pasteWrap);
            finishPanel(element);
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
            note.textContent = 'Nothing changes on your site until you publish.';

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

            /*
             * The three ways to get a picture, in the order worth trying.
             *
             * The drawer could already take a file or a pasted address, which
             * covers somebody who has the photograph and somebody who has the
             * link. It covered nobody who has neither — which is most people,
             * and the reason a half-finished site has a grey rectangle where
             * the hero should be. These open the picker on the right tab and
             * hand what is chosen back to the fields below, so it saves the
             * same way a pasted address does.
             */
            const ways = el('div', 'le-ways');

            const takeChosen = ({ url, file, credit, alt }) => {
                if (file) {
                    const transfer = new DataTransfer();
                    transfer.items.add(file);
                    fileWrap.querySelector('input[type=file]').files = transfer.files;
                    showPreview(URL.createObjectURL(file));
                } else if (url) {
                    urlInput.value = url;
                    showPreview(url);
                }

                // A description somebody else already wrote beats an empty
                // field, and the alt box is saved whether or not it was
                // touched.
                const altBox = drawerFields.querySelector('[data-img-attr="alt"]');
                if (alt && altBox && altBox.value.trim() === '') altBox.value = alt;

                /*
                 * Who took it, kept where it survives.
                 *
                 * Unsplash's terms ask for the photographer to be named
                 * wherever the picture is shown, and we have nowhere of our
                 * own to put that yet. The title attribute is saved already
                 * and shows on hover, so the credit travels with the picture
                 * rather than being dropped on the floor between the picker
                 * and the page. Only when the client has not written their
                 * own — theirs is not ours to overwrite.
                 */
                const titleBox = drawerFields.querySelector('[data-img-attr="imgTitle"]');
                if (credit && titleBox && titleBox.value.trim() === '') titleBox.value = credit;

                ui.saveButton.click();
            };

            // One button, and the choosing happens in the one place it is
            // being done. Three buttons here made the panel ask which method
            // before it asked what picture, which is the wrong question
            // first: somebody knows they want a different picture long before
            // they know where it is coming from.
            const replace = el('button', 'le-btn le-wide', isBackground ? 'Replace background' : 'Replace image');
            replace.type = 'button';
            replace.addEventListener('click', () => openImagePicker(element, takeChosen, 'Free photos'));
            ways.append(replace);

            // The file box and the address box are the plumbing the save
            // reads; the picker fills them. Kept in the panel and out of
            // sight, so there is one save path rather than two.
            fileWrap.hidden = true;
            urlWrap.hidden = true;

            drawerFields.append(preview, ways, fileWrap, urlWrap, note);

            if (current.target.startsWith('setting:') && !isBackground) {
                drawerFields.append(
                    // What the picture says right now, not what a host
                    // happened to write into a data attribute. Only a page
                    // rendered by Blade ever set those, so on every other kind
                    // of site both fields opened empty — and an empty field is
                    // sent on save, so opening the drawer to change the
                    // picture silently wiped the description of it.
                    textInput('alt', 'Alt text', attributeOf(element, 'alt', 'editAlt'), 'Describes the image for search engines and screen readers.'),
                    textInput('imgTitle', 'Title attribute', attributeOf(element, 'title', 'editTitle'), 'Optional tooltip shown on hover.')
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
            finishPanel(element);
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
            // A picture you click ON, so it is the nearest thing and wins.
            const image = node.closest('[data-edit-img]');
            if (image) return { element: image, kind: 'image' };
            const icon = node.closest('[data-edit-icon]');
            if (icon) return { element: icon, kind: 'icon' };
            const drawing = node.closest('[data-edit-svg]');
            if (drawing) return { element: drawing, kind: 'svg' };
            const text = node.closest('[data-edit]');
            if (text) return { element: text, kind: 'text' };
            const link = node.closest('[data-edit-href]:not([data-edit])');
            if (link) return { element: link, kind: 'link' };
            /*
             * A background you click INSIDE, so it must lose to anything
             * nearer — the same rule as a styleable box below, and for the
             * same reason, but it took a real page to notice.
             *
             * A hero section is a full-screen container with a picture behind
             * it and the headline sitting on top. Checked before the text, it
             * swallowed every click anywhere in it: somebody clicking the
             * words they wanted to change got an image uploader instead, with
             * nothing to say why. Which is close to the worst thing this
             * product can do to somebody who has never used it before.
             */
            const background = node.closest('[data-edit-bg]');
            if (background) return { element: background, kind: 'image' };
            // Any styleable box, checked last so content wins over its container.
            const box = node.closest('[data-style]:not([data-style-edit])');
            if (box) return { element: box, kind: 'style' };

            return null;
        };

        const openTarget = ({ element, kind }) => {
            if (kind === 'image') editImage(element);
            else if (kind === 'icon') void editIcon(element);
            else if (kind === 'svg') editDrawing(element);
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

        ui.changesButton?.addEventListener('click', () => {
            // Somebody asking what they have changed is asking about editing,
            // so turn it on rather than showing them an empty answer.
            if (!document.body.classList.contains('editing')) setEditing(true);

            showTab('Changes');
            openDrawer();
        });

        /*
         * Publishing, where the site holds edits back. The host says so by
         * declaring how many changes are waiting; without that the buttons stay
         * hidden and the editor behaves as it always did.
         */
        /*
         * A server-rendered page declares this in its layout, before anything
         * here runs. A static page learns it from the content it fetches,
         * which has not arrived yet — so reading it once at boot left the
         * Publish button permanently disabled on exactly the sites that have
         * no other way to put work live.
         */
        const whenPublishingKnown = (use) => {
            if (window.liveEditPublishing) {
                use(window.liveEditPublishing);

                return;
            }

            pageSettled().then(() => window.liveEditPublishing && use(window.liveEditPublishing));
        };

        whenPublishingKnown((publishing) => {
            let pending = publishing.pending ?? 0;
            const showPending = () => {
                ui.publishButton.hidden = false;
                // Always available now. It used to be hidden unless the host
                // could issue a shareable link, but the thing it mostly does
                // is take our own furniture off the page so somebody can look
                // at their site, and every host can do that.
                ui.previewButton.hidden = false;
                // The word stays put and the number appears beside it. The
                // label used to be rewritten to "Publish 3", which moved the
                // button's width on every save and made the one control
                // somebody aims at a moving target.
                ui.publishLabel.textContent = pending > 0 ? 'Publish' : 'Published';
                ui.publishCount.textContent = String(pending);
                ui.publishCount.hidden = pending === 0;
                ui.publishButton.disabled = pending === 0;
                ui.publishButton.title = pending > 0
                    ? `Put ${pending} change${pending === 1 ? '' : 's'} live`
                    : 'Nothing is waiting to be published';
            };
            showPending();

            /*
             * What is about to become public, before it does.
             *
             * This was a window.confirm reading "Put 3 changes live for
             * everyone to see?", which asks somebody to agree to a number.
             * Nobody can answer that: the one thing they need to know is
             * WHICH three, and the only way to find out was to cancel, open
             * Changes, read it, and come back. So the list is here.
             *
             * It also stops being a native dialog, which freezes the page it
             * is drawn over \u2014 including this editor \u2014 until it is answered.
             */
            const reviewAndPublish = async () => {
                const many = pending === 1 ? '' : 's';
                const where = publishing.domain ?? window.location.host;

                const sheet = ui.modal({
                    title: `Publish ${pending} change${many}`,
                    subtitle: `They go live on ${where} right away.`,
                    size: 'is-narrow',
                });

                sheet.body.append(note('Loading\u2026'));

                const keep = el('button', 'le-btn-outline', 'Keep editing');
                keep.type = 'button';
                keep.addEventListener('click', () => sheet.close());

                const go = el('button', 'le-btn-publish', 'Publish now');
                go.type = 'button';

                sheet.foot.hidden = false;
                sheet.foot.append(keep, go);
                go.focus();

                // The list is what makes this worth stopping for, but it is
                // not what makes it safe: a service that cannot answer must
                // not block somebody from publishing work they already know
                // about.
                try {
                    const response = await request('/live-edit/changes', { method: 'GET' });
                    const payload = await response.json();
                    const changes = payload?.changes ?? [];

                    const list = el('div', 'le-review');

                    changes.forEach((change) => {
                        const row = el('div', 'le-review-row');
                        row.append(
                            // The same words the Changes tab uses, so the list
                            // somebody checked before pressing Publish and the
                            // list they publish are recognisably the same one.
                            el('div', 'le-review-what', labelForChange(change)),
                            el('div', 'le-review-to', trim(change.after) || '(empty)'),
                        );
                        list.append(row);
                    });

                    sheet.body.replaceChildren(changes.length > 0 ? list : note('Nothing is waiting.'));
                } catch (error) {
                    sheet.body.replaceChildren(note(plainly(error, 'list what is waiting')));
                }

                go.addEventListener('click', async () => {
                    go.disabled = true;
                    keep.disabled = true;
                    go.textContent = 'Publishing\u2026';
                    // Half a publish is not a thing anybody should be able to
                    // walk away from.
                    sheet.allowDismiss(false);

                    try {
                        await request('/live-edit/publish', { method: 'POST' });
                        pending = 0;
                        showPending();
                        sheet.close();
                        // Where it went, not how many went. The count was on
                        // the button they just pressed; the address is the
                        // thing somebody wants confirmed.
                        reloadWithToast(`Live on ${where} \u2713`);
                    } catch (error) {
                        sheet.allowDismiss(true);
                        go.disabled = false;
                        keep.disabled = false;
                        go.textContent = 'Try again';
                        sheet.body.replaceChildren(note(plainly(error, 'publish that')));
                    }
                });
            };

            ui.publishButton.addEventListener('click', () => {
                if (pending === 0) return;

                // Whatever is being typed right now counts as a change, and
                // it is not saved until the box loses focus.
                document.activeElement?.blur?.();
                void reviewAndPublish();
            });

            /*
             * The page as a visitor gets it.
             *
             * Everything the editor adds is exactly what stops somebody
             * judging their own site: a dashed outline round every sentence,
             * a bar across the bottom, a panel down one side. Until now the
             * only way to see the page without them was to leave edit mode,
             * which also puts away the work in progress.
             *
             * The phone view is the real page loaded at a real phone width
             * rather than this one squeezed narrow. A stylesheet listens to
             * the width of the window, not the width of a box drawn inside
             * it, so squeezing shows the desktop layout in a thin column:
             * convincing, and wrong about the one thing being checked.
             */
            const enterPreview = () => {
                const wasEditing = document.body.classList.contains('editing');

                closeDrawer(true);
                setEditing(false);
                ui.toolbar.style.display = 'none';

                const pill = document.createElement('div');
                pill.className = 'le-back';

                let phone = null;

                const showPhone = (on) => {
                    if (on && !phone) {
                        phone = document.createElement('div');
                        phone.className = 'le-phone';
                        const frame = document.createElement('iframe');
                        const url = new URL(window.location.href);
                        // So the editor does not boot a second time inside
                        // its own preview.
                        url.searchParams.set('live-edit', 'off');
                        frame.src = url.toString();
                        frame.title = 'This page on a phone';
                        phone.append(frame);
                        ui.shadow.append(phone);
                    } else if (!on && phone) {
                        phone.remove();
                        phone = null;
                    }
                };

                const widths = [['Desktop', false], ['Phone', true]];
                const buttons = widths.map(([label, wantsPhone]) => {
                    const button = el('button', 'le-back-btn', label);
                    button.type = 'button';
                    button.addEventListener('click', () => {
                        buttons.forEach((other) => other.classList.remove('is-on'));
                        button.classList.add('is-on');
                        showPhone(wantsPhone);
                    });
                    pill.append(button);

                    return button;
                });
                buttons[0].classList.add('is-on');

                if (publishing.previewUrl) {
                    const share = el('button', 'le-back-btn', 'Copy a link to this');
                    share.type = 'button';
                    share.title = 'A link that shows this unpublished version to somebody else';
                    share.addEventListener('click', async () => {
                        try {
                            await navigator.clipboard.writeText(publishing.previewUrl);
                            ui.toast('Link copied \u2713');
                        } catch {
                            // Refused often enough that the link has to be
                            // gettable without it.
                            window.prompt('Copy this link:', publishing.previewUrl);
                        }
                    });
                    pill.append(share);
                }

                const back = el('button', 'le-back-btn', 'Back to editing');
                back.type = 'button';
                back.addEventListener('click', () => {
                    showPhone(false);
                    pill.remove();
                    document.removeEventListener('keydown', onKey, true);
                    ui.toolbar.style.display = '';
                    setEditing(wasEditing);
                });

                const onKey = (event) => {
                    if (event.key === 'Escape') back.click();
                };

                document.addEventListener('keydown', onKey, true);
                pill.append(back);
                ui.shadow.append(pill);
                back.focus();
            };

            ui.previewButton.addEventListener('click', enterPreview);
        });

        /* \u2500\u2500 The site's other pages \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
         *
         * Read off the site's own navigation rather than configured, for the
         * same reason everything else here is read off the page: the client
         * bought a template and nobody is going to sit down and list its pages
         * for us. Whatever the theme put in its menu IS the list of pages,
         * and it is already in the document.
         *
         * Switching is a navigation, because this editor runs inside the real
         * page rather than in a frame around it. Edit mode is remembered
         * across that, and unpublished work lives on the server, so arriving
         * at the next page looks exactly like staying on this one.
         */
        const sitePages = () => {
            const menus = document.querySelectorAll('nav, [role="navigation"], header ul');
            const seen = new Map();

            // The admin's own furniture is a navigation too, and a very
            // prominent one. Without this the switcher offered "Plugins",
            // "Themes" and "Get Involved" as pages of the client's website.
            const isHostChrome = (node) => node.closest(
                '#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]'
            ) !== null;

            menus.forEach((menu) => {
                if (isHostChrome(menu)) return;

                menu.querySelectorAll('a[href]').forEach((link) => {
                    if (isHostChrome(link)) return;

                    let url;

                    try {
                        url = new URL(link.getAttribute('href'), window.location.href);
                    } catch {
                        return;
                    }

                    // Another website, a jump down this page, a mailto, a
                    // file: none of them is a page of this site to edit.
                    if (url.origin !== window.location.origin) return;
                    if (/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(url.pathname)) return;
                    if (url.pathname === window.location.pathname && url.hash) return;

                    const label = (link.textContent ?? '').replace(/\s+/g, ' ').trim();

                    // A menu is full of links that are pictures, icons and
                    // empty wrappers. A page needs a name to be offered as one.
                    if (label === '' || label.length > 22) return;
                    if (seen.has(url.pathname)) return;

                    seen.set(url.pathname, { label, href: url.href });
                });
            });

            return [...seen.values()].slice(0, 6);
        };

        const drawPages = () => {
            const pages = sitePages();

            // One page is not a choice, and a row with a single item in it
            // just takes room from the controls that do something.
            if (pages.length < 2) return;

            const here = window.location.pathname.replace(/\/$/, '');

            pages.forEach((page) => {
                const button = el('button', 'le-page-btn', page.label);
                button.type = 'button';
                button.title = page.href;

                if (new URL(page.href).pathname.replace(/\/$/, '') === here) {
                    button.classList.add('is-on');
                } else {
                    button.addEventListener('click', () => {
                        // Kept on, so the next page opens ready to edit
                        // rather than as a visitor.
                        sessionStorage.setItem('tb_editing', '1');
                        window.location.href = page.href;
                    });
                }

                ui.pageSwitcher.append(button);
            });

            ui.pageSwitcher.hidden = false;
        };

        drawPages();

        /* \u2500\u2500 Undo and redo \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
         *
         * Undo takes back the most recent thing not yet published, which is
         * the top of the list the Changes tab already shows. It stops at what
         * is published: once something is public, taking it back is another
         * change and another publish, and pretending otherwise would be a
         * button that silently changes a live website.
         *
         * The undone value is kept so it can be put back, and kept in session
         * storage rather than in a variable, because saving anything reloads
         * this page \u2014 a stack held in memory would be empty by the time
         * anybody reached for it. It is per site and per tab, and it goes when
         * the tab does, which is the right lifetime for "what I just undid".
         */
        const REDO_KEY = `live-edit:redo:${api?.site ?? window.location.host}`;

        const redoStack = () => {
            try {
                return JSON.parse(sessionStorage.getItem(REDO_KEY) ?? '[]');
            } catch {
                return [];
            }
        };

        const setRedoStack = (stack) => {
            try {
                sessionStorage.setItem(REDO_KEY, JSON.stringify(stack.slice(-20)));
            } catch {
                // A browser refusing storage is not a reason to refuse an undo.
            }
        };

        // Read rather than passed in, so this can be called from anywhere
        // without threading the count through every caller.
        const showUndoState = () => {
            ui.undoButton.disabled = (window.liveEditPublishing?.pending ?? 0) === 0;
            ui.redoButton.disabled = redoStack().length === 0;
        };

        whenPublishingKnown(showUndoState);
        showUndoState();

        const undoLast = async () => {
            ui.undoButton.disabled = true;

            let change;

            try {
                const response = await request('/live-edit/changes', { method: 'GET' });
                change = ((await response.json())?.changes ?? [])[0];
            } catch (error) {
                ui.toast(plainly(error, 'undo that'));
                showUndoState();

                return;
            }

            if (!change) {
                ui.toast('There is nothing left to undo. Everything is published.');
                showUndoState();

                return;
            }

            const label = labelForChange(change);

            try {
                await request('/live-edit/changes', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: change.key, kind: change.kind }),
                });
            } catch (error) {
                ui.toast(plainly(error, 'undo that'));
                showUndoState();

                return;
            }

            setRedoStack([...redoStack(), { key: change.key, kind: change.kind, value: change.after, label }]);
            reloadWithToast(`Undone: ${label}`);
        };

        const redoLast = async () => {
            const stack = redoStack();
            const step = stack.pop();

            if (!step) {
                ui.toast('There is nothing to put back.');

                return;
            }

            ui.redoButton.disabled = true;

            try {
                if (step.kind === 'style') {
                    // A style is stored as a set of properties, and the list
                    // describes it in words rather than handing them back, so
                    // this is the one thing that cannot be put back exactly.
                    throw new Error('A styling change cannot be put back automatically yet.');
                }

                await request('/live-edit/setting', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: step.key, value: step.value, locale: window.liveEditLocale }),
                });
            } catch (error) {
                ui.toast(plainly(error, 'put that back'));
                ui.redoButton.disabled = false;

                return;
            }

            setRedoStack(stack);
            reloadWithToast(`Put back: ${step.label}`);
        };

        ui.undoButton.addEventListener('click', () => void undoLast());
        ui.redoButton.addEventListener('click', () => void redoLast());

        /*
         * The shortcuts, and the one case they must keep out of.
         *
         * Inside a box somebody is typing in, the browser's own undo is the
         * right one and is what they mean: taking back a word, not taking back
         * the whole sentence they saved a minute ago.
         */
        document.addEventListener('keydown', (event) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;

            const focused = ui.shadow.activeElement ?? document.activeElement;
            const inText = focused?.closest?.('input, textarea, [contenteditable="true"]');
            if (inText) return;

            event.preventDefault();

            if (event.shiftKey) void redoLast();
            else void undoLast();
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
// Exposed for the browser checks, which would otherwise keep their own copy of
// the rule above and drift from it the next time it changes.
window.liveEditDisplayedValue = (element) => displayedValue({
    editValue: element.dataset.editValue,
    ownText: ownTextOf(element),
    fullText: element.textContent,
});

const startLiveEdit = (() => {
    let started = false;

    return () => {
        if (started) return;

        // The phone preview loads this same page in a frame, and an editor
        // booting inside its own preview draws a second toolbar over a page
        // nobody can reach to press it.
        if (new URLSearchParams(window.location.search).get('live-edit') === 'off') return;

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
