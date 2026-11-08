# ShipFast Live Edit for WordPress

## 0.20.16

- Undo is ready the moment something is saved. A deleted section (or any change saved without the page reloading)
  left Undo greyed out until the next load, so "Undo brings it back" was not true right after a delete. Undo now hears
  the same count of unsaved changes as Publish. Proved in the website's real editor: every section of Stillwater's
  home page deleted from its panel and put back with Undo, then moved and moved back (14 of 14); and in
  `sections-on-every-page.spec.js`, Undo enabled straight after a delete.

## 0.20.15

- A section is deleted, not hidden (owner, 8 Nov 2026: "fix the idea of hiding a section, i want to be to delete it";
  "it's the section holding table"; "that is not having delete section"). The section that holds a table the owner
  added was taken for one of its own cells, so its panel offered only "Hide this section" and never Move or Delete; it
  now has This section with Move up, Move down, Duplicate and Delete (Remove for a section the owner added), like
  every other section. "Hide this section" (and "Hide this card") is offered nowhere any more: Delete beside Move and
  Duplicate is the one way, as in every site builder people know, and Undo brings a deleted section back. A section
  hidden before this keeps its place and offers one box, "Show this section to visitors again". The panel's buttons,
  the help answer and the walkthrough say move or delete. Proved in the browser: a table added, its section opened
  from the table's grid, Remove pressed, gone from the page; no section of the design offers Hide.

## 0.20.14

