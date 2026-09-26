<?php

namespace ShipFast\LiveEdit\Http\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\SiteVerification;
use ShipFast\LiveEdit\Http\Api\ApiContext;

/**
 * What a site is entitled to, and whether it is the site that bought it.
 *
 * A Laravel or WordPress install holds its own content and does its own
 * logins, so the only thing it needs from us is an answer to "is this licence
 * good, and is it mine". This is that answer.
 *
 * ON WHAT THIS CAN AND CANNOT ENFORCE, because the distinction decides how
 * much weight the rest of the system should put on it:
 *
 *   - For a BROWSER, the domain check is real. An Origin header is set by the
 *     browser and a page cannot forge it, so a key lifted out of one site's
 *     source does not work from another site's pages.
 *
 *   - For a SERVER, it is not. Anything that is not a browser sends whatever
 *     it likes, including the `domain` below. Somebody who has taken a secret
 *     key and runs their own server can claim to be the licensed domain and
 *     we cannot contradict them from here.
 *
 * So this is a tripwire rather than a lock on that path, and it is built as
 * one: the mismatch is reported and recorded rather than merely refused,
 * because the useful product of a stolen key is knowing it was stolen. The
 * lock that does hold is the licence expiring.
 */
class LicenceController
{
    public function show(Request $request): JsonResponse
    {
        // From the authenticated context rather than from the {site} in the
        // path. They are the same site — the authenticator has already
        // refused the request if the key does not belong to it — but only
        // this one is the row that was actually checked, and route model
        // binding is not registered on this group, so a type-hinted Site
        // would be resolved from the container as a blank model.
        $token = ApiContext::token($request);
        $site = ApiContext::site($request);

        // What the caller says it is, when it is a server; what the browser
        // says it is, when it is a browser. The browser's version is the one
        // that cannot be made up, so it wins where both are present.
        $claimed = SiteVerification::normaliseDomain((string) $request->input('domain', ''));
        $origin = SiteVerification::normaliseDomain((string) $request->headers->get('Origin', ''));
        $observed = $origin !== '' ? $origin : $claimed;

        $expiresAt = $token->expires_at;
        $lapsed = $expiresAt !== null && $expiresAt->isPast();

        // An unverified site has no domain to match against, so "mismatch" is
        // not a thing that can be said about it yet — it is simply unproven,
        // which is a different message and a different fix.
        $matches = $site->isVerified() ? $site->ownsDomain($observed) : null;

        return response()->json([
            'licence' => [
                'site' => $site->slug,
                'valid' => $site->isActive() && ! $lapsed && $matches !== false,
                'active' => $site->isActive(),
                'verified' => $site->isVerified(),
                'domain' => $site->domain,
                'domain_matches' => $matches,
                'observed_domain' => $observed !== '' ? $observed : null,
                'expires_at' => $expiresAt?->toIso8601String(),
                // Days rather than a date for the thing a site will act on: a
                // renewal notice is written against "14 days left", and
                // making every caller do that subtraction is how one of them
                // gets it wrong.
                'days_remaining' => $expiresAt !== null ? max(0, (int) now()->diffInDays($expiresAt, false)) : null,
                'reason' => $this->reason($site, $lapsed, $matches),
            ],
        ])->withHeaders([
            // Never cached. A suspended site, a lapsed licence and a revoked
            // key all have to take effect on the next check rather than after
            // somebody's cache expires.
            'Cache-Control' => 'no-store, private',
        ]);
    }

    private function reason(Site $site, bool $lapsed, ?bool $matches): ?string
    {
        return match (true) {
            ! $site->isActive() => 'suspended',
            $lapsed => 'expired',
            $matches === false => 'domain_mismatch',
            ! $site->isVerified() => 'unverified',
            default => null,
        };
    }
}
