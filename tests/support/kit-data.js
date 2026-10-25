/*!
 * kit-data 1.0.0: the chart kit and table kit's drawing (LIVE-EDIT-STRUCTURE.md section 7,
 * "Charts and tables the owner adds"; briefs/STANDARDS.md BH-12).
 *
 * A chart says what it is (data-chart="bar|line|donut|funnel|progress|sparkline") and its data is
 * the table inside it: one row per bar, point, slice, stage or measure, a Kit list Live Edit edits.
 * This draws each chart from that table, in the template's own colours (its brand tokens, through
 * the --kit-chart-* properties its site.css may set), and draws it again whenever the table or the
 * chart's settings change, so an edited, added or removed row shows at once in the chart and in the
 * table it was drawn from. A table the owner adds (data-kit-table) gets its column of figures and
 * its phone layout worked out the same way. No dependencies, nothing logged, nothing fetched.
 *
 * The same file everywhere: the host adds it to a page that holds a chart or a table the owner
 * added, and a template whose own pages draw charts ships it (assets/js/kit-data.js) with the
 * attribute data-kit-data on its script tag, so the host never adds a second copy.
 */
(function () {
    'use strict';

    if (window.kitData && window.kitData.version) return;

    var SVG = 'http://www.w3.org/2000/svg';
    var KINDS = ['bar', 'line', 'donut', 'funnel', 'progress', 'sparkline'];
    var MOST_SLICES = 6;
    var reduced = function () {
        try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
    };

    /*
     * The base of the chart and table kits, at no specificity (:where), so a template's own
     * site.css wins wherever it says anything. Every colour is a brand token or mixed from one.
     */
    var BASE = [
        ':where(.kit-data){--kit-chart-1:var(--brand-accent,#2e6b9f);--kit-chart-2:var(--brand-ink,#0f2447);',
        '--kit-chart-3:color-mix(in srgb,var(--brand-accent,#2e6b9f) 55%,var(--brand-surface,#fff));',
        '--kit-chart-4:color-mix(in srgb,var(--brand-ink,#0f2447) 55%,var(--brand-surface,#fff));',
        '--kit-chart-5:color-mix(in srgb,var(--brand-accent,#2e6b9f) 30%,var(--brand-surface,#fff));',
        '--kit-chart-6:color-mix(in srgb,var(--brand-muted,#6b7280) 60%,var(--brand-surface,#fff));',
        '--kit-chart-ink:var(--brand-body,#374151);--kit-chart-muted:var(--brand-muted,#6b7280);',
        '--kit-chart-grid:var(--brand-line,#d1d9e2);--kit-chart-track:var(--brand-raised,#e8eef4);',
        '--kit-chart-surface:var(--brand-surface,#fff);--kit-chart-font:var(--font-body,inherit);',
        'display:block;padding-block:var(--kit-section-space,clamp(48px,7vw,96px));color:var(--kit-chart-ink)}',
        ':where(.kit-data__in){width:min(100% - 2*var(--kit-gutter,clamp(16px,4vw,48px)),var(--kit-measure,1200px));margin-inline:auto}',
        ':where(.kit-data__head){max-width:44rem;margin-bottom:clamp(20px,3vw,32px)}',
        ':where(.kit-data__title){font-family:var(--font-display,inherit);color:var(--brand-ink,inherit);margin:0 0 .4em}',
        ':where(.kit-data__lead){margin:0;color:var(--kit-chart-muted)}',
        ':where(.kit-chart__figure){margin:0}',
        ':where(.kit-chart__plot){position:relative;width:100%;font-family:var(--kit-chart-font);font-variant-numeric:tabular-nums}',
        // Room kept for a chart before it is drawn, so the page does not jump when it is.
        ':where(.kit-chart__plot:empty){min-height:var(--kit-chart-height,280px)}',
        ':where(.kit-chart[data-chart="sparkline"] .kit-chart__plot:empty){min-height:56px}',
        ':where(.kit-chart__plot svg){display:block;width:100%;height:auto;overflow:visible}',
        ':where(.kit-chart__units){margin:0 0 8px;font-size:.875rem;color:var(--kit-chart-muted)}',
        ':where(.kit-chart__readout){margin:16px 0 0;max-width:44rem}',
        ':where(.kit-chart__latest){margin:0;font-family:var(--font-display,inherit);font-size:clamp(2rem,4vw,3rem);line-height:1;color:var(--brand-ink,inherit)}',
        ':where(.kit-chart__spark){display:grid;grid-template-columns:auto minmax(0,360px);align-items:center;column-gap:clamp(16px,3vw,32px)}',
        ':where(.kit-chart__spark .kit-chart__readout){grid-column:1/-1}',
        ':where(.kit-chart__figures){margin-top:20px}',
        ':where(.kit-chart__figures>summary){cursor:pointer;color:var(--brand-accent,inherit);font-weight:600;min-height:44px;display:flex;align-items:center}',
        ':where(.kit-table){width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}',
        ':where(.kit-table th,.kit-table td){padding:10px 12px;text-align:left;border-bottom:1px solid var(--kit-chart-grid);vertical-align:top}',
        ':where(.kit-table thead th){color:var(--brand-ink,inherit);font-weight:600;border-bottom-width:2px}',
        ':where(.kit-table .is-figure){text-align:right}',
        ':where(.kit-table__scroll){overflow-x:auto}',
        '@media (max-width:640px){:where(.kit-table[data-kit-table-stack] thead){position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}',
        ':where(.kit-table[data-kit-table-stack] tr){display:block;padding:8px 0;border-bottom:1px solid var(--kit-chart-grid)}',
        ':where(.kit-table[data-kit-table-stack] th,.kit-table[data-kit-table-stack] td){display:flex;justify-content:space-between;gap:16px;border:0;padding:6px 0;text-align:right}',
        ':where(.kit-table[data-kit-table-stack] td[data-th]::before,.kit-table[data-kit-table-stack] th[data-th][scope="row"]::before){content:attr(data-th);color:var(--kit-chart-muted);text-align:left;font-weight:400}}',
        ':where(.kit-chart__mark){transition:opacity .2s}',
        '@media (prefers-reduced-motion:no-preference){:where(.kit-chart--enter .kit-chart__grow){animation:kit-grow .7s cubic-bezier(.2,.7,.2,1) both}',
        ':where(.kit-chart--enter .kit-chart__trace){stroke-dasharray:var(--kit-len,2000);stroke-dashoffset:var(--kit-len,2000);animation:kit-trace 1s ease-out forwards}}',
        '@keyframes kit-grow{from{transform:scale(var(--kit-from-x,1),var(--kit-from-y,0));opacity:0}to{transform:none;opacity:1}}',
        '@keyframes kit-trace{to{stroke-dashoffset:0}}'
    ].join('');

    var baseIn = function (doc) {
        if (doc.querySelector('style[data-kit-data-base]')) return;
        var style = doc.createElement('style');
        style.setAttribute('data-kit-data-base', '');
        style.textContent = BASE;
        // First in the head, so every stylesheet of the template comes after it.
        doc.head.insertBefore(style, doc.head.firstChild);
    };

    /* ------------------------------------------------------------------ reading the page */

    var words = function (el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; };

    /** A figure as the owner typed it: "1,240", "42%", "$3.5", "−8". Null when it holds none. */
    var figure = function (text) {
        var s = String(text == null ? '' : text).replace(/[−–]/g, '-').replace(/[\s,  ]/g, '');
        var m = s.match(/-?\d+(?:\.\d+)?/);
        return m ? parseFloat(m[0]) : null;
    };

    /** How a figure is written with its unit: "$" leads, "%" follows, a word follows after a space. */
    var withUnit = function (n, unit) {
        var abs = Math.abs(n);
        var digits = abs !== 0 && abs < 10 && n % 1 !== 0 ? 1 : (n % 1 !== 0 && abs < 100 ? 1 : 0);
        var said = n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
        if (!unit) return said;
        var lead = unit.match(/^([$£€¥₦₹₩₱])(.*)$/);
        if (lead) return (n < 0 ? '-' : '') + lead[1] + said.replace('-', '') + lead[2];
        if (unit === '%' || /^[a-zA-Z]{1,2}$/.test(unit)) return said + unit;
        return said + ' ' + unit;
    };

    /** On an axis, only a unit short enough to sit on every tick: "$", "%", "k". A word is said once, above. */
    var tickUnit = function (unit) { return /^([$£€¥₦₹₩₱].{0,2}|%|[a-zA-Z]{1,2})$/.test(unit || '') ? unit : ''; };

    var settingsOf = function (chart) {
        var el = chart.querySelector('[data-chart-settings]') || chart;
        return {
            variant: el.getAttribute('data-chart-variant') || '',
            order: el.getAttribute('data-chart-order') || 'written',
            markers: el.getAttribute('data-chart-markers') || 'on',
            series: el.getAttribute('data-chart-series') || 'all'
        };
    };

    /**
     * The chart's data, from its table: the series named by the header's cells after the first,
     * and one row per item, each with its label, its figures and the id Live Edit knows it by.
     */
    var dataOf = function (chart) {
        var table = chart.querySelector('[data-chart-table]') || chart.querySelector('table');
        if (!table) return { series: [], rows: [] };
        var head = table.tHead && table.tHead.rows[0];
        var heads = head ? [].slice.call(head.cells) : [];
        // A column the chart does not draw: one worked out from the others (data-chart-change), or
        // one the template marks as words beside the figures (data-chart-skip).
        var drawn = heads.map(function (th, i) { return i > 0 && !th.hasAttribute('data-chart-skip') && !th.hasAttribute('data-chart-change'); });
        var series = heads.filter(function (_, i) { return drawn[i]; }).map(words);
        var body = table.tBodies[0];
        var rows = [].slice.call(body ? body.rows : []).filter(function (tr) {
            return !tr.hidden && tr.cells.length > 1;
        }).map(function (tr, index) {
            var cells = [].slice.call(tr.cells);
            return {
                id: tr.getAttribute('data-edit-item') || tr.getAttribute('data-item') || String(index + 1),
                label: words(cells[0]),
                values: cells.filter(function (_, i) { return heads.length ? drawn[i] : i > 0; }).map(function (c) { return figure(words(c)); }),
                tr: tr
            };
        });
        if (!series.length && rows.length) series = rows[0].values.map(function (_, i) { return 'Series ' + (i + 1); });
        return { series: series, rows: rows, heads: heads };
    };

    /** A signed change, as a percentage: "+3.2%", "−1.0%". */
    var change = function (now, then) {
        if (now == null || !then) return '';
        var pc = (now / then - 1) * 100;
        return (pc >= 0 ? '+' : '\u2212') + Math.abs(pc).toFixed(1) + '%';
    };

    /**
     * The figures a chart works out from its own rows, written where the page asks for them (each
     * marked data-kit-computed, so the editor says it is counted rather than offering it for typing):
     * a column of changes (data-chart-change on its heading: the first series against the second), the
     * total of a series (data-chart-sum="1"), the change of the totals (data-chart-total-change) and the
     * latest value (data-chart-latest, a sparkline's figure).
     */
    var workOut = function (chart, data, unit) {
        var put = function (el, said) { if (el && el.textContent !== said) el.textContent = said; };
        data.heads.forEach(function (th, col) {
            if (!th.hasAttribute('data-chart-change')) return;
            data.rows.forEach(function (row) { put(row.tr.cells[col], change(row.values[0], row.values[1])); });
        });
        var total = function (n) { return data.rows.reduce(function (sum, row) { return sum + (row.values[n] || 0); }, 0); };
        [].slice.call(chart.querySelectorAll('[data-chart-sum]')).forEach(function (el) {
            var n = Math.max(1, parseInt(el.getAttribute('data-chart-sum'), 10) || 1) - 1;
            put(el, withUnit(total(n), unit));
        });
        [].slice.call(chart.querySelectorAll('[data-chart-total-change]')).forEach(function (el) {
            var said = change(total(0), total(1));
            put(el, (el.getAttribute('data-chart-total-change') || '{}').replace('{}', said));
            el.classList.toggle('is-down', said.charAt(0) !== '+');
        });
        var latest = chart.querySelector('[data-chart-latest]');
        if (latest && data.rows.length) {
            var last = data.rows[data.rows.length - 1].values[0];
            put(latest, last == null ? '' : withUnit(last, unit));
        }
    };

    var unitOf = function (chart) { return words(chart.querySelector('[data-chart-units]')); };

    /* ------------------------------------------------------------------ drawing helpers */

    var make = function (tag, attrs, parent) {
        var el = document.createElementNS(SVG, tag);
        for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k) && attrs[k] != null) el.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(el);
        return el;
    };
    var text = function (parent, x, y, said, attrs) {
        var t = make('text', Object.assign({ x: x, y: y, fill: 'currentColor' }, attrs || {}), parent);
        t.textContent = said;
        return t;
    };
    var colour = function (i) { return 'var(--kit-chart-' + ((i % MOST_SLICES) + 1) + ')'; };

    /** Round steps for an axis: 0, 25, 50, 75, 100 rather than 0, 23.7, 47.4. */
    var ticks = function (lo, hi, count) {
        if (hi === lo) hi = lo + 1;
        var raw = (hi - lo) / (count || 4);
        var mag = Math.pow(10, Math.floor(Math.log10(raw)));
        var step = [1, 2, 2.5, 5, 10].map(function (m) { return m * mag; }).find(function (s) { return s >= raw; }) || raw;
        var start = Math.floor(lo / step) * step;
        var out = [];
        for (var v = start; v <= hi + step * 0.001; v += step) out.push(Math.round(v * 1e6) / 1e6);
        if (out[out.length - 1] < hi) out.push(out[out.length - 1] + step);
        return out;
    };

    var measureText = function (svg, said) {
        var t = text(svg, 0, 0, said, { 'font-size': 12, visibility: 'hidden' });
        var w = 0;
        try { w = t.getComputedTextLength(); } catch (e) { w = said.length * 7; }
        svg.removeChild(t);
        return w || said.length * 7;
    };

    var shortLabel = function (said, room) {
        var max = Math.max(3, Math.floor(room / 6.5));
        return said.length > max ? said.slice(0, max - 1) + '…' : said;
    };

    var grow = function (el, axis, originX, originY) {
        el.setAttribute('class', (el.getAttribute('class') || '') + ' kit-chart__grow');
        el.style.transformBox = 'fill-box';
        el.style.transformOrigin = (originX || 'left') + ' ' + (originY || 'bottom');
        if (axis === 'x') { el.style.setProperty('--kit-from-x', '0'); el.style.setProperty('--kit-from-y', '1'); }
    };

    var trace = function (path) {
        path.setAttribute('class', (path.getAttribute('class') || '') + ' kit-chart__trace');
        try { path.style.setProperty('--kit-len', String(Math.ceil(path.getTotalLength()))); } catch (e) { /* drawn without the trace */ }
    };

    /* ------------------------------------------------------------------ the kinds */

    var drawAxes = function (svg, box, scale, unit, values) {
        var g = make('g', { class: 'kit-chart__axis', fill: 'var(--kit-chart-muted)', 'font-size': 12 }, svg);
        values.forEach(function (v) {
            var y = scale(v);
            make('line', { x1: box.left, x2: box.right, y1: y, y2: y, stroke: 'var(--kit-chart-grid)', 'stroke-width': 1 }, g);
            text(g, box.left - 8, y + 4, withUnit(v, tickUnit(unit)), { 'text-anchor': 'end' });
        });
        return g;
    };

    var plotBox = function (svg, width, height, data, unit, axisValues, bottom) {
        var widest = 0;
        axisValues.forEach(function (v) { widest = Math.max(widest, measureText(svg, withUnit(v, tickUnit(unit)))); });
        return { left: Math.ceil(widest) + 12, right: width - 8, top: 10, bottom: height - (bottom == null ? 28 : bottom) };
    };

    var shown = function (data, settings) {
        if (settings.series === 'all' || !data.series.length) return data.series.map(function (_, i) { return i; });
        var only = parseInt(settings.series, 10);
        return isFinite(only) && only >= 1 && only <= data.series.length ? [only - 1] : data.series.map(function (_, i) { return i; });
    };

    var drawLegend = function (svg, entries, x, y, width) {
        var g = make('g', { class: 'kit-chart__legend', 'font-size': 13, fill: 'var(--kit-chart-ink)' }, svg);
        var cx = x;
        var cy = y;
        entries.forEach(function (entry) {
            var w = measureText(svg, entry.label) + 34;
            if (cx + w > x + width && cx > x) { cx = x; cy += 22; }
            make('rect', { x: cx, y: cy - 10, width: 12, height: 12, rx: 2, fill: entry.colour }, g);
            text(g, cx + 18, cy, entry.label);
            cx += w;
        });
        return cy - y + 22;
    };

    var bar = function (svg, width, data, settings, unit) {
        var across = settings.variant === 'bars';
        var stacked = settings.variant === 'stacked';
        var series = shown(data, settings);
        var rows = data.rows.slice();
        if (stacked) return stack(svg, width, rows, series, data, unit);
        if (settings.order === 'value') rows.sort(function (a, b) { return (b.values[series[0]] || 0) - (a.values[series[0]] || 0); });
        var all = [];
        rows.forEach(function (r) { series.forEach(function (s) { if (r.values[s] != null) all.push(r.values[s]); }); });
        var axis = ticks(Math.min(0, Math.min.apply(null, all.concat([0]))), Math.max.apply(null, all.concat([0])), 4);
        var lo = axis[0];
        var hi = axis[axis.length - 1];
        var legend = series.length > 1 ? 30 : 0;
        if (across) {
            var labelRoom = Math.min(width * 0.35, Math.max.apply(null, rows.map(function (r) { return measureText(svg, r.label); }).concat([40])) + 12);
            var rowH = Math.max(28, 12 + 18 * series.length);
            var height = rows.length * rowH + 30 + legend;
            var box = { left: labelRoom, right: width - 56, top: legend, bottom: height - 24 };
            var x = function (v) { return box.left + (v - lo) / (hi - lo) * (box.right - box.left); };
            var g = make('g', { 'font-size': 12, fill: 'var(--kit-chart-muted)' }, svg);
            axis.forEach(function (v) {
                make('line', { x1: x(v), x2: x(v), y1: box.top, y2: box.bottom, stroke: 'var(--kit-chart-grid)' }, g);
                text(g, x(v), height - 6, withUnit(v, tickUnit(unit)), { 'text-anchor': 'middle' });
            });
            rows.forEach(function (r, i) {
                var y0 = box.top + i * rowH;
                text(svg, labelRoom - 10, y0 + rowH / 2 + 4, shortLabel(r.label, labelRoom), { 'text-anchor': 'end', 'font-size': 13, fill: 'var(--kit-chart-ink)' });
                series.forEach(function (s, k) {
                    var v = r.values[s];
                    if (v == null) return;
                    var h = (rowH - 10) / series.length;
                    var rect = make('rect', { class: 'kit-chart__mark', 'data-chart-item': r.id, x: Math.min(x(0), x(v)), y: y0 + 5 + k * h, width: Math.max(1, Math.abs(x(v) - x(0))), height: Math.max(2, h - 2), rx: 2, fill: colour(k) }, svg);
                    grow(rect, 'x', 'left', 'center');
                    text(svg, Math.max(x(0), x(v)) + 6, y0 + 5 + k * h + h / 2 + 3, withUnit(v, unit), { 'font-size': 12, fill: 'var(--kit-chart-ink)' });
                });
            });
            if (legend) drawLegend(svg, series.map(function (s, k) { return { label: data.series[s], colour: colour(k) }; }), box.left, 14, width - box.left);
            return height;
        }
        var height2 = Math.round(Math.min(420, Math.max(240, width * 0.5))) + legend;
        var b = plotBox(svg, width, height2, data, unit, axis);
        b.top = 10 + legend;
        var y = function (v) { return b.bottom - (v - lo) / (hi - lo) * (b.bottom - b.top); };
        drawAxes(svg, b, y, unit, axis);
        var band = (b.right - b.left) / Math.max(1, rows.length);
        var every = Math.max(1, Math.ceil(rows.length / Math.max(1, Math.floor((b.right - b.left) / 56))));
        rows.forEach(function (r, i) {
            var x0 = b.left + i * band;
            var inner = Math.min(band * 0.72, 56 * series.length);
            var w = inner / series.length;
            series.forEach(function (s, k) {
                var v = r.values[s];
                if (v == null) return;
                var rect = make('rect', { class: 'kit-chart__mark', 'data-chart-item': r.id, x: x0 + (band - inner) / 2 + k * w, y: Math.min(y(0), y(v)), width: Math.max(1, w - 2), height: Math.max(1, Math.abs(y(v) - y(0))), rx: 2, fill: colour(k) }, svg);
                grow(rect, 'y', 'center', 'bottom');
            });
            if (i % every === 0) text(svg, x0 + band / 2, b.bottom + 18, shortLabel(r.label, band * every), { 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--kit-chart-muted)' });
        });
        if (legend) drawLegend(svg, series.map(function (s, k) { return { label: data.series[s], colour: colour(k) }; }), b.left, 14, b.right - b.left);
        return height2;
    };

    /** Columns with each series stacked on the one before: a total and what it is made of. */
    var stack = function (svg, width, rows, series, data, unit) {
        var totals = rows.map(function (r) { return series.reduce(function (sum, s) { return sum + Math.max(0, r.values[s] || 0); }, 0); });
        var axis = ticks(0, Math.max.apply(null, totals.concat([1])), 3);
        var hi = axis[axis.length - 1];
        var legend = series.length > 1 ? 30 : 0;
        var height = Math.round(Math.min(420, Math.max(220, width * 0.4))) + legend;
        var b = plotBox(svg, width, height, data, unit, axis);
        b.top = 10 + legend;
        var y = function (v) { return b.bottom - v / hi * (b.bottom - b.top); };
        drawAxes(svg, b, y, unit, axis);
        var band = (b.right - b.left) / Math.max(1, rows.length);
        var every = Math.max(1, Math.ceil(rows.length / Math.max(1, Math.floor((b.right - b.left) / 56))));
        rows.forEach(function (r, i) {
            var w = Math.min(band * 0.64, 48);
            var x0 = b.left + i * band + (band - w) / 2;
            var at = 0;
            series.forEach(function (s, k) {
                var v = Math.max(0, r.values[s] || 0);
                if (!v) return;
                var rect = make('rect', { class: 'kit-chart__mark', 'data-chart-item': r.id, x: x0, y: y(at + v), width: w, height: Math.max(1, y(at) - y(at + v)), fill: colour(k) }, svg);
                grow(rect, 'y', 'center', 'bottom');
                at += v;
            });
            if (i % every === 0) text(svg, x0 + w / 2, b.bottom + 18, shortLabel(r.label, band * every), { 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--kit-chart-muted)' });
        });
        if (legend) drawLegend(svg, series.map(function (s, k) { return { label: data.series[s], colour: colour(k) }; }), b.left, 14, b.right - b.left);
        return height;
    };

    var line = function (svg, width, data, settings, unit, small) {
        var series = shown(data, settings);
        var rows = data.rows;
        var all = [];
        rows.forEach(function (r) { series.forEach(function (s) { if (r.values[s] != null) all.push(r.values[s]); }); });
        if (!all.length) return small ? 48 : 200;
        var min = Math.min.apply(null, all);
        var max = Math.max.apply(null, all);
        var area = settings.variant === 'area';
        var axis = small ? [min, max] : ticks(area ? Math.min(0, min) : (min >= 0 && min < (max - min) ? 0 : min), max, 4);
        var lo = axis[0];
        var hi = axis[axis.length - 1] === lo ? lo + 1 : axis[axis.length - 1];
        var legend = !small && series.length > 1 ? 30 : 0;
        var height = small ? 56 : Math.round(Math.min(420, Math.max(240, width * 0.48))) + legend;
        var b = small ? { left: 4, right: width - 8, top: 6, bottom: height - 6 } : plotBox(svg, width, height, data, unit, axis);
        if (!small) b.top = 10 + legend;
        var y = function (v) { return b.bottom - (v - lo) / (hi - lo) * (b.bottom - b.top); };
        var x = function (i) { return rows.length < 2 ? (b.left + b.right) / 2 : b.left + i / (rows.length - 1) * (b.right - b.left); };
        if (!small) {
            drawAxes(svg, b, y, unit, axis);
            // Labels where they fit: the first, the last, and as many between as leave room.
            var room = 0;
            rows.forEach(function (r) { room = Math.max(room, measureText(svg, r.label) + 16); });
            var every = Math.max(1, Math.ceil(room / Math.max(1, (b.right - b.left) / Math.max(1, rows.length - 1))));
            rows.forEach(function (r, i) {
                var last = i === rows.length - 1;
                if (i % every !== 0 && !last) return;
                if (!last && i > 0 && x(rows.length - 1) - x(i) < room) return;
                text(svg, x(i), b.bottom + 18, r.label, { 'text-anchor': i === 0 ? 'start' : (last ? 'end' : 'middle'), 'font-size': 12, fill: 'var(--kit-chart-muted)' });
            });
        }
        series.forEach(function (s, k) {
            var pts = [];
            rows.forEach(function (r, i) { if (r.values[s] != null) pts.push([x(i), y(r.values[s]), r]); });
            if (!pts.length) return;
            var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
            if (area && !small) {
                var fill = make('path', { d: d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + y(Math.max(lo, 0)).toFixed(1) + ' L' + pts[0][0].toFixed(1) + ' ' + y(Math.max(lo, 0)).toFixed(1) + ' Z', fill: colour(k), 'fill-opacity': k ? 0.12 : 0.18, class: 'kit-chart__area' }, svg);
                grow(fill, 'y', 'center', 'bottom');
            }
            var path = make('path', { d: d, fill: 'none', stroke: colour(k), 'stroke-width': small ? 2 : 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': k && !small ? '6 5' : null, class: 'kit-chart__line' }, svg);
            if (!k || small) trace(path);
            if (!small && settings.markers !== 'off') {
                pts.forEach(function (p) { make('circle', { class: 'kit-chart__mark', 'data-chart-item': p[2].id, cx: p[0], cy: p[1], r: 4, fill: 'var(--kit-chart-surface)', stroke: colour(k), 'stroke-width': 2 }, svg); });
            } else if (small) {
                var last = pts[pts.length - 1];
                make('circle', { class: 'kit-chart__mark', 'data-chart-item': last[2].id, cx: last[0], cy: last[1], r: 3.5, fill: colour(k) }, svg);
            }
            if (!small) {
                // Every point can be pointed at in the editor, markers on or off.
                pts.forEach(function (p) { make('circle', { class: 'kit-chart__hit', 'data-chart-item': p[2].id, cx: p[0], cy: p[1], r: 12, fill: 'transparent' }, svg); });
            }
        });
        if (legend) drawLegend(svg, series.map(function (s, k) { return { label: data.series[s], colour: colour(k) }; }), b.left, 14, b.right - b.left);
        return height;
    };

    var donut = function (svg, width, data, settings, unit) {
        var rows = data.rows.filter(function (r) { return r.values[0] != null && r.values[0] > 0; });
        if (rows.length > MOST_SLICES) {
            var kept = rows.slice(0, MOST_SLICES - 1);
            var rest = rows.slice(MOST_SLICES - 1).reduce(function (sum, r) { return sum + r.values[0]; }, 0);
            rows = kept.concat([{ id: rows[MOST_SLICES - 1].id, label: 'Other', values: [rest] }]);
        }
        var total = rows.reduce(function (sum, r) { return sum + r.values[0]; }, 0) || 1;
        var side = width < 520;
        var size = Math.min(side ? width : width * 0.45, side ? 240 : 300);
        var r = size / 2 - 4;
        var cx = side ? width / 2 : size / 2 + 4;
        var cy = size / 2 + 4;
        var hole = settings.variant === 'pie' ? 0 : r * 0.6;
        var angle = -Math.PI / 2;
        rows.forEach(function (row, i) {
            var sweep = row.values[0] / total * Math.PI * 2;
            var a0 = angle;
            var a1 = angle + Math.min(sweep, Math.PI * 2 - 0.0001);
            angle += sweep;
            var large = a1 - a0 > Math.PI ? 1 : 0;
            var p = function (rad, a) { return (cx + rad * Math.cos(a)).toFixed(2) + ' ' + (cy + rad * Math.sin(a)).toFixed(2); };
            var d = 'M' + p(r, a0) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p(r, a1)
                + (hole ? ' L' + p(hole, a1) + ' A' + hole + ' ' + hole + ' 0 ' + large + ' 0 ' + p(hole, a0) + ' Z' : ' L' + cx + ' ' + cy + ' Z');
            var slice = make('path', { class: 'kit-chart__mark', 'data-chart-item': row.id, d: d, fill: colour(i), stroke: 'var(--kit-chart-surface)', 'stroke-width': 2 }, svg);
            grow(slice, 'both', 'center', 'center');
            slice.style.transformOrigin = cx + 'px ' + cy + 'px';
            slice.style.transformBox = 'view-box';
            slice.style.setProperty('--kit-from-x', '0.8');
            slice.style.setProperty('--kit-from-y', '0.8');
        });
        var lx = side ? 8 : size + 40;
        var lw = side ? width - 16 : Math.min(width - lx - 8, 380);
        var ly = side ? size + 28 : Math.max(20, cy - rows.length * 14);
        var g = make('g', { class: 'kit-chart__legend', 'font-size': 14, fill: 'var(--kit-chart-ink)' }, svg);
        rows.forEach(function (row, i) {
            var y = ly + i * 28;
            make('rect', { x: lx, y: y - 11, width: 14, height: 14, rx: 3, fill: colour(i) }, g);
            text(g, lx + 24, y, shortLabel(row.label, lw - 90));
            text(g, lx + lw, y, withUnit(row.values[0], unit), { 'text-anchor': 'end', 'font-weight': 600 });
        });
        return side ? ly + rows.length * 28 : Math.max(size + 8, ly + rows.length * 28);
    };

    var funnel = function (svg, width, data, settings, unit) {
        var rows = data.rows.filter(function (r) { return r.values[0] != null; });
        var top = Math.max.apply(null, rows.map(function (r) { return r.values[0]; }).concat([1]));
        // On a narrow screen the words go above each stage rather than beside it.
        var stacked = width < 520;
        var rowH = stacked ? 78 : 52;
        var labelRoom = stacked ? 0 : Math.min(width * 0.38, 260);
        var room = width - labelRoom - (stacked ? 0 : 8);
        rows.forEach(function (row, i) {
            var y = i * rowH;
            var w = Math.max(4, row.values[0] / top * room);
            var x = labelRoom + (room - w) / 2;
            var barTop = stacked ? y + 40 : y + 4;
            var rect = make('rect', { class: 'kit-chart__mark', 'data-chart-item': row.id, x: x, y: barTop, width: w, height: stacked ? 30 : rowH - 10, rx: 3 }, svg);
            rect.setAttribute('fill', i === 0 ? 'var(--kit-chart-2)' : 'var(--kit-chart-1)');
            rect.setAttribute('fill-opacity', String(1 - Math.min(0.5, i * 0.12)));
            grow(rect, 'x', 'center', 'center');
            text(svg, 0, stacked ? y + 14 : y + rowH / 2 - 2, shortLabel(row.label, (stacked ? width : labelRoom) - 12), { 'font-size': 14, fill: 'var(--kit-chart-ink)', 'font-weight': 600 });
            var prev = i ? rows[i - 1].values[0] : null;
            var said = withUnit(row.values[0], unit) + (prev ? ' · ' + Math.round(row.values[0] / prev * 100) + '% of the stage before' : '');
            text(svg, 0, stacked ? y + 32 : y + rowH / 2 + 15, said, { 'font-size': 12, fill: 'var(--kit-chart-muted)' });
        });
        return rows.length * rowH;
    };

    var progress = function (svg, width, data, settings, unit) {
        var rows = data.rows;
        var rowH = 64;
        rows.forEach(function (row, i) {
            var y = i * rowH;
            var v = row.values[0] || 0;
            var target = row.values[1] || 0;
            var top = Math.max(v, target, 1);
            var share = target ? Math.round(v / target * 100) : null;
            text(svg, 0, y + 18, shortLabel(row.label, width * 0.55), { 'font-size': 14, 'font-weight': 600, fill: 'var(--kit-chart-ink)' });
            text(svg, width, y + 18, withUnit(v, unit) + (target ? ' of ' + withUnit(target, unit) + (share != null ? ' · ' + share + '%' : '') : ''), { 'font-size': 13, 'text-anchor': 'end', fill: 'var(--kit-chart-muted)' });
            make('rect', { x: 0, y: y + 28, width: width, height: 12, rx: 6, fill: 'var(--kit-chart-track)' }, svg);
            var fill = make('rect', { class: 'kit-chart__mark', 'data-chart-item': row.id, x: 0, y: y + 28, width: Math.max(0, v / top * width), height: 12, rx: 6, fill: v >= target && target ? 'var(--kit-chart-2)' : 'var(--kit-chart-1)' }, svg);
            grow(fill, 'x', 'left', 'center');
            if (target) make('rect', { x: Math.min(width - 3, target / top * width - 1.5), y: y + 22, width: 3, height: 24, rx: 1, fill: 'var(--kit-chart-ink)' }, svg);
        });
        return rows.length * rowH;
    };

    /* ------------------------------------------------------------------ one chart */

    var summary = function (chart, kind, data, unit) {
        var readout = words(chart.querySelector('.kit-chart__readout, [data-field="readout"]'));
        var title = words(chart.querySelector('.kit-data__title, [data-field="title"]'));
        var listed = data.rows.slice(0, 12).map(function (r) {
            return r.label + ' ' + r.values.filter(function (v) { return v != null; }).map(function (v) { return withUnit(v, unit); }).join(' and ');
        }).join(', ');
        var noun = { bar: 'Bar chart', line: 'Line chart', donut: 'Donut chart', funnel: 'Funnel', progress: 'Progress against target', sparkline: 'Sparkline' }[kind];
        return [noun + (title ? ' of ' + title : ''), readout, listed].filter(Boolean).join('. ') + '.';
    };

    var drawChart = function (chart, first) {
        var kind = chart.getAttribute('data-chart');
        if (KINDS.indexOf(kind) === -1) return;
        var plot = chart.querySelector('[data-chart-plot]');
        if (!plot) return;
        var width = Math.floor(plot.clientWidth || plot.getBoundingClientRect().width);
        if (width < 40) return;
        var data = dataOf(chart);
        var unit = unitOf(chart);
        var settings = settingsOf(chart);
        var svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('role', 'img');
        svg.setAttribute('focusable', 'false');
        // A template that moves its charts with its own motion says so (data-chart-motion="template").
        var enter = first && !reduced() && chart.getAttribute('data-chart-motion') !== 'template';
        svg.setAttribute('class', 'kit-chart__svg' + (enter ? ' kit-chart--enter' : ''));
        svg.setAttribute('font-family', 'inherit');
        // Measured in the page before it is shown, so labels are laid out by their real widths.
        svg.setAttribute('width', String(width));
        svg.style.position = 'absolute';
        svg.style.visibility = 'hidden';
        plot.appendChild(svg);
        var height = 0;
        if (kind === 'bar') height = bar(svg, width, data, settings, unit);
        else if (kind === 'line') height = line(svg, width, data, settings, unit, false);
        else if (kind === 'sparkline') height = line(svg, width, data, { variant: 'line', markers: 'off', series: '1' }, unit, true);
        else if (kind === 'donut') height = donut(svg, width, data, settings, unit);
        else if (kind === 'funnel') height = funnel(svg, width, data, settings, unit);
        else if (kind === 'progress') height = progress(svg, width, data, settings, unit);
        height = Math.max(10, Math.ceil(height + 4));
        svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        svg.setAttribute('height', String(height));
        svg.setAttribute('aria-label', summary(chart, kind, data, unit));
        svg.style.position = '';
        svg.style.visibility = '';
        [].slice.call(plot.children).forEach(function (child) { if (child !== svg) plot.removeChild(child); });

        workOut(chart, data, unit);
    };

    /* ------------------------------------------------------------------ a table the owner adds */

    var fitTable = function (table) {
        var head = table.tHead && table.tHead.rows[0];
        var names = head ? [].slice.call(head.cells).map(words) : [];
        var body = [].slice.call(table.tBodies).reduce(function (rows, b) { return rows.concat([].slice.call(b.rows)); }, []);
        var figures = names.map(function (_, col) {
            var cells = body.map(function (tr) { return tr.cells[col]; }).filter(Boolean);
            return cells.length > 0 && cells.every(function (c) { var w = words(c); return w === '' || /^[-−+]?[$£€¥₦₹]?\s?[\d.,]+\s?(%|[a-zA-Z]{0,3})$/.test(w); })
                && cells.some(function (c) { return words(c) !== ''; });
        });
        body.forEach(function (tr) {
            [].slice.call(tr.cells).forEach(function (cell, col) {
                var name = names[col] || '';
                if (cell.getAttribute('data-th') !== name) cell.setAttribute('data-th', name);
                cell.classList.toggle('is-figure', Boolean(figures[col]));
            });
        });
        if (head) [].slice.call(head.cells).forEach(function (cell, col) { cell.classList.toggle('is-figure', Boolean(figures[col])); });
    };

    /* ------------------------------------------------------------------ keeping it in step */

    var watched = typeof WeakSet === 'function' ? new WeakSet() : null;
    var pending = new Set();
    var scheduled = false;

    var flush = function () {
        scheduled = false;
        var now = Array.from(pending);
        pending.clear();
        now.forEach(function (el) {
            if (!el.isConnected) return;
            if (el.hasAttribute('data-chart')) drawChart(el, false);
            else fitTable(el.matches('table') ? el : el.querySelector('table'));
        });
    };
    var later = function (el) {
        pending.add(el);
        if (!scheduled) { scheduled = true; (window.requestAnimationFrame || setTimeout)(flush); }
    };

    var watch = function (el) {
        if (watched && watched.has(el)) return;
        if (watched) watched.add(el);
        if (typeof MutationObserver === 'function') {
            new MutationObserver(function (records) {
                for (var i = 0; i < records.length; i++) {
                    var target = records[i].target;
                    var node = target.nodeType === 1 ? target : target.parentNode;
                    // What this script draws is not a change to redraw for.
                    if (node && node.closest && !node.closest('[data-chart-plot], [data-chart-latest], [data-kit-computed]')) { later(el); return; }
                }
            }).observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-chart-variant', 'data-chart-order', 'data-chart-markers', 'data-chart-series', 'hidden'] });
        }
        if (typeof ResizeObserver === 'function' && el.hasAttribute('data-chart')) {
            var plot = el.querySelector('[data-chart-plot]');
            var lastWidth = 0;
            if (plot) new ResizeObserver(function () {
                var w = Math.floor(plot.clientWidth);
                if (Math.abs(w - lastWidth) > 2) { lastWidth = w; later(el); }
            }).observe(plot);
        }
    };

    var draw = function (root) {
        var scope = root || document;
        if (scope.ownerDocument || scope === document) baseIn(scope.ownerDocument || document);
        [].slice.call(scope.querySelectorAll('[data-chart]')).forEach(function (chart) {
            var first = !(watched && watched.has(chart));
            drawChart(chart, first);
            watch(chart);
        });
        [].slice.call(scope.querySelectorAll('[data-kit-table]')).forEach(function (block) {
            var table = block.matches('table') ? block : block.querySelector('table');
            if (!table) return;
            fitTable(table);
            watch(block);
        });
    };

    window.kitData = { version: '1.0.0', draw: draw, figure: figure, withUnit: withUnit, dataOf: dataOf };

    // A chart or table that arrives later (an editor adding a section in place) is drawn too.
    var start = function () {
        draw(document);
        if (typeof MutationObserver === 'function') {
            new MutationObserver(function (records) {
                for (var i = 0; i < records.length; i++) {
                    var added = records[i].addedNodes;
                    for (var j = 0; j < added.length; j++) {
                        var n = added[j];
                        if (n.nodeType === 1 && (n.matches('[data-chart], [data-kit-table]') || n.querySelector('[data-chart], [data-kit-table]'))) { draw(n.parentNode || document); return; }
                    }
                }
            }).observe(document.body, { childList: true, subtree: true });
        }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
