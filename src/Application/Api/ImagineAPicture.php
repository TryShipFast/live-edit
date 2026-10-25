<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Credits\Credits;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Jobs\GeneratePicture;
use ShipFast\LiveEdit\Models\ImageGeneration;

/**
 * Making a picture when no photograph will do.
 *
 * The last resort of the three, and priced like it: five credits against one
 * for a rewrite. A photograph of a real place is better than a generated one
 * almost every time, which is why Free photos comes first in the picker and
 * this comes last.
 *
 * Paid for before the model is asked, refunded when nothing usable comes back,
 * for the same reasons as the text version — a call charged afterwards is one
 * somebody can take for free by closing the tab, and keeping the credit when
 * nothing arrives is charging for silence.
 */
class ImagineAPicture
{
    /**
     * Why the last call came back with no picture, as a reason the editor can word: the provider
     * refused (provider_refused), could not be reached (provider_unreachable), the picture could not
     * be stored (not_stored), or nothing usable came back (no_suggestion).
     */
    private string $whyNothing = 'no_suggestion';

    public function __construct(private readonly Credits $credits) {}

    public function whyNothing(): string
    {
        return $this->whyNothing;
    }

    public function available(): bool
    {
        return (bool) config('live-edit.ai.enabled')
            && filled(config('live-edit.ai.api_key'))
            && filled(config('live-edit.ai.image_endpoint'));
    }

    /**
     * @return array{images: array<int, string>, balance: int, reason?: string}
     */
    public function __invoke(Site $site, string $prompt, int $count = 2): array
    {
        if (trim($prompt) === '') {
            return ['images' => [], 'balance' => $this->credits->balance($site), 'reason' => 'nothing_to_work_with'];
        }

        if (! $this->available()) {
            return ['images' => [], 'balance' => $this->credits->balance($site), 'reason' => 'not_configured'];
        }

        $balance = $this->credits->spend($site, 'generate_image', [
            'prompt' => mb_substr($prompt, 0, 200),
        ]);

        if ($balance === null) {
            return ['images' => [], 'balance' => $this->credits->balance($site), 'reason' => 'not_enough_credits'];
        }

        $images = $this->keep($site, $this->ask($prompt, $count));

        if ($images === []) {
            return [
                'images' => [],
                'balance' => $this->credits->refund($site, 'generate_image', ['prompt' => mb_substr($prompt, 0, 200)]),
                'reason' => $this->whyNothing,
            ];
        }

        return ['images' => $images, 'balance' => $balance];
    }

    /**
     * Queue a generation so a slow image provider cannot hold the browser
     * request open until the edge gateway gives up.
     *
     * @return array<string, mixed>
     */
    public function enqueue(Site $site, string $prompt, int $count = 2, ?string $requestId = null): array
    {
        $prompt = trim($prompt);
        $balance = $this->credits->balance($site);

        if ($requestId !== null) {
            $existing = ImageGeneration::query()
                ->useWritePdo()
                ->where('site_id', $site->id)
                ->where('uuid', $requestId)
                ->first();

            if ($existing) {
                return $this->status($site, $requestId) ?? ['images' => [], 'balance' => $balance, 'reason' => 'queue_unavailable'];
            }
        }

        if ($prompt === '') {
            return ['images' => [], 'balance' => $balance, 'reason' => 'nothing_to_work_with'];
        }

        if (! $this->available()) {
            return ['images' => [], 'balance' => $balance, 'reason' => 'not_configured'];
        }

        // A sync queue would run the provider call inside this HTTP request,
        // recreating the exact timeout this job exists to prevent.
        if (config('queue.default') === 'sync') {
            return ['images' => [], 'balance' => $balance, 'reason' => 'queue_unavailable'];
        }

        $balance = $this->credits->spend($site, 'generate_image', [
            'prompt' => mb_substr($prompt, 0, 200),
        ]);

        if ($balance === null) {
            return ['images' => [], 'balance' => $this->credits->balance($site), 'reason' => 'not_enough_credits'];
        }

        try {
            $generation = DB::transaction(function () use ($site, $prompt, $balance, $requestId): ImageGeneration {
                $generation = ImageGeneration::query()->create([
                    'uuid' => $requestId ?? (string) Str::uuid(),
                    'site_id' => $site->id,
                    'prompt' => mb_substr($prompt, 0, 600),
                    'status' => 'queued',
                    'balance' => $balance,
                ]);

                GeneratePicture::dispatch($generation->id)->afterCommit();

                return $generation;
            });
        } catch (\Throwable) {
            $this->credits->refund($site, 'generate_image', ['prompt' => mb_substr($prompt, 0, 200)]);

            return ['images' => [], 'balance' => $this->credits->balance($site), 'reason' => 'queue_unavailable'];
        }

        return [
            'generation_id' => $generation->uuid,
            'status' => 'queued',
            'balance' => $balance,
        ];
    }

