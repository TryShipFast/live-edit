<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use ShipFast\LiveEdit\Domain\Site\RenewalNotices;

/**
 * Warn the sites whose editor is about to switch off.
 *
 * Meant for a daily schedule. Running it twice in a day sends nothing the
 * second time: each site records how close to expiry it was last warned, so
 * a notice goes out once per step rather than every morning for a month.
 */
class SendRenewalNotices extends Command
{
    protected $signature = 'live-edit:renewals';

    protected $description = 'Email the editors of any site whose licence is running out';

    public function handle(): int
    {
        $sites = RenewalNotices::send();

        $this->info($sites === 0
            ? 'No renewal notices were due.'
            : 'Warned '.$sites.' '.str('site')->plural($sites).'.');

        return self::SUCCESS;
    }
}
