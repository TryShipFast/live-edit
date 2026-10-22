<?php

namespace ShipFast\LiveEdit\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use ShipFast\LiveEdit\Application\Api\ImagineAPicture;
use ShipFast\LiveEdit\Domain\Credits\Credits;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\ImageGeneration;

class GeneratePicture implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 80;

    public int $tries = 1;

    public function __construct(public readonly int $generationId) {}

    public function handle(ImagineAPicture $imagine, Credits $credits): void
    {
        // Read from the primary: a worker can hit a lagging replica immediately after dispatch.
        $generation = ImageGeneration::query()->useWritePdo()->find($this->generationId);

        if (! $generation || $generation->status !== 'queued') {
            return;
        }

        if (ImageGeneration::query()->useWritePdo()->whereKey($generation->id)->where('status', 'queued')->update(['status' => 'processing']) !== 1) {
            return;
        }

        $site = Site::query()->useWritePdo()->find($generation->site_id);

        if (! $site) {
            $this->failGeneration($credits, 'site_missing');

            return;
        }

        try {
            $images = $imagine->generate($site, $generation->prompt, 2);
        } catch (\Throwable) {
            $this->failGeneration($credits, 'provider_error');

            return;
        }

        if ($images === []) {
            $this->failGeneration($credits, 'no_suggestion');

            return;
        }

        $generation->update([
            'status' => 'completed',
            'images' => $images,
            'balance' => $credits->balance($site),
        ]);
    }

    public function failed(?\Throwable $exception): void
    {
        $this->failGeneration(app(Credits::class), 'provider_error');
    }

    private function failGeneration(Credits $credits, string $reason): void
    {
        DB::transaction(function () use ($credits, $reason): void {
            $generation = ImageGeneration::query()->useWritePdo()->whereKey($this->generationId)->lockForUpdate()->first();

            if (! $generation || in_array($generation->status, ['completed', 'failed'], true)) {
                return;
            }

            $site = Site::query()->useWritePdo()->find($generation->site_id);
            $balance = $site
                ? $credits->refund($site, 'generate_image', ['generation' => $generation->uuid])
                : (int) ($generation->balance ?? 0);

            $generation->update([
                'status' => 'failed',
                'reason' => $reason,
                'balance' => $balance,
            ]);
        });
    }
}
