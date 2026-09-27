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

    return {
        start: node.start + leading,
        end: node.end - trailing,
        text: raw.trim(),
        rendered: asJsxRenders(raw),
    };
};

/**
 * The entities JSX understands, decoded.
 *
 * Only the ones that turn up in real templates. The full HTML set is over two
 * thousand names and carrying a table of them to catch &hellip; is not worth
 * the weight; anything missed is left exactly as written, which is what the
 * old behaviour was for everything.
 */
const ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    hellip: '…', mdash: '—', ndash: '–', copy: '©',
    reg: '®', trade: '™', laquo: '«', raquo: '»',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
    times: '×', middot: '·', bull: '•', deg: '°',
};

/**
 * What JSX would have put on the page, as opposed to what the file says.
 *
 * The two differ in ways that are invisible until somebody looks at the page.
 * A codemod moves the words out of JSX and into a JavaScript string argument,
 * where none of JSX's own rules apply any more:
 *
 * Entities stop being entities. A paging arrow written &gt; is a > on the page
 * and the four characters &gt; once it is inside a string. Measured on a real
 * template: the arrow in its pagination rendered as literal &gt; the moment
 * the codemod touched it, and nothing in the run said so.
 *
 * Newlines stop collapsing. JSX folds a wrapped paragraph and its indentation
 * into single spaces; a string keeps every one of them, so the fallback stops
 * matching the words the page used to show and the file's indentation ends up
 * in the customer's content.
 *
 * Follows Babel's own rule for JSX text, so the result is what the compiler
 * would have produced.
 */
const asJsxRenders = (raw) => {
    const lines = raw.split(/\r\n|\n|\r/);
    let lastWithWords = 0;

    lines.forEach((line, at) => {
        if (/[^ \t]/.test(line)) {
            lastWithWords = at;
        }
    });

    let out = '';

    lines.forEach((line, at) => {
        let trimmed = line.replace(/\t/g, ' ');

        if (at !== 0) {
            trimmed = trimmed.replace(/^ +/, '');
        }

        if (at !== lines.length - 1) {
            trimmed = trimmed.replace(/ +$/, '');
        }

        if (trimmed !== '') {
            out += at === lastWithWords ? trimmed : trimmed + ' ';
        }
    });

    return out.replace(
        /&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g,
        (whole, body) => {
            if (body[0] === '#') {
                const code = body[1] === 'x' || body[1] === 'X'
                    ? Number.parseInt(body.slice(2), 16)
                    : Number.parseInt(body.slice(1), 10);

                return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : whole;
            }

            return ENTITIES[body] ?? whole;
        }
    );
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
    const alreadyClient = source.slice(0, 400).match(/^\s*['"]use client['"]/m) !== null;
    const isClient = force ?? alreadyClient;

    // Asked to make a server file live, it has to become a client component
    // too. A hook without the directive is not a working component — it fails
    // at build with a message about useContext — so the flag was offering
    // something it could not deliver.
    const needsDirective = isClient && ! alreadyClient;

    const edits = [];
    const changes = [];
    let already = 0;
    let index = 0;

    walk(ast.program, (node) => {
        if (node.type !== 'JSXElement') {
            return;
        }

        const tag = tagNameOf(node.openingElement);

        if (!isHostElement(tag)) {
            return;
        }

        // Counted, not just skipped. A second run leaving everything alone is
        // the right thing to do and a confusing thing to be told nothing
        // about; the caller is shown how many were already done.
        if (hasAttribute(node.openingElement, 'data-edit')) {
            already += 1;

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

        // Keyed on the raw source text, not on what it renders as. The words
        // are only an ingredient of the key, and changing that ingredient
        // would move the keys of every element holding an entity or a wrapped
        // line, which orphans the edits already saved against them. Key
        // stability has cost this project a day once already.
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
                text: `{useContent(${JSON.stringify(key)}, ${JSON.stringify(span.rendered)})}`,
            });
        }

        changes.push({ key, tag, text: span.rendered });
    });

    if (changes.length === 0) {
        return { code: source, changes, already, mode: isClient ? 'client' : 'server' };
    }

    if (isClient) {
        const importEdit = importFor(source, ast);
        if (importEdit) {
            edits.push(importEdit);
        }

        if (needsDirective) {
            edits.push({ start: 0, end: 0, text: "'use client';\n\n" });
        }
    }

    // Applied back to front, so an earlier edit cannot move a later one's
    // position out from under it.
    const code = edits
        .sort((a, b) => b.start - a.start)
        .reduce((carry, edit) => carry.slice(0, edit.start) + edit.text + carry.slice(edit.end), source);

    return { code, changes, already, mode: isClient ? 'client' : 'server' };
};

/** Add useContent to an existing import from the package, or write a new one. */
const importFor = (source, ast) => {
    const imports = ast.program.body.filter((node) => node.type === 'ImportDeclaration');
    const existing = imports.find((node) => node.source.value === '@shipfast/live-edit-react');

    if (existing) {
        const already = existing.specifiers.some((s) => s.imported?.name === 'useContent');

        if (already) {
            return null;
        }

        const last = existing.specifiers[existing.specifiers.length - 1];

        return { start: last.end, end: last.end, text: ', useContent' };
    }

    const line = "import { useContent } from '@shipfast/live-edit-react';\n";

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
