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

## Team editing: one person per section

When a website has a team (editors invited on Pro and Agency), two people can
have the editor open at once. Before 0.18.0 they silently overwrote each
other: a change was one shared draft per key, the last save won, and whoever
pressed Publish put everybody's half-finished work live. Now each part of the
site belongs to one person while they work on it.

**What people see**

- The first thing you change in a section (or the first section you open)
  becomes yours until you publish, discard, or leave it alone for 30 minutes.
- A section a teammate is working on has a quiet dashed outline and a label,
  "Ada is editing this section". Pressing anything in it says so in plain words
  instead of opening it. An editor is told to ask an admin to take over; the
  owner and admins get a **Take over** button.
- The **Publish** button counts only your own changes, which is what pressing
  it puts live.
- **Publish** puts live only your own sections, then lets go of them. A
  teammate's unfinished section stays a draft, still theirs and still locked,
  until they publish it. The publish window lists "Your changes (these go live
  when you publish)" and "Others' changes (not included)", by name.
- **Changes** shows the same split. Only the author, or an admin, can put back
  somebody's change.
- A section left alone for 30 minutes opens up. Its changes stay saved and
  still belong to their author. The next person to open it is told "Ada left
  unpublished changes here" and can **Continue from them** (they become theirs)
  or, for an admin, **Discard them**.
- **Take over** (owner and admins) takes the section and the holder's
  unpublished changes in it. The holder is told "Olu took over Hero" on their
  next look.
- **History** says who did what, newest first: "Ada published 2 changes",
  then each change under its section, "Ada changed the headline in Hero". Each
  version has **Undo these changes**, which puts back only what that publish
  changed and leaves anything somebody changed again since (it says so).
  Putting the whole website back to an earlier version is not in History: it
  is `POST /restore` only, for the owner and admins (403 for an editor). It
  says whose published work it takes back, and it no longer throws away a
  teammate's unpublished drafts.

**Roles.** The first person on the site is the owner. The owner can make
anybody an admin, and an admin is promoted or demoted the same way. The owner
and admins may take over a section, throw away changes somebody left, put back
a teammate's change and restore a whole version; an editor may not. A role
change counts on the person's next request: every action that needs the power
reads the role fresh, and the cached "who is editing" answer forgets a person
the moment their grant changes.

