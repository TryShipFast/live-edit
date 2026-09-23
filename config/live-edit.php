<?php

use App\Models\Setting;

/*
 * ShipFast live-edit CMS — example configuration.
 *
 * Publish this file (`php artisan vendor:publish --tag=live-edit-config`) and
 * describe your own site's editable content. Everything the runtime does is
 * driven from here; nothing in the package is project-specific.
 */
return [

    // The Eloquent model backing key/value settings (must have key + value).
    'setting_model' => Setting::class,

    // Translations. A non-default locale stores each text setting under a
    // "<locale>:<key>" row and falls back to the default locale's bare key.
    // No schema change — it's a key namespace over the settings table, so each
    // locale's edits also version independently in edit_revisions. Leave a
    // single locale here to keep the site monolingual.
    'default_locale' => 'en',
    'locales' => [
        'en' => 'English',
    ],

    // Generic store. When on, the runtime accepts scanner-generated
    // "auto:<hash>" keys without a per-element allowlist entry — so a whole
    // theme tagged with `live-edit:scan --apply --auto` is editable with no
    // hand-authored config. Named keys still require the allowlist below.
    'auto_keys' => env('LIVE_EDIT_AUTO_KEYS', false),

    // Middleware guarding the live-edit endpoints. Define the `live-edit`
    // Gate (or supply your own middleware) to control who may edit.
    'middleware' => ['web', 'auth', 'can:live-edit'],

    // Setting keys editable as plain text: data-edit="setting:<key>".
    // Keys ending in "Href" (or starting with "social") are link-validated;
    // keys ending in "Target" accept only "" or "_blank".
    'settings' => [
        // 'heroTitle', 'heroSub', ...
    ],

    // Setting keys holding an image: data-edit-img="setting:<key>".
    // Each may have <key>Credit / <key>Href / <key>Alt / <key>Title siblings.
    'images' => [
        // 'imgHero', ...
    ],

    // Eloquent-backed collections: data-edit="record:<type>:<id>".
    'models' => [
        // 'faq' => [
        //     'class' => App\Models\Faq::class,
        //     'fields' => ['question', 'answer'],
        //     'creatable' => true,
        //     'deletable' => true,
        //     'defaults' => ['question' => 'New question', 'answer' => 'Write the answer here.'],
        // ],
    ],

    // Style properties elements may expose (data-style + data-style-props).
    // Types: 'color' (hex picker), 'px' (0-400), 'toggle' (hide).
    'style_props' => [
        'background' => 'color',
        'backgroundImage' => 'url',
        'textColor' => 'color',
        'paddingY' => 'px',
        'paddingX' => 'px',
        'fontSize' => 'px',
        'radius' => 'px',
        'hidden' => 'toggle',
    ],

    // Allowed values for any field named "icon" (rendered as a visual grid).
    'icon_options' => [
        // 'search', 'tag', 'wrench', ...
    ],

    // Fields rendered as fixed-option dropdowns, validated server-side.
    'select_options' => [
        // 'category' => ['Aircraft', 'Engines'],
    ],

    // Setting keys / "<type>.<field>" pairs whose content renders as
    // markdown-lite (**bold**, *italic*, [text](url), line breaks).
    'rich_settings' => [],
    'rich_fields' => [],

    // Optional AI refinement of the auto-mapper's suggested keys/labels.
    // Provider-agnostic; OpenAI chat-completions shape by default. The key is
    // read from the environment, never stored here.
    'ai' => [
        'enabled' => env('LIVE_EDIT_AI', false),
        'endpoint' => env('LIVE_EDIT_AI_ENDPOINT', 'https://api.openai.com/v1/chat/completions'),
        'model' => env('LIVE_EDIT_AI_MODEL', 'gpt-4o-mini'),
        'api_key' => env('OPENAI_API_KEY'),
        'batch' => 25,
        'timeout' => 30,
    ],

    // Rendered scan (live-edit:scan --url=): renders the page in headless
    // Chromium so the scanner sees the real DOM and every computed background
    // (class/stylesheet, not just inline). Needs Playwright in the host project
    // (npx playwright install chromium); point `node` at the binary off PATH.
    'scan' => [
        'node' => env('LIVE_EDIT_NODE', 'node'),
    ],

    // Storage for uploaded images.
    'disk' => 'public',
    'directory' => 'live-edit',

    // Invoked after every successful write (e.g. to bust a content cache).
    // 'after_save' => [App\Support\SiteContent::class, 'flush'],
    'after_save' => null,
];
