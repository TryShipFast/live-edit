import { afterEach, describe, expect, it, vi } from 'vitest';
import { WAITS_AT_MOST, givesUpAfter, ranOutOfTime } from '../../resources/js/support.js';

/**
 * "Saving…", and then nothing, for as long as the tab stays open.
 *
 * Hit while testing something else on a live site: the drawer open, the work
 * still in it, the button saying Saving and going on saying it. Nothing had
 * failed, so no message appeared. Nothing had succeeded either. The only way
 * out was a reload, which is the single action guaranteed to lose the change.
 *
 * fetch waits forever by default, and forever is not a state anybody can act
 * on. A request that hangs used to hang the button with it, because the only
 * thing that put the button back was the catch - and nothing was ever thrown.
 *
 * Checked against the database first, since a batch id too long for its column
 * would have failed every save on MySQL: production reports varchar(191), so
 * the column was never it.
 */
afterEach(() => {
    vi.useRealTimers();
});

describe('a save that never finishes', () => {
    it('gives a request a limit rather than letting it hang', () => {
        const signal = givesUpAfter(50);

        expect(signal).toBeInstanceOf(AbortSignal);
        expect(signal.aborted).toBe(false);
    });

    it('aborts once the limit passes', async () => {
        const signal = givesUpAfter(20);

        await new Promise((resolve) => setTimeout(resolve, 60));

        expect(signal.aborted).toBe(true);
    });

    it('waits long enough for a photograph on a slow connection', () => {
        /*
         * The cost of being wrong is asymmetric. Too long and somebody stares
         * at a button for an extra few seconds; too short and a real upload is
         * cancelled mid-flight, which loses work rather than reporting it.
         */
        expect(WAITS_AT_MOST).toBeGreaterThanOrEqual(20000);
    });

    it('recognises its own timeout and not the server talking', () => {
        const timedOut = Object.assign(new Error('signal timed out'), { name: 'TimeoutError' });
        const cancelled = Object.assign(new Error('aborted'), { name: 'AbortError' });
        const refused = new Error('That page is not on your plan.');

        expect(ranOutOfTime(timedOut)).toBe(true);
        expect(ranOutOfTime(cancelled)).toBe(true);
        // Must not be swallowed as a timeout: the server gave a reason, and
        // "try again" is the wrong advice when trying again cannot work.
        expect(ranOutOfTime(refused)).toBe(false);
        expect(ranOutOfTime(undefined)).toBe(false);
    });

    it('gives a photograph longer than a sentence', () => {
        /*
         * One number for a sentence and a six-megabyte upload alike would
         * cancel real uploads on a hotel connection, which loses work rather
         * than reporting it. The multiplier lives in live-edit.js; this pins
         * the headroom it depends on.
         */
        expect(WAITS_AT_MOST * 4).toBeGreaterThanOrEqual(120000);
    });

    it('still works where AbortSignal.timeout does not exist', () => {
        // Safari before 16, Firefox before 100. The fallback matters because
        // the alternative on those browsers is the bug this fixes.
        const had = AbortSignal.timeout;
        // eslint-disable-next-line no-undef
        AbortSignal.timeout = undefined;

        try {
            const signal = givesUpAfter(10);

            expect(signal).toBeInstanceOf(AbortSignal);
            expect(signal.aborted).toBe(false);
        } finally {
            AbortSignal.timeout = had;
        }
    });
});

describe('the tagging request that never answers', () => {
    it('carries a limit, because everything else waits on it', async () => {
        /*
         * Measured on a live install: POST /tag sat pending for over twenty
         * seconds while the identical request from curl answered in one. The
         * page had no toolbar, nothing outlined and nothing clickable for that
         * whole time, because the editor was loaded only once tagging settled
         * and tagging could not fail.
         *
         * Two things were wrong and both are fixed: the request now gives up,
         * and the editor no longer waits for it at all.
         */
        const { autoTag } = await import('../../resources/js/autotag.js');
        const fetched = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ elements: [] }),
        });
        vi.stubGlobal('fetch', fetched);

        document.body.innerHTML = '<h1>Something worth tagging</h1>';
        await autoTag({ base: 'https://x/api', site: 'acme', key: 'kbp_x', page: '/' }, document, { because: 'test' });

        expect(fetched).toHaveBeenCalled();
        expect(fetched.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);

        vi.unstubAllGlobals();
    });
});
