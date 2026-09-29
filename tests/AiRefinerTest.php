<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Mapper\AiRefiner;
use ShipFast\LiveEdit\Mapper\MarkupScanner;

class AiRefinerTest extends TestCase
{
    protected function enableAi(): void
    {
        config()->set('live-edit.ai.mapper', true);
        config()->set('live-edit.ai.api_key', 'sk-test');
        config()->set('live-edit.ai.endpoint', 'https://api.openai.com/v1/chat/completions');
        config()->set('live-edit.ai.model', 'gpt-test');
    }

    protected function fakeChat(array $items): void
    {
        Http::fake([
            '*' => Http::response([
                'choices' => [[
                    'message' => ['content' => json_encode(['items' => $items])],
                ]],
            ]),
        ]);
    }

    public function test_it_is_disabled_without_a_key(): void
    {
        config()->set('live-edit.ai.mapper', true);
        config()->set('live-edit.ai.api_key', null);

        $this->assertFalse(app(AiRefiner::class)->enabled());
    }

    public function test_it_rewrites_keys_and_labels_from_the_model(): void
    {
        $this->enableAi();
        $this->fakeChat([
            ['i' => 0, 'key' => 'heroHeadline', 'label' => 'Hero headline'],
            ['i' => 1, 'key' => 'heroLead', 'label' => 'Hero lead'],
        ]);

        $candidates = (new MarkupScanner)->scan('<section><h1>Ship faster</h1><p>Do more today.</p></section>')['candidates'];
        $refined = app(AiRefiner::class)->refine($candidates);

        $this->assertSame('heroHeadline', $refined[0]['key']);
        $this->assertSame('Hero headline', $refined[0]['label']);
        $this->assertSame('heroLead', $refined[1]['key']);
    }

    public function test_it_never_adds_or_drops_candidates(): void
    {
        $this->enableAi();
        // model returns extra + missing indexes; refiner must stay 1:1 with input
        $this->fakeChat([
            ['i' => 0, 'key' => 'renamed'],
            ['i' => 99, 'key' => 'ghost'],
        ]);

        $candidates = (new MarkupScanner)->scan('<h1>A</h1><p>B</p>')['candidates'];
        $refined = app(AiRefiner::class)->refine($candidates);

        $this->assertCount(count($candidates), $refined);
        $this->assertSame('renamed', $refined[0]['key']);
    }

    public function test_it_falls_back_to_deterministic_on_api_failure(): void
    {
        $this->enableAi();
        Http::fake(['*' => Http::response('nope', 500)]);

        $candidates = (new MarkupScanner)->scan('<h1>Original heading</h1>')['candidates'];
        $refined = app(AiRefiner::class)->refine($candidates);

        $this->assertSame($candidates[0]['key'], $refined[0]['key']);
    }

    public function test_it_sanitises_unsafe_keys_from_the_model(): void
    {
        $this->enableAi();
        $this->fakeChat([['i' => 0, 'key' => 'hero title!! <script>']]);

        $candidates = (new MarkupScanner)->scan('<h1>Hi</h1>')['candidates'];
        $refined = app(AiRefiner::class)->refine($candidates);

        $this->assertMatchesRegularExpression('/^[a-zA-Z0-9]+$/', $refined[0]['key']);
        $this->assertSame('heroTitleScript', $refined[0]['key']);
    }

    public function test_every_element_in_a_band_gets_that_bands_region(): void
    {
        $this->enableAi();
        // The fake answers both passes: element naming and the region pass.
        Http::fake(['*' => Http::response([
            'choices' => [[
                'message' => ['content' => json_encode([
                    'items' => [['i' => 0, 'label' => 'Headline']],
                    'bands' => [['band' => 0, 'region' => 'Features']],
                ])],
            ]],
        ])]);

        $candidates = (new MarkupScanner)->scan('<section><h1>A</h1><p>B</p><p>C</p></section>')['candidates'];
        $refined = app(AiRefiner::class)->refine($candidates);

        // One band in the markup, so the editor is told one region for all of it.
        $this->assertSame(['Features'], array_values(array_unique(array_column($refined, 'region'))));
    }

    public function test_a_band_html_already_names_gets_no_region(): void
    {
        $this->enableAi();
        // If the model is asked about a <header> at all, this answers it. The
        // point of the test is that the answer never reaches the candidate.
        Http::fake(['*' => Http::response([
            'choices' => [[
                'message' => ['content' => json_encode([
                    'items' => [['i' => 0, 'label' => 'Headline']],
                    'bands' => [['band' => 0, 'region' => 'Announcement']],
                ])],
            ]],
        ])]);

        $candidates = (new MarkupScanner)->scan('<header><h1>A</h1></header>')['candidates'];
        $refined = app(AiRefiner::class)->refine($candidates);

        /*
         * The editor names a <header> from the tag, in its own vocabulary. A
         * region here could only restate that or contradict it, and for <nav>
         * it used to contradict it: "Navigation" against the panel's "Menu".
         */
        $this->assertArrayNotHasKey('region', array_filter($refined[0], fn ($v) => $v !== null));
    }

    public function test_disabled_refiner_returns_candidates_untouched_and_calls_nothing(): void
    {
        Http::fake();
        config()->set('live-edit.ai.mapper', false);

        $candidates = (new MarkupScanner)->scan('<h1>Hi</h1>')['candidates'];
        $refined = app(AiRefiner::class)->refine($candidates);

        $this->assertSame($candidates, $refined);
        Http::assertNothingSent();
    }
}
