<?php

namespace ShipFast\LiveEdit\Support;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use ShipFast\LiveEdit\LiveEdit;
use ZipArchive;

/**
 * The WordPress plugin, zipped from source on the way out.
 *
 * Built rather than stored. A checked-in zip is a copy, and a copy goes stale
 * the first time anybody edits the source - which is the failure this codebase
 * keeps having, most recently as a console running an engine nine releases old
 * while everybody believed the fixes had shipped. Zipping costs milliseconds
 * and is always current.
 *
 * Lives in the engine rather than in the console because two things now hand
 * this file out: the console, for somebody signed in who wants to install it,
 * and the API, for a WordPress site updating itself. Two copies of the zipping
 * would be two things to keep in step, and the one that fell behind would be
 * the one nobody was watching.
 */
final class PluginArchive
{
    /**
     * The folder inside the zip, which is the plugin's identity to WordPress.
     *
     * Deliberately not renamed with the product. WordPress installs a plugin
     * under the folder name in the zip and decides what is already installed
     * by the same name, so changing it would land beside an existing install
     * as a second, separate plugin rather than updating it - the site would
     * run both, with two of everything. The options and tables are named after
     * it too.
     */
    public const SLUG = 'kastsbuild';

    /** What the customer's browser calls the file they just downloaded. */
    public const DOWNLOAD = 'shipfast-live-edit';

    /** Where the plugin's source lives, whichever way this package was installed. */
    public static function source(): string
    {
        return dirname(__DIR__, 2).'/packages/wordpress/'.self::SLUG;
    }

    public static function available(): bool
    {
        return class_exists(ZipArchive::class) && is_dir(self::source());
    }

    /**
     * The version WordPress will compare against what it has installed.
     *
     * Read from the plugin's own header rather than held separately, because
     * the header is what WordPress reads on the other side. Two numbers that
     * have to agree is one number that can be wrong, and this one was: the
     * header sat at 0.12.0 through nine engine releases.
     */
    public static function version(): string
    {
        return self::header('Version') ?? LiveEdit::VERSION;
    }

    public static function requiresPhp(): ?string
    {
        return self::header('Requires PHP');
    }

    /** One field out of the plugin header block. */
    private static function header(string $field): ?string
    {
        $file = self::source().'/'.self::SLUG.'.php';

        if (! is_readable($file)) {
            return null;
        }

        // The header is in the first comment block; WordPress itself reads
        // only the first 8kB and there is no reason to read more.
        $top = (string) file_get_contents($file, false, null, 0, 8192);

        return preg_match('/^[ \t\/*#@]*'.preg_quote($field, '/').':\s*(.+)$/mi', $top, $found)
            ? trim($found[1])
            : null;
    }

    /**
     * Write the archive to a temporary file and return its path.
     *
     * The caller deletes it after sending. Nothing is cached: the file is
     * small, the work is trivial, and a cache here is another copy that can be
     * wrong about what the current plugin is.
     */
    public static function build(): string
    {
        throw_unless(class_exists(ZipArchive::class), new RuntimeException('Zip support is not available on this server.'));
        throw_unless(is_dir(self::source()), new RuntimeException('The plugin source is not present in this installation.'));

        $file = tempnam(sys_get_temp_dir(), 'live-edit-plugin').'.zip';
        $zip = new ZipArchive;

        throw_unless(
            $zip->open($file, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true,
            new RuntimeException('Could not build the plugin download.')
        );

        /*
         * Everything under one folder, because WordPress installs the folder
         * and a flat zip lands as a plugin with no name.
         *
         * No engine and no vendor tree. The plugin used to carry the whole of
         * it - seventeen hundred files - because it marked pages up itself.
         * That copy froze at whatever version a customer installed while the
         * editor runtime beside it was fetched fresh on every page view: one
         * product moving at two speeds, with the slow half deciding what was
         * editable. The plugin now posts its page to /prepare and serves what
         * comes back, so there is nothing in here to go stale.
         */
        $root = self::source();
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($files as $path) {
            if (! $path->isFile()) {
                continue;
            }

            $zip->addFile(
                $path->getPathname(),
                self::SLUG.'/'.ltrim(str_replace($root, '', $path->getPathname()), '/\\')
            );
        }

        $zip->close();

        return $file;
    }
}
