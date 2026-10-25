# ShipFast Live Edit

In-place editing for sites that are already built. Tag the elements, and the
people who own the site edit text, images, links, icons, styles and lists on
the page itself. There are no admin screens for content, because the page is
the admin screen.

The inline SVG picker includes common outline icons, drawings already used by
the site, and an option to paste a custom SVG. The bundled icon set is fetched
only when someone opens that picker, so it adds no request to visitor page
loads or to the editor's initial load.

It runs on five kinds of site, through adapters over one engine:

| | How it is installed |
| --- | --- |
| **Laravel** | this package, tagging Blade views |
| **WordPress** | [a plugin](packages/wordpress/kastsbuild/README.md), keeping content in the client's own database |
| **Plain HTML** | one script tag |
| **Next.js** | [`@shipfasts/live-edit-react`](packages/react/README.md), with a codemod |
| **React** | the same package, provider and overlay |

What has been driven through a browser on a real site is in
[ADAPTERS.md](ADAPTERS.md). What does not work yet is in
[LIMITATIONS.md](LIMITATIONS.md).

**The rest of this file is the Laravel adapter.** The other adapters have their
own instructions in the console when a site is registered.

---

## Install

Two commands and one line.

```bash
composer require shipfast/live-edit
php artisan migrate
```

Then in your layout's `<head>`:

```blade
@liveEdit
```

That is the whole integration. Nothing to import, nothing to publish, nothing
to add to your asset build.

**Do not import the editor in `app.js`.** Bundling it compiles a copy of the
engine into your assets, so an engine fix only reaches you when you rebuild and
redeploy. Until then the copy in your bundle and the one composer installed are
different versions of the same thing, with nothing to say so. `@liveEdit` loads
the installed package, so updating is `composer update`.

## Who can edit

Define the `live-edit` gate:

```php
// app/Providers/AppServiceProvider.php
Gate::define('live-edit', fn (User $user): bool => $user->is_admin);
```

Nobody else is served the editor at all, so a visitor's page is exactly the page
they would have had without this package.

Sign-in is served for you at **`/live-edit/sign-in`**. Link to it wherever suits:

```blade
<a href="{{ route('live-edit.sign-in') }}">Sign in</a>
```

It authenticates against **your** users, with your guard and your password
hashes. The package stores no credential and has no user of its own. All it
needs is a users table and an auth provider, which a Laravel app has whether or
not it has ever had a login screen.

Signing out is `POST /live-edit/sign-out`.

## Making text editable

Two ways, and they mix.

**Named keys**, written by you. Stable: the key says what the element is for, so
the client's words survive you rewriting the sentence around them. Worth writing
for anything important.

```blade
<h1 data-edit="setting:heroTitle" data-edit-label="Hero heading">{{ $site->get('heroTitle') }}</h1>
```

**Derived keys**, found automatically. Set `LIVE_EDIT_AUTO_TAG=true` and the
editable parts of a page are found as it is served, only for somebody the gate
allows. The trade is that a derived key is a signature of the current wording:
change that sentence in the template and the client's edit is orphaned. Use it
to make a site editable without touching its templates, which is the only option
for a site somebody bought rather than built.

A page that already carries `data-edit` keeps its own keys untouched.

## Locking the parts a client must not change

New in 0.14.

You hand over a site with your name on it. A client will forgive a rough
install. They will not forgive breaking the navigation, and neither will you.

Wrap anything they should not touch:

```blade
<nav data-live-lock>
  ...
</nav>
```

A nav, a footer, a pricing table, a legal line. In the markup rather than a
dashboard, so it is reviewable in a pull request and cannot drift out of step
with a setting somebody changed in a browser eight months ago.

Then define the `live-edit-locked` gate to say who is trusted with them:

```php
Gate::define('live-edit-locked', fn (User $user): bool => $user->is_developer);
```

| Who | What they get |
| --- | --- |
| Passes `live-edit-locked` | everything, including locked parts |
| Fails it | everything except the locked parts |

Locked means fully refused, not just the text. Somebody narrowed cannot reword
it, restyle it, or reorder the links inside it.

**If you never define the gate, nothing is locked for anyone.** An install that
upgrades keeps working exactly as it did.

**`data-live-lock` is not `data-no-edit`.** They sound similar and do opposite
jobs:

