# ShipFast Live Edit for WordPress

## 0.19.3

- Fixed: a drawing whose classes look like an icon font's (`<svg class="icon icon-arrow">`, as Car Wash and seven other templates draw their arrows) was read as an icon font once the page came back from the server, so pressing it opened "Icon name: this theme loads its icons from somewhere this page cannot read" instead of the drawing library. An `<svg>`, or anything already offered as a drawing, is never an icon font now. Present since 0.17.

## 0.19.2

- Help answers what owners now ask: how to add a section; move, hide or remove one; add a new form (contact, quote or start blank); change a form's questions; where form answers go; add a chart or a table; whether the team can edit together; and, on a shop, how to keep count of stock. The answer on adding a page names the bar's Pages button (0.19.0 renamed New page). Sections, forms and charts are answered where the website has the page builder, the team where it publishes.

## 0.19.1

- Fixed: in 0.19.0 every save answered "Content service answered 500" in a Laravel app that uses immutable dates (`Date::use(CarbonImmutable::class)`, as many do). The section-lock check expected a mutable date. It now takes either, and a test runs team editing with immutable dates. The whole suite also passes with immutable dates switched on everywhere.

## 0.19.0

0.18.0 was tagged by mistake on the 0.17.0 code; it is identical to 0.17.0.

### The editor the familiar way

- Unsaved changes are asked about before they are lost, as Shopify and Google Docs ask (CONVENTIONS.md, change 4). Closing the tab or reloading with the panel's words not saved (or a Brand or SEO panel waiting to be saved) brings up the browser's own question; leaving from inside the editor (a link in the bar, Open in Pages) or pressing Done editing asks "You have unsaved changes. Leave without saving?" with Leave and Stay. Nothing is asked when nothing is unsaved. The panel's Cancel is now Discard (beside Save changes, Save brand, Save SEO). New: `resources/js/unsaved.js`.
- Pages (CONVENTIONS.md, change 5; Wix's "Pages & Menu"): the bar's + New page is now **Pages**, a list of every page in the order the menu shows them, with + Add page at the top. Each page opens from it; the owner's own pages are renamed, put in or out of the menu, moved up and down (buttons, or drag) among their other pages in the menu, duplicated and deleted; the design's own are duplicated, and deleted where the host keeps deletions (`removedKey`). A checkout, a bag, search results, a brand sheet, a 404, privacy and terms, and a product's or post's own page are listed apart as "Not in menu", and New page no longer offers them as a kind of page to start from. Saved as `structure:pages` and `structure:removed` as before; a deleted design page is named under Changes. New: `resources/js/pages-list.js`.
- An editor without "Can publish" sees **Ask to publish** (Review on a folded phone bar) instead of Publish; pressing it explains that the changes are saved and an admin puts them live, and sends no publish, where before the server's refusal read "Could not publish… try again in a moment". The session payload says `may_publish` (true or false for somebody who signed in with us, null for a host-minted session); a host can also say `liveEditPublishing.mayPublish: false`.
- Words only a screen reader hears (", home" beside a logo) no longer show on the page while editing, whatever the design's stylesheet does; they are in the logo's panel under "Read aloud by screen readers".
- The toolbar is compact and fits every screen (owner, 5 Nov 2026: "dashboard can change to icon to create less space same as ads and tracking"; "they are not responsive on mobile"). A host link may name an `icon` (`dashboard`, `tracking`, `settings`, `help`, `external` or `logout`) and is then a round 44px icon button, its label its accessible name and a tooltip shown on hover and on focus; a link without one keeps its words. Log out is an icon. When the bar would not fit on one line (always on a phone, at 760px and under; on a tablet or a narrow desktop as needed) it folds: Edit or Done, Undo, Publish with its count and a More button stay, and the rest (Redo, New page, Sections, Brand, Search, Changes, Help, Preview, the language, the host's links, Log out) are offered in a More sheet as labelled icons with 44px targets. The sheet closes on a tap outside it, Escape or Back, keeps the keyboard inside it while open and returns it to More; the bar and the sheet keep clear of the iPhone's home bar. New: `resources/js/toolbar-icons.js`.
- The editor's files include `toolbar-icons.js` on the embed endpoint (the folded bar's icons were not served to a site loading the editor from us).

### Team editing: one person per section

Owner, 5 Nov 2026: "if we allow for collaboration, we should lock a section a
team member is working on and publish releases it, otherwise, they override
eachother works".

- A section somebody is editing is theirs until they publish, discard, or leave
  it alone for 30 minutes. Teammates see a dashed outline and "Ada is editing
  this section", and pressing it says so instead of opening it.
- The server refuses (409, in plain words) any save into a section somebody
  else holds, even from a stale page. Two first edits at once: one wins, the
  other is told who.
- Publish puts live only the publisher's own sections, then releases them. A
  teammate's unfinished section stays a draft and stays theirs.
- Discard (`POST /team/discard`) throws away only your own changes and releases
  your sections. Putting back one change is for its author or the owner.
- A lapsed section keeps its changes, still attributed to their author; the
  next person is told "Ada left unpublished changes here" and can continue from
  them, or (owner) discard them.
- The owner or an admin can take over any section, with its unpublished
  changes; the holder is told "Olu took over Hero".
- The Pages list and a page's sections respect the same locks: while a teammate changes the list of pages, the others can open pages but not change the list ("Ada is changing your pages right now"); "+ Add a section" and "Remove this section" say who holds that page's layout.
- Changes and the publish window are split into "Your changes (these go live
  when you publish)" and "Others' changes (not included)", by name.
