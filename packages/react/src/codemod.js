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

/**
 * A list's key, which every item's content hangs off.
 *
 * Built from what is being mapped over rather than from what it renders, so
 * restyling the card leaves the collection's identity alone. It carries no
 * `auto:` prefix because it is not a content key and nothing is ever stored
 * against it directly: keys are `<list>.<field>@<item>`, and this is only the
 * first part.
 */
const listKeyFor = (relativePath, index, over) =>
    'list' + createHash('sha256').update(`${relativePath}|${index}|${over}`).digest('hex').slice(0, 10);

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

/**
 * The element a `.map()` callback renders, or null.
 *
 * Both shapes people actually write: an arrow returning JSX straight, and a
 * body with a return in it. Anything else - a callback that branches, or
 * returns a component rather than a host element - is left alone rather than
 * guessed at.
 */
const renderedBy = (fn) => {
    if (fn.body?.type === 'JSXElement') {
        return fn.body;
    }

    if (fn.body?.type !== 'BlockStatement') {
        return null;
    }

    for (const statement of fn.body.body) {
        if (statement.type === 'ReturnStatement' && statement.argument?.type === 'JSXElement') {
            return statement.argument;
        }
    }

    return null;
};

/**
 * A list rendered from data, found in a container's own children.
 *
 * This is the thing no other adapter's scanner can see and the reason list
 * support for React has to start in the codemod: in a rendered document a
 * repeated item is just more markup, and here it is one element in the source
 * that becomes many on screen.
 *
 * Deliberately narrow. The callback's parameter must be a plain identifier,
 * because that name is what every key inside the item is written against; a
 * destructured parameter gives the fields but no way to refer to the item as
 * a whole, which is what identity is taken from.
 */
const mappedListIn = (node) => {
    for (const child of node.children ?? []) {
        if (child.type !== 'JSXExpressionContainer' || child.expression?.type !== 'CallExpression') {
            continue;
        }

        const call = child.expression;
        const callee = call.callee;

        if (callee?.type !== 'MemberExpression' || callee.computed || callee.property?.name !== 'map') {
            continue;
        }

        const fn = call.arguments?.[0];

        if (fn?.type !== 'ArrowFunctionExpression' && fn?.type !== 'FunctionExpression') {
            continue;
        }

        const param = fn.params?.[0];

        if (param?.type !== 'Identifier') {
            continue;
        }

        const item = renderedBy(fn);

        if (item === null || !isHostElement(tagNameOf(item.openingElement))) {
            continue;
        }

        return { item, param: param.name, over: callee.object };
    }

    return null;
};

/**
 * A field of the mapped item, rendered on its own: `<h3>{course.title}</h3>`.
 *
 * This is the second rule the scope calls for, and it sits beside the
 * single-text-child rule rather than relaxing it. The old rule refuses an
 * expression for a good reason - a key attached to data changes meaning on
 * every render - and that reason does not apply here, because inside a list
 * the key carries the item's identity too. Same caution, different shape.
 *
 * One level of property only. `course.meta.title` is left alone: the field
 * name is what the key is built from, and a nested path invites two different
 * fields to flatten into one name.
 */
const itemFieldIn = (node, param) => {
    const children = (node.children ?? []).filter(
        (child) => !(child.type === 'JSXText' && child.value.trim() === '')
    );

    if (children.length !== 1 || children[0].type !== 'JSXExpressionContainer') {
        return null;
    }

    const expression = children[0].expression;

    if (expression?.type !== 'MemberExpression' || expression.computed) {
        return null;
    }

    if (expression.object?.type !== 'Identifier' || expression.object.name !== param) {
        return null;
    }

    if (expression.property?.type !== 'Identifier') {
        return null;
    }

    return {
        field: expression.property.name,
        start: children[0].start,
        end: children[0].end,
    };
};

/**
 * Words written into the card itself, rather than read from the item.
 *
 * `<span>Free</span>` inside a mapped card is the same three letters in the
 * source and a different element on screen for every row. Left untagged, a
 * catalogue card has its title and its price editable and the word beside
 * them not, which is the half-finished feeling the whole milestone exists to
 * remove.
 *
 * Keyed per item rather than once for the whole list, because a client is
 * looking at one card. Editing the badge on the third course and watching it
 * change on all nine is not a saving anybody asked for.
 *
 * The field name is derived from the words, which is safe in a way it would
 * not be for an item's own data: this text is in the source, so it only moves
 * when a developer edits the file - the same trade the ordinary rule already
 * makes, for the same reason.
 */
