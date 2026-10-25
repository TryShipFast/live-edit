/**
 * The Help menu's content: what this kind of website is for, where to start, a guide for every list
 * the site really has, and the questions people new to editing ask.
 *
 * A shop owner and a head teacher open the same editor with different jobs to do. The Help menu used
 * to offer both the same ten feature tours ("Edit text or a link", "Replace an image"), which answer
 * how a button works and not what to do first with a shop, a school or a portfolio. So the host says
 * what kind of site this is (window.liveEditSite = { category, kind }, from the template's brief) and
 * the menu leads with that: a few words on what the site is for and the jobs that matter most on it.
 *
 * The task guides come from the page, not from a list written for each template: every named list the
 * site has (its products, courses, projects, team, events) becomes "Add to Products", with steps that
 * point at that list's own cards and mention its settings (a category the filter reads) and its pages
 * (a card that opens its own page) only where the list has them. A site nobody described still gets
 * all of this; it opens with the general profile.
 */

/** The profile for a site: its category and kind as the brief names them (11-ecommerce, shop). */
export const profileFor = (site, { hasShop = false } = {}) => {
    const kind = String(site?.kind ?? '').toLowerCase();
    const category = String(site?.category ?? '').toLowerCase();
    const key = KIND_TO_PROFILE[kind] ?? CATEGORY_TO_PROFILE[category.slice(0, 2)] ?? (hasShop ? 'shop' : 'general');

    return { key, ...PROFILES[key] };
};

const KIND_TO_PROFILE = {
    shop: 'shop',
    school: 'school',
    university: 'university',
    training: 'training',
    salon: 'beauty',
    studio: 'beauty',
    restaurant: 'restaurant',
    hotel: 'hotel',
    charity: 'charity',
    worship: 'worship',
    property: 'property',
    fintech: 'tech',
};

const CATEGORY_TO_PROFILE = {
    '01': 'portfolio',
    '02': 'business',
    '03': 'services',
    '04': 'agency',
    '05': 'beauty',
    '06': 'school',
    '07': 'restaurant',
    '08': 'tech',
    '09': 'health',
    '10': 'charity',
    '11': 'shop',
};

/*
 * Each profile: the heading of the menu, two or three sentences on what the site is for and where to
 * begin, the guides to show first (any this site does not have are left out), and its own questions.
 * Written for somebody who has never edited a website: no jargon, one idea a sentence.
 */