- `data-no-edit` means "this is not the site". A toolbar, a debug bar. Nobody
  edits it, including you.
- `data-live-lock` means "this *is* the site, and it is not the client's". You
  still edit it. They do not.

## The three values a site is given

```env
LIVE_EDIT_HOST=https://live.tryshipfast.com
LIVE_EDIT_SITE_ID=acme
LIVE_EDIT_APP_KEY=kbp_...
```

`APP_KEY` is public. It is printed into the source of every page it edits, so it
is not a secret and its name should not suggest one.

**A site whose content lives with the service needs `LIVE_EDIT_APP_KEY` in its
own environment**, not only in the page. Until 0.15.4 nothing on the server side
ever asked the service anything, so an install could work without one: the key
reaches the browser through the loader script the service generates, and the
editor only ever ran in the browser. From 0.15.4 the server reads published
content while rendering a page, so that it is in the HTML a visitor and a
crawler get rather than swapped in afterwards, and that read needs the key.

Without it, nothing fails. The editor works, the browser swaps every change in,
and the client sees their own site exactly as they left it; only visitors and
search engines are served the words in your templates. From 0.15.8 the log says
so once an hour instead of leaving you to find it.

A site whose own server talks to the service, to let its people in or to
publish, also sets `LIVE_EDIT_SECRET_KEY`. A Laravel or WordPress install that
keeps its own content never calls that API and never needs one.

Older names (`LIVE_EDIT_SITE`, `LIVE_EDIT_KEY`, and the `LIVE_EDIT_LICENCE_*` /
`LIVE_EDIT_CLOUD_*` pairs) are all still read, so upgrading changes nothing on a
running site. An install using a retired name says so in its log once a day.

## Where content lives, and where people sign in

Two different questions. Forcing one answer onto every technology is what makes
this kind of product awkward to install.

| Integration | Signing in | Content lives |
| --- | --- | --- |
| Laravel | your own accounts | your database |
| WordPress | your own accounts | your database |
| Static / React | with us | our cloud |

Laravel and WordPress already have users, permissions and somewhere to put
words, so we do not duplicate any of it. A static site has nothing to borrow,
which is what the cloud content model is for.

Set `LIVE_EDIT_SIGN_IN` to `host`, `service`, or `either` (the default, and the
only value that cannot lock somebody out of a site that worked yesterday). A
host that defines the `live-edit` gate itself decides on its own and this is
ignored.

## Tagging an existing site

Point the scanner at a rendered page:

```bash
php artisan live-edit:scan home.html             # review the plan
php artisan live-edit:scan home.html --config    # print a starter config
php artisan live-edit:scan home.html --apply     # write tags -> home.tagged.html
php artisan live-edit:scan home.html --apply --in-place
```

`--apply` is idempotent: re-running skips tagged nodes. Collections are reported
but not auto-tagged, because they need a backing model and real ids that markup
alone cannot supply. Always review the output. It is a draft.

Add `--ai` to turn the mechanical keys into semantic ones:

```bash
php artisan live-edit:scan home.html --ai --config
```

Set `LIVE_EDIT_MAPPER_AI=true` and `OPENAI_API_KEY` (override
`LIVE_EDIT_AI_ENDPOINT` / `LIVE_EDIT_AI_MODEL` for a different model). The
scanner still does all the detection. The model only renames and labels what it
found, never adds or drops any, and any failure falls back to the deterministic
result.

## Configure

Everything editable is declared in `config/live-edit.php`:

```bash
php artisan vendor:publish --tag=live-edit-config
```

The defaults work. Publish it when you want your own setting keys, models or
locales.

| Key | What it does |
| --- | --- |
| `setting_model` | the Eloquent model backing key/value settings |
| `settings` / `images` | setting keys editable as text / as images |
| `models` | collections (`class`, `fields`, `creatable`, `deletable`, ...) |
| `style_props`, `icon_options`, `rich_fields` | typed field metadata |
| `middleware` | guards the endpoints (default `['web', 'auth', 'can:live-edit']`) |
| `after_save` | runs after every write, e.g. to bust a cache |

## Optional page structure controls

Live Edit keeps the page structure unchanged unless the template opts in. To
make existing sections reorderable, mark one region and every direct section
inside it:

