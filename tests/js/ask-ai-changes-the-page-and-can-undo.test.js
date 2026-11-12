import { describe, expect, it, beforeEach, vi } from 'vitest';
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
                calls.push({ url, body: JSON.parse(options.body) });
                return replies.shift()();
            }),
            showSaved: vi.fn(async () => {}),
            openPhoto: vi.fn(),
            openPublish: vi.fn(),
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

    it('shows a change at once, with Keep and Undo, and Undo puts it back', async () => {
        const undo = [{ type: 'field', key: 'tpl:h1', value: 'Cut to fit. Made to last.', discard: true }];
        chatWith([
            () => answer({ reply: 'I changed the headline at the top.', changes: [{ type: 'field', label: 'Heading', kind: 'text', key: 'tpl:h1', value: 'Cut to fit. Made in Lagos.' }], cards: [], undo }),
            () => answer({ undone: true }),
        ]);

        await type('Change the headline to Cut to fit. Made in Lagos.');

        expect(deps.showSaved).toHaveBeenCalledWith('Changed');
        expect(host.querySelector('.le-chat-card').textContent).toContain('Heading: “Cut to fit. Made in Lagos.”');
        expect(buttonNamed('Keep')).toBeTruthy();

        buttonNamed('Undo').click();
        await flush();
        await flush();

        expect(calls[1]).toEqual({ url: '/live-edit/assistant/chat/undo', body: { undo } });
        // the draft was the first of that part, so it is gone: the page is drawn again, as the editor's own Undo does
        expect(deps.showSaved).toHaveBeenLastCalledWith('Undone', { reload: true });
        expect(host.textContent).toContain('Undone.');
        expect(buttonNamed('Undo')).toBeUndefined();
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

    it('keeps the conversation through a reload of the page', async () => {
        chatWith([() => answer({ reply: 'Hello again.', changes: [], cards: [], undo: [] })]);
        await type('Hi');
        host.replaceChildren();

        createChat({ shadow: host, site: 'oxbow', request: vi.fn(), showSaved: vi.fn(), openPhoto: vi.fn(), openPublish: vi.fn() }).open();

        expect(host.textContent).toContain('Hi');
        expect(host.textContent).toContain('Hello again.');
    });

    it('suggests only what the page has, in words a person uses', () => {
        expect(startersFor({ fields: [], lists: [] })).toEqual(['What can I change on this page?']);
        expect(startersFor({ fields: [], lists: [{ label: 'Media' }, { label: 'Questions' }] })).toContain('Add another to questions');
        expect(startersFor({ fields: [], lists: [{ label: 'Media' }] })).toEqual(['What can I change on this page?']);
    });
});
