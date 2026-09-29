<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\AiRefiner;

/**
 * Switching the editor's AI off must not change what the mapper does.
 *
 * They shared one flag. `live-edit.ai.enabled` gates the editor's rewrite,
 * shorten and image generation, which is what a customer spends credits on
 * and what costs us money, and it also gated the mapper's optional naming
 * pass.
 *
 * So turning AI off to stop paying for pictures would quietly have changed
 * what a tagging plan came back with. The two events are far enough apart
 * that nobody would have connected them: somebody edits an environment file
 * on a Tuesday and a tagging run produces different key names in November.
 */
class TheMapperHasItsOwnAiSwitchTest extends TestCase
{
    public function test_the_mapper_stays_off_when_the_editor_ai_is_on(): void
    {
        config()->set('live-edit.ai.enabled', true);
        config()->set('live-edit.ai.api_key', 'sk-not-a-real-key');
        config()->set('live-edit.ai.mapper', false);

        $this->assertFalse(app(AiRefiner::class)->enabled());
    }

    public function test_the_mapper_can_be_on_while_the_editor_ai_is_off(): void
    {
        // The other direction matters too: somebody tagging a new site is not
        // necessarily selling the editor's AI to anybody.
        config()->set('live-edit.ai.enabled', false);
        config()->set('live-edit.ai.api_key', 'sk-not-a-real-key');
        config()->set('live-edit.ai.mapper', true);

        $this->assertTrue(app(AiRefiner::class)->enabled());
    }

    public function test_it_is_off_by_default(): void
    {
        // Three switches deep, on purpose: this config value, an API key, and
        // --ai typed on the command line. It never runs on a customer's site.
        $this->assertFalse((bool) config('live-edit.ai.mapper'));
    }

    public function test_a_switch_without_a_key_is_still_off(): void
    {
        // Both, not either. A flag on with no key would mean every scan tries
        // a call that cannot succeed and falls back, slowly.
        config()->set('live-edit.ai.mapper', true);
        config()->set('live-edit.ai.api_key', null);

        $this->assertFalse(app(AiRefiner::class)->enabled());
    }
}