A site with one person editing works exactly as before: everything is theirs
and Publish publishes everything. So does any session that does not say who it
is (the site's own keys, and every session minted before 0.18.0).

**Lock units.** One person holds one unit at a time:

| Unit | What it covers |
| --- | --- |
| `section:<instance>` | a Kit section on a page (`data-edit-section`, `data-instance`) |
| `site/<instance>` | a band every page shares, such as `site/header`, `site/footer` |
| `panel:brand`, `panel:shop`, `panel:seo:<page>` | the Brand tab, the Shop tab, one page's search and sharing settings |
| `collection:<id>` | one search collection, with all of its pages of records |
| `form:<key>` | one form the owner shapes |
| `arrangement:<page>` | one page's arrangement (sections added, moved, hidden) |
| `pages` | the list of pages (adding, renaming, removing a page) |
| `area:<id>`, `key:<key>` | on a site with no sections: a part with an id, else the element itself |

Keys whose shape says what they are (`form:`, `collection:`, `structure:page:`,
`structure:pages`) are filed under their unit by the server whatever the
browser says. Everything else uses the unit the editor declares
(`X-Live-Edit-Unit`), and a draft remembers its unit, so a stale browser that
declares a different one still meets the lock.

**How it is built.** `live_edit_section_locks` holds one row per (site, unit):
holder, name, role, `claimed_at`, `last_active_at`, and `taken_from` after a
take-over. Drafts gained `author`, `author_name`, `unit` and `unit_label`;
versions gained `published_by_id`, `summary` (who changed what, with before and
after) and `undoes`. `Domain\Team\SectionLocks` is the authority; the editor
(`resources/js/team.js`) only shows what it says.

| Endpoint | |
| --- | --- |
| `GET /team` | who holds what on this site, and who you are. Cached; `If-None-Match` gets a 304 |
| `POST /team/claim` `{unit, label, continue}` | take a section (409 with who holds it) |
| `POST /team/heartbeat` | still here (renews at most once a minute) |
| `POST /team/release` `{units?}` | let go |
| `POST /team/take-over` `{unit}` | owner or admin |
| `POST /team/discard-left` `{unit}` | owner or admin: throw away what somebody left |
| `POST /team/discard` | throw away my own unpublished changes and let go |
| `POST /versions/{n}/undo` | undo one published version (publish key) |
| `POST /restore` `{version}` | the whole site back to a version: owner or admin only |
| `POST /sessions/role` `{id, role}` | secret key: promote or demote a person the host named |

Any save into a section somebody else holds is refused with **409** and a
sentence ("Ada is editing Hero right now. Ask an admin to take over if it
cannot wait."), even from a stale page. Two first edits at the same moment are
decided by the unique index: one gets the section, the other is told who.

**What the host passes.** Who the person is, when it starts the session:

- somebody we know (signed in with us, or `EditorSession::begin($site,
  $editor, $role)`): their name, and their role on their grant
  (`live_edit_editor_site.role`: `owner`, `admin` or `editor`; `begin` writes
  the role it is given there). Promote or demote by changing the grant
  (`$editor->sites()->updateExistingPivot($site->id, ['role' => 'admin'])`);
- minted by the host (`POST /sessions`): `editor: {id, name, role}`, where `id`
  is the host's own id for its user and `role` is `owner`, `admin` or
  `editor`; promote or demote with `POST /sessions/role {id, role}` and every
  session of theirs changes on its next request.

Settings: `live-edit.team.idle_minutes` (30), `poll_active_seconds` (5),
`poll_idle_seconds` (30). `live-edit:prune-locks` runs every ten minutes on the
schedule to clear lapsed rows; nothing depends on it.

## Caching and load

Many open editors must not load the server, and a busy published site must not
cost a query per visitor.

**Who is editing what** (`GET /team`) is the one request every open editor
repeats. It is built to cost nothing when nothing changed:

- the answer is one object per site in the application cache (Redis if the host
  has it, else whatever `cache.default` is), keyed by a per-site revision that
  moves only when a lock or a draft's owner changes;
- the browser sends the `ETag` it was given and gets **304** with no body;
- the key check is remembered for 30 seconds (`TokenAuthenticator`, remembered
  mode), and forgotten at once when the key changes or is revoked; the CORS
  check's allowed addresses are remembered for a minute and forgotten when the
  site is saved;
- result: **0 database queries** for an unchanged poll (`TeamEditingTest` checks
  it; the load test measures it);
- a lock lapsing is noticed lazily: the cached answer knows when its soonest
  lock lapses and is rebuilt then (two queries), once.

The editor asks every 5 seconds while somebody is working, every 30 seconds
after two idle minutes, never while the tab is hidden, and spreads the polls by
up to a fifth either way so a room of editors does not ask in step.

**Writes.** Claiming is one `INSERT ... ON CONFLICT DO NOTHING` (insertOrIgnore)
and, only if needed, one conditional `UPDATE` that succeeds for the holder or
when the lock has lapsed. Activity renews `last_active_at` at most once a
minute per person, in one statement over all their locks. Indexes:
`(site_id, unit)` unique, `(site_id, holder)`, `(site_id, taken_from)`,
`last_active_at`; drafts `(site_id, author)` and `(site_id, unit)`.

**What else is cached** (audit, 0.18.0):

| Path | Before | Now |
| --- | --- | --- |
| Visitor content read (`GET /content`, `/content/version` with the public key) | snapshot file plus 5 queries on every request | remembered per site and language for `min(10, pointer_seconds)` seconds, forgotten on save, publish, restore, undo and discard: auth only (2 queries, 1 more once a minute to note the key was used) |
| CORS on every API request | one `sites` query | remembered a minute, forgotten when the site is saved |
| Who is editing what | (new) | 0 queries when unchanged, see above |
| Editor's own content read (with drafts) | 7 to 8 queries | unchanged on purpose: it is one person's unfinished work and is never cached |
| Published files (snapshots) | written on publish, served as files, `Cache-Control` public with stale-while-revalidate | unchanged |
| Tagging a page (`/tag`) | cached by markup hash | unchanged |
| Licence answer | cached | unchanged |

Still a query on every request, and why: the key check on every route except
`GET /team` (a remembered key everywhere would delay a revocation everywhere);
`hasLiveLicence()` on every write (two queries; a candidate for a short cache);
a save is about 15 queries (policy, developer locks, meter, revision log, team
lock), which is fine at human typing speed.

The load test (`tests/load/team-locks.mjs`) runs 50 editors on one site and one
editor on each of 200 other sites against the real API and reports polls per
second, 304s, database queries per poll and latency.

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

### The Search tab (search over a collection)

A host that keeps collections for visitors to search hands them over (`window.liveEditCollections`), and the bar
gains **Search** and the drawer a **Search** tab (`resources/js/collections-panel.js`):

```js
window.liveEditCollections = {
  collections: [{ id: 'aircraft-parts', name: 'Aircraft parts', one: 'part', many: 'parts', title: 'name', pages: 1,
    fields: [{ key: 'part_number', label: 'Part number', type: 'text', code: true }, { key: 'condition', label: 'Condition', type: 'choice', options: ['NE', 'OH'] }],
    records: [{ id: 'r1', part_number: '2-1586-3', condition: 'OH' }] }],
  missed: { href: '/dashboard#search', count: 3 },   // where the searches that found nothing are listed
};
```

Each collection opens as a table, takes rows from a spreadsheet (every refused row said with its number), and
goes out as CSV; a new one is made from a spreadsheet or empty. Saved through the ordinary setting save as
`collection:<id>` and `collection:<id>:rows:<n>` (pages of rows that each fit one value; `collections.js`), so a
draft until published. A host keeping values longer than 10,000 characters under keys of its own says so in
`EditPolicy::longestValue()`. A library entry with `kind: "search"` is a search section the host draws; pressing
its box, filters or results opens its panel (the filters visitors see and cards or rows, declared in
`data-edit-choices` on the section). The visitor's search is `resources/dist/kit-search.js`, built from
`collection-search.js` with no dependencies, which a host publishes beside the site with each collection's index.
The host's contract is in the website's LIVE-EDIT-STRUCTURE.md, "Search over a collection". `?search` on the
editor's address opens the tab.

### Links the editor steers

A host that serves pages in its own editor can keep the visitor's address in
`href` and put the editor's address for the same page in `data-editor-href`.
**Open this link** in the drawer follows `data-editor-href` when present. The
link field always shows and saves the `href`, so the address a customer
publishes is never the editor's.

## The toolbar

The bar at the foot of the screen carries the editor's controls (Edit or Done, Undo, Redo, Pages,
Sections, Brand, Search, Changes, Help, Preview, Publish) and any links the host adds, then Log out:

```html
<script>
  window.liveEditToolbar = {
    links: [
      { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
      { label: 'Tracking and ads', href: '/sites/acme#tracking', icon: 'tracking' },
      { label: 'Docs', href: '/docs', title: 'How the editor works' },
    ],
    logout: { href: '/logout', method: 'post' },
  };
</script>
```

A link with an `icon` is drawn as a round icon button: its `label` is the name a screen reader reads
and the tooltip shown on hover and on keyboard focus, and it is a 44px target. The icons are
`dashboard`, `tracking`, `settings`, `help`, `external` and `logout`. A link without an `icon` (or
with a name not in that list) keeps its words, as before, with `title` as its tooltip. Log out is
always an icon.

The bar keeps one row. When everything would not fit (always on a phone, 760px and under; on a
tablet or a narrow desktop when needed) it folds: Edit or Done, Undo, Publish with its count and a
**More** button stay, and the rest moves into the More sheet as labelled icons, the least used first
(Log out, then the host's links, Help, Search, Brand, Sections, Preview, Pages, the language,
Changes, Redo). The sheet closes on a tap outside it, Escape or Back, keeps the keyboard inside it
while it is open, and hands it back to More. The bar and the sheet keep clear of the iPhone's home
bar, and a site's own fixed bar at the foot of the screen (a phone's Call bar) is lifted above the
bar while editing. The icons and the sheet's contents are in `resources/js/toolbar-icons.js`.

