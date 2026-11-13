/**
 * One name for each part of a page, wherever the owner meets it (owner, 13 Nov 2026: "how come we are using another
 * nomenclature"; "since the label already helps live edit"; "why not ai ask and voice follow same pattern"). The
 * editor's panel and the label on the page (live-edit.js describeElement), Ask AI and voice (chat-page.js, the names
 * the AI is given and its change cards say) and the Delete window all call a part by this. Before, the panel named The
 * Speaker's hero paragraph "Introduction" from the designer's field name while Ask AI called it "Paragraph at the
 * top", and the owner asked for the paragraph and was shown an Introduction.
 *
 *   1. the name the page gives it (data-edit-label);
 *   2. the parts at the top of a page as owners say them: "Heading at the top", "Paragraph at the top";
 *   3. a picture: "Logo" in the header or menu, else "Photo";
 *   4. the template's field name when it is a word an owner uses ("Price", "Phone number", "Date"), never the words a
 *      designer uses for how a part reads (lead, intro, text, body) or for what it is (button, link);
 *   5. what it is: "Heading", "Paragraph", the "Book me" button, a "Sample note";
 *   6. else its own words in quotes ("Booking January to September 2027").
 *
 * '' when none of these says what it is: the caller names it its own way (a card by its list, a section by its band).
 */
export const FIELD_NAMES = {
    title: 'Heading', heading: 'Heading', text: 'Text', body: 'Text',
    name: 'Name', notes: 'Notes', family: 'Category', price: 'Price', size: 'Size', label: 'Label',
    photo: 'Photo', image: 'Photo', logo: 'Logo', caption: 'Caption', quote: 'Quote', source: 'Who said it',
    cta: 'Button', button: 'Button', link: 'Link', email: 'Email address', phone: 'Phone number',
    address: 'Address', date: 'Date', time: 'Time', question: 'Question', answer: 'Answer', story: 'Description',
    description: 'Description', amount: 'Amount', meta: 'Details', note: 'Note', fine: 'Small print',
    kind: 'Type', type: 'Type', conn: 'Connection', cloth: 'Cloth', cols: 'Colours', colours: 'Colours', k: 'Key numbers',
    // Words templates name their fields with, said as an owner would (first-time owner walk, 7 Nov 2026).
    car: 'Car', vehicle: 'Vehicle', role: 'Role', job: 'Job title', rating: 'Rating', location: 'Location', city: 'City',
    hours: 'Opening hours', duration: 'How long it takes', eyebrow: 'Small heading above', subtitle: 'Subheading',
    summary: 'Summary', excerpt: 'Summary', author: 'Author', company: 'Company', tag: 'Tag', badge: 'Badge',
    sample: 'Sample note', step: 'Step', number: 'Number', stat: 'Figure', figure: 'Figure', unit: 'Unit',
    day: 'Day', month: 'Month', year: 'Year', venue: 'Place', place: 'Place', detail: 'Details', details: 'Details',
};


/** Field words that say how a part is written, not what it is to the owner: it is named by what it is instead. */
const NOT_NAMES = new Set(['text', 'body', 'title', 'heading', 'cta', 'button', 'link', 'label']);

const words = (element, most) => {
    const said = String(element.textContent ?? '').replace(/\s+/g, ' ').trim();

    return said.length > most ? `${said.slice(0, most - 1)}\u2026` : said;
};

const fieldName = (field) => {
    const raw = String(field ?? '').toLowerCase();
    if (!raw || NOT_NAMES.has(raw)) return '';
    if (FIELD_NAMES[raw]) return FIELD_NAMES[raw];
    // names made of parts ("price-saloon", "hero-lead"): the part an owner knows, and what it is of
    const parts = raw.split(/[-_]+/).filter(Boolean);
    if (parts.length > 1) {
        if (FIELD_NAMES[parts[0]] && !NOT_NAMES.has(parts[0])) return `${FIELD_NAMES[parts[0]]}, ${parts.slice(1).join(' ')}`;
        if (FIELD_NAMES[parts.at(-1)] && !NOT_NAMES.has(parts.at(-1))) return FIELD_NAMES[parts.at(-1)];
    }

    return '';
};

export const partName = (element) => {
    if (!element?.getAttribute) return '';
    const given = element.getAttribute('data-edit-label');
    if (given) return given.length > 80 ? given.slice(0, 80) : given;

    const picture = element.hasAttribute('data-edit-img') || element.hasAttribute('data-edit-bg') || element.tagName === 'IMG';
    const isText = !picture && element.hasAttribute('data-edit');
    const hero = element.getAttribute('data-hero');
    if (isText && hero === 'headline') return 'Heading at the top';
    if (isText && hero === 'intro' && !element.closest('a, button')) {
        return /lead|intro|sub|summary|text/i.test(element.getAttribute('data-field') || '') ? 'Paragraph at the top' : 'Line under the paragraph at the top';
    }
    if (picture) {
        const named = `${element.getAttribute('class') || ''} ${element.getAttribute('src') || ''} ${element.closest('a')?.getAttribute('class') || ''}`;

        return element.closest('header, nav') || /logo|brand-mark/i.test(named) ? 'Logo' : 'Photo';
    }
    if (!isText) return '';

    // the template's own sample marks ("Sample", "(Sample fees)"), as the panel calls them
    if (element.hasAttribute('data-sample-note')) return 'Sample note';
    const owners = fieldName(element.getAttribute('data-field'));
    if (owners) return owners;
    if (/^H[1-6]$/.test(element.tagName)) return 'Heading';
    if (element.tagName === 'BUTTON' || element.closest('a, button')) {
        const said = words(element, 40);

        return said ? `\u201C${said}\u201D button` : 'Button';
    }
    if (element.tagName === 'P') return 'Paragraph';
    // words with no name of their own (a line inside a paragraph, a date): called by what they say, never by their
    // section alone (owner, 13 Nov 2026: "Delete any sample text" was reported as "Jordan Reese (the hero, at the top):
    // deleted")
    const said = words(element, 40);

    return said ? `\u201C${said}\u201D` : '';
};
