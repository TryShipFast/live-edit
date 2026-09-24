import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';

/**
 * Makes existing components editable, without rewriting them.
 *
 * The scanner earns its keep by tagging a page so nobody has to hand-declare
 * every element. JSX cannot be tagged the same way — the words are in the
 * source, not in a rendered document — so this is the same job done where the
 * words actually live.
 *
 * Two rules decide everything, and both are mechanical rather than a judgment
 * call:
 *
 *   A JSX text node that is a pure string literal is content.
 *   Anything containing an expression is not touched.
 *
 * That is the line between the words in a template and data from the host's
 * own API or database. The tool never has to guess which it is looking at — it
 * can see it.
 *
 * Positions are collected and the original source is edited in place rather
 * than reprinted from the syntax tree. A reprint reformats a whole file, and
 * a diff nobody can read is a diff nobody will approve.
 */

/**
 * Which grammar this file is written in.
 *
 * JSX lives in .js at least as often as in .jsx — it is the default for Next
 * and for create-react-app — so extension is a poor guide to content and every
 * flavour except .ts is parsed as JSX. .ts is the exception that must be
 * honoured: there "<T>value" is a type assertion, and reading it as a JSX tag
 * turns valid code into a parse error.
 */
const pluginsFor = (relativePath) => {
    const lower = String(relativePath).toLowerCase();

    if (lower.endsWith('.ts')) {
        return ['typescript'];
    }

    return lower.endsWith('.tsx') ? ['jsx', 'typescript'] : ['jsx', 'flow'];
};

/** Uppercase means a component: its children are props, not DOM. */
const isHostElement = (name) => typeof name === 'string' && /^[a-z]/.test(name);

const tagNameOf = (node) => (node.name?.type === 'JSXIdentifier' ? node.name.name : null);

const hasAttribute = (opening, attribute) =>
    (opening.attributes ?? []).some((a) => a.type === 'JSXAttribute' && a.name?.name === attribute);

/**
 * A key is written into the source and then never regenerated: a second run
 * leaves tagged elements alone. That is what keeps a client's edits attached
 * to their element when a developer later rewords the default copy.
 */
const keyFor = (relativePath, index, text) =>
    'auto:' + createHash('sha256').update(`${relativePath}|${index}|${text}`).digest('hex').slice(0, 12);

/** JSX drops leading and trailing whitespace, so only the words are replaced. */
const trimmedSpan = (node, source) => {
    const raw = source.slice(node.start, node.end);
    const leading = raw.length - raw.trimStart().length;
    const trailing = raw.length - raw.trimEnd().length;

    return { start: node.start + leading, end: node.end - trailing, text: raw.trim() };
};

const walk = (node, visit) => {
    if (node === null || typeof node !== 'object') {
        return;
    }

    if (Array.isArray(node)) {
        node.forEach((child) => walk(child, visit));

        return;
    }

    if (typeof node.type === 'string') {
        visit(node);
    }

    for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') {
            continue;
        }
        walk(node[key], visit);
    }
};

/**
 * @returns {{code: string, changes: Array<{key: string, tag: string, text: string}>, mode: string}}
 */
export const transform = (source, { relativePath = 'unknown', force = null } = {}) => {
    let ast;

    try {
        ast = parse(source, {
            sourceType: 'module',
            plugins: pluginsFor(relativePath),
            errorRecovery: false,
        });
    } catch (error) {
        throw new Error(`${relativePath}: could not parse (${error.message})`);
    }

    // A server component renders once, on the server; there is no React on the
    // client to re-render it, so a hook there would neither run nor help. Those
    // files get the marker only, and their edits land on the next render.
    const isClient =
        force ?? source.slice(0, 400).match(/^\s*['"]use client['"]/m) !== null;

    const edits = [];
    const changes = [];
    let index = 0;

    walk(ast.program, (node) => {
        if (node.type !== 'JSXElement') {
            return;
        }

        const tag = tagNameOf(node.openingElement);

        if (!isHostElement(tag) || hasAttribute(node.openingElement, 'data-edit')) {
            return;
        }

        // Exactly one text child. A mix of words and expressions is a sentence
        // built from data, and replacing half of it would leave a key that
        // means nothing on its own.
        const children = (node.children ?? []).filter(
            (child) => !(child.type === 'JSXText' && child.value.trim() === '')
        );

        if (children.length !== 1 || children[0].type !== 'JSXText') {
            return;
        }

        const span = trimmedSpan(children[0], source);

        if (span.text === '') {
            return;
        }

        const key = keyFor(relativePath, index++, span.text);

        edits.push({
            start: node.openingElement.name.end,
            end: node.openingElement.name.end,
            text: ` data-edit="setting:${key}"`,
        });

        if (isClient) {
            edits.push({
                start: span.start,
                end: span.end,
                text: `{useContent(${JSON.stringify(key)}, ${JSON.stringify(span.text)})}`,
            });
        }

        changes.push({ key, tag, text: span.text });
    });

    if (changes.length === 0) {
        return { code: source, changes, mode: isClient ? 'client' : 'server' };
    }

    if (isClient) {
        const importEdit = importFor(source, ast);
        if (importEdit) {
            edits.push(importEdit);
        }
    }

    // Applied back to front, so an earlier edit cannot move a later one's
    // position out from under it.
    const code = edits
        .sort((a, b) => b.start - a.start)
        .reduce((carry, edit) => carry.slice(0, edit.start) + edit.text + carry.slice(edit.end), source);

    return { code, changes, mode: isClient ? 'client' : 'server' };
};

/** Add useContent to an existing import from the package, or write a new one. */
const importFor = (source, ast) => {
    const imports = ast.program.body.filter((node) => node.type === 'ImportDeclaration');
    const existing = imports.find((node) => node.source.value === '@kastsbuild/react');

    if (existing) {
        const already = existing.specifiers.some((s) => s.imported?.name === 'useContent');

        if (already) {
            return null;
        }

        const last = existing.specifiers[existing.specifiers.length - 1];

        return { start: last.end, end: last.end, text: ', useContent' };
    }

    const line = "import { useContent } from '@kastsbuild/react';\n";

    if (imports.length > 0) {
        const last = imports[imports.length - 1];

        return { start: last.end + 1, end: last.end + 1, text: line };
    }

    // No imports at all: go after the directive, never before it — a 'use
    // client' that is not the first statement silently stops being one.
    const directive = ast.program.directives?.[0];
    const at = directive ? directive.end + 1 : 0;

    return { start: at, end: at, text: line };
};