```html
<main data-edit-section-region="home.main" data-edit-list-label="Home page">
  <section data-edit-section="home.hero" data-edit-section-label="Hero">
    ...
  </section>
  <section data-edit-section="home.gallery" data-edit-section-label="Gallery"
           data-edit-section-duplicate="true">
    ...
  </section>
</main>
```

Section movement is available only when every direct element child has a
unique `data-edit-section` key and is not inside a locked area. Duplicate a
section only when its author adds `data-edit-section-duplicate="true"`; that
marker is the author's confirmation that its IDs, scripts and relationships
can safely be copied. Sections are hidden and restored with the existing
visibility control. Repeated collections retain their add, delete and move
controls, and new copies receive distinct editing keys and HTML IDs.

Keep at least one original item in the template markup as the seed design. An
owner may remove every visible item; choosing **Add item** later copies that
seed from the original markup. A list that the developer ships with no item or
seed template has no structure to copy, so Live Edit cannot invent a fresh
gallery card or navigation row for it.

Templates without `data-edit-section-region` take the existing scanner path;
the scanner skips the optional section pass entirely for them.

A host that marks pages itself can write the result of that pass directly:
`data-edit-list` and `data-edit-list-kind="sections"` on the region, and
`data-edit-item`, `data-edit-section`, `data-edit-section-label` and
`data-edit-section-duplicate` on each section. The hosted service does this for
templates that ship a Component Kit, because their pages arrive already marked
and are never scanned.

### How many a list holds

A list can say how many items its design holds:

```html
<ul data-edit-list="tpl:82345243d687" data-edit-list-label="Photos"
    data-edit-list-max="9" data-edit-list-min="1"> ... </ul>
```

