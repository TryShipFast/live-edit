import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * What the codemod must not touch, and what somebody can tell it to skip.
 *
 * All of this came out of one cold install on a production Next app. The tool
 * tagged an opengraph image, a route handler and global-error - caught by eye
 * in the diff, and invisible to anybody who runs --write without reading one.
 * None of them can carry a marker: a route handler returns a Response, an
 * image is rasterised by Satori where an attribute has nowhere to live, and
 * global-error is what renders when everything else has already failed.
 *
 * The same install had an admin area that should never be tagged, and no way
 * to say so: the only way to scope it was to run over everything and revert
 * thirty-six files with git afterwards.
 */
const cli = path.resolve('packages/react/bin/live-edit-codemod.mjs');

const dirs = [];

const fixture = () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codemod-skips-'));
    dirs.push(root);

    const write = (where, body) => {
        fs.mkdirSync(path.dirname(path.join(root, where)), { recursive: true });
        fs.writeFileSync(path.join(root, where), body);
    };

    write('package.json', '{ "name": "fixture", "version": "1.0.0" }');
    write('src/app/page.tsx', 'export default function P() { return <h1>Our work</h1>; }');
    write('src/components/hero.tsx', 'export function Hero() { return <p>We build things.</p>; }');
    write('src/app/admin/dashboard.tsx', 'export default function D() { return <h1>Admin area</h1>; }');

    write('src/app/global-error.tsx', "'use client';\nexport default function G() { return <h2>Gone wrong</h2>; }");
    write('src/app/og/route.tsx', "export async function GET() { return new Response('ok'); }");
    write('src/app/opengraph-image.tsx', "import { ImageResponse } from 'next/og';\nexport default function O() { return new ImageResponse(<div>Brand</div>); }");
    // Named like an ordinary component. Only its import gives it away, which
    // is the case a rule about filenames would miss.
    write('src/app/share-card.tsx', "import { ImageResponse } from 'next/og';\nexport function C() { return new ImageResponse(<div>Shared</div>); }");

    return root;
};

const run = (root, ...flags) => execFileSync('node', [cli, path.join(root, 'src'), ...flags], { encoding: 'utf8' });

afterAll(() => dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

describe('what the codemod leaves alone', () => {
    it('never tags a route handler, an image or global-error', () => {
        const out = run(fixture());

        expect(out).toContain('cannot carry an editing marker');
        expect(out).toContain('app/global-error.tsx');
        expect(out).toContain('app/og/route.tsx');
        expect(out).toContain('app/opengraph-image.tsx');
    });

    it('knows an image by what it imports, not only by its name', () => {
        // share-card.tsx is named like any other component. ImageResponse is
        // used from ordinary files too, so the filename conventions are not
        // enough on their own.
        expect(run(fixture())).toContain('app/share-card.tsx');
    });

    it('still tags the ordinary components beside them', () => {
        // The guard against a skip list so eager it stops doing the job.
        const out = run(fixture());

        expect(out).toContain('app/page.tsx');
        expect(out).toContain('components/hero.tsx');
    });

    it('says what it passed over rather than passing over it quietly', () => {
        /*
         * The principle this tool already holds everywhere else: a file left
         * alone is coverage the caller does not have, and a summary that hides
         * it reads as everything having been handled.
         */
        expect(run(fixture())).toMatch(/4 files cannot carry an editing marker/);
    });
});

describe('excluding a directory', () => {
    it('leaves out what matches, and says how many', () => {
        const out = run(fixture(), '--exclude', '**/admin/**');

        expect(out).toContain('matched --exclude');
        expect(out).not.toContain('admin/dashboard.tsx');
        expect(out).toContain('app/page.tsx');
    });

    it('takes more than one', () => {
        const out = run(fixture(), '--exclude', '**/admin/**', '--exclude', 'components/**');

        expect(out).not.toContain('admin/dashboard.tsx');
        expect(out).not.toContain('components/hero.tsx');
        expect(out).toContain('app/page.tsx');
    });

    it('takes the --exclude=glob spelling too', () => {
        expect(run(fixture(), '--exclude=**/admin/**')).not.toContain('admin/dashboard.tsx');
    });

    it('is not mistaken for the directory when it comes first', () => {
        /*
         * The trap: the directory is found by taking the first argument that
         * is not a flag, so a glob sitting between --exclude and the path
         * would be scanned as if it were the path. Nobody notices until the
         * run reports nothing.
         */
        const root = fixture();
        const out = execFileSync('node', [cli, '--exclude', '**/admin/**', path.join(root, 'src')], { encoding: 'utf8' });

        expect(out).toContain('app/page.tsx');
        expect(out).not.toContain('admin/dashboard.tsx');
    });
});
