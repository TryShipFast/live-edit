<?php

namespace ShipFast\LiveEdit\Domain\Site;

/** What a key may do, kept separate from what it is. */
enum Ability: string
{
    case Read = 'read';
    case Write = 'write';
    case Publish = 'publish';

    /**
     * May create edit sessions.
     *
     * Held by secret keys alone. A session that could mint sessions would
     * renew itself indefinitely, and its expiry — the only thing limiting a
     * key that sits in a browser — would be decoration.
     */
    case Mint = 'mint';

    /** @param array<int, string> $granted */
    public static function grantedIn(array $granted, self $wanted): bool
    {
        return in_array($wanted->value, $granted, true);
    }
}
