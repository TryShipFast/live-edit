#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { transform } from '../src/codemod.js';

/**
 * Walks a React project and makes its static copy editable.
 *
 * Shows what it would do and changes nothing, unless asked. A tool that
 * rewrites somebody's components the first time they try it is a tool they
 * will only run once.
 */

const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'out', 'coverage', '.turbo']);
const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);

/*
 * The first thing anybody types at an unfamiliar command.
 *
 * Without this, --help was read as "no directory given", so the tool scanned
 * the current directory instead and printed a full dry run. Somebody asking
 * what the command does got a wall of their own components, and somebody
 * asking from an empty folder got "0 elements in 0 files", which reads as a
 * tool that is broken rather than one that was never told where to look.
 */
if (flag('help') || args.includes('-h')) {
    console.log(`live-edit-codemod: make the static copy in a React or Next.js app editable.

  live-edit-codemod [directory] [options]

  directory        Where to look. Defaults to the current directory.

  --write          Apply the changes. Without it, nothing is written.
  --client         Treat the files it touches as client components: the
                   useContent hook and 'use client' are added, and edits
                   appear in place instead of on the next render.
  --server         Marker only, no hook. For files that render on the server.
  --help, -h       This.

Keys are derived from each file's path relative to the nearest package.json,
so running it twice, or over a subdirectory, leaves existing edits attached.

Docs: https://tryshipfast.com`);
    process.exit(0);
}

const root = path.resolve(args.find((a) => !a.startsWith('--')) ?? '.');
const write = flag('write');
const force = flag('client') ? true : flag('server') ? false : null;

const files = [];
const collect = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') && entry.name !== '.') {
            continue;
        }

        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!SKIP.has(entry.name)) {
                collect(full);
            }
            continue;
        }

        if (EXTENSIONS.has(path.extname(entry.name)) && !entry.name.endsWith('.d.ts')) {
            files.push(full);
        }
    }
};

if (!fs.existsSync(root)) {
    console.error(`No such directory: ${root}`);
    process.exit(1);
}

collect(root);

let touched = 0;
let tagged = 0;
/**
 * Where a file's path is measured from, which decides its key.
 *
 * The project root, never the directory being scanned. Keys are a hash of the
 * path, so measuring from the scan directory meant `live-edit-codemod src`
 * and `live-edit-codemod src/components` produced DIFFERENT keys for the same
 * element in the same file — and a customer who ran one and later the other
 * lost every edit they had made. The words stayed in the database under keys
 * nothing on the page asked for any more, with nothing to say so.
 *
 * Found by running both on one template and comparing: c07eab32233c against
 * f424fd0c6781 for the same heading.
 */
const projectRoot = (() => {
    let at = fs.statSync(root).isDirectory() ? root : path.dirname(root);

    for (let up = 0; up < 20; up += 1) {
        if (fs.existsSync(path.join(at, 'package.json'))) {
            return at;
        }

        const parent = path.dirname(at);

        if (parent === at) {
            break;
        }

        at = parent;
    }

    // No package.json anywhere above: the scan directory is all there is, and
    // a stable-but-local key beats refusing to run.
    return root;
})();

/**
 * Which files React will render in the browser.
 *
 * A file is a client component when it says so — and also when anything that
 * imports it says so, which is the part that was missing. "use client" marks
 * a boundary, not a file: everything below it renders in the browser whatever
 * its own first line says.
 *
 * It matters because the marker alone is written for a server component, on
 * the reasoning that there is no React on the client to undo an edit. Get the
 * classification wrong and that reasoning is wrong with it: the edit is
 * applied to the DOM and then reverted by the next render, which the provider
 * triggers itself when it finishes fetching content.
 *
 * Measured on a Next.js template whose root layout is a client component:
 * twelve of fifteen files were called server-rendered, and every one of them
 * was in fact rendered in the browser.
 */
/** Every file being scanned, read once. */
const sources = new Map(files.map((file) => [file, fs.readFileSync(file, 'utf8')]));

const ENDINGS = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];

/** Turn an import specifier into one of the files being scanned, if it is one. */
const resolve = (from, specifier) => {
    const candidates = [];

    if (specifier.startsWith('.')) {
        candidates.push(path.resolve(path.dirname(from), specifier));
    } else if (specifier.startsWith('@/')) {
        // The alias Next.js scaffolds. Both layouts are tried rather than
        // reading tsconfig, which would mean parsing JSON with comments.
        candidates.push(path.join(projectRoot, 'src', specifier.slice(2)));
        candidates.push(path.join(projectRoot, specifier.slice(2)));
    } else {
        return null;
    }

    for (const candidate of candidates) {
        for (const ending of ENDINGS) {
            if (sources.has(candidate + ending)) {
                return candidate + ending;
            }
        }
    }

    return null;
};

