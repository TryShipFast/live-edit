# shipfast/live-edit

Config-driven, in-place live-edit CMS for Laravel sites. Tag HTML elements in
your Blade views, and signed-in admins edit content, images, links, icons,
styles, collections and navigation directly on the live page — no separate
admin screens for content.

## What the package provides

- **Endpoints** (`ShipFast\LiveEdit\Http\Controllers\LiveEditController`) for
  settings, records (create / update / move / delete), images (replace / alt /
  title / remove), styles and undo — all whitelist-validated from your config.
- **Models** `ElementStyle` (per-element visual overrides) and `EditRevision`
  (undo history), with migrations.
- **`RichText`** — XSS-safe markdown-lite (`**bold**`, `*italic*`, `[text](url)`).
- **`live-edit:prune-orphans`** — deletes uploaded images nothing references.
- **The editor itself** — drawer, toolbar, live preview as you type, undo and
  redo, the image picker, publish review and preview mode. Served by the
  package at `/live-edit/runtime.js` and loaded by `@liveEdit`; you never
  import or build it.

## Install

Two steps.

```bash
composer require shipfast/live-edit
php artisan migrate
```

Then one line in your layout's `<head>`:

```blade
@liveEdit
```

That is the whole integration. The directive serves the editor from this
package, so there is nothing to import, nothing to publish, and nothing to add
to your asset build.

**Do not import the editor in `app.js`.** Bundling it compiles a copy of the
engine into your site's assets, which means an engine fix reaches you only
when you rebuild and redeploy — and until you do, the copy in your bundle and
the one composer installed are different versions of the same thing, with
nothing to say so. `@liveEdit` loads the installed package, so updating it is
`composer update`.

### Who may edit

The editor appears for whoever passes the `live-edit` gate. Define it:

```php
// app/Providers/AppServiceProvider.php
Gate::define('live-edit', fn (User $user): bool => $user->is_admin);
```

Nobody else is served the editor at all, so a visitor's page is the page they
would have had without this package.

### Optional

```bash
php artisan vendor:publish --tag=live-edit-config    # to change what is editable
```

The defaults work. Publish the config when you want to declare your own
setting keys, models or locales.

## Configure

Everything editable is declared in `config/live-edit.php`:

- `setting_model` — the Eloquent model backing key/value settings.
- `settings` / `images` — setting keys editable as text / as images.
- `models` — collections (`class`, `fields`, `creatable`, `deletable`,
  `image_field`, `defaults`).
- `style_props`, `select_options`, `icon_options`, `rich_settings`,
  `rich_fields` — typed field metadata.
- `middleware` — guards the endpoints (default `['web', 'auth', 'can:live-edit']`).
- `after_save` — invoked after every write, e.g. to bust a content cache.

Define the `live-edit` gate (or your own `middleware`) to control who can edit.

## Tagging

```blade
<h1 data-edit="setting:heroTitle" data-edit-label="Hero heading">{{ $site->get('heroTitle') }}</h1>
<div data-edit="record:faq:{{ $faq->id }}" data-edit-deletable
     data-edit-values="{{ json_encode(['question' => $faq->question, 'answer' => $faq->answer]) }}">…</div>
<section data-style="home.hero"> … <x-live-edit::style-chip key="home.hero" label="Hero" /> </section>
```

## Onboarding an existing site — the auto-mapper

Point the scanner at a rendered page to get a tagging plan, or apply it:

```bash
php artisan live-edit:scan home.html            # review plan (text/image/link/collection)
php artisan live-edit:scan home.html --config    # print a starter config skeleton
php artisan live-edit:scan home.html --apply     # write data-edit tags -> home.tagged.html
php artisan live-edit:scan home.html --apply --in-place
```

Add `--ai` to refine the mechanical keys into semantic ones with an LLM:

```bash
php artisan live-edit:scan home.html --ai --config
```

Set `LIVE_EDIT_AI=true` and `OPENAI_API_KEY` (provider-agnostic — override
`LIVE_EDIT_AI_ENDPOINT` / `LIVE_EDIT_AI_MODEL` for a different model). The
scanner still does all the *detection*; the LLM only renames/labels the
elements it found (never adds or drops any), and any failure falls back to
the deterministic result. The API key is read from the environment.

`--apply` writes text, image and link tags directly onto the recognised
elements (idempotent — re-running skips tagged nodes). Collections are
reported but not auto-tagged: they need a backing model and real ids, which
markup alone can't supply. Always review the output — it is a draft.

Load the admin partial once in your layout (`@include('live-edit::admin')`)
and the drawer/toolbar handle the rest.

## Licence

Proprietary. Copyright (c) 2026 TryShipFast. See [LICENSE](LICENSE).

The source is public so that customers and integrators can read it, audit it
and build against it. Readable is not the same as free to take: a current
subscription lets you run it on sites you own or operate, including sites you
build for clients, and does not let you redistribute it, resell it, or offer it
as a service of your own.

If a subscription lapses, the editor stops. The websites do not. The content
your clients wrote is in their own database and stays on their pages — losing
the licence means losing the editor, not the site.

