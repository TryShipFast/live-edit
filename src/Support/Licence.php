<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use ShipFast\LiveEdit\Domain\Site\SiteVerification;

/**
 * Whether this installation is licensed to edit.
 *
 * The service issues a key bound to a domain and good for a year. Nothing on
 * this side asked about it, which made the key decorative: a customer could
 * let it lapse, or lift one from another site, and the editor carried on.
 *
 * Three rules shape this, and the order matters.
 *
 * 1. NO LICENCE CONFIGURED MEANS CARRY ON. Installs predating this — and
 *    anybody running the package against their own database — must not wake
 *    up to a broken editor because a check they never opted into now fails.
 *    Configuring a key is what turns enforcement on.
 *
 * 2. AN OUTAGE MUST NEVER COST A CUSTOMER THEIR EDITOR. If the service is
 *    unreachable the last good answer stands, and if there is none the answer
 *    is yes. A licence check that takes a paying customer's site down when OUR
 *    server hiccups is a worse failure than the piracy it prevents, and it
 *    fails at the moment we are least able to answer the phone.
 *
 * 3. A CLEAR NO IS A NO. Expired, suspended, or bound to another domain and
 *    the editor stops. Only the website keeps working — the content is in the
 *    customer's own database and their pages are unaffected, which is exactly
 *    what the licence promises.
 */
final class Licence
{
    /** Cache keys, versioned so a shape change cannot be read as an answer. */
    private const ANSWER = 'live-edit.licence.v1.answer';

    private const LAST_GOOD = 'live-edit.licence.v1.last-good';

    /**
     * How long an unreachable service may coast on its last good answer.
     *
     * Long, deliberately. This is the window in which a customer keeps working
     * through an outage at our end, and two weeks is short enough that a
     * genuinely revoked licence stops mattering soon while being far longer
     * than any incident we should be having.
     */
    private const GRACE_DAYS = 14;

    public static function configured(): bool
    {
        return self::key() !== '' && self::site() !== '' && self::host() !== '';
    }

    public static function permits(): bool
    {
        if (! self::configured()) {
            return true;
        }

        return (bool) (self::status()['valid'] ?? true);
    }

    /**
     * Why editing is refused, for a message somebody can act on.
     */
    public static function reason(): ?string
    {
        return self::configured() ? (self::status()['reason'] ?? null) : null;
    }

    /**
     * @return array{valid: bool, reason: ?string, expires_at: ?string, days_remaining: ?int}
     */
    public static function status(): array
    {
        $ttl = (int) config('live-edit.licence.ttl', 86400);

        return Cache::remember(self::ANSWER, $ttl, fn () => self::ask());
    }

    /**
     * Ask the service, and decide what to believe if it does not answer.
     *
     * @return array{valid: bool, reason: ?string, expires_at: ?string, days_remaining: ?int}
     */
    private static function ask(): array
    {
        try {
            $response = self::client(5)
                ->withToken(self::key())
                ->get(self::endpoint('licence'), [
                    // What this installation believes it is. A server can
                    // say anything, which the service knows — it is a
                    // tripwire there, not a lock.
                    'domain' => self::domain(),
                ]);

            if ($response->successful()) {
                $licence = (array) $response->json('licence', []);

                $answer = [
                    'valid' => (bool) ($licence['valid'] ?? false),
                    'reason' => $licence['reason'] ?? null,
                    'expires_at' => $licence['expires_at'] ?? null,
                    'days_remaining' => $licence['days_remaining'] ?? null,
                    'editors' => array_values(array_filter(array_map(
                        fn ($email) => mb_strtolower(trim((string) $email)),
                        (array) ($licence['editors'] ?? [])
                    ))),
                ];

                if ($answer['valid']) {
                    // Kept apart from the cached answer and for far longer,
                    // because its job is to survive the answer expiring
                    // during an outage.
                    Cache::put(self::LAST_GOOD, $answer, now()->addDays(self::GRACE_DAYS));
                }

                return $answer;
            }

            // A 401 or 403 is the service telling us plainly that this key is
            // not good. That is an answer, not an outage.
            if (in_array($response->status(), [401, 403], true)) {
                return ['valid' => false, 'reason' => 'rejected', 'expires_at' => null, 'days_remaining' => null, 'editors' => []];
            }

            return self::whenUnreachable('http_'.$response->status());
        } catch (\Throwable $e) {
            return self::whenUnreachable('unreachable');
        }
    }

