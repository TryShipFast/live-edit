<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;

/**
 * The last save that failed, read back where somebody can see it.
 *
 * The log is the right place for an exception and not always a reachable one.
 * On a managed host it means a dashboard, a time range, and a search through
 * every customer's lines - while `php artisan` is right there, and is how an
 * afternoon of diagnosis actually got done.
 *
 * So the last failure is kept in one slot and printed by this. Not a log, not
 * a replacement for one: one failure, the most recent, enough to say what
 * threw and where without anybody opening a browser.
 */
class LastSaveFailure extends Command
{
    protected $signature = 'live-edit:last-failure';

    protected $description = 'Print the most recent save failure, with what threw and where';

    public function handle(): int
    {
        $held = cache()->get('live-edit.last-save-failure');

        if (! is_array($held)) {
            $this->info('No save has failed in the last day.');
            $this->line('  Either nothing has gone wrong, or the cache was cleared since it did.');

            return self::SUCCESS;
        }

        $this->line('when   '.($held['at'] ?? '?'));
        $this->line('site   '.($held['site'] ?? '?'));
        $this->line('key    '.($held['key'] ?? '?'));
        $this->line('disk   '.($held['disk'] ?? '?'));
        $this->newLine();
        $this->error(($held['thrown'] ?? 'Exception').':');
        $this->line('  '.trim((string) ($held['reason'] ?? '')));

        $where = (array) ($held['where'] ?? []);

        if ($where !== []) {
            // Laravel's own frames removed: thirty of them say the request was
            // dispatched, which nobody is in doubt about.
            $this->newLine();
            $this->line('thrown from');

            foreach ($where as $file) {
                $this->line('  '.$file);
            }
        }

        return self::SUCCESS;
    }
}
