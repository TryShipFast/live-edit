<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Validation\ValidationException;

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
    public function create(string $slug, ?string $name = null, array $origins = []): array
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
        ]);

        // Both at once, because a site with only one of them cannot be used:
        // the publishable key reads, the secret key vouches for editors.
        [, $publishable] = $site->issueToken(TokenType::Publishable, 'Web');
        [, $secret] = $site->issueToken(TokenType::Secret, 'Server');

        return ['site' => $site, 'keys' => ['publishable' => $publishable, 'secret' => $secret]];
    }

    /**
     * Issue another key of a type.
     *
     * Rotation rather than replacement: the new key works immediately and the
     * old one keeps working until it is revoked, so a running site is never
     * without one during a deploy.
     *
     * @return array{token: ApiToken, plain: string}
     *
     * @throws ValidationException
     */
    public function issue(Site $site, string $type, string $label = 'API key'): array
    {
        $tokenType = TokenType::tryFrom($type);

        if ($tokenType === null || $tokenType === TokenType::Session) {
            throw ValidationException::withMessages([
                'type' => 'Type must be publishable or secret. Sessions are minted by a site, not provisioned.',
            ]);
        }

        [$token, $plain] = $site->issueToken($tokenType, mb_substr(trim($label), 0, 100) ?: 'API key');

        return ['token' => $token, 'plain' => $plain];
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