    /** @return array<string, mixed>|null */
    public function status(Site $site, string $uuid): ?array
    {
        // Generation rows are created by a POST and read by a separate poll
        // request. On read/write-split databases, the poll can reach a replica
        // before that insert has replicated and falsely report a missing image.
        // Read this short-lived job state from the primary so a queued request
        // is visible immediately.
        $generation = ImageGeneration::query()
            ->useWritePdo()
            ->where('site_id', $site->id)
            ->where('uuid', $uuid)
            ->first();

        if (! $generation) {
            return null;
        }

        // Paid for when it was queued, and refunded only by the job. A job that never ran (no worker) or
        // died partway (a restart, out of memory) would keep the credits for a picture that never comes.
        // Asked about long after any job could still be working on it, it is given up here and refunded.
        if (in_array($generation->status, ['queued', 'processing'], true)
            && $generation->created_at?->lt(now()->subSeconds(self::jobSeconds() + 120))) {
            $this->giveUp($generation->id, 'timed_out');
            $generation->refresh();
        }

        return [
            'generation_id' => $generation->uuid,
            'status' => $generation->status,
            'images' => $generation->images ?? [],
            'balance' => $generation->balance,
            'reason' => $generation->reason,
        ];
    }

    /** How long a generation's job may run: the provider's time and twenty seconds to store what it sent. */
    public static function jobSeconds(): int
    {
        return max(30, (int) config('live-edit.ai.image_job_timeout', 150)) + 20;
    }

    /**
     * A generation that will not deliver: marked failed with why, and its credits given back, once.
     *
     * Returns the balance after, or null when there was nothing to give up (already delivered or
     * already given up).
     */
    public function giveUp(int $generationId, string $reason): ?int
    {
        return DB::transaction(function () use ($generationId, $reason): ?int {
            $generation = ImageGeneration::query()->useWritePdo()->whereKey($generationId)->lockForUpdate()->first();

            if (! $generation || in_array($generation->status, ['completed', 'failed'], true)) {
                return null;
            }

            $site = Site::query()->useWritePdo()->find($generation->site_id);
            $balance = $site
                ? $this->credits->refund($site, 'generate_image', ['generation' => $generation->uuid])
                : (int) ($generation->balance ?? 0);

            $generation->update([
                'status' => 'failed',
                'reason' => $reason,
                'balance' => $balance,
            ]);

            return $balance;
        });
    }

    /** @return array<int, string> */
    public function generate(Site $site, string $prompt, int $count = 2): array
    {
        return $this->keep($site, $this->ask($prompt, $count));
    }

