import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * A native dialog stops everything.
 *
 * window.confirm freezes the page it is drawn over - the host's site, this
 * editor, and any script waiting on either. Asked while saving was already
 * failing, it reads as the product having locked up, and the only way to learn
 * otherwise is to answer a question you were not expecting. Reported in those
 * terms: "save changes doesn't work... until a pop ask until you discard the
 * changes". It also stopped the browser automation dead, twice, while this was
 * being chased - which is the same fault wearing a different hat.
 *
 * The editor has drawn its own dialog for publishing since the beginning. It
 * sits inside the overlay, blocks nothing, and is the thing to reach for.
 *
 * Checked against the built file rather than the source, because what ships is
 * what can freeze somebody's website.
 */
const built = readFileSync(resolve(process.cwd(), 'resources/dist/live-edit.js'), 'utf8');

describe('the editor never freezes the page it is editing', () => {
    it('does not ask about discarding with a native dialog', () => {
        expect(built).not.toMatch(/confirm\(["'`]Discard/);
    });

    it('draws that question itself instead', () => {
        expect(built).toContain('Discard what you typed?');
        expect(built).toContain('Keep editing');
    });
});
