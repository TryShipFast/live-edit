<?php

namespace KastsBuild;

/**
 * Whether this installation is licensed to edit.
 *
 * The same three rules the Laravel package follows, for the same reasons, and
 * the order matters.
 *
 * 1. NO LICENCE CONFIGURED MEANS CARRY ON. A site that has not been told to
 *    check must not wake up to a broken editor because a release added a
 *    check it never asked for.
 *
 * 2. AN OUTAGE MUST NEVER COST A CUSTOMER THEIR EDITOR. Unreachable, and the
 *    last good answer stands; no history, and the answer is yes. A licence
 *    check that takes a paying customer down when OUR server hiccups is a
 *    worse failure than the piracy it prevents, and it lands at the moment we
 *    are least able to answer the phone.
 *
 * 3. A CLEAR NO IS A NO. Expired, revoked, suspended, or registered to
 *    another domain, and the editor stops. The website does not: WordPress
 *    renders its own posts from its own database and never asked us anything.
 *
 * Until this existed the plugin found out a key was bad only by watching
 * content requests fail, so a client whose licence lapsed got a broken editor
 * rather than a sentence telling them what had happened.
 */
class Licence
{
    private const ANSWER = 'kastsbuild_licence';

    private const LAST_GOOD = 'kastsbuild_licence_last_good';

    /** A day, so the service is asked once per site per day, not per page. */
    private const TTL = DAY_IN_SECONDS;

    /**
     * Long, deliberately. This is the window in which a customer keeps
     * working through an outage at our end.
     */
    private const GRACE = 14 * DAY_IN_SECONDS;

    public static function permits(): bool
    {
        if (! Settings::configured()) {
            return true;
        }

        $status = self::status();

        return (bool) ($status['valid'] ?? true);
    }

    public static function reason(): ?string
    {
        return Settings::configured() ? (self::status()['reason'] ?? null) : null;
    }

    /**
     * What to tell somebody, in words they can act on.
     *
     * Every one of them says the website is unaffected, because that is the
     * first thing anybody asks and the thing they are most afraid of.
     */
    public static function message(): string
    {
        switch (self::reason()) {
            case 'expired':
                return __('This licence has expired. Renew it to carry on editing. Your website is unaffected.', 'kastsbuild');
            case 'rejected':
                return __('This key is no longer accepted. It was probably replaced or revoked: copy the current one from your dashboard into this plugin\'s settings.', 'kastsbuild');
            case 'domain_mismatch':
                return __('This licence is registered to a different domain, so editing is refused here.', 'kastsbuild');
            case 'suspended':
                return __('This site is suspended. Your website is unaffected.', 'kastsbuild');
            case 'unverified':
                return __('This site has not proved it owns its domain yet. Finish that in your dashboard.', 'kastsbuild');
            default:
                return __('This installation is not licensed to edit.', 'kastsbuild');
        }
    }

    /** @return array<string, mixed> */
    public static function status(): array
    {
        $cached = get_transient(self::ANSWER);

        if (is_array($cached)) {
            return $cached;
        }

        $answer = self::ask();
        set_transient(self::ANSWER, $answer, self::TTL);

        return $answer;
    }

    /** Forget what we were told, so the next check really asks. */
    public static function forget(): void
    {
        delete_transient(self::ANSWER);
    }

    /** @return array<string, mixed> */
    private static function ask(): array
    {
        $probe = Api::probe('/licence', (string) Settings::get('publishable_key'));
        $status = $probe['status'];

        if ($status !== null && $status < 400) {
            $licence = (array) ($probe['data']['licence'] ?? []);

            $answer = [
                'valid' => (bool) ($licence['valid'] ?? false),
                'reason' => $licence['reason'] ?? null,
                'expires_at' => $licence['expires_at'] ?? null,
                'days_remaining' => $licence['days_remaining'] ?? null,
            ];

            if ($answer['valid']) {
                // Kept apart from the cached answer and for far longer: its
                // job is to survive that answer expiring during an outage.
                set_transient(self::LAST_GOOD, $answer, self::GRACE);
            }

            return $answer;
        }

        // A 401 or 403 is the service saying plainly that this key is not
        // good. That is an answer, not an outage.
        if ($status === 401 || $status === 403) {
            return ['valid' => false, 'reason' => 'rejected', 'expires_at' => null, 'days_remaining' => null];
        }

        $lastGood = get_transient(self::LAST_GOOD);

        return is_array($lastGood)
            ? $lastGood
            : ['valid' => true, 'reason' => 'unreachable', 'expires_at' => null, 'days_remaining' => null];
    }
}
