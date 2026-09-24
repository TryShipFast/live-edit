<?php

namespace ShipFast\LiveEdit\Application\Api;

use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Support\DraftStore;
use ShipFast\LiveEdit\Support\PublishedContent;
use ShipFast\LiveEdit\Support\Snapshot;

/**
 * Puts held changes live and writes the version that records it.
 *
 * Requires a secret key rather than a session, which is the point of splitting
 * the two: a browser may write drafts all day, but deciding that the public
 * sees them is an act the customer's own server has to take.
 */
class PublishSite
{
    /**
     * @return array{published: int, version: int|null}
     */
    public function __invoke(Site $site): array
    {
        if (! DraftStore::enabled()) {
            // Nothing is held back, so publishing means recording the current
            // state as a version — which is still worth doing, since that is
            // what gives the site something to roll back to.
            $version = Snapshot::publish();

            return ['published' => 0, 'version' => $version->number];
        }

        $count = DraftStore::publish();

        return ['published' => $count, 'version' => PublishedContent::version()];
    }
}
