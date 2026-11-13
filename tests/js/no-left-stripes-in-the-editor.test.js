import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/*
 * No border down the left of anything in the editor's own look, the rule our templates keep (templates/CLAUDE.md,
 * "Left stripes"; stripes.mjs fails 2px or wider). Owner, 13 Nov 2026, on the Delete window's quoted words: "but you
 * still added left border i warned you about". A 1px hairline between cells is structure and stays.
 */
describe('the editor draws no left stripes', () => {
    it('has no left border or inset left shadow 2px or wider in any of its styles', () => {
        const dir = path.resolve(__dirname, '../../resources/js');
        const found = [];
        for (const file of fs.readdirSync(dir).filter((f) => /\.(js|css)$/.test(f))) {
            fs.readFileSync(path.join(dir, file), 'utf8').split('\n').forEach((line, i) => {
                const border = line.match(/border-left(?:-width)?\s*:\s*(\d+(?:\.\d+)?)px/);
                const inset = line.match(/box-shadow\s*:\s*inset\s+(\d+(?:\.\d+)?)px\s+0(?:px)?\s+0/);
                if ((border && Number(border[1]) >= 2) || (inset && Number(inset[1]) >= 2)) found.push(`${file}:${i + 1}: ${line.trim().slice(0, 100)}`);
            });
        }
        expect(found).toEqual([]);
    });
});
