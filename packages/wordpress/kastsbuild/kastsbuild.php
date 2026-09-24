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

if (! defined('ABSPATH')) {
    exit;
}

define('KASTSBUILD_PATH', plugin_dir_path(__FILE__));
define('KASTSBUILD_URL', plugin_dir_url(__FILE__));

$autoload = KASTSBUILD_PATH.'vendor/autoload.php';

if (! is_file($autoload)) {
    add_action('admin_notices', function () {
        echo '<div class="notice notice-error"><p><strong>KastsBuild:</strong> dependencies are missing. Run <code>composer install</code> in the plugin directory.</p></div>';
    });

    return;
}

require $autoload;

require KASTSBUILD_PATH.'includes/Settings.php';
require KASTSBUILD_PATH.'includes/Api.php';
require KASTSBUILD_PATH.'includes/Session.php';
require KASTSBUILD_PATH.'includes/Frontend.php';

add_action('plugins_loaded', function () {
    KastsBuild\Settings::boot();
    KastsBuild\Frontend::boot();
});

register_deactivation_hook(__FILE__, function () {
    // Cached pages carry editing markup. Left behind after the plugin is
    // switched off, visitors would be served attributes for an editor that is
    // no longer there.
    KastsBuild\Frontend::forgetCache();
});
