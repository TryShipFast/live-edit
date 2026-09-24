<?php

namespace ShipFast\LiveEdit\Domain\Site;

/**
 * What a key is allowed to be, which is really a statement about where it may
 * be kept.
 *
 * The editor runs inside the customer's own page, so anything it holds can be
 * read by anyone who opens the source. That single fact decides the design: a
 * key the browser holds may only read content that is already public, and a key
 * that can change content never reaches the browser at all.
 */
enum TokenType: string
{
    /** Read-only, origin-bound. Safe in a page, because losing it loses nothing. */
    case Publishable = 'publishable';

    /** Server-side only. Mints sessions and may publish. Never sent to a browser. */
    case Secret = 'secret';

    /**
     * Short-lived and write-scoped, minted by a customer's server once IT has
     * decided the person at the keyboard may edit. We are not in a position to
     * make that decision: their users are not ours.
     */
    case Session = 'session';

    public function prefix(): string
    {
        return match ($this) {
            self::Publishable => 'kbp',
            self::Secret => 'kbs',
            self::Session => 'kbe',
        };
    }

    /** Whether a key of this type may be presented from a browser. */
    public function allowedFromBrowser(): bool
    {
        return $this !== self::Secret;
    }

    /** @return array<int, Ability> */
    public function defaultAbilities(): array
    {
        return match ($this) {
            self::Publishable => [Ability::Read],
            self::Secret => [Ability::Read, Ability::Write, Ability::Publish, Ability::Mint],
            self::Session => [Ability::Read, Ability::Write],
        };
    }
}
