<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use ShipFast\LiveEdit\Domain\Team\SectionLocks;

/**
 * Clears section locks nobody has touched for longer than the limit.
 *
 * Not needed for correctness: a lapsed lock is already ignored when it is read
 * or claimed. This only keeps the table small, and it runs on the schedule
 * (every ten minutes) rather than on any request. Unpublished changes are
 * drafts and are never touched here.
 */
class PruneSectionLocks extends Command
{
    protected $signature = 'live-edit:prune-locks';

    protected $description = 'Clear team-editing section locks that have lapsed';

    public function handle(): int
    {
        $this->info('Cleared '.SectionLocks::prune().' lapsed section lock(s).');

        return self::SUCCESS;
    }
}