- History says who published each version and lists its changes by section and
  author ("Ada changed the headline in Hero"). **Undo these changes** takes back
  one version only and leaves later work alone. Restoring a whole version says
  whose published work it undoes and keeps a teammate's drafts.
- Sessions can say who the person is: `EditorSession::begin($site, $editor,
  'owner')`, or `editor: {id, name, role}` on `POST /sessions`. A session that
  says nothing is the website itself and behaves exactly as before.
- New: `GET /team`, `POST /team/claim|heartbeat|release|take-over|discard-left|discard`,
  `POST /versions/{n}/undo`, `live-edit:prune-locks` (scheduled every ten
  minutes), config `live-edit.team.*`, migration
  `2026_11_05_120000_one_person_per_section`.

### Roles: owner, admin, editor

Owner, 5 Nov 2026: "the first person to open is the admin, but can also add
other team member as admin or someone can be promoted to admin".

- `admin` is accepted wherever a role is read (the grant's `role`,
  `editor.role` on `POST /sessions`, `EditorSession::begin`). The owner and
  admins may take over, throw away left changes, put back a teammate's change
  and restore a whole version; an editor may not ("Ask an admin to take over").
- A role change counts on the next request: powers are checked fresh, the
  cached who-is-editing answer forgets a person when their grant changes, and
  `POST /sessions/role` changes a host-named person's sessions at once.
- The Publish button (`pending` on `/content` and `/content/version` for an
  editor) counts only your own changes, what pressing it will publish.
- Restoring a whole version stays out of History, API only, and is refused
  (403) for an editor.

### Caching and load

- `GET /team` costs no database query when nothing changed: a cached answer per
  site and revision, a 304 for the ETag the browser holds, and a key check
  remembered for 30 seconds (forgotten when the key changes).
- What visitors read (`GET /content` and `/content/version` with the public
  key) is remembered for up to 10 seconds per site and language and forgotten
  on every save, publish, restore, undo and discard: 5 fewer queries per page
  view.
- The CORS check remembers a site's allowed addresses for a minute instead of a
  query on every API request; forgotten when the site is saved.
- `tests/load/team-locks.mjs`: 50 editors on one site and 200 other sites
  polling the real API.

### Search, charts and forms cost a page nothing until wanted

