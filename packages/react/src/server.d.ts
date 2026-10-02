export type ContentMap = Record<string, string>;

export interface ServerOptions {
    site?: string;
    apiBase?: string;
    key?: string;
    publishableKey?: string;
    locale?: string | null;
}

/** Point the server reader at a site, instead of using the environment. */
export declare function configureLiveEdit(options: ServerOptions | null): void;

/** A site's content, or an empty map when it cannot be read. Never rejects. */
export declare function readContent(options?: ServerOptions): Promise<ContentMap>;

/** The words for this request, as a lookup that falls back to the template's own copy. */
export declare function liveEditWords(
    locale?: string | null,
): Promise<(key: string, fallback?: string) => string>;

export declare function itemIdentity(item: unknown): string | null;
/*
 * The shape identity.js actually returns.
 *
 * This said `{ usable, why }`, which no version of the implementation has ever
 * returned - both entry points re-export the same function, and the other one
 * declares it correctly. Nobody had reached for the return value yet, so it
 * sat there waiting to be a confusing afternoon for whoever did.
 */
export declare function listIdentity(items: readonly unknown[]): {
    editable: boolean;
    reason: string | null;
    identities: string[];
};
export declare function contentKeyFor(list: string, field: string, item: unknown): string | null;
export declare function editMarkerFor(list: string, field: string, item: unknown): string | undefined;

export interface ServerLiveEditTextProps {
    /**
     * Null is a real answer: contentKeyFor() returns null for a row with no
     * identity of its own, and the codemod feeds its result straight in.
     *
     * Fixed in index.d.ts and missed here, which is the drift this file is
     * now tested against. It matters more on this side rather than less:
     * without --client the codemod emits server components, so /server is the
     * entry point most of an App Router install actually imports from. Fixing
     * only the client left a reported 51 errors behind, every one of them in
     * a file importing from here.
     */
    contentKey: string | null;
    /** A stat, a price, a count. Numbers as often as strings. */
    fallback?: string | number;
    locale?: string | null;
    /** Which row this card is, set by the codemod on a card in a list. */
    row?: string | null;
}

/** One editable value, as a server component. */
export declare function LiveEditText(props: ServerLiveEditTextProps): Promise<string>;

/** Compose a row's identity onto a key, or leave it alone when the card is not in a list. */
export declare function contentKeyIn(row: string | null | undefined, key: string): string | null;
export declare function editMarkerIn(row: string | null | undefined, key: string): string | undefined;
