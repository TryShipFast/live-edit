import { describe, expect, it } from 'vitest';
import { transform } from '../../packages/react/src/codemod.js';

/**
 * Making a `.map()` editable.
 *
 * The codemod is the only tool that can see a list at all: in a rendered
 * document a repeated item is just more markup, and here it is one element in
 * the source that becomes many on screen.
 *
 * Half of these are refusals. The scope names the plausible wrong turn -
 * relaxing the single-text-child rule to reach the words inside a card - and
 * a rule is only as good as the cases it still says no to.
 */
const client = (body) => `'use client';\n\nexport default function C({ courses }) {\n    return (\n${body}\n    );\n}\n`;

const list = `        <ul>
            {courses.map((course) => (
                <li key={course.id}>
                    <h3>{course.title}</h3>
                </li>
            ))}
        </ul>`;

describe('a list rendered from data', () => {
    it('marks the collection, the item and its fields', () => {
        const { code } = transform(client(list), { relativePath: 'C.jsx' });

        expect(code).toMatch(/<ul data-edit-list="list[a-f0-9]+"/);
        expect(code).toContain('<li data-edit-item={itemIdentity(course)}');
        expect(code).toContain('data-edit={editMarkerFor(');
    });

    it('takes the item identity from the data and never from the React key', () => {
        /*
         * The single most damaging thing this could get wrong. A React key is
         * routinely the array index and is never promised to survive a
         * refetch, so content kept against one lands on the wrong row as soon
         * as the data reorders - silently.
         *
         * The key prop is right there in the source and must be ignored.
         */
        const { code } = transform(client(list), { relativePath: 'C.jsx' });

        expect(code).toContain('data-edit-item={itemIdentity(course)}');
        expect(code).not.toContain('data-edit-item={course.id}');
        expect(code).not.toMatch(/data-edit-item=\{index\}|data-edit-item=\{i\}/);
    });

    it('reads a field through a component rather than a hook call', () => {
        // React matches hook calls to slots by the order they happen, so one
        // call per row breaks every later hook the moment the list changes
        // length. Each row here is its own component instance.
        const { code } = transform(client(list), { relativePath: 'C.jsx' });

        expect(code).toContain('<LiveEditText contentKey={contentKeyFor(');
        expect(code).not.toMatch(/courses\.map[\s\S]*useContent\(/);
    });

    it('keeps the developer words as the fallback', () => {
        // The same property the hook has: a list with no content still
        // renders the component's own copy, so installing this cannot leave a
        // page of empty cards.
        const { code } = transform(client(list), { relativePath: 'C.jsx' });

        expect(code).toContain('fallback={course.title}');
    });

    it('makes words written into the card editable per row', () => {
        /*
         * A badge in a card is the same three letters in the source and a
         * different element on screen for every row. Left untagged, a card has
         * its title editable and the word beside it not, which is the
         * half-finished feeling the milestone exists to remove.
         *
         * Keyed per item because a client is looking at one card: editing the
         * badge on the third course and watching all nine change is not a
         * saving anybody asked for.
         */
        const withBadge = `        <ul>
            {courses.map((course) => (
                <li key={course.id}>
                    <span>Free</span>
                </li>
            ))}
        </ul>`;

        const { code } = transform(client(withBadge), { relativePath: 'C.jsx' });

        expect(code).toContain('fallback="Free"');
        expect(code).toContain('contentKeyFor(');
        // Through the item, so the third card's badge is its own.
        expect(code).toMatch(/contentKeyFor\("list[a-f0-9]+", "said[a-f0-9]+", course\)/);
    });

    it('writes one import holding everything the file now uses', () => {
        const mixed = `        <div>
            <h1>Our courses</h1>
${list}
        </div>`;

        const { code } = transform(client(mixed), { relativePath: 'C.jsx' });
        const imports = code.match(/^import .*live-edit-react.*$/gm) ?? [];

        expect(imports).toHaveLength(1);
        expect(imports[0]).toContain('useContent');
        expect(imports[0]).toContain('LiveEditText');
        expect(imports[0]).toContain('itemIdentity');
    });

    it('leaves an already tagged list alone on a second run', () => {
        const once = transform(client(list), { relativePath: 'C.jsx' });
        const twice = transform(once.code, { relativePath: 'C.jsx' });

        expect(twice.code).toBe(once.code);
        expect(twice.already).toBeGreaterThan(0);
    });
});

describe('what it still refuses', () => {
    it('does not relax the single-text-child rule outside a list', () => {
        /*
         * The load-bearing rule, and the plausible wrong turn. A sentence
         * built from data is the host's, and a key attached to it means
         * something different on every render. The list work adds a rule
         * beside this one; it must not have loosened it.
         */
        const source = client('        <p>Hello {user.name}, welcome back</p>');
        const { code, changes } = transform(source, { relativePath: 'C.jsx' });

        expect(changes).toHaveLength(0);
        expect(code).toBe(source);
    });

    it('leaves a lone expression outside a list alone', () => {
        // Same rule from the other side: `{title}` on its own is still the
        // host's data when there is no item to key it against.
        const source = client('        <h1>{page.title}</h1>');

        expect(transform(source, { relativePath: 'C.jsx' }).changes).toHaveLength(0);
    });

    it('leaves a destructured callback parameter alone', () => {
        // The parameter name is what every key inside the item is written
        // against, and a destructured one gives the fields but no way to refer
        // to the item as a whole - which is what identity comes from.
        const source = client(`        <ul>
            {courses.map(({ id, title }) => (
                <li key={id}>
                    <h3>{title}</h3>
                </li>
            ))}
        </ul>`);

        expect(transform(source, { relativePath: 'C.jsx' }).code).toBe(source);
    });

    it('leaves a map that renders a component alone', () => {
        // Its children are props, not DOM. Whatever that component renders is
        // tagged where it is written, not here.
        const source = client(`        <ul>
            {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
            ))}
        </ul>`);

        expect(transform(source, { relativePath: 'C.jsx' }).code).toBe(source);
    });

    it('leaves a nested property alone', () => {
        // The field name is what the key is built from, and a nested path
        // invites two different fields to flatten into one name.
        const source = client(`        <ul>
            {courses.map((course) => (
                <li key={course.id}>
                    <h3>{course.meta.title}</h3>
                </li>
            ))}
        </ul>`);

        expect(transform(source, { relativePath: 'C.jsx' }).code).not.toContain('LiveEditText');
    });

    it('does not mark a list with nothing editable inside it', () => {
        /*
         * Scaffolding nothing reads. `data-edit-list` and `data-edit-item`
         * exist to hang fields off, so a list whose item has no editable field
         * is a marked-up collection the editor can offer nothing for.
         *
         * The same lesson as the mapper writing regions nobody read, learned
         * from the other end: the time to not write an attribute is before
         * anybody builds a habit of seeing it.
         */
        const source = client(`        <ul>
            {courses.map((course) => (
                <li key={course.id}>
                    <h3>{course.meta.title}</h3>
                </li>
            ))}
        </ul>`);

        expect(transform(source, { relativePath: 'C.jsx' }).code).toBe(source);
    });

    it('writes no list markers into a server component', () => {
        /*
         * A server component renders once on the server with no React on the
         * client to re-render it, so an edit could not reach the page it is
         * standing on. A list whose rows cannot change is worse than one never
         * offered, because the controls appear and do nothing.
         */
        const source = `export default function C({ courses }) {\n    return (\n${list}\n    );\n}\n`;
        const { code, mode } = transform(source, { relativePath: 'C.jsx' });

        expect(mode).toBe('server');
        expect(code).not.toContain('data-edit-list');
        expect(code).not.toContain('LiveEditText');
    });
});
