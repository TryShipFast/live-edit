import { describe, expect, it, vi } from 'vitest';
import { createTeam, elementsFor, groupLines, pollDelay, sentenceFor, splitChanges, unitOf, versionHeadline } from '../../resources/js/team.js';

/*
 * Team editing: one person per section (team.js). The server is the
 * authority (SectionLocks, TeamEditingTest); these are the editor's half:
 * which part of the page a click is in, what it says, and how often it asks.
 */

const page = () => {
    document.body.innerHTML = `
<header data-instance="site.header" data-label="Header"><a data-edit="setting:nav">Shop</a></header>
<main>
  <section data-instance="home.hero" data-edit-section="home.hero" data-edit-section-label="Hero"><h1 data-edit="setting:hero">Hi</h1></section>
  <section data-instance="home.story"><p data-edit="setting:story">Once</p></section>
  <section id="contact"><p data-edit="setting:contact">Call</p></section>
  <p data-edit="setting:loose">Alone</p>
</main>`;

    return document;
};

const response = (status, body = {}, etag = null) => ({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => (name === 'ETag' ? etag : null) },
    json: async () => body,
});

const fakeUi = () => {
    const shadow = document.createElement('div');
    const opened = [];
    const toasts = [];

    return {
        shadow,
        opened,
        toasts,
        toast: (message) => toasts.push(message),
        modal: ({ title }) => {
            const body = document.createElement('div');
            const foot = document.createElement('div');
            const sheet = { title, body, foot, close: vi.fn() };
            opened.push(sheet);

            return sheet;
        },
    };
};

describe('which part of the page a change is in', () => {
    it('names a Kit section, a shared band, an area with an id and a lone element', () => {
        const doc = page();

        expect(unitOf(doc.querySelector('[data-edit="setting:hero"]'))).toEqual({ unit: 'section:home.hero', label: 'Hero' });
        expect(unitOf(doc.querySelector('[data-edit="setting:story"]'))).toEqual({ unit: 'section:home.story', label: 'Story' });
        expect(unitOf(doc.querySelector('[data-edit="setting:nav"]'))).toEqual({ unit: 'site/header', label: 'Header' });
        expect(unitOf(doc.querySelector('[data-edit="setting:contact"]'))).toEqual({ unit: 'area:contact', label: 'Contact' });
        expect(unitOf(doc.querySelector('[data-edit="setting:loose"]'))).toEqual({ unit: 'key:loose', label: 'This part of the page' });
    });

    it('finds the elements a lock covers, to outline them', () => {
        const doc = page();

        expect(elementsFor(doc, 'section:home.hero')).toHaveLength(1);
        expect(elementsFor(doc, 'site/header')[0].tagName).toBe('HEADER');
        expect(elementsFor(doc, 'area:contact')[0].id).toBe('contact');
        expect(elementsFor(doc, 'panel:brand')).toEqual([]);
    });
});

describe('how often an open editor asks who is editing what', () => {
    it('asks every few seconds while somebody works, every thirty when idle, and never while hidden', () => {
        const now = 1_000_000;
        const half = () => 0.5;

        expect(pollDelay({ active: 5, idle: 30, lastActivity: now - 1000, now, random: half })).toBe(5000);
        expect(pollDelay({ active: 5, idle: 30, lastActivity: now - 300000, now, random: half })).toBe(30000);
        expect(pollDelay({ hidden: true })).toBeNull();
    });

    it('spreads editors out so they do not ask in step', () => {
        expect(pollDelay({ active: 5, lastActivity: 0, now: 1, random: () => 0 })).toBe(4000);
        expect(pollDelay({ active: 5, lastActivity: 0, now: 1, random: () => 1 })).toBe(6000);
    });
});

describe('what history and the changes list say', () => {
    it('says who changed what, where, in plain words', () => {
        expect(sentenceFor({ author: 'h:1', author_name: 'Ada', what: 'the headline', label: 'Hero' })).toBe('Ada changed the headline in Hero');
        expect(sentenceFor({ author: 'h:1', author_name: 'Ada', what: 'the headline', label: 'Hero' }, 'h:1')).toBe('You changed the headline in Hero');
        expect(sentenceFor({ author_name: 'Tunde', list: '2 items added, leaving 5 items', label: 'Gallery' })).toBe('Tunde: 2 items added, leaving 5 items in Gallery');
        expect(sentenceFor({ author_name: 'Olu', what: 'the headline', label: 'Hero', undid: true })).toBe('Olu put back the headline in Hero');
        expect(sentenceFor({ kind: 'style' })).toBe('Someone changed the styling');
    });

    it('never uses an em dash', () => {
        const said = [
            sentenceFor({ author_name: 'Ada', what: 'the headline', label: 'Hero' }),
            versionHeadline({ published_by: 'Ada', changes: 2 }),
            versionHeadline({ published_by: 'Olu', undoes: 3 }),
        ].join(' ');

        expect(said).not.toContain('—');
    });

    it('heads a version with who published it', () => {
        expect(versionHeadline({ published_by: 'Ada', changes: 1 })).toBe('Ada published 1 change');
        expect(versionHeadline({ published_by: 'Ada', published_by_id: 'h:1', changes: 3 }, 'h:1')).toBe('You published 3 changes');
        expect(versionHeadline({ changes: 2 })).toBe('Published 2 changes');
        expect(versionHeadline({ published_by: 'Olu', undoes: 4 })).toBe('Olu undid the changes in version 4');
        expect(versionHeadline({ published_by: 'Olu', restored_from: 2 })).toBe('Olu went back to version 2');
    });

    it('groups a version by section, keeping the order', () => {
        const groups = groupLines([{ label: 'Hero', key: 'a' }, { label: 'Story', key: 'b' }, { label: 'Hero', key: 'c' }, { key: 'd' }]);

        expect(groups.map((g) => [g.label, g.lines.map((l) => l.key)])).toEqual([
            ['Hero', ['a', 'c']], ['Story', ['b']], ['Other changes', ['d']],
        ]);
    });

    it('splits the changes into yours and others by name, and keeps old lists whole', () => {
        const { yours, others } = splitChanges([
            { key: 'a', mine: true },
            { key: 'b', mine: false, author_name: 'Tunde' },
            { key: 'c' },
            { key: 'd', mine: false, author_name: 'Tunde' },
        ]);

        expect(yours.map((c) => c.key)).toEqual(['a', 'c']);
        expect([...others.keys()]).toEqual(['Tunde']);
        expect(others.get('Tunde').map((c) => c.key)).toEqual(['b', 'd']);
    });
});

