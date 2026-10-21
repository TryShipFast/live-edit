import { describe, expect, it } from 'vitest';
import { contrast, madeHardToRead, needs, over, parseColour, renderBrandPanel, toHex } from '../../resources/js/brand.js';

describe('the Brand tab reads colours the way a browser reports them', () => {
    it('reads hex, rgb, rgba and srgb colour()', () => {
        expect(parseColour('#abc')).toEqual([170, 187, 204, 1]);
        expect(parseColour('#5B1A3A')).toEqual([91, 26, 58, 1]);
        expect(parseColour('rgb(24, 50, 75)')).toEqual([24, 50, 75, 1]);
        expect(parseColour('rgba(0, 0, 0, 0.5)')).toEqual([0, 0, 0, 0.5]);
        expect(parseColour('color(srgb 0.958196 0.771686 0.421176)')).toEqual([244, 197, 107, 1]);
        expect(parseColour('red')).toBeNull();
        expect(toHex([91, 26, 58])).toBe('#5B1A3A');
    });

    it('measures contrast as WCAG does, and the threshold text of a size needs', () => {
        expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
        expect(contrast([91, 26, 58], [47, 158, 143])).toBeLessThan(4.5); // plum on teal
        expect(needs(16, 400)).toBe(4.5);
        expect(needs(24, 400)).toBe(3);
        expect(needs(19, 700)).toBe(3);
        expect(over([0, 0, 0, 0.5], [255, 255, 255, 1])).toEqual([128, 128, 128, 1]);
    });

    it('blames a brand only for text it made hard to read', () => {
        const a = {}; const b = {}; const c = {};
        const before = new Map([[a, { ratio: 7, needs: 4.5 }], [b, { ratio: 3, needs: 4.5 }], [c, { ratio: 9, needs: 4.5 }]]);
        const after = new Map([[a, { ratio: 3.9, needs: 4.5 }], [b, { ratio: 2, needs: 4.5 }], [c, { ratio: 8, needs: 4.5 }]]);
        // b was already hard to read in the design: not this brand's doing
        expect(madeHardToRead(before, after).map((x) => x.el)).toEqual([a]);
    });

    it('keeps the styled logo picker beside the URL field in a compact row', () => {
        const container = document.createElement('div');
        renderBrandPanel({
            container,
            config: { tokens: [], identity: { logoKey: 'brand.logo' } },
            save: async () => {},
            upload: async () => 'https://example.test/logo.png',
            done: () => {},
            notify: () => {},
        });

        const controls = container.querySelector('.le-brand-logo-fields');
        expect(controls.querySelector('input[type="url"]')).not.toBeNull();
        expect(controls.querySelector('.le-upload-compact')).not.toBeNull();
        expect(controls.children).toHaveLength(2);
    });
});