- A search costs a published page nothing until it is wanted (the owner, 5 Nov 2026: charts, search and forms must add no Lighthouse issue). `kit-search.js` reads its index only when the search comes within a screen and a half of view, or a visitor reaches for it (focus, pointer, touch), or the address already asks for a record or a search; words typed while it loads are kept as the search. An index may be columns and rows (`v: 2`, `keys` and `rows`: half the bytes of one object per record) and come in `parts` beside it, each read in a task of its own, so a big catalogue makes no long task; v1 (`records`) is still read. The search's look is no longer inside the script: it is `resources/dist/kit-search.css` (from `kit-search-base.js`), which a host writes into the page's head (`<style data-kit-search-base>`); a page without it gets the stylesheet linked from beside the script. Its results keep room while the index is on its way. The script is 8 KB gzipped (was 9.6).
- `resources/dist/kit-carry.js` (1 KB): carrying a record into the quote form (`carry()`, now `kit-carry.js`) on its own, for the form's page, which no longer needs the whole search.
- Search filters: a filter's name sits 6px above its control whatever a template does to labels (before, "Sort by" touched its select, since the rule meant for it matched nothing); filter groups 16px apart and wrapping whole rather than squeezing; From and To 8px from their boxes; every chip, select, box, toggle and Clear 44px tall, above a template's own field heights; on a phone, each filter on a row of its own at the row's width.
- `npm run build:kits` builds `kit-search.js`, `kit-carry.js` and `kit-search.css`.

## 0.17.0

- Search over a collection, for a host that hands the editor its collections (`window.liveEditCollections`; a hosted template whose plan includes it, never a plugin website). A **Search** button and tab keep each collection: open it as a table (a box of the right kind per cell, add, delete, find, Fields to add, rename, retype, reorder and remove fields), add from a spreadsheet (columns matched to fields by their headings, every refused row said with its row number), download as CSV, or make a new one from a spreadsheet. A collection is saved as settings in pages of rows, so it is a draft until published. A search section from the library (`kind: "search"`) opens its own panel: the filters visitors see and cards or rows. `resources/dist/kit-search.js` is the visitor's search (part numbers found with or without dashes, filters from the data's shape, a record's own page, a quote request carried into the form, searches that found nothing told to the host). `EditPolicy::longestValue()` lets a host allow longer values under keys of its own. A search's buttons take the design's own button classes (`data-search-buttons`) and stack on a card; a quote request also sets the form's purpose when one option plainly means buying (or one is marked `data-search-purpose`).
- Forms the owner shapes: where the host hands it over (`window.liveEditForms`, our hosted templates only), pressing a form opens a builder: add, rename, reorder and take off questions, choose each one's kind, whether it must be filled in, its help and its choices, or start blank. Saved once as the form's setting and drawn by the host in the template's own form style. A question a workflow needs (a checkout's, a booking's, an application's) is renamed and moved only; one with answers keeps its kind and is taken off rather than deleted, said in plain words. Read from the markup the first time (`forms.js`, `seedForm`). Changes lists a form's added and removed questions; the section library describes a form entry (`kind: 'form'`).

## 0.16.2

- A product's photos are managed in one place: pressing a thumbnail or a photo of a gallery opens the product's photos, each to replace, move or remove, and + Add a photo. Before, a thumbnail only explained itself and the photos a gallery hides could not be reached.

## 0.16.1

- Shop tab: opening + Add a product no longer makes the editor wider than a phone's screen (the panel scrolled sideways). The form's boxes may shrink, so the upload box's one-line hint is cut with "…" instead.

## 0.16.0

- A logo uploaded in the Brand tab is stored the weight of a logo: 600px at most on its longest side, as WebP (transparency kept) where that is lighter. A 706KB logo is stored at 27KB. Uploads may say role=logo.

## 0.15.99

