<?php

namespace KastsBuild;

/**
 * A video from YouTube or Vimeo, and a map to an address, on a WordPress page.
 *
 * Their markup is the same on every adapter (the engine's resources/js/embeds.js): a cover that links to the video,
 * a frame a map is drawn in. What plays the video on a press, and draws the map from its address, is one small script
 * the service serves (kit-embeds.js). It is added to a page that holds one, for every visitor, and to no other page;
 * the page still shows the cover, the title and Get directions without it.
 */
final class Embeds
{
    public static function addedTo(string $html, ?string $host): string
    {
        if ($host === null || $host === ''
            || ! preg_match('/\sdata-kit-(video|map)[\s>=]/', $html)
            || preg_match('/<script\b[^>]*kit-embeds\.js/i', $html)) {
            return $html;
        }

        $tag = '<script type="module" src="'.esc_url(rtrim($host, '/').'/live-edit/assets/kit-embeds.js').'" data-kit-embeds></script>';
        $at = strripos($html, '</body>');

        return $at === false ? $html.$tag : substr($html, 0, $at).$tag.substr($html, $at);
    }
}
