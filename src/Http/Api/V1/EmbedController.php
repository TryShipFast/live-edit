<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Symfony\Component\HttpFoundation\Response;

/**
 * Serves the editor's own files, so a customer never copies one.
 *
 * Four files copied by hand into a site is a version nobody can update,
 * multiplied by every customer — and the first release after that is a support
 * request from all of them at once. Served from here, a customer pastes one
 * line and stops thinking about it.
 */
class EmbedController
{
    /**
     * The files that may be asked for.
     *
     * An allow-list rather than a path: this endpoint takes a name from the
     * URL, and anything that turns a URL into a file path without a list is
     * one traversal away from serving whatever it can read.
     */
    private const FILES = [
        'embed.js' => 'boot.js',
        'content.js' => 'content.js',
        'session.js' => 'session.js',
        'live-edit.js' => 'live-edit.js',
        'chrome.js' => 'chrome.js',
        'support.js' => 'support.js',
    ];

    public function __invoke(string $file): Response
    {
        $name = self::FILES[$file] ?? null;

        if ($name === null) {
            return response('Not found', 404);
        }

        $path = __DIR__.'/../../../../resources/js/'.$name;

        if (! is_file($path)) {
            return response('Not found', 404);
        }

        return response()->file($path, [
            'Content-Type' => 'text/javascript; charset=utf-8',
            // A browser fetching a module from another origin will not run it
            // without this, and the failure reads as an ordinary script error.
            'Access-Control-Allow-Origin' => '*',
            // Held for an hour rather than forever: this is the one thing a
            // customer cannot re-deploy themselves, so a fix has to be able to
            // reach them without anybody being asked to do anything.
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
