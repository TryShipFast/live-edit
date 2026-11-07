import { describe, expect, it } from 'vitest';
import { asMade, countAsMade, paletteNamed, pairingNamed } from '../../resources/js/changes-as-made.js';
import { PAIRINGS, PALETTES } from '../../resources/js/brand.js';

/*
 * "Publish 18 changes" for six things done, a palette read as seven rows of "Text #0F2A43" (first-time owner
 * walk, 7 Nov 2026). A palette is one change, said by its name; a pairing of faces one.
 */
describe('changes as the owner made them', () => {
    const forest = PALETTES.find((p) => p.id === 'forest');
    const colours = Object.entries(forest.colours).map(([role, after]) => ({ key: `brand.${role}`, after }));
    const changes = [
        { key: 'tpl:heading', after: 'Spotless cars in Lekki.' },
        ...colours,
        { key: 'tpl:photo', after: '/storage/a.jpg' },
        { key: 'brand.font.display', after: 'fraunces' },
        { key: 'brand.font.body', after: 'inter' },
    ];

    it('gathers a palette and a pairing into one change each', () => {
        const rows = asMade(changes);
        expect(rows.map((r) => r.kind)).toEqual(['one', 'colours', 'one', 'type']);
        expect(rows[1].changes).toHaveLength(7);
        expect(countAsMade(changes.map((c) => c.key))).toBe(4);
    });

    it('names the palette and the pairing chosen, and says when it is the owner\'s own mix', () => {
        expect(paletteNamed(colours, PALETTES)).toBe('Forest');
        expect(paletteNamed([{ key: 'brand.accent', after: '#123456' }], PALETTES)).toBeNull();
        expect(pairingNamed([{ key: 'brand.font.display', after: 'fraunces' }, { key: 'brand.font.body', after: 'inter' }], PAIRINGS)).toBe('Classic');
    });
});
