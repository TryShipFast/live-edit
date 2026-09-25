<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Application\Api\ApplyEdit;
use ShipFast\LiveEdit\Application\Api\ApplyStyle;
use ShipFast\LiveEdit\Application\Api\ExportMarkup;
use ShipFast\LiveEdit\Application\Api\PrepareMarkup;
use ShipFast\LiveEdit\Application\Api\PublishSite;
use ShipFast\LiveEdit\Application\Api\ReadPublishedContent;
use ShipFast\LiveEdit\Application\Api\TagMarkup;
use ShipFast\LiveEdit\Domain\Content\SiteSnapshot;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Meter;
use ShipFast\LiveEdit\Domain\Site\OverLimit;
use ShipFast\LiveEdit\Http\Api\ApiContext;
use ShipFast\LiveEdit\Models\Version;

/**
 * The content endpoints. Thin on purpose: everything worth testing is below.
 */
class ContentController
{
    public function show(Request $request, ReadPublishedContent $read): JsonResponse
    {
        $site = ApiContext::site($request);
        $locale = $this->locale($request);

        // The editor sees their own unpublished work; a publishable key, which
        // is in the page for everyone, does not.
        $editing = ApiContext::token($request)->can(Ability::Write);

        $payload = $read($site, $locale, $editing);

        if ($editing) {
            // Never cached, by anything. This is one person's unfinished work,
            // and a cache that kept it would serve a half-typed sentence to
            // the next visitor.
            return response()->json($payload)->withHeaders([
                'Cache-Control' => 'no-store, private',
                'X-Live-Edit-Version' => (string) ($payload['version'] ?? 0),
            ]);
        }

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
        $editing = ApiContext::token($request)->can(Ability::Write);
        $payload = $read($site, $this->locale($request), $editing);

        $seconds = (int) config('live-edit.api.cache.pointer_seconds', 30);

        return response()->json([
            'version' => $payload['version'],
            'locale' => $payload['locale'],
            // So an editor can be offered a way to release held work rather
            // than being left to wonder where it went.
            'pending' => $payload['pending'] ?? 0,
            // What a consumer should key a cache on. A version alone is not
            // enough: a site with publishing off changes its words without
            // moving one.
            'fingerprint' => $read->fingerprint($payload),
        ])->withHeaders([
            // The pointer is the one thing that moves, so it is the one thing
            // that must not be cached for long.
            'Cache-Control' => "public, max-age={$seconds}, s-maxage={$seconds}",
            'X-Live-Edit-Version' => (string) ($payload['version'] ?? 0),
        ]);
    }

