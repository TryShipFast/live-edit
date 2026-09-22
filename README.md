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
- **JS module** (`resources/js/live-edit.js`) — the editor drawer, toolbar,
  live preview, undo, toasts and every control.

## Install

```bash
composer require shipfast/live-edit
php artisan vendor:publish --tag=live-edit-config   # config/live-edit.php
php artisan vendor:publish --tag=live-edit-js        # resources/js/live-edit.js
php artisan migrate
```

Import the JS from your app entry (`resources/js/app.js`):

```js
import './live-edit.js';
```

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
