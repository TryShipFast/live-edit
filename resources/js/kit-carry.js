/**
 * On a form's page: the record a visitor asked about in a search, carried into the form
 * (resources/dist/kit-carry.js, under 1 KB). The page whose form a record's "Request a quote" leads to needs only
 * this, never the search itself, so the host gives it this file alone (TheSearchKitScript); kit-search.js runs it
 * too, for a page that holds a search and the form.
 *
 * ?from=search&record=<id>&about=<words> fills the form's message with the record ("Request a quote for:
 * 2-1586-3, Main wheel brake assembly, Condition: SV") and keeps its id in a hidden field, so the request names
 * what was asked about.
 */
export function carry(doc = document, win = window) {
    const params = new URLSearchParams(win.location.search);
    if (params.get('from') !== 'search' || !params.get('about')) return false;
    const about = params.get('about').slice(0, 200);
    const id = (params.get('record') ?? '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
    const forms = [...doc.querySelectorAll('[data-component^="form."] form, form[data-component^="form."], form')]
        .filter((form) => !form.closest('[data-search]') && !/newsletter|search/.test(form.closest('[data-component]')?.getAttribute('data-component') ?? '') && form.querySelector('textarea, input[type="text"]'));
    const order = ['quote', 'rfq', 'enquiry', 'contact', 'booking'];
    const purpose = (form) => form.closest('[data-component]')?.getAttribute('data-component') ?? form.getAttribute('data-component') ?? '';
    forms.sort((a, b) => {
        const rank = (form) => { const at = order.findIndex((word) => purpose(form).includes(word)); return at < 0 ? order.length : at; };
        return rank(a) - rank(b);
    });
    const form = forms[0];
    if (!form) return false;
    const message = form.querySelector('[data-carry-pn]') ?? form.querySelector('textarea[name*="message" i], textarea[name*="detail" i], textarea[name*="enquir" i]') ?? form.querySelector('textarea');
    const words = `Request a quote for: ${about}`;
    if (message && !message.value.trim()) message.value = message.matches('[data-carry-pn]') ? about : words;
    // What the request is for, where the form asks (Owena's "I want to"): the template's own default for a
    // record (an option marked data-search-purpose), else the one option that plainly means buying. Two or none
    // that could be it: left for the visitor, never guessed.
    for (const select of form.querySelectorAll('select')) {
        if (select.value) continue;
        const options = [...select.options].filter((o) => o.value);
        const marked = options.filter((o) => o.hasAttribute('data-search-purpose'));
        const buying = options.filter((o) => /\b(buy|buying|purchase|order)\b/i.test(o.textContent));
        const pick = marked.length === 1 ? marked[0] : (marked.length === 0 && buying.length === 1 ? buying[0] : null);
        if (pick) {
            select.value = pick.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            break;
        }
    }
    const kept = form.querySelector('[data-carried-field]');
    if (kept && !kept.value) kept.value = about;
    if (id && !form.querySelector('input[name="search_record"]')) {
        const hidden = doc.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'search_record';
        hidden.value = id;
        form.append(hidden);
    }
    const carried = doc.querySelector('[data-carried]');
    const carriedList = doc.querySelector('[data-carried-list]');
    if (carried && carriedList && !carriedList.children.length) {
        const li = doc.createElement('li');
        li.textContent = about;
        carriedList.append(li);
        carried.hidden = false;
    }

    return true;
}


