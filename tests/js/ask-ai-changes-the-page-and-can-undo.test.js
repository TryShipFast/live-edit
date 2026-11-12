import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';
import { createChat, startersFor } from '../../resources/js/chat.js';

/*
 * Ask AI (chat.js; LIVE-EDIT-STRUCTURE.md section 13; owner, 12 Nov 2026): a message goes to the session's API with
 * the page; a change shows at once with Keep and Undo; a photo opens that picture's panel; Publish opens the
 * editor's own window; no credits says so with where to add some.
 */
const answer = (body, status = 200) => {
    if (status >= 400) {
        const refused = new Error(body.message);
        refused.status = status;
        return Promise.reject(refused);
    }

    return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Ask AI', () => {
    let host;
    let calls;
    let deps;

    const chatWith = (replies) => {
        calls = [];
        deps = {
            request: vi.fn((url, options) => {
                calls.push({ url, body: typeof options.body === 'string' ? JSON.parse(options.body) : options.body });
                return replies.shift()();
            }),
            showSaved: vi.fn(async () => {}),
            openPhoto: vi.fn(),
            openPublish: vi.fn(),
            act: vi.fn(async (action) => (action.key === 'tpl:held' ? { ok: false, locked: { name: 'Ada', label: 'Hero' } } : { ok: true })),
            snapshot: vi.fn(async () => ({ drafted: [], settings: {}, styles: {} })),
            undoPlan: vi.fn(() => ({ revert: [{ key: 'tpl:h1', kind: 'setting' }], restore: [] })),
            undo: vi.fn(async () => {}),
            busy: vi.fn(() => [{ label: 'Hero', name: 'Ada' }]),
        };
        const chat = createChat({ shadow: host, site: 'oxbow', ...deps });
        chat.open();

        return chat;
    };

    const type = async (text) => {
        const input = host.querySelector('textarea');
        input.value = text;
        host.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();
        await flush();
    };

    const buttonNamed = (name) => [...host.querySelectorAll('button, a')].find((node) => node.textContent.trim() === name);

    beforeEach(() => {
        sessionStorage.clear();
        document.body.innerHTML = `
            <section data-edit-section="hero" data-edit-section-label="Hero">
                <h1 data-edit="setting:tpl:h1">Cut to fit. Made to last.</h1>
                <img alt="A woman laughing" data-edit-img="setting:tpl:photo" src="/a.jpg">
            </section>`;
        host = document.createElement('div');
        document.body.append(host);
    });

    it('greets with suggestions from the page and sends the page with the message', async () => {
        chatWith([() => answer({ reply: 'I made it shorter.', changes: [], cards: [], undo: [], credits: { balance: 9, cost: 1 } })]);

        expect([...host.querySelectorAll('.le-chat-tip')].map((tip) => tip.textContent)).toContain('Replace the main photo');
        await type('Make the headline shorter');

        expect(calls[0].url).toBe('/live-edit/assistant/chat');
        expect(calls[0].body.message).toBe('Make the headline shorter');
        expect(calls[0].body.page.fields.map((field) => field.key)).toEqual(['tpl:h1', 'tpl:photo']);
        expect(host.textContent).toContain('I made it shorter.');
        expect(host.querySelector('.le-chat-foot').textContent).toBe('Each message uses 1 AI credit. 9 left.');
    });

    it('has the editor make each planned change, then offers Keep and Undo, and Undo takes it back the editor’s way', async () => {
        const action = { type: 'field', kind: 'text', label: 'Heading', key: 'tpl:h1', value: 'Cut to fit. Made in Lagos.' };
        chatWith([() => answer({ reply: 'I changed the headline at the top.', actions: [action], cards: [] })]);

        await type('Change the headline to Cut to fit. Made in Lagos.');

        // the editor made it, as a press does; the parts teammates hold were sent with the message
        expect(deps.act).toHaveBeenCalledWith(action);
        expect(calls[0].body.busy).toEqual([{ label: 'Hero', name: 'Ada' }]);
        expect(deps.snapshot).toHaveBeenCalledTimes(2);
        expect(host.querySelector('.le-chat-card').textContent).toContain('Heading: “Cut to fit. Made in Lagos.”');

        buttonNamed('Undo').click();
        await flush();
        await flush();

        expect(deps.undo).toHaveBeenCalledWith({ revert: [{ key: 'tpl:h1', kind: 'setting' }], restore: [] });
        // the page is drawn again, as the editor's own Undo does
        expect(deps.showSaved).toHaveBeenLastCalledWith('Undone', { reload: true });
        expect(host.textContent).toContain('Undone.');
    });

    it('says what it could not change because a teammate is working there', async () => {
        chatWith([() => answer({ reply: 'Done.', actions: [
            { type: 'field', kind: 'text', label: 'Opening hours', key: 'tpl:hours', value: 'Mon to Sat, 9 to 7' },
            { type: 'field', kind: 'text', label: 'Heading', key: 'tpl:held', value: 'New' },
        ], cards: [] })]);

        await type('Change the headline and the opening hours');

        expect(host.querySelector('.le-chat-card').textContent).toContain('Opening hours');
        expect(host.querySelector('.le-chat-held').textContent).toBe('Not changed: Heading. Ada is editing Hero right now.');
    });

    it('opens the picture’s own photo panel, and the editor’s own Publish window', async () => {
        chatWith([() => answer({
            reply: 'Pick a photo below, then publish when ready.',
            changes: [],
            cards: [{ type: 'photo', key: 'tpl:photo', label: 'Photo', suggestion: 'Your shop front' }, { type: 'publish' }],
            undo: [],
        })]);

        await type('New photo please, then put it live');

        expect(host.textContent).toContain('Idea: Your shop front');
        buttonNamed('Choose a photo').click();
        expect(deps.openPhoto).toHaveBeenCalledWith('tpl:photo');
        buttonNamed('Publish…').click();
        expect(deps.openPublish).toHaveBeenCalled();
    });

    it('says when the credits have run out, with where to add some', async () => {
        window.liveEditChat = { credits: 'https://live.example.test/billing#ai-credits' };
        try {
            chatWith([() => answer({ message: 'You have no AI credits left. Add some, and I will carry on from here.' }, 402)]);
            await type('Change the headline');
            expect(host.textContent).toContain('You have no AI credits left.');
            expect(buttonNamed('Add AI credits').getAttribute('href')).toBe('https://live.example.test/billing#ai-credits');
        } finally {
            delete window.liveEditChat;
        }
    });

    it('sends the owner to their billing page’s credits when the host gives one', async () => {
        window.liveEditEditor = { billing: 'https://live.example.test/billing?site=oxbow' };
        try {
            chatWith([() => answer({ message: 'You have no AI credits left.' }, 402)]);
            await type('Change the headline');
            expect(buttonNamed('Add AI credits').getAttribute('href')).toBe('https://live.example.test/billing?site=oxbow#credits');
        } finally {
            delete window.liveEditEditor;
        }
    });

    it('sells credits over the editor when they run out, then sends the waiting message', async () => {
        window.liveEditChat = { buy: {
            packs: vi.fn(async () => ({ packs: [{ credits: 50, price: '₦2,500' }, { credits: 200, price: '₦8,000', featured: true }, { credits: 500, price: '₦18,000' }] })),
            pay: vi.fn(async () => ({ paid: true, balance: 200 })),
        } };
        try {
            chatWith([
                () => answer({ message: 'You have no AI credits left. Add some, and I will carry on from here.' }, 402),
                () => answer({ reply: 'I changed the headline.', actions: [], cards: [], credits: { balance: 199, cost: 1 } }),
            ]);
            await type('Change the headline');
            await flush();

            expect(host.querySelector('.le-chat-card h3').textContent).toBe('Add AI credits');
            expect([...host.querySelectorAll('.le-chat-pack')].map((row) => row.textContent.trim())).toEqual(['50 credits₦2,500', '200 credits₦8,000', '500 credits₦18,000']);
            // the usual pack chosen
            expect(host.querySelector('.le-chat-pack input:checked').value).toBe('200');
            buttonNamed('Pay with card').click();
            await flush();
            await flush();
            await flush();

            expect(window.liveEditChat.buy.pay).toHaveBeenCalledWith(200);
            expect(calls.map((call) => call.body.message)).toEqual(['Change the headline', 'Change the headline']);
            // said once in the conversation, sent twice
            expect([...host.querySelectorAll('.le-chat-msg.is-owner')].map((m) => m.textContent)).toEqual(['Change the headline']);
            expect(host.textContent).toContain('I changed the headline.');
            expect(host.querySelector('.le-chat-pack')).toBeNull();
        } finally {
            delete window.liveEditChat;
        }
    });

    it('says a closed card window charged nothing, and keeps the packs', async () => {
        window.liveEditChat = { buy: { packs: async () => ({ packs: [{ credits: 50, price: '₦2,500' }] }), pay: async () => ({ cancelled: true }) } };
        try {
            chatWith([() => answer({ message: 'You have no AI credits left.' }, 402)]);
            await type('Change the headline');
            await flush();
            buttonNamed('Pay with card').click();
            await flush();
            await flush();
            expect(host.querySelector('.le-chat-note').textContent).toBe('Payment closed. Nothing was charged.');
            expect(buttonNamed('Pay with card').disabled).toBe(false);
        } finally {
            delete window.liveEditChat;
        }
    });

    it('tells a teammate to ask the owner, who pays', async () => {
        chatWith([() => answer({ message: 'You have no AI credits left.' }, 402)]);
        await type('Change the headline');
        expect(host.textContent).toContain('Ask its owner to add some');
        expect(buttonNamed('Add AI credits')).toBeUndefined();
    });

    it('sends the waiting message when the owner comes back from a card page', async () => {
        sessionStorage.setItem(`le-chat:oxbow:${location.pathname}`, JSON.stringify({ log: [{ role: 'user', text: 'Change the headline' }], open: true, waiting: 'Change the headline' }));
        history.replaceState(null, '', `${location.pathname}?ai-credits=back`);
        try {
            const replies = [() => answer({ reply: 'Done, the headline is new.', actions: [], cards: [] })];
            calls = [];
            const request = vi.fn((url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return replies.shift()(); });
            createChat({ shadow: host, site: 'oxbow', request, showSaved: vi.fn(), openPhoto: vi.fn(), openPublish: vi.fn() }).open();
            await new Promise((resolve) => setTimeout(resolve, 5));
            await flush();
            await flush();
            expect(calls[0].body.message).toBe('Change the headline');
            expect(location.search).toBe('');
            expect(host.textContent).toContain('Done, the headline is new.');
        } finally {
            history.replaceState(null, '', location.pathname);
        }
    });

    it('keeps the conversation through a reload of the page', async () => {
        chatWith([() => answer({ reply: 'Hello again.', changes: [], cards: [], undo: [] })]);
        await type('Hi');
        host.replaceChildren();

        createChat({ shadow: host, site: 'oxbow', request: vi.fn(), showSaved: vi.fn(), openPhoto: vi.fn(), openPublish: vi.fn() }).open();

        expect(host.textContent).toContain('Hi');
        expect(host.textContent).toContain('Hello again.');
    });

    it('opens the photo chooser with +: for the picture selected, or the page’s photos by name', () => {
        chatWith([]);
        const plus = host.querySelector('button[aria-label="Add a photo"]');

        plus.click();
        expect(host.querySelector('.le-chat-photos h3').textContent).toBe('Which photo?');
        buttonNamed('Photo, Hero').click();
        expect(deps.openPhoto).toHaveBeenCalledWith('tpl:photo');
        expect(host.querySelector('.le-chat-photos')).toBeNull();

        deps.openPhoto.mockClear();
        host.replaceChildren();
        createChat({ shadow: host, site: 'oxbow', ...deps, selected: () => document.querySelector('img') }).open();
        host.querySelector('button[aria-label="Add a photo"]').click();
        expect(deps.openPhoto).toHaveBeenCalledWith('tpl:photo');
        expect(host.querySelector('.le-chat-photos')).toBeNull();
    });

    describe('talking instead of typing', () => {
        let recorders;
        let tracksStopped;
        beforeEach(() => {
            recorders = [];
            tracksStopped = 0;
            const stream = { getTracks: () => [{ stop: () => { tracksStopped += 1; } }] };
            Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn(async () => stream) } });
            window.MediaRecorder = class {
                static isTypeSupported(type) { return type === 'audio/webm;codecs=opus'; }
                constructor(_stream, options) { this.mimeType = options?.mimeType ?? ''; this.state = 'inactive'; this.listeners = {}; recorders.push(this); }
                addEventListener(name, fn) { this.listeners[name] = fn; }
                start() { this.state = 'recording'; }
                stop() {
                    this.state = 'inactive';
                    this.listeners.dataavailable?.({ data: new Blob(['opus'], { type: this.mimeType }) });
                    this.listeners.stop?.();
                }
            };
        });
        afterEach(() => {
            delete window.MediaRecorder;
            delete navigator.mediaDevices;
        });
        const mic = () => host.querySelector('.le-chat-mic');
        const settle = async () => { for (let i = 0; i < 6; i++) await flush(); };

        it('records, then puts the words in the box to read and send, and sends nothing itself', async () => {
            chatWith([() => answer({ text: 'Change the headline to Made in Lagos' })]);
            const box = host.querySelector('textarea');

            mic().click();
            await settle();
            expect(mic().classList.contains('is-recording')).toBe(true);
            expect(mic().getAttribute('aria-label')).toBe('Stop, and use what I said');
            expect(box.placeholder).toBe('Listening…');

            mic().click();
            await settle();
            expect(calls[0].url).toBe('/live-edit/assistant/voice');
            expect(box.value).toBe('Change the headline to Made in Lagos');
            expect(tracksStopped).toBe(1);
            expect(mic().classList.contains('is-recording')).toBe(false);
            // read, corrected if need be, then sent by the owner: only the recording went
            expect(calls).toHaveLength(1);
            expect(host.querySelector('.le-chat-msg.is-owner')).toBeNull();
        });

        it('throws the recording away on Escape', async () => {
            chatWith([]);
            mic().click();
            await settle();
            host.querySelector('.le-chat').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await settle();
            expect(deps.request).not.toHaveBeenCalled();
            expect(tracksStopped).toBe(1);
        });

        it('says what to do when the microphone is not allowed', async () => {
            navigator.mediaDevices.getUserMedia = vi.fn(async () => { throw new DOMException('denied', 'NotAllowedError'); });
            chatWith([]);
            mic().click();
            await settle();
            expect(host.querySelector('.le-chat-soon').textContent).toBe('Allow the microphone for this website in your browser, then tap again.');
        });

        it('offers credits when there are none, as a typed message does', async () => {
            window.liveEditChat = { buy: { packs: async () => ({ packs: [{ credits: 100, price: '₦5,000' }] }), pay: vi.fn() } };
            try {
                chatWith([() => answer({ message: 'You have no AI credits left. Add some, and I will carry on from here.' }, 402)]);
                mic().click();
                await settle();
                mic().click();
                await settle();
                expect(host.querySelector('.le-chat-card h3').textContent).toBe('Add AI credits');
            } finally {
                delete window.liveEditChat;
            }
        });
    });

    it('suggests only what the page has, in words a person uses', () => {
        expect(startersFor({ fields: [], lists: [] })).toEqual(['What can I change on this page?']);
        expect(startersFor({ fields: [], lists: [{ label: 'Media' }, { label: 'Questions' }] })).toContain('Add another to questions');
        expect(startersFor({ fields: [], lists: [{ label: 'Media' }] })).toEqual(['What can I change on this page?']);
    });
});
