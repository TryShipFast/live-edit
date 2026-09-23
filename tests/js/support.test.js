import { describe, expect, it } from 'vitest';
import {
    classListWith,
    displayedValue,
    iconNamesIn,
    isJsonResponse,
    orderedIcons,
    parseEditKey,
    requestInit,
} from '../../resources/js/support.js';

/*
 * Every case here is a fault that reached a working site. They are written as
 * the symptom a client would have reported, not as the line that was wrong.
 */

describe('parseEditKey', () => {
    it('keeps the whole key when it contains colons', () => {
        // Taking one piece saved every edit on an auto-keyed theme against a
        // key called "auto", and the words went nowhere.
        expect(parseEditKey('setting:auto:1a2b3c4d5e6f')).toMatchObject({
            kind: 'setting',
            key: 'auto:1a2b3c4d5e6f',
        });
    });

    it('still splits a record into its type and id', () => {
        const { kind, parts } = parseEditKey('record:faq:12');

        expect(kind).toBe('record');
        expect(parts).toEqual(['faq', '12']);
    });

    it('does not throw on markup with no key at all', () => {
        expect(parseEditKey(undefined)).toMatchObject({ kind: '', key: '' });
    });
});

describe('requestInit', () => {
    it('keeps its own headers when the caller sets some', () => {
        // The caller's headers used to replace these wholesale, so a request
        // with a Content-Type went out with no CSRF token and no Accept.
        const init = requestInit('token-123', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        expect(init.headers).toEqual({
            'X-CSRF-TOKEN': 'token-123',
            Accept: 'application/json',
            'Content-Type': 'application/json',
        });
        expect(init.method).toBe('POST');
    });

    it('lets a caller override a header deliberately', () => {
        const init = requestInit('token-123', { headers: { Accept: 'text/plain' } });

        expect(init.headers.Accept).toBe('text/plain');
    });

    it('works for a request that sets no headers', () => {
        expect(requestInit('token-123', { method: 'POST' }).headers['X-CSRF-TOKEN']).toBe('token-123');
    });
});

describe('isJsonResponse', () => {
    const withType = (type) => ({ headers: { get: () => type } });

    it('accepts the JSON the endpoints promise', () => {
        expect(isJsonResponse(withType('application/json'))).toBe(true);
    });

    it('rejects a page, which is what a followed redirect returns', () => {
        // This arrives as 200. Believing it made the editor say "Saved" while
        // the client's words were discarded.
        expect(isJsonResponse(withType('text/html; charset=UTF-8'))).toBe(false);
    });

    it('rejects a response with no content type', () => {
        expect(isJsonResponse({ headers: { get: () => null } })).toBe(false);
    });
});

describe('iconNamesIn', () => {
    it('reads a name and its glyph from an escaped codepoint', () => {
        expect(iconNamesIn('.fa-gem:before{content:"\\f3a5"}')).toEqual([
            { name: 'fa-gem', glyph: '' },
        ]);
    });

    it('reads a glyph that arrives already decoded', () => {
        expect(iconNamesIn('.fa-gem::before{content:""}')[0].glyph).toBe('');
    });

    it('gives every name in a grouped selector the same glyph', () => {
        const found = iconNamesIn('.fa-home:before,.fa-house:before{content:"\\f015"}');

        expect(found.map((icon) => icon.name)).toEqual(['fa-home', 'fa-house']);
    });

    it('ignores a class with no glyph behind it', () => {
        // Offering these hands the client an empty square.
        expect(iconNamesIn('.fa-fw{width:1.25em}.icon-bar:before{content:""}')).toEqual([]);
    });

    it('takes any icon font, not only Font Awesome', () => {
        const css = '.flaticon-ship:before{content:"\\e001"}.ti-close:before{content:"\\e646"}';

        expect(iconNamesIn(css).map((icon) => icon.name)).toEqual(['flaticon-ship', 'ti-close']);
    });

    it('survives a stylesheet it cannot make sense of', () => {
        expect(iconNamesIn('@media screen{')).toEqual([]);
        expect(iconNamesIn('')).toEqual([]);
    });
});

describe('classListWith', () => {
    it('swaps the face classes and keeps the theme styling', () => {
        // Spectral: "icon" is the regular face, "icon solid" the solid one.
        // The decoration classes are the client's design and must survive.
        const result = classListWith(
            ['icon', 'fa-gem', 'major', 'style1'],
            'fa-rocket',
            'fa-gem',
            ['icon'],
            ['icon', 'solid']
        );

        expect(result.split(' ').sort()).toEqual(['fa-rocket', 'icon', 'major', 'solid', 'style1'].sort());
    });

    it('drops a face class the new variant does not use', () => {
        const result = classListWith(
            ['icon', 'solid', 'fa-rocket'],
            'fa-gem',
            'fa-rocket',
            ['icon', 'solid'],
            ['icon']
        );

        expect(result.split(' ')).not.toContain('solid');
        expect(result.split(' ')).toContain('icon');
    });

    it('does not repeat a class both variants share', () => {
        const result = classListWith(['icon', 'fa-gem'], 'fa-star', 'fa-gem', ['icon'], ['icon']);

        expect(result.split(' ').filter((cls) => cls === 'icon')).toHaveLength(1);
    });
});

describe('displayedValue', () => {
    it('prefers a recorded value over the words in the markup', () => {
        // A counter's words are a placeholder its script replaces.
        expect(displayedValue({ editValue: '3670', ownText: '00', fullText: '00' })).toBe('3670');
    });

    it('shows the element own words when it has them', () => {
        // Not the children's: replacing them must not swallow a nested link.
        expect(displayedValue({ editValue: undefined, ownText: 'Read ', fullText: 'Read more' })).toBe('Read ');
    });

    it('falls back to the words it wraps when it has none of its own', () => {
        // "<a data-edit><span>Request a Quote</span></a>" opened a blank box.
        expect(displayedValue({ editValue: undefined, ownText: '  ', fullText: 'Request a Quote' }))
            .toBe('Request a Quote');
    });

    it('is empty only when there is genuinely nothing there', () => {
        expect(displayedValue({ editValue: '', ownText: '', fullText: '' })).toBe('');
    });
});

describe('orderedIcons', () => {
    const solid = { face: 'solid', variant: {}, icons: [{ name: 'fa-zoo' }, { name: 'fa-apple' }] };
    const regular = { face: 'regular', variant: null, icons: [{ name: 'fa-apple' }, { name: 'fa-book' }] };

    it('mixes the faces instead of listing them in blocks', () => {
        // Face by face, a screenful was a wall of one style and the last face
        // never appeared at all.
        expect(orderedIcons([regular, solid]).map((i) => i.name)).toEqual(['fa-apple', 'fa-book', 'fa-zoo']);
    });

    it('keeps a name from the face offered first', () => {
        // The element's own face comes first, so a name it can already draw
        // needs no change of classes.
        const [apple] = orderedIcons([regular, solid]).filter((i) => i.name === 'fa-apple');

        expect(apple.face).toBe('regular');
        expect(apple.variant).toBeNull();
    });

    it('offers each name once', () => {
        const names = orderedIcons([regular, solid]).map((i) => i.name);

        expect(names).toHaveLength(new Set(names).size);
    });

    it('copes with a theme that uses one face', () => {
        expect(orderedIcons([solid]).map((i) => i.name)).toEqual(['fa-apple', 'fa-zoo']);
        expect(orderedIcons([])).toEqual([]);
    });
});
