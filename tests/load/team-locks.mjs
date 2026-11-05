/*
 * Load test: many open editors asking "who is editing what".
 *
 * Owner, 5 Nov 2026: "also cater for the read/write head and if the cache
 * strategy is in place to avoid server overload".
 *
 * Against the engine's real API (tests/support/team-api behind `php -S`):
 *
 *   - 50 editors on one site and one editor on each of 200 other sites, each
 *     polling GET /team with the ETag it was last given (as team.js does);
 *   - while they poll, a few editors on the busy site save, claim and release,
 *     so the answer really changes now and then;
 *   - reported: requests per second, p50/p95/p99 latency, how many polls were
 *     304, and database queries per poll (the API's X-Queries header, which
 *     the harness adds) for unchanged and changed answers.
 *
 *   LIVE_EDIT_TEAM_DIR=/tmp/team-load [LIVE_EDIT_AUTOLOAD=...] node tests/load/team-locks.mjs
 *
 * Options (environment): SECONDS (default 30), CONCURRENCY (32), WORKERS (8),
 * PORT (8763). Nothing is mocked: the numbers include booting the framework
 * on every request, which `php -S` does and PHP-FPM with OPcache does faster.
 */

import { execFileSync, spawn } from 'node:child_process';

const SECONDS = Number(process.env.SECONDS ?? 30);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 32);
const WORKERS = String(process.env.WORKERS ?? 8);
const PORT = Number(process.env.PORT ?? 8763);
const BUSY_EDITORS = 50;
const OTHER_SITES = 200;
const base = `http://127.0.0.1:${PORT}/api/live-edit/v1`;

