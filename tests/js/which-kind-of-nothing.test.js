import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Telling a server that refused from a request that never arrived.
 *
 * Both print as a CORS error and the fix for each is in a different place, so
 * reporting them as one thing sends whoever reads it to the allowlist when the
 * answer is an extension in their own browser. That happened, and cost an
 * afternoon: the service was answering 200 with the right header to curl while
 * the console insisted the origin was blocked.
 *
 * The decision is pulled out of the shipped file rather than copied into the
 * test, because a copy would keep passing after the real one was changed. The
 * three declarations are adjacent in boot.js and the offsets are asserted, so
 * renaming or moving them fails here loudly instead of quietly testing
 * nothing.
 *
 * boot.js is a classic script that mounts itself off its own script tag - it
 * cannot be imported, which is why this reaches for the source text.
 */
const diagnosis = () => {
    const source = readFileSync(path.resolve('resources/js/boot.js'), 'utf8');

    const opens = source.indexOf('var messageOf = function');
    const closes = source.indexOf("allowlist.';", opens);

    expect(opens, 'messageOf has moved or been renamed in boot.js').toBeGreaterThan(-1);
    expect(closes, 'the advice string has moved or been renamed in boot.js').toBeGreaterThan(-1);

    const declarations = source.slice(opens, closes + "allowlist.';".length);

    return new Function(
        declarations
        + '; return { messageOf, answeredWithAStatus, LOOK_AT_THE_BROWSER };'
    )();
};

const { messageOf, answeredWithAStatus, LOOK_AT_THE_BROWSER } = diagnosis();

describe('which kind of nothing happened', () => {
    it('reads a refusal as a refusal, because it came with a status', () => {
        // What every fetch in the runtime throws when a server answers badly.
        expect(answeredWithAStatus('Tagging answered 403')).toBe(true);
        expect(answeredWithAStatus('Content service answered 500')).toBe(true);
    });

    it('reads a request that never arrived as exactly that', () => {
        // No status, because nothing was there to supply one.
        expect(answeredWithAStatus('Failed to fetch')).toBe(false);
        expect(answeredWithAStatus('NetworkError when attempting to fetch resource.')).toBe(false);
    });

    it('does not take any three digits for a status', () => {
        // "answered" has to be a status, not a word that happens to precede a
        // number - otherwise a blocked request is reported as a refusal and
        // the advice points at the wrong place again.
        expect(answeredWithAStatus('answered 40')).toBe(false);
        expect(answeredWithAStatus('answered in 12 ms')).toBe(false);
    });

    it('sends somebody to their own browser first when nothing answered', () => {
        // The whole point. The allowlist is the expensive place to look and
        // the usual answer is an extension.
        expect(LOOK_AT_THE_BROWSER).toContain('ad blocker');
        expect(LOOK_AT_THE_BROWSER).toContain('extensions off');
        expect(LOOK_AT_THE_BROWSER).toContain('before looking at the allowlist');
    });

    it('says what was thrown even when it was not an Error', () => {
        // The outer catch read .message off whatever arrived and printed
        // "undefined" for a thrown string, which tells a reader nothing.
        expect(messageOf('Failed to fetch')).toBe('Failed to fetch');
        expect(messageOf(new Error('Tagging answered 404'))).toBe('Tagging answered 404');
    });

    it('never prints undefined, whatever it is handed', () => {
        for (const thrown of [null, undefined, 0, {}, new Error('')]) {
            expect(messageOf(thrown)).not.toContain('undefined');
        }
    });
});
