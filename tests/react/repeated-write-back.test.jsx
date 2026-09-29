import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readBridge } from '../../packages/react/src/bridge.js';
import { LiveEditProvider } from '../../packages/react/src/provider.js';
import { LiveEditText } from '../../packages/react/src/text.js';
import { contentKeyFor, editMarkerFor } from '../../packages/react/src/keys.js';
import { itemIdentity } from '../../packages/react/src/identity.js';

/**
 * An edit reaching a row, which is the third problem the milestone names and
 * the real architectural difference from every other adapter: the DOM is not
 * the source of truth here, so writing to it changes nothing that survives the
 * next render.
 *
 * These drive the bridge exactly as the editor overlay does - by key, with no
 * knowledge that this page is React at all - because that is the arrangement
 * being tested. If the overlay has to learn anything about lists, the design
 * is wrong.
 */
const LIST = 'list4b49a53d46';

/** What the codemod emits, written by hand so the test pins the contract. */
const Courses = ({ courses }) => (
    <ul data-edit-list={LIST}>
        {courses.map((course) => (
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
];

const wrap = (ui, props = {}) =>
    render(
        <LiveEditProvider
            site="acme"
            apiBase="https://cms.test/api/live-edit/v1"
            publishableKey="kbp_x"
            sessionKey="kbs_editing"
            {...props}
        >
            {ui}
        </LiveEditProvider>
    );

describe('an edit reaching one row of a list', () => {
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

    it('changes the row it was made on and no other', () => {
        wrap(<Courses courses={COURSES} />);

        act(() => {
            readBridge().set('list4b49a53d46.title@101', 'Welding, renamed');
        });

        expect(screen.getByText('Welding, renamed')).toBeTruthy();
        expect(screen.getByText('Joinery')).toBeTruthy();
    });

    it('tells the editor the key was handled by React', () => {
        /*
         * The return value is not decoration. An element inside a server
         * component carries the same marker and no hook, so setting state for
         * it changes nothing - and the editor has to know, or it reports a
         * save while the old words stay on screen.
         *
         * A list field reads through LiveEditText, which registers like any
         * other hook, so the answer has to be yes.
         */
        wrap(<Courses courses={COURSES} />);

        let bound = null;

        act(() => {
            bound = readBridge().set('list4b49a53d46.title@101', 'Renamed');
        });

        expect(bound).toBe(true);
    });

    it('says no for a row that is not on the page', () => {
        // The same answer a server-rendered element gets, and for the same
        // reason: nothing here is listening for that key, so the editor must
        // fetch the page again rather than believe the edit landed.
        wrap(<Courses courses={COURSES} />);

        let bound = null;

        act(() => {
            bound = readBridge().set('list4b49a53d46.title@999', 'Nobody');
        });

        expect(bound).toBe(false);
    });

    it('needs no knowledge of lists in the overlay at all', () => {
        // The bridge is given a flat string key and nothing else. Composing
        // the whole key in the attribute is what buys this: one editor,
        // every adapter, and lists that need no special case in it.
        wrap(<Courses courses={COURSES} />);

        const bridge = readBridge();

        expect(Object.keys(bridge).sort()).toEqual(['apply', 'editable', 'get', 'refresh', 'set']);
        expect(bridge.get('list4b49a53d46.title@101')).toBeUndefined();
    });
});

describe('after a client-side navigation', () => {
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

    it('keeps an edit on its own row when the list comes back reordered', () => {
        /*
         * The step the scope says will be skipped and is most likely to fail.
         *
         * A navigation re-mounts the component and re-runs the `.map()`, so
         * every identity is derived again from nothing. An identity taken from
         * position - or from the React key, which is routinely the index -
         * would hand this edit to whichever row happens to be second now.
         *
         * Reordering rather than merely re-rendering is what makes the test
         * mean something: a re-render with unchanged data cannot tell a good
         * identity from a bad one.
         */
        const { unmount } = wrap(<Courses courses={COURSES} />);

        act(() => {
            readBridge().set('list4b49a53d46.title@102', 'Joinery, renamed');
        });

        expect(screen.getByText('Joinery, renamed')).toBeTruthy();

        // Away, and back to the same page with the rows in a different order
        // and a new one among them.
        unmount();

        wrap(
            <Courses courses={[
                { id: 103, title: 'Bricklaying' },
                { id: 102, title: 'Joinery' },
                { id: 101, title: 'Welding' },
            ]} />,
            { content: { 'list4b49a53d46.title@102': 'Joinery, renamed' } }
        );

        expect(screen.getByText('Joinery, renamed')).toBeTruthy();
        expect(screen.getByText('Welding')).toBeTruthy();
        expect(screen.getByText('Bricklaying')).toBeTruthy();
        // Nothing inherited the edit by standing where 102 used to stand.
        expect(screen.queryByText('Bricklaying, renamed')).toBeNull();
    });

    it('marks the rows again itself, because React writes the attributes', () => {
        /*
         * Problem 2, and smaller than the scope feared. The codemod writes the
         * markers into the JSX, so React emits them on every render - a
         * re-mount brings them back with everything else, and the provider
         * needs no mechanism to restore them.
         *
         * Worth a test rather than an assumption: it is the kind of thing that
         * is true until somebody moves the attribute out of the component.
         */
        const { unmount } = wrap(<Courses courses={COURSES} />);

        unmount();

        const { container } = wrap(<Courses courses={COURSES} />);

        expect(container.querySelector(`[data-edit-list="${LIST}"]`)).toBeTruthy();
        expect(container.querySelectorAll('[data-edit-item]')).toHaveLength(2);
        expect(container.querySelector('[data-edit-item="101"]')).toBeTruthy();
    });
});
