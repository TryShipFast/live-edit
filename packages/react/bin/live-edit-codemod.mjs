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
const clientRendered = (() => {
    const sources = new Map(files.map((file) => [file, fs.readFileSync(file, 'utf8')]));
    const marked = new Set();
    const queue = [];

    for (const [file, source] of sources) {
        if (/^\s*['"]use client['"]/m.test(source.slice(0, 400))) {
            marked.add(file);
            queue.push(file);
        }
    }

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

const skipped = [];
const byMode = { client: 0, server: 0 };

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
        });
    } catch (error) {
        // A file that cannot be parsed is reported, never guessed at.
        skipped.push(`${relative}: ${error.message.split('(').pop()?.replace(/\)$/, '') ?? 'parse error'}`);
        continue;
    }

    alreadyTagged += result.already ?? 0;

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