## Unsaved changes

Words typed into the panel and not saved (or a Brand or SEO panel whose Save is waiting) are asked
about before they are lost, the way Shopify admin and Google Docs ask (`resources/js/unsaved.js`):

- closing the tab, reloading or typing another address: the browser's own "Leave site?" question
  (`beforeunload`, the only thing a page may do there);
- leaving from inside the editor (a link in the bar or the More sheet, **Open** in Pages, the
  **Pages** button) and **Done editing**: the editor's own dialog, **You have unsaved changes**,
  "Leave without saving?", **Leave** or **Stay** (Stay is focused; Escape, × and a tap outside
  mean Stay). After Leave the browser does not ask a second time;
- closing the panel: "Discard what you typed?", **Discard** or **Keep editing**.

Nothing is asked when nothing is unsaved. The panel's buttons are **Discard** and **Save changes**
(Shopify's save bar), in the element panel, Brand and SEO alike.

Words only a screen reader hears (`.visually-hidden`, `.sr-only`, `.screen-reader-text` and the
like, holding `data-edit`) stay hidden while editing, whatever the design's stylesheet does with
`body.editing`: a ", home" beside the logo read as a mistake on the page. They are offered in the
panel of what holds them, under **Read aloud by screen readers**.

## Somebody who may not publish

An editor whose grant does not include **Can publish** is not offered a Publish the server would
refuse. Their bar says **Ask to publish** with the count (**Review** where the bar is folded on a
phone; its name is "Ask to publish, 2 changes saved"), and pressing it says, in one dialog, **Ask an
admin to publish**: the changes are saved, and visitors see them once someone who can publish puts
them live. No publish is sent. This is WordPress's Contributor ("Submit for review") and Google Docs'
suggesting, on the same bar.

The editor knows from either of:

- the session (`GET …/{site}/session`): `may_publish` is `true` or `false` for somebody who signed in
  with us (their grant), and `null` for a session a host minted (that host publishes its own way);
- the host: `window.liveEditPublishing = { pending: 3, mayPublish: false }`.

Unknown means allowed, as before; the API refuses a publish without the `publish` ability regardless.

## Help (the ? button)

Help is written for somebody who has never edited a website. It opens on what this kind of site is
for and where to start, then offers:

- **Start here:** the jobs that matter most on this kind of site. A shop starts in its Shop tab; a
  school with its dates and news; a portfolio with its projects.
- **Your lists:** a step-by-step guide for each list on the page ("Add to Products", "Add to News").
  Each points at that list's own cards. It mentions the card's setting only where the list declares
  one (`data-edit-choices`), and "Give it its own page" only where cards open pages and the page
  builder is on. Lists are ranked by shape: cards with headings and pictures that each open their own
  page come first. A button pair, the menu, the footer, the page's sections and lists of a layout not
  shown are left out.
- **Everything else:** the feature guides (words and links, pictures, the menu, sections, brand, SEO,
  pages, languages, undo, preview and publish), each only where this editor has it.
- **Common questions,** in plain words. Each appears only where the editor has the feature it answers.

The host says what kind of site it is:

```html
<script>window.liveEditSite = { category: '11-ecommerce', kind: 'shop' };</script>
```

`kind` is one of `shop`, `school`, `university`, `training`, `salon`, `studio`, `restaurant`, `hotel`,
`charity`, `worship`, `property` or `fintech`. Otherwise the first two digits of `category` choose:

| `01` | `02` | `03` | `04` | `05` | `06` | `07` | `08` | `09` | `10` | `11` |
|---|---|---|---|---|---|---|---|---|---|---|
| portfolio | business | services | agency | beauty | school | restaurant | tech | health | charity | shop |

Without it, a site with a Shop tab is treated as a shop and anything else gets general help. The
content is in `resources/js/help.js`.

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

A product, a journal post, a project or a course is two things on a site: a
card in a list and the detail page the card opens. The owner manages both from
the card. The page is found from the card's link, by its address or, for the
design's own pages, by the `data-link-page` the Kit gives it (`pageOfLink` in
`pages.js`). Everything below is in `card-page.js`.

