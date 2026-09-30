<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Http\Api\ApiContext;
use ShipFast\LiveEdit\Support\PluginArchive;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * How a WordPress install learns there is a newer plugin, and gets it.
 *
 * Built because there was no way. The plugin had no update checker of any
 * kind, so a site that installed it in August was still running August's copy
 * in September and would have been running it next year: WordPress only offers
 * an update when something tells it one exists, and nothing did. Every fix
 * released in that time reached a WordPress customer only if they happened to
 * return to the console, download the zip again and upload it by hand, having
 * never been told there was a reason to.
 *
 * That is the worst shape a bug fix can be in - released, believed shipped,
 * and sitting on a shelf. The 422 that stopped every edit inside a list would
 * have been in exactly that state for every WordPress site we have.
 *
 * Both endpoints take a read key. The version is barely a secret and the
 * download is the same file the console hands out to anybody signed in; what
 * the key buys is knowing which site is asking, so an install that has been
 * cut off stops being served.
 */
class PluginController
{
    /**
     * What the newest plugin is, in the shape WordPress's updater wants.
     *
     * `version` is the only field that decides anything: WordPress compares it
     * with the header in the installed file and offers an update when this one
     * is greater. The rest is what it shows the person before they press it.
     */
    public function show(Request $request): JsonResponse
    {
        $site = ApiContext::site($request);

        return response()->json([
            'version' => PluginArchive::version(),
            'requires_php' => PluginArchive::requiresPhp(),
            'slug' => PluginArchive::SLUG,
            // Absolute, because WordPress fetches it from the site's own
            // server rather than from the browser that asked.
            'download_url' => route('live-edit.api.plugin.download', ['site' => $site->slug]),
        ])->withHeaders([
            // Checked on WordPress's schedule, not a person's, so a short
            // cache saves a great many identical questions without anybody
            // waiting longer for an answer.
            'Cache-Control' => 'public, max-age=900',
        ]);
    }

    /** The plugin itself, zipped on the way out. */
    public function download(Request $request): BinaryFileResponse
    {
        ApiContext::site($request);

        return response()
            ->download(PluginArchive::build(), PluginArchive::DOWNLOAD.'.zip')
            ->deleteFileAfterSend();
    }
}