describe('the team layer in an open editor', () => {
    const state = {
        you: { id: 'h:2', name: 'Tunde', role: 'editor' },
        locks: [{ unit: 'section:home.hero', label: 'Hero', holder: 'h:1', name: 'Ada', since: 'x' }],
        left: [],
        poll: { active_seconds: 5, idle_seconds: 30 },
    };

    it('outlines a section a teammate holds and will not open it', async () => {
        const doc = page();
        const ui = fakeUi();
        const send = vi.fn(async () => response(200, state, '"team-1"'));
        const team = createTeam({ send, ui, doc });
        await team.refresh();

        expect(ui.shadow.querySelector('.le-lock-label').textContent).toBe('Ada is editing this section');
        expect(doc.querySelector('[data-edit-section="home.hero"]').getAttribute('data-le-locked')).toBe('Ada');

        const allowed = team.beforeEdit(doc.querySelector('[data-edit="setting:hero"]'));
        expect(allowed).toBe(false);
        expect(ui.opened[0].title).toBe('Ada is editing this section');
        expect(ui.opened[0].body.textContent).toContain('Ask an admin to take over');
        team.stop();
    });

    it('offers an admin who is not the owner a way to take over too', async () => {
        const doc = page();
        const ui = fakeUi();
        const send = vi.fn(async () => response(200, { ...state, you: { id: 'h:3', name: 'Kemi', role: 'admin' } }));
        const team = createTeam({ send, ui, doc });
        await team.refresh();

        expect(team.mayManage()).toBe(true);
        team.beforeEdit(doc.querySelector('[data-edit="setting:hero"]'));
        expect([...ui.opened[0].foot.querySelectorAll('button')].map((b) => b.textContent)).toContain('Take over');
        team.stop();
    });

    it('offers the owner a way to take over', async () => {
        const doc = page();
        const ui = fakeUi();
        const send = vi.fn(async () => response(200, { ...state, you: { id: 'h:0', name: 'Olu', role: 'owner' } }));
        const team = createTeam({ send, ui, doc });
        await team.refresh();

        team.beforeEdit(doc.querySelector('[data-edit="setting:hero"]'));
        expect([...ui.opened[0].foot.querySelectorAll('button')].map((b) => b.textContent)).toContain('Take over');
        team.stop();
    });

    it('claims a free section and sends its name with every save', async () => {
        const doc = page();
        const ui = fakeUi();
        const send = vi.fn(async (path) => (path === '/live-edit/team' ? response(200, state) : response(200, { lock: {}, left: [] })));
        const team = createTeam({ send, ui, doc });
        await team.refresh();

        expect(team.beforeEdit(doc.querySelector('[data-edit="setting:story"]'))).toBe(true);
        team.setWhat('Paragraph');
        await Promise.resolve();

        const claim = send.mock.calls.find(([path]) => path === '/live-edit/team/claim');
        expect(JSON.parse(claim[1].body)).toEqual({ unit: 'section:home.story', label: 'Story' });
        expect(team.headers()).toEqual({
            'X-Live-Edit-Unit': 'section%3Ahome.story',
            'X-Live-Edit-Unit-Label': 'Story',
            'X-Live-Edit-What': 'the%20paragraph',
        });
        team.stop();
    });

    it('asks with the last answer and is content with a 304', async () => {
        const doc = page();
        const ui = fakeUi();
        let calls = 0;
        const send = vi.fn(async (path, options) => {
            calls += 1;

            return calls === 1 ? response(200, state, '"team-1"') : (options.headers['If-None-Match'] === '"team-1"' ? response(304) : response(500));
        });
        const team = createTeam({ send, ui, doc });
        await team.refresh();
        await team.refresh();

        expect(send.mock.calls[1][1].headers).toEqual({ 'If-None-Match': '"team-1"' });
        expect(team.state.locks).toHaveLength(1);
        team.stop();
    });

    it('steps aside on a host without team editing', async () => {
        const doc = page();
        const send = vi.fn(async () => response(404));
        const team = createTeam({ send, ui: fakeUi(), doc });
        await team.refresh();

        expect(team.available).toBe(false);
        expect(team.beforeEdit(doc.querySelector('[data-edit="setting:hero"]'))).toBe(true);
        team.stop();
    });

    it('tells the person whose section the owner took', async () => {
        const doc = page();
        const ui = fakeUi();
        const taken = { ...state, you: { id: 'h:1', name: 'Ada', role: 'editor' }, locks: [{ unit: 'section:home.hero', label: 'Hero', holder: 'h:0', name: 'Olu', taken_from: 'h:1', since: 'y' }] };
        const team = createTeam({ send: async () => response(200, taken), ui, doc });
        await team.refresh();

        expect(ui.toasts[0]).toBe('Olu took over Hero. Your changes there are now theirs to publish.');
        team.stop();
    });
});
