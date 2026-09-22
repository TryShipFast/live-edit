<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneOrphanedUploads extends Command
{
    protected $signature = 'live-edit:prune-orphans {--dry-run : List orphans without deleting them}';

    protected $description = 'Delete uploaded live-edit images that no setting or record references any more';

    public function handle(): int
    {
        $disk = Storage::disk(config('live-edit.disk'));
        $directory = config('live-edit.directory');
        $settingModel = config('live-edit.setting_model');

        $referenced = $settingModel::query()->pluck('value')
            ->merge(collect(config('live-edit.models'))
                ->filter(fn (array $definition) => isset($definition['image_field']))
                ->flatMap(fn (array $definition) => $definition['class']::query()->pluck($definition['image_field'])))
            ->filter()
            ->flip();

        $orphans = collect($disk->files($directory))
            ->reject(fn (string $file) => $referenced->has($file));

        if ($orphans->isEmpty()) {
            $this->info('No orphaned uploads.');

            return self::SUCCESS;
        }

        foreach ($orphans as $file) {
            $this->line(($this->option('dry-run') ? '[dry-run] ' : 'deleting ').$file);
        }

        if (! $this->option('dry-run')) {
            $disk->delete($orphans->all());
        }

        $this->info($orphans->count().' orphan(s) '.($this->option('dry-run') ? 'found.' : 'deleted.'));

        return self::SUCCESS;
    }
}
