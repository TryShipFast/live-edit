<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Credits\Credits;
use ShipFast\LiveEdit\Domain\Site\Site;

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
    public function __construct(private readonly Credits $credits) {}

    public function available(): bool
    {
        return (bool) config('live-edit.ai.enabled')
            && filled(config('live-edit.ai.api_key'))
            && filled(config('live-edit.ai.image_endpoint'));
    }

    /**
     * @return array{images: array<int, string>, balance: int, reason?: string}
     */
    public function __invoke(Site $site, string $prompt, int $count = 4): array
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
                'reason' => 'no_suggestion',
            ];
        }

        return ['images' => $images, 'balance' => $balance];
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
     * place for it: four generated pictures is eight megabytes of base64 to
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
                } catch (\Throwable) {
                    // Treated as "nothing usable came back", which refunds.
                    return null;
                }
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    protected function ask(string $prompt, int $count): array
    {
        try {
            $response = Http::withToken(config('live-edit.ai.api_key'))
                ->timeout((int) config('live-edit.ai.image_timeout', 90))
                ->post(config('live-edit.ai.image_endpoint'), [
                    'model' => config('live-edit.ai.image_model'),
                    // Four, because one is a verdict and four is a choice.
                    'n' => max(1, min($count, 4)),
                    'size' => '1024x1024',
                    'prompt' => $this->frame($prompt),
                ]);
        } catch (\Throwable) {
            return [];
        }

        if (! $response->successful()) {
            return [];
        }

        return collect($response->json('data') ?? [])
            ->map(fn (array $image) => $image['url']
                ?? (isset($image['b64_json']) ? 'data:image/png;base64,'.$image['b64_json'] : null))
            ->filter()
            ->values()
            ->all();
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
