import { cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveEditProvider } from '../../packages/react/src/provider.js';
import { LiveEditText } from '../../packages/react/src/text.js';

/**
 * Editable words inside a `.map()`.
 *
 * The codemod rewrites ordinary words to an inline `useContent(...)` call,
 * which is correct for one element rendered once. It cannot be the shape
 * inside a list: React matches hook calls to slots by the order they happen,
 * so one call per row means a list that gains or loses a row shifts every hook
 * after it onto the wrong slot.
 *
 * These drive a real render with a real provider and then change the length of
 * the list, because that is the moment the wrong design breaks and no
 * single-render test would notice.
 */
const wrap = (ui) =>
    render(
        <LiveEditProvider site="acme" apiBase="https://cms.test/api/live-edit/v1" publishableKey="kbp_x" content={{
            'courses.title@101': 'Welding, renamed',
        }}>
            {ui}
        </LiveEditProvider>
    );

const List = ({ items }) => (
    <ul>
        {items.map((item) => (
            <li key={item.id}>
                <LiveEditText contentKey={`courses.title@${item.id}`} fallback={item.title} />
            </li>
        ))}
    </ul>
);

describe('words inside a repeated item', () => {
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

    it('shows the edited words for the row they belong to, and only that row', () => {
        wrap(<List items={[{ id: 101, title: 'Welding' }, { id: 102, title: 'Joinery' }]} />);

        expect(screen.getByText('Welding, renamed')).toBeTruthy();
        expect(screen.getByText('Joinery')).toBeTruthy();
        // The row that was not edited keeps its own words rather than the
        // edited row's, which is the failure an identity that moves produces.
        expect(screen.queryByText('Welding')).toBeNull();
    });

    it('falls back to the words already in the component', () => {
        // The same property the hook has, and it matters as much here: a list
        // with no content at all still renders the developer's own copy, so
        // installing this cannot leave a page of empty cards.
        wrap(<List items={[{ id: 999, title: 'Untouched' }]} />);

        expect(screen.getByText('Untouched')).toBeTruthy();
    });

    it('survives the list changing length', () => {
        /*
         * The reason this is a component and not a hook call. With
         * `items.map(item => useContent(...))` the hook count varies with the
         * data, and React's positional slots put every later hook on the wrong
         * one - silently, and arbitrarily.
         *
         * Rendering a shorter list and then a longer one is the cheapest way
         * to prove the arrangement is sound; each row is its own component
         * instance with its own slots.
         */
        const { rerender } = wrap(<List items={[{ id: 101, title: 'Welding' }]} />);

        expect(screen.getByText('Welding, renamed')).toBeTruthy();

        rerender(
            <LiveEditProvider site="acme" apiBase="https://cms.test/api/live-edit/v1" publishableKey="kbp_x" content={{
                'courses.title@101': 'Welding, renamed',
            }}>
                <List items={[
                    { id: 100, title: 'Bricklaying' },
                    { id: 101, title: 'Welding' },
                    { id: 102, title: 'Joinery' },
                ]} />
            </LiveEditProvider>
        );

        // The edit is still on 101 after two rows appeared around it, one of
        // them before it. A position-based identity would have moved it.
        expect(screen.getByText('Welding, renamed')).toBeTruthy();
        expect(screen.getByText('Bricklaying')).toBeTruthy();
        expect(screen.getByText('Joinery')).toBeTruthy();
    });

    it('renders no element of its own', () => {
        // A wrapper here would change the CSS of every list item on every site
        // using it, which is not a thing a content tool may do.
        const { container } = wrap(<List items={[{ id: 101, title: 'Welding' }]} />);

        expect(container.querySelector('li').children.length).toBe(0);
        expect(container.querySelector('li').textContent).toBe('Welding, renamed');
    });
});