/** The file a component name was imported from, if it was imported at all. */
const resolveFrom = (file, name) => {
    const source = sources.get(file) ?? '';

    for (const line of source.matchAll(/import\s+([^;]+?)\s+from\s*['"]([^'"]+)['"]/g)) {
        // Matches a default import, a named one, or one among several. The
        // word boundary keeps "Avatar" from matching "AvatarGroup".
        if (new RegExp(`\\b${name}\\b`).test(line[1])) {
            return resolve(file, line[2]);
        }
    }

    return null;
};

const clientRendered = (() => {
    const marked = new Set();
    const queue = [];

    for (const [file, source] of sources) {
        if (/^\s*['"]use client['"]/m.test(source.slice(0, 400))) {
            marked.add(file);
            queue.push(file);
        }
    }

    while (queue.length) {
        const file = queue.pop();
        const source = sources.get(file) ?? '';

        for (const match of source.matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)) {
            const imported = resolve(file, match[1]);

            if (imported && ! marked.has(imported)) {
                marked.add(imported);
                queue.push(imported);
            }
        }
    }

    return marked;
})();

/**
 * Which files are a row of a list, rendered once per item.
 *
 * The question no single file can answer about itself. `avatar.tsx` is a
 * component that renders a name; whether that name is one person or one per
 * row is decided in whichever file writes `posts.map(post => <PostPreview/>)`,
 * and on a real App Router page that is always somewhere else.
 *
 * It matters because a key written into a card is one key however many times
 * the card is drawn. On the client that is fine - the row's identity is
 * composed on at render, inside `LiveEditItem`. On the server there is no
 * context to carry it, so one key stays one key. Measured on a real Next app:
 * three different authors' names carried the identical key, and renaming one
 * would have renamed all three in a customer's content, silently.
 *
 * Seeded with every component used directly as a `.map()` row, then followed
 * through imports, because a card's own children are drawn once per row too.
 * Deliberately generous: marking a file that is not really repeated costs one
 * value staying uneditable, and missing one costs somebody's content.
 */
const rowComponents = (() => {
    const marked = new Set();
    const queue = [];

    // A component rendered straight inside a .map() callback. Read from the
    // text rather than the syntax tree: this needs a name to resolve an import
    // by, not a precise shape, and the callback bodies people write vary far
    // more than the one line that matters.
    const inAMap = /\.map\(\s*\(?[^)]*\)?\s*=>\s*\(?\s*<([A-Z][A-Za-z0-9_]*)/g;

    for (const [file, source] of sources) {
        for (const found of source.matchAll(inAMap)) {
            const target = resolveFrom(file, found[1]);

            if (target && !marked.has(target)) {
                marked.add(target);
                queue.push(target);
            }
        }
    }

    while (queue.length) {
        const file = queue.pop();

        for (const match of (sources.get(file) ?? '').matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)) {
            const imported = resolve(file, match[1]);

            if (imported && !marked.has(imported)) {
                marked.add(imported);
                queue.push(imported);
            }
        }
    }

    return marked;
})();

/**
 * The two halves of a server list, matched up.
 *
 * `posts.map(post => <PostPreview/>)` in one file and `PostPreview` in
 * another, both rendered on the server. On the client the row's identity
 * travels in React context and neither file needs to know about the other;
 * there is no context on the server, so the identity has to be handed over as
 * a prop - which means editing the call site and the card's own parameter list
 * in step, in two files, or neither.
 *
 * Which is why this is here and not in the transform. A file cannot see the
 * other one, and wiring only one side is the worst of the three outcomes: the
 * list would read as covered while every row still shared a single key.
 *
 * Only where the card resolves to a file this run is about to rewrite. A
 * component from a library, or one behind an import this cannot follow, is
 * left alone and reported exactly as it was before.
 */
