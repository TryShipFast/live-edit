<?php

namespace ShipFast\LiveEdit\Domain\Site;

/**
 * Which pages may call on a site's behalf.
 *
 * Worth being clear about what this does and does not buy. An Origin header is
 * set by the browser and cannot be forged by a page, but anything that is not a
 * browser — curl, a server, a script — can send whatever it likes. So this is
 * not authentication; the key is. It is a blast radius: if a publishable key
 * ends up somewhere it should not be, it still only works from the pages its
 * owner named.
 *
 * A request with no Origin at all is not a browser request, and CORS has
 * nothing to say about it. Those are allowed through to the key check, which is
 * the thing actually standing guard.
 */
final class OriginPolicy
{
    /** @param array<int, string> $allowed */
    public function __construct(private readonly array $allowed = []) {}

    public function permits(?string $origin): bool
    {
        if ($origin === null || $origin === '') {
            return true; // Not a browser; the key decides.
        }

        $origin = $this->normalise($origin);

        foreach ($this->allowed as $entry) {
            if ($this->matches($this->normalise($entry), $origin)) {
                return true;
            }
        }

        return false;
    }

    /**
     * The value to echo back.
     *
     * The exact origin, never "*". A wildcard is both broader than anyone
     * intends and useless the moment credentials are involved, and echoing what
     * was asked for keeps the answer specific to the caller.
     */
    public function headerFor(?string $origin): ?string
    {
        return $origin !== null && $origin !== '' && $this->permits($origin) ? $origin : null;
    }

    private function matches(string $entry, string $origin): bool
    {
        if ($entry === $origin) {
            return true;
        }

        // "https://*.example.com" covers its subdomains and nothing else — not
        // the bare domain, and not a different scheme.
        if (! str_contains($entry, '*')) {
            return false;
        }

        $pattern = '#^'.str_replace('\*', '[^./]+', preg_quote($entry, '#')).'$#i';

        return (bool) preg_match($pattern, $origin);
    }

    /** Compare origins, not spellings: a trailing slash or case is not a difference. */
    private function normalise(string $origin): string
    {
        return rtrim(strtolower(trim($origin)), '/');
    }
}
