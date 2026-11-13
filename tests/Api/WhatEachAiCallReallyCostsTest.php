<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Application\Api\AssistWithText;
use ShipFast\LiveEdit\Domain\Credits\Credits;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\AiCost;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Owner, 13 Nov 2026: "please fix the real cost ... we need to be sure of the prices since image is not same as
 * text". Every paid call to the AI provider is kept with what it really cost, so credit prices are set per kind of
 * work from facts.
 */
class WhatEachAiCallReallyCostsTest extends TestCase
{
    private const PRICES = [
        'test-model' => ['input' => 0.15, 'cached' => 0.075, 'output' => 0.60],
        'gpt-image-1' => ['text_input' => 5.00, 'image_input' => 10.00, 'image_output' => 40.00],
        'dall-e-3' => ['picture' => 0.04],
    ];

    public function test_a_picture_costs_its_tokens_and_dall_e_its_price_a_picture(): void
    {
        config()->set('live-edit.ai.prices', self::PRICES);

        // two 1024x1024 pictures at high quality: about $0.33, far more than a chat message
        $this->assertEqualsWithDelta(0.33374, AiCost::ofPictures('gpt-image-1', ['input_tokens_details' => ['text_tokens' => 60, 'image_tokens' => 0], 'output_tokens' => 8336], 2), 0.000001);
        $this->assertEqualsWithDelta(0.04, AiCost::ofPictures('dall-e-3', [], 1), 0.000001);
        // a model with no price is kept at nothing rather than guessed
        $this->assertSame(0.0, AiCost::ofPictures('unknown', ['output_tokens' => 1000], 1));
    }

    public function test_words_cost_their_tokens_with_the_cached_part_cheaper(): void
    {
        config()->set('live-edit.ai.prices', self::PRICES);

        $this->assertEqualsWithDelta(0.00018, AiCost::ofTokens('test-model', ['prompt_tokens' => 1000, 'prompt_tokens_details' => ['cached_tokens' => 400], 'completion_tokens' => 100]), 0.0000001);
    }

    public function test_a_rewrite_keeps_what_it_cost_against_its_site(): void
    {
        $site = Site::query()->create(['slug' => 'client', 'name' => 'Client', 'allowed_origins' => []]);
        config()->set('live-edit.ai', ['enabled' => true, 'endpoint' => 'https://api.openai.test/v1/chat/completions', 'model' => 'test-model', 'api_key' => 'test-key-not-real', 'timeout' => 5, 'prices' => self::PRICES]);
        app(Credits::class)->grant($site, 5);
        Http::fake(['*' => Http::response(['choices' => [['message' => ['content' => 'Same-day care.']]], 'usage' => ['prompt_tokens' => 1000, 'completion_tokens' => 100]], 200)]);

        app(AssistWithText::class)($site, 'rewrite', 'Family care, close to home.');

        $cost = AiCost::query()->sole();
        $this->assertSame($site->id, $cost->site_id);
        $this->assertSame('rewrite', $cost->kind);
        $this->assertSame('test-model', $cost->model);
        $this->assertEqualsWithDelta(0.00021, $cost->cost_usd, 0.0000001);
    }
}
