<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Team\LockRefused;
use ShipFast\LiveEdit\Domain\Team\LockUnit;
use ShipFast\LiveEdit\Domain\Team\Person;
use ShipFast\LiveEdit\Domain\Team\SectionLocks;
use ShipFast\LiveEdit\Http\Api\ApiContext;

/**
 * Team editing: one person per section.
 *
 *   GET  /team               who holds what (one answer per site, cached; 304 when unchanged)
 *   POST /team/claim         take a section before editing it {unit, label, continue}
 *   POST /team/heartbeat     still here (renews at most once a minute)
 *   POST /team/release       let go of sections {units?}
 *   POST /team/take-over     owner or admin: take a section from whoever has it {unit}
 *   POST /team/discard-left  owner or admin: throw away what somebody left in a section {unit}
 *   POST /team/discard       throw away my own unpublished changes and let go of my sections
 */
class TeamController
{
    public function show(Request $request): JsonResponse
    {
        $site = ApiContext::site($request);
        $person = Person::fromToken(ApiContext::token($request));
        $state = (new SectionLocks($site))->state();

        // Per person, because "you" is in the answer; per revision, because
        // that is the only thing that changes it.
        $etag = '"team-'.$state['revision'].'-'.substr(sha1(implode('|', $person->toArray())), 0, 10).'"';
        $headers = [
            'ETag' => $etag,
            // Kept by the browser, but always asked again: the 304 is the cheap part.
            'Cache-Control' => 'private, no-cache',
        ];

        foreach (explode(',', (string) $request->headers->get('If-None-Match', '')) as $candidate) {
            if (trim(str_replace('W/', '', $candidate)) === $etag) {
                return response()->json(null, 304)->withHeaders($headers);
            }
        }

        return response()->json([
            'you' => $person->toArray(),
            'revision' => $state['revision'],
            'idle_minutes' => $state['idle_minutes'],
            'locks' => $state['locks'],
            'left' => $state['left'],
            // How often a browser should ask, said by the server so it can be
            // turned down without shipping a new editor.
            'poll' => [
                'active_seconds' => (int) config('live-edit.team.poll_active_seconds', 5),
                'idle_seconds' => (int) config('live-edit.team.poll_idle_seconds', 30),
            ],
        ])->withHeaders($headers);
    }

    public function claim(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit' => ['required', 'string', 'max:191'],
            'label' => ['nullable', 'string', 'max:191'],
            'continue' => ['nullable', 'boolean'],
        ]);

        $unit = LockUnit::resolve('', $validated['unit']);

        if ($unit === null) {
            return response()->json(['error' => ['type' => 'invalid_request_error', 'message' => 'That is not a part of the page that can be edited.']], 422);
        }

        return $this->answer(fn () => (new SectionLocks(ApiContext::site($request)))->claim(
            $this->person($request), $unit, $validated['label'] ?? null, (bool) ($validated['continue'] ?? false)
        ));
    }

    public function heartbeat(Request $request): JsonResponse
    {
        (new SectionLocks(ApiContext::site($request)))->touch($this->person($request));

        return response()->json(['ok' => true])->withHeaders(['Cache-Control' => 'no-store']);
    }

    public function release(Request $request): JsonResponse
    {
        $validated = $request->validate(['units' => ['nullable', 'array'], 'units.*' => ['string', 'max:191']]);

        $released = (new SectionLocks(ApiContext::site($request)))->release($this->person($request), $validated['units'] ?? null);

        return response()->json(['released' => $released])->withHeaders(['Cache-Control' => 'no-store']);
    }

    public function takeOver(Request $request): JsonResponse
    {
        $validated = $request->validate(['unit' => ['required', 'string', 'max:191'], 'label' => ['nullable', 'string', 'max:191']]);

        // Asked fresh: a demoted admin loses the power on their next request.
        return $this->answer(fn () => ['lock' => (new SectionLocks(ApiContext::site($request)))->takeOver(
            Person::fresh(ApiContext::token($request)), $validated['unit'], $validated['label'] ?? null
        )]);
    }

    public function discardLeft(Request $request): JsonResponse
    {
        $validated = $request->validate(['unit' => ['required', 'string', 'max:191']]);

        return $this->answer(fn () => ['discarded' => (new SectionLocks(ApiContext::site($request)))->discardLeft(
            Person::fresh(ApiContext::token($request)), $validated['unit']
        )]);
    }

    public function discard(Request $request): JsonResponse
    {
        $discarded = (new SiteStore(ApiContext::site($request)))->discard($this->person($request));

        return response()->json(['discarded' => $discarded])->withHeaders(['Cache-Control' => 'no-store']);
    }

    private function person(Request $request): Person
    {
        return Person::fromToken(ApiContext::token($request));
    }

    private function answer(callable $work): JsonResponse
    {
        try {
            return response()->json($work())->withHeaders(['Cache-Control' => 'no-store']);
        } catch (LockRefused $refused) {
            return response()->json($refused->toArray(), $refused->reason === 'not_owner' ? 403 : 409);
        }
    }
}
