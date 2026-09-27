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
