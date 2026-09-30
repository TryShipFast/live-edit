import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureLiveEdit, editMarkerIn, LiveEditText } from '../../packages/react/src/server.js';
import { transform } from '../../packages/react/src/codemod.js';

/**
 * A list in one file and its card in another, both rendered on the server.
 *
 * The ordinary shape of an App Router page, and the one shape the list work
 * left behind. Modelled on kb-next-real: `more-stories.tsx` maps over posts
 * and renders `<PostPreview>`, whose words live in `post-preview.tsx` as
 * props.
 *
 * On the client this is solved and needs neither file to know about the other:
 * the row's identity travels in React context, put there by `LiveEditItem`.
 * There is no context in a server component, so the identity has to be handed
 * over as a prop, which means editing the call site and the card's own
 * parameter list in step. The fault that makes it worth doing was measured on
 * a real Next app: three different authors' names carried one key, so renaming
 * one would have renamed all three in a customer's content, silently.
 */

const LIST = `import PostPreview from './post-preview';

export default function MoreStories({ posts }) {
    return (
        <div>
            {posts.map((post) => (
                <PostPreview key={post.slug} title={post.title} />
            ))}
        </div>
    );
}
`;

const CARD = `type Props = { title: string };

export default function PostPreview({ title }: Props) {
    return (
        <article>
            <h3>{title}</h3>
            <span>Read more</span>
        </article>
    );
}
`;

const listFile = (over = {}) =>
    transform(LIST, { relativePath: 'app/more-stories.tsx', serverRows: ['PostPreview'], ...over });

const cardFile = (over = {}) =>
    transform(CARD, { relativePath: 'app/post-preview.tsx', repeated: true, rowCards: ['PostPreview'], ...over });

describe('the codemod wiring both files', () => {
    it('hands the row identity over at the call site', () => {
        // itemIdentity, never the React key. A key is routinely the array
        // index and is not promised to survive a refetch, so content kept
        // against one lands on the wrong card the moment the data reorders.
        expect(listFile().code).toContain('<PostPreview liveEditRow={itemIdentity(post)}');
        expect(listFile().deferred).toEqual([]);
    });

    it('takes the identity in the card, and composes it onto every per-row key', () => {
        const { code } = cardFile();

        expect(code).toContain('liveEditRow');
        expect(code).toMatch(/data-edit=\{editMarkerIn\(liveEditRow, "auto:[0-9a-f]+"\)\}/);
        expect(code).toMatch(/<LiveEditText contentKey="auto:[0-9a-f]+" row=\{liveEditRow\} fallback=\{title\} \/>/);
    });

    it('widens the props type, so the app it rewrote still compiles', () => {
        /*
         * Adding a property to `({ title }: Props)` and not to `Props` is a
         * build error. A codemod that leaves somebody's application unable to
         * compile is worse than one that passed the file over, because the
         * second is recoverable by doing nothing.
         *
         * Parenthesised because a props type is often a union, and
         * `A | B & C` does not group the way it reads.
         */
        expect(cardFile().code).toContain(': (Props) & { liveEditRow?: string | null }');
    });

    it('leaves words written into the card on one key, because they are one value', () => {
        // "Read more" is the same words on every row. A per-row key there
        // would be twenty copies of one string, all edited separately.
        expect(cardFile().code).toContain('data-edit="setting:');
    });

    it('reports the list instead of wiring it when the card is not being rewritten', () => {
        /*
         * The name alone is not enough. A component from a package, or behind
         * an import the scan cannot follow, would be handed a prop it does
         * nothing with - and the list would read as covered while every row
         * still shared one key. Worse than leaving it alone, because only one
         * of the two is reported.
         */
        const { code, deferred } = listFile({ serverRows: [] });

        expect(code).not.toContain('liveEditRow');
        expect(deferred[0].tag).toBe('PostPreview');
    });

    it('is the same file twice, so an upgrade does not move anybody keys', () => {
        const list = listFile().code;
        const card = cardFile().code;

        expect(transform(list, { relativePath: 'app/more-stories.tsx', serverRows: ['PostPreview'] }).code).toBe(list);
        expect(transform(card, {
            relativePath: 'app/post-preview.tsx',
            repeated: true,
            rowCards: ['PostPreview'],
        }).code).toBe(card);
    });

    it('does none of this on the client, where context already carries the row', () => {
        // The prop would be a second mechanism doing the same job, and the two
        // would disagree the first time somebody moved a file.
        expect(cardFile({ force: true }).code).not.toContain('liveEditRow');
    });
});

