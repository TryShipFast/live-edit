import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * The same element must get the same key however the tool is invoked.
 *
 * A key is a hash that includes the file's path, and the path used to be
 * measured from whatever directory the command was pointed at. So
 * `live-edit-codemod src` and `live-edit-codemod src/components` produced
 * different keys for the same element in the same file — and a customer who
 * ran one and later the other lost every edit they had made. Not visibly:
 * their words stayed in the database under keys nothing on the page asked for
 * any more, and the page quietly showed the template's copy again.
 *
 * Measured on a real template before the fix: c07eab32233c against
 * f424fd0c6781 for one heading.
 */
const cli = path.resolve('packages/react/bin/live-edit-codemod.mjs');
const made = [];

const project = (component) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-codemod-'));
    made.push(dir);

    fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"t"}');
    fs.mkdirSync(path.join(dir, 'src/components/Hero'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src/components/Hero/index.jsx'), component);

    return dir;
};

const keyIn = (dir) =>
    (fs.readFileSync(path.join(dir, 'src/components/Hero/index.jsx'), 'utf8')
        .match(/auto:[a-f0-9]+/) ?? [])[0];

const run = (dir, target) => {
    execFileSync('node', [cli, target, '--write'], { cwd: dir, stdio: 'ignore' });

    return keyIn(dir);
};

const COMPONENT = `export default function Hero() {\n    return <h1>Words that do not move</h1>;\n}\n`;

afterEach(() => {
    made.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
});

describe('the key a codemod writes', () => {
    it('does not depend on which directory the tool was pointed at', () => {
        const wide = run(project(COMPONENT), 'src');
        const narrow = run(project(COMPONENT), 'src/components');

        expect(wide).toBeDefined();
        expect(narrow).toBe(wide);
    });

    it('does not depend on being given a relative or an absolute path', () => {
        const relative = project(COMPONENT);
        const absolute = project(COMPONENT);

        expect(run(absolute, path.join(absolute, 'src'))).toBe(run(relative, 'src'));
    });

    it('still differs between two files that happen to say the same thing', () => {
        // The path is in the key for a reason: two components with identical
        // copy are two different places a client may want different words.
        const dir = project(COMPONENT);
        fs.mkdirSync(path.join(dir, 'src/components/Footer'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'src/components/Footer/index.jsx'), COMPONENT);

        execFileSync('node', [cli, 'src', '--write'], { cwd: dir, stdio: 'ignore' });

        const hero = keyIn(dir);
        const footer = (fs.readFileSync(path.join(dir, 'src/components/Footer/index.jsx'), 'utf8')
            .match(/auto:[a-f0-9]+/) ?? [])[0];

        expect(footer).toBeDefined();
        expect(footer).not.toBe(hero);
    });
});
