<?php

namespace ShipFast\LiveEdit\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\UploadedFile;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Application\Api\ApplyEdit;
use ShipFast\LiveEdit\Application\Api\StoreMedia;
use ShipFast\LiveEdit\Domain\Content\Companions;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\MediaImport;

class ProcessMediaImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    // Stay below Laravel's default database retry_after (90s), so a slow job
    // is failed once instead of being picked up by a second worker as well.
    public int $timeout = 75;

    public int $tries = 1;

    public function __construct(public readonly int $importId) {}

    public function handle(StoreMedia $store, ApplyEdit $apply): void
    {
        $import = MediaImport::query()->useWritePdo()->find($this->importId);

        if (! $import || $import->status !== 'queued') {
            return;
        }

        if (MediaImport::query()->useWritePdo()->whereKey($import->id)->where('status', 'queued')->update(['status' => 'processing']) !== 1) {
            return;
        }

        $site = Site::query()->useWritePdo()->find($import->site_id);
        $token = ApiToken::query()->useWritePdo()
            ->where('site_id', $import->site_id)
            ->where('public_id', $import->token_public_id)
            ->first();

        if (! $site || ! $token) {
            $this->fail($import, 'site_or_token_missing');

            return;
        }

        $options = $import->options ?? [];
        $stored = null;
        $temporary = null;

        try {
            if ($import->source_path !== null) {
                $temporary = tempnam(sys_get_temp_dir(), 'live-edit-image-');
                if ($temporary === false) {
                    throw new \RuntimeException('A temporary image file could not be created.');
                }

                $input = Storage::disk((string) $import->source_disk)->readStream($import->source_path);
                $output = fopen($temporary, 'wb');

                if (! is_resource($input) || ! is_resource($output)) {
                    if (is_resource($input)) fclose($input);
                    if (is_resource($output)) fclose($output);
                    throw new \RuntimeException('The queued image source could not be opened.');
                }

                try {
                    if (stream_copy_to_stream($input, $output) === false) {
                        throw new \RuntimeException('The queued image could not be copied to a temporary file.');
                    }
                } finally {
                    fclose($input);
                    fclose($output);
                }

                $extension = pathinfo($import->source_path, PATHINFO_EXTENSION) ?: 'jpg';
                $file = new UploadedFile($temporary, 'image.'.$extension, mime_content_type($temporary) ?: null, null, true);
                $stored = $store(
                    $site,
                    $file,
                    $options['fitWidth'] ?? null,
                    $options['fitHeight'] ?? null,
                    (bool) ($options['fitExact'] ?? false),
                    $options['crop'] ?? null,
                    (bool) ($options['logo'] ?? false),
                );
            } elseif ($import->source_url !== null) {
                $stored = $store->fromAddress(
                    $site,
                    $import->source_url,
                    $options['fitWidth'] ?? null,
                    $options['fitHeight'] ?? null,
                    (bool) ($options['fitExact'] ?? false),
                );
            }

            // A remote photo that cannot be imported remains usable at its
            // original address, matching the synchronous path's fallback.
            $url = $stored['url'] ?? $import->source_url;

            if ($url === null && $import->target !== null) {
                throw new \RuntimeException('The image source could not be processed.');
            }

            DB::transaction(function () use ($import, $site, $token, $apply, $options, $url): void {
                $key = $import->target;

                if ($key !== null) {
                    $apply($site, $token, $key, (string) $url);

                    $beside = [
                        'alt' => 'Alt', 'imgTitle' => 'Title', 'credit' => 'Credit', 'creditBy' => 'CreditBy',
                        'creditUrl' => 'CreditUrl', 'creditSource' => 'CreditSource', 'creditSourceUrl' => 'CreditSourceUrl',
                    ];

                    foreach ($beside as $field => $suffix) {
                        if (array_key_exists($field, $options)) {
                            $apply($site, $token, $key.$suffix, (string) $options[$field],
                                in_array($field, ['alt', 'imgTitle'], true) ? ($options['locale'] ?? null) : null);
                        }
                    }

                    if (! array_key_exists('credit', $options)) {
                        foreach (Companions::CREDIT as $suffix) {
                            $apply($site, $token, $key.$suffix, '');
                        }
                    }
                }

                MediaImport::query()->useWritePdo()->whereKey($import->id)->update([
                    'status' => 'completed', 'url' => $url, 'reason' => null,
                ]);
            });
        } catch (\Throwable $exception) {
            report($exception);
            $this->fail($import, 'processing_failed');
        } finally {
            if (is_string($temporary)) {
                @unlink($temporary);
            }

            if ($import->source_path !== null && $import->source_disk !== null) {
                Storage::disk($import->source_disk)->delete($import->source_path);
            }
        }
    }

    public function failed(?\Throwable $exception): void
    {
        $import = MediaImport::query()->useWritePdo()->find($this->importId);

        if ($import) {
            $this->fail($import, 'processing_failed');
        }
    }

    private function fail(MediaImport $import, string $reason): void
    {
        MediaImport::query()->useWritePdo()->whereKey($import->id)->whereIn('status', ['queued', 'processing'])->update([
            'status' => 'failed', 'reason' => $reason,
        ]);

        if ($import->source_path !== null && $import->source_disk !== null) {
            Storage::disk($import->source_disk)->delete($import->source_path);
        }
    }
}