- A free photo chosen in the editor is stored as the site's own picture, made fit for a page (upright, 2400px at most, web quality), instead of being shown from the photo service's server at its full size (Openverse gave the original file, often 5MB). Only addresses a photo search offered in the last hour are fetched.

## 0.15.98

- A shop's terms on the page (a delivery price, the free-delivery threshold, the code on offer and its percent) open the Shop tab at their field when pressed, where every copy is saved at once; the words around them stay editable on the page.

## 0.15.97

- Every uploaded picture is made fit for a page: turned the way the camera held it, brought down to 2400px on its longest side (live-edit.max_image_edge) and saved at web quality. A phone's 5MB photograph is stored at about 400KB. Before, only a picture replacing one on the page was fitted; logos, backgrounds, share images and product photos went up whole.

## 0.15.96

- On a narrow phone (375px and the like) the editor's bar no longer runs off the screen: Undo and Redo wait under More, and every item gives way before any is cut.

## 0.15.95

- Shop tab: Products shown at a time (8, 12, 16, 24 or 48), how many a shop page shows before Show more products.

## 0.15.94

- Shop tab: Catalogue layout, the template's layouts as small drawings to choose from (filters on top or at the side; a layout for paid plans is shown and chosen only on one).
- Shop tab: + Add a delivery choice and Remove, where the checkout's delivery choices are a list, saved as the page's own Duplicate and Delete save it.

## 0.15.93

- Shop tab: Currency, one choice for what every price is shown and charged in (Naira by default); only the sign changes, never an amount.

## 0.15.92

- Shop tab, rebuilt for owners setting up a shop for the first time: Your products (Edit beside each, Remove beside your own, + Add a product with a name, price, photo and categories, and Add many products from a spreadsheet), Categories (Choose products, Copy, Open), Delivery (each delivery choice's name and price, both yours, and free delivery over), How customers pay, and Offers.
- Every example and placeholder is in naira.
- Import products and a new product's photo use the editor's one upload box, the same as pictures and the logo.

## 0.15.91

- Brand tab: a new name or number keeps the spaces the old one had at its ends, so a link's own words and its marked name stay apart ("About Senior Jay Autocare", not "AboutSenior Jay Autocare").

## 0.15.90

- Brand tab: a link marked for its address only (data-brand-phone="link" and the like) keeps its own words editable; only a marked number or name inside it opens the Brand tab. The v0.15.89 tag was set before this change.

## 0.15.89

- Brand tab: "How customers reach you" sets the phone, second phone, WhatsApp number, email and address once, for every place the page marks them (data-brand-phone and the rest), words and links together. Pressing a marked logo, name or contact opens the Brand tab at that field. A page that marks its own logo keeps it at its own size instead of a small stand-in.

## 0.15.88

- Every adapter is sold as finished: React and Next.js are no longer marked as a preview, now that lists built from data are editable in both. No change to the WordPress plugin's behaviour.

## 0.15.87

- Brand tab: every colour and face under "Fine-tune each colour and face" sits in its own bordered row; the border darkens on hover and while the row is being changed.

## 0.15.86

- Release only: the v0.15.84 and v0.15.85 tags were set one commit early (v0.15.84 before the category products, v0.15.85 on the 0.15.84 release), so neither carried its changes. 0.15.86 carries all of 0.15.84 and 0.15.85; no code changes.

## 0.15.85

- Import products in the Shop tab: a sample file made from the shop (its columns, categories and some of its own products), every row checked before anything is added, each product given its own page and its categories (with the website's host), and the last import taken back.
- A hosted editor is served every module it loads (the new one was missing, so the editor did not start); a test now catches any that is not.

## 0.15.84

- A category's products, ticked in and out: Products beside a category in the Shop tab, and in New category (with the website's host, which draws them as the design's own cards).
- Help answers how to choose the products in a category.

## 0.15.83

- New category starts like the fullest category the menu links (or the fullest of all where the menu links none), not the first one listed, and goes in the menu only where the shop's categories are (with the website's host; found on Car Wash Auto).
- The "Looks like" choice shows the category it starts from.

## 0.15.82

- A shop's categories in the Shop tab: each opens its page, Duplicate copies one with its products, and New category asks only for a name and which category it looks like. The new page is named in its heading, breadcrumb and menu, beside the other categories (with the website's host).
- Help: "?" always opens; a window with a header, guides as rows and questions as an accordion.
- Help for shops: a "Your shop" group of questions, and a "Set up your shop" guide from how customers pay to where orders arrive. Guides ring parts of the editor too, and stay on screen on a phone.
- New page: a page started like another copies that page's own sections (its heading, not another page's); previews show the real page; a kind with nothing to preview shows its outline; "Build it from sections" is a choice beside the pages; the window fits what it holds.
- The guide's pill hides while a dialog is open.
- "Open the checkout page" in the Shop tab centres its words.

