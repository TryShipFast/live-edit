<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Application\Api\IssueEditSession;
use ShipFast\LiveEdit\Http\Api\ApiContext;

class SessionController
{
    public function store(Request $request, IssueEditSession $issue): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:100'],
        ]);

        $session = $issue(ApiContext::site($request), $validated['label'] ?? null);

        // Never cached, anywhere, by anyone. This response is a credential.
        return response()->json($session)->withHeaders([
            'Cache-Control' => 'no-store, private',
            'Pragma' => 'no-cache',
        ]);
    }
}