### Edit all details: the page itself, edited in place

Picking a card offers **Edit all details**. It opens a window over the list
holding the card's page as itself: the editor, loaded in a frame on that page
in detail mode (`?live-edit=detail`, `detailAddress`). Only the record's own
components are shown, with their layout, photos, options and words
(`showOnlyTheDetail`, using the same component rule as before:
`linked-detail-scope.js`). The header, menus, footer, related cards and
sticky buy bars are hidden, not removed, so the template's own scripts keep
working.

The owner edits by clicking the component, with the same panel, controls and
saves as on the page: words, the picture chooser and upload, links, styles,
list add, remove, duplicate and reorder (sizes, colours, a post's pictures),
card settings. Saves are ordinary drafts, so they show under Changes, undo,
and go live when the owner publishes from the bar. Each save in the frame tells
the list (`live-edit:detail-saved`); closing the window reads the saved
content again, so the list shows what was saved. **Open the whole page →**
is still offered, but nothing requires it. Page-section controls (move, copy,
hide a section) are left to the whole page, where the rest can be seen.

Nothing is generated: there is no form made from the page's fields. A new
template feature works in this window as soon as its page component carries
the ordinary editing attributes.

### A copied card gets a full copy of its page

A card copied from another still opens the original's page. Before anything
on it is edited, its panel offers **Give it its own page**, which makes a page
that is a full copy of the one it shares, as it stands now, and opens it in
the same window (`copyPageForCard`):

1. **The page.** One section added for every section of the original, from the
   same design section, in the owner's order, out of the menu
   (`structure:page:<id>` with `added`, and an entry in `structure:pages`). A
   section the owner added to the original is copied from what it was added
   from, read from that page's own `window.liveEditPages`. The host draws each
   section with keys of its own (`added:<page>/<added id>`).
2. **Its lists.** Every list's saved order, onto the copy's list keys, so the
   copy holds the same items (a size the owner added, one they deleted).
3. **Everything else.** Both pages are read again and walked side by side:
   elements are matched by their position among same-tag siblings, which is how
   the host keys them, and list items by their id (`keyMap`). Every saved word,
   picture (with its description and credit), link, drawing, icon, card
   setting and style of the original is written under the copy's key
   (`mappedKey`, `copiedSettings`, `copiedStyles`).
4. **The card's own words.** The name, photo, price and short description the
   owner saved on the card are written on the copy where they differ from the
   page (`cardFacts`, `factTargets`). What the card still shows from the design
   does not count, so a sample photo on the card never replaces the photo the
   owner chose for the page.

Then the card's link is pointed at the new page (`hrefTo`). The two pages share
no key, so an edit to either never reaches the other. A copy is dozens of
saves; a refusal for speed (429) is waited out rather than leaving a half copy.

### Deleting a card deletes its page, if the owner says so

**Delete this item** on a card that opens a page no other card opens asks
first: **Delete the card and its page**, **Delete the card, keep its page**, or
Cancel. The question says what else still links to the page: links on this
page (other cards, the menu) and links the owner pointed at it anywhere on the
site (`linksTo`, `linksWarning`). Links the design wrote into other pages are
not known to the editor.

Deleting a page is `deletePage`, an ordinary draft like any other change:

- a page the owner made leaves `structure:pages` and its `structure:page:<id>`
  is cleared;
- a page the design came with is added to the list the host names as
  `removedKey` in the page builder (`removed` holds the current list). A host
  that names no `removedKey` cannot remove design pages, and the question says
  so and offers to delete the card only.

When adding a card or detail-page capability:

1. Mark every field on the detail component with its normal Live Edit key;
   do not add a card-type-specific field mapping.
2. Give the detail component its identity (`.article`, `.detail`,
   `.products-pdp-title` or `.products-title` on `data-component`, with its
   siblings sharing the instance prefix) so the window shows it and nothing
   else. Give option lists a human `data-label` ("Sizes", "Colours").
3. Benchmark every template using it: a product with colours and sizes, a
   product with priced variants, and an article with long-form content. Open
   **Edit all details**, confirm related cards and sticky controls are hidden,
   change something, save, close and reopen. Then duplicate a card, give it its
   own page, confirm the copy carries every edit, edit both and confirm each
   stays itself. Delete a card with its page.
4. Add a regression test for the markup shape before shipping
   (`tests/js/a-card-and-its-page.test.js`, `tests/e2e/card-details-journey.spec.js`).

The existing-template markup benchmark found 14 Oxbow-Hem product pages with
repeatable colour and size lists, 16 Vellumair product pages with named and
priced variants, and 45 blog/journal pages with an identified article
component. Repeat it when the catalogue changes.

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

## The page builder (Pages and New page)

When the host sets `window.liveEditPages` before the editor loads, a **Pages**
button appears in the toolbar. It opens the Pages list (below), whose **+ Add
page** opens New page, a window of two steps; `?pages` in the address opens the
editor on New page. The host builds pages; the editor only
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
    { id: 'about', title: 'About the school', sections: ['about.head', 'about.leadership'],
      own: ['about.head', 'about.leadership'] },  // optional: the same sections as this page has them;
  ],                                      // each with its library sections in order; a new page copies `own`
  categories: [                           // optional, a shop: its categories for the Shop tab
    { id: 'shop/headphones', title: 'Headphones', href: '/sites/trial/edit/shop/headphones', made: false,
      copies: ['shop-headphones.intro', 'shop-headphones.headphones'],    // what a new one like it copies
      products: 3, inMenu: true,          // optional: how full it is, and whether a marked menu links it
      has: ['arc', 'arclite', 'studio'], productsKey: 'structure:products:shop/headphones' },  // optional: what it shows, where that is saved
  ],
  pagesKey: 'structure:pages',            // the owner's pages: [{ id, title, menu }]
  made: [{ id: 'open-days', title: 'Open days', menu: true }],
  structureKey: 'structure:page:about',   // this page's additions: { added: { <id>: <from> } }
  added: { 'add-k3x9q2pa': 'admissions.apply' },
  removedKey: 'structure:removed',        // optional: where the design pages the owner deleted are listed
  removed: [],                            // the list as it stands; without removedKey they cannot be deleted
};
```

- **A shop's categories.** With `categories`, the Shop tab lists them (each opens its page;
  **Duplicate** copies one) and **New category** asks for a name and which category it looks like,
  then saves a made page with that category's `copies`. It starts like the fullest category the menu
  links (`products`, `inMenu`; the fullest of all where the menu links none) and goes in the menu only
  where the shop's categories are. With `has`, `productsKey` (and the root `productsKey`) and the Shop
  tab's product ids (`window.liveEditShop.products[].id`), **Products** beside a category ticks the
  products it shows, and New category ticks its own (those of the category it looks like, to start);
  saved as a list of product ids, which the host draws as the design's own cards. The host names the
  page and places its menu link beside the other categories (the website's LIVE-EDIT-STRUCTURE.md,
  "A shop's categories").
- **Pages** (`resources/js/pages-list.js`; Wix's "Pages & Menu", Squarespace's
  Pages): every page in one list, in the order the menu shows them. The order is
  the design's main menu as drawn on the page (`data-kit-menu="main"`, else the
  header's `nav`; never the phone copy or a row of categories), with Home first
  and the owner's pages in their `pagesKey` order. Three groups: **In your
  menu**, **Not in your menu**, and, folded away, **Pages your website uses**:
  a checkout, a bag, search results, a brand sheet, a 404, account pages,
  privacy and terms, and the record pages of a collection (`products/…`,
  `journal/…`, the catalogue's own products). Each row has **Open** (asked
  first when something is unsaved). What else a row offers is what the host
  can keep:
  - the owner's pages (`made`): **Rename** (the title in `pagesKey`), the **In
    menu** switch, **↑ / ↓** and drag to move them among the menu's other pages
    you made, **Duplicate**, **Delete** (asked first; saves `structure:page:<id>`
    as `{"added":{}}` then `pagesKey` without it);
  - the design's own pages: **Duplicate** (where `starts` gives its sections)
    and **Delete** (only with `removedKey`; never Home or the 404; the id is
    added to `removed`). Their title and place in the menu are the design's:
    the list says so instead of offering buttons that would do nothing;
  - the pages a website uses: Open only.

  A duplicate is a new page of the owner's at a free address
  (`<title>-copy`), titled "<title> (copy)", with the same sections and out of
  the menu. Every save is a draft and shows under Changes (`structure:removed`
  is described as "Deleted the page About"). The menu on the page shows a change
  once the page is drawn again: the list says so and offers **Reload to see
  it**, which reopens the list.

  A host may say what a page is (`kind` on a page in `pages`: `page`,
  `internal`, `legal` or `record`, or `internal: true`); otherwise it is read
  from the address and title. New page never offers an internal page, a notice
  or one record as a kind of page to start from.

  **What the host decides, not built here.** Renaming or reordering the design's
  own menu entries, taking one out of the menu, and redirecting the old address
  of a renamed or deleted page need host work: the design draws its menu, and
  no setting moves an entry it wrote. Duplicating one of the owner's pages
  other than the one open needs its sections (`made[].added`; the editor strips
  it before saving, since `pagesKey` holds only `id`, `title` and `menu`).
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

### Charts and tables

A library entry with a `kind` (`bar`, `line`, `donut`, `funnel`, `progress`, `sparkline` or `table`) is a chart or
a table the host draws from its standard markup rather than cut from a page (`at` is null); the library says what
each kind holds and the rules it keeps before it is added. On the page, a chart (`data-chart`) is edited in its
kind's own terms (`resources/js/data-kit.js`, `data-panel.js`): a drawn bar, point or slice opens its row with the
kind's fields and rules, the drawing opens the chart's settings (`data-edit-choices` with `options` named inline)
and "Paste rows"; a table's cell (`data-kit-table`) opens with its row and column, each added, moved and deleted,
every row kept in step by one saved order of columns. The host's contract is in the website's
LIVE-EDIT-STRUCTURE.md, section 7, "Charts and tables the owner adds".

### Forms the owner shapes

When the host sets `window.liveEditForms`, each form it marks (`form[data-kit-form="<page>/<instance>"]`) is shaped
in a builder (`resources/js/forms.js`, `form-builder.js`). Only a host that has it hands it over (the website hands it
to its hosted templates on a plan with the form builder); an outside site never sees the builder or its handle.

```js
window.liveEditForms = {
  types: ['text', 'email', 'phone', 'number', 'date', 'time', 'choice', 'radios', 'checkbox', 'checkboxes', 'longtext'],
  forms: {
    'book/book.your-enquiry': {
      key: 'book/book.your-enquiry', settingKey: 'form:book/book.your-enquiry', label: 'Your enquiry',
      purpose: 'booking-request', workflow: 'booking', saved: false, submissions: 3,
      fields: [{ key: 'email', label: 'Email address', type: 'email', required: true, help: '', retired: false, options: [],
                 seeded: true, choices: null, protected: 'Needed for bookings', answers: 3, answeredAs: 'email' }],
    },
  },
};
```

- Pressing a box of the form, or a question the builder holds (`[data-kit-form-field]`), opens the builder at that
  question; an **Edit form** handle sits on the form; a heading or label still edited as words offers "Edit this
  form's questions". A form the host handed nothing for is read from its markup (`seedForm`).
- The builder: move up and down, rename, help text, kind, required, choices (the builder's own; a dropdown whose
  choices are the page's words keeps them, edited by pressing it), **+ Add a question**, **Start blank**, **Taken off
  the form** with **Put it back**. **Save the form** saves `settingKey` once as `{"fields":[{key,label,type,required,help,
  retired,options}]}` and opens the page again with the builder on the form, which the host draws in the template's
  own form kit.
- What it keeps, said before anything is changed: a question `protected` by the workflow is renamed and moved only;
  one with `answers` keeps its kind and is taken off (`retired`), never deleted; a picked choice is retired; required
  applies to new answers only; a checkout takes no new questions yet. The host holds the same rules on save. The
  website's contract is LIVE-EDIT-STRUCTURE.md, "Forms the owner shapes".
- A library entry with `kind: 'form'` and `says` (lines describing it) is a form the host adds from the library.

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