    public function style(Request $request, ApplyStyle $apply): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:120'],
            'props' => ['present', 'array'],
            'props.*' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $result = $apply(
                ApiContext::site($request),
                ApiContext::token($request),
                $validated['key'],
                $validated['props'],
            );
        } catch (ValidationException $e) {
            return response()->json([
                'error' => [
                    'type' => 'invalid_request_error',
                    'message' => collect($e->errors())->flatten()->first(),
                    'errors' => $e->errors(),
                ],
            ], 422);
        } catch (OverLimit $e) {
            return self::overLimit($e);
        }

        return response()->json($result)->withHeaders(['Cache-Control' => 'no-store']);
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
        } catch (OverLimit $e) {
            return self::overLimit($e);
        }

        return response()->json($result);
    }

    public function publish(Request $request, PublishSite $publish): JsonResponse
    {
        try {
            return response()->json($publish(ApiContext::site($request)));
        } catch (OverLimit $e) {
            return self::overLimit($e);
        }
    }

    /**
     * Nothing is wrong with the request; the account needs attention. 402 says
     * that, and says it differently from "you may not" and "try again later",
     * both of which send a caller looking for a bug that is not there.
     */
    public static function overLimit(OverLimit $e): JsonResponse
    {
        return response()->json([
            'error' => ['type' => 'over_limit', 'message' => $e->getMessage()],
        ], 402);
    }

    /**
     * Where this site's published files can be fetched, and which versions
     * exist.
     *
     * A consumer that is not this application — a CDN, a build, another
     * framework — needs addresses rather than a database.
     */
    public function versions(Request $request, ReadPublishedContent $read): JsonResponse
    {
        $site = ApiContext::site($request);
        $store = new SiteStore($site);
        $snapshot = new SiteSnapshot($store);

        return response()->json([
            'current' => $store->version(),
            'pointer' => $snapshot->url(),
            'versions' => Version::query()
                ->where('site_id', $site->id)
                ->orderByDesc('number')
                ->limit(50)
                ->get()
                ->map(fn (Version $v) => [
                    'number' => $v->number,
                    'changes' => $v->changes,
                    'restored_from' => $v->restored_from,
                    'published_at' => $v->created_at?->toIso8601String(),
                    'url' => $snapshot->url($v->number),
                ])->all(),
        ]);
    }

    /**
     * Put an earlier version back.
     *
     * A secret key, like publishing: this decides what the public sees.
     */
    public function restore(Request $request, ReadPublishedContent $read): JsonResponse
    {
        $validated = $request->validate(['version' => ['required', 'integer', 'min:1']]);

        $changed = (new SiteStore(ApiContext::site($request)))->restore((int) $validated['version']);

        if ($changed === null) {
            return response()->json([
                'error' => ['type' => 'not_found', 'message' => 'There is no such version for this site.'],
            ], 404);
        }

        return response()->json(['restored_from' => (int) $validated['version'], 'changed' => $changed]);
    }

    /**
     * Tell a page which of its own elements are editable.
     *
     * For a site nobody prepared: no build step, no command to run, nothing
     * written to their files. They paste one line and the page asks.
     */
    public function tag(Request $request, TagMarkup $tag): JsonResponse
    {
        $validated = $request->validate([
            'html' => ['required', 'string', 'max:'.TagMarkup::MAX_BYTES],
            'page' => ['nullable', 'string', 'max:200'],
        ]);

        $site = ApiContext::site($request);
        $result = $tag($site, $validated['html'], $validated['page'] ?? '');

        Meter::record($site, Meter::TAG);

        return response()->json($result)->withHeaders([
            // The answer depends on markup the caller sent, so only they can
            // usefully keep it — and they do, against a hash of that markup.
            'Cache-Control' => 'private, max-age=600',
        ]);
    }

    /**
     * A page a server just rendered, handed back ready to be edited.
     *
     * For a host that cannot run the scanner itself. The WordPress plugin used
     * to carry a copy of the engine to do this locally, which meant the half
     * of the product that decides what is editable only moved when somebody
     * pressed update in wp-admin, while the editor runtime beside it updated
     * on every page view.
     *
     * One call rather than two: the host used to tag, then fetch content, then
     * apply it. Whether unpublished work is included follows the token, the
     * same way the content endpoint decides it.
     */
    public function prepare(Request $request, PrepareMarkup $prepare): JsonResponse
    {
        $validated = $request->validate([
            'html' => ['required', 'string', 'max:'.PrepareMarkup::MAX_BYTES],
            'page' => ['nullable', 'string', 'max:200'],
        ]);

        $site = ApiContext::site($request);
        $editing = ApiContext::token($request)->can(Ability::Write);

        $result = $prepare($site, $validated['html'], $validated['page'] ?? '', $editing);

        Meter::record($site, Meter::TAG);

        return response()->json($result)->withHeaders([
            // One person's unfinished work must never be held anywhere. A
            // visitor's copy depends on markup only the caller has, so only
            // the caller can usefully keep it — and the plugin does, against
            // the published version, so a publish drops every page at once.
            'Cache-Control' => $editing ? 'no-store, private' : 'private, max-age=600',
        ]);
    }

    /**
     * Their content, baked into their own markup.
     *
     * A secret key, because this is the owner's decision rather than an
     * editor's — and because what comes back is the whole of what they have
     * been paying us to keep.
     */
    public function export(Request $request, ExportMarkup $export): JsonResponse
    {
        $validated = $request->validate([
            'html' => ['required', 'string', 'max:'.ExportMarkup::MAX_BYTES],
            'page' => ['nullable', 'string', 'max:200'],
        ]);

        $result = $export(ApiContext::site($request), $validated['html'], $validated['page'] ?? '');

        return response()->json($result)->withHeaders(['Cache-Control' => 'no-store, private']);
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
