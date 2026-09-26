<?php

namespace ShipFast\LiveEdit\Domain\Credits;

use Illuminate\Support\Facades\DB;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * What an AI action costs, and whether this site can pay for it.
 *
 * The rule the whole thing hangs on: credits come off BEFORE the work is done,
 * and only if there are enough. Charging afterwards means a failed call has
 * already been paid for, and charging optimistically means two tabs can each
 * spend the last credit.
 *
 * So a spend is one transaction that locks the site's row, counts what is
 * there, and refuses rather than going negative. A balance that can go below
 * zero is a balance somebody can argue with.
 */
class Credits
{
    /** What each action costs, from the pricing page. One list, one truth. */
    public const COSTS = [
        'rewrite' => 1,
        'shorten' => 1,
        'translate_block' => 2,
        'generate_image' => 5,
        'translate_page' => 10,
    ];

    public function costOf(string $action): int
    {
        return self::COSTS[$action] ?? 0;
    }

    public function balance(Site $site): int
    {
        return (int) CreditEntry::query()->where('site_id', $site->id)->sum('delta');
    }

    /**
     * Take credits off, or refuse.
     *
     * Returns the new balance, or null when there is not enough. Null rather
     * than an exception because "you cannot afford this" is an ordinary answer
     * to an ordinary question, not a fault — the editor shows it as a message
     * and offers to buy more.
     *
     * @param  array<string, mixed>  $meta
     */
    public function spend(Site $site, string $action, array $meta = []): ?int
    {
        $cost = $this->costOf($action);

        if ($cost === 0) {
            return $this->balance($site);
        }

        return DB::transaction(function () use ($site, $action, $cost, $meta): ?int {
            /*
             * Lock the site's row for the length of this transaction.
             *
             * Two browser tabs pressing Rewrite at the same moment each read a
             * balance of one, each decide they can afford it, and each write a
             * debit: the site pays once and is charged twice. The lock makes
             * the second one wait until the first has written, so it reads a
             * balance of zero and is refused.
             */
            Site::query()->whereKey($site->id)->lockForUpdate()->first();

            $balance = (int) CreditEntry::query()->where('site_id', $site->id)->sum('delta');

            if ($balance < $cost) {
                return null;
            }

            CreditEntry::query()->create([
                'site_id' => $site->id,
                'delta' => -$cost,
                'reason' => $action,
                'meta' => $meta,
            ]);

            return $balance - $cost;
        });
    }

    /**
     * Put credits back.
     *
     * Used when an action was paid for and then could not be delivered — the
     * model returned nothing usable, the upload failed. The alternative is
     * keeping money for work nobody received, which is the fastest way to have
     * the credit system distrusted.
     *
     * @param  array<string, mixed>  $meta
     */
    public function refund(Site $site, string $action, array $meta = []): int
    {
        $cost = $this->costOf($action);

        if ($cost > 0) {
            CreditEntry::query()->create([
                'site_id' => $site->id,
                'delta' => $cost,
                'reason' => 'refund_'.$action,
                'meta' => $meta,
            ]);
        }

        return $this->balance($site);
    }

    /** @param array<string, mixed> $meta */
    public function grant(Site $site, int $amount, string $reason = 'purchase', array $meta = []): int
    {
        if ($amount > 0) {
            CreditEntry::query()->create([
                'site_id' => $site->id,
                'delta' => $amount,
                'reason' => $reason,
                'meta' => $meta,
            ]);
        }

        return $this->balance($site);
    }
}