const serverRowPairs = (() => {
    const callSites = new Map();
    const cards = new Map();

    if (force === true) {
        // Everything is being made client-side, where context does this job.
        return { callSites, cards };
    }

    const inAMap = /\.map\(\s*\(?[^)]*\)?\s*=>\s*\(?\s*<([A-Z][A-Za-z0-9_]*)/g;

    // Any component element at all, for the hops after the first.
    const anyComponent = /<([A-Z][A-Za-z0-9_]*)/g;

    const serverSide = (file) => !(clientRendered.has(file) && force !== false);

    /** The caller renders this component, and this run is about to rewrite it. */
    const pair = (file, name) => {
        const target = resolveFrom(file, name);

        // A client card cannot take the prop: the transform gives it a hook
        // and context instead, and nothing there reads a row.
        if (target === null || target === file || !serverSide(target)) {
            return null;
        }

        if (!callSites.has(file)) {
            callSites.set(file, new Set());
        }

        if (!cards.has(target)) {
            cards.set(target, new Set());
        }

        callSites.get(file).add(name);
        cards.get(target).add(name);

        return target;
    };

    const queue = [];

    for (const [file, source] of sources) {
        if (!serverSide(file)) {
            continue;
        }

        for (const found of source.matchAll(inAMap)) {
            const target = pair(file, found[1]);

            if (target !== null) {
                queue.push(target);
            }
        }
    }

    /*
     * And onwards, because a card's own children are drawn once per row too.
     *
     * `more-stories` maps over posts and renders `PostPreview`; `PostPreview`
     * renders `PostTitle` from a third file, which is drawn once per row and
     * knew nothing about it - so its words took one key across every card.
     * The row has to travel the whole way down, not just to the first file.
     *
     * Every component a row card renders, not only the ones in a `.map()`:
     * being inside something drawn per row is what makes a thing per row, and
     * there is no second map to look for.
     */
    const walked = new Set();

    while (queue.length) {
        const file = queue.pop();

        if (walked.has(file)) {
            continue;
        }

        walked.add(file);

        for (const found of (sources.get(file) ?? '').matchAll(anyComponent)) {
            const target = pair(file, found[1]);

            if (target !== null) {
                queue.push(target);
            }
        }
    }

    return { callSites, cards };
})();

const skipped = [];
const byMode = { client: 0, server: 0 };

// Lists this run understood and could not wire. Reported, because the counts
// alone cannot tell "there was no list here" from "there was one and it was
// passed over", and only one of those is coverage.
const passedOver = [];

// Elements that already carry a key, so a second run leaves them alone. That
// is right — re-keying them would detach every edit a client has made — but
// saying nothing about it turns "nothing to do" into "0 elements in 0 files",
// which reads as a tool that found nothing rather than one that found
// everything already done.
let alreadyTagged = 0;

for (const file of files) {
    const relative = path.relative(projectRoot, file);
    const source = fs.readFileSync(file, 'utf8');

    let result;

    try {
        result = transform(source, {
            relativePath: relative,
            force: force ?? (clientRendered.has(file) ? true : null),
            repeated: rowComponents.has(file),
            serverRows: [...(serverRowPairs.callSites.get(file) ?? [])],
            rowCards: [...(serverRowPairs.cards.get(file) ?? [])],
        });
    } catch (error) {
        // A file that cannot be parsed is reported, never guessed at.
        skipped.push(`${relative}: ${error.message.split('(').pop()?.replace(/\)$/, '') ?? 'parse error'}`);
        continue;
    }

    alreadyTagged += result.already ?? 0;

    for (const item of result.deferred ?? []) {
        passedOver.push(`${relative}: <${item.tag}> - ${item.why}`);
    }

    if (result.changes.length === 0) {
        continue;
    }

    touched++;
    tagged += result.changes.length;
    byMode[result.mode]++;

    console.log(`\n${relative}  (${result.mode}, ${result.changes.length})`);
    for (const change of result.changes.slice(0, 6)) {
        const text = change.text.length > 60 ? `${change.text.slice(0, 57)}…` : change.text;
        console.log(`  <${change.tag}> ${text}`);
    }
    if (result.changes.length > 6) {
        console.log(`  … and ${result.changes.length - 6} more`);
    }

    if (write) {
        fs.writeFileSync(file, result.code);
    }
}

console.log(`\n${tagged} element${tagged === 1 ? '' : 's'} in ${touched} file${touched === 1 ? '' : 's'}`);
console.log(`  ${byMode.client} client-side (editable live), ${byMode.server} server-rendered (edits land on refresh)`);

if (alreadyTagged > 0) {
    console.log(`\n${alreadyTagged} element${alreadyTagged === 1 ? ' was' : 's were'} already tagged and left alone,`);
    console.log('  so their keys still match whatever anybody has already edited.');

    if (force === true) {
        // The specific dead end: somebody runs it plain, finds their edits
        // reverting, reaches for --client, and is told nothing changed.
        console.log('\n  --client cannot be applied to them after the fact. To make an already');
        console.log('  tagged file client-side, add \'use client\' to the top of it yourself:');
        console.log('  the hook and the marker are already there and the keys do not move.');
    }
}

if (passedOver.length > 0) {
    console.log(`\n${passedOver.length} list${passedOver.length === 1 ? '' : 's'} could not be made editable:`);
    passedOver.slice(0, 10).forEach((line) => console.log(`  ${line}`));
    if (passedOver.length > 10) {
        console.log(`  … and ${passedOver.length - 10} more`);
    }
    console.log("\n  A card in its own file is given the row's identity as a prop, and that");
    console.log('  needs the card to be one of the files being scanned. These resolved to');
    console.log('  something outside it - a package, or an import this cannot follow. Add');
    console.log("  'use client' to the file holding the list if those rows need their own");
    console.log('  words today.');
}

if (skipped.length > 0) {
    // Never silently: a file passed over is coverage the caller does not have,
    // and a summary that hides it reads as "everything was handled".
    console.log(`\n${skipped.length} file${skipped.length === 1 ? '' : 's'} could not be parsed and were left alone:`);
    skipped.slice(0, 10).forEach((line) => console.log(`  ${line}`));
    if (skipped.length > 10) {
        console.log(`  … and ${skipped.length - 10} more`);
    }
}

console.log(write ? '\nWritten. Review the diff before committing.' : '\nNothing written. Re-run with --write to apply.');
