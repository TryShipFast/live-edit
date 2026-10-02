/**
 * What the codemod writes, compiled the way a customer's build compiles it.
 *
 * Not a sample of good usage - a copy of generated output. Every shape here
 * was taken from a real install that failed: 167 errors across 19 files the
 * moment the codemod finished, none of them in the generated JavaScript, all
 * of them in declarations that described two of the ten symbols the entry
 * point exports.
 *
 * A JavaScript test suite cannot see any of this, which is why it shipped
 * twice.
 */
import {
    LiveEditProvider,
    LiveEditItem,
    LiveEditText,
    useContent,
    useLiveEdit,
    useLiveEditList,
    useItemIdentity,
    itemIdentity,
    listIdentity,
    contentKeyFor,
    editMarkerFor,
    contentKeyIn,
    editMarkerIn,
    createClient,
    readBridge,
    BRIDGE_KEY,
    type ContentMap,
} from '@shipfasts/live-edit-react';

type Card = { id: string; title: string; stat: number };

const cards: Card[] = [
    { id: 'a', title: 'First', stat: 12 },
    { id: 'b', title: 'Second', stat: 34 },
];

/*
 * The list rewrite, exactly as the tool emits it.
 *
 * `cards.map(card => …)` becomes `useLiveEditList(key, cards).map(card => …)`.
 * Without the type parameter `card` is an implicit any here, which is an error
 * under noImplicitAny - roughly forty-five of the hundred and sixty-seven.
 */
export function Cards() {
    const ordered = useLiveEditList('home.cards', cards);

    return (
        <ul>
            {ordered.map((card) => (
                <li key={card.id} data-edit={editMarkerFor('home.cards', 'title', card)}>
                    <LiveEditItem id={itemIdentity(card)}>
                        {/*
                          * contentKeyFor returns string | null for a row with no
                          * identity of its own, and the tool feeds it straight in.
                          * fallback takes a number as often as a string: a stat, a
                          * price, a count. Those two were the other forty-nine.
                          */}
                        <LiveEditText contentKey={contentKeyFor('home.cards', 'title', card)} fallback={card.title} />
                        <LiveEditText contentKey={contentKeyFor('home.cards', 'stat', card)} fallback={card.stat} />
                    </LiveEditItem>
                </li>
            ))}
        </ul>
    );
}

/** The ordinary, out-in-the-open rewrite. */
export function Hero() {
    const heading = useContent('home.heading', 'We build things');
    const row = useItemIdentity();

    return (
        <h1 data-edit={editMarkerIn(row, 'home.heading')} data-key={contentKeyIn(row, 'home.heading')}>
            {heading}
        </h1>
    );
}

/** The wrapper every App Router install writes, typed as the README shows it. */
export function Wrapper({ content, children }: { content: ContentMap; children: React.ReactNode }) {
    return (
        <LiveEditProvider
            site="acme"
            apiBase="https://live.example.com/api/live-edit/v1"
            publishableKey="kbp_example"
            content={content}
            onRefresh={() => undefined}
        >
            {children}
        </LiveEditProvider>
    );
}

/** The pieces a host reaches for directly, so their shapes are checked too. */
export function alsoCompiles() {
    const whether = listIdentity(cards);
    const client = createClient({ apiBase: 'https://live.example.com/api/live-edit/v1', site: 'acme', key: 'kbp_example' });
    const bridge = readBridge();
    const live = useLiveEdit();

    const reasons: string[] = whether.identities;
    const editable: boolean = whether.editable;
    const why: string | null = whether.reason;

    return { reasons, editable, why, client, bridge, live, BRIDGE_KEY };
}
