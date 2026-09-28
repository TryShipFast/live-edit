import { describe, expect, it } from 'vitest';
import { transform } from '../../packages/react/src/codemod.js';

const client = (body) => `'use client';\n\nexport default function C() {\n    return (\n${body}\n    );\n}\n`;

describe('codemod', () => {
    it('tags a literal heading and reads it from content', () => {
        const { code, changes } = transform(client('        <h1>Northfield Studio</h1>'), { relativePath: 'a.jsx' });

        expect(changes).toHaveLength(1);
        expect(code).toContain('data-edit="setting:auto:');
        expect(code).toContain('{useContent("auto:');
        expect(code).toContain('"Northfield Studio"');
        expect(code).toContain("import { useContent } from '@shipfasts/live-edit-react';");
    });

    it('leaves anything with an expression alone', () => {
        // The line between template copy and the host's own data. A sentence
        // built from a variable is theirs.
        const source = client('        <p>Hello {user.name}, welcome back</p>');

        expect(transform(source, { relativePath: 'a.jsx' }).changes).toHaveLength(0);
    });

    it('leaves a component alone', () => {
        // <Button>Save</Button> passes text as a prop; there is no DOM node
        // here to carry the marker.
        expect(transform(client('        <Button>Save</Button>'), { relativePath: 'a.jsx' }).changes).toHaveLength(0);
    });

    it('handles JSX written in a .js file', () => {
        // Next and create-react-app both default to this, so extension is a
        // poor guide to what is inside.
        const { changes } = transform(client('        <h2>In a js file</h2>'), { relativePath: 'app/page.js' });

        expect(changes).toHaveLength(1);
    });

    it('handles .tsx', () => {
        const source = `'use client';\nconst n: number = 1;\nexport default function C() {\n    return <h1>Typed</h1>;\n}\n`;

        expect(transform(source, { relativePath: 'a.tsx' }).changes).toHaveLength(1);
    });

    it('does not read a type assertion in .ts as a JSX tag', () => {
        // "<T>value" is a cast in .ts. Parsing it as JSX turns working code
        // into a parse error.
        const source = `const value = <string>someUnknown;\nexport default value;\n`;

        expect(() => transform(source, { relativePath: 'a.ts' })).not.toThrow();
    });

    it('marks server components without a hook', () => {
        // A server component renders once, on the server. A hook there would
        // neither run nor help, so it gets the marker and its edits land on
        // the next render.
        const source = `export default async function Page() {\n    return <h1>Server rendered</h1>;\n}\n`;
        const { code, changes, mode } = transform(source, { relativePath: 'app/page.js' });

        expect(mode).toBe('server');
        expect(changes).toHaveLength(1);
        expect(code).toContain('data-edit="setting:auto:');
        expect(code).not.toContain('useContent');
        expect(code).not.toContain('@shipfasts/live-edit-react');
    });

    it('makes a server file a client component when asked to make it live', () => {
        // A hook without the directive is not a working component: it fails at
        // build with a message about useContext. The flag was offering
        // something it could not deliver.
        const source = `export default function Hero() {\n    return <h1>Words</h1>;\n}\n`;
        const { code, mode } = transform(source, { relativePath: 'a.tsx', force: true });

        expect(mode).toBe('client');
        expect(code.startsWith("'use client';")).toBe(true);
        expect(code).toContain('useContent');
        expect(code.indexOf("'use client'")).toBeLessThan(code.indexOf('import {'));
    });

    it('does not add a second directive to a file that already has one', () => {
        const { code } = transform(client('        <h1>Words</h1>'), { relativePath: 'a.jsx', force: true });

        expect(code.match(/use client/g)).toHaveLength(1);
    });

    it('is idempotent', () => {
        // Running it twice must not tag the same element again, or a client's
        // edits would be orphaned by a second pass.
        const once = transform(client('        <h1>Only once</h1>'), { relativePath: 'a.jsx' }).code;
        const twice = transform(once, { relativePath: 'a.jsx' });

        expect(twice.changes).toHaveLength(0);
        expect(twice.code).toBe(once);
    });

    it('keeps a key stable when the default copy is later reworded', () => {
        // The key is written into the source, so a developer editing the
        // fallback afterwards cannot detach the client's saved words.
        const first = transform(client('        <h1>Original</h1>'), { relativePath: 'a.jsx' }).code;
        const key = first.match(/data-edit="setting:(auto:[a-f0-9]+)"/)[1];

        const reworded = first.replace('"Original"', '"Reworded by a developer"');

        expect(transform(reworded, { relativePath: 'a.jsx' }).changes).toHaveLength(0);
        expect(reworded).toContain(key);
    });

    it('never puts an import above a use client directive', () => {
        // A directive that is not the first statement silently stops being one.
        const { code } = transform(client('        <h1>Words</h1>'), { relativePath: 'a.jsx' });

        expect(code.indexOf("'use client'")).toBeLessThan(code.indexOf('import {'));
    });

    it('adds to an existing import from the package', () => {
        const source = `'use client';\nimport { LiveEditProvider } from '@shipfasts/live-edit-react';\nexport default function C() {\n    return <h1>Words</h1>;\n}\n`;
        const { code } = transform(source, { relativePath: 'a.jsx' });

        expect(code).toContain('{ LiveEditProvider, useContent }');
        expect(code.match(/@shipfasts\/live-edit-react/g)).toHaveLength(1);
    });

    it('preserves the surrounding formatting', () => {
        // The whole reason positions are edited rather than the tree reprinted:
        // a diff nobody can read is a diff nobody will approve.
        const source = client('        <div>\n            <h1>Words</h1>\n            <p>Left {alone}</p>\n        </div>');
        const { code } = transform(source, { relativePath: 'a.jsx' });

        expect(code).toContain('            <p>Left {alone}</p>');
        expect(code.split('\n').length).toBe(source.split('\n').length + 1); // just the import
    });

    it('ignores whitespace-only and empty elements', () => {
        expect(transform(client('        <div>   </div>'), { relativePath: 'a.jsx' }).changes).toHaveLength(0);
        expect(transform(client('        <div></div>'), { relativePath: 'a.jsx' }).changes).toHaveLength(0);
    });

    it('reports a file it cannot parse instead of guessing', () => {
        expect(() => transform('function ( {{{', { relativePath: 'broken.js' })).toThrow(/broken\.js/);
    });
});