At the maximum, **+ Add another** and **Duplicate item** are disabled, and the
drawer says why ("This design holds 9. Replace one, or delete one to add
another."). At the minimum, **Delete this item** is disabled. Without these
attributes a list has no limit and keeps at least one item, as before.

An added item copies the item it was added from, unless that item is the
list's odd one out: when its class appears once and the list has a usual
class, the copy is made from the nearest item of the usual class. A gallery
that opens with one large photo gets a normal tile, not a second large one.

### Two lists that are one collection

A row of tabs and its panels are one collection drawn twice. Each names the
other:

```html
<div role="tablist" data-edit-list="tpl:tabs" data-edit-list-pair="tpl:panels"> ... </div>
<div data-edit-list="tpl:panels" data-edit-list-pair="tpl:tabs"> ... </div>
```

Moving, duplicating or deleting an item in either saves the same order for
both, so a panel added is a tab added. Items are matched by their ids
(`data-edit-item`), so both lists use the same ids in the same order. A copy is
renamed as any copy is (`<id>--<new id>`), and so are its references into the
partner, so the new tab's `aria-controls` points at the new panel. The browser
and the server do this the same way.

### Settings a card's words do not show

A filter should read a card's own words, so a card the owner adds or retypes is
filtered by what it says. Where a card cannot say it (a gallery photo filed
under "Exterior", a course under its start month), the card carries the
category in an attribute, and the list declares it so the owner can choose it:

```html
<button data-filter="all">All</button> <button data-filter="ext">Exterior</button> <button data-filter="int">Interior</button>
<ul data-edit-list="tpl:photos"
    data-edit-choices='[{"attr":"data-cat","label":"Room","from":"[data-filter]","value":"data-filter"}]'>
  <li data-edit-item="one" data-cat="ext" data-edit-choice="setting:tpl:photos-one"> ... </li>
</ul>
```

For each declared setting the item's panel shows a select of the filter's own
choices, in its words and order, without its show-everything value or counts
(`value` names the attribute on each control holding its value; `value` itself
when absent, so radios and a select's options work as they are). `"many": true`
shows boxes for an item in several (a space-separated list). A card's settings
are saved together as one JSON object under its key and written onto the card on
the page and when publishing, only to the attributes its list declares. A copy
gets a key of its own (`@<new id>`), so it can be filed differently from its
original.

### The Shop tab

A host that serves a shop hands the editor its facts in one place
(`window.liveEditShop`), each with the key it is saved under, and the drawer
gains a **Shop** tab:

```js
window.liveEditShop = {
  products: [{ name: 'After Rain', href: '/edit/products/after-rain' }],
  checkout: { href: '/edit/checkout', modes: [{ id: 'whatsapp', label: 'Continue on WhatsApp', needs: ["the shop's WhatsApp number"] }] },
  fields: [
    { keys: ['tpl:wa'], label: 'WhatsApp number', kind: 'whatsapp', value: 'https://wa.me/15555550100' },
    { keys: ['tpl:bag-std', 'tpl:checkout-std'], label: 'Standard, 3 to 6 working days', kind: 'text', value: '$8' },
  ],
};
```

The fields are the words the pages already show, so changing one here changes
the page, and anything that reads it (a bag's total) follows. A term written on
several pages is one field saved to every key. A WhatsApp field edits the number
inside the link and keeps the message after it.

### Links the editor steers

A host that serves pages in its own editor can keep the visitor's address in
`href` and put the editor's address for the same page in `data-editor-href`.
**Open this link** in the drawer follows `data-editor-href` when present. The
link field always shows and saves the `href`, so the address a customer
publishes is never the editor's.

## The SEO tab

When the host sets `window.liveEditSeo`, the drawer has an **SEO** tab for the
page being edited: its title, its search description and, when the host gives
an `imageKey`, its **share image** (the picture a link to the page shows in a
chat or a feed: `og:image` and `twitter:image`).

```js
window.liveEditSeo = {
  title: { key: 'pageTitle.…', title: 'Shop', defaultTitle: 'Shop' },
  descriptionKey: 'pageDescription.…', description: '', defaultDescription: '…',
  imageKey: 'pageShareImage.…', image: '', defaultImage: '…/og.jpg',
};
```

The share image is chosen with the editor's own picture chooser (upload, free
photos, or generate with credits), previewed as a link card under the search
preview, and saved as an address; "Use the design's own" saves it empty.

## A card and its page

Picking a card in a list (a product, a journal entry, a project) shows the
page it opens, under the card's actions: **Edit its page →** goes there. The
page is found from the card's link, by its address or, for the design's own
pages, by the `data-link-page` the Kit gives it (`pageOfLink` in `pages.js`).

A card copied from another still opens the original's page. The copy (an id
the editor minted, or a name that is not the page's) is offered **Give it its
own page**: a page made like that one (its sections, from `starts`), named
after the card and left out of the menu, which the card's link then opens
(`makePageLike`, `hrefTo`). The editor goes straight to it, so the next thing
the owner does is write the new product's, post's or project's details. It is
the same two settings as New page, plus the link's own setting.

The new page then opens with what the card says rather than describing the
product it was made like: the card's name in its heading, its photo, its price
(the page's own, not a size's) and its short description (`cardFacts`,
`factTargets`), saved as ordinary edits the owner can change or undo. The
card's facts wait in session storage until the page's keys exist, and are
written once.

## The Brand tab

When the host sets `window.liveEditBrand` before the editor loads, a **Brand**
tab appears in the drawer and a **Brand** button in the toolbar. `?brand` in
the address opens the editor on it.

```js
window.liveEditBrand = {
  tokens: [ // each colour or face the customer may set
    { key: 'brand.ink', property: '--brand-ink', kind: 'colour',
      label: 'Headings and buttons', hint: 'Your darkest brand colour.' },
    { key: 'brand.font.display', property: '--font-display', kind: 'face',
      label: 'Headings', hint: 'The face for titles.' },
  ],
  faces: [{ id: 'fraunces', name: 'Fraunces', stack: "Fraunces, Georgia, serif",
            webfont: 'Fraunces:wght@400;500;700' }],
  chosen: { 'brand.ink': '#5B1A3A' },   // drafts over published
  styleId: 'live-edit-brand',           // the <style> carrying the chosen brand
};
```

- The tab reads top to bottom as an owner thinks: **Name and logo**; **Colours**
  as ready-made palettes (`PALETTES` in `brand.js`: each a strip of its seven
  colours beside an "Aa" in its ink on its ground, all readable at 5:1 or more,
  "The design's own" first), then **Your colours**, the palette in use as one
  strip whose every colour is pressable; **Type** as pairings (`PAIRINGS`: a
  heading and a body face, each card set in its own two faces, offered only
  when the host offers both faces); and **Fine-tune each colour and face**, the
  colour-by-colour rows and face menus, folded away. Every view shows the same
  choice wherever it was made.
- Swatches start at the design's own colours, read from the page with the
  `styleId` block switched off for a moment.
- Every change previews at once (a custom property on `<html>`), and a face
  loads its webfont as it is picked.
- Text that read clearly in the design (4.5:1, or 3:1 when large) and no longer
  does is counted and named, with **Show me**. This runs on every change and as
  soon as the tab opens.
- **Save brand** writes each changed token as a setting (`POST
  /live-edit/setting`), so it is a draft until published. An empty value means
  the design's own. The host validates the values and applies the chosen
  brand to the page it renders.

## The page builder (New page)

When the host sets `window.liveEditPages` before the editor loads, a **+ New
page** button appears in the toolbar. It opens a window of two steps; `?pages`
in the address opens the editor on it. The host builds pages; the editor only
says what the owner chose, as settings.

```js
window.liveEditPages = {
  page: 'about',                          // this page's address ('' for home)
  editorBase: '/sites/trial/edit/',       // + a page's address opens it in the editor
  pages: [                                // every page, the design's then the owner's
    { id: '', title: 'Home', href: '/sites/trial/edit/' },
    { id: 'open-days', title: 'Open days', href: '/sites/trial/edit/open-days', made: true },
  ],
  taken: ['', 'about', 'open-days'],      // addresses a new page may not have
  library: [                              // the sections the design has, named by its designer
    { from: 'about.leadership', label: 'Leadership team', page: 'About the school', at: '/sites/trial/edit/about' },
  ],
  starts: [                               // optional: the design's pages to start a new page from,
    { id: 'about', title: 'About the school', sections: ['about.head', 'about.leadership'] },
  ],                                      // each with its library sections in order
  pagesKey: 'structure:pages',            // the owner's pages: [{ id, title, menu }]
  made: [{ id: 'open-days', title: 'Open days', menu: true }],
  structureKey: 'structure:page:about',   // this page's additions: { added: { <id>: <from> } }
  added: { 'add-k3x9q2pa': 'admissions.apply' },
};
```

- **New page, step 1: a page like one you have.** The design's pages are shown
  as small live pictures (`starts`, each drawn from its page's `href`; without
  `starts`, the library grouped by `page`). Pages made of the same sections are
  one choice ("Aster Veil, and 15 like it"). **Or choose the sections yourself**
  opens the section browser instead.
- **Step 2: name it.** A title; the address follows it and is shown as a line
  with **Change**; **Show it in the menu** is a switch; the starting sections
  are chips that can be removed; the page it is copied from is shown beside the
  form. Creating saves `structure:page:<address>` then `pagesKey`, and opens
  the new page.
- **The section browser** (choosing sections yourself, and **+ Add a section**
  on a page): the library on the left, the section pointed at shown on the
  right at its real size, on **Desktop** or **Phone**, with the add button under
  it. Sections are drawn from the page in `at`, fetched once, in a sandboxed
  frame with the site's stylesheets.
- **Menus:** a new page is put in the site's menus unless **Show it in the menu**
  is unticked, and each of the owner's pages has an **In the menu** / **Add to
  menu** switch in the list. Both save `pagesKey` with the page's `menu` flag;
  the host draws the entries (each a copy of an entry the design marked, with
  its words editable like any menu entry).
- **Add a section:** in the panel of a page's sections (a list of kind
  `sections`), **+ Add a section below** opens the section browser. Adding one saves
  this page's `structureKey` with the new section (`add-` and eight base-36
  characters, never the `n` the engine mints for its own copies), then the
  section order with `s-<id>` below the section it was added from.
