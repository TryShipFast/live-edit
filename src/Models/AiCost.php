<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;
use Throwable;

/**
 * What one paid call to an AI provider really cost: a chat message, a picture, a rewrite, a voice clip (owner,
 * 13 Nov 2026: "we need to be sure of the prices since image is not same as text"). Credit prices are set from the
 * average per kind, never from a guess.
 */
class AiCost extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_ai_costs';

    protected $fillable = ['site_id', 'kind', 'model', 'usage', 'cost_usd'];

    protected $casts = ['usage' => 'array', 'cost_usd' => 'float', 'site_id' => 'integer'];

    /** Kept, never in the way: a cost that cannot be written is logged and the work goes on. */
    public static function record(?int $siteId, string $kind, string $model, array $usage, float $dollars): void
    {
        try {
            static::query()->create([
                'site_id' => $siteId,
                'kind' => mb_substr($kind, 0, 32),
                'model' => mb_substr($model, 0, 80),
                'usage' => $usage,
                'cost_usd' => round(max(0, $dollars), 6),
            ]);
        } catch (Throwable $error) {
            Log::warning('Live Edit could not keep what an AI call cost.', ['kind' => $kind, 'error' => $error->getMessage()]);
        }
    }

    /**
     * Dollars for a chat-style call (chat completions) from its usage and the model's price per million tokens.
     * OpenAI counts the cached part of the prompt inside prompt_tokens.
     *
     * @param  array<string, mixed>  $usage  OpenAI's usage object
     */
    public static function ofTokens(string $model, array $usage): float
    {
        $price = (array) (config('live-edit.ai.prices.'.$model) ?? []);
        $cached = (int) ($usage['prompt_tokens_details']['cached_tokens'] ?? 0);
        $input = max(0, (int) ($usage['prompt_tokens'] ?? 0) - $cached);

        return ($input * (float) ($price['input'] ?? 0)
            + $cached * (float) ($price['cached'] ?? $price['input'] ?? 0)
            + (int) ($usage['completion_tokens'] ?? 0) * (float) ($price['output'] ?? 0)) / 1_000_000;
    }

    /**
     * Dollars for a picture call: gpt-image-1 counts tokens (text and image in, image out); dall-e-3 is a price a
     * picture.
     *
     * @param  array<string, mixed>  $usage  the images endpoint's usage object (gpt-image-1), or []
     */
    public static function ofPictures(string $model, array $usage, int $pictures): float
    {
        $price = (array) (config('live-edit.ai.prices.'.$model) ?? []);
        if (isset($price['picture'])) {
            return $pictures * (float) $price['picture'];
        }
        $text = (int) ($usage['input_tokens_details']['text_tokens'] ?? $usage['input_tokens'] ?? 0);
        $image = (int) ($usage['input_tokens_details']['image_tokens'] ?? 0);

        return ($text * (float) ($price['text_input'] ?? 0)
            + $image * (float) ($price['image_input'] ?? 0)
            + (int) ($usage['output_tokens'] ?? 0) * (float) ($price['image_output'] ?? 0)) / 1_000_000;
    }
}
