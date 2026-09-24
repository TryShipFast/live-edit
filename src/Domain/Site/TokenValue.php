<?php

namespace ShipFast\LiveEdit\Domain\Site;

use SensitiveParameter;

/**
 * The string a caller presents, and the only place that decides whether it is
 * the right one.
 *
 * Shaped "kbp_<id>_<secret>". The id is public and identifies the row, so a
 * lookup is a single indexed read rather than a comparison against every token
 * on the system — which would be both slow and a timing signal.
 *
 * What is stored is a hash of the secret half, never the secret itself. A
 * database that leaks then costs a customer their content history rather than
 * their keys, and support can identify a key without being able to use it.
 */
final class TokenValue
{
    private function __construct(
        public readonly TokenType $type,
        public readonly string $id,
        private readonly string $secret,
    ) {}

    /** Mint a new key. The plain text is returned once and cannot be recovered. */
    public static function generate(TokenType $type): self
    {
        return new self($type, bin2hex(random_bytes(8)), self::urlSafe(random_bytes(32)));
    }

    /**
     * Read a presented string, or null if it is not one of ours.
     *
     * Returning null rather than throwing keeps a malformed key on the same
     * path as a wrong one: both are simply "not authenticated", and neither
     * tells the caller which it was.
     */
    public static function parse(#[SensitiveParameter] string $presented): ?self
    {
        // Split into exactly three, because the secret is url-safe base64 and
        // may itself contain "_". Splitting on every underscore made parsing
        // succeed or fail depending on which bytes were drawn — a key that
        // worked for one customer and not the next.
        $parts = explode('_', trim($presented), 3);

        if (count($parts) !== 3) {
            return null;
        }

        [$prefix, $id, $secret] = $parts;

        $type = collect(TokenType::cases())->first(fn (TokenType $t) => $t->prefix() === $prefix);

        if ($type === null || ! ctype_xdigit($id) || $id === '' || $secret === '') {
            return null;
        }

        return new self($type, $id, $secret);
    }

    /** The whole key, to be shown to its owner exactly once. */
    public function plain(): string
    {
        return $this->type->prefix().'_'.$this->id.'_'.$this->secret;
    }

    /** What gets stored. */
    public function hash(): string
    {
        return hash('sha256', $this->secret);
    }

    /**
     * Compare against a stored hash without leaking how far the comparison got.
     *
     * A plain === on secrets returns sooner for a wrong first character than a
     * wrong last one, and that difference is measurable over enough requests.
     */
    public function matches(string $storedHash): bool
    {
        return hash_equals($storedHash, $this->hash());
    }

    /** Enough to identify a key in a log or a list, and useless to a thief. */
    public function hint(): string
    {
        return $this->type->prefix().'_'.$this->id.'_'.str_repeat('•', 8);
    }

    private static function urlSafe(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }
}
