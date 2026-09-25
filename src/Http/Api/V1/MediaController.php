<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Application\Api\ApplyEdit;
use ShipFast\LiveEdit\Application\Api\StoreMedia;
use ShipFast\LiveEdit\Domain\Site\OverLimit;
use ShipFast\LiveEdit\Http\Api\ApiContext;

/**
 * Changing a picture on a site that is not this application.
 *
 * This endpoint used to take an uploaded file and nothing else: it stored the
 * bytes, handed back an address, and left it there. Nobody wrote the address
 * down. Every other way of changing a picture the editor offers — pasting a
 * URL, alt text, the title attribute, removing it — was rejected outright,
 * and the one that was accepted put a file in a bucket that no page ever
 * pointed at. The drawer offered four things and the API implemented none of
 * them, which reads to the person using it as "the save did nothing".
 *
 * The editor's own host controller had done all of this for years. The gap was
 * only ever in the path a static site has to take.
 */
class MediaController
{
    public function store(Request $request, StoreMedia $store, ApplyEdit $apply): JsonResponse
    {
        $validated = $request->validate([
            // Optional: a style field uploading a section background wants an
            // address back and writes it into the style itself, so there is no
            // setting here to name.
            'target' => ['nullable', 'string', 'max:200'],
            // Deliberately only "a file" here. What a picture may be — the
            // types, the size limit, an SVG rebuilt without its script — is
            // decided once, where it is stored, so the editor's own path and
            // this one cannot come to different conclusions.
            'file' => ['nullable', 'file'],
            // http(s) only, checked here rather than left to the content
            // policy: this value becomes a src the browser will fetch.
            'url' => ['nullable', 'url:http,https', 'max:2000'],
            'remove' => ['nullable', 'boolean'],
            'alt' => ['nullable', 'string', 'max:300'],
            'imgTitle' => ['nullable', 'string', 'max:300'],
            // The box in the design this picture is replacing. A client rarely
            // has one the same shape, and dropped in untouched it stretches
            // the section it sits in.
            'fitWidth' => ['nullable', 'integer', 'min:1', 'max:4000'],
            'fitHeight' => ['nullable', 'integer', 'min:1', 'max:4000'],
        ]);

        try {
            $site = ApiContext::site($request);
            $token = ApiContext::token($request);
            $key = $this->settingKey($validated['target'] ?? null);

            $uploaded = $request->hasFile('file')
                ? $store($site, $request->file('file'), $validated['fitWidth'] ?? null, $validated['fitHeight'] ?? null)
                : null;

            if ($key === null) {
                throw_unless(
                    $uploaded,
                    ValidationException::withMessages(['file' => 'Choose a file to upload.'])
                );

                return $this->fresh($uploaded);
            }

            $value = match (true) {
                (bool) ($validated['remove'] ?? false) => '',
                $uploaded !== null => $uploaded['url'],
                trim((string) ($validated['url'] ?? '')) !== '' => trim($validated['url']),
                default => null,
            };

            // Saving only the alt text is a real edit, so an empty picture
            // field is not by itself a mistake. Saving nothing at all is.
            throw_if(
                $value === null && ! $request->has('alt') && ! $request->has('imgTitle'),
                ValidationException::withMessages([
                    'file' => 'Choose a file from your computer, paste an image URL, or edit the text attributes.',
                ])
            );

            // One picture edit is one change, even though it is several
            // settings. Written one at a time, a refusal partway through left
            // the picture replaced and the description not — and the person
            // was told the save had failed, which by then was untrue.
            DB::transaction(function () use ($apply, $site, $token, $key, $value, $validated, $request) {
                if ($value !== null) {
                    $apply($site, $token, $key, $value);
                }

                // Written beside the picture under the names the page already
                // reads them by, so a theme needs no arrangement with this.
                foreach (['alt' => 'Alt', 'imgTitle' => 'Title'] as $field => $suffix) {
                    if ($request->has($field)) {
                        $apply($site, $token, $key.$suffix, (string) ($validated[$field] ?? ''));
                    }
                }
            });

            return $this->fresh(['saved' => true, 'key' => $key, 'url' => $value]);
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
    }

    /**
     * The setting a target names, or null when the caller only wants an
     * address back.
     *
     * Settings only. A target like "post:12" is a row in the host's own
     * database, which a site on somebody else's server does not have and this
     * API deliberately does not reach into.
     */
    private function settingKey(?string $target): ?string
    {
        if ($target === null || trim($target) === '') {
            return null;
        }

        [$type, $key] = array_pad(explode(':', trim($target), 2), 2, null);

        throw_unless(
            $type === 'setting' && $key !== null && $key !== '',
            ValidationException::withMessages(['target' => 'Editing that over the content API is not supported.'])
        );

        return $key;
    }

    /**
     * An upload is a one-off: nothing should cache the response that announces
     * it, though the file it points at may be cached forever.
     */
    private function fresh(array $payload): JsonResponse
    {
        return response()->json($payload)->withHeaders(['Cache-Control' => 'no-store']);
    }
}
