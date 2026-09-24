<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Application\Api\StoreMedia;
use ShipFast\LiveEdit\Domain\Site\OverLimit;
use ShipFast\LiveEdit\Http\Api\ApiContext;

class MediaController
{
    public function store(Request $request, StoreMedia $store): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file'],
            // The box in the design this picture is replacing. A client rarely
            // has one the same shape, and dropped in untouched it stretches
            // the section it sits in.
            'fitWidth' => ['nullable', 'integer', 'min:1', 'max:4000'],
            'fitHeight' => ['nullable', 'integer', 'min:1', 'max:4000'],
        ]);

        try {
            $result = $store(
                ApiContext::site($request),
                $request->file('file'),
                $validated['fitWidth'] ?? null,
                $validated['fitHeight'] ?? null,
            );
        } catch (OverLimit $e) {
            return ContentController::overLimit($e);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => [
                    'type' => 'invalid_request_error',
                    'message' => collect($e->errors())->flatten()->first(),
                ],
            ], 422);
        }

        // An upload is a one-off: nothing should cache the response that
        // announces it, though the file it points at may be cached forever.
        return response()->json($result)->withHeaders(['Cache-Control' => 'no-store']);
    }
}
