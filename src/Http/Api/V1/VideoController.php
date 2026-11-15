<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Application\Api\LookUpAVideo;
use ShipFast\LiveEdit\Http\Api\ApiContext;

/**
 * A video's title and cover, read from the YouTube or Vimeo link an owner pasted into a video's panel or the add window
 * (LIVE-EDIT-STRUCTURE.md, "A video from YouTube or Vimeo").
 *
 * A write key, like the free photos beside it: it fetches and stores a picture as the site's own. Answered for every
 * adapter from here (the content API), and for a Laravel website keeping its own content from its own route, where
 * there is no site of ours to store a cover for (the frame then shows the title on the template's colours).
 */
class VideoController
{
    public function look(Request $request, LookUpAVideo $look): JsonResponse
    {
        return $this->answer($request, $look, ApiContext::has($request) ? ApiContext::site($request) : null);
    }

    /** The Laravel adapter's own route (routes/live-edit.php): the same look-up, with no cover stored. */
    public function lookHere(Request $request, LookUpAVideo $look): JsonResponse
    {
        return $this->answer($request, $look, null);
    }

    private function answer(Request $request, LookUpAVideo $look, $site): JsonResponse
    {
        $link = trim((string) $request->query('url', ''));
        $video = $link === '' || mb_strlen($link) > 2000 ? null : $look($site, $link);

        if ($video === null) {
            return response()->json([
                'message' => LookUpAVideo::NOT_A_VIDEO,
                'error' => ['type' => 'not_a_video', 'message' => LookUpAVideo::NOT_A_VIDEO],
            ], 422)->withHeaders(['Cache-Control' => 'no-store']);
        }

        return response()->json(['video' => $video])->withHeaders(['Cache-Control' => 'no-store, private']);
    }
}
