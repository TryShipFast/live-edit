# ShipFast Live Edit for WordPress

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
