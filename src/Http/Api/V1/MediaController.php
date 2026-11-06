<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Application\Api\ApplyEdit;
use ShipFast\LiveEdit\Application\Api\FindPhotos;
use ShipFast\LiveEdit\Application\Api\StoreMedia;
use ShipFast\LiveEdit\Domain\Content\Companions;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\OverLimit;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Http\Api\ApiContext;
use ShipFast\LiveEdit\Jobs\ProcessMediaImport;
use ShipFast\LiveEdit\Models\MediaImport;

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
            /*
             * Which language the description is being written in.
             *
             * Only the description. A picture is the same picture in every
             * language and a photographer's name is the same name, so the
             * address, the source list and the four credit fields stay
             * canonical; alt text and the tooltip are sentences somebody
             * wrote, and a French page reading English alt text is the
             * accessibility layer left untranslated - the one part of the page
             * whose whole job is to be read aloud.
             *
             * Checked against the site's own languages by ApplyEdit, not here.
             */
            'locale' => ['nullable', 'string', 'max:10'],
            /*
             * Who took the picture, kept with the picture.
             *
             * Not decoration and not optional: Unsplash's terms and every
             * Creative Commons licence except CC0 require the photographer to
             * be named wherever the work appears. Held in the tooltip it was
             * visible on hover and nowhere else, which satisfies nobody, and
             * a licence obligation that depends on a mouse is a debt the
             * platform was quietly carrying on behalf of every client.
             *
             * Sibling settings, under the same names the alt text uses, so
             * drafting, publishing, reverting and snapshots all work without
             * a second mechanism to keep in step.
             */
            'credit' => ['nullable', 'string', 'max:300'],
            'creditBy' => ['nullable', 'string', 'max:200'],
            'creditUrl' => ['nullable', 'url:http,https', 'max:2000'],
            'creditSource' => ['nullable', 'string', 'max:100'],
            'creditSourceUrl' => ['nullable', 'url:http,https', 'max:2000'],
            // The box in the design this picture is replacing. A client rarely
            // has one the same shape, and dropped in untouched it stretches
            // the section it sits in.
            'fitWidth' => ['nullable', 'integer', 'min:1', 'max:4000'],
            'fitHeight' => ['nullable', 'integer', 'min:1', 'max:4000'],
            /*
             * Whether those two are the picture being replaced or the box it
             * sits in. An image's own width is already in device pixels and a
             * box is in CSS pixels, so only one of them wants doubling for a
             * retina screen - and getting that backwards stores a file twice
             * the size of the one it replaced.
             */
            'fitExact' => ['nullable', 'boolean'],
            // A logo is stored at the size a logo is shown (ImageFitter::forLogo).
            'role' => ['nullable', 'in:logo'],
            /*
             * The part of the picture to keep, in the file's own pixels.
             *
             * Automatic fitting takes the middle, which is right most of the
             * time and wrong in the way that matters: a face or a product off
             * to one side is exactly what the middle cuts off. These four say
             * where to cut instead, and nothing else about the fitting
             * changes - the shape is still the spot's.
             */
            'cropX' => ['nullable', 'integer', 'min:0', 'max:20000'],
            'cropY' => ['nullable', 'integer', 'min:0', 'max:20000'],
            'cropWidth' => ['nullable', 'integer', 'min:1', 'max:20000'],
            'cropHeight' => ['nullable', 'integer', 'min:1', 'max:20000'],
        ]);

        try {
            $site = ApiContext::site($request);
            $token = ApiContext::token($request);
            $key = $this->settingKey($validated['target'] ?? null);

            $remotePhoto = trim((string) ($validated['url'] ?? ''));
            if ($request->hasFile('file') || ($remotePhoto !== '' && FindPhotos::offered($remotePhoto))) {
                return $this->enqueueImage($request, $site, $token, $key, $validated);
            }

            $uploaded = $request->hasFile('file')
                ? $store(
                    $site,
                    $request->file('file'),
                    $validated['fitWidth'] ?? null,
                    $validated['fitHeight'] ?? null,
                    (bool) ($validated['fitExact'] ?? false),
                    isset($validated['cropWidth'], $validated['cropHeight'])
                        ? [
                            'x' => (int) ($validated['cropX'] ?? 0),
                            'y' => (int) ($validated['cropY'] ?? 0),
                            'width' => (int) $validated['cropWidth'],
                            'height' => (int) $validated['cropHeight'],
                        ]
                        : null,
                    ($validated['role'] ?? null) === 'logo',
                )
                : null;

            // A free photo chosen in the editor: stored as the site's own, made fit, where the server can fetch it.
            if ($uploaded === null && trim((string) ($validated['url'] ?? '')) !== '' && ! ($validated['remove'] ?? false)) {
                $uploaded = $store->fromAddress($site, trim($validated['url']), $validated['fitWidth'] ?? null, $validated['fitHeight'] ?? null, (bool) ($validated['fitExact'] ?? false));
            }

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
                $beside = [
                    'alt' => 'Alt',
                    'imgTitle' => 'Title',
                    'credit' => 'Credit',
                    'creditBy' => 'CreditBy',
                    'creditUrl' => 'CreditUrl',
                    'creditSource' => 'CreditSource',
                    'creditSourceUrl' => 'CreditSourceUrl',
                ];

                // Alt text and the tooltip are the client's sentences and
                // belong to the language they were typed in. Everything else
                // beside a picture is the same in every language.
                $said = ['alt', 'imgTitle'];
                $locale = $validated['locale'] ?? null;

                foreach ($beside as $field => $suffix) {
                    if ($request->has($field)) {
                        $apply(
                            $site,
                            $token,
                            $key.$suffix,
                            (string) ($validated[$field] ?? ''),
                            in_array($field, $said, true) ? $locale : null
                        );
                    }
                }

                // A new picture without a credit clears the old one. The
                // previous photographer's name sitting under somebody else's
                // photograph is a worse failure than no name at all: it is a
                // false statement about who took it.
                if ($value !== null && ! $request->has('credit')) {
                    foreach (Companions::CREDIT as $suffix) {
                        $apply($site, $token, $key.$suffix, '');
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
        } catch (\Throwable $e) {
            /*
             * Anything else: a bucket that refuses the write, credentials that
             * have moved, a disk that is not configured on this host.
             *
             * Reported rather than swallowed - it still reaches the log and
             * whatever watches it - but turned into an answer rather than an
             * opaque 500. Everything else in this codebase is careful to say
             * what went wrong, and this one route was not: somebody replacing
             * a photograph got a failed request with no message, and from the
             * outside that is indistinguishable from the editor being broken.
             *
             * The site and the key are logged with it, because "media failed"
             * in a log shared by every customer is not something anybody can
             * act on.
             */
            report($e);

            /*
             * Kept where it can be read back by a command.
             *
             * The log is the right place for this and not always a reachable
             * one: on a managed host it means a dashboard, a time range and a
             * search through every customer's lines. Meanwhile `php artisan`
             * is right there - it is how this whole afternoon's diagnosis
             * actually happened - so the last failure is put somewhere a
             * command can read it. One slot, overwritten, kept a day.
             */
            cache()->put('live-edit.last-save-failure', [
                'at' => now()->toIso8601String(),
                'site' => $site->slug ?? null,
                'key' => $key ?? null,
                'disk' => config('live-edit.disk'),
                'thrown' => $e::class,
                'reason' => $e->getMessage(),
                'where' => collect($e->getTrace())
                    ->pluck('file')
                    ->filter(fn ($file) => $file !== null && ! str_contains((string) $file, '/vendor/laravel/'))
                    ->take(3)
                    ->values()
                    ->all(),
            ], now()->addDay());

            Log::error('[live-edit] a picture could not be saved', [
                'site' => $site->slug ?? null,
                'key' => $key ?? null,
                'disk' => config('live-edit.disk'),
                'reason' => $e->getMessage(),
                'thrown' => $e::class,
            ]);

            /*
             * The message says what is known and not what is guessed.
             *
             * It said "could not be stored", which named a cause this block
             * has not established: everything in it can throw, including the
             * database write and the policy, and a storage failure is only one
             * of them. Measured the hard way - a write that the bucket was
             * perfectly happy to take was reported to a client as storage
             * refusing it, which sent an afternoon into an S3 policy that was
             * already correct.
             *
             * `detail` carries the exception, and it is not a leak: this route
             * needs a session token with write ability, so the only caller is
             * somebody already trusted to change that site's content. Without
             * it, every occurrence is a hunt through a log shared by every
             * customer - which is exactly how this one was found, slowly.
             */
            return response()->json([
                'error' => [
                    'type' => 'save_failed',
                    'message' => 'That picture could not be saved. Nothing on the page has changed. Try again, and tell us if it keeps happening.',
                    'detail' => class_basename($e).': '.$e->getMessage(),
                ],
            ], 500);
        }
    }

    /** Queue fetching and decoding so a web worker only accepts the image and creates the job. */
    private function enqueueImage(Request $request, Site $site, ApiToken $token, ?string $key, array $validated): JsonResponse
    {
        if (config('queue.default') === 'sync') {
            return $this->fresh(['error' => [
                'type' => 'queue_unavailable',
                'message' => 'Image processing is not available right now. Try again in a moment.',
            ]], 503);
        }

        $file = $request->file('file');
        $disk = (string) config('live-edit.disk', 'public');
        $uuid = (string) Str::uuid();
        $sourcePath = null;
        $sourceUrl = trim((string) ($validated['url'] ?? '')) ?: null;
        $import = null;

        try {
            if ($file !== null) {
                $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: '');
                $maxKilobytes = (int) config('live-edit.max_upload_kb', 8192);

                if (! in_array($extension, ImageStore::ALLOWED, true)) {
                    throw ValidationException::withMessages(['file' => 'That file type is not accepted.']);
                }
                if ($file->getSize() > $maxKilobytes * 1024) {
                    throw ValidationException::withMessages(['file' => 'That image is too large. The limit is '.round($maxKilobytes / 1024, 1).'MB.']);
                }

                $sourcePath = Storage::disk($disk)->putFileAs('live-edit-pending/'.$site->id, $file, $uuid.'.'.$extension);
                if (! $sourcePath) {
                    throw new \RuntimeException('The original image could not be staged for processing.');
                }
            }

            $metadata = [];
            foreach (['alt', 'imgTitle', 'credit', 'creditBy', 'creditUrl', 'creditSource', 'creditSourceUrl', 'locale'] as $field) {
                if ($request->has($field)) {
                    $metadata[$field] = $validated[$field] ?? '';
                }
            }

            $options = [
                ...$metadata,
                'fitWidth' => $validated['fitWidth'] ?? null,
                'fitHeight' => $validated['fitHeight'] ?? null,
                'fitExact' => (bool) ($validated['fitExact'] ?? false),
                'logo' => ($validated['role'] ?? null) === 'logo',
            ];
            if (isset($validated['cropWidth'], $validated['cropHeight'])) {
                $options['crop'] = [
                    'x' => (int) ($validated['cropX'] ?? 0),
                    'y' => (int) ($validated['cropY'] ?? 0),
                    'width' => (int) $validated['cropWidth'],
                    'height' => (int) $validated['cropHeight'],
                ];
            }

            // Commit the operation row before dispatch, so a fast worker can
            // always see it. A failed dispatch is marked below and the staged
            // source is removed instead of leaving a forever-queued record.
            $import = MediaImport::query()->create([
                'uuid' => $uuid,
                'site_id' => $site->id,
                'token_public_id' => $token->public_id,
                'target' => $key,
                'source_disk' => $sourcePath !== null ? $disk : null,
                'source_path' => $sourcePath,
                'source_url' => $sourceUrl,
                'options' => $options,
                'status' => 'queued',
            ]);

            ProcessMediaImport::dispatch($import->id);

            return response()->json([
                'operation_id' => $import->uuid,
                'status' => 'queued',
            ], 202)->withHeaders(['Cache-Control' => 'no-store, private']);
        } catch (ValidationException $exception) {
            if ($sourcePath !== null) {
                Storage::disk($disk)->delete($sourcePath);
            }

            throw $exception;
        } catch (\Throwable $exception) {
            if ($import instanceof MediaImport) {
                $import->forceFill(['status' => 'failed', 'reason' => 'queue_unavailable'])->save();
            }
            if ($sourcePath !== null) {
                Storage::disk($disk)->delete($sourcePath);
            }

            report($exception);

            return $this->fresh(['error' => [
                'type' => 'queue_unavailable',
                'message' => 'Image processing could not be queued. Nothing on the page has changed. Try again shortly.',
            ]], 503);
        }
    }

    /** A site may poll only its own queued image operations. */
    public function status(Request $request, string $site, string $import): JsonResponse
    {
        $operation = MediaImport::query()->useWritePdo()
            ->where('site_id', ApiContext::site($request)->id)
            ->where('uuid', $import)
            ->first();

        if (! $operation) {
            return $this->fresh(['message' => 'Image operation not found.'], 404);
        }

        return $this->fresh([
            'operation_id' => $operation->uuid,
            'status' => $operation->status,
            'url' => $operation->url,
            'reason' => $operation->reason,
        ], in_array($operation->status, ['queued', 'processing'], true) ? 202 : 200);
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
    private function fresh(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status)->withHeaders(['Cache-Control' => 'no-store, private']);
    }
}