const literalInItem = (node, source, listKey) => {
    const children = (node.children ?? []).filter(
        (child) => !(child.type === 'JSXText' && child.value.trim() === '')
    );

    if (children.length !== 1 || children[0].type !== 'JSXText') {
        return null;
    }

    const span = trimmedSpan(children[0], source);

    if (span.text === '') {
        return null;
    }

    return {
        field: 'said' + createHash('sha256').update(`${listKey}|${span.text}`).digest('hex').slice(0, 8),
        start: span.start,
        end: span.end,
        literal: span.rendered,
    };
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
    const needs = new Set();
    let already = 0;
    let index = 0;

    /*
     * Elements a list has already spoken for.
     *
     * The walk visits a parent before its children, so a container is seen
     * first and can claim the item it renders and everything inside it. Both
     * rules would otherwise fire on the same element: a literal inside a card
     * would get an ordinary key AND an item-scoped one, and the second would
     * be written over the first.
     */
    const claimed = new Set();

    /**
     * Write the list scaffolding: the collection, the item, and its fields.
     *
     * Only ever in a client file. A server component renders once on the
     * server with no React on the client to re-render it, so an edit could not
     * reach the page it is standing on - and a list whose rows cannot change
     * is worse than one that was never offered.
     */
    const tagList = (container, { item, param, over }) => {
        /*
         * A second run sees its own work: the thing being mapped is now
         * `useLiveEditList("list…", courses)` rather than `courses`. Hashing
         * that would mint a different key and orphan every edit already saved
         * against the first one, which is the failure key stability exists to
         * prevent - and it would happen on an upgrade, to a site that was
         * working.
         *
         * So a wrap that is already there is read rather than rewritten, and
         * the key inside it is the key.
         */
        const wrapped = over.type === 'CallExpression'
            && over.callee?.type === 'Identifier'
            && over.callee.name === 'useLiveEditList';

        const array = wrapped ? over.arguments?.[1] : over;
        const held = wrapped && over.arguments?.[0]?.type === 'StringLiteral'
            ? over.arguments[0].value
            : null;

        if (array === undefined || array === null) {
            return;
        }

        const name = source.slice(array.start, array.end);
        // Counted whether or not it is used, so a list already wrapped does
        // not shift the keys of the lists after it in the same file.
        const minted = listKeyFor(relativePath, index++, name);
        const listKey = held ?? minted;

        // Claimed before anything else, so the ordinary rule cannot also fire
        // on the item or on anything inside it.
        walk(item, (node) => {
            if (node.type === 'JSXElement') {
                claimed.add(node);
            }
        });

        if (!isClient) {
            return;
        }

        if (!hasAttribute(container.openingElement, 'data-edit-list')) {
            edits.push({
                start: container.openingElement.name.end,
                end: container.openingElement.name.end,
                text: ` data-edit-list="${listKey}"`,
            });
        }

        if (!wrapped) {
            /*
             * The array passes through the adapter on its way to `.map()`, so
             * the client's order, additions and removals are applied to the
             * data rather than to the DOM. Every other adapter rearranges
             * markup; here the markup is a projection, and anything done to it
             * is undone by the next render.
             *
             * A hook, and legal: called once per component, not once per row.
             */
            needs.add('useLiveEditList');
            edits.push({
                start: array.start,
                end: array.end,
                text: `useLiveEditList(${JSON.stringify(listKey)}, ${name})`,
            });
        }

        if (!hasAttribute(item.openingElement, 'data-edit-item')) {
            // From the item's own data, never from the React key: a key is
            // routinely the array index and is never promised to survive a
            // refetch, so content kept against one lands on the wrong row as
            // soon as the data reorders.
            needs.add('itemIdentity');
            edits.push({
                start: item.openingElement.name.end,
                end: item.openingElement.name.end,
                text: ` data-edit-item={itemIdentity(${param})}`,
            });
        }

        walk(item, (node) => {
            if (node.type !== 'JSXElement' || !isHostElement(tagNameOf(node.openingElement))) {
                return;
            }

            if (hasAttribute(node.openingElement, 'data-edit')) {
                already += 1;

                return;
            }

            const found = itemFieldIn(node, param) ?? literalInItem(node, source, listKey);

            if (found === null) {
                return;
            }

            needs.add('editMarkerFor');
            needs.add('contentKeyFor');
            needs.add('LiveEditText');

            edits.push({
                start: node.openingElement.name.end,
                end: node.openingElement.name.end,
                text: ` data-edit={editMarkerFor(${JSON.stringify(listKey)}, ${JSON.stringify(found.field)}, ${param})}`,
            });

            /*
             * A component, not a hook call. React matches hook calls to slots
             * by the order they happen, so one call per row breaks every later
             * hook the moment the list changes length. Each row rendered here
             * is its own component instance with its own slots.
             */
            const fallback = found.literal === undefined
                ? `{${param}.${found.field}}`
                : JSON.stringify(found.literal);

            edits.push({
                start: found.start,
                end: found.end,
                text: `<LiveEditText contentKey={contentKeyFor(${JSON.stringify(listKey)}, ${JSON.stringify(found.field)}, ${param})} fallback=${fallback} />`,
            });

            changes.push({
                key: `${listKey}.${found.field}`,
                tag: tagNameOf(node.openingElement),
                text: found.literal ?? `${param}.${found.field}`,
            });
        });
    };

    walk(ast.program, (node) => {
        if (node.type !== 'JSXElement') {
            return;
        }

        const tag = tagNameOf(node.openingElement);

        if (!isHostElement(tag)) {
            return;
        }

        const list = claimed.has(node) ? null : mappedListIn(node);

        if (list !== null) {
            tagList(node, list);

            return;
        }

        if (claimed.has(node)) {
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
            needs.add('useContent');
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
        const importEdit = importFor(source, ast, [...needs].sort());
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

/**
 * Add whatever this file now needs from the package, or write a new import.
 *
 * Used to name `useContent` and nothing else, which was true while that was
 * the only thing the codemod emitted. List work emits four more, and a file
 * holding an ordinary heading and a list needs a different set from one
 * holding either alone.
 */
const importFor = (source, ast, wanted) => {
    if (wanted.length === 0) {
        return null;
    }

    const imports = ast.program.body.filter((node) => node.type === 'ImportDeclaration');
    const existing = imports.find((node) => node.source.value === '@shipfasts/live-edit-react');

    if (existing) {
        const held = new Set((existing.specifiers ?? []).map((s) => s.imported?.name ?? s.local?.name));
        const missing = wanted.filter((name) => !held.has(name));

        if (missing.length === 0) {
            return null;
        }

        const last = existing.specifiers[existing.specifiers.length - 1];

        return { start: last.end, end: last.end, text: ', ' + missing.join(', ') };
    }

    const line = `import { ${wanted.join(', ')} } from '@shipfasts/live-edit-react';\n`;

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
