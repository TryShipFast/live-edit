import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveEditProvider } from '../../packages/react/src/provider.js';
import { LiveEditText } from '../../packages/react/src/text.js';
import { useLiveEditList } from '../../packages/react/src/list.js';
import { contentKeyFor, editMarkerFor } from '../../packages/react/src/keys.js';
import { itemIdentity } from '../../packages/react/src/identity.js';

/**
 * Reordering, adding and removing rows of a list.
 *
 * Every other adapter does this by rearranging markup. Here the rows are a
 * projection of an array, so anything done to the DOM is undone by the next
 * render - the array itself has to pass through the adapter on its way to
 * `.map()`.
 *
 * The rule that a new row copies the one it was added from is not chosen here.
 * It was settled for every adapter on 2026-09-29 and React inherits it.
 */
const LIST = 'list4b49a53d46';

/** Exactly what the codemod emits. */
const Courses = ({ courses }) => (
    <ul data-edit-list={LIST}>
        {useLiveEditList(LIST, courses).map((course) => (
            <li data-edit-item={itemIdentity(course)} key={course.id}>
                <h3 data-edit={editMarkerFor(LIST, 'title', course)}>
                    <LiveEditText contentKey={contentKeyFor(LIST, 'title', course)} fallback={course.title} />
                </h3>
            </li>
        ))}
    </ul>
);

const COURSES = [
    { id: 101, title: 'Welding' },
    { id: 102, title: 'Joinery' },
    { id: 103, title: 'Bricklaying' },
];

const wrap = (content = {}) =>
    render(
        <LiveEditProvider
            site="acme"
            apiBase="https://cms.test/api/live-edit/v1"
            publishableKey="kbp_x"
            sessionKey="kbs_editing"
            content={content}
        >
            <Courses courses={COURSES} />
        </LiveEditProvider>
    );

const titles = (container) => [...container.querySelectorAll('h3')].map((h) => h.textContent);
const identities = (container) =>
    [...container.querySelectorAll('[data-edit-item]')].map((li) => li.getAttribute('data-edit-item'));

describe('the order a client put the rows in', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ settings: {}, styles: {} }),
            })
        );
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('renders the developer array untouched when nobody has reordered it', () => {
        // The property that matters most: a list nobody has touched renders
        // exactly as it was written, and an app with no content at all still
        // shows the developer's own data.
        const { container } = wrap();

        expect(titles(container)).toEqual(['Welding', 'Joinery', 'Bricklaying']);
    });

    it('puts the rows in the stored order', () => {
        const { container } = wrap({ [LIST]: JSON.stringify([103, 101, 102]) });

        expect(titles(container)).toEqual(['Bricklaying', 'Welding', 'Joinery']);
    });

    it('drops a row the client removed', () => {
        const { container } = wrap({ [LIST]: JSON.stringify([101, 103]) });

        expect(titles(container)).toEqual(['Welding', 'Bricklaying']);
    });

    it('adds a row as a copy of the one it was added from', () => {
        /*
         * A client pressing "add" on a catalogue has not created a course in
         * the host's database, and this adapter has no business inventing one.
         * So the new row is a copy of the row it was added from, carrying its
         * own identity, and its words are whatever the client writes next.
         *
         * The order is the record of provenance as well as of sequence: the
         * editor inserts the new id immediately after the row whose button was
         * pressed, so no extra protocol is needed to say where it came from.
         */
        const { container } = wrap({ [LIST]: JSON.stringify([101, 'n1a2b3', 102, 103]) });

        expect(titles(container)).toEqual(['Welding', 'Welding', 'Joinery', 'Bricklaying']);
        expect(identities(container)).toEqual(['101', 'n1a2b3', '102', '103']);
    });

    it('gives an added row its own words as soon as they are written', () => {
        // The copy is a starting point, not a permanent echo. Its identity is
        // its own, so content saved against it belongs to it alone.
        const { container } = wrap({
            [LIST]: JSON.stringify([101, 'n1a2b3']),
            [`${LIST}.title@n1a2b3`]: 'Welding, evenings',
        });

        expect(titles(container)).toEqual(['Welding', 'Welding, evenings']);
    });

    it('carries the new identity in the field the original used', () => {
        // An item keyed on uuid must not come back with an id as well. Two
        // identities on one row makes which-one-wins a question about the
        // order of fields in a source file.
        const Uuids = () => (
            <ul>
                {useLiveEditList(LIST, [{ uuid: 'aaa', title: 'First' }]).map((row) => (
                    <li key={row.uuid} data-edit-item={itemIdentity(row)} data-has-id={String('id' in row)}>
                        {row.title}
                    </li>
                ))}
            </ul>
        );

        const { container } = render(
            <LiveEditProvider site="acme" apiBase="https://cms.test/api/live-edit/v1" publishableKey="kbp_x"
                content={{ [LIST]: JSON.stringify(['aaa', 'bbb']) }}>
                <Uuids />
            </LiveEditProvider>
        );

        expect(identities(container)).toEqual(['aaa', 'bbb']);
        expect([...container.querySelectorAll('[data-has-id]')].map((li) => li.dataset.hasId))
            .toEqual(['false', 'false']);
    });

    it('walks back past another added row to find something real to copy', () => {
        // Two added in a row leaves an id with nothing behind it either.
        // Copying the wrong row is bad; copying nothing is worse.
        const { container } = wrap({ [LIST]: JSON.stringify([102, 'n1', 'n2']) });

        expect(titles(container)).toEqual(['Joinery', 'Joinery', 'Joinery']);
    });
});

describe('what it refuses to rearrange', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ settings: {}, styles: {} }),
            })
        );
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('leaves the whole list alone when a row has no identity', () => {
        // All or nothing, the same rule listIdentity() applies. A row that
        // cannot be placed by the order cannot be told from its neighbours,
        // and a partly rearranged list is worse than an unchanged one.
        const Mixed = () => (
            <ul>
                {useLiveEditList(LIST, [{ id: 1, title: 'Has one' }, { title: 'Has none' }]).map((row, at) => (
                    <li key={at}>
                        <h3>{row.title}</h3>
                    </li>
                ))}
            </ul>
        );

        const { container } = render(
            <LiveEditProvider site="acme" apiBase="https://cms.test/api/live-edit/v1" publishableKey="kbp_x"
                content={{ [LIST]: JSON.stringify([1]) }}>
                <Mixed />
            </LiveEditProvider>
        );

        expect(titles(container)).toEqual(['Has one', 'Has none']);
    });

    it('treats an unreadable order as no order rather than an empty one', () => {
        /*
         * The difference is a client's whole catalogue. An empty order renders
         * a list with no rows in it, so a corrupted value read as "empty"
         * would blank the page rather than leave it alone.
         */
        for (const broken of ['', 'not json', '{"not":"an array"}', 'null']) {
            cleanup();
            const { container } = wrap({ [LIST]: broken });

            expect(titles(container)).toEqual(['Welding', 'Joinery', 'Bricklaying']);
        }
    });

    it('works with no provider at all', () => {
        // Removing this package from an app must leave working code behind,
        // which is the same promise the hook already makes for words.
        const Bare = () => (
            <ul>
                {useLiveEditList(LIST, COURSES).map((course) => (
                    <li key={course.id}><h3>{course.title}</h3></li>
                ))}
            </ul>
        );

        const { container } = render(<Bare />);

        expect(titles(container)).toEqual(['Welding', 'Joinery', 'Bricklaying']);
    });
});
