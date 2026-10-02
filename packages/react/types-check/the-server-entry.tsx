/**
 * The same generated shapes, through the entry point most installs use.
 *
 * This file is the whole point of the exercise. 0.13.3 fixed index.d.ts, left
 * server.d.ts with the old narrow shape, and shipped - because the test
 * written alongside that fix only looked at the client entry and went green.
 * 51 errors survived the release, every one of them in a file importing from
 * here.
 *
 * It is the entry point that matters most, not least: without --client the
 * codemod emits server components, so an App Router install imports from
 * /server for most of its pages.
 */
import {
    readContent,
    configureLiveEdit,
    liveEditWords,
    LiveEditText,
    itemIdentity,
    listIdentity,
    contentKeyFor,
    editMarkerFor,
    contentKeyIn,
    editMarkerIn,
} from '@shipfasts/live-edit-react/server';

type Card = { id: string; title: string; stat: number };

const cards: Card[] = [
    { id: 'a', title: 'First', stat: 12 },
    { id: 'b', title: 'Second', stat: 34 },
];

/**
 * A server component rendering a list.
 *
 * The words are awaited before the JSX rather than inside it: React 18's types
 * do not accept a promise as a child, so an async callback in a map is a
 * mistake about React and not about this package. Written the way it has to be
 * written, so a failure here is always ours.
 */
export async function Cards() {
    const rows = await Promise.all(cards.map(async (card) => ({
        id: card.id,
        marker: editMarkerFor('home.cards', 'title', card),
        /*
         * The two that were still wrong here after 0.13.3: contentKeyFor
         * returns string | null, and a fallback is a number as often as a
         * string.
         */
        title: await LiveEditText({
            contentKey: contentKeyFor('home.cards', 'title', card),
            fallback: card.title,
            row: itemIdentity(card),
        }),
        stat: await LiveEditText({
            contentKey: contentKeyFor('home.cards', 'stat', card),
            fallback: card.stat,
        }),
    })));

    return (
        <ul>
            {rows.map((row) => (
                <li key={row.id} data-edit={row.marker}>
                    {row.title}
                    {row.stat}
                </li>
            ))}
        </ul>
    );
}

/** The layout half of the two-file shape the README now documents. */
export async function Layout({ children }: { children: React.ReactNode }) {
    configureLiveEdit({ site: 'acme', apiBase: 'https://live.example.com/api/live-edit/v1', key: 'kbp_example' });

    const content = await readContent();
    const words = await liveEditWords('en');

    return (
        <div data-words={words('home.heading', 'We build things')}>
            <span data-count={Object.keys(content).length} />
            {children}
        </div>
    );
}

/** Shapes a host reads directly, so a wrong return type is caught here too. */
export function alsoCompiles() {
    const whether = listIdentity(cards);

    // This is what identity.js actually returns. server.d.ts declared
    // { usable, why }, which no version has ever returned - it simply had not
    // been reached for yet.
    const editable: boolean = whether.editable;
    const why: string | null = whether.reason;
    const identities: string[] = whether.identities;

    const key: string | null = contentKeyIn('row-1', 'home.heading');
    const marker: string | undefined = editMarkerIn('row-1', 'home.heading');

    return { editable, why, identities, key, marker };
}