const PROFILES = {
    general: {
        title: 'Help with your website',
        intro: 'Everything you see on the page can be changed by clicking it. Start with your name, your words and your pictures, then publish when you are happy.',
        start: ['getting-started', 'text', 'image', 'lists', 'preview'],
        questions: [],
    },
    shop: {
        title: 'Help with your shop',
        intro: 'Customers browse your products, add them to the bag and check out. Start in the Shop tab: it gathers how customers pay, your WhatsApp number, delivery prices, offers and every product in one place.',
        start: ['shop', 'lists', 'image', 'brand', 'preview'],
        questions: [
            { q: 'How do I add a product?', a: 'Use the guide for your products list below: copy a product card, then change its name, price and photo. In its panel, press Give it its own page: you get a copy of the product page, sizes and all, to change right there.' },
            { q: 'How do I change a price?', a: 'Click the price on the product card or its page and type the new one. The bag and checkout read the price from your words, so they follow it.' },
            { q: 'Do I have to open each product page to change it?', a: 'No. Click a product card and press Edit all details. Its page opens over the shop: click its words, photos or sizes to change them, then press Done.' },
            { q: 'How do I replace the sample products with mine?', a: 'Change a sample into your own with Edit all details, or delete it: Delete this item offers to delete its page too, so nothing is left behind on your website.' },
            { q: 'How do I change delivery prices or the WhatsApp number?', a: 'Open the Shop tab. Each delivery price, the free delivery threshold, any offer code and the WhatsApp number are there, and saving changes every page that shows them.' },
            { q: 'Where do orders go?', a: 'Your checkout offers the ways to pay listed in the Shop tab. A WhatsApp order arrives in WhatsApp as a message listing what the customer chose.' },
            { q: 'How do I put a product in a category?', a: 'Click the product card. Its panel has a setting for the category the shop filter reads, so the product appears under the right filter.' },
        ],
    },
    school: {
        title: 'Help with your school website',
        intro: 'Parents and pupils come here for admissions, dates and news. Keep those current: add news and events as the term goes on, and check the fees and dates before each new term.',
        start: ['lists', 'text', 'image', 'menu', 'preview'],
        questions: [
            { q: 'How do I add news or an event?', a: 'Use the guide for your news or events list below: copy a card, then change its title, date and picture.' },
            { q: 'How do I update term dates or fees?', a: 'Click the dates or figures where they appear and type the new ones. Each is saved as a draft until you publish.' },
            { q: 'How do I change the admissions steps?', a: 'Click each step to change its words. The steps are a list, so you can copy one to add a step or delete one you no longer need.' },
            { q: 'How do I add a member of staff?', a: 'Use the guide for your staff list: copy a person, then change the name, role and photo.' },
        ],
    },
    university: {
        title: 'Help with your university website',
        intro: 'Applicants look for courses, fees and how to apply; students look for dates and news. Keep the course list and the key dates current, and publish when you are happy.',
        start: ['lists', 'text', 'image', 'menu', 'pages', 'preview'],
        questions: [
            { q: 'How do I add a course?', a: 'Use the guide for your courses list below: copy a course card, change its name and details, and give it its own page from its panel.' },
            { q: 'How do I update entry requirements or fees?', a: 'Click the words or figures on the course page and type the new ones.' },
            { q: 'How do I add a news story?', a: 'Use the guide for your news list: copy a story card, then change its headline, date and picture.' },
        ],
    },
    training: {
        title: 'Help with your training website',
        intro: 'Learners come to compare courses, dates and prices, then book. Keep the course list and the next start dates current.',
        start: ['lists', 'text', 'image', 'pages', 'preview'],
        questions: [
            { q: 'How do I add a course?', a: 'Use the guide for your courses list below: copy a course card, change its name, length and price, and give it its own page from its panel.' },
            { q: 'How do I change the next start date?', a: 'Click the date where it appears and type the new one.' },
        ],
    },
    portfolio: {
        title: 'Help with your portfolio',
        intro: 'This site shows who you are and your best work. Put in your name, your photo and your projects first, then the way people can reach you.',
        start: ['getting-started', 'lists', 'image', 'brand', 'preview'],
        questions: [
            { q: 'How do I add a project?', a: 'Use the guide for your projects list below: copy a project card, then change its title, picture and words. Give it its own page from its panel to tell its full story.' },
            { q: 'Do I have to open each project to change it?', a: 'No. Click a project card and press Edit all details: its page opens over the list, and you change it by clicking it, the same way as everywhere else.' },
            { q: 'How do I change my photo?', a: 'Click your photo and choose one of your own, a free photo, or ask for a new one, then save.' },
            { q: 'How do I change how people contact me?', a: 'Click your email, phone or social links. Each opens with its words and where it goes.' },
        ],
    },
    business: {
        title: 'Help with your business website',
        intro: 'Visitors want to know what you do, who you have done it for and how to get in touch. Start with your services and the proof of your work, then your contact details.',
        start: ['getting-started', 'lists', 'menu', 'image', 'preview'],
        questions: [
            { q: 'How do I add a service or a project?', a: 'Use the guide for that list below: copy a card, then change its words and picture.' },
            { q: 'How do I change the menu?', a: 'Click a menu word to change it and where it goes. Press a menu with an arrow to open it; its own words and every link inside it can be changed too.' },
        ],
    },
    property: {
        title: 'Help with your property website',
        intro: 'Buyers and tenants come to browse listings and get in touch. Keep the listings current: add new ones, mark what has gone and update prices.',
        start: ['lists', 'image', 'text', 'preview'],
        questions: [
            { q: 'How do I add a listing?', a: 'Use the guide for your listings below: copy a listing card, then change its photos, price and details.' },
            { q: 'How do I remove a listing that has sold?', a: 'Click the listing card and press Delete this item in its panel. If it has a page of its own, you can delete that page too, or keep it.' },
        ],
    },
    services: {
        title: 'Help with your practice website',
        intro: 'Clients come to understand your services, see who you are and book a call. Start with your practice areas and your team, then your contact details.',
        start: ['lists', 'text', 'menu', 'image', 'preview'],
        questions: [
            { q: 'How do I add a practice area or service?', a: 'Use the guide for that list below: copy a card and change its words. Give it its own page from its panel for the full detail.' },
            { q: 'How do I add a person to the team?', a: 'Use the guide for your team list: copy a person, then change their name, role and photo.' },
        ],
    },
    agency: {
        title: 'Help with your agency website',
        intro: 'Clients judge you by your work. Keep your case studies fresh and your services clear, then make it easy to start a conversation.',
        start: ['lists', 'image', 'brand', 'preview'],
        questions: [
            { q: 'How do I add a case study?', a: 'Use the guide for your work list below: copy a project card, change its picture and words, and give it its own page from its panel.' },
        ],
    },
    beauty: {
        title: 'Help with your salon website',
        intro: 'Clients come to see your treatments, prices and opening hours, then book. Keep the price list and hours current.',
        start: ['lists', 'text', 'image', 'preview'],
        questions: [
            { q: 'How do I change a price or add a treatment?', a: 'Click a price to change it. To add a treatment, use the guide for that list below: copy one and change its name, length and price.' },
            { q: 'How do I change the opening hours?', a: 'Click the hours where they appear and type the new ones. They may appear in the footer too, so check each place.' },
        ],
    },
    restaurant: {
        title: 'Help with your restaurant website',
        intro: 'Guests come for the menu, your hours and a way to book. Keep the menu and its prices current.',
        start: ['lists', 'text', 'image', 'preview'],
        questions: [
            { q: 'How do I add a dish or change a price?', a: 'Click a price or a dish to change it. To add a dish, use the guide for that menu section below: copy a dish and change its name and price.' },
            { q: 'How do I change the opening hours?', a: 'Click the hours where they appear and type the new ones.' },
        ],
    },
    hotel: {
        title: 'Help with your hotel website',
        intro: 'Guests come to see your rooms, what is included and how to book. Keep the rooms, rates and photos current.',
        start: ['lists', 'image', 'text', 'preview'],
        questions: [
            { q: 'How do I add a room?', a: 'Use the guide for your rooms list below: copy a room card, change its photos and rate, and give it its own page from its panel.' },
        ],
    },
    tech: {
        title: 'Help with your product website',
        intro: 'Visitors want to know what the product does, what it costs and how to start. Keep the features, plans and prices clear.',
        start: ['lists', 'text', 'pages', 'preview'],
        questions: [
            { q: 'How do I change a plan or its price?', a: 'Click the plan name, the price or any feature line and type the new words.' },
            { q: 'How do I add a feature or a customer story?', a: 'Use the guide for that list below: copy a card and change its words and picture.' },
        ],
    },
    health: {
        title: 'Help with your clinic website',
        intro: 'Patients come to find your services, your team and how to book. Keep the services, opening hours and contact details accurate.',
        start: ['lists', 'text', 'image', 'preview'],
        questions: [
            { q: 'How do I add a service or a clinician?', a: 'Use the guide for that list below: copy a card, then change the name, details and photo.' },
            { q: 'How do I change the opening hours?', a: 'Click the hours where they appear and type the new ones.' },
        ],
    },
    charity: {
        title: 'Help with your charity website',
        intro: 'Supporters come to see your work and how to give. Keep your stories and figures current, and make the way to donate easy to find.',
        start: ['lists', 'text', 'image', 'preview'],
        questions: [
            { q: 'How do I add a story or an appeal?', a: 'Use the guide for that list below: copy a card and change its words and picture.' },
            { q: 'How do I change the donation link?', a: 'Click the donate button. Its panel lets you change its words and where it goes.' },
        ],
    },
    worship: {
        title: 'Help with your church website',
        intro: 'Visitors come for service times, events and how to get involved. Keep this week\'s times and upcoming events current.',
        start: ['lists', 'text', 'image', 'preview'],
        questions: [
            { q: 'How do I add an event?', a: 'Use the guide for your events list below: copy an event, then change its name, date and picture.' },
            { q: 'How do I change service times?', a: 'Click the times where they appear and type the new ones.' },
        ],
    },
};

