import { describe, expect, it } from 'vitest';
import { itemIdentity, listIdentity } from '../../packages/react/src/identity.js';

/**
 * Which item in a list an edit belongs to.
 *
 * The whole repeated-content milestone rests on this: content is stored
 * against an item's identity, so an identity that moves takes somebody's edits
 * with it, onto the wrong card, with nothing erroring.
 *
 * These are written as the ways real data goes wrong rather than as a tour of
 * the function, because every one of them is a way a client's words end up
 * under a photograph of something else.
 */
describe('the identity of an item in a list', () => {
    it('takes a primary key where the data has one', () => {
        expect(itemIdentity({ id: 101, title: 'Welding' })).toBe('101');
        expect(itemIdentity({ uuid: 'c8f1-22', title: 'Welding' })).toBe('c8f1-22');
    });

    it('prefers the least editable id when there is more than one', () => {
        // A slug is stable in practice and editable in principle: a CMS that
        // lets somebody rewrite one would move the identity. A primary key
        // cannot be rewritten by anybody.
        expect(itemIdentity({ slug: 'welding', id: 101 })).toBe('101');
    });

    it('refuses a value that is not an identity even when the field name fits', () => {
        // "id" holding an object is somebody's field that happens to share a
        // name. Used anyway it stringifies to "[object Object]" for every row:
        // one identity, shared by the whole list, which is the exact failure
        // this exists to prevent.
        expect(itemIdentity({ id: { value: 1 } })).toBeNull();
        expect(itemIdentity({ id: [1] })).toBeNull();
        expect(itemIdentity({ id: true })).toBeNull();
        expect(itemIdentity({ id: '   ' })).toBeNull();
        expect(itemIdentity({ id: Number.NaN })).toBeNull();
    });

    it('gives a list of plain strings no identity at all', () => {
        /*
         * Tempting, because the string is usually unique. Wrong, because the
         * string is the very thing the client is about to edit: the first
         * edit changes the identity and orphans itself from the row that
         * caused it. An identity derived from content is not an identity.
         */
        expect(itemIdentity('Welding')).toBeNull();
        expect(itemIdentity(42)).toBeNull();
        expect(itemIdentity(null)).toBeNull();
    });

    it('never uses a position', () => {
        // The React key is routinely the array index, which is why the scope
        // rules it out. Nothing here may reintroduce it: two identical rows
        // must be indistinguishable rather than quietly numbered.
        expect(itemIdentity({ title: 'Welding' })).toBe(itemIdentity({ title: 'Welding' }));
        expect(itemIdentity({ title: 'Welding' })).toBeNull();
    });
});

describe('whether a whole list can carry edits', () => {
    it('accepts a list where every item has an id', () => {
        const result = listIdentity([{ id: 1 }, { id: 2 }, { id: 3 }]);

        expect(result.editable).toBe(true);
        expect(result.identities).toEqual(['1', '2', '3']);
    });

    it('refuses a list where only some items have one', () => {
        // Not two thirds editable. A list with holes in its identities is one
        // whose identities collide the moment the data changes.
        const result = listIdentity([{ id: 1 }, { title: 'No id' }, { id: 3 }]);

        expect(result.editable).toBe(false);
        expect(result.reason).toContain('1 of 3');
    });

    it('refuses a list where two items share an id', () => {
        // The likelier fault in real data: a join that repeats a row, or an
        // "id" that is really a type. One edit appearing in two places reads
        // as the editor being broken.
        const result = listIdentity([{ id: 7 }, { id: 7 }]);

        expect(result.editable).toBe(false);
        expect(result.reason).toContain('share an id');
    });

    it('says why, in words that could be shown to whoever installed it', () => {
        // The scope asks for a fallback the customer can see rather than an
        // unstable identity invented quietly. A reason nobody can read is the
        // quiet version with extra steps.
        const reason = listIdentity([{ title: 'a' }, { title: 'b' }]).reason;

        expect(reason).toMatch(/no item in this list has an id/);
        expect(reason).not.toMatch(/null|undefined|Error/);
    });

    it('treats an empty list as fine rather than broken', () => {
        expect(listIdentity([]).editable).toBe(true);
        expect(listIdentity([]).reason).toBeNull();
    });
});
