<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Domain\Content\SiteSnapshot;
use ShipFast\LiveEdit\Domain\Content\SiteStore;

/**
 * Bringing a site into existence, and handing over its keys.
 *
 * Provisioning is separate from everything else in this package on purpose. A
 * site's own keys can read and write that site's content and nothing more; this
 * creates sites and mints those keys, which is a different kind of power and
 * belongs behind a different credential.
 *
 * It is also the only place a secret key exists in plain text. It is returned
 * once, to the caller that asked for it, and never recoverable afterwards.
 */
class Provisioner
{
    /**
     * @param  array<int, string>  $origins
     * @return array{site: Site, keys: array{publishable: string, secret: string}}
     *
     * @throws ValidationException
     */
    public function create(string $slug, ?string $name = null, array $origins = [], ?string $domain = null, ?string $platform = null): array
    {
        $slug = strtolower(trim($slug));

        if (! preg_match('/^[a-z0-9][a-z0-9-]{1,62}$/', $slug)) {
            throw ValidationException::withMessages([
                'slug' => 'A slug must be lowercase letters, digits and hyphens, and start with a letter or digit.',
            ]);
        }

        if (Site::query()->where('slug', $slug)->exists()) {
            throw ValidationException::withMessages(['slug' => 'A site with that slug already exists.']);
        }

        $site = Site::query()->create([
            'slug' => $slug,
            'name' => $name !== null && trim($name) !== '' ? trim($name) : $slug,
            'allowed_origins' => $this->cleanOrigins($origins),
            'domain' => SiteVerification::normaliseDomain((string) $domain) ?: null,
            // Minted at registration whether or not a domain was named, so the
            // customer has something to install before they come back to
            // verify. A code that only appears once verification is started
            // makes the flow two visits instead of one.
            'verification_code' => SiteVerification::newCode(),
            'platform' => Platform::clean($platform),
        ]);

        // Both at once, because a site with only one of them cannot be used:
        // the publishable key reads, the secret key vouches for editors.
        // Dated, because the licence is annual — see issue() for why a key
        // without an expiry is not a licence at all.
        $expires = now()->addYear();
        [, $publishable] = $site->issueToken(TokenType::Publishable, 'Web', null, $expires);
        [, $secret] = $site->issueToken(TokenType::Secret, 'Server', null, $expires);

        // So the very first page view finds a pointer rather than a 404 from
        // us. It costs one small file and saves a customer's first impression.
        rescue(fn () => (new SiteSnapshot(new SiteStore($site)))->initialise(), null, false);

        return ['site' => $site, 'keys' => ['publishable' => $publishable, 'secret' => $secret]];
    }

    /**
     * Issue another key of a type.
     *
     * Rotation rather than replacement: the new key works immediately and the
     * old one keeps working until it is revoked, so a running site is never
     * without one during a deploy.
     *
     * Keys carry the licence term, so they expire.
     *
     * A licence is sold by the year, and a key that never expires is not a
     * licence — it is a one-off purchase that happens to be billed annually
     * until somebody notices they can stop. Nothing else in the system was
     * going to catch that: ApiToken::isUsable() has always honoured
     * expires_at, and this method has always left it null, so every key ever
     * issued was good forever. Renewal pushes the date out; lapsing simply
     * lets it arrive.
     *
     * @return array{token: ApiToken, plain: string}
     *
     * @throws ValidationException
     */
    public function issue(Site $site, string $type, string $label = 'API key', ?\DateTimeInterface $expiresAt = null): array
    {
        $tokenType = TokenType::tryFrom($type);

        if ($tokenType === null || $tokenType === TokenType::Session) {
            throw ValidationException::withMessages([
                'type' => 'Type must be publishable or secret. Sessions are minted by a site, not provisioned.',
            ]);
        }

        [$token, $plain] = $site->issueToken(
            $tokenType,
            mb_substr(trim($label), 0, 100) ?: 'API key',
            null,
            $expiresAt ?? now()->addYear(),
        );

        return ['token' => $token, 'plain' => $plain];
    }

    /**
     * Push a licence out by another year.
     *
     * From today when the licence has already lapsed, from its own expiry
     * when it has not — so renewing early does not cost a customer the days
     * they had left, and renewing late does not silently backdate them into
     * having already expired again.
     *
     * The key itself does not change. A renewal that minted a new key would
     * mean every customer editing a config file once a year, which is both
     * the moment most likely to break their site and the one they are least
     * expecting to have to act on.
     */
    public function renew(Site $site, int $years = 1): int
    {
        $renewed = 0;

        foreach ($site->tokens()->whereNull('revoked_at')->get() as $token) {
            $from = $token->expires_at !== null && $token->expires_at->isFuture()
                ? $token->expires_at
                : now();

            $token->forceFill(['expires_at' => $from->copy()->addYears($years)])->save();
            $renewed++;
        }

        return $renewed;
    }

    /**
     * Check the site for its verification code and record the result.
     *
     * Re-checkable rather than once-and-done: a customer who redeploys and
     * drops the meta tag has not stopped owning the domain, but we do want to
     * notice. Verification is therefore a fact with a date on it, not a flag
     * that can only ever be set.
     *
     * @return array{verified: bool, method: ?string, reason: ?string}
     */
    public function verifyDomain(Site $site): array
    {
        $result = SiteVerification::attempt($site);

        if ($result['verified']) {
            $site->forceFill(['verified_at' => now()])->save();
        }

        return $result;
    }

    /** @param array<int, string> $origins */
    public function setOrigins(Site $site, array $origins): Site
    {
        $site->forceFill(['allowed_origins' => $this->cleanOrigins($origins)])->save();

        return $site;
    }

    public function suspend(Site $site, bool $suspended): Site
    {
        // Suspending stops every key at once without destroying anything, so
        // an account dispute or a compromised site can be stopped and then
        // put back exactly as it was.
        $site->forceFill(['suspended_at' => $suspended ? now() : null])->save();

        return $site;
    }

    /**
     * @param  array<int, string>  $origins
     * @return array<int, string>
     *
     * @throws ValidationException
     */
    private function cleanOrigins(array $origins): array
    {
        $clean = [];

        foreach ($origins as $origin) {
            $origin = rtrim(strtolower(trim((string) $origin)), '/');

            if ($origin === '') {
                continue;
            }

            // An entry that is not an origin is worse than none: it silently
            // matches nothing, and the symptom is a CORS error on the
            // customer's own site that looks like a bug in their page.
            if (! preg_match('#^https?://(\*\.)?[a-z0-9.-]+(:\d+)?$#', $origin)) {
                throw ValidationException::withMessages([
                    'origins' => "\"{$origin}\" is not an origin. Use https://example.com, or https://*.example.com for subdomains.",
                ]);
            }

            $clean[] = $origin;
        }

        return array_values(array_unique($clean));
    }
}