- **Remove this section** appears on sections the owner added (`s-<id>` whose
  `<id>` is in `added`), and saves both settings without it. The design's own
  sections are hidden instead, as before.
- Every save is `POST /live-edit/setting`, so all of it is a draft until
  published and shows under **Changes**. The host validates the values, draws
  the sections, and keys their fields.

The drawer has two tabs, **Edit** and **Changes** (plus **Brand** and **SEO**
where the host provides them). Changes holds both halves of what was saved:
**Not published yet** and **Published**, switched just under the tabs.

## If something is wrong

**Start here.** One command, safe on production, that says where this site's
published content is read from and whether that read works:

```bash
php artisan live-edit:diagnose
```

It names the four things that decide whether a visitor sees the client's words
or the theme's: where content lives, whether tagging is on, whether the app key
is set, and what the service actually answers. It never prints the key.

**Making a picture takes credits and no picture comes.** A picture is made in a
queued job, so it needs a queue that is not `sync` and a worker running
(`php artisan queue:work`). It also needs `LIVE_EDIT_AI=true` and
`OPENAI_API_KEY`. The provider is given `LIVE_EDIT_AI_IMAGE_JOB_TIMEOUT` seconds
(150 by default; two 1024px pictures often take over a minute) and the job 20
seconds more, so the queue connection's `retry_after` must be longer than that
(over 170 by default), or the queue starts the job a second time. The credits
are always given back when no picture is delivered: by the job when the
provider fails, and, when the job never ran or died partway, the next time the
editor asks about it, once its time is well past. The reason is kept in
`live_edit_image_generations.reason`, and the provider's own words are in the
log (`storage/logs`):

