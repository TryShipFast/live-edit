import { describe, expect, it } from 'vitest';
import { brandChoices } from '../../resources/js/brand.js';

/* Ask AI sets the brand to what the Brand tab's own buttons would set (owner, 13 Nov 2026: chat does what a click does). */
const config = {
    tokens: [
        { key: 'brand.ink', kind: 'colour', property: '--ink' }, { key: 'brand.accent', kind: 'colour', property: '--accent' },
        { key: 'brand.surface', kind: 'colour', property: '--surface' }, { key: 'brand.raised', kind: 'colour', property: '--raised' },
        { key: 'brand.body', kind: 'colour', property: '--body' }, { key: 'brand.muted', kind: 'colour', property: '--muted' },
        { key: 'brand.line', kind: 'colour', property: '--line' },
        { key: 'brand.display', kind: 'face', property: '--display' }, { key: 'brand.body-face', kind: 'face', property: '--body-face' },
    ],
    faces: [{ id: 'fraunces' }, { id: 'inter' }],
};

describe('the brand in words', () => {
    it('sets a palette, a pair of fonts and one colour as the buttons do', () => {
        const { values } = brandChoices(config, { palette: 'Forest', fonts: 'Classic', colours: { accent: '#1b6ef3' } });

        expect(values['brand.ink']).toBe('#17301F');
        expect(values['brand.accent']).toBe('#1B6EF3');
        expect(values['brand.display']).toBe('fraunces');
        expect(values['brand.body-face']).toBe('inter');
    });

    it('puts the design\'s own back, and refuses what this design does not offer', () => {
        expect(brandChoices(config, { palette: "the design's own" }).values['brand.ink']).toBe('');
        expect(brandChoices(config, { fonts: 'Editorial' }).refused).toContain('Classic');
        expect(brandChoices(config, { colours: { sparkle: '#FFFFFF' } }).refused).toBe('This design has no sparkle colour to change.');
        expect(brandChoices(config, { colours: { accent: 'blue' } }).refused).toBe('A colour is written like #1B6EF3.');
    });
});
