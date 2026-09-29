import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveEditProvider } from '../../packages/react/src/provider.js';
import { LiveEditItem } from '../../packages/react/src/item.js';
import { useContent } from '../../packages/react/src/useContent.js';
import { useLiveEditList } from '../../packages/react/src/list.js';
import { itemIdentity } from '../../packages/react/src/identity.js';

/**
 * A list in one file and its card in another, which is how React is written.
 *
 * Modelled on kb-next-real, the Next.js blog starter: `more-stories.tsx` maps
 * over posts and renders `<PostPreview>`, and the words live in
 * `post-preview.tsx` as props. Measured there first - before this, the list
 * work found nothing at all on that app.
 *
 * Nothing here passes an identity as a prop, because nothing can: no tool
 * reading the card's file knows it will ever be inside a list.
 */
const LIST = 'list1dd61803db';
const TITLE = 'auto:card-title';

// post-preview.tsx — knows nothing about lists.
const PostPreview = ({ title }) => <h3>{useContent(TITLE, title)}</h3>;

// more-stories.tsx — what the codemod emits.
const MoreStories = ({ posts }) => (
    <div data-edit-list={LIST}>
        {useLiveEditList(LIST, posts).map((post) => (
            <LiveEditItem id={itemIdentity(post)} key={post.slug}>
                <PostPreview title={post.title} />
            </LiveEditItem>
        ))}
    </div>
);

const POSTS = [
    { slug: 'hello-world', title: 'Hello World' },
    { slug: 'dynamic-routing', title: 'Dynamic Routing' },
];

const wrap = (ui, content = {}) =>
    render(
        <LiveEditProvider site="acme" apiBase="https://cms.test/api/live-edit/v1"
            publishableKey="kbp_x" sessionKey="kbs_editing" content={content}>
            {ui}
        </LiveEditProvider>
    );

describe('a card in another file', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ settings: {}, styles: {} }),
        }));
    });

    afterEach(() => { cleanup(); vi.restoreAllMocks(); });

    it('edits one row without touching the other, though they share a component', () => {
        // One component, written once, rendered twice. Without the identity
        // from context both cards would read one key and editing either would
        // change both.
        const { container } = wrap(<MoreStories posts={POSTS} />, {
            [`${TITLE}@hello-world`]: 'Hello World, edited',
        });

        expect([...container.querySelectorAll('h3')].map((h) => h.textContent))
            .toEqual(['Hello World, edited', 'Dynamic Routing']);
    });

    it('leaves the same component ordinary when it is used on its own', () => {
        // The card on its own page has no row around it, so it composes
        // nothing and behaves as it always has. One component, two correct
        // behaviours, decided where it is rendered rather than where it is
        // written.
        wrap(<PostPreview title="A single post" />, { [TITLE]: 'Edited on its own page' });

        expect(screen.getByText('Edited on its own page')).toBeTruthy();
    });

    it('keeps the developer words when nothing is stored', () => {
        const { container } = wrap(<MoreStories posts={POSTS} />);

        expect([...container.querySelectorAll('h3')].map((h) => h.textContent))
            .toEqual(['Hello World', 'Dynamic Routing']);
    });

    it('renders no element of its own around the row', () => {
        // A wrapper between a grid and its children breaks the layout of every
        // site that installs this. A content tool may not move a design.
        const { container } = wrap(<MoreStories posts={POSTS} />);
        const grid = container.querySelector(`[data-edit-list="${LIST}"]`);

        expect([...grid.children].map((c) => c.tagName)).toEqual(['H3', 'H3']);
    });

    it('still reorders and copies rows across the boundary', () => {
        const { container } = wrap(<MoreStories posts={POSTS} />, {
            [LIST]: JSON.stringify(['dynamic-routing', 'hello-world', 'n1a2b3']),
        });

        expect([...container.querySelectorAll('h3')].map((h) => h.textContent))
            .toEqual(['Dynamic Routing', 'Hello World', 'Hello World']);
    });
});
