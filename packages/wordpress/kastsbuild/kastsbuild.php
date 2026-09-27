<?php

/**
 * Plugin Name: KastsBuild Live Edit
 * Description: Edit the words and pictures on this site in place, without a dashboard.
 * Version: 0.1.0
 * Requires PHP: 8.1
 */

/**
 * WordPress already has an editor, so it is worth saying what this is for.
 *
 * A theme's own copy — a hero headline, a strapline, the words on a button —
 * lives in template files rather than in a post. Changing it means editing PHP,
 * which is why agencies get asked to change a sentence. This makes that text
 * editable in the page itself, for the person whose site it is.
 *
 * It deliberately does not touch posts, pages or any other content WordPress
 * already manages. That is theirs.
 */
use KastsBuild\Builder;
use KastsBuild\Credits;
use KastsBuild\Frontend;
use KastsBuild\Licence;
use KastsBuild\PlaneSession;
use KastsBuild\Publishing;
use KastsBuild\Settings;

if (! defined('ABSPATH')) {
    exit;
}

define('KASTSBUILD_FILE', __FILE__);
define('KASTSBUILD_PATH', plugin_dir_path(__FILE__));
define('KASTSBUILD_URL', plugin_dir_url(__FILE__));

/*
 * This plugin has no dependencies, and that is the point.
 *
 * It used to carry the whole engine — seventeen hundred files — because it did
 * the marking up itself. That copy was frozen at whatever version happened to
 * be installed, while the editor runtime beside it was fetched from the
 * service on every page view. The scanner now stays on the service too, so
 * what is left here is a few files of WordPress plumbing: buffer the page,
 * send it, serve what comes back.
 *
 * The autoload file is still loaded if one is present, so an installation that
 * has one from an earlier version keeps working, but nothing requires it and a
 * missing one is no longer a reason to refuse to start.
 */
if (is_file(KASTSBUILD_PATH.'vendor/autoload.php')) {
    require KASTSBUILD_PATH.'vendor/autoload.php';
}

require KASTSBUILD_PATH.'includes/Settings.php';
require KASTSBUILD_PATH.'includes/Api.php';
require KASTSBUILD_PATH.'includes/Licence.php';
require KASTSBUILD_PATH.'includes/Session.php';
require KASTSBUILD_PATH.'includes/PlaneSession.php';
require KASTSBUILD_PATH.'includes/Frontend.php';
require KASTSBUILD_PATH.'includes/Publishing.php';
require KASTSBUILD_PATH.'includes/Builder.php';
require KASTSBUILD_PATH.'includes/Credits.php';

add_action('plugins_loaded', function () {
    Settings::boot();
    Frontend::boot();
    Publishing::boot();
    Builder::boot();
    // Signing in with the service, for a site whose editors have no
    // WordPress account. Booted always: it does nothing until somebody
    // arrives at the door, and the setting decides whether it opens.
    PlaneSession::boot();

    /*
     * Tell whoever runs this site when editing has stopped, and why.
     *
     * In the admin, because that is where somebody goes to find out why the
     * toolbar has gone, and because the alternative is a client discovering
     * it by trying to work and failing.
     */
    add_action('admin_notices', function () {
        if (! current_user_can('manage_options') || Licence::permits()) {
            return;
        }

        printf(
            '<div class="notice notice-error"><p><strong>%s</strong> %s</p></div>',
            esc_html__('Live editing is switched off.', 'kastsbuild'),
            esc_html(Licence::message())
        );
    });

    // So somebody who has just pasted a new key does not wait a day to find
    // out whether it worked.
    add_action('update_option_kastsbuild_settings', [Licence::class, 'forget']);
    Credits::boot();
});

register_deactivation_hook(__FILE__, function () {
    // Cached pages carry editing markup. Left behind after the plugin is
    // switched off, visitors would be served attributes for an editor that is
    // no longer there.
    Frontend::forgetCache();
});
