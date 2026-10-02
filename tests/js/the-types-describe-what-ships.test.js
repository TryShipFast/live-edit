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
const exported = () => {
    const names = new Set();
    const source = read('index.js');

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
const declared = () => {
    const names = new Set();
    const source = read('index.d.ts');

    for (const [, name] of source.matchAll(/export\s+declare\s+(?:function|const|class)\s+([A-Za-z0-9_$]+)/g)) {
        names.add(name);
    }

    return names;
};

describe('the types describe what ships', () => {
    it('declares every symbol the entry point exports', () => {
        const missing = [...exported()].filter((name) => !declared().has(name));

        expect(missing, `index.js exports these and index.d.ts does not declare them: ${missing.join(', ')}`)
            .toEqual([]);
    });

    it('found the exports at all, so an empty comparison cannot pass', () => {
        // The failure this guards: a regex that stops matching turns the test
        // above into "nothing is missing from nothing", which passes forever
        // and means nothing.
        expect(exported().size).toBeGreaterThanOrEqual(10);
        expect(declared().size).toBeGreaterThanOrEqual(10);
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

    it('lets LiveEditText take what the codemod actually passes it', () => {
        /*
         * contentKeyFor() returns string | null for a row with no identity of
         * its own, and the codemod feeds its result straight in. Fallbacks are
         * numbers as often as strings - a stat, a price, a count. Typed
         * narrowly, those two accounted for roughly 49 of the 167.
         */
        const types = read('index.d.ts');

        expect(types).toMatch(/contentKey:\s*string \| null/);
        expect(types).toMatch(/fallback\?:\s*string \| number/);
    });
});