    /**
     * @return array{valid: bool, reason: ?string, expires_at: ?string, days_remaining: ?int}
     */
    private static function whenUnreachable(string $why): array
    {
        $lastGood = Cache::get(self::LAST_GOOD);

        if (is_array($lastGood)) {
            return $lastGood;
        }

        // Never seen a good answer and cannot get one now. Still yes — see
        // rule 2. Logged, because silently allowing is how a misconfigured
        // key goes unnoticed for a year.
        Log::warning('live-edit: could not check the licence, allowing editing.', ['why' => $why]);

        return ['valid' => true, 'reason' => $why, 'expires_at' => null, 'days_remaining' => null, 'editors' => []];
    }

    /**
     * The addresses registered against this site, for the default gate.
     *
     * Falls back to the local list, so a site can still name its own people
     * without the service — and an install that has not registered at all is
     * not left with nobody able to edit.
     *
     * @return array<int, string>
     */
    public static function editors(): array
    {
        $fromService = self::configured() ? (array) (self::status()['editors'] ?? []) : [];

        if ($fromService !== []) {
            return $fromService;
        }

        return array_values(array_filter(array_map(
            fn (string $email) => mb_strtolower(trim($email)),
            explode(',', (string) config('live-edit.editors', ''))
        )));
    }

    /**
     * An HTTP client for talking to the service.
     *
     * Certificate checking is relaxed for a development hostname and nowhere
     * else — the same rule, and the same reason, as the domain verifier: a
     * .test host is served with a certificate nothing trusts, and holding it
     * to one means the whole arrangement cannot be exercised until it is in
     * production. For anything that could be a real service, a certificate
     * that does not check out is exactly the case this must refuse.
     */
    public static function client(int $timeoutSeconds = 8): PendingRequest
    {
        $client = Http::timeout($timeoutSeconds)->acceptJson();

        $host = (string) parse_url(self::host(), PHP_URL_HOST);

        return SiteVerification::isLocal($host) ? $client->withoutVerifying() : $client;
    }

    /**
     * This site's own page in the console.
     *
     * Where somebody goes to see when their licence runs out, add a colleague
     * or take one off. Only meaningful once a site is registered, since
     * without a slug there is no page to open.
     */
    public static function consoleUrl(): ?string
    {
        return self::configured() ? self::host().'/sites/'.rawurlencode(self::site()) : null;
    }

    /**
     * Where this site's people go to sign in.
     *
     * On the service, so a password is never typed into the customer's own
     * site and never crosses their server.
     */
    public static function signInUrl(string $returnTo): string
    {
        return self::host().'/live-edit/sign-in?'.http_build_query([
            'site' => self::site(),
            'return_to' => $returnTo,
        ]);
    }

    /** Forget what we were told, so the next check really asks. */
    public static function forget(): void
    {
        Cache::forget(self::ANSWER);
    }

    private static function key(): string
    {
        return trim((string) config('live-edit.licence.key'));
    }

    public static function site(): string
    {
        return trim((string) config('live-edit.licence.site', config('live-edit.cloud.site')));
    }

    /**
     * A service endpoint for this site, built in one place.
     *
     * The host, the prefix and the site slug were being glued together at
     * each call site, which is three chances to disagree about a slash.
     */
    public static function endpoint(string $path): string
    {
        return self::host()
            .'/'.trim((string) config('live-edit.api.prefix', 'api/live-edit/v1'), '/')
            .'/'.rawurlencode(self::site())
            .'/'.ltrim($path, '/');
    }

    private static function host(): string
    {
        return rtrim(trim((string) config('live-edit.licence.host', config('live-edit.cloud.host'))), '/');
    }

    /** The domain this installation serves, as the licence would name it. */
    private static function domain(): string
    {
        return (string) parse_url((string) config('app.url'), PHP_URL_HOST);
    }
}
