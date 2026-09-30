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
export declare function listIdentity(items: unknown[]): { usable: boolean; why: string | null };
export declare function contentKeyFor(list: string, field: string, item: unknown): string | null;
export declare function editMarkerFor(list: string, field: string, item: unknown): string | undefined;
