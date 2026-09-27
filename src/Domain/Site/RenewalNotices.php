<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use ShipFast\LiveEdit\Mail\LicenceExpiring;

/**
 * Telling somebody their editor is about to switch off.
 *
 * A licence runs for a year, and the day it ends the toolbar stops appearing.
 * That is a reasonable thing to happen and an unreasonable thing to discover,
 * so it is said in advance, more than once, and with the consequence spelled
 * out: the editor goes, the website does not.
 */
final class RenewalNotices
{
    /**
     * How close to the end somebody is told.
     *
     * Four, descending, because they answer different questions. A month is
     * time to get a purchase order signed. A week is time to remember. A day
     * is time to act. The last one is not a warning at all, it is an
     * explanation for somebody who has just opened their site and found the
     * toolbar missing.
     */
    public const STEPS = [30, 7, 1, 0];

    /**
     * Send whatever is due, once per step.
     *
     * @return int how many sites were written to
     */
    public static function send(): int
    {
        $sent = 0;

        foreach (Site::query()->whereNull('suspended_at')->get() as $site) {
            if (self::sendFor($site)) {
                $sent++;
            }
        }

        return $sent;
    }

    public static function sendFor(Site $site): bool
    {
        $expires = self::licenceEndsAt($site);

        if ($expires === null) {
            return false;
        }

        /*
         * Rounded up, not truncated.
         *
         * The difference is a fraction of a day and it costs a whole notice.
         * A licence ending in twenty-three hours is 0.96 days away, which
         * truncates to zero: the site is told editing has already stopped
         * while it is still working, and the "it stops tomorrow" message is
         * never sent at all. Anything left of today is still today.
         */
        $daysLeft = (int) ceil(now()->diffInDays($expires, false));
        $step = self::stepFor($daysLeft);

        if ($step === null) {
            return false;
        }

        /*
         * Only ever downwards.
         *
         * The steps are stored as the threshold last used, so a site warned at
         * seven days is not warned at seven again tomorrow, and a renewal that
         * pushes the date out a year resets the mark rather than leaving the
         * site unable to be warned next time.
         */
        $alreadyWarned = $site->renewal_notice_days;

        if ($alreadyWarned !== null && $step >= (int) $alreadyWarned) {
            return false;
        }

        $editors = Editor::query()->where('site_id', $site->id)->get();

        if ($editors->isEmpty()) {
            // Nobody to tell. Recorded anyway, so adding an editor tomorrow
            // does not deliver a month of backdated warnings at once.
            $site->forceFill(['renewal_notice_days' => $step])->save();

            return false;
        }

        $on = self::readableDate($expires, $site);
        $console = self::consoleUrlFor($site);

        foreach ($editors as $editor) {
            rescue(fn () => Mail::to($editor->email)->send(
                new LicenceExpiring($editor, $site, max(0, $daysLeft), $on, $console)
            ), null, false);
        }

        $site->forceFill(['renewal_notice_days' => $step])->save();

        return true;
    }

    /**
     * The closest step this many days has reached, or nothing yet.
     *
     * The smallest step the remaining days fall inside. Twenty days left has
     * passed the thirty-day mark but not the seven, so it belongs to thirty;
     * three days belongs to seven; anything at or past the end belongs to
     * zero. More than thirty days left belongs to no step at all, which is
     * most of the year and should be silent.
     */
    private static function stepFor(int $daysLeft): ?int
    {
        $reached = array_filter(self::STEPS, fn (int $step) => $daysLeft <= $step);

        return $reached === [] ? null : min($reached);
    }

    /**
     * When the licence itself ends.
     *
     * Sessions are excluded. One is an api token too and lives half an hour,
     * so a site somebody signed into this afternoon would otherwise look like
     * it expired today and be warned about a licence with a year to run.
     */
    private static function licenceEndsAt(Site $site): ?Carbon
    {
        $expires = ApiToken::query()
            ->where('site_id', $site->id)
            ->whereIn('type', [TokenType::Publishable->value, TokenType::Secret->value])
            ->whereNull('revoked_at')
            ->whereNotNull('expires_at')
            ->orderByDesc('expires_at')
            ->value('expires_at');

        return $expires !== null ? Carbon::parse($expires) : null;
    }

    /**
     * The date as the person reading it would write it.
     *
     * In the site's own timezone where one was recorded. An email is rendered
     * hours before it is opened, so there is no browser to convert it later,
     * and a renewal date a day out is the one mistake this message cannot
     * afford.
     */
    private static function readableDate(Carbon $expires, Site $site): string
    {
        $zone = is_string($site->timezone) && in_array($site->timezone, timezone_identifiers_list(), true)
            ? $site->timezone
            : 'UTC';

        return $expires->copy()->setTimezone($zone)->isoFormat('D MMMM YYYY');
    }

    private static function consoleUrlFor(Site $site): ?string
    {
        $host = rtrim((string) config('live-edit.console_url', config('app.url')), '/');

        return $host !== '' ? $host.'/sites/'.rawurlencode($site->slug) : null;
    }
}
