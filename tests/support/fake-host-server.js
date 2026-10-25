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

export async function serveFakeHost({ removable = false, library = false, outside = false } = {}) {
    const window = new Window();
    const host = createHost({ makeDocument: (html) => new window.DOMParser().parseFromString(html, 'text/html'), removable, library, outside });

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

    const server = createServer(async (request, response) => {
        const url = new URL(request.url, 'http://localhost');
        try {
            if (url.pathname === '/dist/live-edit.js') {
                response.writeHead(200, { 'Content-Type': 'text/javascript' });
                response.end(readFileSync(RUNTIME));

                return;
            }
            if (url.pathname.startsWith('/edit/')) {
                const page = url.pathname.slice('/edit/'.length).replace(/\/$/, '');
                const html = host.editorPage(page, { editorBase: `http://${request.headers.host}/edit/`, api: `http://${request.headers.host}/api`, runtime: '/dist/live-edit.js' });
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
                    json(response, 200, { settings: host.settings, styles: host.styles, pending: host.saves.length, version: 1 });
                } else if (request.method === 'POST' && route === 'content') {
                    const { key, value } = await bodyOf(request);
                    host.save(key, value ?? '');
                    json(response, 200, { saved: true, key });
                } else if (request.method === 'POST' && route === 'styles') {
                    const { key, props } = await bodyOf(request);
                    host.saveStyle(key, props ?? {});
                    json(response, 200, { saved: true, key });
                } else if (route === 'session') {
                    json(response, 200, { session: { valid: true, may_edit_locked: true } });
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

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();

    return {
        url: `http://127.0.0.1:${port}`,
        host,
        close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }),
    };
}
