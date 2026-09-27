import { act, cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readBridge } from '../../packages/react/src/bridge.js';
import { LiveEditProvider } from '../../packages/react/src/provider.js';
import { useContent } from '../../packages/react/src/useContent.js';

const Heading = () => <h1>{useContent('auto:abc', 'Original words')}</h1>;

const wrap = (ui, props = {}) =>
    render(
        <LiveEditProvider site="acme" apiBase="https://cms.test/api/live-edit/v1" publishableKey="kbp_x" {...props}>
            {ui}
        </LiveEditProvider>
    );

describe('LiveEditProvider', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ settings: {}, styles: {} }),
            })
        );
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('renders the words already in the component when there is no content', () => {
        wrap(<Heading />);

        expect(screen.getByRole('heading').textContent).toBe('Original words');
    });

    it('renders the component own words with no provider at all', () => {
        // Adding this to an app must not be able to leave a page blank.
        render(<Heading />);

        expect(screen.getByRole('heading').textContent).toBe('Original words');
    });

    it('prefers published content over the original words', () => {
        wrap(<Heading />, { content: { 'auto:abc': 'Published words' } });

        expect(screen.getByRole('heading').textContent).toBe('Published words');
    });

    it('treats a cleared value as an edit, not as missing', () => {
        // Somebody deleted the heading. Springing back to the original would
        // look like the editor refusing to do as it was told.
        wrap(<Heading />, { content: { 'auto:abc': '' } });

        expect(screen.getByRole('heading').textContent).toBe('');
    });

    it('does not fetch when the server already supplied the content', () => {
        wrap(<Heading />, { content: { 'auto:abc': 'From the server' } });

        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('fetches when nothing was supplied', async () => {
        await act(async () => {
            wrap(<Heading />);
        });

        expect(globalThis.fetch).toHaveBeenCalledOnce();
        expect(globalThis.fetch.mock.calls[0][0]).toContain('/acme/content');
    });

    describe('with an edit session', () => {
        const editing = { sessionKey: 'kbe_x', content: { 'auto:abc': 'Published words' } };

        it('an edit survives a re-render', async () => {
            // The measured failure this whole package exists for: a value
            // written into the DOM is undone by the next render.
            const Counter = () => {
                const [n, setN] = useState(0);
                return (
                    <>
                        <Heading />
                        <button onClick={() => setN(n + 1)}>bump {n}</button>
                    </>
                );
            };

            await act(async () => {
                wrap(<Counter />, editing);
            });

            await act(async () => {
                readBridge().set('auto:abc', 'Edited live');
            });

            expect(screen.getByRole('heading').textContent).toBe('Edited live');

            // Force an unrelated re-render, which is what used to lose it.
            await act(async () => {
                screen.getByRole('button').click();
            });

            expect(screen.getByRole('heading').textContent).toBe('Edited live');
        });

        it('an edit survives a client-side navigation', async () => {
            // Routing unmounts the page, not the provider. The measured
            // failure was tags dying on navigation; state above the router
            // does not.
            const Page = ({ name }) => (
                <>
                    <Heading />
                    <span>page {name}</span>
                </>
            );

            const App = () => {
                const [page, setPage] = useState('home');
                return (
                    <>
                        <Page key={page} name={page} />
                        <button onClick={() => setPage('about')}>go</button>
                    </>
                );
            };

            await act(async () => {
                wrap(<App />, editing);
            });

            await act(async () => {
                readBridge().set('auto:abc', 'Edited live');
            });

            await act(async () => {
                screen.getByRole('button').click();
            });

            expect(screen.getByText('page about')).toBeTruthy();
            expect(screen.getByRole('heading').textContent).toBe('Edited live');
        });

        it('sends one save per pause, not one per keystroke', async () => {
            vi.useFakeTimers();

            await act(async () => {
                wrap(<Heading />, editing);
            });

            act(() => {
                'Northfield'.split('').forEach((_, i) => {
                    readBridge().set('auto:abc', 'Northfield'.slice(0, i + 1));
                });
            });

            expect(globalThis.fetch).not.toHaveBeenCalled();

            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            expect(globalThis.fetch).toHaveBeenCalledOnce();
            expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body).value).toBe('Northfield');

            vi.useRealTimers();
        });

        it('sends the session key, not the publishable one', async () => {
            vi.useFakeTimers();

            await act(async () => {
                wrap(<Heading />, editing);
            });

            act(() => readBridge().set('auto:abc', 'x'));
            await act(async () => vi.advanceTimersByTime(1000));

            expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer kbe_x');

            vi.useRealTimers();
        });

        it('keeps the typed words visible when a save fails', async () => {
            // Reverting on failure is how a person loses a paragraph without
            // being told anything went wrong.
            vi.useFakeTimers();
            vi.spyOn(console, 'error').mockImplementation(() => {});
            globalThis.fetch = vi.fn(() => Promise.reject(new Error('offline')));

            await act(async () => {
                wrap(<Heading />, editing);
            });

            act(() => readBridge().set('auto:abc', 'Typed but not saved'));
            await act(async () => vi.advanceTimersByTime(1000));

            expect(screen.getByRole('heading').textContent).toBe('Typed but not saved');

            vi.useRealTimers();
        });
    });

    it('a page without a session cannot write', async () => {
        vi.useFakeTimers();

        await act(async () => {
            wrap(<Heading />, { content: { 'auto:abc': 'Published words' } });
        });

        expect(readBridge().editable).toBe(false);

        act(() => readBridge().set('auto:abc', 'Attempted'));
        await act(async () => vi.advanceTimersByTime(1000));

        expect(globalThis.fetch).not.toHaveBeenCalled();

        vi.useRealTimers();
    });
});