- A press on a card opens the whole card (owner, 8 Nov 2026: "If I click on card I should be able to change its
  contents from the drawer"). A word, a price, the card's link or the space between them opens one panel with every
  word of the card, each named ("Name", "Price, saloon", "Car"), the one pressed focused, one Save changes; its photos
  with a Replace button each; "Style ›" (or "Style and where it goes ›" for a link) for the word pressed; the card's
  own style one press away; its move, add and delete below. Menus, galleries, tables, charts and forms keep their own
  panels; a card of one word opens that word as before. Typing in it counts as unsaved (closing asks first, a redraw
  keeps it), and the box pressed takes the focus at once.

## 0.20.13

- The section's tools fold away while something inside it is edited (first-time owner walk, 7 Nov 2026). Opening a
  heading or a price showed the section's name and its add, move, duplicate and delete under the words, half of a
  phone's panel for a one-line edit. They are one line at the end, "▸ This section: 1 of 9 · <its heading>", opened on
  a press; a section opened itself keeps them open.

## 0.20.12

- Words a first-time owner knows (first-time owner walk, 7 Nov 2026):
  - A photo's description is "Describe the photo" ("In a few words, for people who cannot see it and for Google"),
    not "Alt text"; the "Title attribute" field shows only where a photo already has hover words.
  - A field is named by what the template calls it, in parts too: "price-saloon" is "Price, saloon", not "Text";
    "car" is "Car", with more everyday names added (role, rating, hours, eyebrow, ...).
  - A card is named for what its list holds ("Review 1 of 3", "Delete this review"), or "Card" ("Card 1 of 6",
    "Delete this card"), never "List item" or "Item 1 of 6"; a section by its heading as the page reads it now.
  - "Another card opens X too" is said as "This card's link opens the “X” page, as another card's does: a change made
    there shows on both."
- A photo in a section is no longer taken for one photo of a gallery of the page's sections: it offered "← All the
  photos", which opened the page's sections as photos.

## 0.20.11

- Brand shows what the website shows (first-time owner walk, 7 Nov 2026: Business name, Logo and Phone looked empty,
  their values only grey hints). Business name, phone, second phone, email and address open filled with what the page
  says now, and are saved only when changed. Logo shows the logo in use, then "Upload your logo", then "Or paste a
  link to your logo" (it led with "Paste a logo URL").

## 0.20.10

- A photo chosen shows on the page at once (first-time owner walk, 7 Nov 2026). The panel showed the new picture and
  said "This is a preview", while the page kept the old one until a reload: a photo with a srcset (or a <picture>'s
  sources) ignores a new src. The page's picture, or background, now shows the one chosen, its srcset and sources set
  aside meanwhile; Discard puts all of it back, Save keeps the new one (checked on Car Wash Auto's hero).

## 0.20.9

- A card moves where the button says (owner, 8 Nov 2026: "the move should be contextual to how each section or
  container works"; "it's most likely default and won't work for every move"). A move swapped a card with the one
  before or after it in its list, whatever the page drew: in a grid of three reviews "Move down" moved it right, and
  nothing moved a card to the row below. Now each direction is the card drawn that way (moves.js): left and right on
  its row, up and down the nearest card in the row above or below, in the same column; the card takes that card's
  place and the rest close up. A button is offered only where there is a card that way, so the same reviews offer left
  and right on a computer and up and down on a phone, where they stack. Lists drawn in another order than they are
  kept (reversed rows, columns filled downwards) move by where they are drawn; a card that is not drawn (a slide off
  its slider) moves earlier or later in the list.

## 0.20.8

- Adding a card is "+ Add a review" (first-time owner walk, 7 Nov 2026). An item's "Duplicate" is named for what the
  list holds, from its one-word label ("Reviews": "+ Add a review"; "+ Add another" where the label is longer), and
  so is its delete ("Delete this review"). The new one opens at once with all its words in one panel, each named by
  what the design calls it (Quote, Name, Car, Sample note), the first selected so typing replaces it, the page
  following as it is typed, one Save changes; its move and delete below. A review took about nine presses (Duplicate,
  then the quote, the name and the car each in their own panel with their own Save); it takes three.

## 0.20.7

- "+ Section" in the bar opens Add a section (first-time owner walk, 7 Nov 2026). It opened the page's list of
  sections, with adding one more press away; it now opens the add window with Put it at the end of the page, as the
  "+ Add a section" line between sections does. A section's move, delete and remove stay in its own panel.
- The page's list of sections no longer shows the header's hidden screen-reader words as two chips reading
  "“, home”" under "Read aloud by screen readers": that list looked at everything beside it, the header and footer.

## 0.20.6

- The publish review says what was done, the way it was done (first-time owner walk, 7 Nov 2026: "Our promise to
  people is easy of use"). It read "Publish 18 changes" for six things done: a palette chosen in Brand was seven rows
  of "Text #0F2A43", a photo its web address. Now a palette is one row, "Colours: Rose", with its colours shown; a
  pairing of fonts one, "Fonts: Classic"; a photo is shown as the picture, "Photo in “<its section>”"; the brand's
  fields by their own names (Business name, Phone, ...) in the review and in Changes. The number on Publish and in
  the window count the same way (`ChangesAsMade` on the server, `changes-as-made.js` in the editor).

## 0.20.5

- Charts and tables are edited as a grid (owner, 7 Nov 2026: "It should be easy to update the components. Table,
  charts, etc. They are being used by novice"). A press anywhere on a chart or a table opens its figures or cells as a
  small spreadsheet, the way Canva, Google Slides and PowerPoint's "Edit data" show them, with what was pressed ready
  to type in: type in any cell (Enter goes down), + Add a row / + Add a column, ✕ on a row or column to delete it,
  rows copied from Excel or Google Sheets pasted into any cell fill from there, then one Save changes (Undo changes
  puts it back). It replaces a panel per bar, slice or cell with their own move/add/delete buttons. Saving keeps
  every rule of the kind (`chartPlan` and `tablePlan`, shared with pasting): a donut still takes six slices at most,
  a word where a figure goes is refused, and the reason is said in the panel. A chart's figures come before how it is
  drawn; "Paste many rows at once" stays, folded under the grid.
- A cell in an added row and an added column could not be saved ("Unknown setting"): its key carries both
  (`…@<column>@<row>`) and only one was allowed. `EditPolicy` now takes two.

## 0.20.4

- Adding a chart, table or form with none left on the plan says so (owner, 7 Nov 2026: "Then I add to section for chart
  is not working"). The save was refused ("Your plan includes 1 chart or table on this website. Upgrade to add more.")
  but the message went to a toast behind the add window, so Add this section looked dead. The window now reads the
  host's `locked` / `locked_reason`: it shows the sentence above the button, and the button becomes "Upgrade to add
  more", opening the owner's billing page in a new tab (`window.liveEditEditor.billing`; disabled for a teammate, who
  has no billing). Any other refused add is also said in the window.
- A chart or table can go on the left or right of another (owner, 7 Nov 2026: "The charts and other others only have
  above and below. But no left of or right of"). When a chart or table is chosen in Add a section and the page already
  has one the owner added, Put it also offers "On the left of “X”" and "On the right of “X”". The pair is saved in the
  page's arrangement (`"beside": {"add-…": {"of": "add-…", "side": "left"}}`, kept when sections are added and
  dropped when either is removed), placed next to each other in the section order, and said in words on the publish
  review ("Set Table on the right of Chart: bars"). The host lays the two side by side on wider screens and stacks
  them on a phone. Charts and tables only, one partner each.

## 0.20.3

- The AI assist in a text panel is compact (owner, 7 Nov 2026: "the AI credit space was also too big"). It was a
  section heading with its own rule (drawn as a stray short line under the words) and padding, then Rewrite and
  Shorten as two full-width bars: about 180px for two buttons. It is now one group: a slim "AI assist · 48 credits
  left" line and the two actions side by side, each with its cost (about 60px).

## 0.20.2

- Any section can be deleted (owner, 7 Nov 2026: "there is no way to delete a section"). Only a section the owner had
  added offered "Remove this section"; the design's own could only be hidden. Every section's panel now has **Delete
  this section**, as every site builder people know has it: it takes the section out of the page, and **+ Add a
  section** offers it again later. Hide stays for "not now". A page keeps at least one section.
- A table is easy to edit (owner, 7 Nov 2026: "it's difficult to edit table"). A cell's words sit in a span on one side
  of the cell, so a press beside them opened the cell as a "Card": row and column controls, and nothing to type in.
  A press anywhere in a cell now opens its words, first in the panel and ready to type, with the row and column
  controls under them; a table's parts are named Cell and Row, not Card.
- No more empty space in the panel (owner, 7 Nov 2026: "unnecessary spaces between the text and AI credits"). The
  collection editor's list of fields used the panel body's own class name, and its grid stretched every row of every
  panel to fill the drawer; it has a class of its own now.
- The list before Publish says what changed in words (owner, 7 Nov 2026: "publish table shows json and not human
  readable text"). An added section printed its stored arrangement (`{"added":{...}}`) in the Publish window, which
  did not use the words the Changes tab already had; both use them now. A table's rows and columns read "Rows in
  “Plans side by side”: 4 rows", a cell "Table cell: Price a month, Starter", and an added section is named without the
  add window's "· 1 left".

## 0.20.1

- A copied product sold where it stands is a product of its own. On a page that sells each item in place (its own Add
  to bag, no page of its own: The Photographer's prints), a copy the owner made kept the first item's
  `data-kit-product`, so its Add to bag put the first item in the bag at the first item's price. A copy now takes
  `<product>--<copy id>`, on the item and everything inside it. A card that opens a product's page
  (`commerce.product`) is still that product, as before.
- A section with a background photo can be hidden. Its panel is the photo's, and ticking **Hide this section** then
  Save was refused with "Choose a file from your computer or paste an image URL first", because no new picture was
  chosen. A picture's panel holding only a style change now saves the style (19 pages of The Photographer, 7 Nov 2026).
- An arrow at the end of a short link opens the icon picker. The link's pencil sat on the link's corner, over the
  arrow, so pressing the arrow opened the link (The Architect's "View Projects"). On a link holding an icon the pencil
  now sits just above it, clear of it, as it does for a menu's label.
- A section that is itself a list (a case study's gallery, a row of columns that is the whole section) can be moved,
  copied and hidden. Its panel showed only its list's controls, as if the section were one of its own photos; it now
  shows both, the section's (Move up, Move down, Duplicate section, Hide) and the list's (+ Add a photo).
- Words only a screen reader hears are offered from more panels: the link or button they sit in (a logo's ", home"
  beside the business name, which opens Branding) and a list's panel for the hidden heading beside it in its section
  (a portfolio's "Selected work" over a list of the same name, whose section the trail could not reach).

## 0.20.0

- Adding a form is easy to find (owner, 7 Nov 2026: "Adding the form is confusing, and where to add it is not specified"). **+ Add a form** sits beside **+ Add a section** on the line that appears between two sections, after the last section, and in the page's sections panel (+ Section in the bar, or Sections under More on a phone). It opens **Add a form** on the forms alone.
- The add window lists forms first, with tabs over its list (All, Forms, Charts and tables, Search) so each kind is one press, and the search finds "form".
- Where it goes is chosen in the window: **Put it** at the top of the page, below any of its sections, or at the end, starting where you pointed. It used to go at the end, said only in the window's subtitle.
- A form is shown as it will look, in the site's own style and with its own questions, where the host sends a `preview`; before, it was three lines of text.
- On a phone the add window fits the screen: its search, "Put it" and the add button are no longer cut off at the right.
- The picture is of the section chosen in the list (owner, 7 Nov 2026: "the right should preview what the left has selected"). Pointing at a row only lights it, so scrolling the list past other rows no longer changes the picture; the chosen row has an even outline, like the editor's other choices. Only the list scrolls; the picture and its button stay where they are.
- The pages the pictures come from are fetched as soon as the window opens, two at a time, and kept for the visit, and a row pointed at fetches its page first, so a section chosen far down the list shows at once instead of after a second or more of "Loading…".
- Charts, tables and search are shown as they will look (owner, 7 Nov 2026: "should have a preview beyond text"): a chart drawn by the site's own kit-data.js (named by the host as the builder's `kitData`), a table and a search box in the site's style, where the host sends a `preview`.

## 0.19.6

- Fixed: since 0.19.5 a picture over 13 megapixels was refused ("That image has too many pixels to process safely"), so an Openverse original chosen in Free photos, often a large Flickr photograph, could not be used. A picture up to 24 megapixels (a 6000x4000 camera photograph) is now made the size a page needs first, with room to do it (PHP's memory raised to 256 MB for the work, then put back), and stored like any other. Beyond 24 megapixels it is refused as before, so a tiny compressed file still cannot expand into a bitmap of hundreds of megabytes.
- The version the package reports (`LiveEdit::VERSION`) is right again: 0.19.5 still said 0.19.4.

## 0.19.5

- The toolbar's Live Edit mark stays on the narrowest phones (340px); the controls wrap before it goes.
- Free photos, while it loads, shows plain grey boxes instead of a moving horizontal gradient.
- The icon picker scrolls with its drawer.
- Picture imports and resizing run on the queue (a worker must run where the queue is not `sync`), with throttling.

## 0.19.4

- The icon library is calm until you point at an icon (owner, 5 Nov 2026: "It should be grey and maybe come alive on mouse hover"). Every icon tile is a soft grey with the drawing in grey; the one under the pointer or the keyboard comes alive (white tile, the drawing in its own colours, a blue edge, a small lift), and the chosen one stays so. The white-and-dark diagonal behind every tile is gone; a drawing with white lines keeps a dark tile so it can be seen. Reduced motion: no lift.

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
