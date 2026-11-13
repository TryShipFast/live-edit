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
        refused.buy = body.credits?.buy ?? null;
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

    it('remembers which part it changed, so "make it bigger" next is about that part', async () => {
        // owner, 13 Nov 2026: "if i type change heading and now make it bigger, does it still know it's the heading"
        const action = { type: 'field', kind: 'text', label: 'Heading at the top', key: 'tpl:h1', value: 'Fresh bread' };
        chatWith([
            () => answer({ reply: 'Done. Have a look on the page.', actions: [action], cards: [] }),
            () => answer({ reply: 'It is bigger now.', actions: [], cards: [] }),
        ]);

        await type('Change the heading at the top to Fresh bread');
        await type('Now make it bigger');

        expect(calls.at(-1).body.history).toEqual([
            { role: 'user', text: 'Change the heading at the top to Fresh bread' },
            { role: 'assistant', text: 'Done. Have a look on the page.\n[Changed: Heading at the top (tpl:h1)]' },
        ]);
    });

    it('draws the page again after a business detail changes, so every copy shows it', async () => {
        const action = { type: 'business', key: 'brand.phone', value: '0803 111 2222', label: 'Phone' };
        chatWith([() => answer({ reply: 'Your number is changed everywhere.', actions: [action], cards: [] })]);
        deps.act.mockImplementationOnce(async () => ({ ok: true, reload: true }));

        await type('Change my phone number to 0803 111 2222');

        expect(host.querySelector('.le-chat-card').textContent).toContain('Phone: “0803 111 2222”, on every page');
        expect(deps.showSaved).toHaveBeenLastCalledWith('Saved \u2713', { reload: true });
    });

    it('keeps one conversation for the whole website, saying which page each message was on', async () => {
        // owner, 13 Nov 2026: "seems ask AI feels new on each page"
        sessionStorage.setItem('le-chat:oxbow', JSON.stringify({ log: [
            { role: 'user', text: 'Take me to the Book page', page: '/edit/' },
            { role: 'assistant', text: 'Going there now.', page: '/edit/' },
        ], open: true }));
        chatWith([() => answer({ reply: 'Done.', actions: [], cards: [] })]);

        expect(host.textContent).toContain('Take me to the Book page');
        await type('Make free delivery over 80,000');

        expect(calls.at(-1).body.history).toEqual([
            { role: 'user', text: '[On the page /edit/] Take me to the Book page' },
            { role: 'assistant', text: '[On the page /edit/] Going there now.' },
        ]);
    });

    it('collects the answer when the host answers on its queue', async () => {
        const action = { type: 'field', kind: 'text', label: 'Heading', key: 'tpl:h1', value: 'Made in Lagos.' };
        chatWith([
            () => answer({ id: '0b6f2a8e-1c1d-4a55-9a51-2f6d8b1c0a11', waiting: true }, 202),
            () => answer({ id: '0b6f2a8e-1c1d-4a55-9a51-2f6d8b1c0a11', waiting: true }, 202),
            () => answer({ reply: 'I changed the headline.', actions: [action], cards: [] }),
        ]);
        host.querySelector('textarea').value = 'Change the headline';
        host.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await flush();
        await flush();

        expect(calls.map((call) => call.url)).toEqual(['/live-edit/assistant/chat', '/live-edit/assistant/chat/0b6f2a8e-1c1d-4a55-9a51-2f6d8b1c0a11', '/live-edit/assistant/chat/0b6f2a8e-1c1d-4a55-9a51-2f6d8b1c0a11']);
        expect(deps.act).toHaveBeenCalledWith(action);
        expect(host.textContent).toContain('I changed the headline.');
    });

    it('says when a message did not use a credit', async () => {
        chatWith([() => answer({ reply: 'Sorry, I could not make that change on this page.', actions: [], cards: [], credits: { balance: 5, cost: 1, refunded: true } })]);
        await type('Change the thing');
        expect(host.textContent).toContain('This one did not use a credit.');
    });

    it('knows the part the owner clicked while the chat was open', async () => {
        let clicked = null;
        chatWith([() => answer({ reply: 'Done.', actions: [], cards: [] })]);
        host.replaceChildren();
        createChat({ shadow: host, site: 'oxbow', ...deps, selected: () => clicked }).open();
        expect(host.querySelector('.le-chat-about').hidden).toBe(true);

        clicked = document.querySelector('h1');
        host.querySelector('textarea').dispatchEvent(new Event('focus'));
        expect(host.querySelector('.le-chat-about').textContent).toContain('About: Heading');

        await type('Make this shorter');
        expect(calls[0].body.tapped).toEqual({ key: 'tpl:h1', kind: 'text', label: 'Heading' });
    });

    it('opens about a part from its own panel, with what owners ask of that part', () => {
        chatWith([]);
        host.replaceChildren();
        const chat = createChat({ shadow: host, site: 'oxbow', ...deps });
        chat.openAbout(document.querySelector('h1'));

        expect(host.querySelector('.le-chat-about').textContent).toContain('About: Heading');
        expect([...host.querySelectorAll('.le-chat-tip')].map((tip) => tip.textContent)).toEqual(['Rewrite this', 'Make this shorter', 'Make this sound more friendly']);
    });

    it('sends a one-press Rewrite or Shorten from a part\'s panel at once, about that part', async () => {
        chatWith([() => answer({ reply: 'I made it shorter.', actions: [], cards: [] })]);
        host.replaceChildren();
        createChat({ shadow: host, site: 'oxbow', ...deps }).openAbout(document.querySelector('h1'), 'Make this shorter');
        await flush();
        await flush();

        expect(calls[0].body.message).toBe('Make this shorter');
        expect(calls[0].body.tapped).toEqual({ key: 'tpl:h1', kind: 'text', label: 'Heading' });
        expect(host.textContent).toContain('I made it shorter.');
    });

    it('says a change of look in the panel\'s own words', async () => {
        chatWith([() => answer({ reply: 'Bigger and blue.', actions: [{ type: 'style', key: 'sh1', field: 'tpl:h1', props: { fontSize: '40', textColor: '#1b6ef3', textAlign: '' }, label: 'Heading' }], cards: [] })]);
        await type('Make the headline bigger and blue');
        expect(host.querySelector('.le-chat-card').textContent).toContain('Heading: text size 40, text colour #1b6ef3, alignment as designed');
    });

    it('opens from the always-there chat box with what was typed there, sending it on Enter, and says when it shows', async () => {
        chatWith([() => answer({ reply: 'Done.', actions: [], cards: [] })]);
        const shown = [];
        host.replaceChildren();
        const chat = createChat({ shadow: host, site: 'oxbow', ...deps, shown: (open) => shown.push(open) });

        chat.openWith('Make the headline shorter', { send: true });
        await flush();
        await flush();
        expect(calls[0].body.message).toBe('Make the headline shorter');
        expect(host.querySelector('.le-chat').hidden).toBe(false);

        host.querySelector('button[aria-label="Close Ask AI"]').click();
        expect(shown).toEqual([true, false]);
    });

    describe('photos, uploaded in the chat', () => {
        let picked;
        beforeEach(() => {
            picked = new File(['jpeg'], 'shop-front.jpg', { type: 'image/jpeg' });
            // the file picker, as the owner answers it
            vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function () {
                if (this.type !== 'file') return;
                Object.defineProperty(this, 'files', { configurable: true, value: [picked] });
                this.dispatchEvent(new Event('change'));
            });
        });
        afterEach(() => vi.restoreAllMocks());

        it('puts a photo uploaded from the photo card in place at once, with Undo', async () => {
            chatWith([() => answer({ reply: 'Pick a photo below.', actions: [], cards: [{ type: 'photo', key: 'tpl:photo', label: 'Photo' }] })]);
            await type('New main photo');
            buttonNamed('Upload a photo').click();
            await flush();
            await flush();
            await flush();

            expect(deps.act).toHaveBeenCalledWith({ type: 'image', key: 'tpl:photo', label: 'Photo', file: picked, name: 'shop-front.jpg' });
            expect(host.textContent).toContain('Photo: new photo');
            expect(buttonNamed('Undo')).toBeTruthy();
        });

        it('attaches a photo to a message with +, and the chat puts it where the owner said', async () => {
            chatWith([() => answer({ reply: 'It is the main photo now.', actions: [{ type: 'image', key: 'tpl:photo', attachment: 'ID', label: 'Photo' }], cards: [] })]);
            host.querySelector('button[aria-label="Add a photo to your message"]').click();
            expect(host.querySelector('.le-chat-attached').textContent).toContain('shop-front.jpg');
            expect(host.querySelector('textarea').placeholder).toBe('Where does it go?');
            const id = calls.length;
            // the reply names the attachment it was sent with
            deps.request.mockImplementationOnce((url, options) => {
                const body = JSON.parse(options.body);
                calls.push({ url, body });
                return answer({ reply: 'It is the main photo now.', actions: [{ type: 'image', key: 'tpl:photo', attachment: body.attachments[0].id, label: 'Photo' }], cards: [] });
            });
            await type('Make this the main photo');

            expect(calls[id].body.attachments).toEqual([{ id: expect.stringMatching(/^p/), name: 'shop-front.jpg' }]);
            expect(deps.act).toHaveBeenCalledWith(expect.objectContaining({ type: 'image', key: 'tpl:photo', file: picked }));
            expect(host.querySelector('.le-chat-attached').hidden).toBe(true);
            expect(host.querySelector('.le-chat-msg.is-owner').textContent).toBe('Make this the main photo 📎 shop-front.jpg');
        });
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
        buttonNamed('Free photos').click();
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
        sessionStorage.setItem('le-chat:oxbow', JSON.stringify({ log: [{ role: 'user', text: 'Change the headline' }], open: true, waiting: 'Change the headline' }));
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

    it('gives an adapter’s owner the billing page the service names, where there is no window to buy in', async () => {
        chatWith([() => answer({ message: 'You have no AI credits left.', credits: { balance: 0, cost: 1, buy: 'https://live.example.test/billing?site=oxbow#credits' } }, 402)]);
        await type('Change the headline');
        expect(buttonNamed('Add AI credits').getAttribute('href')).toBe('https://live.example.test/billing?site=oxbow#credits');
    });

    it('keeps the conversation through a reload of the page', async () => {
        chatWith([() => answer({ reply: 'Hello again.', changes: [], cards: [], undo: [] })]);
        await type('Hi');
        host.replaceChildren();

        createChat({ shadow: host, site: 'oxbow', request: vi.fn(), showSaved: vi.fn(), openPhoto: vi.fn(), openPublish: vi.fn() }).open();

        expect(host.textContent).toContain('Hi');
        expect(host.textContent).toContain('Hello again.');
    });

    describe('talking instead of typing', () => {
        let peers;
        let tracksStopped;
        let sdpSent;
        beforeEach(() => {
            peers = [];
            tracksStopped = 0;
            sdpSent = [];
            const stream = { getTracks: () => [{ stop: () => { tracksStopped += 1; } }] };
            Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn(async () => stream) } });
            window.RTCPeerConnection = class {
                constructor() { this.closed = false; peers.push(this); }
                addTrack() {}
                createDataChannel(name) { this.channel = { name, listeners: {}, addEventListener: (type, fn) => { this.channel.listeners[type] = fn; }, close: () => {} }; return this.channel; }
                async createOffer() { return { type: 'offer', sdp: 'v=0 offer' }; }
                async setLocalDescription() {}
                async setRemoteDescription(answer) { this.answer = answer; }
                close() { this.closed = true; }
                // what the speech service sends while the owner talks
                hear(event) { this.channel.listeners.message({ data: JSON.stringify(event) }); }
            };
            vi.stubGlobal('fetch', vi.fn(async (url, options) => { sdpSent.push({ url, options }); return new Response('v=0 answer', { status: 201 }); }));
        });
        afterEach(() => {
            delete window.RTCPeerConnection;
            delete navigator.mediaDevices;
            vi.unstubAllGlobals();
        });
        const mic = () => host.querySelector('.le-chat-mic');
        const settle = async () => { for (let i = 0; i < 8; i++) await flush(); };
        const pass = () => answer({ secret: 'ek_pass', url: 'https://speech.test/realtime/calls', seconds: 120 });

        const pause = () => new Promise((resolve) => setTimeout(resolve, 1300));
        const changed = () => answer({ reply: 'I made the headline shorter.', actions: [], cards: [] });

        /*
         * Owner, 13 Nov 2026: "due to accent and noise, the mic might not be interpreting that quite good, add edit";
         * "the mic takes pause and send it"; "so it sends incomplete command most times". A pause sends nothing: the
         * words stay in the box until the owner taps the mic, then they check and correct them, and Send sends.
         */
        it('shows the words as they are spoken, keeps listening through pauses, and sends only on Send', async () => {
            chatWith([pass, changed]);
            const box = host.querySelector('textarea');

            mic().click();
            await settle();
            expect(calls[0].url).toBe('/live-edit/assistant/voice');
            // no hint: the site's name and title were written into what was heard in a pause
            expect(calls[0].body).toEqual({});
            // the microphone goes straight to the speech service with the short-lived pass; no audio to the host
            expect(sdpSent[0].url).toBe('https://speech.test/realtime/calls');
            expect(sdpSent[0].options.headers.Authorization).toBe('Bearer ek_pass');
            expect(peers[0].channel.name).toBe('oai-events');
            expect(mic().classList.contains('is-recording')).toBe(true);
            expect(box.placeholder).toBe('Listening… tap the mic when you finish');

            peers[0].hear({ type: 'input_audio_buffer.speech_started' });
            peers[0].hear({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'a', delta: 'make the head' });
            expect(box.value).toBe('make the head');
            peers[0].hear({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'a', delta: 'line shorter' });
            peers[0].hear({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'a', transcript: 'Make the headline shorter.' });
            expect(box.value).toBe('Make the headline shorter.');

            // a pause sends nothing and listening goes on
            await pause();
            await settle();
            expect(calls).toHaveLength(1);
            expect(mic().classList.contains('is-recording')).toBe(true);
            peers[0].hear({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'b', transcript: 'And say we deliver.' });

            // done: the mic tapped, the words stay to check
            mic().click();
            await settle();
            await new Promise((resolve) => setTimeout(resolve, 20));
            await settle();
            expect(peers[0].closed).toBe(true);
            expect(tracksStopped).toBe(1);
            expect(calls).toHaveLength(1);
            expect(box.value).toBe('Make the headline shorter. And say we deliver.');

            // corrected by hand, then sent
            box.value = 'Make the headline shorter. And say we deliver to Abuja.';
            box.dispatchEvent(new Event('input'));
            host.querySelector('.le-chat-send').click();
            await settle();
            expect(calls[1].url).toBe('/live-edit/assistant/chat');
            expect(calls[1].body.message).toBe('Make the headline shorter. And say we deliver to Abuja.');
            expect(host.textContent).toContain('I made the headline shorter.');
        });

        it('waits for the last words when the mic is tapped mid-sentence, and leaves them to send', async () => {
            chatWith([pass, changed]);
            mic().click();
            await settle();
            peers[0].hear({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'a', delta: 'Change the opening' });
            mic().click();
            await settle();
            // mid-sentence: the microphone is off and the last words are awaited, not cut short
            peers[0].hear({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'a', transcript: 'Change the opening hours.' });
            await settle();
            await new Promise((resolve) => setTimeout(resolve, 20));
            await settle();
            expect(calls).toHaveLength(1);
            expect(host.querySelector('textarea').value).toBe('Change the opening hours.');
        });

        it('does not send a cough or one word, and keeps it in the box', async () => {
            chatWith([pass]);
            mic().click();
            await settle();
            peers[0].hear({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'a', transcript: 'Um.' });
            await pause();
            await settle();
            expect(calls).toHaveLength(1);
            expect(host.querySelector('textarea').value).toBe('Um.');
        });

        it('stops listening on Escape and keeps the words, without sending', async () => {
            chatWith([pass]);
            mic().click();
            await settle();
            peers[0].hear({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'a', delta: 'Change the hours' });
            host.querySelector('.le-chat').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await pause();
            await settle();
            expect(peers[0].closed).toBe(true);
            expect(calls).toHaveLength(1);
            expect(host.querySelector('textarea').value).toBe('Change the hours');
        });

        describe('the browser’s own speech recognition, as the backup', () => {
            let recognitions;
            beforeEach(() => {
                recognitions = [];
                window.webkitSpeechRecognition = class {
                    constructor() { this.listeners = {}; this.started = false; recognitions.push(this); }
                    addEventListener(name, fn) { this.listeners[name] = fn; }
                    start() { this.started = true; }
                    stop() { this.listeners.end?.(); }
                    abort() { this.aborted = true; this.listeners.end?.(); }
                    // what the browser hears: words growing, then settled at a pause
                    hear(index, transcript, isFinal) {
                        const results = [];
                        results[index] = Object.assign([{ transcript }], { isFinal });
                        this.listeners.result({ resultIndex: index, results });
                    }
                };
            });
            afterEach(() => { delete window.webkitSpeechRecognition; delete window.liveEditChat; });

            it('hears with the browser when the host has no OpenAI, and keeps the words for Send', async () => {
                window.liveEditChat = { voice: false };
                chatWith([changed]);
                const box = host.querySelector('textarea');
                mic().click();
                await settle();
                // nothing asked of the host or the speech service: the browser hears
                expect(calls).toHaveLength(0);
                expect(peers).toHaveLength(0);
                expect(recognitions[0].started).toBe(true);
                expect(mic().classList.contains('is-recording')).toBe(true);

                recognitions[0].hear(0, 'make the head', false);
                expect(box.value).toBe('make the head');
                recognitions[0].hear(0, 'make the headline shorter', true);
                await pause();
                await settle();
                expect(calls).toHaveLength(0);
                mic().click();
                await settle();
                await new Promise((resolve) => setTimeout(resolve, 20));
                expect(box.value).toBe('make the headline shorter');
                host.querySelector('.le-chat-send').click();
                await settle();
                expect(calls[0].url).toBe('/live-edit/assistant/chat');
                expect(calls[0].body.message).toBe('make the headline shorter');
                expect(recognitions[0].aborted).toBe(true);
            });

            it('hears with the browser when the speech service cannot be reached', async () => {
                chatWith([() => answer({ message: 'Talking is not available just now.' }, 503)]);
                mic().click();
                await settle();
                expect(calls[0].url).toBe('/live-edit/assistant/voice');
                expect(recognitions).toHaveLength(1);
                expect(mic().classList.contains('is-recording')).toBe(true);
            });
        });

        it('shows no mic where nothing can hear: never a dead button', () => {
            window.liveEditChat = { voice: false };
            try {
                chatWith([]);
                expect(mic().hidden).toBe(true);
            } finally {
                delete window.liveEditChat;
            }
            host.replaceChildren();
            delete window.RTCPeerConnection;
            chatWith([]);
            expect(mic().hidden).toBe(true);
        });

        it('shows the mic where OpenAI can hear, even in a browser that cannot hear by itself', () => {
            chatWith([]);
            expect(mic().hidden).toBe(false);
        });

        it('says what to do when the microphone is not allowed', async () => {
            navigator.mediaDevices.getUserMedia = vi.fn(async () => { throw new DOMException('denied', 'NotAllowedError'); });
            chatWith([pass]);
            mic().click();
            await settle();
            expect(host.querySelector('.le-chat-soon').textContent).toBe('Allow the microphone for this website in your browser, then tap again.');
            expect(mic().classList.contains('is-recording')).toBe(false);
        });

        it('offers credits when there are none, as a typed message does, before listening', async () => {
            window.liveEditChat = { buy: { packs: async () => ({ packs: [{ credits: 100, price: '₦5,000' }] }), pay: vi.fn() } };
            try {
                chatWith([() => answer({ message: 'You have no AI credits left. Add some, and I will carry on from here.' }, 402)]);
                mic().click();
                await settle();
                expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
                expect(host.querySelector('.le-chat-card h3').textContent).toBe('Add AI credits');
            } finally {
                delete window.liveEditChat;
            }
        });
    });

    it('suggests only what the page has, in words a person uses', () => {
        expect(startersFor({ fields: [], lists: [] })).toEqual(['What can I change on this page?']);
        expect(startersFor({ fields: [], lists: [{ label: 'Media' }, { label: 'Questions' }] })).toContain('Add another question');
        expect(startersFor({ fields: [], lists: [{ label: 'Media' }] })).toEqual(['What can I change on this page?']);
        // the page's furniture is never offered (the novice walk: "Add another to buttons" read as jargon)
        expect(startersFor({ fields: [], lists: [{ label: 'Buttons' }, { label: 'Menu' }] })).toEqual(['What can I change on this page?']);
        expect(startersFor({ fields: [], lists: [{ label: 'Team' }] })).toContain('Add to team');
        // a heading named with its section still offers the headline idea
        expect(startersFor({ fields: [{ kind: 'text', label: 'Heading in Talks' }], lists: [] })).toContain('Make the headline shorter and punchier');
    });
});
