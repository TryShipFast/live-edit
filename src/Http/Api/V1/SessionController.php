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
            /*
             * Whether this person may edit what the site's author locked.
             *
             * Asked of the host because only the host can answer it. A session
             * minted here has nobody behind it - that is the entire reason
             * minting exists, that WordPress knows which of its users is at
             * the keyboard and we have no way to - so a lock that waited for
             * us to recognise somebody would never bind on the platform most
             * likely to want it.
             *
             * Absent means true, which is what every session minted before
             * this existed meant, and keeps an old plugin working against a
             * new service.
             */
            'may_edit_locked' => ['nullable', 'boolean'],
        ]);

        $session = $issue(
            ApiContext::site($request),
            $validated['label'] ?? null,
            null,
            (bool) ($validated['may_edit_locked'] ?? true)
        );

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
                /*
                 * The person, from their own row rather than from the token's
                 * display name.
                 *
                 * So a site can greet whoever is editing — "Welcome Tope" —
                 * and be addressing the right one. A label would make two
                 * editors of the same name indistinguishable and turn a
                 * rename into a different person.
                 */
                'editor' => $usable ? [
                    'name' => $token->editor?->name ?: null,
                    'email' => $token->editor?->email,
                    // What to actually put on screen, decided here so every
                    // adapter greets people the same way and none of them has
                    // to fall back to an empty string.
                    'greeting' => $token->editor?->name
                        ?: (is_string($token->editor?->email) ? explode('@', $token->editor->email)[0] : $token->name),
                ] : null,
                'expires_at' => $token->expires_at?->toIso8601String(),
            ],
        ])->withHeaders(['Cache-Control' => 'no-store, private']);
    }
}
