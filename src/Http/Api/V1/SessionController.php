<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Application\Api\IssueEditSession;
use ShipFast\LiveEdit\Domain\Site\TokenType;
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

    /**
     * Who is holding this session, for a site that keeps its own content.
     *
     * A self-hosted Laravel or WordPress install stores the words in its own
     * database, so it never calls the content API and has nothing else that
     * would tell it whether the person at the keyboard is an editor. Asking
     * them to also hold an account on their own website to answer that is the
     * thing this product exists to avoid — signing in belongs here, where the
     * site was registered and where the people are.
     *
     * Authenticated by the session token itself: presenting it IS the claim,
     * and this only says whether that claim is currently good.
     */
    public function show(Request $request): JsonResponse
    {
        $token = ApiContext::token($request);
        $site = ApiContext::site($request);

        $usable = $token->type === TokenType::Session->value && $token->isUsable() && $site->isActive();

        return response()->json([
            'session' => [
                'valid' => $usable,
                'site' => $site->slug,
                // The label the sign-in recorded — a name where we have one,
                // the address otherwise. Enough for the site to say who is
                // editing; not a directory lookup.
                'editor' => $usable ? $token->name : null,
                'expires_at' => $token->expires_at?->toIso8601String(),
            ],
        ])->withHeaders(['Cache-Control' => 'no-store, private']);
    }
}