/** Questions everybody asks, shown on every site; each only where the editor has the feature it answers. */
export const commonQuestions = ({ hasPublish = true, hasPages = false, hasBrand = false } = {}) => [
    ...(hasPublish ? [{ q: 'I changed something, but the live site has not changed.', a: 'What you save is a draft only you can see. Press Publish when you are happy, and visitors see it.' }] : []),
    { q: 'How do I undo a mistake?', a: 'Press Undo in the bar to take back your latest change. The Changes tab lists everything you have saved, and each can be undone.' },
    { q: 'Can I break the design?', a: 'No. You change words, pictures, links and colours; the layout keeps its shape and works on phones as it did.' },
    ...(hasPages ? [{ q: 'How do I add a page?', a: 'Press New page in the bar, start from a page your site already has, give it a name, and it opens ready to edit.' }] : []),
    ...(hasBrand ? [{ q: 'How do I change the colours or fonts?', a: 'Open the Brand tab. Choose your colours and two fonts, and the whole site follows.' }] : []),
    { q: 'Where do pictures come from?', a: 'Click a picture and choose one of your own, a free photo, or ask for a new one to be made. Making a picture uses credits; the others are free.' },
    { q: 'Something I want to change cannot be clicked.', a: 'Some parts are fixed by the design, such as the layout itself. If it is words or a picture you need to change, contact whoever set up your website.' },
];

/*
 * The site's lists, each one a guide. A list is a run of cards the owner can add to: products,
 * courses, projects, people. Sections of a page are a list too but have their own guide, and the menu
 * and footer have theirs, so those are left out here.
 */