    /**
     * Store anything that came back as bytes, and hand back addresses.
     *
     * The model this is pointed at returns base64 and never a URL, so what
     * arrived was a two megabyte data: URI per picture. It looked right: the
     * picker showed it, clicking it repainted the page, and the client could
     * see their picture. Then Save refused it, because a data: URI is not an
     * http address and two megabytes is not a two thousand character field.
     * Five credits spent on a picture that could never be kept.
     *
     * Every test passed throughout, because every test stubbed the provider
     * with a response carrying a url, which this provider does not send.
     *
     * Stored here rather than in the browser because the browser is the worst
     * place for it: two generated pictures is four megabytes of base64 to
     * ship, hold in memory and re-upload, and doing it here fixes the same
     * fault for every adapter at once. A URL is what the rest of the pipeline
     * has always expected.
     *
     * @param  array<int, string>  $images
     * @return array<int, string>
     */
    protected function keep(Site $site, array $images): array
    {
        $store = app(ImageStore::class);
        $directory = (new SiteStore($site))->mediaDirectory();

        return collect($images)
            ->map(function (string $image) use ($store, $directory) {
                // Already an address: nothing to store, and a provider that
                // sends one is entitled to keep serving it.
                if (! str_starts_with($image, 'data:')) {
                    return $image;
                }

                [$meta, $encoded] = array_pad(explode(',', $image, 2), 2, null);

                if ($encoded === null || ! str_contains((string) $meta, ';base64')) {
                    return null;
                }

                $bytes = base64_decode($encoded, true);

                if ($bytes === false || $bytes === '') {
                    return null;
                }

                $mime = trim(str_replace(['data:', ';base64'], '', (string) $meta)) ?: 'image/png';
                $extension = match ($mime) {
                    'image/jpeg', 'image/jpg' => 'jpg',
                    'image/webp' => 'webp',
                    default => 'png',
                };

                try {
                    return $store->url($store->put($bytes, $mime, $extension, $directory));
                } catch (\Throwable $e) {
                    // Made and paid for, and lost here: said as such, and logged for whoever runs the server.
                    $this->whyNothing = 'not_stored';
                    Log::warning('Live Edit could not store a generated picture.', ['error' => $e->getMessage()]);

                    return null;
                }
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * The pictures, from the configured model, or from the fallback when the configured one is refused.
     *
     * Every failure used to come back as an empty list, so a refusal read as "nothing usable came back"
     * and the reason - which the provider spells out - was thrown away. Reported from a self-hosted
     * install: every picture failed with no_suggestion and nothing said why. The commonest cause is
     * gpt-image-1 itself, which OpenAI refuses (403) until the organisation behind the key is verified;
     * dall-e-3 needs no verification, so a refused model is tried again on that before giving up.
     *
     * @return array<int, string>
     */
    protected function ask(string $prompt, int $count): array
    {
        $this->whyNothing = 'no_suggestion';
        $model = (string) config('live-edit.ai.image_model');
        $fallback = (string) config('live-edit.ai.image_fallback_model', 'dall-e-3');

        foreach (array_values(array_unique(array_filter([$model, $fallback]))) as $i => $tryModel) {
            $dallE = str_starts_with($tryModel, 'dall-e');

            try {
                $response = Http::withToken(config('live-edit.ai.api_key'))
                    // This runs in a queue worker, outside the browser request.
                    // Give the provider enough time to finish; the editor polls
                    // the generation record and the worker refunds an unusable
                    // result or a provider failure.
                    ->connectTimeout((int) config('live-edit.ai.image_connect_timeout', 10))
                    ->timeout(max(30, (int) config('live-edit.ai.image_job_timeout', 150)))
                    ->post(config('live-edit.ai.image_endpoint'), array_filter([
                        'model' => $tryModel,
                        // Two options balance choice against provider latency.
                        // Asking for four at once made the provider call slow
                        // enough to hit the service gateway's request timeout.
                        // dall-e-3 makes one at a time.
                        'n' => $tryModel === 'dall-e-3' ? 1 : max(1, min($count, 2)),
                        'size' => '1024x1024',
                        'prompt' => $this->frame($prompt),
                        // A dall-e address expires within the hour, which would leave a hole in
                        // the page; bytes are stored here and kept (keep()). gpt-image-1 sends
                        // bytes anyway and refuses this field.
                        'response_format' => $dallE ? 'b64_json' : null,
                    ]));
            } catch (\Throwable $e) {
                $this->whyNothing = 'provider_unreachable';
                Log::warning('Live Edit could not reach the image provider.', ['model' => $tryModel, 'error' => $e->getMessage()]);

                return [];
            }

            if (! $response->successful()) {
                $this->whyNothing = 'provider_refused';
                Log::warning('The image provider refused a picture.', [
                    'model' => $tryModel,
                    'status' => $response->status(),
                    'error' => $response->json('error.message') ?? mb_substr($response->body(), 0, 300),
                ]);

                // Refused for this model (not allowed, not found, or a request it will not take):
                // the next one may well be. A limit or an outage is the same for every model.
                if (in_array($response->status(), [400, 403, 404], true)) {
                    continue;
                }

                return [];
            }

            $images = collect($response->json('data') ?? [])
                ->map(fn (array $image) => $image['url']
                    ?? (isset($image['b64_json']) ? 'data:image/png;base64,'.$image['b64_json'] : null))
                ->filter()
                ->take(max(1, min($count, 2)))
                ->values()
                ->all();

            if ($images === []) {
                $this->whyNothing = 'no_suggestion';
            }

            return $images;
        }

        return [];
    }

    /**
     * What to ask for, around what the client typed.
     *
     * Websites want photographs, not illustrations, and certainly not the
     * lettering these models produce when left alone — a hero with invented
     * words baked into the pixels cannot be edited, translated or corrected,
     * and is the single most obvious way a page looks generated.
     */
    protected function frame(string $prompt): string
    {
        return trim($prompt)
            .'. Photographic, natural light, realistic, suitable as a website'
            .' image. No text, no words, no lettering, no logos, no watermarks.';
    }
}
