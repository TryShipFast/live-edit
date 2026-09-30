<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Prove that a picture can actually be stored on this host.
 *
 * Replacing an image is the one editor action that leaves the database and
 * touches a filesystem, and it is the one that fails differently on every
 * host: a read-only application directory, a bucket whose credentials moved,
 * a disk name that exists in one environment and not the next. When it fails
 * the person editing sees a failed request and nothing else, and from the
 * outside that is indistinguishable from the editor being broken.
 *
 * So: write a few bytes, read them back, delete them, and say what happened.
 * One command, run wherever the application runs, and a question that used to
 * need somebody's log becomes an answer.
 */
class CheckMediaStorage extends Command
{
    protected $signature = 'live-edit:check-media';

    protected $description = 'Write, read back and delete a test file on the disk pictures are stored on';

    public function handle(): int
    {
        $disk = (string) config('live-edit.disk', 'public');
        $directory = trim((string) config('live-edit.directory', 'live-edit'), '/');
        $path = $directory.'/.check-'.bin2hex(random_bytes(6));

        $this->line("disk       {$disk}");
        $this->line("directory  {$directory}");
        $this->line('media url  '.((string) config('live-edit.media_url', '') ?: '(the disk answers for itself)'));
        $this->newLine();

        $defined = config("filesystems.disks.{$disk}");

        try {
            $filesystem = Storage::disk($disk);
        } catch (\Throwable $e) {
            /*
             * Two quite different faults, and the first version of this
             * command called both of them the same thing.
             *
             * A disk that is not in the config at all is a typo or a variable
             * pointing somewhere that does not exist. A disk that IS in the
             * config and will not build is a missing adapter package or a
             * setting the driver needs and has not been given - and being told
             * "there is no disk called s3" while looking at an s3 block in
             * filesystems.php sends somebody hunting for the wrong thing.
             * Both were seen within an hour of each other on the same host.
             */
            if ($defined === null) {
                $this->error("There is no disk called \"{$disk}\" in this application's filesystems config.");
                $this->line('  '.$e->getMessage());
                $this->line('  Set LIVE_EDIT_DISK to one that exists, or define that one.');

                return self::FAILURE;
            }

            $this->error("The disk \"{$disk}\" is configured, and could not be built:");
            $this->newLine();
            $this->line('  '.trim($e->getMessage()));
            $this->newLine();
            $this->line('  The disk exists in config/filesystems.php, so this is not a name to');
            $this->line('  change. Either its driver package is not installed, or one of the');
            $this->line('  values it reads from the environment is empty here. What it reads:');
            $this->newLine();

            foreach ($defined as $setting => $value) {
                // Never the values: two of them are credentials. Whether each
                // one arrived is the whole question and gives nothing away.
                if (in_array($setting, ['key', 'secret', 'token'], true)) {
                    continue;
                }

                $this->line(sprintf(
                    '    %-28s %s',
                    $setting,
                    is_scalar($value) && (string) $value !== '' ? (string) $value : '(empty)'
                ));
            }

            return self::FAILURE;
        }

        try {
            $filesystem->put($path, 'live-edit storage check');

            $read = $filesystem->get($path);

            if ($read !== 'live-edit storage check') {
                // Written and came back different, or not at all. Rare, and
                // worth its own sentence: a disk that accepts a write and
                // loses it is a worse fault than one that refuses.
                $this->error('The file was written and could not be read back unchanged.');

                return self::FAILURE;
            }

            $filesystem->delete($path);
        } catch (\Throwable $e) {
            $this->error('A picture could not be stored on this host.');
            $this->line('  '.$e->getMessage());
            $this->newLine();
            $this->line('  This is what the editor hits when replacing an image fails. On a');
            $this->line('  platform with a read-only application directory, or one that replaces');
            $this->line('  its containers on deploy, the local disk is not somewhere a client\'s');
            $this->line('  photographs can live: point LIVE_EDIT_DISK at a bucket, and');
            $this->line('  LIVE_EDIT_MEDIA_URL at whatever serves it.');

            return self::FAILURE;
        }

        $this->info('Pictures can be stored, read back and removed on this host.');

        return self::SUCCESS;
    }
}
