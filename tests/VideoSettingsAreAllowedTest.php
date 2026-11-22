<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Content\EditPolicy;

class VideoSettingsAreAllowedTest extends TestCase
{
    public function test_a_declared_video_and_its_poster_can_be_saved(): void
    {
        config()->set('live-edit.auto_keys', false);
        config()->set('live-edit.videos', ['heroFilm']);

        $policy = new EditPolicy;

        $this->assertTrue($policy->permitsKey('heroFilm'));
        $this->assertTrue($policy->permitsKey('heroFilmPoster'));
        $this->assertFalse($policy->permitsKey('unlistedFilm'));
    }
}
