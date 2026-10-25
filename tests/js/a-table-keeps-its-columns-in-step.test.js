import { describe, expect, it } from 'vitest';
import { applyContent, derivedKey, innermostFirst } from '../../resources/js/content.js';

/*
 * A table the owner shapes (table.data): its rows are a list, and every row,
 * the header row included, is a list of its columns under one key. One saved
 * order of columns changes every row; a row added copies a row that already
 * has the columns added to it.
 */
const table = () => {
    const root = document.createElement('div');
    root.innerHTML = `<table>
      <thead><tr data-edit-list="cols"><th data-edit-item="c1" data-edit="setting:h1">Plan</th><th data-edit-item="c2" data-edit="setting:h2">Price</th></tr></thead>
      <tbody data-edit-list="rows">
        <tr data-edit-item="r1" data-edit-list="cols"><th data-edit-item="c1" data-edit="setting:a1">Starter</th><td data-edit-item="c2" data-edit="setting:a2">0</td></tr>
        <tr data-edit-item="r2" data-edit-list="cols"><th data-edit-item="c1" data-edit="setting:b1">Team</th><td data-edit-item="c2" data-edit="setting:b2">24</td></tr>
      </tbody></table>`;
    return root;
};

const keys = (root) => [...root.querySelectorAll('tr')].map((tr) => [...tr.children].map((cell) => cell.getAttribute('data-edit').slice('setting:'.length)));

describe('a table keeps its columns in step', () => {
    it('adds a column to every row, the header included, with a key of its own in each', () => {
        const root = table();
        applyContent(root, { cols: '["c1","c2","nc"]' });

        expect(keys(root)).toEqual([['h1', 'h2', 'h2@nc'], ['a1', 'a2', 'a2@nc'], ['b1', 'b2', 'b2@nc']]);
    });

    it('a row added after a column was added has that column too, keyed whichever came first', () => {
        const root = table();
        applyContent(root, { cols: '["c1","c2","nc"]', rows: '["r1","r2","nr"]' });

        expect(keys(root)[3]).toEqual(['b1@nr', 'b2@nr', 'b2@nc@nr']);
        const again = table();
        applyContent(again, { rows: '["r1","r2","nr"]' });
        applyContent(again, { cols: '["c1","c2","nc"]', rows: '["r1","r2","nr"]' });
        expect(keys(again)).toEqual(keys(root));
    });

    it('applied again in the browser over a page already drawn, the keys do not change', () => {
        const root = table();
        const settings = { cols: '["c1","c2","nc","nd"]', rows: '["r1","r2","nr"]' };
        applyContent(root, settings);
        const first = keys(root);
        applyContent(root, settings);
        expect(keys(root)).toEqual(first);
        expect(new Set(first.flat()).size).toBe(first.flat().length);
    });

    it('removes and reorders a column in every row', () => {
        const root = table();
        applyContent(root, { cols: '["c2","c1"]' });
        expect(keys(root)).toEqual([['h2', 'h1'], ['a2', 'a1'], ['b2', 'b1']]);
        applyContent(root, { cols: '["c2"]' });
        expect(keys(root)).toEqual([['h2'], ['a2'], ['b2']]);
    });

    it('a column that names what it copies keeps its keys wherever it is moved', () => {
        const root = table();
        applyContent(root, { cols: '["c1","c2","nk_c2"]' });
        const before = keys(root).map((row) => row[2]);
        const moved = table();
        applyContent(moved, { cols: '["c1","nk_c2","c2"]' });
        expect(keys(moved).map((row) => row[1])).toEqual(before);
        expect(before).toEqual(['h2@nk_c2', 'a2@nk_c2', 'b2@nk_c2']);
    });

    it('a copy of a copy names only itself, as before', () => {
        expect(derivedKey('cards.title@n1', 'n2', 'n1')).toBe('cards.title@n2');
        expect(derivedKey('cards.title', 'nabc', 'one')).toBe('cards.title@nabc');
        expect(derivedKey('cell@nr', 'nc', 'c2')).toBe('cell@nc@nr');
    });

    it('orders lists inside lists first', () => {
        const root = table();
        const order = innermostFirst(root.querySelectorAll('[data-edit-list]')).map((l) => l.getAttribute('data-edit-item') ?? l.tagName);
        expect(order).toEqual(['r1', 'r2', 'TR', 'TBODY']);
    });
});
