import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A working install that looks like a broken one has to say which it is.
 *
 * A visitor with no session gets the published words and no editor. That is
 * correct, and it is identical from the outside to nothing having worked: no
 * toolbar, nothing to click, and - until this - nothing anywhere saying the
 * runtime had loaded at all.
 *
 * An afternoon went on an install that was working the whole time. Every file
 * loaded, eleven hundred elements were tagged, there was not one error, and
 * the only thing missing was that nobody had opened the door at ?kb-enter=1,
 * which appeared exactly once in all our documentation - as a cell in a table
 * in a file about adapters.
 *
 * So the runtime says it, and the test pins the two halves that make it
 * useful rather than annoying: that it names the door, and that it only
 * speaks where a developer is the one listening.
 */
const boot = () => readFileSync(path.resolve('resources/js/boot.js'), 'utf8');

/** The local-address guard, pulled out of the file rather than rewritten. */
const guard = () => {
    const source = boot();
    const at = source.indexOf('/^(localhost|');
    const end = source.indexOf('.test(window.location.hostname)', at);

    expect(at, 'the local-address guard has moved or been renamed').toBeGreaterThan(-1);

    return new Function(`return ${source.slice(at, end)};`)();
};

describe('a working install says so', () => {
    it('names the door, because that is the thing nobody can guess', () => {
        const source = boot();

        expect(source).toContain('?kb-enter=1');
        expect(source).toMatch(/nobody is signed in/);
    });

    it('says which engine and which site, for somebody reporting it back', () => {
        // The lesson already paid for twice on this project: a fault report
        // without a version costs a day.
        expect(boot()).toMatch(/dataset\.engine/);
    });

    it('speaks on a local address, where somebody is installing this', () => {
        const local = guard();

        expect(local.test('localhost')).toBe(true);
        expect(local.test('127.0.0.1')).toBe(true);
        expect(local.test('newbanger.test')).toBe(true);
        expect(local.test('my-app.localhost')).toBe(true);
    });

    it('says nothing to a visitor on a real site', () => {
        /*
         * The half that keeps this from being a nuisance. A visitor did not
         * ask for our diagnostics and should not be handed them on every page
         * view of somebody's business.
         */
        const local = guard();

        expect(local.test('newbanger.com')).toBe(false);
        expect(local.test('www.learnkasts.com')).toBe(false);
        expect(local.test('shop.example.co.uk')).toBe(false);
        // The one worth stating: a real domain that merely contains the word.
        expect(local.test('testing.example.com')).toBe(false);
    });

    it('is not said to somebody who is already editing', () => {
        // They have a toolbar in front of them; telling them how to get one
        // is noise at exactly the moment the product is working.
        expect(boot()).toMatch(/if \(!editing &&/);
    });
});
