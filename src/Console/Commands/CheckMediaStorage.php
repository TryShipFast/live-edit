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

    /** Written and read back. Any difference is a disk that cannot be trusted with a photograph. */
    private const CANARY = 'live-edit storage check';

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

            /*
             * Every value the disk reads, including the credentials.
             *
             * The first version left the credentials out entirely, which
             * answered the wrong question. Somebody looking at this is asking
             * "which of these did not arrive", and the two likeliest answers
             * were the two being hidden - so the list could say everything
             * looked fine while the key was empty.
             *
             * Shown as "(set)" rather than as themselves. That is the whole of
             * what is being asked and it gives nothing away.
             */
            $secret = ['key', 'secret', 'token', 'password'];

            foreach ($defined as $setting => $value) {
                $arrived = is_scalar($value) && (string) $value !== '';

                $this->line(sprintf(
                    '    %-28s %s',
                    $setting,
                    match (true) {
                        ! $arrived => '(empty)',
                        in_array($setting, $secret, true) => '(set)',
                        default => (string) $value,
                    }
                ));
            }

            $this->newLine();
            $this->line('  Every value this disk reads is above. Anything marked (empty) is not');
            $this->line('  in this environment, and the SDK reports one missing value at a time,');
            $this->line('  so fixing the one it named may not be the end of it.');

            return self::FAILURE;
        }

        try {
            $written = $filesystem->put($path, self::CANARY);
            $there = $written !== false && $filesystem->exists($path);
            $same = $there && $filesystem->get($path) === self::CANARY;

            if (! $same) {
                /*
                 * Laravel's disks are configured with throw => false, so a
                 * refused write returns false and a missing object reads as
                 * null. The first version of this check inherited exactly the
                 * silence it exists to break: it said "written and could not
                 * be read back", which was a guess - nothing had been written,
                 * and whatever the bucket said was discarded before anybody
                 * saw it.
                 *
                 * So when a step fails, ask again with throw => true and print
                 * what comes back.
                 */
                $this->error(match (true) {
                    $written === false => 'The disk refused the write.',
                    ! $there => 'The disk accepted the write and the object is not there.',
                    default => 'The object was stored and did not read back unchanged.',
                });

                $reason = $this->reasonFrom($defined, $path);

                $this->newLine();

                if ($reason !== null) {
                    // What the bucket said, and then nothing else. A guess
                    // printed underneath a real answer contradicts it: the
                    // first run of this said "usually permissions" below S3
                    // explaining, in its own words, that the region was wrong.
                    $this->line('  '.trim($reason));

                    $this->whoIsBeingDenied($defined, $reason);
                } else {
                    $this->line('  No reason was given. It is usually permissions: the credentials');
                    $this->line('  reach the bucket and are not allowed to put an object in it.');
                }

                $this->newLine();
                $this->line('  Nothing was stored either way.');

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

    /**
     * What the disk says when it is allowed to say it.
     *
     * The same write, on the same configuration, with throw turned on. Null
     * when there is nothing to rebuild from - a faked disk in a test, or one
     * resolved by something other than the config - in which case the sentence
     * above is all there is, which is still more than there was.
     */
    private function reasonFrom(?array $defined, string $path): ?string
    {
        if ($defined === null || ($defined['driver'] ?? null) === null) {
            return null;
        }

        try {
            Storage::build(array_merge($defined, ['throw' => true]))->put($path, self::CANARY);
        } catch (\Throwable $e) {
            return $e->getMessage();
        }

        // It worked the second time, which is its own answer: whatever failed
        // was not the configuration.
        return null;
    }

    /**
     * Which identity the bucket is refusing.
     *
     * "Access Denied" does not say who was denied, and the commonest cause of
     * a policy that looks correct is that it was attached to a different user
     * from the one whose keys are in this environment. Nobody can see that by
     * reading either half: the policy looks right, the key looks right, and
     * they belong to different people.
     *
     * So the same credentials are asked who they are. Every identity may call
     * this - it is not a permission anybody has to grant - and the answer is an
     * ARN, which is exactly the thing to compare against the policy.
     */
    private function whoIsBeingDenied(?array $defined, string $reason): void
    {
        if (! str_contains($reason, 'AccessDenied') && ! str_contains($reason, 'Access Denied')) {
            return;
        }

        if (($defined['driver'] ?? null) !== 's3' || ! class_exists(\Aws\Sts\StsClient::class)) {
            return;
        }

        try {
            $sts = new \Aws\Sts\StsClient([
                'version' => 'latest',
                'region' => $defined['region'] ?? 'us-east-1',
                'credentials' => [
                    'key' => $defined['key'] ?? '',
                    'secret' => $defined['secret'] ?? '',
                ],
            ]);

            $who = $sts->getCallerIdentity();

            $this->newLine();
            $this->line('  These credentials are:');
            $this->line('    '.(string) $who->get('Arn'));
            $this->line('  The policy has to be on that identity, and allow s3:PutObject on');
            $this->line('  arn:aws:s3:::'.($defined['bucket'] ?? '<bucket>').'/'.trim((string) config('live-edit.directory', ''), '/').'/*');

            $this->whoOwnsTheBucket($defined, (string) $who->get('Account'));
        } catch (\Throwable $e) {
            $this->newLine();
            $this->line('  The credentials could not say who they are: '.$e->getMessage());
        }
    }

    /**
     * Whether the bucket is even in the account those credentials belong to.
     *
     * The question that no amount of reading an IAM policy answers, and the one
     * that makes a correct policy still fail. For a bucket in another account,
     * a permission granted to your own user means nothing: the bucket's own
     * policy has to name that user as a principal, and until it does every
     * write is denied with exactly the message a missing permission gives.
     *
     * Asked by listing: a bucket in this account appears, one in another
     * account does not, whatever anybody has been granted on it.
     *
     * Not every set of credentials may list buckets, and that is not a fault
     * worth reporting as one - it is a permission most policies leave out. Then
     * the answer is "could not tell", which is still better than an assumption.
     */
    private function whoOwnsTheBucket(array $defined, string $account): void
    {
        $bucket = (string) ($defined['bucket'] ?? '');

        if ($bucket === '' || ! class_exists(\Aws\S3\S3Client::class)) {
            return;
        }

        try {
            $client = new \Aws\S3\S3Client([
                'version' => 'latest',
                'region' => $defined['region'] ?? 'us-east-1',
                'credentials' => [
                    'key' => $defined['key'] ?? '',
                    'secret' => $defined['secret'] ?? '',
                ],
            ]);

            $names = array_map(
                fn ($held) => (string) ($held['Name'] ?? ''),
                (array) $client->listBuckets()->get('Buckets')
            );
        } catch (\Throwable $e) {
            $this->newLine();
            $this->line('  Whether that bucket is in account '.$account.' could not be checked:');
            $this->line('    these credentials may not list buckets ('.class_basename($e).').');
            $this->line('  Confirm by hand: S3 shows only the current account\'s buckets, so if');
            $this->line('  "'.$bucket.'" is not in that list it belongs to another account, and an');
            $this->line('  IAM policy on your own user cannot grant access to it.');

            return;
        }

        $this->newLine();

        if (in_array($bucket, $names, true)) {
            $this->line('  The bucket "'.$bucket.'" is in account '.$account.', so a policy on the');
            $this->line('  identity above is the right place for this. What is left is an explicit');
            $this->line('  Deny, a permissions boundary, or KMS: run IAM\'s policy simulator on');
            $this->line('  that user with s3:PutObject, which names the statement responsible.');

            return;
        }

        $this->line('  The bucket "'.$bucket.'" is NOT in account '.$account.'.');
        $this->line('  That is the whole fault: a permission granted to your own user means');
        $this->line('  nothing on somebody else\'s bucket. Its own bucket policy has to name');
        $this->line('  that identity as a principal, and until it does every write is refused');
        $this->line('  with exactly the message a missing permission gives.');
    }
}