describe('telling the editor what happened', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ settings: {} }),
            })
        );
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('reports a key a hook is reading as bound', async () => {
        await act(async () => {
            render(
                <LiveEditProvider site="a" apiBase="https://x.test" publishableKey="k" content={{ 'auto:abc': 'x' }}>
                    <Heading />
                </LiveEditProvider>
            );
        });

        let bound;
        await act(async () => {
            bound = readBridge().set('auto:abc', 'new');
        });

        expect(bound).toBe(true);
    });

    it('reports a key nothing is reading as unbound', async () => {
        // An element inside a server component: same marker, no hook. Setting
        // state changes nothing, and the editor has to know to fetch the page
        // again rather than report success over unchanged words.
        await act(async () => {
            render(
                <LiveEditProvider site="a" apiBase="https://x.test" publishableKey="k" content={{}}>
                    <Heading />
                </LiveEditProvider>
            );
        });

        let bound;
        await act(async () => {
            bound = readBridge().set('auto:server-only', 'new');
        });

        expect(bound).toBe(false);
    });

    it('stops reporting a key once the element leaves the page', async () => {
        const Toggle = () => {
            const [on, setOn] = useState(true);
            return (
                <>
                    {on ? <Heading /> : null}
                    <button onClick={() => setOn(false)}>hide</button>
                </>
            );
        };

        await act(async () => {
            render(
                <LiveEditProvider site="a" apiBase="https://x.test" publishableKey="k" content={{ 'auto:abc': 'x' }}>
                    <Toggle />
                </LiveEditProvider>
            );
        });

        await act(async () => screen.getByRole('button').click());

        let bound;
        await act(async () => {
            bound = readBridge().set('auto:abc', 'new');
        });

        expect(bound).toBe(false);
    });

    it('refreshes the way the host asked', async () => {
        const onRefresh = vi.fn();

        await act(async () => {
            render(
                <LiveEditProvider site="a" apiBase="https://x.test" publishableKey="k" content={{ 'auto:abc': 'x' }} onRefresh={onRefresh}>
                    <Heading />
                </LiveEditProvider>
            );
        });

        await act(async () => readBridge().refresh());

        // A Next app passes router.refresh here, so server components re-render
        // without throwing away what the visitor was doing.
        expect(onRefresh).toHaveBeenCalledOnce();
    });
});

describe('applying a value the editor already stored', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn(() =>
            Promise.resolve({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ settings: {} }) })
        );
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('shows it without sending it a second time', async () => {
        // The editor saves through its own request and then tells React what
        // it wrote. Calling set() there would write again: two requests per
        // edit, double the throttle spent, and two versions of the truth.
        vi.useFakeTimers();

        await act(async () => {
            render(
                <LiveEditProvider site="a" apiBase="https://x.test" publishableKey="k" sessionKey="kbe_x" content={{ 'auto:abc': 'Published' }}>
                    <Heading />
                </LiveEditProvider>
            );
        });

        let bound;
        await act(async () => {
            bound = readBridge().apply('auto:abc', 'Already saved');
        });
        await act(async () => vi.advanceTimersByTime(2000));

        expect(screen.getByRole('heading').textContent).toBe('Already saved');
        expect(bound).toBe(true);
        expect(globalThis.fetch).not.toHaveBeenCalled();

        vi.useRealTimers();
    });
});
