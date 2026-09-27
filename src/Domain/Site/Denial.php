<?php

namespace ShipFast\LiveEdit\Domain\Site;

/**
 * Why a key was refused.
 *
 * Kept as a type because the two audiences want different answers. An operator
 * reading logs needs to tell a revoked key from a wrong one; a caller is told
 * only "unauthorised", since spelling out which half of a credential was wrong
 * is free help to whoever is guessing.
 */
enum Denial: string
{
    case Missing = 'missing';
    case Malformed = 'malformed';
    case Unknown = 'unknown';
    case Mismatched = 'mismatched';
    case Revoked = 'revoked';
    case Expired = 'expired';
    case SiteSuspended = 'site_suspended';
    case SecretInBrowser = 'secret_in_browser';
    case OriginNotAllowed = 'origin_not_allowed';
    case MissingAbility = 'missing_ability';
    case SiteMismatch = 'site_mismatch';
    case LicenceLapsed = 'licence_lapsed';

    /** Whether this is "who are you" (401) or "not you" (403). */
    public function status(): int
    {
        return match ($this) {
            self::OriginNotAllowed, self::MissingAbility, self::SecretInBrowser, self::SiteSuspended, self::SiteMismatch => 403,
            default => 401,
        };
    }

    /** What the caller is told. Never which half was wrong. */
    public function publicMessage(): string
    {
        return match ($this) {
            self::OriginNotAllowed => 'This origin is not allowed for this site.',
            self::MissingAbility => 'This key is not permitted to do that.',
            self::SecretInBrowser => 'A secret key must not be used from a browser.',
            self::SiteSuspended => 'This site is suspended.',
            self::SiteMismatch => 'This key does not belong to that site.',
            self::LicenceLapsed => 'This licence has ended, so this site can no longer be edited. The website itself is unaffected.',
            default => 'Invalid or missing API key.',
        };
    }
}
