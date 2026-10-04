# ShipFast Live Edit

In-place editing for sites that are already built. Tag the elements, and the
people who own the site edit text, images, links, icons, styles and lists on
the page itself. There are no admin screens for content, because the page is
the admin screen.

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

## If something is wrong

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
