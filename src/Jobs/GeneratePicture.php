<?php

namespace ShipFast\LiveEdit\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use ShipFast\LiveEdit\Application\Api\ImagineAPicture;
use ShipFast\LiveEdit\Domain\Credits\Credits;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\ImageGeneration;

class GeneratePicture implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout;

    public int $tries = 1;

    public function __construct(public readonly int $generationId)
    {
        // Longer than the provider is given, so a slow picture fails as a provider error and is refunded
        // here, rather than the worker killing the job first.
        $this->timeout = ImagineAPicture::jobSeconds();
    }

    public function handle(ImagineAPicture $imagine): void
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
            $imagine->giveUp($this->generationId, 'site_missing');

            return;
        }

        try {
            $images = $imagine->generate($site, $generation->prompt, 2);
        } catch (\Throwable) {
            $imagine->giveUp($this->generationId, 'provider_error');

            return;
        }

        if ($images === []) {
            $imagine->giveUp($this->generationId, $imagine->whyNothing());

            return;
        }

        // Only a generation still being made: one given up meanwhile has had its credits back, and must
        // not now read as delivered.
        ImageGeneration::query()->useWritePdo()->whereKey($generation->id)->where('status', 'processing')->update([
            'status' => 'completed',
            'images' => json_encode($images),
            'balance' => app(Credits::class)->balance($site),
        ]);
    }

    public function failed(?\Throwable $exception): void
    {
        app(ImagineAPicture::class)->giveUp($this->generationId, 'provider_error');
    }
}
