/*
 * The stand-in host (fake-host.js) behind a real address, so a browser can
 * walk the editor on it: the editor's pages under /edit/<page>, the content
 * API under /api/demo, and the built runtime under /dist.
 *
 * Only what the editor needs to edit, save and read back is answered. Any
 * other API call is answered with an empty success, so a feature this journey
 * is not about (credits, history, photos) stays quiet instead of failing it.
 */

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';
import { createHost } from './fake-host.js';

const RUNTIME = fileURLToPath(new URL('../../resources/dist/live-edit.js', import.meta.url));

/*
 * With `team`, the content API is the engine's own (tests/support/team-api: the
 * real controllers on SQLite, behind `php -S`), and each browser is a team
 * member: /edit/<page>?as=ada draws the page with that person's key and the
 * words the API holds (drafts included, as an editor sees them), and
 * /view/<page> draws what a visitor gets. The API's own clock can be moved
 * forward with POST /__clock {seconds}.
 *
 *   team: { api: 'http://127.0.0.1:8762', tokens: { visitor, ada, ... }, dir }
 */
const TEAM_ROUTES = /^(content|styles|session|team(\/[a-z-]+)?|changes|publish|versions(\/\d+\/undo)?|restore)$/;

export async function serveFakeHost({ removable = false, library = false, outside = false, data = false, search = false, forms = null, pagesList = false, libraryForms = false, sale = false, mayPublish, team = null, port: listenOn = 0 } = {}) {
    const window = new Window();
    let publishAsked = 0;
    const host = createHost({ makeDocument: (html) => new window.DOMParser().parseFromString(html, 'text/html'), removable, library, outside, data, search, forms, pagesList, libraryForms, sale });
    // The host's stock (KeepsShopStock), with sale: { stock: [...] }: GET and POST /stock, claimed by the editor.
    const stock = Array.isArray(sale?.stock) ? sale.stock.map((row) => ({ ...row })) : null;
    const drafts = [];

    const json = (response, status, body) => {
        response.writeHead(status, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(body));
    };
    const bodyOf = (request) => new Promise((resolve) => {
        let raw = '';
        request.on('data', (chunk) => { raw += chunk; });
        request.on('end', () => {
            try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); }
        });
    });

    /** The engine's API, asked as one person. */
    const fromTheApi = async (route, token, init = {}) => fetch(`${team.api}/api/live-edit/v1/demo/${route}`, {
        ...init,
        headers: { Accept: 'application/json', ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    });

    /** The host's words and styles become what the API holds for this person, before the page is drawn. */
    const loadContent = async (token) => {
        const answer = await (await fromTheApi('content', token)).json();
        for (const key of Object.keys(host.settings)) delete host.settings[key];
        for (const key of Object.keys(host.styles)) delete host.styles[key];
        Object.assign(host.settings, answer.settings ?? {});
        Object.assign(host.styles, answer.styles ?? {});

        return answer.pending ?? 0;
    };

    const server = createServer(async (request, response) => {
        const url = new URL(request.url, 'http://localhost');
        try {
            if (team && url.pathname === '/__clock' && request.method === 'POST') {
                const { seconds = 0 } = await bodyOf(request);
                const { writeFileSync } = await import('node:fs');
                writeFileSync(`${team.dir}/now`, String(seconds));
                json(response, 200, { seconds });

                return;
            }
            if (team && (url.pathname.startsWith('/edit/') || url.pathname.startsWith('/view/'))) {
                const visitor = url.pathname.startsWith('/view/');
                const page = url.pathname.slice(6).replace(/\/$/, '');
                const token = visitor ? team.tokens.visitor : team.tokens[url.searchParams.get('as') ?? ''];
                if (!token) {
                    response.writeHead(403, { 'Content-Type': 'text/plain' });
                    response.end('Say who is editing: ?as=<name>');

                    return;
                }
                const pending = await loadContent(token);
                const html = host.editorPage(page, { editorBase: `http://${request.headers.host}/edit/`, api: `http://${request.headers.host}/api`, runtime: '/dist/live-edit.js', token, visitor, pending });
                response.writeHead(html ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
                response.end(html ?? 'Not found');

                return;
            }
            if (team && url.pathname.startsWith('/api/demo/') && TEAM_ROUTES.test(url.pathname.slice('/api/demo/'.length))) {
                // Handed to the engine as it came, without the browser's Origin: this is the host's server talking to the API.
                const raw = await new Promise((resolve) => {
                    let body = '';
                    request.on('data', (chunk) => { body += chunk; });
                    request.on('end', () => resolve(body));
                });
                const headers = {};
                for (const name of ['authorization', 'content-type', 'if-none-match', 'x-live-edit-unit', 'x-live-edit-unit-label', 'x-live-edit-what', 'accept']) {
                    if (request.headers[name]) headers[name] = request.headers[name];
                }
                const answer = await fetch(`${team.api}/api/live-edit/v1/demo/${url.pathname.slice('/api/demo/'.length)}${url.search}`, {
                    method: request.method,
                    headers,
                    body: ['GET', 'HEAD'].includes(request.method) ? undefined : raw,
                });
                const out = {};
                for (const name of ['content-type', 'etag', 'cache-control', 'x-queries']) {
                    const value = answer.headers.get(name);
                    if (value) out[name] = value;
                }
                response.writeHead(answer.status, out);
                response.end(answer.status === 304 ? undefined : Buffer.from(await answer.arrayBuffer()));

                return;
            }
            if (stock && url.pathname === '/stock') {
                if (request.method === 'POST') {
                    const { changes = [] } = await bodyOf(request);
                    for (const change of changes) {
                        const row = stock.find((r) => r.product === change.product && r.size === (change.size ?? ''));
                        if (row) row.quantity = change.quantity ?? null;
                    }
                }
                json(response, 200, { stock });

                return;
            }
            if (url.pathname === '/kit-data.js') {
                response.writeHead(200, { 'Content-Type': 'text/javascript' });
                response.end(readFileSync(fileURLToPath(new URL('./kit-data.js', import.meta.url))));

                return;
            }
            if (url.pathname === '/kit-search.js') {
                response.writeHead(200, { 'Content-Type': 'text/javascript' });
                response.end(readFileSync(fileURLToPath(new URL('../../resources/dist/kit-search.js', import.meta.url))));

                return;
            }
            // Its look, beside it: what kit-search.js links when the page's head does not hold it.
            if (url.pathname === '/kit-search.css') {
                response.writeHead(200, { 'Content-Type': 'text/css' });
                response.end(readFileSync(fileURLToPath(new URL('../../resources/dist/kit-search.css', import.meta.url))));

                return;
            }
            // A collection's index, as the host's editor route gives it: the drafts over what is published.
            const index = url.pathname.match(/^\/search\/([a-z0-9-]+)\.json$/);
            if (index) {
                const found = host.collections().find((c) => c.id === index[1]);
                json(response, found ? 200 : 404, found ? { v: 1, ...found } : {});

                return;
            }
            if (url.pathname === '/dist/live-edit.js') {
                response.writeHead(200, { 'Content-Type': 'text/javascript' });
                response.end(readFileSync(RUNTIME));

                return;
            }
            if (url.pathname.startsWith('/edit/')) {
                const page = url.pathname.slice('/edit/'.length).replace(/\/$/, '');
                // With sale: { slow }: a product page read in the background takes this long (a busy host).
                if (sale?.slow && page.startsWith('products/') && request.headers['sec-fetch-mode'] !== 'navigate') await new Promise((resolve) => setTimeout(resolve, sale.slow));
                const html = host.editorPage(page, { editorBase: `http://${request.headers.host}/edit/`, api: `http://${request.headers.host}/api`, runtime: '/dist/live-edit.js', ...(sale ? { pending: drafts.length } : {}) });
                if (!html) {
                    response.writeHead(404, { 'Content-Type': 'text/html' });
                    response.end('<!doctype html><title>Not found</title><p>There is no page at that address.</p>');

                    return;
                }
                response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
                response.end(html);

                return;
            }
            if (url.pathname.startsWith('/api/demo/')) {
                const route = url.pathname.slice('/api/demo/'.length);
                if (request.method === 'GET' && route === 'content') {
                    json(response, 200, { settings: host.settings, styles: host.styles, pending: sale ? drafts.length : host.saves.length, version: 1 });
                } else if (request.method === 'POST' && route === 'content') {
                    const { key, value } = await bodyOf(request);
                    host.save(key, value ?? '');
                    if (sale) drafts.splice(0, drafts.length, ...drafts.filter((k) => k !== key), key);
                    json(response, 200, { saved: true, key });
                } else if (sale && route === 'changes' && request.method === 'GET') {
                    // With sale: the drafts as the engine lists them, newest first, so Undo can be walked.
                    json(response, 200, { changes: [...drafts].reverse().map((key) => ({ key, kind: 'setting', after: host.settings[key] ?? '' })) });
                } else if (sale && route === 'changes' && request.method === 'DELETE') {
                    const { key } = await bodyOf(request);
                    drafts.splice(0, drafts.length, ...drafts.filter((k) => k !== key));
                    delete host.settings[key];
                    json(response, 200, { reverted: true });
                } else if (request.method === 'POST' && route === 'styles') {
                    const { key, props } = await bodyOf(request);
                    host.saveStyle(key, props ?? {});
                    json(response, 200, { saved: true, key });
                } else if (route === 'publish' || route.startsWith('publish')) {
                    // Counted, so a test can say no publish was ever asked for.
                    publishAsked += 1;
                    json(response, mayPublish === false ? 403 : 200, mayPublish === false ? { error: { type: 'forbidden', message: 'This session may not publish.' } } : { published: true });
                } else if (route === 'session') {
                    json(response, 200, { session: { valid: true, may_edit_locked: true, ...(mayPublish === undefined ? {} : { may_publish: mayPublish }) } });
                } else {
                    json(response, 200, {});
                }

                return;
            }
            response.writeHead(404);
            response.end();
        } catch (error) {
            json(response, 500, { error: { message: error.message } });
        }
    });

    await new Promise((resolve) => server.listen(listenOn, '127.0.0.1', resolve));
    const { port } = server.address();

    return {
        url: `http://127.0.0.1:${port}`,
        host,
        publishAsked: () => publishAsked,
        stock: () => stock,
        close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }),
    };
}