## 0.15.81

- The editor's panel puts what you clicked first, ready to type; the card or section it belongs to follows with its actions, then style, folded.
- Words change on the page as they are typed; the footer says when there are unsaved changes, and Cancel puts them back.
- Save is the only main button; removing is a quiet text button at the end of its group.
- A link's page is chosen by name ("Goes to"), with the address under it.
- A price is called Price and says when it has no amount.
- Text size, line height, spacing and corners are steps of a scale.
- Clearer type and contrast, and a focus ring on every control.
- On a phone the panel is a bottom sheet and the bar is one row, with the rest under More.
- What can be edited is outlined for a moment as editing starts, then on hover.

## 0.15.73

- Older templates that mark pictures with `data-edit="image"` now open them in the image editor.

## 0.15.72

- Duplicating an item keeps its words: every field of the original, as edited, is saved under the copy's keys, so a reload or a publish shows them. A copy names the design item it is drawn from, so deleting the original does not change it.

## 0.15.71

- Charts and tables: add a chart (bar, line, donut, funnel, progress, sparkline) or a table to any page, each edited in its own kind's terms.
- Sections can be added to every page, not only new ones.
- A site's modal dialogs (a phone menu, a lightbox) open in place under the editor, so everything in them can be edited and saved.
- The site's own fixed bars (a phone's Book bar, a cookie notice) are lifted clear of the editor's bar while editing.
- A menu button that is only a drawing opens the drawing's panel, which offers to open the menu.
- A copied card's own page is opened by its name; design cards named apart from their page keep "Edit all details".
- The drawing picker lists icon-sized drawings only.
- Security: test dependency happy-dom 21.0.4.

## 0.15.70

- Edit a linked product, article, or project page in one pass from its card, including its editable fields, styles, and options.
- Keep related items and shared page controls out of the linked-detail form; copies with shared pages get their own page before editing.

## 0.15.57

- Fixed image generation status lookups for hosted sites by binding the route's site segment before the generation UUID.
- Limit generation responses to the two options requested, even if a provider returns more.

## 0.15.56

- Reordering, adding, duplicating, and deleting repeated items now updates the page in place without a reload.

## 0.15.55

- Image-generation workers now read new jobs and refund state from the primary database, preventing replica lag from leaving queued jobs stuck and credits reserved.

## 0.15.54

- Retry brief “generation not found” replies while polling the same queued image request, so transient visibility gaps do not interrupt image generation.

## 0.15.53

- Image-generation status and idempotent retry lookups now read from the primary database, preventing false 404s while replicas catch up.

## 0.15.52

- Poll image-generation status only after the service confirms it queued a generation. A rejected request no longer leaves the editor polling a made-up ID and showing a false “still generating” state.

## 0.15.51

- AI image generation now runs as a queued, site-scoped job. The editor receives progress updates instead of waiting on the image provider until the gateway returns 504; retries reuse the same request ID, and failed jobs refund the reserved credits.
- Editing text inside top navigation dropdown links remains supported by the shared runtime.

## 0.15.50

