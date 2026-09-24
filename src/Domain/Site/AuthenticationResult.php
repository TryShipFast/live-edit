<?php

namespace ShipFast\LiveEdit\Domain\Site;

/** Either a key and its site, or the reason there is neither. */
final class AuthenticationResult
{
    private function __construct(
        public readonly ?ApiToken $token,
        public readonly ?Site $site,
        public readonly ?Denial $denial,
    ) {}

    public static function allowed(ApiToken $token, Site $site): self
    {
        return new self($token, $site, null);
    }

    public static function denied(Denial $denial): self
    {
        return new self(null, null, $denial);
    }

    public function passed(): bool
    {
        return $this->denial === null;
    }
}
