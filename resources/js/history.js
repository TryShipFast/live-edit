/**
 * History, said the way people already read it (owner, 8 Nov 2026: "published changes needs to be fixed too, it's
 * confusing"; Google Docs' Version history, Wix's Site history, Shopify's timeline).
 *
 * Each publish is one entry: when ("2 days ago", the exact day and time on hover), who ("You" or the teammate's name),
 * and what changed, by page and section as the owner names them, with the words before and after: "Packages ·
 * Service price list" then "Price: “₦25,000” → “₦28,000”". A publish of nothing is not shown. A list says what
 * happened to it ("Removed a section"), a sale says what shoppers see ("On sale at ₦49,950 until 15 Nov").
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Just now", "5 minutes ago", "1 hour ago", "1 day ago", "6 days ago", then the day itself. */
export const agoSaid = (iso, now = Date.now()) => {
    if (!iso) return '';
    const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
    const said = (n, one) => `${n} ${one}${n === 1 ? '' : 's'} ago`;
    if (seconds < 90) return 'Just now';
    if (seconds < 3600) return said(Math.round(seconds / 60), 'minute');
    if (seconds < 86400) return said(Math.round(seconds / 3600), 'hour');
    if (seconds < 86400 * 8) return said(Math.round(seconds / 86400), 'day');

    return exactSaid(iso, { time: false });
};

/** "Sat 8 Nov, 2:14pm" in the reader's own time. */
export const exactSaid = (iso, { time = true } = {}) => {
    const at = new Date(iso);
    if (Number.isNaN(at.getTime())) return '';
    const day = `${DAYS[at.getDay()]} ${at.getDate()} ${MONTHS[at.getMonth()]}${at.getFullYear() !== new Date().getFullYear() ? ` ${at.getFullYear()}` : ''}`;
    if (!time) return day;
    const hours = at.getHours();

    return `${day}, ${hours % 12 || 12}:${String(at.getMinutes()).padStart(2, '0')}${hours < 12 ? 'am' : 'pm'}`;
};

/** Words shortened to about sixty characters, on a word. */
export const shortWords = (words, most = 60) => {
    const said = String(words ?? '').replace(/\s+/g, ' ').trim();
    if (said.length <= most) return said;
    const cut = said.slice(0, most);

    return `${cut.slice(0, cut.lastIndexOf(' ') > most * 0.6 ? cut.lastIndexOf(' ') : most).trim()}…`;
};

