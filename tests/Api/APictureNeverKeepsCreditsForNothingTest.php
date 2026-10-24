<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Application\Api\ImagineAPicture;
use ShipFast\LiveEdit\Domain\Credits\Credits;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Jobs\GeneratePicture;
use ShipFast\LiveEdit\Models\ImageGeneration;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Reported from a self-hosted install: making a picture took the credits and no picture ever came.
 *
 * A picture is paid for when it is queued, and only the job could give the credits back. A job that
 * never ran (no worker) or died partway (a restart, out of memory) left the generation "queued" or
 * "processing" for good, holding five credits for nothing.
 */
class APictureNeverKeepsCreditsForNothingTest extends TestCase
{
    private Site $site;

    private Credits $credits;

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create(['slug' => 'client', 'name' => 'Client', 'allowed_origins' => []]);
        $this->credits = app(Credits::class);
        $this->credits->grant($this->site, 20);
    }

    private function paidFor(string $status, int $secondsAgo): ImageGeneration
    {
        $balance = $this->credits->spend($this->site, 'generate_image', ['prompt' => 'A quiet treatment room']);
        $generation = ImageGeneration::query()->create([
            'uuid' => '4f0156b7-447b-4112-9069-2af126dc87ea',
            'site_id' => $this->site->id,
            'prompt' => 'A quiet treatment room',
            'status' => $status,
            'balance' => $balance,
        ]);
        $generation->forceFill(['created_at' => now()->subSeconds($secondsAgo)])->save();

        return $generation;
    }

    public function test_a_picture_no_worker_ever_made_is_refunded_when_asked_about(): void
    {
        $generation = $this->paidFor('queued', ImagineAPicture::jobSeconds() + 300);
        $this->assertSame(15, $this->credits->balance($this->site));

        $status = app(ImagineAPicture::class)->status($this->site, $generation->uuid);

        $this->assertSame('failed', $status['status']);
        $this->assertSame('timed_out', $status['reason']);
        $this->assertSame(20, $status['balance']);
        $this->assertSame(20, $this->credits->balance($this->site));

        // asked again, it is not refunded twice
        app(ImagineAPicture::class)->status($this->site, $generation->uuid);
        $this->assertSame(20, $this->credits->balance($this->site));
    }

    public function test_a_job_that_died_partway_is_refunded_too(): void
    {
        $generation = $this->paidFor('processing', ImagineAPicture::jobSeconds() + 300);

        app(ImagineAPicture::class)->status($this->site, $generation->uuid);

        $this->assertSame('failed', $generation->fresh()->status);
        $this->assertSame(20, $this->credits->balance($this->site));
    }

    public function test_a_picture_still_within_its_time_is_left_to_finish(): void
    {
        $generation = $this->paidFor('processing', 30);

        $status = app(ImagineAPicture::class)->status($this->site, $generation->uuid);

        $this->assertSame('processing', $status['status']);
        $this->assertSame(15, $this->credits->balance($this->site));
    }

    public function test_a_picture_given_up_while_it_was_being_made_does_not_then_read_as_delivered(): void
    {
        $generation = $this->paidFor('queued', 0);

        // The provider answers only after the generation was given up and refunded.
        $slow = new class(app(Credits::class), $generation->id) extends ImagineAPicture
        {
            public function __construct(Credits $credits, private readonly int $id)
            {
                parent::__construct($credits);
            }

            public function generate(Site $site, string $prompt, int $count = 2): array
            {
                $this->giveUp($this->id, 'timed_out');

                return ['https://images.test/late.png'];
            }
        };

        (new GeneratePicture($generation->id))->handle($slow);

        $this->assertSame('failed', $generation->fresh()->status);
        $this->assertSame(20, $this->credits->balance($this->site));
    }

    public function test_a_job_the_queue_gives_up_on_is_refunded(): void
    {
        $generation = $this->paidFor('processing', 0);

        (new GeneratePicture($generation->id))->failed(new \RuntimeException('worker timed out'));

        $this->assertSame('provider_error', $generation->fresh()->reason);
        $this->assertSame(20, $this->credits->balance($this->site));
    }

    public function test_the_job_is_given_longer_than_the_provider(): void
    {
        config(['live-edit.ai.image_job_timeout' => 150]);

        $this->assertSame(170, (new GeneratePicture(1))->timeout);
    }
}