- The edit drawer identifies the repeated item being edited, including its position and visible heading, so customers can tell which product, project or section the fields belong to.

## 0.15.49

- Image generation now returns two options per request and times out before the service gateway, preventing long generation calls from surfacing as gateway 504 errors. Failed generations remain refunded.

## 0.15.48

- Treat `data-code` fields as atomic text in the editor and hosted renderer, so syntax-highlighted code can be edited without leaving the old content behind.

## 0.15.47

The walkthrough now excludes the templates' visually hidden Skip to content links and other hidden targets, so customers are guided to content they can see and edit.

## 0.15.46

The getting-started walkthrough now opens automatically the first time a customer enters edit mode, and Help remains available to replay it. The content step ignores the accessible Skip to content link and guides the customer to real editable page content.

## 0.15.45

The shared editor now guides a first edit in place, following the active Brand, SEO, page content, Changes and Publish controls. After publishing, the walkthrough opens the live preview.

## 0.15.44

The shared editor now recognizes the menu and disclosure tags used by ShipFast templates, including mega-menu, dropdown, mobile-menu and close controls. This release lets existing hosted, Laravel, WordPress, React and Next.js sites receive the editor fix from the shared runtime.

## 0.15.38

When a clickable element also has a background image, clicking the image now opens its image editor. Separate image and link handles let the customer replace the image or edit the destination.

## 0.15.37

The shared asset server now includes `seo.js` in its safe file allow-list. This fixes module loading for deployments serving the editor's source modules instead of the bundled runtime.

## 0.15.36

The shared mapper now assigns save keys to empty background markers, so a marked video poster or other background can be replaced across adapters. SVG controls are exposed to assistive technology while focused in edit mode, avoiding hidden-focus warnings.

## 0.15.35

Hosted sites now have a page-specific SEO drawer for editing the browser/search title and search description. Saved descriptions are included in published page metadata and social descriptions.

## 0.15.34

The site icon picker previews light and dark SVGs against a split light and dark surface, keeping fixed-color marks visible while choosing.

## 0.15.31

The Laravel fallback now reads and mutates only its own installation drafts. Drafts belonging to registered API sites stay private to their site, including when an edit is reverted, published or discarded.

## 0.15.25

Licence status is now checked against the hostname serving the current request.
Its cached answer and outage grace are scoped to that hostname, so a valid
answer for the canonical domain cannot turn editing on for an unlisted
subdomain served by the same WordPress installation.

## 0.15.13

The shared editor runtime now waits for the page's editor marker before
starting, so the toolbar is not lost to a timing race. Invited editors also no
longer get editing controls for regions the developer locked; the API
continues to enforce the same restriction when a save is submitted.

## 0.11.0

The first release since plans were enforced, so most of this is a customer
being told things they were not told before.

**A lapsed licence now says renew.** It said "Invalid or missing API key",
which is the one message guaranteed to send somebody hunting through their
dashboard for a key that was never the problem. A refused save said "Sorry,
you are not allowed to do that". Both now say what happened, and the save
refusal comes back as 402 rather than 401: this is not "you may not", it is
"this needs paying for".

**Page limits.** A plan can cover fewer pages than the site has. Over the
allowance the page is served exactly as a visitor sees it, published words and
all, with a dismissable strip saying why the editor is not there and where to
go. Nothing about the website itself changes, here or anywhere else.

**Every page is its own page.** Without pretty permalinks WordPress calls them
all "/", and the plugin took that at face value, so every page of such a site
shared one set of keys: editing About wrote over the home page. Sites with
permalinks switched on are unaffected and nothing is re-tagged for them.

**The service address is filled in.** It was an empty box every customer typed
by hand, and a URL typed by hand is a URL with a typo in it.

### Upgrading

Replace the plugin folder, or upload the zip through Plugins → Add New →
Upload. Settings are untouched.

Built with `bin/build-wordpress-plugin`, which takes the version from the
plugin header so the file cannot claim to be something the code is not.