const isShown = (node) => {
    if (!node?.getClientRects?.().length) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
};

export const listName = (list) => {
    const name = (list.dataset.editListLabel || list.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    if (name.length <= 48) return name;

    // A label that is a sentence (a chooser's every option) is named by its first words.
    return `${name.slice(0, 40).replace(/\s+\S*$/, '').replace(/[\s,.;:]+$/, '')}\u2026`;
};

export const listGuides = (doc = document, { canMakePages = false } = {}) => {
    const seen = new Set();
    const guides = [];

    for (const list of doc.querySelectorAll('[data-edit-list]')) {
        if (list.dataset.editListKind === 'sections' || list.closest('nav, footer, header, [data-live-edit-ui]')) continue;
        const name = listName(list);
        const items = [...list.querySelectorAll(':scope > [data-edit-item]')];
        // Not a list on this page as it is shown (one of a home page's other layouts), nor a pair of
        // buttons: a list that holds two at most is not one an owner adds to.
        if (!name || !items.some(isShown) || Number(list.dataset.editListMax || 99) <= 2 || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        const card = () => items.find(isShown) ?? null;
        const declared = (() => { try { return JSON.parse(list.getAttribute('data-edit-choices') || '[]'); } catch { return []; } })();
        const setting = declared[0]?.label ? String(declared[0].label).toLowerCase() : null;
        const opensAPage = eachOpensItsOwnPage(items);

        const steps = [
            { point: card, title: `These are your ${name}`, copy: `Each card is one of your ${name}. Click a card to open its panel on the right.` },
            { point: card, title: 'Copy one to add another', copy: 'In the card\'s panel, press Duplicate. The copy appears right after it, ready to change. To take one away, press Delete this item.' },
            ...(opensAPage && canMakePages ? [{ point: card, title: 'Change its page from the card', copy: 'In the card\'s panel, press Edit all details. Its page opens over this one: click anything on it to change it, then press Done. When you delete a card, you can delete its page with it.' }] : []),
            { point: card, title: 'Make the copy its own', copy: 'Click the copy\'s words and its picture and change them. Use Move up and Move down in its panel to put it in order.' },
            ...(setting ? [{ point: card, title: `Choose its ${setting}`, copy: `The card's panel has a ${setting} setting. Pick one so the filter on this page shows it in the right place.` }] : []),
            ...(opensAPage && canMakePages ? [{ point: card, title: 'Give it its own page', copy: 'A copied card still opens the page of the card it came from. In its panel, press Give it its own page: it gets a copy of that page, with everything on it, to change without touching the original.' }] : []),
        ];

        guides.push({ id: `list:${guides.length}`, title: `Add to ${name}`, detail: `Add, change or remove one of your ${name}.`, list, steps, score: worth(list, items, { setting, opensAPage }) });
    }

    // The lists an owner adds to most come first: see worth().
    return guides.sort((a, b) => b.score - a.score);
};

/*
 * Whether the cards each open a page of their own: a link on every card (or nearly) to a different
 * place on the site, not a phone number, an email or a spot on the same page. That is a product, a
 * course or a story; a row of contact cards links too, but not to pages.
 */
const eachOpensItsOwnPage = (items) => {
    const targets = items.map((item) => (item.matches('a[href]') ? item : item.querySelector('a[href]'))?.getAttribute('href') ?? '')
        .filter((href) => href && !/^(tel:|mailto:|#|https?:\/\/(wa\.me|api\.whatsapp))/i.test(href));

    return targets.length >= Math.max(2, items.length * 0.75) && new Set(targets).size >= targets.length * 0.75;
};

/*
 * How much a list is the kind an owner keeps adding to, read from its shape and never its words: real
 * cards (a heading, a picture) that are filed (a setting the filter reads) or open their own page,
 * room for many more, lower down the page. The slides of the opening banner score little, so "Start
 * here" leads with products, courses and news rather than with the hero.
 */
const worth = (list, items, { setting, opensAPage }) => {
    const share = (test) => items.filter(test).length / items.length;
    const headed = share((item) => item.querySelector('h2, h3, h4, h5, strong'));
    const pictured = share((item) => item.querySelector('img, picture, [data-edit-img], [data-edit-bg]'));
    const roomy = Number(list.dataset.editListMax || 12) >= 12;
    const top = list.getBoundingClientRect().top + (list.ownerDocument.defaultView?.scrollY ?? 0);
    const inTheBanner = top < 600;

    return (setting ? 4 : 0) + (opensAPage ? 3 : 0) + headed * 2 + pictured + (roomy ? 1 : 0) - (inTheBanner ? 3 : 0);
};
