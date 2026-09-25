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
use KastsBuild\Frontend;
use KastsBuild\Publishing;
use KastsBuild\Settings;

if (! defined('ABSPATH')) {
    exit;
}

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
require KASTSBUILD_PATH.'includes/Session.php';
require KASTSBUILD_PATH.'includes/Frontend.php';
require KASTSBUILD_PATH.'includes/Publishing.php';

add_action('plugins_loaded', function () {
    Settings::boot();
    Frontend::boot();
    Publishing::boot();
});

register_deactivation_hook(__FILE__, function () {
    // Cached pages carry editing markup. Left behind after the plugin is
    // switched off, visitors would be served attributes for an editor that is
    // no longer there.
    Frontend::forgetCache();
});
