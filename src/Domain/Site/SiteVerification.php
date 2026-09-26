<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Proving that whoever registered a domain actually holds it.
 *
 * Without this, registration is a claim and nothing more: anybody could
 * register "a-competitor.com", be issued a licence for it, and — because the
 * origin policy lets non-browser callers through to the key check — use it.
 * The point is not that this would be lucrative. It is that a licence which
 * names a domain has to mean something, and "they typed it in" is not a
 * meaning.
 *
 * Two proofs are accepted, and either is enough. Both ask for the same string
 * in a place only somebody with control of the site can put it:
 *
 *   1. A file at /.well-known/shipfast-site-verification.txt
 *   2. A <meta name="shipfast-site-verification" content="..."> on the home page
 *
 * Two rather than one because the cheapest proof depends on who is doing it.
 * A developer adds a meta tag in a template without thinking about it; a
 * marketer with a locked-down template finds dropping a static file easier.
 * Asking for the one they cannot do is how verification becomes a support
 * ticket.
 *
 * Deliberately NOT a DNS TXT record, which is the usual third option: DNS is
 * held by whoever runs the domain, which for the agencies this is sold to is
 * often not the person doing the install, and propagation turns a thirty
 * second task into "try again tomorrow".
 */
final class SiteVerification
{
    public const META_NAME = 'shipfast-site-verification';

    public const WELL_KNOWN_PATH = '/.well-known/shipfast-site-verification.txt';

    /**
     * Enough randomness that it cannot be guessed, short enough to paste.
     *
     * Guessability matters more here than it looks: the code is the entire
     * proof, so a code somebody could predict for a domain they do not own
     * would let them verify it by putting the expected string on their own
     * unrelated page — and nothing else in the flow would notice.
     */
    public static function newCode(): string
    {
        return 'shipfast-verify-'.Str::lower(Str::random(32));
    }

    /**
     * The bare hostname a licence is good for.
     *
     * "https://Example.com:443/pricing?x=1" and "example.com" name the same
     * site and must compare equal, or a customer verifies one spelling and is
     * refused under another. www is folded in for the same reason: nobody
     * thinks of www.example.com as a different site from example.com, and a
     * licence that did would be wrong in the way that generates refunds.
     */
    public static function normaliseDomain(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return '';
        }

        // parse_url needs a scheme to see a host rather than a path.
        if (! str_contains($value, '//')) {
            $value = 'https://'.$value;
        }

        $host = parse_url($value, PHP_URL_HOST) ?: '';
        $host = Str::lower(trim($host, '.'));