/** The page a change was on, by its title, from its part of the page ("section:packages.prices"). */
export const pageOfUnit = (unit, pages = []) => {
    const said = String(unit ?? '');
    if (said.startsWith('site/')) return 'Every page';
    const id = said.startsWith('section:') ? said.slice(8).split('.')[0]
        : said.startsWith('arrangement:') ? said.slice(12)
            : null;
    if (!id) return null;
    const page = pages.find((p) => String(p.id ?? '').replace(/\//g, '-') === id || (id === 'home' && (p.id === '' || p.id === 'home')));

    return page ? (page.title || 'Home') : null;
};

const capital = (words) => (words ? words.charAt(0).toUpperCase() + words.slice(1) : words);
const SAID_FOR_NOTHING = /^(this part of the page|page layout|other changes)$/i;

/** A list's change in words: "Removed a section", "Added 2 cards", "Changed the order of the cards". */
export const listSaid = (list, noun = 'card') => {
    const said = String(list ?? '');
    const many = (n) => (n === 1 ? `a ${noun}` : `${n} ${noun}s`);
    let found = said.match(/^(\d+) items? added/);
    if (found) return `Added ${many(Number(found[1]))}`;
    found = said.match(/^(\d+) items? removed/);
    if (found) return `Removed ${many(Number(found[1]))}`;
    if (/order changed/i.test(said)) return `Changed the order of the ${noun}s`;
    if (/unchanged/i.test(said)) return null;
    found = said.match(/A list of (\d+) items?/);
    if (found) return `Set ${found[1]} ${noun}${found[1] === '1' ? '' : 's'}`;

    return said || null;
};

/** One change in words: "Price: “₦25,000” → “₦28,000”", "Heading: “Spring sale”", "Removed a section". */
export const changeSaid = (line) => {
    if (line.list) return listSaid(line.list, String(line.unit ?? '').startsWith('arrangement:') ? 'section' : 'card');
    if (line.kind === 'style') return 'Changed how it looks';
    const what = capital(String(line.what ?? '').replace(/^the /, '')) || 'Words';
    const after = typeof line.after === 'string' ? shortWords(line.after) : null;
    const before = typeof line.before === 'string' ? shortWords(line.before) : null;
    if (after === null) return `${what} changed`;
    if (after === '') return `${what}: removed`;
    if (before === null || before === after) return `${what}: “${after}”`;
    if (before === '') return `${what}: added “${after}”`;

    return `${what}: “${before}” → “${after}”`;
};

/** A product's sale, set in the sale grid, in one sentence: "On sale at ₦49,950 until 15 Nov". */
const saleSaid = (lines) => {
    const after = (what) => lines.find((line) => line.what === what)?.after;
    const price = after('the sale price');
    if (price === undefined) return null;
    if (!/\d/.test(String(price))) return 'Taken off sale';
    const until = after('the sale end day');
    const from = after('the sale start day');
    const day = (words) => String(words).replace(/ \d{4}$/, '');

    return `On sale at ${price}${from && /\d/.test(from) ? ` from ${day(from)}` : ''}${until && /\d/.test(until) ? ` until ${day(until)}` : ''}`;
};
const SALE_WHATS = ['the sale price', 'the sale start day', 'the sale end day'];

/**
 * A publish, ready to show: { who, when, exact, title, count, places: [{ place, changes: [words] }], undoable }.
 * `you` is the reader's id; `pages` the site's pages ({ id, title }) to name them; `all` the versions in view, to
 * name the publish an undo took back.
 */
export const describeVersion = (version, { you = null, pages = [], all = [], now = Date.now() } = {}) => {
    const mine = version.published_by_id && you && version.published_by_id === you;
    const who = mine ? 'You' : (version.published_by || null);
    const lines = version.lines ?? [];
    const places = [];
    for (const line of lines) {
        const page = pageOfUnit(line.unit, pages);
        const section = line.label && !SAID_FOR_NOTHING.test(line.label) ? line.label : null;
        const place = [page, section].filter(Boolean).filter((name, i, both) => both.indexOf(name) === i).join(' · ');
        let group = places.find((entry) => entry.place === place);
        if (!group) {
            group = { place, lines: [] };
            places.push(group);
        }
        group.lines.push(line);
    }
    const described = places.map(({ place, lines: here }) => {
        const sale = saleSaid(here);
        const rest = sale ? here.filter((line) => !SALE_WHATS.includes(line.what)) : here;
        const changes = [...(sale ? [sale] : []), ...rest.map(changeSaid).filter(Boolean)];

        return { place, changes: line0(changes, here) };
    }).filter((group) => group.changes.length);
    const count = version.changes ?? lines.length;
    const taken = version.undoes ? all.find((other) => other.number === version.undoes) : null;
    let title;
    if (version.undoes) title = `${who ?? 'Someone'} undid ${taken ? `the changes published ${exactSaid(taken.published_at)}` : 'an earlier publish'}`;
    else if (version.restored_from) title = `${who ?? 'Someone'} went back to an earlier version`;
    else title = `${who ? `${who} published` : 'Published'} ${count} change${count === 1 ? '' : 's'}`;

    return {
        number: version.number,
        who,
        title,
        when: agoSaid(version.published_at, now),
        exact: exactSaid(version.published_at),
        count,
        places: described,
        undoable: !version.undoes && !version.restored_from && count > 0 && lines.length > 0 && !all.some((later) => later.undoes === version.number),
        undoneLater: all.some((later) => later.undoes === version.number),
    };
};

// a place with changes nobody could put into words still says how many
const line0 = (changes, lines) => (changes.length ? changes : [`${lines.length} change${lines.length === 1 ? '' : 's'}`]);

/** The publishes worth showing: never one that changed nothing. */
export const versionsWorthShowing = (versions = []) => versions.filter((version) => (version.changes ?? 0) > 0 || (version.lines ?? []).length > 0);
