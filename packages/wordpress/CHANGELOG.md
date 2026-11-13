# ShipFast Live Edit for WordPress

## 0.21.19 (13 Nov 2026)

- Every part has a name in the panel, on the page's label and for Ask AI: the template's sample marks are "Sample
  note" (with where they are, "Sample note in What an organiser said"), and words with no name of their own are called
  by what they say ("“Booking January to September 2027”"), never by their section alone (owner: "Delete any sample
  text" was reported as "Jordan Reese (the hero, at the top): deleted").

## 0.21.18 (13 Nov 2026)

Found by the comprehensive audit on The Speaker's real pages (owner: "that's why i said you need a comprehensive audit"):
- Every part says where it is, the parts every page shares too: "Menu bar at the top of every page", "Phone menu, on
  every page", "Footer of every page", and a shared part by its own name ("Cookie notice, on every page"). The menu's
  and the footer's Check a date buttons had said no place.
- The lists inside a page's hidden layouts are no longer sent (The Speaker's home sent Home 2's hero buttons too).
- A list item's words are spaced ("Virtual keynote from", not "Virtual keynotefrom").

## 0.21.17 (13 Nov 2026)

From the owner trying Ask AI and voice on The Speaker:
- Voice: spoken words stay in the box until the mic is tapped again, to check and correct, and Send sends them, as
  dictation does on a phone; a pause never sends a half-said request ("the mic takes pause and send it"; "due to
  accent and noise ... add edit"). No hint is sent to the transcriber, which had written the site's name and the
  page's title into what it heard ("the mic is always appending ...").
- Which part: every list says which section it is in (a page can have six lists called Buttons), a button in a row of
  buttons says which list it is in, the hero is said to be at the top whatever its heading, and parts of the page's
  hidden layouts are not sent ("struggling to delete a check a date button on the hero section").
- The last button can be deleted, by click and by Ask AI, where its section's panel offers + Add a button to bring
  the design's own back ("can't delete the second button"). A list keeps a minimum only where its design says so.
- Ask AI says why a list change was refused as the panel would (full, its fewest, or the end of a move).

## 0.21.16 (13 Nov 2026)

- The Delete window's box of what goes has no stripe down its left: a thin outline on a light tint, as our templates'
  rule says ("but you still added left border i warned you about"). A test now fails any left border or inset left
  shadow 2px or wider in the editor's styles.

## 0.21.15 (13 Nov 2026)

- One name for each part, wherever the owner meets it (owner: "how come we are using another nomenclature"; "why
  not ai ask and voice follow same pattern"). The panel, the label on the page, Ask AI and voice, and the Delete
  window all name a part from one place (`part-name.js`): "Paragraph at the top", "Heading", "Price", the "Book me"
  button, "Photo". The Delete window says photo, not picture.

## 0.21.14 (13 Nov 2026)

- A paragraph is called a paragraph in its panel, as Ask AI and the Delete window call it: the panel had used the
  name the template's designer gave it ("Introduction" for The Speaker's hero paragraph), so the owner asked Ask AI
  to delete the paragraph and was shown an Introduction ("it mistook paragraph for introduction"; "it's not using
  label"). Generic designer words (lead, intro, text, body) no longer name a paragraph or a heading.

## 0.21.13 (13 Nov 2026)

- The Shop tab lists every product, including those sold as cards on a page that shows several (The Speaker's three
  books on The book page, Arch Lash's treatments, Vellumair's gift card): each by its name, its Edit opening the page
  it is on. The Products grid and the sale stay one product per page, so they leave those out, and Edit products is
  offered only when there is a product it can read.

## 0.21.12 (13 Nov 2026)

From the owner trying 0.21.11:
- Ask AI is one conversation for the whole website, carried from page to page ("seems ask AI feels new on each
  page"); each earlier message says which page it was on.
- A photo is the owner's choice: Ask AI searches free photos or makes AI pictures and leaves the choices in front of
  them; the one they press is used, and closing the window keeps the picture ("it went ahead and choose a random
  image").

## 0.21.11 (13 Nov 2026)

Ask AI does everything a click does on The Speaker: 4,640 of 4,640 (the owner: "Let's make the speaker 100"; "the
plug-in that's it's capable of clicks, chat and voice"). Each done with the editor's own controls and saves:
- Tables changed as their grid does; forms as their builder does (its rules: a question the booking needs stays).
- Pictures: a free photo found by words, an AI picture, a description.
- Brand: a palette, a pair of fonts, one colour by its role. SEO: the page's title and description.
- Pages: added (New page), renamed, in or out of the menu, moved, copied, deleted (asked first).
- Sections and forms added from the design's library, by name and where.
- Shop terms (delivery prices, free delivery over, the code, WhatsApp) changed everywhere at once, as the Shop tab.
- Opens Brand, SEO, Shop, Pages, Changes, History, Preview; goes to another page; Undo and Redo.
- A page carrying the design's other layouts hidden is told the one shown.

## 0.21.10 (13 Nov 2026)

Ask AI, built against The Speaker (the owner: "ensure all the parts can be edited with voice or chats"); the coverage
walk went from 59% to 90% of what a click does, and nothing done the wrong way:
- Business details (name, phone, WhatsApp, email, address) are changed for the whole site, as Brand does, never one
  copy that publish overwrites.
- Links: the Kit templates' links are seen at all (marked by their bare key); a link goes to one of the site's pages
  by name, as the link panel's Goes to does.
- "Open in a new tab" is shown only on links whose design keeps it (elsewhere the box saved nothing), and Ask AI is
  told which.
- Cards in a grid move left, right, up and down as the panel's arrows do.
- "Make it bigger" after a change is about the part changed: each answer remembers what it changed.
- Up to 800 parts of a page are told to Ask AI (a home page's FAQ and footer were cut off at 400).

## 0.21.9 (13 Nov 2026)

- What every AI call really cost is kept (the owner: "we need to be sure of the prices since image is not same as
  text"): a new `live_edit_ai_costs` table, one row a paid call (pictures, rewrites; the host adds chat and voice),
  with the provider's own usage and dollars from `live-edit.ai.prices`. Calls refunded to the customer are kept too.
  Ask AI's voice sends how long it listened, for the host to keep.
- Ask AI knows what sits above, below, left and right of each part on the screen ("the paragraph under the Book me
  button", "the one beside the photo"; the owner: "the moat is chatting to replace mouse control").

## 0.21.8 (13 Nov 2026)

- The delete window shows what goes: "Delete this paragraph?" with the paragraph's own words (or the picture) in it
  (the owner: "the modal should show me what content i'm deleting"). A part is named by what it is (paragraph,
  heading, button, picture), never by a template's own name for it ("i requested for a label paragraph, not
  introduction"). Ask AI calls them the same: "Paragraph at the top", "Heading at the top", a button by its words.
- A delete is a button, never red words that read as a link ("a link leads to another page, a button takes action"):
  outlined in a panel, solid red in the window that asks.
- A window that asks something opens above Ask AI, never under it ("you have to close the widget to accept it").
- Ask AI is never offered a part that is already deleted.

## 0.21.7 (13 Nov 2026)

- Delete for one part: a paragraph, a heading, a button or a picture (the owner: "still not possible to delete a
  paragraph"). Its panel has "Delete this ...", asked first; the part goes from the page with no gap, while editing
  too, and Undo or History brings it back. A section hidden from the Pages list still shows faded while editing, so
  it can be shown again.
- Ask AI deletes a part the same way, with the same question first: "remove the paragraph at the top" now works.

## 0.21.6 (12 Nov 2026)

- Ask AI never says your own part is being edited by someone else (the owner: "on my second edit, it said someone is
  already doing the edit. and it's just me"). Before the chat lists the parts teammates hold, the editor makes sure it
  knows who you are; while it does not, no part is called someone else's (the server still refuses a part a teammate
  really holds).

## 0.21.5 (12 Nov 2026)

- Ask AI for someone who has never built a website (the owner: "as a layman and novice scan through and tell me if i
  would be able to use the chat without any guide or support"; then "please fix"):
  - The change is shown where they are looking: the page scrolls the part into view (above the chat on a phone) and
    rings it in blue once, so "Done" is never about something below the screen.
  - On a phone the chat is a sheet over the lower half, so the page stays in view above it.
  - The card names which part changed: "Heading in Talks", "Photo at the top" (a section called Hero is "at the top").
  - The first-time guide starts with the chat ("Tell Ask AI what to change", pointing at the box); clicking words is
    the next step. While the chat is open the guide folds to its pill, without taking the cursor from the chat.
  - The guide's card sits above the chat box where the two would meet (a phone, a narrow window); before, the box hid
    the guide's Next.
  - Starter ideas in plain words ("Add another talk"), never a list of buttons, links or menus.

## 0.21.4 (12 Nov 2026)

- Photos inside Ask AI (the owner: "you're chatting with your website page / Not looking for what to click / Click
  should only come up if it's uploading a file"). The + beside the box attaches a photo to the message, as in ChatGPT
  and WhatsApp: the photo shows above the box, which asks "Where does it go?", and "Make this the main photo" puts it
  there, with Keep and Undo. When the owner asks for a new photo without one, the chat's card offers Upload a photo
  (the file picker, then it is on the page) and Free photos. The photo is saved the way the picture's own panel saves
  it. Needs the app's use_photo answer (Go Live, and the adapters on the same chat service).

## 0.21.3 (12 Nov 2026)

- Ask AI is a chat box that is always there (the owner: "I've seen even chatgpt sites just having a chatbox"; "Ask AI
  about this on the edit tab is valid but shouldn't be the entry point"): "Ask AI to change anything on this page" at
  the bottom right, above the bar on a phone, as ChatGPT, Claude and Gemini show theirs. Clicking into it opens the
  conversation in its place with the cursor in its box; Enter sends; the mic opens it listening. It steps left of an
  open editor panel and comes back when the conversation closes. The chat's code still loads only when it is used.

## 0.21.2 (12 Nov 2026)

- Ask AI right where the owner clicks (the owner: "if i click an element, the toolbar is shorten"; "no where to
  trigger the ask AI"). Ask AI stays on the bar when a part is open, and the part's panel leads with Ask AI about this,
  which opens the chat pointed at that part with ideas for it (Rewrite this, Make this shorter). It replaces the
  panel's separate AI assist: one AI, not two (Rewrite and Shorten stay only where there is no chat).
- Ask AI changes how a part looks: colours, text size, boldness, alignment, line spacing, spacing and corners, with
  the part's own style controls and only what its design allows ("Make this bigger").
- The chat knows the part clicked while it is open, and names the parts at the top as owners say them (Main heading,
  Introduction at the top), so asking without clicking finds them too.
- The getting-started guide stops marking its example once the owner has clicked a part of their own, so what they
  clicked is plainly the part being changed.

## 0.21.1 (12 Nov 2026)

- Ask AI on the adapters (WordPress, HTML, React, Next.js), the same as on Go Live websites. On WordPress, Undo puts
  back only what it knows was there, so an earlier unpublished edit is never wiped. An adapter's owner who runs out of
  credits gets Add AI credits, to their billing page (there is no window over the editor to buy in).

## 0.21.0 (12 Nov 2026)

- Ask AI, a chat beside the page (the owner: "a simple chat box that understand live edit and you can change things
  via chats and pop up widgets if need for things like uploads"; "the chat is built on the live edit"). Ask AI on the
  bar opens it, with a few suggestions from the page. Ask in plain words and the change shows on the page at once,
  with Keep and Undo under the answer. Every change is made the way a press makes it: the same panel, field and Save,
  or the list's own button, so team locks, plan limits, rich text, a link's words and address, list copies and
  History behave as for a click. Removing a section or an item asks first in the editor's own window. Proved on every
  template, page by page (the app's `chat-parity` walk).
- Talking: tap the mic and speak; the words appear as they are said and are sent when you stop talking, as Siri and
  Google Assistant do. The microphone streams straight to the speech service with a short-lived pass from the host
  (OpenAI's live transcription), or the browser's own speech recognition where the host has none; no mic is shown
  where neither can hear.
- + opens the photo chooser for the picture selected, or the page's photos by name.
- AI credits: one a message, given back when nothing could be done ("This one did not use a credit."). With none
  left, the owner buys a pack in the chat (a card window over the editor where the host offers it) and the waiting
  message is sent once the credits are in; a teammate is told to ask the owner.
- Fast to load: the chat's code is fetched on the first press of Ask AI (17 KB, 6 KB gzipped), so the editor loads
  nothing more until then. A request refused with "Too many requests" for a few seconds is waited out and sent again,
  so a copy or a save never fails halfway. A host can answer the chat on its queue (202 with an id); the editor
  collects the answer.
- The Products grid keeps each product it read and reads it again only when it changed.
- Shown where the content API answers the chat (Go Live websites and the cloud adapters); a host turns it off with
  `window.liveEditChat = false`.

## 0.20.26 (10 Nov 2026)

- The add window says what is chosen in it (the owner: "always add form, even when you click on table or chart"):
  opened from + Add a form, choosing a table makes it "Add a table" with "Add this table", a chart "Add a chart" with
  "Add this chart", and back to a form, "Add a form".

## 0.20.25 (10 Nov 2026)

- The outline and handles sit on the element you press on a website that zooms itself on wide screens (the owner,
  on The Speaker: "it clicks a paragraph and shows the border elsewhere"). A page that scales `<html>` (1.25 from
  1880px wide) scaled the editor's own layer a second time; the layer now takes the inverse of whatever zoom the page
  has, read again when the window changes size, so nothing about any one website is assumed.

## 0.20.24 (9 Nov 2026)

- A panel's first field sits right under the panel's title (the owner: "the space between the Heading and the text ...
  not needed"): no empty band and no rule between them. A panel with no title keeps its full space under the tabs.

## 0.20.23 (9 Nov 2026)

Found by the real-editor walk on Oyin Kids:
- A product card that is not on sale (`data-sale-off`) is a card: its name, price and words open the card, not the
  flash-sale grid. Only its sale parts open the sale.
- A countdown's own words ("Ends in", "days", "Last day:") can be changed: pressed, the sale grid offers "Change the
  words".
- On a slow host the Publish button still appears: it waits for the page's content past the first five seconds
  instead of giving up, so a shop whose product pages are being read no longer hides Publish on every reload.

## 0.20.22 (9 Nov 2026)

- A worked-out price opens the flash sale only when it is on a product (its card or its page's buy box). Car Wash Auto
  sells products and lists wash prices copied from its price list; before 1.13.2 those wash prices were marked as a
  worked-out `price`, so pressing one opened the sale grid as if it were a product (owner, 9 Nov 2026: "live edit
  cannot diff between prices and product"). Any other worked-out price now says it comes from the owner's prices
  elsewhere. Proved in the real editor on a Car Wash with the old markers: a wash price explains itself, a product's
  price opens its Price field.

## 0.20.21 (9 Nov 2026)

- A new collection never starts like a page that shows only what is on sale (the host marks it `saleOnly`): on Oyin
  Kids, "Party wear" had copied the flash-sale page, its sale heading and its "only what is on sale" list.
- A shop's products in one grid, as Shopify's Products list (owner, 8 Nov 2026: "live edit should be sufficient to setup
  their store"; "they only go to the dashboard for orders"; the customer case "do we have product categories, featured
  products, etc"). The Shop tab's Edit products opens every product and, under it, each of its sizes, one row each:
  Photo, Name, Price, SKU, Collections, Featured and Stock. Type in a cell, tick a product into a collection (a product
  can be in several) or Featured, then one Save changes; one Undo takes it all back. Each cell writes what the shop
  already reads: the product page's name, price and SKU words (the same keys a click on them saves), a size's price and
  SKU in its row, each collection's products (`structure:products:<page>`), the home page's featured row
  (`structure:products:home`, handed over as `window.liveEditPages.featured`), and stock through the host's
  `KeepsShopStock`. A price typed as a figure is written as the shop writes its prices, and a product's sizes priced as
  it was follow it. An SKU another row has is red, with "Another product has this SKU" in the cell, and is never
  refused. A Columns menu shows and hides columns, remembered in this browser; a column the shop cannot have says why
  (a home page with no row of products, stock before the shop is published). The photo opens the product's page, where
  its photos are changed.
- + New collection, in the grid, on a product's collections and in the Shop tab, makes a collection page like the shop's
  own, named by the owner; from a product's row it starts with that product in it. A grid with changes asks to save them
  first. The Shop tab's Categories are called Collections, as Shopify calls them: one list for both.
- The Shop tab's Delivery has "Customers can pay when it arrives" on each delivery choice (`shop.payOnDelivery`), and
  Offers lists the shop's discount codes after the code the pages name (`shop.offers`): code, % off, an amount off or
  free delivery, an optional last day and number of orders, how many orders used it (read only), and whether customers
  can use it now; + Add a discount code. Checked as the host checks them before anything is saved.
- An SKU in Import products (an optional `sku` column, in any case, the sample file showing the shop's own) and in + Add
  a product (an optional SKU field): one another row, a product the shop sells, or one of the owner's own already has
  is refused with whose it is ("its SKU OYK-1003 is already Kemi gingham dress's").
- A product copied with Give it its own page starts with its own SKU: its source's with "-COPY" (or "-COPY-2"), and each
  size's the same way, so two products never start out sharing one.

## 0.20.20 (9 Nov 2026)

Released as 0.20.20: the v0.20.19 tag was made on the 0.20.18 code before this work reached main, so 0.20.19 is the same as 0.20.18.

- A part the page works out says where it comes from, and a press takes the owner there (owner, 8 Nov 2026: Car Wash's
  service prices and "Hand washes from" said "This number counts itself from the products on this page"; "if it's
  counted for me, a click should lead me there"). Each kind a template marks with `data-kit-computed` has its own
  sentence (a price from the price list, an opening time, a date, a rating, reviews, an SKU, a category, a total), and
  any other kind says it is filled in from elsewhere on the website, never a sentence about products. A part that also
  names its source with `data-kit-from-page` (a page of the website, like `packages/`, or a part of this page, like
  `#find-us`) opens a small window with one button, "Open the price list", that goes to that page in the editor; a part
  of this page is scrolled to. Proved in the real editor on Car Wash: the button landed on the Prices page with the
  price list there to change.

- The sale and stock grid is evenly spaced and nothing in it overlaps (owner, 8 Nov 2026: "make sure nothing is
  overlapping"; "all list items are properly spaced"; "there are some unneeded lines"). On a phone a product's sizes
  open inside its card (the same box and padding), each size a line with its name on the left and its box on the right;
  Price, Sale price and % off share one line of names and one line of values; every card has the same 12px inside and
  10px between; a box being typed in is brought clear of the Save bar stuck to the foot. On a laptop the price that is
  read and the boxes beside it share a line too. Lines that spacing already does the job of are gone: none between
  cells, none above the Save bar, none under the panel's title while the grid is open; light row separators stay.
  Proved by measuring every text, box and button of the grid at 320, 390, 768 and 1440 pixels, while rows are loading
  and with a product's sizes open (`a-flash-sale-is-set-as-a-whole.spec.js`): no two overlap, none runs out of its row,
  its card, the panel's padding or the drawer, and nothing scrolls sideways.
- History (Changes, Published) says what was published the way Google Docs' Version history does (owner, 8 Nov 2026:
  "published changes needs to be fixed too, it's confusing"). Each publish is one entry: who ("You" or the teammate)
  and when ("1 day ago", the exact day and time on hover), then what changed by page and section as they are named
  ("Packages & pricing · Service price list"), with the words before and after ("Price: “₦25,000” → “₦28,000”"), a
  table's cell by its row and column ("Express wash, Saloon / hatchback: “₦9,000”"), a list by what happened ("Removed
  a section"), a sale by what shoppers see ("On sale at ₦49,950 until 15 Nov"; "Sale now ends 15 Nov"). Two changes
  show, "Show all 6 changes" opens the rest; a publish of nothing is not shown; "Show older" at the foot replaces Newer
  / Page 1 of 3; "1 days" is gone. One action an entry, worded for what it does: "Undo these 6 changes", asked first
  with what happens. The versions endpoint now returns each change's words before and after; the sale grid names each
  write by its own product.
- The editor made one system (owner, 8 Nov 2026: "make it professional"; "no border decoration making the app looking
  AI"; "nothing is overlapping"; "especially on the edit tab"; from the editor audit): lines that spacing already does
  the job of are gone (under the panel head and title, above the foot, between fields, groups, sections, Shop rows,
  Help questions, table cells; a light tint marks every other grid row instead), one spacing scale (4 / 8 / 12 / 16 /
  24), one control height (40, 44 on a phone), four type sizes (12, 13, 14, 17) in two weights, blue for Publish alone,
  greys from tokens, rings as outlines, drawn icons in place of typed arrows and crosses, one quiet danger style, the
  editor's own question in place of the browser's confirm, one Save in a card's panel (its foot) with its style in one
  fold, "Inside this" one name a line, a photo's description in a two-line box, "Photo 1 of 6 · 1 of 6" no more. On a
  phone the bar gives way to an open panel; beside a wide grid it moves into the space left of it. Tables and charts
  open in the wide panel. The "On sale" label sits above a product page's price and inside a card's top corner, and
  steps aside while the thing is pointed at. The sale grid opens without waiting for a slow stock answer.

## 0.20.18 (8 Nov 2026)

- A flash sale is set as a whole, in one grid (owner, 8 Nov 2026: "sales card must be editable at once, not each being
  editable one by one"; "just like we can edit tables, cards"; on a countdown, "it should open so that it can be
  edited"; "live edit should be sufficient to setup their store"). A product's sale price, its sale days, a card's sale
  price, a countdown, the new "On sale" label on a card, and "Edit sale and stock" in the Shop tab all open the same
  grid as a table: every product with a tick for On sale, its price, its sale price and its % off (typing either fills
  the other, a typed "49950" reads "₦49,950"), "Same % off for every ticked product", and one Starts and one Ends date
  for the whole sale, with "Ends 15 Nov 2026, in 7 days" and what the countdowns follow. The product pressed is
  highlighted. Saving writes the words the shop already reads on each product page (the sale price as the page writes
  its prices, "No sale" when unticked, days as "8 Nov 2026", "Today", "No end date"), so nothing changes on the server
  or in the templates; one Undo takes the whole sale back. A countdown or a card's sale no longer says "Counted for
  you". While editing, a card or product page whose product is on sale wears a label in the editor's own chrome ("On
  sale · ₦49,950 · ends 15 Nov", "Sale starts 12 Nov", "Sale ended"); pressing it opens the sale. A product's price
  panel offers "Put it on sale ›". The grid opens at once with what is known (the page open and the products read in
  the last ten minutes) and fills in as the other product pages arrive ("Still loading 14 of 22 products. You can start
  now"); a save before then writes only the products shown. Every column is in view at 1440 without scrolling sideways,
  a product's name wraps rather than being cut. "Same % off for every ticked product" fills the ticked products with no
  sale price and asks before changing those with their own ("Change them too" / "Keep their prices"). With nothing on
  sale, the sale starts today. On a phone (600px or less) each product reads as a small card from the same rows: its
  tick and name, then Price, Sale price and % off side by side, each named, then In stock; "Loading…" sits in the price
  until the page arrives. Gift cards are left out (a product the host marks `gift`, or whose page carries data-gift).
- In stock, in the same grid, where the host keeps stock: a product without sizes is counted on its row; a product with
  sizes shows its stock in a few words ("12 in 9 sizes", "2 sizes sold out", "Not counted") and opens its sizes under it,
  each by its own name, to type each count. Empty is not counted, 0 shows Sold out. Saved with the sale by the one Save changes; stock is the host's and is not a draft,
  which the grid says. New host contract `ShipFast\LiveEdit\Contracts\KeepsShopStock` (`stock()`, `saveStock()`),
  behind `GET` and `POST /live-edit/stock` (`live-edit.stock`, `live-edit.stock.update`) inside the editor's own
  middleware; without a binding the column is not shown. A host on the content API claims the route
  (`liveEditApi.routes['/live-edit/stock']`).
- The editor's help answers how to put products on sale, end a sale, change when it ends, set stock, and what selling
  out does, pointing to the grid.
- The table grid (`renderDataGrid`) takes fixed rows, ticks, words that are read, per-cell kinds and a picked row.
- Proved in `a-flash-sale-is-set-as-a-whole.spec.js` and `a-flash-sale-is-set-as-a-whole.test.js`, and in the website's
  real editor on Oyin Kids and Car Wash Auto: the sale set in the grid, published, and a visitor's order recorded at the
  sale price.

## 0.20.17

- "+ Form" on the editor's bar (owner, 8 Nov 2026, on Car Wash Auto: "why is there no create a new form"). Adding a form
  was only in the add window's Forms tab and on the "+ Add a form" pill shown between sections on hover, so an owner
  looking at the bar found none. The bar now has "+ Form" beside "+ Section" (and "Add a form" under More on a phone),
  shown wherever the website has forms to add; it opens the add window on the forms (contact, quote, or start blank),
  where the plan's limit is said as before. "+ Section"'s tip no longer mentions hiding. Proved in
  `sections-on-every-page.spec.js`: the bar's + Form opens the forms; a website without forms shows none.

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
