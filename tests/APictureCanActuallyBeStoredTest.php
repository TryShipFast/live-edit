<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Storage;

/**
 * Whether this host can store a picture at all, asked before a client asks.
 *
 * Replacing an image is the one editor action that leaves the database and
 * touches a filesystem, and it fails differently on every host: a read-only
 * application directory, a bucket whose credentials moved, a disk named in one
 * environment and not the next. The route had no answer for any of it, so the
 * person replacing a photograph got a failed request and the body
 * {"message":"Server Error"} - indistinguishable, from where they sit, from
 * the editor being broken.
 *
 * Two things came out of that. The route now says what happened, and this
 * command answers the question without waiting for somebody to try.
 */
class APictureCanActuallyBeStoredTest extends TestCase
{
    public function test_it_passes_on_a_disk_that_works(): void
    {
        Storage::fake('pictures');
        config()->set('live-edit.disk', 'pictures');

        $this->artisan('live-edit:check-media')
            ->expectsOutputToContain('can be stored')
            ->assertSuccessful();
    }

    public function test_it_leaves_nothing_behind(): void
    {
        // A check that litters a customer's bucket with test files is a check
        // somebody turns off.
        Storage::fake('pictures');
        config()->set('live-edit.disk', 'pictures');

        $this->artisan('live-edit:check-media')->assertSuccessful();

        $this->assertSame([], Storage::disk('pictures')->allFiles());
    }

    public function test_a_disk_that_does_not_exist_is_named(): void
    {
        /*
         * The likeliest misconfiguration, and the one whose native message
         * sends people to the wrong file. "Disk [s3] does not have a
         * configured driver" reads as a bug in this package rather than as a
         * line missing from the host's filesystems config.
         */
        config()->set('live-edit.disk', 'nowhere');

        $this->artisan('live-edit:check-media')
            ->expectsOutputToContain('no disk called "nowhere"')
            ->assertFailed();
    }

    public function test_a_configured_disk_that_will_not_build_is_not_called_missing(): void
    {
        /*
         * Two quite different faults, and the first version of this command
         * called both of them the same thing.
         *
         * A disk absent from the config is a name to change. A disk that is in
         * the config and will not build is a missing adapter package, or a
         * value the driver needs and has not been given - and being told
         * "there is no disk called s3" while looking at an s3 block in
         * filesystems.php sends somebody hunting through the wrong file.
         *
         * Both happened on the same host within an hour: first the flysystem
         * adapter was not installed, then the region was empty.
         */
        config()->set('filesystems.disks.wonky', ['driver' => 'no-such-driver']);
        config()->set('live-edit.disk', 'wonky');

        $this->artisan('live-edit:check-media')
            ->expectsOutputToContain('is configured, and could not be built')
            ->assertFailed();
    }

    public function test_it_lists_what_the_disk_reads_without_printing_a_secret(): void
    {
        /*
         * Including the credentials, as "(set)".
         *
         * Leaving them out answered the wrong question. Somebody reading this
         * is asking which value did not arrive, and the two likeliest answers
         * were the two being hidden - so the list could look complete while
         * the key was empty.
         */
        config()->set('filesystems.disks.wonky', [
            'driver' => 'no-such-driver',
            'region' => '',
            'key' => 'AKIAREALLOOKINGKEY',
            'secret' => 'a-real-looking-secret',
        ]);
        config()->set('live-edit.disk', 'wonky');

        // One substring per assertion, not two: each is consumed by the line
        // that matches it, and several of these land on the same line.
        $this->artisan('live-edit:check-media')
            ->expectsOutputToContain(sprintf('%-28s %s', 'region', '(empty)'))
            ->expectsOutputToContain(sprintf('%-28s %s', 'key', '(set)'))
            ->expectsOutputToContain(sprintf('%-28s %s', 'secret', '(set)'))
            ->doesntExpectOutputToContain('AKIAREALLOOKINGKEY')
            ->doesntExpectOutputToContain('a-real-looking-secret')
            ->assertFailed();
    }

    public function test_it_says_which_disk_it_is_talking_about(): void
    {
        // Printed whatever the outcome. Half of diagnosing this is finding out
        // that the disk being written to is not the one anybody assumed.
        Storage::fake('pictures');
        config()->set('live-edit.disk', 'pictures');

        $this->artisan('live-edit:check-media')
            ->expectsOutputToContain('pictures')
            ->assertSuccessful();
    }
}