describe('what the wired card renders', () => {
    const replies = [];

    const respond = (settings) =>
        replies.push({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => ({ settings, styles: {} }),
        });

    beforeEach(() => {
        replies.length = 0;
        configureLiveEdit({ site: 'acme', apiBase: 'https://cms.example.com/api/v1', key: 'pk_test' });
        vi.stubGlobal('fetch', vi.fn(async () => replies.shift() ?? Promise.reject(new Error('no reply queued'))));
    });

    afterEach(() => {
        configureLiveEdit(null);
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('gives two rows of one component two different values', async () => {
        // The whole point. One component, written once, drawn per post.
        const words = {
            'auto:1a2b3c@hello-world': 'Hello World, edited',
            'auto:1a2b3c@dynamic-routing': 'Dynamic Routing, edited',
        };

        // Twice, because React's `cache` memoises inside one render and
        // deliberately nowhere else, and these are two calls outside any
        // render. Content held past the render that fetched it would be one
        // visitor's page served to the next.
        respond(words);
        respond(words);

        const rows = await Promise.all(
            ['hello-world', 'dynamic-routing'].map((row) =>
                LiveEditText({ contentKey: 'auto:1a2b3c', row, fallback: 'original' })
            )
        );

        expect(rows).toEqual(['Hello World, edited', 'Dynamic Routing, edited']);
    });

    it('leaves the same card ordinary on its own page', async () => {
        /*
         * One component, two correct behaviours, decided where it is rendered
         * rather than where it is written - the same promise the client half
         * makes. An absent prop is undefined, and undefined means no list.
         */
        respond({ 'auto:1a2b3c': 'Edited on its own page' });

        expect(await LiveEditText({ contentKey: 'auto:1a2b3c', fallback: 'original' }))
            .toBe('Edited on its own page');
    });

    it('offers nothing at all for a row it cannot tell apart', async () => {
        /*
         * A list whose items have no identity of their own. `null` is the
         * honest answer and is not the same as the prop being absent: one is
         * "not in a list", the other is "in a list I cannot key". Tagging the
         * second would put one key on every row, which is the exact fault this
         * whole piece of work exists to prevent.
         */
        expect(editMarkerIn(null, 'auto:1a2b3c')).toBeUndefined();
        expect(editMarkerIn(undefined, 'auto:1a2b3c')).toBe('setting:auto:1a2b3c');
        expect(editMarkerIn('hello-world', 'auto:1a2b3c')).toBe('setting:auto:1a2b3c@hello-world');

        // And it renders the words the component came with, rather than a
        // value somebody else's row was edited into.
        expect(await LiveEditText({ contentKey: 'auto:1a2b3c', row: null, fallback: 'original' }))
            .toBe('original');
    });

    it('reads the same key the client composes, so the two halves agree', async () => {
        /*
         * `useContent` composes `key@identity` from context. If this composed
         * anything else, a page moved from a client component to a server one
         * would lose every edit made against it, and nothing would say so.
         */
        respond({ 'auto:1a2b3c@hello-world': 'from the server half' });

        expect(await LiveEditText({ contentKey: 'auto:1a2b3c', row: 'hello-world', fallback: 'original' }))
            .toBe('from the server half');
    });
});
