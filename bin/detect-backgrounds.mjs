/**
 * Browser-side background detector for the live-edit scanner.
 *
 * A DOM-text scan only sees an element's inline `style` attribute, so it
 * misses backgrounds set by a utility class (`bg-[url(...)]`) or a stylesheet
 * rule (`.hero { background-image: url() }`). This walks the RENDERED page and
 * reads each element's COMPUTED style, which resolves all three the same way.
 *
 * It is intentionally self-contained (no imports, no outer references) so it
 * can be serialised straight into the page by `page.evaluate()`.
 *
 * @returns {Array<{tag:string,url:string,selector:string,text:string,width:number,height:number}>}
 */
export function detectBackgrounds() {
    const out = [];
    const seen = new Set();

    const cssPath = (start) => {
        const parts = [];
        for (let node = start; node && node.nodeType === 1 && parts.length < 6; node = node.parentElement) {
            let seg = node.tagName.toLowerCase();
            if (node.id) {
                parts.unshift(seg + '#' + node.id);
                break;
            }
            const parent = node.parentElement;
            if (parent) {
                const twins = [...parent.children].filter((c) => c.tagName === node.tagName);
                if (twins.length > 1) {
                    seg += ':nth-of-type(' + (twins.indexOf(node) + 1) + ')';
                }
            }
            parts.unshift(seg);
        }
        return parts.join(' > ');
    };

    for (const el of document.querySelectorAll('*')) {
        const bg = getComputedStyle(el).backgroundImage;
        if (!bg || bg === 'none') {
            continue;
        }

        // Pull the first real image url; ignore gradient-only backgrounds.
        const match = bg.match(/url\((['"]?)(.*?)\1\)/);
        if (!match) {
            continue;
        }
        const url = match[2];
        if (!url || url.startsWith('data:')) {
            continue;
        }

        // Skip icon-sized or hidden decoration — a background worth editing
        // covers real estate.
        const rect = el.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 40) {
            continue;
        }

        const selector = cssPath(el);
        const key = url + '@' + selector;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);

        out.push({
            tag: el.tagName.toLowerCase(),
            url,
            selector,
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
        });
    }

    return out;
}
