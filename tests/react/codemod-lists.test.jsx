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

    it('passes the array through the adapter on its way to map', () => {
        // Every other adapter reorders markup. Here the rows are a projection
        // of an array, so anything done to the DOM is undone by the next
        // render: the array itself has to pass through. A hook, called once
        // per component rather than once per row.
        const { code } = transform(client(list), { relativePath: 'C.jsx' });

        expect(code).toMatch(/\{useLiveEditList\("list[a-f0-9]+", courses\)\.map\(/);
    });

    it('keeps the list key when it runs over its own output', () => {
        /*
         * The sharpest regression risk in the whole file. On a second run the
         * thing being mapped is `useLiveEditList("list…", courses)` rather
         * than `courses`, and hashing that would mint a different key and
         * orphan every edit saved against the first - on an upgrade, to a site
         * that was working.
         */
        const once = transform(client(list), { relativePath: 'C.jsx' });
        const twice = transform(once.code, { relativePath: 'C.jsx' });

        const keyOf = (code) => (code.match(/data-edit-list="(list[a-f0-9]+)"/) ?? [])[1];

        expect(keyOf(twice.code)).toBe(keyOf(once.code));
        // Wrapped once, not once per run: the second pass must recognise its
        // own work rather than nest another call inside it.
        expect(twice.code).not.toMatch(/useLiveEditList\([^)]*useLiveEditList/);
        expect(twice.code.match(/useLiveEditList\(/g)).toHaveLength(1);
        expect(twice.code).toBe(once.code);
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

    it('tags an element whose whole content is one value', () => {
        /*
         * Changed deliberately on 2026-09-29, and measured before it was
         * changed: on the Next.js blog starter every card's words arrive as a
         * prop, so refusing this meant the milestone covered an example and
         * not a page.
         *
         * The old reason stays intact where it belongs. A sentence BUILT from
         * data is still refused, because a key on that means something
         * different every render and half the sentence is the host's. One
         * value alone is a value being read, and the key is the element's.
         */
        const { code, changes } = transform(client('        <h1>{page.title}</h1>'), { relativePath: 'C.jsx' });

        expect(changes).toHaveLength(1);
        expect(code).toContain('{useContent("auto:');
        expect(code).toContain('page.title)}');
    });

    it('never tags children, which is a subtree and not a value', () => {
        /*
         * Destructive if it gets through, and it did. `children` is React's
         * name for a subtree, so `<div>{children}</div>` is a layout wrapper
         * and `<h1>{children}</h1>` is a slot somebody else fills. Marked
         * editable, the whole of what they hold becomes a string the moment
         * anything is stored against that key.
         *
         * Caught by running the codemod over the Next.js blog starter, where
         * it tagged the layout's own <div className="min-h-screen">
         * {children}</div> - the page body itself. Every test for the
         * one-value rule used {title}, and {children} looks identical to a
         * parser.
         */
        expect(transform(client('        <div>{children}</div>'), { relativePath: 'C.jsx' }).changes).toHaveLength(0);
        expect(transform(client('        <h1>{children}</h1>'), { relativePath: 'C.jsx' }).changes).toHaveLength(0);
        expect(transform(client('        <div>{props.children}</div>'), { relativePath: 'C.jsx' }).changes).toHaveLength(0);
    });

    it('still refuses a value that is computed rather than read', () => {
        // A call, a ternary or a template is the host's logic. Putting a key
        // on the answer and then writing over the question is not editing.
        for (const body of ['<h1>{format(page.title)}</h1>', '<h1>{a ? b : c}</h1>', '<h1>{`a ${b}`}</h1>', '<h1>{a.b.c}</h1>']) {
            expect(transform(client(`        ${body}`), { relativePath: 'C.jsx' }).changes).toHaveLength(0);
        }
    });

    it('leaves everything inside a repeated region it cannot key', () => {
        /*
         * A destructured parameter gives the fields but not the item, and the
         * item is what identity comes from - so the list is refused. The
         * elements inside it have to be refused too, and that does not happen
         * by itself: they are ordinary JSX and the rules outside would tag
         * them happily, with ONE key for every row.
         *
         * Which is the whole fault. Editing the first card would change every
         * card, silently. A test caught this the moment one-value elements
         * became taggable - before that the refusal was accidental rather
         * than intended, which is not the same thing and does not survive the
         * next change.
         */
        const source = client(`        <ul>
            {courses.map(({ id, title }) => (
                <li key={id}>
                    <h3>{title}</h3>
                    <span>Free</span>
                </li>
            ))}
        </ul>`);

        expect(transform(source, { relativePath: 'C.jsx' }).code).toBe(source);
    });

    it('wraps a component row rather than tagging it', () => {
        /*
         * The shape every real app uses: the list in one file, the card in
         * another. Its fields cannot be tagged from here - they are props -
         * so the row is wrapped and the identity travels in context to
         * whatever renders inside it.
         *
         * Measured on the Next.js blog starter, where refusing this meant the
         * list work found nothing at all.
         */
        const source = client(`        <ul>
            {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
            ))}
        </ul>`);

        const { code } = transform(source, { relativePath: 'C.jsx' });

        expect(code).toContain('<LiveEditItem id={itemIdentity(course)}>');
        expect(code).toContain('</LiveEditItem>');
        expect(code).toMatch(/data-edit-list="list[a-f0-9]+"/);
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

    it('keys the rows of a server list, but does not offer to rearrange it', () => {
        /*
         * This asserted that a server list got nothing at all, and half of
         * that was wrong. The reasoning was sound for rearranging and not for
         * the words: adding, removing and reordering go through
         * `useLiveEditList`, which is a hook and cannot run here, but giving
         * each row its own keys is `itemIdentity` and `contentKeyFor`, which
         * are plain function calls and work anywhere.
         *
         * Leaving both out meant three cards built from one piece of markup
         * could not be given three different sets of words on the shape of
         * page where that is most of the content. So the rows are keyed and
         * the list marker is still withheld - a control that does nothing is
         * worse than an absent one, because only one of the two is a lie.
         */
        const source = `export default function C({ courses }) {\n    return (\n${list}\n    );\n}\n`;
        const { code, mode } = transform(source, { relativePath: 'C.jsx' });

        expect(mode).toBe('server');

        // Each row its own, from its own data.
        expect(code).toContain('data-edit-item={itemIdentity(course)}');
        expect(code).toContain('<LiveEditText contentKey={contentKeyFor(');
        expect(code).toContain("from '@shipfasts/live-edit-react/server'");

        // Nothing that needs React in the browser.
        expect(code).not.toContain('data-edit-list');
        expect(code).not.toContain('useLiveEditList');
        expect(code).not.toContain("'use client'");
    });
});
