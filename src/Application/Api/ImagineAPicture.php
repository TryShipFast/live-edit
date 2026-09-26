<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Support\Facades\Http;
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

        $images = $this->ask($prompt, $count);

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
