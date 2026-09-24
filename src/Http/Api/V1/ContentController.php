<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Application\Api\ApplyEdit;
use ShipFast\LiveEdit\Application\Api\PublishSite;
use ShipFast\LiveEdit\Application\Api\ReadPublishedContent;
use ShipFast\LiveEdit\Http\Api\ApiContext;

/**
 * The content endpoints. Thin on purpose: everything worth testing is below.
 */
class ContentController
{
    public function show(Request $request, ReadPublishedContent $read): JsonResponse
    {
        $site = ApiContext::site($request);
        $locale = $this->locale($request);

        $payload = $read($site, $locale);
        $etag = $read->etag($site, $payload);

        // The cheapest response is the one with no body. A client that already
        // has this version gets told so in a few hundred bytes.
        if ($this->alreadyHas($request, $etag)) {
            return response()->json(null, 304)->withHeaders($this->cacheHeaders($etag, $payload['version']));
        }

        return response()->json($payload)->withHeaders($this->cacheHeaders($etag, $payload['version']));
    }

    public function version(Request $request, ReadPublishedContent $read): JsonResponse
    {
        $site = ApiContext::site($request);
        $payload = $read($site, $this->locale($request));

        $seconds = (int) config('live-edit.api.cache.pointer_seconds', 30);

        return response()->json([
            'version' => $payload['version'],
            'locale' => $payload['locale'],
        ])->withHeaders([
            // The pointer is the one thing that moves, so it is the one thing
            // that must not be cached for long.
            'Cache-Control' => "public, max-age={$seconds}, s-maxage={$seconds}",
            'X-Live-Edit-Version' => (string) ($payload['version'] ?? 0),
        ]);
    }

    public function update(Request $request, ApplyEdit $apply): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:200'],
            'value' => ['nullable', 'string', 'max:10000'],
            'locale' => ['nullable', 'string', 'max:10'],
        ]);

        try {
            $result = $apply(
                ApiContext::site($request),
                ApiContext::token($request),
                $validated['key'],
                $validated['value'] ?? '',
                $validated['locale'] ?? null,
            );
        } catch (ValidationException $e) {
            return response()->json([
                'error' => [
                    'type' => 'invalid_request_error',
                    'message' => collect($e->errors())->flatten()->first(),
                    'errors' => $e->errors(),
                ],
            ], 422);
        }

        return response()->json($result);
    }

    public function publish(Request $request, PublishSite $publish): JsonResponse
    {
        return response()->json($publish(ApiContext::site($request)));
    }

    private function locale(Request $request): ?string
    {
        $locale = $request->query('locale');

        return is_string($locale) && $locale !== '' ? mb_substr($locale, 0, 10) : null;
    }

    private function alreadyHas(Request $request, string $etag): bool
    {
        $presented = (string) $request->headers->get('If-None-Match', '');

        // A proxy may send several tags, and may have weakened them.
        foreach (explode(',', $presented) as $candidate) {
            if (ltrim(trim($candidate), 'W/') === $etag) {
                return true;
            }
        }

        return false;
    }

    /** @return array<string, string> */
    private function cacheHeaders(string $etag, ?int $version): array
    {
        $cache = config('live-edit.api.cache', []);
        $maxAge = (int) ($cache['pointer_seconds'] ?? 30);
        $swr = (int) ($cache['stale_while_revalidate'] ?? 86400);

        return [
            'ETag' => $etag,
            // Short max-age with a long stale window: a busy site serves from
            // its cache immediately and refreshes behind the scenes, so a
            // publish lands quickly without every visitor waiting on us.
            'Cache-Control' => "public, max-age={$maxAge}, s-maxage={$maxAge}, stale-while-revalidate={$swr}",
            'X-Live-Edit-Version' => (string) ($version ?? 0),
        ];
    }
}