        return Str::startsWith($host, 'www.') ? Str::substr($host, 4) : $host;
    }

    /**
     * Whether a hostname is covered by a verified domain.
     *
     * The bare domain and its www form only. NOT arbitrary subdomains: a
     * licence for example.com should not silently cover a customer's staging,
     * their client's white-label subdomain, or anything else somebody stood up
     * under a name they happen to control. Those are separate sites, and the
     * whole point of binding a key to a domain is that it stays bound.
     */
    public static function covers(string $verified, ?string $candidate): bool
    {
        $verified = self::normaliseDomain($verified);
        $candidate = self::normaliseDomain((string) $candidate);

        return $verified !== '' && $verified === $candidate;
    }

    /**
     * Look for the code on the site itself.
     *
     * One fetch of the home page and one of the well-known file, both with a
     * short timeout and both allowed to fail: a site that is down is not a
     * site that failed verification, and the difference is reported rather
     * than collapsed into "no".
     *
     * @return array{verified: bool, method: ?string, reason: ?string}
     */
    public static function attempt(Site $site): array
    {
        $domain = self::normaliseDomain((string) $site->domain);
        $code = (string) $site->verification_code;

        if ($domain === '' || $code === '') {
            return ['verified' => false, 'method' => null, 'reason' => 'not_registered'];
        }

        $reason = null;

        foreach (self::baseUrlsFor($domain) as $base) {
            $result = self::lookFor($base, $code);

            if ($result['verified']) {
                return $result;
            }

            // "Not there" is an answer and ends it; "could not reach you" is
            // not, so the next candidate base gets a turn. Without this a
            // local site that only answers http would be reported as missing
            // its code rather than as never having been asked.
            if ($result['reason'] === 'not_found') {
                return $result;
            }

            $reason = $result['reason'];
        }

        return ['verified' => false, 'method' => null, 'reason' => $reason ?? 'unreachable'];
    }

    /**
     * Where to go looking, in order.
     *
     * https only, for everything that could be a real site. A plain-http
     * proof is one a network can forge, and verification that can be forged
     * by whoever carries the packets is not verification.
     *
     * The exception is a development hostname — .test, .localhost, localhost
     * itself — which cannot be reached from the internet at all and is
     * therefore not somebody else's site to impersonate. Those are worth
     * supporting because the alternative is that the whole flow is untestable
     * until it is in production, which is the one place nobody wants to find
     * out that it does not work.
     *
     * @return array<int, string>
     */
    private static function baseUrlsFor(string $domain): array
    {
        return self::isLocal($domain)
            ? ['https://'.$domain, 'http://'.$domain]
            : ['https://'.$domain];
    }

    public static function isLocal(string $domain): bool
    {
        $domain = self::normaliseDomain($domain);

        return $domain === 'localhost'
            || $domain === '127.0.0.1'
            || Str::endsWith($domain, ['.test', '.localhost']);
    }

    /**
     * @return array{verified: bool, method: ?string, reason: ?string}
     */
    private static function lookFor(string $base, string $code): array
    {
        $reason = null;
        // A development host is served with a certificate nothing trusts, so
        // insisting on a valid one there means never being able to try the
        // flow before it is live. Never relaxed for a real domain.
        $insecure = str_starts_with($base, 'http://') || self::isLocal(parse_url($base, PHP_URL_HOST) ?: '');

        // The file first: it is one small response, while the home page of a
        // real site is often hundreds of kilobytes we would rather not fetch.
        try {
            $file = self::client($insecure)->get($base.self::WELL_KNOWN_PATH);

            if ($file->successful() && str_contains($file->body(), $code)) {
                return ['verified' => true, 'method' => 'file', 'reason' => null];
            }
        } catch (\Throwable $e) {
            $reason = 'unreachable';
        }

        try {
            $page = self::client($insecure)->get($base);

            if ($page->successful() && self::pageCarries($page->body(), $code)) {
                return ['verified' => true, 'method' => 'meta', 'reason' => null];
            }

            // The site answered, so it is reachable; the proof is simply not
            // there yet. That is the common case — somebody clicked verify
            // before deploying — and it deserves its own message.
            $reason = $page->successful() ? 'not_found' : 'unreachable';
        } catch (\Throwable $e) {
            $reason = 'unreachable';
        }

        return ['verified' => false, 'method' => null, 'reason' => $reason ?? 'not_found'];
    }

    private static function client(bool $insecure): PendingRequest
    {
        $client = Http::timeout(8)
            ->withHeaders(['User-Agent' => 'ShipFast-Live-Edit-Verifier/1.0']);

        return $insecure ? $client->withoutVerifying() : $client;
    }

    /**
     * Whether the home page carries the meta tag.
     *
     * Matched with a pattern rather than by searching for the raw code, so
     * that the code merely APPEARING somewhere on the page is not proof. A
     * site with user-generated content — a forum, a comment thread, a search
     * results page that echoes its query — would otherwise be verifiable by
     * anybody who could get a string onto it.
     */
    private static function pageCarries(string $html, string $code): bool
    {
        $pattern = '#<meta\s[^>]*name=["\']'.preg_quote(self::META_NAME, '#').'["\'][^>]*>#i';

        if (! preg_match_all($pattern, $html, $matches)) {
            return false;
        }

        foreach ($matches[0] as $tag) {
            if (preg_match('#content=["\']([^"\']+)["\']#i', $tag, $found)
                && hash_equals($code, trim($found[1]))) {
                return true;
            }
        }

        return false;
    }
}
