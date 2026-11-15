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

    /**
     * Tagging a page the customer never prepared.
     *
     * Counted because it costs real work — parsing and scanning a whole
     * document — and because a site that tags on every view rather than
     * caching is a site worth noticing.
     */
    public const TAG = 'tags';

    /**
     * What the host keeps for a site beyond the files this package stores (the host's published versions, a
     * website's uploaded files, files a shop sells), counted in the same storage limit. Set by the host
     * (countAlso); none on an install that keeps nothing of its own.
     *
     * @var null|callable(Site): int
     */
    private static $alsoStored = null;

    /**
     * The host's words when a site's storage is full, and where more is bought (sayWhenFull). Without them the
     * refusal is this package's own plain sentence, which names no plan and no price: those are the host's.
     *
     * @var null|callable(Site, int): array{message: string, upgrade?: ?string}
     */
    private static $whenFull = null;

    /** @param  null|callable(Site): int  $count */
    public static function countAlso(?callable $count): void
    {
        self::$alsoStored = $count;
    }

    /** @param  null|callable(Site, int): array{message: string, upgrade?: ?string}  $say */
    public static function sayWhenFull(?callable $say): void
    {
        self::$whenFull = $say;
    }

    /**
     * Every byte the site keeps: the files stored here (`bytes_stored`) and whatever the host keeps for it.
     * One figure, held to one limit (`limits.bytes_stored`).
     */
    public static function stored(Site $site): int
    {
        $also = self::$alsoStored !== null ? max(0, (int) rescue(fn () => (self::$alsoStored)($site), 0, false)) : 0;

        return max(0, (int) $site->bytes_stored) + $also;
    }

    /**
     * The refusal for an upload that does not fit: the host's words (with the page where more storage is got)
     * when it gives them, else a plain sentence. Files already kept are never touched by it.
     */
    public static function full(Site $site, int $bytes = 0): OverLimit
    {
        $said = self::$whenFull !== null ? rescue(fn () => (self::$whenFull)($site, $bytes), null, false) : null;

        if (is_array($said) && trim((string) ($said['message'] ?? '')) !== '') {
            return new OverLimit((string) $said['message'], upgrade: isset($said['upgrade']) ? (string) $said['upgrade'] : null, storage: true);
        }

        return new OverLimit('This site\'s storage is full. Your files are safe; to add more, get more storage.', storage: true);
    }

    /**
     * Give back what a removed or replaced file took. Never below nothing: a figure counted before files were
     * measured as stored (see record) may be smaller than what is freed.
     */
    public static function release(Site $site, int $bytes): void
    {
        if ($bytes <= 0) {
            return;
        }

        Site::query()->where('id', $site->id)->update([
            'bytes_stored' => \DB::raw('CASE WHEN bytes_stored > '.$bytes.' THEN bytes_stored - '.$bytes.' ELSE 0 END'),
        ]);
        $site->bytes_stored = max(0, (int) $site->bytes_stored - $bytes);
    }

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
            'tags' => (int) ($row->tags ?? 0),
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

        // Everything the site keeps (stored), the host's files with this package's, so one limit holds them all.
        if ($bytes > 0 && isset($limits['bytes_stored'])
            && (self::stored($site) + $bytes) > (int) $limits['bytes_stored']) {
            return false;
        }

        return true;
    }

    private static function period(): string
    {
        return Carbon::now()->format('Y-m');
    }
}
