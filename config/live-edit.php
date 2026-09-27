<?php

use App\Models\Setting;
use ShipFast\LiveEdit\Models\LiveEditSetting;

/*
 * ShipFast live-edit CMS — example configuration.
 *
 * Publish this file (`php artisan vendor:publish --tag=live-edit-config`) and
 * describe your own site's editable content. Everything the runtime does is
 * driven from here; nothing in the package is project-specific.
 */
return [

    /*
     * The Eloquent model backing key/value settings (must have key + value).
     *
     * The host's own model where it has one, because a site that already
     * stores settings should keep storing them in the same place — and
     * tokreamsblue, the first install, does exactly that.
     *
     * Falling back to the package's own table rather than insisting on
     * App\Models\Setting, which a fresh Laravel application does not have:
     * insisting produced a site that tagged, opened the drawer, accepted
     * typing and then had nowhere to put the words, with the failure showing
     * up two steps later as "my edit vanished on reload".
     */
    'setting_model' => class_exists(Setting::class) ? Setting::class : LiveEditSetting::class,

    /*
     * The theme folder under resources/themes to serve, and the view holding
     * the editor's own markup. Set 'theme' to null to serve nothing and route
     * pages yourself.
     */
    /*
     * Hold edits back until someone publishes them. Off keeps the original
     * behaviour, where every change is live the moment it saves.
     */
    'publishing' => env('LIVE_EDIT_PUBLISHING', false),

    /*
     * Where published snapshots are written. A local disk today; point it at S3
     * behind a CDN and nothing else changes.
     */
    'snapshot_disk' => env('LIVE_EDIT_SNAPSHOT_DISK'),
    'snapshot_directory' => 'live-edit/content',

    /*
     * Where published content can be fetched from by something that is not
     * this application. A CDN in front of the bucket in production; left empty,
     * the disk's own URL is used where it has one.
     */
    'snapshot_url' => env('LIVE_EDIT_SNAPSHOT_URL'),

    /*
     * Signing for a distribution that is not public. Published content usually
     * is — it is a website — so these are optional, and without them a plain
     * URL is returned rather than failing.
     */
    'cloudfront' => [
        'key_pair_id' => env('CLOUDFRONT_KEY_PAIR_ID'),
        'private_key' => env('CLOUDFRONT_PRIVATE_KEY'),
        'private_key_path' => env('CLOUDFRONT_PRIVATE_KEY_PATH'),
    ],

    'theme' => env('LIVE_EDIT_THEME'),
    'chrome_view' => 'live-edit-chrome',

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
    /*
     * Defaults to whatever auto-tagging is set to, and that pairing matters.
     *
     * These are two switches over one idea — finding the editable parts of a
     * page, and being willing to STORE what comes back from them — and having
     * them independent produces a state with no honest use: a page derives a
     * key for every paragraph, the drawer opens on any of them, and every
     * save is refused with "Unknown setting". It looks like a broken product
     * rather than a missing line of config.
     *
     * Set it explicitly to part ways: auto_keys on its own is for a theme
     * tagged ahead of time by `live-edit:scan --apply --auto`, which needs
     * the store without the per-request tagging.
     */
    'auto_keys' => env('LIVE_EDIT_AUTO_KEYS', env('LIVE_EDIT_AUTO_TAG', false)),

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

        // Making a picture rather than writing a sentence. Its own endpoint
        // and model, because they are a different thing on every provider and
        // somebody may well want a cheap model for words and a good one for
        // images.
        'image_endpoint' => env('LIVE_EDIT_AI_IMAGE_ENDPOINT', 'https://api.openai.com/v1/images/generations'),
        'image_model' => env('LIVE_EDIT_AI_IMAGE_MODEL', 'gpt-image-1'),
        'image_timeout' => 90,
    ],

    /*
     * Free photographs, from Unsplash.
     *
     * Proxied rather than called from the page: the key would otherwise be
     * printed into every site we are installed on, where anybody could take it
     * and spend somebody else's quota.
     *
     * Unsplash's terms require that using a photo is reported back to them, so
     * the photographer is credited with the download. That is not optional and
     * it is not a formality — it is how the people whose work this is get
     * counted.
     */
    'photos' => [
        'enabled' => env('LIVE_EDIT_PHOTOS', true),

        /*
         * Which library to search.
         *
         * "auto" is the useful answer and the default: Unsplash when somebody
         * has supplied a key, Openverse when nobody has. Openverse needs no
         * key at all, which matters more than it sounds — otherwise every
         * customer has to register an application with a photo library before
         * they can put a picture on their own website, and most of them will
         * simply not have a picture instead.
         */
        'provider' => env('LIVE_EDIT_PHOTOS_PROVIDER', 'auto'),

        'unsplash' => [
            'endpoint' => env('LIVE_EDIT_PHOTOS_ENDPOINT', 'https://api.unsplash.com'),
            'access_key' => env('UNSPLASH_ACCESS_KEY'),
        ],

        'openverse' => [
            'endpoint' => env('LIVE_EDIT_OPENVERSE_ENDPOINT', 'https://api.openverse.org'),
        ],

        // Kept where they were so anything already reading them still works.
        'endpoint' => env('LIVE_EDIT_PHOTOS_ENDPOINT', 'https://api.unsplash.com'),
        'access_key' => env('UNSPLASH_ACCESS_KEY'),

        'timeout' => 15,
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

    // Where uploaded images are served from. Point this at a CloudFront
    // distribution in front of the bucket and pictures come from an edge near
    // the visitor rather than from one region — and never from this
    // application. Empty means the disk answers for itself.
    'media_url' => env('LIVE_EDIT_MEDIA_URL', ''),

    // The largest upload accepted, in kilobytes.
    'max_upload_kb' => (int) env('LIVE_EDIT_MAX_UPLOAD_KB', 8192),

    // Invoked after every successful write (e.g. to bust a content cache).
    // 'after_save' => [App\Support\SiteContent::class, 'flush'],
    'after_save' => null,

    // ------------------------------------------------------------------
    // HTTP API
    //
    // How a site that is not this application reads and writes content: a
    // WordPress plugin, a static build, a React front end. Off until it is
    // turned on, because an install that does not need it should not expose it.
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    // Using a content service rather than this application's own database.
    //
    // Installing the package and being connected to a site are different
    // things. Left empty, this application is its own store and @liveEdit
    // renders nothing — which is the right answer for a bespoke site holding
    // its content in its own tables. Filled in, the page talks to the service
    // exactly as a folder of static HTML does.
    //
    // No key here on purpose: the per-site install script carries the site's
    // current publishable key, so rotating one does not mean a deploy.
    // ------------------------------------------------------------------
    'cloud' => [
        'host' => env('LIVE_EDIT_CLOUD_HOST'),
        'site' => env('LIVE_EDIT_CLOUD_SITE'),
    ],

    /*
     * The licence this installation edits under.
     *
     * Only consulted when a key is set: an install that never configures one
     * behaves exactly as it always did, so adding this release cannot switch
     * anybody's editor off. Defaults to the cloud host and site because a
     * site that talks to the service already named both.
     */
    /*
     * Who may edit, for a host that has no opinion of its own.
     *
     * Read by the gate this package defines when the host has not defined
     * one, so naming an address here is all a brochure site needs to do — no
     * service provider, no closure, no role invented to answer a question
     * about two people.
     *
     * A host with real roles should define the `live-edit` gate itself; this
     * is then ignored entirely.
     *
     * Empty means nobody, which is the only safe starting point: defaulting
     * to any signed-in user would hand the editor to every customer of a site
     * with public registration.
     */
    'editors' => env('LIVE_EDIT_EDITORS', ''),

    /*
     * Where the person editing proves who they are.
     *
     * Three integrations, and they do not want the same answer:
     *
     *   'host'    the application's own accounts. What Laravel and WordPress
     *             already have, and the reason neither needs us to duplicate
     *             a users table. An address still has to be listed as an
     *             editor of the site, so being signed in is not by itself
     *             permission to rewrite the marketing copy.
     *
     *   'service' the control plane. For a site with no accounts to borrow:
     *             static HTML, React, anything generated. Also the honest
     *             answer for a brochure site whose users table exists because
     *             the framework made one and has nobody in it.
     *
     *   'either'  whichever the person arrives with, which is the default
     *             because it is the only value that cannot lock somebody out
     *             of a site that was working yesterday.
     *
     * Ignored entirely by a host that defines the `live-edit` gate itself.
     * An application that knows about roles can say this far better than a
     * string can.
     */
    'sign_in' => env('LIVE_EDIT_SIGN_IN', 'either'),

    /*
     * Find the editable parts of a page instead of being told them.
     *
     * On by default, which is safe because of what gates it. A response is
     * only ever rewritten for somebody the `live-edit` gate allows, and that
     * gate refuses everybody until editors are named — so an install that
     * has not been told who may edit rewrites nothing for anybody, and a
     * visitor's page is never touched on any install.
     *
     * It was off, on the reasoning that a package which quietly reformats a
     * host's pages on upgrade would be indefensible. That reasoning was
     * right about visitors and wrong about the default: the protection is
     * the gate, and leaving this off as well only meant a correctly
     * configured site still showed nothing, with no clue which of the two
     * switches was missing.
     *
     * The trade is real and worth knowing before choosing. A named key
     * survives its wording changing; a derived one is a signature OF that
     * wording, so a developer rewriting the sentence in the template orphans
     * the client's edit. Name the handful that matter, let the rest be found.
     */
    'auto_tag' => env('LIVE_EDIT_AUTO_TAG', true),

    'licence' => [
        /*
         * The three values a customer is given.
         *
         *   SITE_ID     which site is asking
         *   APP_KEY     public, printed into the page
         *   SECRET_KEY  server side only, and only where one is needed
         *
         * The public one used to be called LIVE_EDIT_KEY, which reads like a
         * secret and is not one: it is in the source of every page it edits.
         * A name that implies otherwise is how a customer ends up treating
         * the wrong one carelessly, or the right one as though it were
         * dangerous.
         *
         * Every older spelling still works. The names below are read in order
         * and the first that is set wins, so nothing already deployed has to
         * be edited to take an upgrade. Whichever old name was used is
         * recorded so the application can say so once, rather than a customer
         * discovering it when support for it is finally removed.
         */
        'host' => env('LIVE_EDIT_HOST', env('LIVE_EDIT_LICENCE_HOST', env('LIVE_EDIT_CLOUD_HOST', 'https://live.shipfast.com'))),
        'site' => env('LIVE_EDIT_SITE_ID', env('LIVE_EDIT_SITE', env('LIVE_EDIT_LICENCE_SITE', env('LIVE_EDIT_CLOUD_SITE')))),
        'key' => env('LIVE_EDIT_APP_KEY', env('LIVE_EDIT_KEY', env('LIVE_EDIT_LICENCE_KEY'))),

        /*
         * Only a site that talks to us from its own server needs this: to let
         * its people in, or to publish. A Laravel or WordPress install that
         * keeps its own content never calls the content API and never needs
         * one, which is why it has no default and is not in the instructions.
         */
        'secret' => env('LIVE_EDIT_SECRET_KEY', env('LIVE_EDIT_LICENCE_SECRET')),

        // A day. Long enough that the service is asked once per site per day
        // rather than once per page view, short enough that a lapse takes
        // effect the next day without anybody clearing a cache.
        'ttl' => (int) env('LIVE_EDIT_LICENCE_TTL', 86400),

        /*
         * Which retired names this installation is still using.
         *
         * Worked out here rather than at boot because env() stops answering
         * once a host caches its config, and a deprecation notice that goes
         * quiet on exactly the installations that run cached config would
         * warn only the people who did not need warning.
         *
         * @var array<int, string>
         */
        'deprecated_env' => array_values(array_filter([
            env('LIVE_EDIT_SITE') !== null && env('LIVE_EDIT_SITE_ID') === null ? 'LIVE_EDIT_SITE' : null,
            env('LIVE_EDIT_KEY') !== null && env('LIVE_EDIT_APP_KEY') === null ? 'LIVE_EDIT_KEY' : null,
            env('LIVE_EDIT_LICENCE_SITE') !== null ? 'LIVE_EDIT_LICENCE_SITE' : null,
            env('LIVE_EDIT_LICENCE_KEY') !== null ? 'LIVE_EDIT_LICENCE_KEY' : null,
            env('LIVE_EDIT_CLOUD_SITE') !== null ? 'LIVE_EDIT_CLOUD_SITE' : null,
            env('LIVE_EDIT_CLOUD_HOST') !== null ? 'LIVE_EDIT_CLOUD_HOST' : null,
        ])),
    ],

    'api' => [
        'enabled' => env('LIVE_EDIT_API', false),

        'prefix' => env('LIVE_EDIT_API_PREFIX', 'api/live-edit/v1'),

        // Worth knowing: Laravel ships config/cors.php with paths ['api/*']
        // and allowed_origins ['*'], which matches this prefix on a default
        // install and will overwrite the per-site header with a wildcard. It
        // does not open a hole — a call from an unlisted origin is still
        // refused by the key check, and there is a test for exactly that — but
        // keep this prefix out of cors.paths so the header says what it means.

        // How long a browser edit session lasts before their server has to
        // vouch for the person again. Short on purpose: this is the only key
        // that can write and the only one a page ever holds.
        // How long an edit session lasts, and how far it slides while
        // somebody is actually working. Thirty minutes was a security token's
        // lifetime rather than a person's: being thrown out mid-sentence is a
        // worse outcome than a key that lives a few hours while in use.
        'session_ttl' => (int) env('LIVE_EDIT_API_SESSION_TTL', 7200),

        // However long it slides for, a session dies this long after it was
        // issued — so a key taken out of a page cannot be kept alive forever
        // by using it.
        'session_max_life' => (int) env('LIVE_EDIT_API_SESSION_MAX_LIFE', 86400),

        // Creating sites and minting their keys. A different credential from
        // anything a site holds, because it is a different kind of power.
        // Empty means the provisioning endpoints are not there at all, which
        // is right for an installation that serves one site.
        'admin_token' => env('LIVE_EDIT_ADMIN_TOKEN', ''),

        // How long a sign-in link stays alive. Short: it is a credential
        // sitting in an inbox.
        'sign_in_ttl' => (int) env('LIVE_EDIT_SIGN_IN_TTL', 15),

        // Two windows per bucket. The short one is sized for a person editing
        // in bursts; the long one for what a site really consumes in an hour.
        // A caller passes both or waits.
        'throttle' => [
            'read' => [
                'burst' => ['max' => 120, 'seconds' => 60],
                'sustained' => ['max' => 3000, 'seconds' => 3600],
            ],
            'write' => [
                'burst' => ['max' => 40, 'seconds' => 60],
                'sustained' => ['max' => 600, 'seconds' => 3600],
            ],
            // Minting a session is a server-to-server act that should happen
            // once per editor, not once per keystroke.
            'session' => [
                'burst' => ['max' => 10, 'seconds' => 60],
                'sustained' => ['max' => 120, 'seconds' => 3600],
            ],
            'publish' => [
                'burst' => ['max' => 6, 'seconds' => 60],
                'sustained' => ['max' => 60, 'seconds' => 3600],
            ],
            // An upload costs bandwidth, storage and CPU rather than a row, so
            // it is counted far more tightly than a text save.
            'upload' => [
                'burst' => ['max' => 12, 'seconds' => 60],
                'sustained' => ['max' => 200, 'seconds' => 3600],
            ],
            // Provisioning is rare and expensive to get wrong; a flood of it is
            // someone guessing.
            'provision' => [
                'burst' => ['max' => 10, 'seconds' => 60],
                'sustained' => ['max' => 100, 'seconds' => 3600],
            ],
            // Asking for links is the one thing here that sends email, so it
            // is the one thing worth being ungenerous about.
            // Parsing a whole document is the most expensive thing a page can
            // ask for, and a correctly behaving one asks once per version.
            'tag' => [
                'burst' => ['max' => 20, 'seconds' => 60],
                'sustained' => ['max' => 300, 'seconds' => 3600],
            ],
            'sign_in' => [
                'burst' => ['max' => 5, 'seconds' => 60],
                'sustained' => ['max' => 30, 'seconds' => 3600],
            ],
        ],

        'cache' => [
            // The pointer is the only thing that changes in place, so it is the
            // only thing worth re-reading often.
            'pointer_seconds' => (int) env('LIVE_EDIT_API_POINTER_TTL', 30),
            // A version never changes once written. It can be held forever, and
            // saying so is what keeps a busy site off this application.
            'version_seconds' => (int) env('LIVE_EDIT_API_VERSION_TTL', 31536000),
            // How long a cache may keep serving a stale answer while it fetches
            // a fresh one. Visitors see the old content for a moment instead of
            // waiting, and a thundering herd becomes one request.
            'stale_while_revalidate' => (int) env('LIVE_EDIT_API_SWR', 86400),
        ],
    ],

];
