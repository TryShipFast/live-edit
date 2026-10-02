import type { ReactElement, ReactNode } from 'react';

/**
 * Types for the package.
 *
 * Not decoration: without them TypeScript infers each prop from its default
 * value in the JavaScript, so a prop defaulting to null is typed as null and
 * passing a function to it fails the build. A Next app is TypeScript more
 * often than not, and the first thing a customer does is fail to compile.
 */

export type ContentMap = Record<string, string>;

export interface LiveEditProviderProps {
    /** The site slug the keys belong to. */
    site: string;
    /** Base URL of the content API, up to and including the version. */
    apiBase: string;
    /** Read-only key. Safe in the page: everything it can see is already public. */
    publishableKey?: string;
    /**
     * Short-lived write key, minted by your own server once IT has decided the
     * person at the keyboard may edit. Absent for visitors.
     */
    sessionKey?: string | null;
    /** Content fetched on the server, so the words are in the HTML that arrives. */
    content?: ContentMap;
    locale?: string;
    /**
     * How to ask the server for the page again, for content React does not
     * drive. Pass router.refresh in Next; defaults to a full reload.
     */
    onRefresh?: (() => void) | null;
    children?: ReactNode;
}

/*
 * ReactElement, not JSX.Element.
 *
 * @types/react 19 removed the global JSX namespace, which is what a new Next
 * app installs by default. Naming it here meant the package's own types
 * failed to compile in the consumer's project: "Cannot find namespace 'JSX'",
 * pointing at a file inside node_modules that they cannot edit. ReactElement
 * is imported from react and means the same thing on both 18 and 19.
 */
export declare function LiveEditProvider(props: LiveEditProviderProps): ReactElement;

/**
 * The value for a key, or the words already in the component.
 *
 * The fallback is what renders with no provider, no network and no content, so
 * adding this cannot leave a page blank.
 */
export declare function useContent(key: string, fallback?: string): string;

export interface LiveEditContextValue {
    content: ContentMap;
    /** Returns whether a hook is actually reading this key. */
    set: (key: string, value: string) => boolean;
    /** Show a value that has already been stored, without saving it again. */
    apply: (key: string, value: string) => boolean;
    refresh: () => Promise<void> | void;
    register: (key: string) => () => void;
    editable: boolean;
    locale: string;
    site: string;
}

export declare function useLiveEdit(): LiveEditContextValue | null;

export interface ClientOptions {
    apiBase: string;
    site: string;
    key: string;
}

export declare function createClient(options: ClientOptions): {
    read: (locale?: string) => Promise<{ settings: ContentMap; styles: Record<string, unknown>; version: number | null } | null>;
    write: (key: string, value: string, locale?: string) => Promise<unknown>;
};

export declare const BRIDGE_KEY: string;

export interface Bridge {
    set: (key: string, value: string) => boolean;
    apply: (key: string, value: string) => boolean;
    get: (key: string) => string | undefined;
    refresh: () => void;
    editable: boolean;
}

export declare function readBridge(): Bridge | null;

/** Compose a row's identity onto a key, or leave it alone when the card is not in a list. */
export declare function contentKeyIn(row: string | null | undefined, key: string): string | null;
export declare function editMarkerIn(row: string | null | undefined, key: string): string | undefined;

/*
 * Everything the codemod writes.
 *
 * These eight were exported from index.js and declared nowhere, which is worse
 * than having no types at all: the package looks typed, so a consumer's build
 * trusts it and then fails on the generated code. Reported from a real app as
 * 167 errors immediately after running the codemod, every one of them in this
 * file rather than in the JavaScript it describes.
 *
 * The lesson is the one this codebase keeps relearning - two descriptions of
 * one thing, and only one of them maintained. There is a test beside this now
 * that reads the exports out of index.js and fails when a name is missing
 * here, because remembering was never going to be enough.
 */

export interface LiveEditTextProps {
    /**
     * Null is a real answer, not an oversight: contentKeyFor() returns null
     * for a row with no identity of its own, and the codemod feeds its result
     * straight in. Typed as string alone, every generated list fails to build.
     */
    contentKey: string | null;
    /**
     * Whatever the design had there. A number as often as a string - a stat, a
     * price, a count - so typing this string-only broke cards that were doing
     * nothing unusual.
     */
    fallback?: string | number;
}

/*
 * Declared as returning an element though it returns a string.
 *
 * It genuinely returns the string - rendering a wrapper would change the CSS
 * of every list item on every site using it, which is why it is written that
 * way. But @types/react 18, which is what a current Next app installs, only
 * accepts ReactElement | null from something used in JSX, and the codemod
 * writes `<LiveEditText … />`. Declaring the honest return type makes the
 * honest usage fail to compile.
 *
 * Written down rather than quietly fudged: when this package drops React 18
 * this should become ReactNode, which is what React 19's types already allow.
 */
export declare function LiveEditText(props: LiveEditTextProps): ReactElement;

/**
 * The stored order for a list, applied to the developer's array.
 *
 * Generic because the codemod rewrites `cards.map(card => …)` into
 * `useLiveEditList(key, cards).map(card => …)`. A non-generic signature makes
 * every one of those callbacks an implicit any, so a project with
 * noImplicitAny - which is every project created by `create-next-app` - fails
 * to build on code our own tool wrote.
 *
 * Hands the array straight back when nothing has been reordered, so a list
 * nobody has touched renders exactly as written.
 */
export declare function useLiveEditList<T>(listKey: string, items: readonly T[]): T[];

/** The row being rendered, or null out in the open. */
export declare function useItemIdentity(): string | null;

export interface LiveEditItemProps {
    /** The row's identity, from itemIdentity(). Null where it has none. */
    id?: string | null;
    children?: ReactNode;
}

/** Marks what is inside as belonging to one row. Renders no DOM of its own. */
export declare function LiveEditItem(props: LiveEditItemProps): ReactElement;

/**
 * A row's own identity, or null.
 *
 * Null is the honest answer for an item with nothing stable to key on, and is
 * never a position or a hash of the content about to be edited - an identity
 * derived from content changes on the first edit and orphans it.
 */
export declare function itemIdentity(item: unknown): string | null;

export interface ListIdentity {
    /** False when any row lacks an identity, or two rows share one. */
    editable: boolean;
    /** Why not, in words, or null when it is. */
    reason: string | null;
    identities: string[];
}

/** Whether a list can be keyed at all, decided for the whole list at once. */
export declare function listIdentity(items: readonly unknown[]): ListIdentity;

/** The key for one field of one row, or null when the row has no identity. */
export declare function contentKeyFor(list: string, field: string, item: unknown): string | null;

/**
 * What goes in `data-edit`, or undefined.
 *
 * Undefined rather than null: React omits an attribute that is undefined, so a
 * row with no identity renders as ordinary markup with no editing marker.
 */
export declare function editMarkerFor(list: string, field: string, item: unknown): string | undefined;
