<?php

namespace ShipFast\LiveEdit\Domain\Team;

use Illuminate\Http\Request;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\Draft;

/**
 * Who is writing, and to which part of the site, for one save.
 *
 * The editor says which part of the page the change is in with two headers
 * (X-Live-Edit-Unit and X-Live-Edit-Unit-Label) and what the change is with a
 * third (X-Live-Edit-What, "the headline"). The unit is checked against the
 * key's own shape (LockUnit) and against the unit the key's draft already
 * belongs to, so the server, not the browser, is the authority.
 */
final class TeamWrite
{
    public function __construct(
        public readonly Person $person,
        public readonly ?string $declaredUnit = null,
        public readonly ?string $unitLabel = null,
        public readonly ?string $what = null,
    ) {}

    public static function fromRequest(Request $request, ApiToken $token): self
    {
        $header = fn (string $name, int $max) => ($value = trim(rawurldecode((string) $request->headers->get($name, '')))) === ''
            ? null
            : mb_substr($value, 0, $max);

        return new self(
            Person::fromToken($token),
            $header('X-Live-Edit-Unit', 191),
            $header('X-Live-Edit-Unit-Label', 191),
            $header('X-Live-Edit-What', 120),
        );
    }

    /**
     * Claim the part of the site this key belongs to, or refuse the write.
     *
     * @return array{0: ?string, 1: ?string} the unit and its label, for the draft
     *
     * @throws LockRefused
     */
    public function claimFor(Site $site, string $kind, string $key, string $storedKey): array
    {
        $unit = LockUnit::resolve($key, $this->declaredUnit);

        if (! $this->person->isSomeone()) {
            return [$unit, $this->unitLabel];
        }

        $existing = Draft::query()
            ->where('site_id', $site->id)
            ->where('kind', $kind)
            ->where('subject', $storedKey)
            ->value('unit');

        // A key keeps the unit it was first filed under, so a browser that
        // stops declaring one cannot slip a change past a lock.
        $unit ??= $existing;

        (new SectionLocks($site))->claimForWrite($this->person, $unit, $this->unitLabel, $existing);

        return [$unit, $this->unitLabel];
    }
}
