<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * What each site's own files really take, measured on the disk and written to `bytes_stored`.
 *
 * The figure was counted as files arrived, at the size they arrived (a camera's original), while what is kept is the
 * picture made fit for a page; and nothing was ever given back. This puts every site right once, from what is really
 * there, and is safe to run again. It only measures and writes the figure: no file is touched.
 */
class RecountStorage extends Command
{
    protected $signature = 'live-edit:recount-storage {site?* : Site ids (every site when none)} {--dry-run : Say what each would become without writing it}';

    protected $description = 'Measure each site\'s stored files on the disk and correct its storage figure';

    public function handle(): int
    {
        $disk = Storage::disk((string) config('live-edit.disk', 'public'));
        $ids = array_map('intval', (array) $this->argument('site'));
        $changed = 0;

        Site::query()->when($ids !== [], fn ($query) => $query->whereIn('id', $ids))->each(function (Site $site) use ($disk, &$changed): void {
            $directory = (new SiteStore($site))->mediaDirectory();
            $measured = 0;

            foreach ($disk->allFiles($directory) as $file) {
                $measured += (int) rescue(fn () => $disk->size($file), 0, false);
            }

            $was = (int) $site->bytes_stored;
            if ($was === $measured) {
                return;
            }

            $this->line(sprintf('%s site %d (%s): %d to %d bytes', $this->option('dry-run') ? 'Would set' : 'Set', $site->id, $site->slug, $was, $measured));

            if (! $this->option('dry-run')) {
                Site::query()->whereKey($site->id)->update(['bytes_stored' => $measured]);
            }
            $changed++;
        });

        $this->info($changed.' site(s) '.($this->option('dry-run') ? 'would change.' : 'corrected.'));

        return self::SUCCESS;
    }
}
