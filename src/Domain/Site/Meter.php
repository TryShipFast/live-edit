<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Support\Carbon;
use ShipFast\LiveEdit\Models\SiteUsage;

/**
 * Counting what a site used, so it can be billed for it.
 *
 * Only the things that cost something to do are counted. Reads are not: they
 * are cached, served from a CDN, and never touch this application on a busy
 * site — charging for them would bill a customer for the work done to avoid
 * work, and would quietly punish the sites that behave best.
 *
 * Counters are moved with an atomic increment rather than read-then-write. Two
 * editors saving at the same moment must not each read 4 and both write 5; an
 * invoice built on lost updates is one nobody can defend.
 */
class Meter
{
    public const WRITE = 'writes';

    public const PUBLISH = 'publishes';

    public const UPLOAD = 'uploads';

    /** Record one billable act, and any bytes it put into storage. */
    public static function record(Site $site, string $kind, int $bytes = 0): void
    {
        $period = self::period();

        // Ensure the row exists without overwriting counters if it does.
        SiteUsage::query()->firstOrCreate(['site_id' => $site->id, 'period' => $period]);

        SiteUsage::query()
            ->where('site_id', $site->id)
            ->where('period', $period)
            ->increment($kind, 1, $bytes > 0 ? ['bytes_added' => \DB::raw("bytes_added + {$bytes}")] : []);

        $site->forceFill(['last_active_at' => now()]);

        if ($bytes > 0) {
            // Storage is the one figure that is cumulative rather than
            // monthly: what a customer is storing now is what they pay to
            // keep, regardless of when they uploaded it.
            Site::query()->where('id', $site->id)->increment('bytes_stored', $bytes);
        }

        $site->saveQuietly();
    }

    /**
     * What a site has used this period.
     *
     * @return array{period: string, writes: int, publishes: int, uploads: int, bytes_added: int, bytes_stored: int}
     */
    public static function current(Site $site): array
    {
        return self::forPeriod($site, self::period());
    }

    /** @return array<string, mixed> */
    public static function forPeriod(Site $site, string $period): array
    {
        $row = SiteUsage::query()->where('site_id', $site->id)->where('period', $period)->first();

        return [
            'period' => $period,
            'writes' => (int) ($row->writes ?? 0),
            'publishes' => (int) ($row->publishes ?? 0),
            'uploads' => (int) ($row->uploads ?? 0),
            'bytes_added' => (int) ($row->bytes_added ?? 0),
            'bytes_stored' => (int) $site->bytes_stored,
        ];
    }

    /**
     * Whether this site may do one more of something.
     *
     * A site with no limits set is always allowed. A limit nobody configured
     * must never be the reason a customer cannot save their own words.
     */
    public static function allows(Site $site, string $kind, int $bytes = 0): bool
    {
        $limits = $site->limits ?? [];

        if ($limits === []) {
            return true;
        }

        $used = self::current($site);

        if (isset($limits[$kind]) && $used[$kind] >= (int) $limits[$kind]) {
            return false;
        }

        if ($bytes > 0 && isset($limits['bytes_stored'])
            && ($used['bytes_stored'] + $bytes) > (int) $limits['bytes_stored']) {
            return false;
        }

        return true;
    }

    private static function period(): string
    {
        return Carbon::now()->format('Y-m');
    }
}
