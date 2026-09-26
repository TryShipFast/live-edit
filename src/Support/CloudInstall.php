<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Gate;

/**
 * The one line a Laravel application adds to become editable.
 *
 * Installing the package is not the same as being connected to a site, and
 * conflating the two is how a developer ends up with everything in place and
 * nothing working. There are two quite different ways to use this:
 *
 *   as its own store — the application holds the content in its own database
 *   and renders it through the package's own Blade helpers. Nothing here is
 *   involved and no key exists.
 *
 *   as a client — the content lives in the content service and the page talks
 *   to it, exactly as a folder of static HTML does. That needs a site and a
 *   key, and this is what points the page at them.
 *
 * So @liveEdit renders the same install line a static site pastes by hand. A
 * Laravel developer should not have to write a script tag and copy a key into
 * it: they have a config file, and this reads it.
 */
class CloudInstall
{
    /**
     * The script tag, or '' when this application is not a client of a content
     * service.
     *
     * Silent rather than loud when unconfigured: an application using the
     * package as its own store renders this same layout and must not have a
     * broken tag — or a warning about a key it is right not to have — printed
     * into every page.
     */
    public static function script(): string
    {
        $site = trim((string) config('live-edit.cloud.site'));
        $host = rtrim(trim((string) config('live-edit.cloud.host')), '/');

        /*
         * No cloud site configured means this application installed the
         * package itself, so the editor is served from here.
         *
         * Without this, @liveEdit printed nothing on a self-hosted install and
         * the only way to get an editor was to import the runtime through the
         * site's own asset build — which compiles the engine into every site,
         * so an engine fix then needs every site rebuilt rather than merely
         * updated. One directive, right either way.
         */
        if ($site === '' || $host === '') {
            /*
             * And only to somebody who may edit.
             *
             * A visitor was being sent the whole editor, which then found no
             * editable page and did nothing. Three things wrong with that: it
             * is a download nobody asked for, on a page whose speed is the
             * client's business rather than ours; it tells anybody reading the
             * source that this site is editable and where from; and it is the
             * same gate the rest of the package already respects, so leaving
             * this one open made the answer depend on which part you asked.
             */
            if (! Gate::allows('live-edit')) {
                return '';
            }

            return '<script src="'.e(url('live-edit/runtime.js')).'" type="module" defer></script>';
        }

        // The per-site install rather than the runtime directly, which is also
        // why no key is configured here: that script carries the site's
        // current publishable key, so rotating one reaches the page without
        // this application being deployed again.
        $src = $host.'/s/'.rawurlencode($site).'.js';

        return '<script src="'.e($src).'" defer></script>';
    }
}
