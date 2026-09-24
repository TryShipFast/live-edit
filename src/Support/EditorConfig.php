<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;

/**
 * What the editor needs to know about the site it is running on.
 *
 * This was written into the package's own theme controller, which meant only a
 * site served by the package could have it — a bespoke application rendering
 * its own Blade got drafts with no way to publish them, and an editor who
 * could not see their own unpublished work. It belongs somewhere any host can
 * reach.
 */
class EditorConfig
{
    /** A script tag declaring the publishing state, or '' when not applicable. */
    public static function publishingScript(): string
    {
        if (! DraftStore::enabled() || ! Gate::allows('live-edit')) {
            return '';
        }

        $config = [
            'pending' => DraftStore::pending(),
            'previewUrl' => URL::temporarySignedRoute('live-edit.preview', now()->addDays(7)),
        ];

        return '<script>window.liveEditPublishing = '.json_encode($config, JSON_HEX_TAG | JSON_HEX_AMP).';</script>';
    }

    /**
     * Lay unpublished work over published values, for whoever may see it.
     *
     * A host reading its own content calls this: without it an edit is held
     * back from the person who just made it, which reads as the editor having
     * lost their words.
     *
     * @param  array<string, string>  $settings
     * @return array<string, string>
     */
    public static function withDrafts(array $settings): array
    {
        return DraftStore::visibleToViewer() ? array_merge($settings, DraftStore::settings()) : $settings;
    }

    /**
     * @param  array<string, array<string, string>>  $styles
     * @return array<string, array<string, string>>
     */
    public static function stylesWithDrafts(array $styles): array
    {
        return DraftStore::visibleToViewer() ? array_merge($styles, DraftStore::styles()) : $styles;
    }
}
