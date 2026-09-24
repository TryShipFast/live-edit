<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Provisioner;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * Creating sites and managing their keys, for whatever runs a signup.
 */
class SiteController
{
    public function __construct(private readonly Provisioner $provisioner) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:63'],
            'name' => ['nullable', 'string', 'max:120'],
            'origins' => ['nullable', 'array', 'max:20'],
            'origins.*' => ['string', 'max:200'],
        ]);

        try {
            $result = $this->provisioner->create(
                $validated['slug'],
                $validated['name'] ?? null,
                $validated['origins'] ?? [],
            );
        } catch (ValidationException $e) {
            return self::invalid($e);
        }

        // The only time these are ever readable. Said plainly, because a
        // caller that assumes it can ask again will store nothing.
        return response()->json([
            'site' => self::describe($result['site']),
            'keys' => $result['keys'],
            'notice' => 'These keys are shown once and cannot be retrieved again.',
        ], 201)->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    public function show(Site $site): JsonResponse
    {
        return response()->json(['site' => self::describe($site->load('tokens'))]);
    }

    public function update(Request $request, Site $site): JsonResponse
    {
        $validated = $request->validate([
            'origins' => ['nullable', 'array', 'max:20'],
            'origins.*' => ['string', 'max:200'],
            'suspended' => ['nullable', 'boolean'],
        ]);

        try {
            if (array_key_exists('origins', $validated) && $validated['origins'] !== null) {
                $this->provisioner->setOrigins($site, $validated['origins']);
            }
        } catch (ValidationException $e) {
            return self::invalid($e);
        }

        if (array_key_exists('suspended', $validated) && $validated['suspended'] !== null) {
            $this->provisioner->suspend($site, (bool) $validated['suspended']);
        }

        return response()->json(['site' => self::describe($site->fresh()->load('tokens'))]);
    }

    public function issueKey(Request $request, Site $site): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string'],
            'label' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $result = $this->provisioner->issue($site, $validated['type'], $validated['label'] ?? 'API key');
        } catch (ValidationException $e) {
            return self::invalid($e);
        }

        return response()->json([
            'key' => $result['plain'],
            'id' => $result['token']->public_id,
            'notice' => 'Shown once. The old key of this type keeps working until you revoke it.',
        ], 201)->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    public function revokeKey(Site $site, string $keyId): JsonResponse
    {
        $token = ApiToken::query()->where('site_id', $site->id)->where('public_id', $keyId)->first();

        if ($token === null) {
            return response()->json(['error' => ['type' => 'not_found', 'message' => 'No such key on this site.']], 404);
        }

        $token->revoke();

        return response()->json(['revoked' => $token->public_id]);
    }

    /** @return array<string, mixed> */
    private static function describe(Site $site): array
    {
        return [
            'slug' => $site->slug,
            'name' => $site->name,
            'origins' => $site->allowed_origins ?? [],
            'suspended' => ! $site->isActive(),
            // Identities and states, never the keys themselves.
            'keys' => $site->tokens->map(fn (ApiToken $t) => [
                'id' => $t->public_id,
                'type' => $t->type,
                'label' => $t->name,
                'revoked' => $t->revoked_at !== null,
                'last_used_at' => $t->last_used_at?->toIso8601String(),
            ])->values()->all(),
        ];
    }

    private static function invalid(ValidationException $e): JsonResponse
    {
        return response()->json([
            'error' => [
                'type' => 'invalid_request_error',
                'message' => collect($e->errors())->flatten()->first(),
                'errors' => $e->errors(),
            ],
        ], 422);
    }
}
