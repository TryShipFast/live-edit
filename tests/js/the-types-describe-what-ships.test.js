import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Everything the package exports is described by the types it ships.
 *
 * index.js re-exported ten symbols and index.d.ts declared two. Everything the
 * codemod generates for a list used the other eight, so a TypeScript project
 * failed to compile the moment the codemod finished - 167 errors across 19
 * files on a real app, and `next build` refused. Nothing in the generated code
 * was wrong. The package said it was typed, the consumer's build believed it,
 * and the first thing a new customer saw was their project breaking on code
 * our own tool had just written for them.
 *
 * Invisible to every test we had, because a JavaScript suite never reads the
 * declarations. So this reads both and compares them - the same shape as the
 * parity test between the PHP and JavaScript appliers, and for the same
 * reason: two descriptions of one thing, only one of them maintained.
 *
 * Cheap on purpose. It needs no TypeScript toolchain, so it runs in the
 * publish workflow, which is the job that must refuse to ship this.
 */
const read = (file) => readFileSync(path.resolve('packages/react/src', file), 'utf8');

/** Every name index.js re-exports, however it spells the re-export. */
const exported = (file) => {
    const names = new Set();
    const source = read(file);

    for (const [, inside] of source.matchAll(/export\s*\{([^}]+)\}/g)) {
        for (const part of inside.split(',')) {
            const name = part.trim().split(/\s+as\s+/).pop()?.trim();
            if (name) names.add(name);
        }
    }

    for (const [, name] of source.matchAll(/export\s+(?:declare\s+)?(?:const|function|class)\s+([A-Za-z0-9_$]+)/g)) {
        names.add(name);
    }

    return names;
};

/** Every value name index.d.ts declares. Types and interfaces are not values. */
const declared = (file) => {
    const names = new Set();
    const source = read(file);

    for (const [, name] of source.matchAll(/export\s+declare\s+(?:function|const|class)\s+([A-Za-z0-9_$]+)/g)) {
        names.add(name);
    }

    return names;
};

/*
 * Both entry points, because checking one was how this got through twice.
 *
 * The first fix repaired index.d.ts and left server.d.ts with the old narrow
 * shape, and this test - written against index only - went green on a package
 * that was still broken. 51 errors survived the release, every one of them in
 * a file importing from /server.
 *
 * It is the entry point that matters most, not least: without --client the
 * codemod emits server components, so an App Router install imports from here
 * for most of its pages.
 */
const ENTRIES = [
    { js: 'index.js', types: 'index.d.ts' },
    { js: 'server.js', types: 'server.d.ts' },
];

describe('the types describe what ships', () => {
    it.each(ENTRIES)('declares every symbol $js exports', ({ js, types }) => {
        const missing = [...exported(js)].filter((name) => !declared(types).has(name));

        expect(missing, `${js} exports these and ${types} does not declare them: ${missing.join(', ')}`)
            .toEqual([]);
    });

    it.each(ENTRIES)('found the exports in $js at all, so an empty comparison cannot pass', ({ js, types }) => {
        // The failure this guards: a regex that stops matching turns the test
        // above into "nothing is missing from nothing", which passes forever
        // and means nothing.
        expect(exported(js).size).toBeGreaterThanOrEqual(6);
        expect(declared(types).size).toBeGreaterThanOrEqual(6);
    });

    it.each(ENTRIES)('lets $js take the keys the codemod feeds it', ({ types }) => {
        /*
         * Stated for both, because one of them having it right is exactly the
         * state that shipped: contentKeyFor() returns string | null and the
         * codemod passes its result straight in, and a fallback is a number
         * as often as a string.
         */
        const source = read(types);

        expect(source).toMatch(/contentKey:\s*string \| null/);
        expect(source).toMatch(/fallback\?:\s*string \| number/);
    });

    it('keeps useLiveEditList generic, because the codemod maps over its result', () => {
        /*
         * The codemod rewrites `cards.map(card => …)` into
         * `useLiveEditList(key, cards).map(card => …)`. Without the type
         * parameter every generated callback is an implicit any, which is an
         * error in any project made by create-next-app. Roughly 45 of the 167.
         */
        expect(read('index.d.ts')).toMatch(/useLiveEditList<T>\s*\(\s*listKey:\s*string,\s*items:\s*readonly T\[\]\s*\):\s*T\[\]/);
    });

});