- `provider_refused`: the provider said no. With OpenAI the commonest reason is
  that `gpt-image-1` needs the organisation behind the key to be verified
  (platform.openai.com, Settings, Organization). Until it is, a refused model
  is tried again on `LIVE_EDIT_AI_IMAGE_FALLBACK_MODEL` (`dall-e-3`, which needs
  no verification; empty to turn this off).
- `provider_unreachable`: the server could not reach the provider at all.
- `not_stored`: the picture came back but could not be written to the media
  disk (`LIVE_EDIT_DISK`).
- `no_suggestion`: the provider answered with nothing usable.
- `timed_out`, `provider_error`: the job never finished.

**`@liveEdit` appears as text on the page.** Blade prints a directive it does
not know rather than erroring, so this ends up visible to visitors. The package
is not registered:

```bash
php artisan package:discover
php artisan view:clear
```

**The runtime loads but no toolbar appears.** The editor mounts off the body,
not the script tag. With `LIVE_EDIT_AUTO_TAG=true` that is done for you. Without
it, your layout needs `data-admin` (and `data-csrf`) on `<body>` for whoever may
edit.

**Edits save, then vanish on reload.** The save worked; nothing is putting the
value back. With named keys your template renders it from your own model, so
check that it does. With derived keys this is the middleware's job, so it means
`LIVE_EDIT_AUTO_TAG` is off. If publishing is on, an unpublished change is
deliberately only visible to an editor.

**A client can still edit something you locked.** The `live-edit-locked` gate is
not defined, so nothing binds for anyone. See
[Locking the parts a client must not change](#locking-the-parts-a-client-must-not-change).

**Your own page tests started failing after upgrading to 0.15.4 or later.** From
0.15.4 a site whose content lives with the service fetches it over HTTP while
rendering a page, which earlier versions did not do. A suite that stubs its own
api with a wildcard `Http::fake(['*' => ...])` answers that call too, so the
fixture arrives looking like published content and the page is rewritten with
it; `Http::preventStrayRequests()` turns the same thing into a stray-request
error. Neither is a fault in your suite.

Reading content off the machine is therefore off by default while the host
application is running its tests, so an upgrade from 0.15.6 onwards needs
nothing from you. A test that wants the real behaviour asks for it:

```php
config(['live-edit.remote_content' => true]);
```

Set `LIVE_EDIT_REMOTE_CONTENT=false` to switch it off outside tests too. The
page then renders the words in your templates, which is what it did before the
package arrived.

## What the package provides

- **Endpoints** (`ShipFast\LiveEdit\Http\Controllers\LiveEditController`) for
  settings, records, images, styles and undo, all whitelist-validated from your
  config.
- **Models** `ElementStyle` (per-element visual overrides) and `EditRevision`
  (undo history), with migrations.
- **`RichText`**, XSS-safe markdown-lite (`**bold**`, `*italic*`, `[text](url)`).
- **`live-edit:prune-orphans`**, deletes uploaded images nothing references.
- **The editor itself**: drawer, toolbar, live preview as you type, undo and
  redo, image picker, publish review and preview mode. Served at
  `/live-edit/runtime.js` and loaded by `@liveEdit`.

## Licence

Proprietary. Copyright (c) 2026 TryShipFast. See [LICENSE](LICENSE).

The source is public so customers and integrators can read it, audit it and
build against it. Readable is not the same as free to take: a current
subscription lets you run it on sites you own or operate, including sites you
build for clients, and does not let you redistribute it, resell it, or offer it
as a service of your own.

If a subscription lapses, the editor stops. The websites do not. The content
your clients wrote is in their own database and stays on their pages. Losing the
licence means losing the editor, not the site.
