<?php

namespace ShipFast\LiveEdit\Application\Api;

use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Meter;
use ShipFast\LiveEdit\Domain\Site\OverLimit;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Team\Person;

/**
 * Puts one site's held changes live.
 *
 * Requires a secret key rather than a session, which is the point of splitting
 * the two: a browser may write drafts all day, but deciding that the public
 * sees them is an act the customer's own server has to take.
 *
 * Scoped to the site that asked. Publishing one customer's work must never
 * release another's, and with a shared store that is exactly what a forgotten
 * scope would do.
 */
class PublishSite
{
    /**
     * Team editing: only $by's own changes go live, then their sections are
     * released (SiteStore::publish). Without a person, everything, as before.
     *
     * @return array{published: int, version: int, left: int}
     */
    public function __invoke(Site $site, ?Person $by = null): array
    {
        if (! Meter::allows($site, Meter::PUBLISH)) {
            throw new OverLimit('This site has reached its limit of publishes for this month.');
        }

        $result = (new SiteStore($site))->publish($by);

        Meter::record($site, Meter::PUBLISH);

        return $result;
    }
}
