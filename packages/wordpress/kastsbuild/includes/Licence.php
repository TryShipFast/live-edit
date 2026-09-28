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
        return self::messageFrom((string) self::reason());
    }

    /**
     * The words for one reason, separated from looking the reason up.
     *
     * Pure, so it can be checked without a WordPress install or a network,
     * which is the only reason these sentences are ever checked at all.
     */
    public static function messageFrom(string $reason): string
    {
        switch ($reason) {
            case 'expired':
                return self::t('This licence has expired. Renew it to carry on editing. Your website is unaffected.');
            case 'rejected':
                return self::t('This key is no longer accepted. It was probably replaced or revoked: copy the current one from your dashboard into this plugin\'s settings.');
            case 'licence_lapsed':
                return self::t('This licence has ended. Renew it to carry on editing. Your website is unaffected.');
            case 'domain_mismatch':
                return self::t('This licence is registered to a different domain, so editing is refused here.');
            case 'suspended':
                return self::t('This site is suspended. Your website is unaffected.');
            case 'unverified':
                return self::t('This site has not proved it owns its domain yet. Finish that in your dashboard.');
            default:
                return self::t('This installation is not licensed to edit.');
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

    /**
     * A string, translated when there is a WordPress to translate it.
     *
     * ABSPATH is the canonical "am I inside WordPress" marker. The probe
     * exists so these sentences can be checked outside one: they are the words
     * a customer reads at the worst moment, they were wrong for weeks, and a
     * message nothing can reach is a message nothing will ever check.
     *
     * WordPress's __() takes a text domain as its second argument and
     * Laravel's takes an array of replacements, so in a suite where both could
     * be loaded, calling it unguarded is a type error rather than a
     * translation.
     */
    private static function t(string $text): string
    {
        return defined('ABSPATH') ? __($text, 'kastsbuild') : $text;
    }

    /**
     * Which kind of refusal the service just sent.
     *
     * Separated out and left testable for the same reason as messageFrom:
     * it is the piece that was wrong, and it was wrong invisibly.
     *
     * @param  array<string, mixed>  $body
     */
    private static function reasonFromRefusal(array $body): string
    {
        $said = isset($body['error']['reason']) ? (string) $body['error']['reason'] : '';

        switch ($said) {
            case 'expired':
            case 'licence_lapsed':
                return 'expired';
            case 'site_suspended':
                return 'suspended';
            default:
                // Including 'revoked', and including an older service that
                // names nothing at all: a customer's plugin is not upgraded
                // on the day the service is.
                return 'rejected';
        }
    }

    /** @return array<string, mixed> */
    private static function ask(): array
    {
        /*
         * Name the site we are, because nothing else here can.
         *
         * A browser sends an Origin the page cannot forge, which is what
         * makes the domain check real. A plugin asking on its own behalf has
         * no such thing, so it says where it is: a claim, which a thief could
         * also make, and which is therefore a tripwire rather than a lock.
         * Worth sending anyway — a key being used from a domain that is not
         * the licensed one is exactly the thing worth knowing about, and in
         * silence we would never hear it.
         */
        $home = (string) wp_parse_url(home_url('/'), PHP_URL_HOST);

        $probe = Api::probe(
            '/licence'.($home !== '' ? '?domain='.rawurlencode($home) : ''),
            (string) Settings::get('publishable_key')
        );
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
            /*
             * Which kind of "not good", because the two commonest have
             * opposite fixes. A lapsed licence wants paying and the key in
             * this plugin's settings is fine; a withdrawn key wants
             * replacing and the billing is fine.
             *
             * Reading only the status code meant every customer whose plan
             * ran out was told to copy a new key out of their dashboard, and
             * went looking for a key that was never the problem.
             *
             * An older service sends no reason, so the blunt answer stays as
             * the fallback: a customer's plugin is not upgraded on the day
             * the service is.
             */
            $reason = self::reasonFromRefusal(is_array($probe['data'] ?? null) ? $probe['data'] : []);

            return ['valid' => false, 'reason' => $reason, 'expires_at' => null, 'days_remaining' => null];
        }

        $lastGood = get_transient(self::LAST_GOOD);

        return is_array($lastGood)
            ? $lastGood
            : ['valid' => true, 'reason' => 'unreachable', 'expires_at' => null, 'days_remaining' => null];
    }
}
