<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use ShipFast\LiveEdit\Models\Version;
use ShipFast\LiveEdit\Support\DraftStore;

/**
 * Reading and restoring published versions from the command line.
 *
 * The editor will grow a history panel, but a rollback is the thing you want at
 * the moment the site is wrong and nobody can sign in.
 */
class Versions extends Command
{
    protected $signature = 'live-edit:versions {--restore= : Put this version back}';

    protected $description = 'List published versions, or restore one';

    public function handle(): int
    {
        if ($number = $this->option('restore')) {
            $changed = DraftStore::restore((int) $number);

            if ($changed === null) {
                $this->components->error("No version {$number} was ever published.");

                return self::FAILURE;
            }

            $this->components->info("Restored version {$number}: {$changed} value(s) changed, published as v".Version::query()->max('number').'.');

            return self::SUCCESS;
        }

        $versions = Version::query()->orderByDesc('number')->limit(20)->get();

        if ($versions->isEmpty()) {
            $this->components->info('Nothing has been published yet.');

            return self::SUCCESS;
        }

        $this->table(
            ['Version', 'Published', 'Changes', 'Locales', 'Note'],
            $versions->map(fn (Version $v) => [
                'v'.$v->number,
                $v->created_at?->diffForHumans(),
                $v->changes,
                implode(', ', array_keys($v->locales ?? [])),
                $v->restored_from ? 'restored v'.$v->restored_from : '',
            ])->all()
        );

        return self::SUCCESS;
    }
}
