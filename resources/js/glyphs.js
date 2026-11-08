/**
 * Drawn icons in place of typed ones (owner, 8 Nov 2026: "make it professional"; the editor audit: "SVG icons, not text
 * glyphs"). Buttons and links across the panels were written with their arrow in the words ("↑ Move up", "Style ›",
 * "×"): each font draws those differently and they sit off the words' line. Here, once drawn, a control's leading or
 * trailing arrow, chevron, cross or tick becomes the same small SVG every panel uses, the words stay as they were, and
 * the icon is hidden from screen readers (the words, or the control's own name, say what it does).
 */

const PATHS = {
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
};

const GLYPHS = new Map([['↑', 'up'], ['↓', 'down'], ['←', 'left'], ['→', 'right'], ['›', 'chevronRight'], ['▸', 'chevronRight'], ['▾', 'chevronDown'], ['×', 'close'], ['✕', 'close'], ['✓', 'check']]);
const LEADING = /^\s*([↑↓←])\s+/;
const TRAILING = /\s*([→›▸▾✓])\s*$/;
const ALONE = /^\s*([×✕›▸▾✓↑↓←→])\s*$/;

/** One icon as an element. */
export const glyphIcon = (name, size = 16) => {
    const holder = document.createElement('span');
    holder.className = `le-icon-svg le-icon-${name}`;
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">${PATHS[name]}</svg>`;

    return holder;
};

/** A control whose words begin or end with an arrow: the arrow drawn instead. Returns true when it changed it. */
export const iconize = (control) => {
    if (!control || control.dataset?.leIconized === '1') return false;
    const nodes = [...control.childNodes].filter((node) => node.nodeType === 3 && node.textContent.trim());
    if (!nodes.length || control.querySelector('svg')) return false;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    let done = false;
    const alone = nodes.length === 1 && first.textContent.match(ALONE);
    if (alone) {
        if (!control.getAttribute('aria-label') && !control.title) control.setAttribute('aria-label', { close: 'Close', check: 'Done' }[GLYPHS.get(alone[1])] ?? '');
        first.textContent = '';
        control.append(glyphIcon(GLYPHS.get(alone[1])));
        done = true;
    } else {
        const lead = first.textContent.match(LEADING);
        if (lead) {
            first.textContent = first.textContent.replace(LEADING, '');
            control.insertBefore(glyphIcon(GLYPHS.get(lead[1])), first);
            done = true;
        }
        const trail = last.textContent.match(TRAILING);
        if (trail) {
            last.textContent = last.textContent.replace(TRAILING, '');
            last.after(glyphIcon(GLYPHS.get(trail[1])));
            done = true;
        }
    }
    if (done) {
        control.dataset.leIconized = '1';
        control.classList.add('le-has-icon');
    }

    return done;
};

const CONTROLS = 'button, summary, a, [role="button"], .le-crumb';

/** Every control under a root, now and as panels are drawn. */
export const iconizeGlyphs = (root) => {
    const sweep = (scope) => {
        if (scope.matches?.(CONTROLS)) iconize(scope);
        scope.querySelectorAll?.(CONTROLS).forEach(iconize);
    };
    sweep(root);
    // Only children are watched: a control given new words (textContent) gets a new text node and is looked at
    // again; the icons put in here are elements, which are not controls, so nothing loops.
    const watch = new MutationObserver((records) => {
        for (const record of records) {
            record.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (!node.classList?.contains('le-icon-svg')) sweep(node);

                    return;
                }
                if (node.nodeType !== 3) return;
                const control = node.parentElement?.closest?.(CONTROLS);
                if (!control || control.querySelector(':scope > .le-icon-svg')) return;
                delete control.dataset.leIconized;
                control.classList.remove('le-has-icon');
                iconize(control);
            });
        }
    });
    watch.observe(root, { childList: true, subtree: true });

    return watch;
};
