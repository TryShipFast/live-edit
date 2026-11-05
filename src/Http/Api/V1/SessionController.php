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
            /*
             * Who this is, for team editing (one person per section). The
             * host's own id for its user, the name teammates will see ("Ada
             * is editing this section"), and their role: owner, admin or editor.
             * Absent means the session is the website itself, which edits as
             * it always did: everything is its own.
             */
            'editor' => ['nullable', 'array'],
            'editor.id' => ['required_with:editor', 'string', 'max:100'],
            'editor.name' => ['nullable', 'string', 'max:120'],
            'editor.role' => ['nullable', 'string', 'in:owner,admin,editor'],
        ]);

        $session = $issue(
            ApiContext::site($request),
            $validated['label'] ?? null,
            null,
            (bool) ($validated['may_edit_locked'] ?? true),
            $validated['editor'] ?? null,
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
                // The browser uses this to avoid offering a locked region
                // that the API will refuse at save time. Keep the API as the
                // authority; this only controls editor affordances.
                'may_edit_locked' => $usable ? $token->mayEditLocked() : false,
            ],
        ])->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    /**
     * Promote or demote somebody the host named when it minted their session.
     *
     * A secret-key act, like minting. Every session of theirs on this site
     * takes the new role on its next request, so a demoted admin does not keep
     * the power for the rest of a session. (Somebody we know as an editor has
     * their role on their grant instead, EditorGrant.)
     */
    public function role(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'string', 'max:100'],
            'role' => ['required', 'string', 'in:owner,admin,editor'],
        ]);

        $changed = 0;
        \ShipFast\LiveEdit\Domain\Site\ApiToken::query()
            ->where('site_id', ApiContext::site($request)->id)
            ->where('holder_ref', $validated['id'])
            ->get()
            ->each(function ($token) use ($validated, &$changed) {
                // Saved one by one so each remembered key is forgotten (ApiToken::booted).
                $token->forceFill(['holder_role' => $validated['role']])->save();
                $changed++;
            });

        return response()->json(['sessions' => $changed, 'role' => $validated['role']])->withHeaders(['Cache-Control' => 'no-store']);
    }
}