const seeded = JSON.parse(execFileSync('php', ['tests/support/team-api/seed.php', String(OTHER_SITES + 1), String(BUSY_EDITORS - 4)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const server = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'tests/support/team-api/server.php'], { env: { ...process.env, PHP_CLI_SERVER_WORKERS: WORKERS }, stdio: 'ignore' });
await new Promise((resolve) => setTimeout(resolve, 800));

// Who polls: 50 people on "demo", one on each other site.
const pollers = [];
for (const [key, token] of Object.entries(seeded.demo)) if (key !== 'visitor') pollers.push({ site: 'demo', token, etag: null });
for (const [site, tokens] of Object.entries(seeded)) if (site !== 'demo') pollers.push({ site, token: tokens.ada, etag: null });
const writers = Object.entries(seeded.demo).filter(([key]) => key.startsWith('e')).slice(0, 5).map(([, token]) => token);

const stats = { polls: 0, notModified: 0, changed: 0, errors: 0, queries304: 0, queries200: 0, writes: 0, writeQueries: 0, latencies: [], writeLatencies: [] };

const poll = async (poller) => {
    const started = performance.now();
    const response = await fetch(`${base}/${poller.site}/team`, { headers: { Authorization: `Bearer ${poller.token}`, Accept: 'application/json', ...(poller.etag ? { 'If-None-Match': poller.etag } : {}) } });
    const elapsed = performance.now() - started;
    const queries = Number(response.headers.get('x-queries') ?? 0);
    if (response.status === 304) {
        stats.notModified += 1;
        stats.queries304 += queries;
    } else if (response.ok) {
        stats.changed += 1;
        stats.queries200 += queries;
        poller.etag = response.headers.get('etag');
        await response.arrayBuffer();
    } else {
        stats.errors += 1;
    }
    stats.polls += 1;
    stats.latencies.push(elapsed);
};

let unit = 0;
const write = async () => {
    const token = writers[unit % writers.length];
    unit += 1;
    const started = performance.now();
    const response = await fetch(`${base}/demo/content`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json', 'X-Live-Edit-Unit': `section:load.${unit % 7}` },
        body: JSON.stringify({ key: `tpl:load${unit % 7}`, value: `words ${unit}` }),
    });
    stats.writeLatencies.push(performance.now() - started);
    stats.writeQueries += Number(response.headers.get('x-queries') ?? 0);
    stats.writes += 1;
    await response.arrayBuffer();
    // And let go now and then, so the answer changes for everybody.
    if (unit % 3 === 0) await fetch(`${base}/demo/team/release`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
};

const until = Date.now() + SECONDS * 1000;
let next = 0;
const worker = async () => {
    while (Date.now() < until) {
        const poller = pollers[next % pollers.length];
        next += 1;
        try { await poll(poller); } catch { stats.errors += 1; }
    }
};
const writing = (async () => {
    while (Date.now() < until) {
        try { await write(); } catch { stats.errors += 1; }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
})();

// Warm every poller once (each first answer is a 200), then measure.
await Promise.all(pollers.map((p) => poll(p).catch(() => {})));
Object.assign(stats, { polls: 0, notModified: 0, changed: 0, errors: 0, queries304: 0, queries200: 0, latencies: [] });
const started = Date.now();
await Promise.all([...Array(CONCURRENCY)].map(worker));
await writing;
const seconds = (Date.now() - started) / 1000;

/*
 * One request at a time, so the cost of each kind can be compared without the
 * queueing above: an unchanged poll, a changed poll, and a visitor reading the
 * site's words (the published-site hot path).
 */
const alone = async (url, headers) => {
    const times = [];
    let queries = 0;
    for (let i = 0; i < 40; i += 1) {
        const at = performance.now();
        const response = await fetch(url, { headers: { Accept: 'application/json', ...headers() } });
        await response.arrayBuffer();
        times.push(performance.now() - at);
        queries += Number(response.headers.get('x-queries') ?? 0);
    }

    return { median_ms: [...times].sort((a, b) => a - b)[20].toFixed(1), queries_each: Number((queries / 40).toFixed(2)) };
};
const one = pollers[0];
const fresh = await fetch(`${base}/demo/team`, { headers: { Authorization: `Bearer ${one.token}` } });
const tag = fresh.headers.get('etag');
const sequential = {
    unchanged_poll_304: await alone(`${base}/demo/team`, () => ({ Authorization: `Bearer ${one.token}`, 'If-None-Match': tag })),
    changed_poll_200: await alone(`${base}/demo/team`, () => ({ Authorization: `Bearer ${one.token}` })),
    visitor_content_read: await alone(`${base}/demo/content`, () => ({ Authorization: `Bearer ${seeded.demo.visitor}` })),
};
server.kill();

const pct = (list, p) => {
    const sorted = [...list].sort((a, b) => a - b);

    return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))].toFixed(1) : '-';
};

const report = {
    pollers: pollers.length,
    sites: OTHER_SITES + 1,
    busy_site_editors: BUSY_EDITORS,
    concurrency: CONCURRENCY,
    php_workers: Number(WORKERS),
    seconds: Number(seconds.toFixed(1)),
    polls: stats.polls,
    polls_per_second: Number((stats.polls / seconds).toFixed(1)),
    not_modified_304: stats.notModified,
    changed_200: stats.changed,
    errors: stats.errors,
    db_queries_per_unchanged_poll: Number((stats.queries304 / Math.max(1, stats.notModified)).toFixed(2)),
    db_queries_per_changed_poll: Number((stats.queries200 / Math.max(1, stats.changed)).toFixed(2)),
    poll_latency_ms: { p50: pct(stats.latencies, 0.5), p95: pct(stats.latencies, 0.95), p99: pct(stats.latencies, 0.99) },
    writes: stats.writes,
    db_queries_per_save: Number((stats.writeQueries / Math.max(1, stats.writes)).toFixed(1)),
    save_latency_ms: { p50: pct(stats.writeLatencies, 0.5), p95: pct(stats.writeLatencies, 0.95) },
    one_at_a_time: sequential,
};

console.log(JSON.stringify(report, null, 2));
