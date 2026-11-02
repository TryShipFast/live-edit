# ShipFast Live Edit for WordPress

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
